output "api_url" {
  description = "Public URL of the dev API"
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

output "frontend_url" {
  description = "CloudFront URL of the dev frontend"
  value       = module.frontend.cloudfront_url
}
