terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5.0"
}

provider "aws" {
  region = var.aws_region
}

# ── Security Group ────────────────────────────────────────
resource "aws_security_group" "resume_ai_sg" {
  name        = "resume-ai-sg"
  description = "Resume AI Builder - SSH, HTTP, HTTPS, Backend"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend API"
    from_port   = 8001
    to_port     = 8001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "resume-ai-sg"
    Project = "ResumeAI Hub"
  }
}

# ── Key Pair ──────────────────────────────────────────────
resource "aws_key_pair" "resume_ai_key" {
  key_name   = "resume-ai-key"
  public_key = var.public_key

  tags = {
    Name    = "resume-ai-key"
    Project = "ResumeAI Hub"
  }
}

# ── EC2 Instance ──────────────────────────────────────────
resource "aws_instance" "resume_ai_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.resume_ai_key.key_name
  vpc_security_group_ids = [aws_security_group.resume_ai_sg.id]

  iam_instance_profile = aws_iam_instance_profile.resume_ai_profile.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    yum install -y docker amazon-cloudwatch-agent nginx
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ec2-user
  EOF

  tags = {
    Name    = "resume-ai-ec2"
    Project = "ResumeAI Hub"
  }
}

# ── IAM Role for CloudWatch ───────────────────────────────
resource "aws_iam_role" "resume_ai_role" {
  name = "resume-ai-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = {
    Project = "ResumeAI Hub"
  }
}

resource "aws_iam_role_policy_attachment" "cloudwatch_policy" {
  role       = aws_iam_role.resume_ai_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "resume_ai_profile" {
  name = "resume-ai-instance-profile"
  role = aws_iam_role.resume_ai_role.name
}

# ── CloudWatch Log Group ──────────────────────────────────
resource "aws_cloudwatch_log_group" "resume_ai_logs" {
  name              = "/resumeai/backend"
  retention_in_days = 14

  tags = {
    Project = "ResumeAI Hub"
  }
}

# ── CloudWatch Alarms ─────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "resume-ai-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization exceeds 80% for 10 minutes"

  dimensions = {
    InstanceId = aws_instance.resume_ai_ec2.id
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alerts[0].arn] : []

  tags = {
    Project = "ResumeAI Hub"
  }
}

resource "aws_cloudwatch_metric_alarm" "status_check_failed" {
  alarm_name          = "resume-ai-status-check-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "EC2 instance status check failed"

  dimensions = {
    InstanceId = aws_instance.resume_ai_ec2.id
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alerts[0].arn] : []

  tags = {
    Project = "ResumeAI Hub"
  }
}

# ── SNS Topic for Alerts (optional) ──────────────────────
resource "aws_sns_topic" "alerts" {
  count = var.alarm_email != "" ? 1 : 0
  name  = "resume-ai-alerts"

  tags = {
    Project = "ResumeAI Hub"
  }
}

resource "aws_sns_topic_subscription" "email_alert" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}
