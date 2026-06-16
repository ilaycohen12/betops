variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID to deploy the subnet router into"
  type        = string
}

variable "public_subnet_id" {
  description = "Public subnet ID for the Tailscale EC2 instance"
  type        = string
}

variable "advertise_routes" {
  description = "Comma-separated CIDRs to advertise (use private subnets only to avoid homelab conflicts)"
  type        = string
}

variable "tailscale_auth_key" {
  description = "Tailscale auth key (reusable, ephemeral). Store in Secrets Manager or GitHub secrets."
  type        = string
  sensitive   = true
}

variable "rds_sg_id" {
  description = "RDS security group ID — Tailscale EC2 will be granted port 5432 access"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
