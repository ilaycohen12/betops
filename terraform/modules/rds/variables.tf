variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "betops"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "betops_admin"
}

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "rds_sg_id" {
  description = "Security group ID for RDS"
  type        = string
}

variable "backup_retention" {
  description = "Number of days to retain automated backups (0 = disabled)"
  type        = number
  default     = 0
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
