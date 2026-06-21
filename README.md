# diario

Monorepo: `apps/web` (Next.js) + `packages/db` (Prisma/MongoDB).

## Observabilidade (opcional)

| Variável | Onde | Uso |
|----------|------|-----|
| `SENTRY_DSN` | server | Erros inesperados no GraphQL e runtime Node |
| `NEXT_PUBLIC_SENTRY_DSN` | client | Erros não tratados no browser |

Sentry só ativa em `NODE_ENV=production` e quando o DSN está definido. Dev e CI não enviam eventos.

Logs estruturados (JSON) via `apps/web/lib/log.ts` — ids apenas, sem PII (nome/email de aluno).
