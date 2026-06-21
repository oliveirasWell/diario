# v4 — Assistente de importação (texto / arquivo → ações)

> Spec para próxima iteração. Branch alvo: `v4` (a partir de `v2`/`main` após merge do v3).

## Problema

Professor cola lista de alunos, planilha de notas, pauta de avaliações ou texto solto. Hoje precisa cadastrar manualmente em Alunos, Avaliações, Notas, Presença. v4: **colar ou enviar arquivo → IA estrutura → usuário revisa → confirma → app executa**.

## Objetivo

1. Input único: **textarea** + **upload** (`.txt`, `.csv`, `.xlsx` — fase 2).
2. Backend chama LLM barata para **extrair intenção + dados estruturados**.
3. UI mostra **preview editável** (tabela / cards) antes de qualquer escrita.
4. Usuário confirma → mutations GraphQL existentes (sem bypass de auth).
5. Tudo server-side; chave de API nunca no client.

## Fora de escopo (v4.0)

- Execução automática sem confirmação.
- Chat multi-turn longo.
- OCR de foto / PDF escaneado.
- Import cross-turma em lote sem contexto de `classId`.
- Substituir formulários manuais existentes.

---

## Provider LLM (custo)

| Provider | Modelo sugerido | Uso | Notas |
|----------|-----------------|-----|-------|
| **DeepSeek** | `deepseek-chat` | **Default v4** | Mais barato; JSON mode; PT-BR ok |
| Anthropic | `claude-haiku-4-5` | Fallback / qualidade | Se parsing falhar 2x ou usuário opt-in |
| — | — | Dev sem key | Mock determinístico + fixture |

**Regra:** `LLM_PROVIDER=deepseek|anthropic|mock`. Uma env var de key por provider. Rate limit por usuário (ex.: 20 req/h).

Estimativa rough (lista 30 alunos ~2k tokens): DeepSeek ≪ Haiku. Preferir DeepSeek; Haiku só fallback.

---

## Fluxo UX

```
[Turma ativa: classId no contexto]
        │
        ▼
┌─────────────────────┐
│ Colar texto         │
│ ou enviar arquivo   │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ "Interpretar"       │  → POST /api/import/parse
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Preview estruturado │  alunos / avaliações / notas / presença
│ (editável inline)   │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Confirmar ações     │  → POST /api/import/apply
└─────────┬───────────┘
          ▼
     Resultado + erros parciais inline
```

**Rota sugerida:** `/classes/[classId]/import` (tab ou item no menu da turma).

**Estados UI:** idle → parsing → preview → applying → done | error (inline, padrão `{cond && <p />}`).

---

## Ações suportadas (mapeamento GraphQL)

IA retorna **plano de ações**; executor server chama resolvers/mutations já existentes com session do usuário.

| Ação IA | Mutation existente | Campos mínimos |
|---------|-------------------|----------------|
| `CREATE_STUDENTS` | `createAndEnroll` | `name`, `email?` |
| `CREATE_EVALUATIONS` | `createEvaluation` | `title`, `maxScore?`, `weight?` |
| `UPSERT_GRADES` | `upsertGrade` | `studentName` ou `enrollmentId`, `evaluationTitle` ou `evaluationId`, `score` |
| `SET_CONCEPTS` | `setEnrollmentConcept` | `studentName`, `concept` |
| `MARK_ATTENDANCE` | `markAttendance` / `markAllPresent` | `date`, `studentName?`, `status?` |
| `UPDATE_SCHEDULE` | `updateClassSchedule` | `daysOfWeek`, `startDate`, `endDate` |

**Resolução de nomes:** executor faz fuzzy match de `studentName` / `evaluationTitle` contra dados da turma; ambiguidade → item fica `pending` no preview para usuário escolher.

**Nunca** expor mutations novas sem authz; reutilizar `requireOwnedClass(classId)`.

---

## Contrato JSON (LLM → backend)

Schema fixo (validar com Zod antes de preview):

```typescript
type ImportPlan = {
  summary: string;           // 1 frase PT-BR: "Encontrei 12 alunos e 3 avaliações"
  confidence: "high" | "medium" | "low";
  actions: ImportAction[];
  warnings: string[];
};

type ImportAction =
  | { type: "CREATE_STUDENTS"; items: { name: string; email?: string }[] }
  | { type: "CREATE_EVALUATIONS"; items: { title: string; maxScore?: number; weight?: number }[] }
  | { type: "UPSERT_GRADES"; items: { studentName: string; evaluationTitle: string; score: number }[] }
  | { type: "SET_CONCEPTS"; items: { studentName: string; concept: string | null }[] }
  | { type: "MARK_ATTENDANCE"; items: { date: string; studentName?: string; status?: "PRESENT" | "ABSENT" | "LATE"; all?: boolean }[] }
  | { type: "UPDATE_SCHEDULE"; daysOfWeek?: number[]; startDate?: string; endDate?: string };
```

Resposta LLM: **somente JSON** (sem markdown). Retry com repair prompt se parse falhar.

---

## System prompt (base)

```
Você é assistente do Diário Escolar (app de turmas, alunos, notas, presença).

Contexto:
- classId: {{classId}}
- Turma: {{className}} ({{year}})
- Alunos atuais: {{studentNamesJson}}
- Avaliações atuais: {{evaluationTitlesJson}}

Entrada: texto ou conteúdo de arquivo colado pelo professor (PT-BR).

Tarefa:
1. Identifique intenção: cadastrar alunos, criar avaliações, lançar notas, marcar presença, ajustar cronograma.
2. Extraia dados estruturados.
3. Retorne APENAS JSON válido no schema ImportPlan (sem markdown, sem explicação fora do campo summary).

Regras:
- Nomes próprios: preserve acentos e capitalização.
- Datas: ISO 8601 (YYYY-MM-DD) quando possível; se ambíguo, coloque em warnings.
- Notas: número 0–maxScore (default 10).
- Não invente alunos/avaliações que não aparecem no texto, salvo inferência óbvia (ex.: cabeçalho "Prova 1" → CREATE_EVALUATIONS).
- Se texto insuficiente: actions: [], warnings explicando o que falta.
- Múltiplas ações na mesma entrada são permitidas.
```

Variáveis de contexto vêm do DB (enrollments + evaluations da turma) — **não** enviar email de alunos para log/Sentry.

---

## Arquitetura técnica

```
apps/web/
  app/classes/[classId]/import/page.tsx    # UI
  app/api/import/parse/route.ts            # texto/arquivo → ImportPlan
  app/api/import/apply/route.ts            # ImportPlan confirmado → mutations
  lib/import/
    llm/
      client.ts          # DeepSeek / Anthropic / mock
      parse-plan.ts      # prompt + Zod validate + retry
    execute-plan.ts      # roda ações com prisma/graphql interno
    match-names.ts       # fuzzy student/evaluation
    extract-file.ts      # csv/xlsx → texto normalizado (fase 2)
    schemas.ts           # Zod ImportPlan
```

**Parse:** recebe `{ classId, text }` ou `{ classId, file }`. Max size file: 1 MB. Max text: 32k chars.

**Apply:** recebe `{ classId, plan }` (plan já editado pelo usuário no client). Idempotência soft: `CREATE_STUDENTS` ignora duplicata por email ou nome exato (configurável).

Chamar lógica de domínio **direto** (funções compartilhadas com resolvers) — não HTTP loop para `/api/graphql`.

---

## Segurança

- Auth: mesma session NextAuth; `classId` deve ser owned pelo usuário.
- API keys: `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY` — só server env.
- Não logar texto bruto do usuário em produção; log hash + action counts.
- Preview obrigatório — `apply` rejeita plan vazio ou sem flag `confirmed: true`.
- Rate limit + timeout LLM (30s).
- Sanitizar filename upload; rejeitar executáveis.

---

## Fases de entrega

### v4.0 — MVP texto
- [ ] Página `/classes/[classId]/import`
- [ ] Textarea + botão Interpretar
- [ ] `POST /api/import/parse` (DeepSeek + mock)
- [ ] Preview tabelado por tipo de ação
- [ ] Ações: `CREATE_STUDENTS`, `CREATE_EVALUATIONS` apenas
- [ ] `POST /api/import/apply` com resultado parcial (sucesso/falha por item)
- [ ] Testes: Zod schema, execute-plan unit, 1 teste e2e mock

### v4.1 — Notas e conceitos
- [ ] `UPSERT_GRADES`, `SET_CONCEPTS`
- [ ] Match fuzzy de nomes + UI resolver ambiguidade

### v4.2 — Presença + arquivo
- [ ] `MARK_ATTENDANCE`
- [ ] Upload `.csv` / `.xlsx` (primeira aba → texto)
- [ ] Fallback Haiku se confidence low

### v4.3 — Polish
- [ ] Histórico últimas importações (Mongo collection `ImportJob`)
- [ ] Estimativa de custo tokens (dev only)
- [ ] Desfazer lote (soft — lista IDs criados no job)

---

## Exemplos de entrada

**Alunos**
```
Maria Silva maria@escola.com
João Santos
Ana Costa ana.costa@email.com
```

**Avaliações + notas**
```
Prova 1 (max 10)
Maria Silva: 8.5
João Santos: 7
Ana Costa: 9
```

**Lista mista**
```
Adicionar alunos: Pedro, Carla
Criar avaliação "Trabalho em grupo" nota máxima 5
Carla 4.5 no Trabalho em grupo
```

---

## Env vars (v4)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `LLM_PROVIDER` | não (default `mock`) | `deepseek` \| `anthropic` \| `mock` |
| `DEEPSEEK_API_KEY` | se deepseek | API DeepSeek |
| `ANTHROPIC_API_KEY` | se anthropic | API Anthropic |
| `IMPORT_MAX_TEXT_CHARS` | não | default `32000` |
| `IMPORT_RATE_LIMIT_PER_HOUR` | não | default `20` |

---

## Critérios de aceite (v4.0)

1. Professor cola lista de 10+ alunos → preview mostra nomes corretos → confirmar → alunos aparecem em `/classes/[classId]/students`.
2. Colar 3 títulos de prova → preview → confirmar → aparecem em Avaliações.
3. Sem API key (`mock`) → fluxo funciona em dev/CI com fixture.
4. Turma de outro usuário → 401/404 em parse e apply.
5. JSON inválido do LLM → erro inline amigável, sem crash.
6. Nenhuma mutation executada antes do clique em Confirmar.

---

## Prompt para agente (próxima sessão)

```
Implementar v4.0 conforme docs/v4/spec.md:

1. Criar lib/import (schemas Zod, llm mock + DeepSeek client, parse-plan, execute-plan para CREATE_STUDENTS e CREATE_EVALUATIONS).
2. Rotas POST /api/import/parse e /api/import/apply com auth + requireOwnedClass.
3. Página /classes/[classId]/import com textarea, preview editável, confirmar.
4. PT-BR na UI, erros inline com &&, sem Sonner.
5. Testes unitários em schemas + execute-plan (mock LLM).
6. README: env vars v4.

Não implementar upload de arquivo, notas, presença — ficam v4.1+.
Seguir convenções do monorepo (GraphQL auth, query-options, ConfirmDeleteDialog pattern).
```

---

## Referências no codebase atual

- Mutations: `apps/web/schema.graphql`
- Auth turma: `apps/web/lib/graphql/auth.ts` (`requireOwnedClass`)
- Padrão mutation client: `apps/web/hooks/use-app-mutation.ts`
- Erros inline: `apps/web/lib/graphql-error.ts`
- Notas matriz: `gradesByClass` → `ClassGrades` com `rows[].student`
- Monorepo alvo: [`docs/v4/monorepo.md`](./monorepo.md)
- Refactor backlog: [`docs/refactor-spec.md`](../refactor-spec.md)
