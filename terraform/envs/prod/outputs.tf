output "api_url" {
  description = "Public URL of the API"
  value       = module.api_gateway.api_url
}

output "db_endpoint" {
  description = "RDS Postgres endpoint"
  value       = module.rds.db_endpoint
}

output "db_secret_arn" {
  description = "ARN of prod DB credentials in Secrets Manager"
  value       = module.rds.db_secret_arn
}

output "dev_db_secret_arn" {
  description = "ARN of dev DB credentials in Secrets Manager (for homelab worker and dev migrations)"
  value       = aws_secretsmanager_secret.dev_db.arn
}

output "sqs_queue_url" {
  description = "SQS queue URL (needed by the homelab worker)"
  value       = module.sqs.queue_url
}

output "tailscale_instance_id" {
  description = "Tailscale subnet router EC2 instance ID"
  value       = module.tailscale.instance_id
}

output "private_route_table_id" {
  value = module.vpc.private_route_table_id
}

output "cloudfront_url" {
  description = "Public URL of the frontend"
  value       = module.frontend.cloudfront_url
}
