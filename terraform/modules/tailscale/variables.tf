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

variable "vpc_cidr" {
  description = "VPC CIDR to advertise to Tailscale (e.g. 10.0.0.0/16)"
  type        = string
}

variable "tailscale_auth_key" {
  description = "Tailscale auth key (reusable, ephemeral). Store in Secrets Manager or GitHub secrets."
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
