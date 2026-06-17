#!/usr/bin/env bash
# safe-backup.sh — Cria backup seguro de arquivo antes de qualquer edição
# Uso: ./scripts/safe-backup.sh <caminho-do-arquivo>
# Exemplo: ./scripts/safe-backup.sh server.ts

set -euo pipefail

ARQUIVO="${1:-}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -z "$ARQUIVO" ]; then
  echo "❌ Uso: $0 <arquivo>"
  exit 1
fi

if [ ! -f "$ARQUIVO" ]; then
  echo "❌ Arquivo não encontrado: $ARQUIVO"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

NOME_BASE=$(basename "$ARQUIVO")
DESTINO="$BACKUP_DIR/${NOME_BASE}.bak.${TIMESTAMP}"

cp "$ARQUIVO" "$DESTINO"
echo "✅ Backup criado: $DESTINO"
echo "   Original: $ARQUIVO"
echo "   Tamanho:  $(wc -c < "$ARQUIVO") bytes"
