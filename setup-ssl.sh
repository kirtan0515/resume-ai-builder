#!/bin/bash
# Run this INSIDE the EC2 instance after SSH-ing in
# Usage: bash setup-ssl.sh
set -e

DOMAIN="api.resumeaihub.com"
EMAIL="admin@resumeaihub.com"

echo "==> Setting up HTTPS for $DOMAIN"

# 1. Install nginx and certbot
echo "==> Installing nginx and certbot..."
sudo yum install -y nginx
sudo amazon-linux-extras install epel -y 2>/dev/null || true
sudo yum install -y certbot python3-certbot-nginx

# 2. Write nginx HTTP config (needed before certbot runs)
echo "==> Writing nginx config..."
sudo tee /etc/nginx/conf.d/resume-ai.conf > /dev/null <<'NGINX'
server {
    listen 80;
    server_name api.resumeaihub.com;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

# 3. Start nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 4. Get SSL cert — certbot will auto-update nginx config for HTTPS
echo "==> Getting SSL certificate from Let's Encrypt..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

# 5. Enable auto-renewal
echo "==> Enabling auto-renewal..."
sudo systemctl enable certbot-renew.timer 2>/dev/null || \
  (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo ""
echo "==> DONE!"
echo "==> Backend is live at: https://$DOMAIN"
echo ""
echo "==> Next step: go to Vercel dashboard → Settings → Environment Variables"
echo "==> Add: NEXT_PUBLIC_API_URL = https://api.resumeaihub.com"
echo "==> Then redeploy your Vercel frontend."
