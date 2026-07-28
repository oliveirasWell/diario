# v2.5 — Rename classes and students (implemented)

> Historical record of the specification implemented in commit `d499e95`. Do not use this document as an active work plan; consult the code and root documentation for the current state.

## Problem

Before this version, classes and students could only be **created** and **removed**. v2.5 introduced name editing in a modal, following the `ConfirmDeleteDialog` pattern.

## Goals

1. An **Edit button** in the Actions column — using the same visual pattern as Remove (`Button variant="ghost" size="icon"`), placed side by side.
2. The button does **not** open inline editing on the row; it only **opens a modal** (`EditNameDialog`), just as delete opens `ConfirmDeleteDialog`.
3. A generic modal with a name input and Save/Cancel actions.
4. Two new GraphQL mutations, with the existing authorization model (`requireOwnedClass` / owned enrollment).
5. Inline modal errors (`{errorMessage && <p />}`), in Brazilian Portuguese, without Sonner.

## Required button pattern

Mirror the existing Remove button; change only its icon, `title`, and `onClick`:

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

Students follow the same pattern, using `title="Editar aluno"` / `"Remover aluno desta turma"`. **Edit goes on the left** and Remove on the right, or use a consistent order in both panels.

## Out of scope in v2.5

- Editing a class year, student email, or schedule.
- Editing a name through the header or breadcrumb.
- Renaming evaluations (implemented later, outside this version).
- Undo or change history.
- Editing a student shared between classes (`createAndEnroll` currently creates a new `Student` for each enrollment).

---

## UX

### Classes — `classes-panel.tsx`

| Element | Behavior |
| --- | --- |
| Actions column | `flex gap-1`: ✏️ Edit + 🗑️ Remove — the same `Button` ghost/icon pattern |
| Edit click | `setEditTarget(...)` → opens `EditNameDialog` |
| Modal title | `Editar turma` |
| Input | Current name pre-filled |
| Save | `renameClass` → modal closes → list refreshes |
| Cancel | Closes the modal and calls `clearError` |

### Students — `students-panel.tsx`

| Element | Behavior |
| --- | --- |
| Actions column | ✏️ + 🗑️ — same component and pattern as Remove |
| Edit click | `setEditTarget({ id: e.id, name: e.student.name })` → modal |
| Modal title | `Editar aluno` |
| Input | Current name pre-filled |
| Save | `renameStudent` through `enrollmentId` |

**Client validation:** `z.string().min(1, "Nome é obrigatório")` — the same Zod validation used for creation.

**Loading:** the Save button is disabled and shows `Salvando…` during the mutation.

---

## Generic UI component

Create `components/edit-name-dialog.tsx`, mirroring `ConfirmDeleteDialog`:

```typescript
type EditNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  initialName: string;
  label?: string; // default: "Nome"
  onSave: (name: string) => void | Promise<void>;
  isPending?: boolean;
  errorMessage?: string | null;
  confirmLabel?: string; // default: "Salvar"
  cancelLabel?: string; // default: "Cancelar"
};
```

- `DialogContent showCloseButton={false}` — just like delete.
- The input is controlled and resets to `initialName` when `open` becomes true.
- Pressing Enter in the input submits the form (optional, nice to have).
- Footer: Cancel (ghost) + Save (default, **not** destructive).

Do **not** generalize beyond name editing in this version; avoid an over-abstracted `EditFormDialog`.

---

## GraphQL

### Schema (`schema.graphql`)

```graphql
type Mutation {
  # ...existing fields
  renameClass(id: ID!, name: String!): Class!
  renameStudent(enrollmentId: ID!, name: String!): Enrollment!
}
```

### Resolvers

**`renameClass`** — `lib/graphql/resolvers/class.ts`

- `requireOwnerIds` + `requireOwnedClass(id)`
- `prisma.class.update({ where: { id }, data: { name: trimmed } })`
- Reject an empty name (trim → throw `Error("Nome é obrigatório")`)

**`renameStudent`** — `lib/graphql/resolvers/enrollment.ts` (or `student.ts` if splitting is preferred)

- `requireOwnerIds`
- `enrollment.findFirst({ id: enrollmentId, class: { ownerId: { in: ownerIds } } })`
- If it is not found → `Not found`
- `prisma.student.update({ where: { id: enrollment.studentId }, data: { name: trimmed } })`
- Return the enrollment with `include: { student: true }` (the same shape as `createAndEnroll`)

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

Run code generation with `pnpm codegen`.

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
  //   queryKeys.attendanceRecords(classId) — if the cache contains names (it currently only contains enrollmentId)
}
```

The minimum v2.5 invalidation is `enrollments` + `classes` + `class(classId)` when a header cache exists.

**Header:** `header-title.tsx` performs a standalone fetch with `HdrClassDocument`. After renaming a class, invalidate manually or refetch: add `queryKeys.class(id)` invalidation and migrate the header to `useQuery(classQueryOptions)` in **optional v2.5.1**. The MVP can invalidate and refetch the header through the `['class', classId]` key if the header is migrated later.

**MVP recommendation:** invalidate `queryKeys.class(classId)` and move `HeaderTitle` to `useQuery(classQueryOptions(classId))` in the same PR to avoid a stale breadcrumb name.

---

## Local panel state

Use the same pattern as delete:

```typescript
type EditTarget = { id: string; name: string };
const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
```

- Class: `{ id: classId, name: c.name }`
- Student: `{ id: enrollmentId, name: e.student.name }`

---

## Implemented files

| File | Change |
| --- | --- |
| `schema.graphql` | Two new mutations |
| `lib/graphql/resolvers/class.ts` | `renameClass` |
| `lib/graphql/resolvers/enrollment.ts` | `renameStudent` |
| `lib/gql-documents.ts` | Two new documents |
| `src/gql/*` | Code generation |
| `components/edit-name-dialog.tsx` | New component |
| `components/classes-panel.tsx` | Edit button and modal |
| `components/students-panel.tsx` | Edit button and modal |
| `hooks/use-classes.ts` | `useRenameClassMutation` |
| `hooks/use-students.ts` | `useRenameStudentMutation` |
| `components/header-title.tsx` | Recommended: use `classQueryOptions` |

---

## Acceptance criteria

1. Classes: after editing a name, the `/classes` list shows the new name without a manual refresh.
2. Students: after editing a name, the students table and grades page (`gradesByClass.rows[].student.name`) update after saving.
3. An empty name shows an inline modal error without a request.
4. A class or student owned by another user causes the mutation to fail with an inline error.
5. Cancelling the modal does not persist changes and clears the mutation error.
6. `pnpm typecheck`, `lint`, and `build` pass.

---

## Minimum tests

- Resolver unit test: `renameClass` rejects unauthorized access and trims the name.
- Resolver unit test: `renameStudent` returns Not found for another user's enrollment.
- Optional: `EditNameDialog` component test verifies that submit calls `onSave`.

---

## References

- Delete modal: `components/confirm-delete-dialog.tsx`
- Class creation modal: `components/classes-panel.tsx` (Dialog + react-hook-form)
- Authorization: `lib/graphql/auth.ts`
- Query keys: `lib/query-options.ts`
