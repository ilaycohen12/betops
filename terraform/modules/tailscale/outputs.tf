output "instance_id" {
  value = aws_instance.tailscale.id
}

output "private_ip" {
  value = aws_instance.tailscale.private_ip
}

output "primary_network_interface_id" {
  value = aws_instance.tailscale.primary_network_interface_id
}
