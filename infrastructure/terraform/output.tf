output "ec2_instance_id" {
  description = "Our existing EC2 instance ID"
  value       = aws_instance.spring_boot.id
}

output "ec2_public_ip" {
  description = "Our existing EC2 public IP"
  value       = aws_instance.spring_boot.public_ip
}