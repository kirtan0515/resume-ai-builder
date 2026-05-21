#!/bin/bash
# Run this on EC2 to set up CloudWatch agent
# Usage: bash setup-cloudwatch.sh
set -e

echo "==> Installing CloudWatch agent..."
sudo yum install -y amazon-cloudwatch-agent

echo "==> Writing agent config..."
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null <<'EOF'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/resumeai/backend",
            "log_stream_name": "{instance_id}/system",
            "retention_in_days": 14
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "ResumeAI",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["disk_used_percent"],
        "metrics_collection_interval": 300,
        "resources": ["/"]
      }
    }
  }
}
EOF

echo "==> Starting CloudWatch agent..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

echo "==> Enabling on boot..."
sudo systemctl enable amazon-cloudwatch-agent

echo "==> Done! CloudWatch agent is running."
echo "==> View logs at: AWS Console → CloudWatch → Log Groups → /resumeai/backend"
echo "==> View metrics at: AWS Console → CloudWatch → Metrics → ResumeAI"
