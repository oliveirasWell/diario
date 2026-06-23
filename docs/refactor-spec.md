# Refactor backlog (não-segurança)

> Itens de qualidade, integridade de dados, arquitetura e DX. **Segurança/authz** fica fora — tratar em PR/issue dedicado.

Prioridade: P0 (antes de escala) → P2 (quando doer).

---

## P0 — Integridade de dados

### R-01 · Cascade no `unenrollStudent`

**Onde:** `apps/web/lib/graphql/resolvers/enrollment.ts:40-48`

**Problema:** delete só `Enrollment`. Prisma/Mongo sem cascade → `Grade` e `AttendanceRecord` órfãos. Modal em `students-panel.tsx` promete remover presenças/notas.

**Fix:** `$transaction`: `deleteMany` grades + attendance records do enrollment, depois delete enrollment. Ou cascade no schema se Prisma suportar relação onDelete.

---

### R-02 · Transação em `deleteEvaluation`

**Onde:** `apps/web/lib/graphql/resolvers/evaluation.ts:43-44`

**Problema:** `deleteMany` grades e delete evaluation sequenciais — falha no meio deixa avaliação sem notas ou vice-versa inconsistente.

**Fix:** wrap em `prisma.$transaction`.

---

## P1 — Correção / confiabilidade

### R-03 · JWT callback silencioso

**Onde:** `apps/web/app/api/auth/[...nextauth]/route.ts:45-47`

**Problema:** falha no upsert Prisma → login OK sem `prismaUserId` → mutations falham opaco.

**Fix:** `log.error` + Sentry; considerar falhar login se DB indisponível (prod).

---

### R-04 · Duplicata de aluno em `createAndEnroll`

**Onde:** `apps/web/lib/graphql/resolvers/enrollment.ts:31-37`

**Problema:** sempre `student.create` — mesmo email/nome gera duplicata.

**Fix:** upsert/find by email antes de create; ou reutilizar student existente na turma.

---

### R-05 · Testes de resolvers

**Onde:** repo inteiro — zero `*.test.ts`

**Problema:** regressões em authz de domínio e regras de presença/notas passam CI.

**Fix:** Vitest + mocks Prisma; priorizar: `gradesByClass`, `unenrollStudent`, `markAllPresent`, `upsertGrade`.

---

## P1 — Performance (turmas grandes)

### R-06 · N+1 em `markAllPresent`

**Onde:** `apps/web/lib/graphql/resolvers/attendance.ts:114-142`

**Problema:** loop enrollment × findFirst + update/create.

**Fix:** batch `findMany` records da sessão; `createMany` / updates agrupados.

---

### R-06b · Limite explícito para bulk de presença

**Onde:** `apps/web/lib/graphql/resolvers/attendance.ts` — mutations bulk com `dates[]`.

**Problema:** `dates[]` grande prende uma transação longa; o limite precisa respeitar regra de negócio, não só esconder datas no client.

**Fix:** definir janela máxima por turma/período no domínio e validar no resolver antes da transação.

---

### R-07 · Ordenação estável em `gradesByClass`

**Onde:** `apps/web/lib/graphql/resolvers/grade.ts:20-23`

**Problema:** rows seguem ordem do DB; página reordena no client.

**Fix:** `orderBy: { student: { name: 'asc' } }` no enrollment query — UI e export consistentes sem sort duplicado.

---

## P2 — Arquitetura / monorepo

Ver [`docs/v4/monorepo.md`](./v4/monorepo.md).

### R-08 · Extrair `@diario/api`

**Gatilho:** `apps/mobile` ou segundo client.

**Conteúdo:** gql documents, codegen output, `gqlRequest`, query keys.

---

### R-09 · Extrair `@diario/domain`

**Gatilho:** v4 import assistant + mobile.

**Conteúdo:** `attendance-date`, export XLSX puro, parsers CSV, fuzzy match nomes.

---

### R-10 · Domínio compartilhado resolvers ↔ import v4

**Problema:** v4 `execute-plan` duplicaria lógica dos resolvers.

**Fix:** funções em `lib/domain/` (ou package) chamadas por resolvers e por `/api/import/apply`.

---

## P2 — UX / DX

### R-11 · Optimistic update em notas

**Onde:** `hooks/use-grades.ts` — só `invalidateQueries` no upsert.

**Fix:** patch local em `rows[].grades` no cache (padrão já usado em `use-attendance.ts`).

---

### R-12 · Erros GraphQL tipados

**Onde:** resolvers `throw new Error("Not found")` genérico.

**Fix:** códigos de erro GraphQL (`FORBIDDEN`, `NOT_FOUND`) + mensagens PT-BR no client.

---

### R-13 · Document mutation `Ex` → nome legível

**Onde:** `lib/gql-documents.ts` — `ExcludeAttendanceDate`.

**Fix:** rename document/codegen (cosmético, melhora grep).

---

## Feito recentemente (não reabrir)

- [x] `gradesByClass` → `ClassGrades` com `rows[].student` (v4 branch)
- [x] `ConfirmDeleteDialog` genérico
- [x] TS strict + CI typecheck
- [x] Codegen split `schema.ts` / `graphql.ts`

---

## Ordem sugerida próxima sessão

1. **v2.5** — editar nome turma/aluno ([`docs/v2.5/spec.md`](./v2.5/spec.md))
2. R-01 + R-02 (integridade, baixo esforço)  
3. R-05 testes mínimos em R-01/R-02  
4. v4.0 import conforme `docs/v4/spec.md`  
5. R-08/R-09 quando mobile  
