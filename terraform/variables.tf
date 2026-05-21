variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "Amazon Linux 2 AMI ID"
  type        = string
  default     = "ami-0c02fb55956c7d316"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "public_key" {
  description = "SSH public key for EC2 access"
  type        = string
}

variable "alarm_email" {
  description = "Email for CloudWatch alarm notifications (leave empty to skip)"
  type        = string
  default     = ""
}
