#!/bin/bash
set -e

DOMAIN="api.resumeaihub.com"
EMAIL="admin@resumeaihub.com"

echo "==> Cleaning up broken nginx configs..."
sudo find /etc/nginx -name "*.conf" | xargs sudo grep -l "letsencrypt" 2>/dev/null | xargs sudo rm -f 2>/dev/null || true
sudo rm -f /etc/nginx/conf.d/resume-ai.conf

echo "==> Writing clean HTTP nginx config..."
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

echo "==> Testing and starting nginx..."
sudo nginx -t
sudo systemctl start nginx

echo "==> Getting SSL certificate (standalone mode)..."
sudo systemctl stop nginx
sudo certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
sudo systemctl start nginx

echo "==> Writing HTTPS nginx config..."
sudo rm -f /etc/nginx/conf.d/resume-ai.conf
sudo tee /etc/nginx/conf.d/resume-ai.conf > /dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

echo "==> Restarting nginx with HTTPS..."
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "==> DONE! Backend live at: https://$DOMAIN"
echo "==> Go to Vercel dashboard → Settings → Environment Variables"
echo "==> Set: NEXT_PUBLIC_API_URL = https://api.resumeaihub.com"
echo "==> Then redeploy."
