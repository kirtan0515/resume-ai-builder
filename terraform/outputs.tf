output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.resume_ai_ec2.id
}

output "public_ip" {
  description = "EC2 public IP address"
  value       = aws_instance.resume_ai_ec2.public_ip
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.resume_ai_sg.id
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.resume_ai_logs.name
}
