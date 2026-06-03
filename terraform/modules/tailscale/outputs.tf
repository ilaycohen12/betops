output "instance_id" {
  description = "EC2 instance ID of the Tailscale subnet router"
  value       = aws_instance.tailscale.id
}

output "private_ip" {
  description = "Private IP of the Tailscale subnet router"
  value       = aws_instance.tailscale.private_ip
}
