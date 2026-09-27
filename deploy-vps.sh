#!/usr/bin/env bash
# Deploy HOSTBOTS em VPS Hostinger/Contabo (Ubuntu 22.04) — execute como root
set -euo pipefail
apt update && apt install -y docker.io docker-compose-plugin git certbot
git clone https://github.com/SEU-USUARIO/hostbots.git /opt/hostbots || (cd /opt/hostbots && git pull)
cd /opt/hostbots
cp -n .env.example .env || true
echo ">>> Edite /opt/hostbots/.env com suas chaves (nano .env)"
docker compose build
docker compose up -d
sleep 5
docker compose ps
echo "✅ HOSTBOTS no ar em http://IP-DA-VPS:3000"
echo "🔒 SSL: certbot certonly --standalone -d hostbots.com.br -d *.hostbots.com.br"
echo "📊 Orchestrator: docker compose logs -f orchestrator"
