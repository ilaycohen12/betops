variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix"
  type        = string
  default     = "betops"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  type    = string
  default = "10.0.2.0/24"
}

variable "private_subnet_b_cidr" {
  type    = string
  default = "10.0.3.0/24"
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

variable "jwt_secret" {
  description = "Secret key for signing JWT tokens — set via TF_VAR_jwt_secret or GitHub secret"
  type        = string
  sensitive   = true
}
