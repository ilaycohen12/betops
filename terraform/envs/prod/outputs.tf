output "api_url" {
  description = "Public URL of the Hello World API"
  value       = aws_apigatewayv2_stage.default.invoke_url
}
