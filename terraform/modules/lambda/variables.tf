variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "handler_path" {
  description = "Absolute path to the Lambda handler .py file"
  type        = string
}

variable "db_secret_arn" {
  description = "ARN of the Secrets Manager secret for DB credentials"
  type        = string
}

variable "sqs_queue_arn" {
  description = "ARN of the SQS queue"
  type        = string
}

variable "sqs_queue_url" {
  description = "URL of the SQS queue (passed to Lambda as env var)"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs to place the Lambda in (required to reach RDS)"
  type        = list(string)
}

variable "lambda_sg_id" {
  description = "Security group ID for the Lambda function"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
