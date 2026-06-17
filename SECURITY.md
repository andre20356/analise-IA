# Regras de Segurança do Projeto

## PROIBIÇÕES ABSOLUTAS

| Comando | Status |
|---------|--------|
| `rm -rf` | ❌ PROIBIDO |
| `git push --force` | ❌ PROIBIDO |
| Apagar `db.json` | ❌ PROIBIDO |
| Apagar arquivos `.env*` | ❌ PROIBIDO |
| Apagar migrations | ❌ PROIBIDO |
| Alterar chaves da exchange diretamente | ❌ PROIBIDO |
| Deploy sem build aprovado | ❌ PROIBIDO |
| Deploy sem testes aprovados | ❌ PROIBIDO |

## OBRIGAÇÕES ANTES DE QUALQUER EDIÇÃO

1. Criar backup: `./scripts/safe-backup.sh <arquivo>`
2. Verificar pré-condições: `./scripts/pre-edit-check.sh <arquivo>`
3. Após edição, verificar TypeScript: `npx tsc --noEmit`

## PROCESSO DE DEPLOY SEGURO

```bash
./scripts/safe-deploy.sh pm2
# ou
./scripts/safe-deploy.sh docker
```

O script executa automaticamente:
1. Backup do db.json
2. Verificação TypeScript
3. Build completo
4. Reinício do serviço

## ARQUIVOS PROTEGIDOS

- `db.json` — contém chaves API criptografadas (nunca commitar, nunca apagar)
- `.env` / `.env.*` — credenciais de ambiente
- `backups/` — histórico de backups (ignorado pelo git)
- `package-lock.json` — nunca apagar, apenas atualizar via npm

## DADOS PROIBIDOS NO CÓDIGO

- Valores hardcoded de saldo (ex: `12540.85`)
- Saldo fake / simulado exibido como real
- Relatórios com dados inventados
- Modelos de IA inexistentes (ex: `gemini-3.5-flash`)
- URLs sem validação (risco de SSRF)

## INTEGRAÇÃO COM EXCHANGE

- Toda leitura de saldo deve vir exclusivamente da API real da Bybit
- Em caso de falha da API: retornar `null` + registrar log
- Nunca inventar ou simular valores financeiros
