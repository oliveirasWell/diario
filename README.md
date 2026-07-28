# diario

Painel para professores gerenciarem turmas, alunos, presença, avaliações, notas e convites de turma.

É um monorepo pnpm/Turbo com:

- `apps/web`: Next.js App Router, interface e API GraphQL.
- `packages/db`: cliente Prisma e schema MongoDB, publicado internamente como `@diario/db`.

## Requisitos

- Node.js compatível com as dependências do projeto.
- pnpm `10.33.3` (a versão declarada em `package.json`).
- MongoDB acessível.
- Credenciais OAuth do Google para efetuar login.

## Configuração local

Instale as dependências e crie o arquivo de ambiente raiz:

```bash
pnpm install
cp .env.example .env.local
```

Preencha ao menos `MONGODB_URI`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` em `.env.local`. O arquivo raiz é a fonte de verdade; sincronize-o para a aplicação e o Prisma com:

```bash
pnpm env:sync
```

Para preparar o banco e os tipos GraphQL em uma instalação nova, execute:

```bash
pnpm setup:all
```

O comando aprova os binários do Prisma, gera o cliente, aplica o schema ao MongoDB e atualiza os tipos GraphQL. Para alterações no schema Prisma, use `pnpm db:generate` e depois `pnpm db:push`.

## Desenvolvimento

```bash
pnpm dev:web
```

Abra [http://localhost:3000](http://localhost:3000). `pnpm dev` inicia todas as aplicações do workspace; `pnpm dev:local` instala dependências, prepara o Prisma quando possível e inicia a aplicação web, recusando por padrão uma base chamada `diario` para reduzir o risco de uso acidental da base de produção.

## Qualidade e geração de código

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm codegen:check
pnpm build
```

Os testes unitários e de integração usam Vitest. Os testes de ponta a ponta usam Playwright e iniciam a aplicação em `:3000`. Após alterar `apps/web/schema.graphql` ou operações em `apps/web/lib/gql-documents.ts`, execute `pnpm codegen:web`; os arquivos em `apps/web/src/gql/` são gerados e não devem ser editados manualmente.

## Observabilidade (opcional)

| Variável | Onde | Uso |
| --- | --- | --- |
| `SENTRY_DSN` | servidor | Erros inesperados no GraphQL e runtime Node |
| `NEXT_PUBLIC_SENTRY_DSN` | cliente | Erros não tratados no navegador |

O Sentry só é ativado em `NODE_ENV=production` quando o DSN correspondente está definido. Desenvolvimento e CI não enviam eventos.

Logs estruturados (JSON) ficam em `apps/web/lib/log.ts`; eles usam somente identificadores, sem PII como nome ou e-mail de aluno.
