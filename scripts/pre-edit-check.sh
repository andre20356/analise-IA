#!/usr/bin/env bash
# pre-edit-check.sh — Verificações obrigatórias ANTES de editar qualquer arquivo
# Uso: ./scripts/pre-edit-check.sh <arquivo>

set -euo pipefail

ARQUIVO="${1:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

# ── Arquivos protegidos (nunca editar sem confirmação especial) ──
PROTEGIDOS=(
  ".env"
  ".env.local"
  ".env.production"
  "db.json"
  "package-lock.json"
)

if [ -z "$ARQUIVO" ]; then
  echo "❌ Uso: $0 <arquivo>"
  exit 1
fi

NOME_BASE=$(basename "$ARQUIVO")

# Verifica se é arquivo protegido
for PROT in "${PROTEGIDOS[@]}"; do
  if [ "$NOME_BASE" = "$PROT" ]; then
    echo "🔒 ARQUIVO PROTEGIDO: $ARQUIVO"
    echo "   Este arquivo requer confirmação explícita antes de edição."
    echo "   Crie um backup manual antes de prosseguir."
    exit 2
  fi
done

# Verifica se rm -rf está sendo tentado
if echo "$@" | grep -q "rm -rf"; then
  echo "❌ PROIBIDO: rm -rf detectado. Operação cancelada."
  exit 3
fi

# Cria backup automático
mkdir -p "$BACKUP_DIR"
if [ -f "$ARQUIVO" ]; then
  DESTINO="$BACKUP_DIR/${NOME_BASE}.bak.${TIMESTAMP}"
  cp "$ARQUIVO" "$DESTINO"
  echo "✅ Backup criado: $DESTINO"
else
  echo "ℹ️  Arquivo novo (sem backup necessário): $ARQUIVO"
fi
