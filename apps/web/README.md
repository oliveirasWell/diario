# Aplicação web do diario

Esta é a aplicação Next.js do monorepo. Ela contém a interface, rotas App Router, autenticação NextAuth e a API GraphQL.

Use os comandos a partir da raiz do repositório, onde estão a configuração do workspace e os arquivos de ambiente:

```bash
pnpm env:sync
pnpm dev:web
```

Abra [http://localhost:3000](http://localhost:3000). Consulte o [README da raiz](../../README.md) para requisitos, configuração do MongoDB e OAuth, geração do Prisma/GraphQL e comandos de testes.

`src/gql/` contém código gerado. Após alterar o schema ou os documentos GraphQL, execute `pnpm codegen:web` na raiz em vez de editar esses arquivos manualmente.
