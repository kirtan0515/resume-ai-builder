#!/bin/bash
set -e

EC2_IP="98.81.139.18"
KEY="$HOME/.ssh/resume-ai-key.pem"
USER="ec2-user"

echo "==> Preparing clean backend bundle..."
rm -rf /tmp/resume-ai-backend
mkdir -p /tmp/resume-ai-backend
cp -R ./backend/app /tmp/resume-ai-backend/
cp ./backend/requirements.txt /tmp/resume-ai-backend/
cp ./backend/Dockerfile /tmp/resume-ai-backend/
cp ./backend/.env /tmp/resume-ai-backend/

echo "==> Copying clean backend to EC2..."
scp -i "$KEY" -r -o StrictHostKeyChecking=no /tmp/resume-ai-backend ${USER}@${EC2_IP}:~/backend

echo "==> Installing Docker and deploying backend..."
ssh -i "$KEY" -o StrictHostKeyChecking=no ${USER}@${EC2_IP} << 'EOF'
  sudo yum install -y docker
  sudo service docker start
  sudo usermod -aG docker ec2-user
  cd ~/backend
  sudo docker build -t resume-ai-backend .
  sudo docker stop resume-ai-backend 2>/dev/null || true
  sudo docker rm resume-ai-backend 2>/dev/null || true
  sudo docker run -d \
    --name resume-ai-backend \
    --restart always \
    -p 8001:8001 \
    --env-file .env \
    resume-ai-backend
  echo "==> Backend running!"
  sudo docker ps
EOF

echo ""
echo "==> DONE. Backend live at: http://$EC2_IP:8001"
