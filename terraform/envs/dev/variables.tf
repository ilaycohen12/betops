variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix"
  type        = string
  default     = "betops-dev"
}

variable "vpc_cidr" {
  type    = string
  default = "10.1.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.1.1.0/24"
}

variable "private_subnet_cidr" {
  type    = string
  default = "10.1.2.0/24"
}

variable "private_subnet_b_cidr" {
  type    = string
  default = "10.1.3.0/24"
}

variable "backup_retention" {
  description = "RDS backup retention in days"
  type        = number
  default     = 0
}

variable "tailscale_auth_key" {
  description = "Tailscale auth key — set via TF_VAR_tailscale_auth_key or GitHub secret"
  type        = string
  sensitive   = true
}
