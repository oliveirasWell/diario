# v2.5 — Editar nome de turma e de aluno (implementado)

> Registro histórico da especificação implementada no commit `d499e95`. Não use este documento como plano de trabalho atual; consulte o código e a documentação raiz para o estado vigente.

## Problema

Antes desta versão, só era possível **criar** e **remover** turmas e alunos. A v2.5 introduziu a edição de nome em modal, seguindo o padrão de `ConfirmDeleteDialog`.

## Objetivo

1. **Botão Editar** na coluna Ações — **mesmo padrão visual do Remover** (`Button variant="ghost" size="icon"`), lado a lado.
2. Botão **não** abre inline edit na linha — só **dispara modal** (`EditNameDialog`), igual delete dispara `ConfirmDeleteDialog`.
3. Modal genérico com input de nome + Salvar/Cancelar.
4. Duas mutations GraphQL novas, auth igual ao resto (`requireOwnedClass` / enrollment owned).
5. Erros inline no modal (`{errorMessage && <p />}`), PT-BR, sem Sonner.

## Padrão do botão (obrigatório)

Espelhar o botão Remover existente — trocar só ícone, `title` e `onClick`:

```tsx
<div className="text-right flex justify-end gap-1">
  <Button
    type="button"
    variant="ghost"
    size="icon"
    title="Editar turma"
    onClick={() => setEditTarget({ id: c.id, name: c.name })}
  >
    ✏️
  </Button>
  <Button
    type="button"
    variant="ghost"
    size="icon"
    title="Remover turma"
    onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
  >
    🗑️
  </Button>
</div>
```

Alunos: idem com `title="Editar aluno"` / `"Remover aluno desta turma"`. **Editar à esquerda**, Remover à direita (ou ordem consistente nos dois panels).

## Fora de escopo na v2.5

- Editar ano da turma, email do aluno, cronograma.
- Editar nome pelo header/breadcrumb.
- Renomear avaliação (implementado posteriormente, fora desta versão).
- Undo / histórico de alterações.
- Editar aluno compartilhado entre turmas (hoje `createAndEnroll` cria `Student` novo por matrícula).

---

## UX

### Turmas — `classes-panel.tsx`

| Elemento | Comportamento |
|----------|---------------|
| Coluna Ações | `flex gap-1`: ✏️ Editar + 🗑️ Remover — **mesmo `Button ghost icon`** |
| Clique Editar | `setEditTarget(...)` → abre `EditNameDialog` |
| Título modal | `Editar turma` |
| Input | Nome atual pré-preenchido |
| Salvar | `renameClass` → fecha modal → lista atualiza |
| Cancelar | Fecha modal, `clearError` |

### Alunos — `students-panel.tsx`

| Elemento | Comportamento |
|----------|---------------|
| Coluna Ações | ✏️ + 🗑️ — **mesmo componente/padrão do Remover** |
| Clique Editar | `setEditTarget({ id: e.id, name: e.student.name })` → modal |
| Título modal | `Editar aluno` |
| Salvar | `renameStudent` via `enrollmentId` |

**Validação client:** `z.string().min(1, "Nome é obrigatório")` — mesmo zod do create.

**Loading:** botão Salvar disabled + label `Salvando…` durante mutation.

---

## Componente UI genérico

Criar `components/edit-name-dialog.tsx` — espelha `ConfirmDeleteDialog`:

```typescript
type EditNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  initialName: string;
  label?: string;              // default "Nome"
  onSave: (name: string) => void | Promise<void>;
  isPending?: boolean;
  errorMessage?: string | null;
  confirmLabel?: string;       // default "Salvar"
  cancelLabel?: string;        // default "Cancelar"
};
```

- `DialogContent showCloseButton={false}` — igual delete.
- Input controlado; reset para `initialName` quando `open` vira true.
- Enter no input → submit (opcional, nice-to-have).
- Footer: Cancelar (ghost) + Salvar (default, **não** destructive).

**Não** generalizar além de nome nesta versão — evitar `EditFormDialog` abstrato demais.

---

## GraphQL

### Schema (`schema.graphql`)

```graphql
type Mutation {
  # ...existentes
  renameClass(id: ID!, name: String!): Class!
  renameStudent(enrollmentId: ID!, name: String!): Enrollment!
}
```

### Resolvers

**`renameClass`** — `lib/graphql/resolvers/class.ts`

- `requireOwnerIds` + `requireOwnedClass(id)`
- `prisma.class.update({ where: { id }, data: { name: trimmed } })`
- Rejeitar nome vazio (trim → throw `Error("Nome é obrigatório")`)

**`renameStudent`** — `lib/graphql/resolvers/enrollment.ts` (ou `student.ts` se preferir split)

- `requireOwnerIds`
- `enrollment.findFirst({ id: enrollmentId, class: { ownerId: { in: ownerIds } } })`
- Se não achar → `Not found`
- `prisma.student.update({ where: { id: enrollment.studentId }, data: { name: trimmed } })`
- Retornar enrollment com `include: { student: true }` (shape igual `createAndEnroll`)

### Documents (`lib/gql-documents.ts`)

```graphql
mutation RenameClass($id: ID!, $name: String!) {
  renameClass(id: $id, name: $name) {
    id
    name
    year
  }
}

mutation RenameStudent($enrollmentId: ID!, $name: String!) {
  renameStudent(enrollmentId: $enrollmentId, name: $name) {
    id
    student { id name email }
  }
}
```

Codegen → `pnpm codegen`.

---

## Client hooks

### `hooks/use-classes.ts`

```typescript
export function useRenameClassMutation() {
  // gqlRequest(RenameClassDocument, { id, name })
  // onSuccess: invalidate queryKeys.classes()
}
```

### `hooks/use-students.ts`

```typescript
export function useRenameStudentMutation(classId: string) {
  // onSuccess: invalidate
  //   queryKeys.enrollments(classId)
  //   queryKeys.grades(classId)      — rows[].student.name
  //   queryKeys.attendanceRecords(classId) — se cache tiver nomes (hoje não; só enrollmentId)
}
```

Invalidação mínima v2.5: `enrollments` + `classes` + `class(classId)` se header cache existir.

**Header:** `header-title.tsx` faz fetch avulso com `HdrClassDocument` — após rename turma, invalidar manualmente ou refetch: adicionar invalidação `queryKeys.class(id)` e migrar header para `useQuery(classQueryOptions)` **opcional v2.5.1**; MVP: invalidar + `window` refetch no header via key `["class", classId]` se header migrar depois.

**Recomendação MVP:** invalidar `queryKeys.class(classId)` e trocar `HeaderTitle` para `useQuery(classQueryOptions(classId))` no mesmo PR — evita nome stale no breadcrumb.

---

## Estado local nos panels

Mesmo padrão do delete:

```typescript
type EditTarget = { id: string; name: string };
const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
```

- Turma: `{ id: classId, name: c.name }`
- Aluno: `{ id: enrollmentId, name: e.student.name }`

---

## Arquivos implementados

| Arquivo | Ação |
|---------|------|
| `schema.graphql` | +2 mutations |
| `lib/graphql/resolvers/class.ts` | `renameClass` |
| `lib/graphql/resolvers/enrollment.ts` | `renameStudent` |
| `lib/gql-documents.ts` | +2 documents |
| `src/gql/*` | codegen |
| `components/edit-name-dialog.tsx` | **novo** |
| `components/classes-panel.tsx` | botão + modal |
| `components/students-panel.tsx` | botão + modal |
| `hooks/use-classes.ts` | `useRenameClassMutation` |
| `hooks/use-students.ts` | `useRenameStudentMutation` |
| `components/header-title.tsx` | (recomendado) usar `classQueryOptions` |

---

## Critérios de aceite

1. Turmas: editar nome → lista `/classes` mostra novo nome sem refresh manual.
2. Alunos: editar nome → tabela alunos + página notas (`gradesByClass.rows[].student.name`) refletem após save.
3. Nome vazio → erro inline no modal, sem request.
4. Turma/aluno de outro usuário → mutation falha, erro inline.
5. Modal cancelar → não persiste, limpa erro da mutation.
6. `pnpm typecheck`, `lint`, `build` verdes.

---

## Testes (mínimo)

- Unit resolver: `renameClass` unauthorized → throw; trim nome.
- Unit resolver: `renameStudent` enrollment alheio → Not found.
- Opcional: component test `EditNameDialog` submit chama `onSave`.

---

---

## Referências

- Delete modal: `components/confirm-delete-dialog.tsx`
- Create turma modal: `components/classes-panel.tsx` (Dialog + react-hook-form)
- Auth: `lib/graphql/auth.ts`
- Query keys: `lib/query-options.ts`
