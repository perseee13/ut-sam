#!/bin/bash
# Pang-Ubuntu Server start: build (kung wala pa) + start sa 0.0.0.0:4000.
# Pag nag-start, ipapakita kung anong http://IP:4000 ang itype ng ibang device.
set -e
cd "$(dirname "$0")/.."
if [ ! -d "client/dist" ]; then
  echo "Walang client/dist — bini-build..."
  npm --prefix client install
  npm --prefix client run build
fi
echo "IP ng server na ito (alin dito ang itype + :4000):"
hostname -I || true
PORT="${PORT:-4000}" HOST="${HOST:-0.0.0.0}" npm --prefix server start
