# Monorepo — estrutura alvo

> Quando fizer sentido extrair packages (mobile ou segundo client). **Não extrair antes de ter consumidor.**

## Hoje

```
apps/web/       Next.js + GraphQL server + UI + hooks + codegen
packages/db/    Prisma (@diario/db)
```

## Padrão de referência (Turborepo)

```
apps/mobile     React Native (opcional)
apps/web        Next.js
packages/ui     componentes compartilhados
packages/utils  regras de negócio puras
packages/api    client GraphQL + types
```

## Mapeamento Diário → alvo

| Pacote alvo | Conteúdo a extrair de `apps/web` | Quando |
|-------------|----------------------------------|--------|
| `packages/db` | ✅ já existe | — |
| `packages/api` | `schema.graphql`, `lib/gql-documents.ts`, `src/gql/*`, `lib/graphql-client.ts`, `lib/query-options.ts` (keys) | `apps/mobile` ou CLI |
| `packages/domain` | `lib/attendance-date.ts`, `lib/export-*.ts`, validações import v4, match fuzzy nomes | v4 import ou mobile |
| `packages/ui` | shadcn/Base UI | **só** se RN + web unificarem design system (Tamagui/Uniwind). Hoje web-specific |
| `apps/web` | routes, pages, resolvers GraphQL, auth NextAuth, Sentry | sempre |
| `apps/mobile` | Expo/RN consumindo `@diario/api` + `@diario/domain` | decisão produto |

## Ordem de extração (quando mobile existir)

1. `@diario/api` — menor risco, maior ganho cross-app  
2. `@diario/domain` — lógica sem React  
3. `apps/mobile`  
4. `@diario/ui` — último; só se design unificado valer o custo  

## Regras

- Resolvers GraphQL ficam em `apps/web` (server-only) ou futuro `apps/api` se BFF separar — **não** em `packages/api`.
- Codegen roda no package que owns `schema.graphql`; apps dependem do output.
- `transpilePackages` no Next inclui packages TS publicados via `exports`.
- CI: `turbo run build lint typecheck` por package.

## Workspace pnpm (futuro)

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Dependências típicas:

```
apps/web     → @diario/db, @diario/api, @diario/domain
apps/mobile  → @diario/api, @diario/domain
packages/api → (sem db no client bundle)
```

## Anti-patterns

- Extrair `packages/ui` com shadcn antes de existir mobile → overhead sem benefício.
- Mover resolvers Prisma para package compartilhado consumido pelo browser.
- Duplicar `schema.graphql` em dois packages.
