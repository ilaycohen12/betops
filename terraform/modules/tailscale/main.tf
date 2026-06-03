# ─── TAILSCALE SUBNET ROUTER ───────────────────────────────────────────────
# A small EC2 instance that joins your Tailscale network and advertises
# your VPC's private CIDR. This lets your homelab worker reach RDS directly
# without a full VPN tunnel setup.

# Latest Amazon Linux 2023 AMI
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# ─── SECURITY GROUP ────────────────────────────────────────────────────────
resource "aws_security_group" "tailscale" {
  name        = "${var.project}-tailscale-sg"
  description = "Security group for Tailscale subnet router"
  vpc_id      = var.vpc_id

  # Tailscale UDP port
  ingress {
    from_port   = 41641
    to_port     = 41641
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Tailscale WireGuard UDP"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.tags, { Name = "${var.project}-tailscale-sg" })
}

# ─── IAM ROLE (for SSM access — no SSH needed) ─────────────────────────────
resource "aws_iam_role" "tailscale" {
  name = "${var.project}-tailscale"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.tailscale.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "tailscale" {
  name = "${var.project}-tailscale"
  role = aws_iam_role.tailscale.name
}

# ─── EC2 INSTANCE ──────────────────────────────────────────────────────────
resource "aws_instance" "tailscale" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = "t3.micro"
  subnet_id              = var.public_subnet_id
  vpc_security_group_ids = [aws_security_group.tailscale.id]
  iam_instance_profile   = aws_iam_instance_profile.tailscale.name

  # Required for subnet routing — allows forwarding packets not destined for this instance
  source_dest_check = false

  user_data = <<-EOF
    #!/bin/bash
    # Install Tailscale
    curl -fsSL https://tailscale.com/install.sh | sh

    # Enable IP forwarding (required for subnet router)
    echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
    sysctl -p

    # Authenticate and advertise the VPC subnet
    # Replace TAILSCALE_AUTH_KEY with your actual auth key from tailscale.com/settings/keys
    tailscale up \
      --authkey="${var.tailscale_auth_key}" \
      --advertise-routes="${var.vpc_cidr}" \
      --accept-routes
  EOF

  tags = merge(var.tags, { Name = "${var.project}-tailscale-router" })
}
