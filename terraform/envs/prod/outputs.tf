output "api_url" {
  description = "Public URL of the Hello World API"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "db_endpoint" {
  description = "RDS Postgres endpoint"
  value       = module.rds.db_endpoint
}

output "db_secret_arn" {
  description = "ARN of DB credentials in Secrets Manager"
  value       = module.rds.db_secret_arn
}
