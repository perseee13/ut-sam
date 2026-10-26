#!/bin/bash
# Setup script para sa Ubuntu Server (22.04 / 24.04).
# Gamitin: i-copy ang project folder sa server, tapos:
#   chmod +x setup-ubuntu.sh && ./setup-ubuntu.sh
# Pagkatapos: npm run start:prod  (o via systemd, tingnan serverpath.service)
set -e
echo "=== ServerPath Ubuntu setup ==="
if ! command -v node >/dev/null 2>&1; then
  echo "[1/4] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[1/4] Node.js nakita na: $(node --version)"
fi
echo "[2/4] Installing server deps..."
npm --prefix server install --omit=dev
echo "[3/4] Installing + building client..."
npm --prefix client install
npm --prefix client run build
echo "[4/4] Opening firewall port 4000 (ufw, kung meron)..."
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 4000/tcp || true
  sudo ufw status | head -n 20 || true
else
  echo "  (walang ufw, skip)"
fi
echo ""
echo "Tapos! Para i-start:"
echo "  npm run start:prod"
echo "Pag nag-start, may lalabas na IP — yun ang itype sa browser ng ibang device:"
echo "  http://<IP-ng-server>:4000"
echo "Para malaman IP manual: hostname -I"
