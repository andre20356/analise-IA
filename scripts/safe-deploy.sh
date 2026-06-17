#!/usr/bin/env bash
# safe-deploy.sh — Deploy seguro: só executa após build + lint aprovados
# Uso: ./scripts/safe-deploy.sh [pm2|docker]

set -euo pipefail

MODE="${1:-pm2}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="./backups/deploy_${TIMESTAMP}.log"

mkdir -p ./backups

echo "===== DEPLOY SEGURO — $TIMESTAMP =====" | tee -a "$LOG_FILE"

# ── 1. Backup do banco de dados ──────────────────────────────────
if [ -f "./db.json" ]; then
  cp ./db.json "./backups/db.json.bak.${TIMESTAMP}"
  echo "✅ Backup do db.json criado" | tee -a "$LOG_FILE"
fi

# ── 2. TypeScript — sem erros aceitos ───────────────────────────
echo "🔍 Verificando TypeScript..." | tee -a "$LOG_FILE"
if ! npx tsc --noEmit >> "$LOG_FILE" 2>&1; then
  echo "❌ ABORTADO: erros de TypeScript encontrados. Verifique $LOG_FILE" | tee -a "$LOG_FILE"
  exit 1
fi
echo "✅ TypeScript OK" | tee -a "$LOG_FILE"

# ── 3. Build ─────────────────────────────────────────────────────
echo "🔨 Executando build..." | tee -a "$LOG_FILE"
if ! npm run build >> "$LOG_FILE" 2>&1; then
  echo "❌ ABORTADO: build falhou. Verifique $LOG_FILE" | tee -a "$LOG_FILE"
  exit 1
fi
echo "✅ Build OK" | tee -a "$LOG_FILE"

# ── 4. Deploy ────────────────────────────────────────────────────
echo "🚀 Iniciando deploy ($MODE)..." | tee -a "$LOG_FILE"

if [ "$MODE" = "pm2" ]; then
  pm2 restart all >> "$LOG_FILE" 2>&1 || pm2 start dist/server.cjs --name analise-IA >> "$LOG_FILE" 2>&1
  pm2 save >> "$LOG_FILE" 2>&1
  echo "✅ PM2 reiniciado" | tee -a "$LOG_FILE"
  pm2 status | tee -a "$LOG_FILE"
elif [ "$MODE" = "docker" ]; then
  docker compose up -d --build >> "$LOG_FILE" 2>&1
  echo "✅ Docker reiniciado" | tee -a "$LOG_FILE"
else
  echo "❌ Modo inválido: $MODE (use 'pm2' ou 'docker')" | tee -a "$LOG_FILE"
  exit 1
fi

echo "===== DEPLOY CONCLUÍDO — $(date +%Y%m%d_%H%M%S) =====" | tee -a "$LOG_FILE"
echo "📋 Log completo: $LOG_FILE"
