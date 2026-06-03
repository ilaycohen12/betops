output "api_url" {
  description = "Public URL of the API"
  value       = module.api_gateway.api_url
}

output "db_endpoint" {
  description = "RDS Postgres endpoint"
  value       = module.rds.db_endpoint
}

output "db_secret_arn" {
  description = "ARN of DB credentials in Secrets Manager"
  value       = module.rds.db_secret_arn
}

output "sqs_queue_url" {
  description = "SQS queue URL (needed by the homelab worker)"
  value       = module.sqs.queue_url
}

output "tailscale_instance_id" {
  description = "Tailscale subnet router EC2 instance ID"
  value       = module.tailscale.instance_id
}
