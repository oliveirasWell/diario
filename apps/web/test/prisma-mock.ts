import { beforeEach, vi, type Mock } from "vitest";

type ModelMock = Record<string, Mock>;
type PrismaMock = Record<string, ModelMock> & { $transaction: Mock };

const spies: Mock[] = [];

function createSpy() {
  const spy = vi.fn();
  spies.push(spy);
  return spy;
}

function lazyMembers<T extends object>(createMember: (name: string) => unknown) {
  const members = new Map<string, unknown>();
  return new Proxy({} as T, {
    get(_target, property) {
      if (typeof property !== "string") {
        return undefined;
      }
      if (!members.has(property)) {
        members.set(property, createMember(property));
      }
      return members.get(property);
    },
  });
}

export const prismaMock = lazyMembers<PrismaMock>((name) =>
  name.startsWith("$") ? createSpy() : lazyMembers<ModelMock>(() => createSpy()),
);

vi.mock("@/lib/graphql/prisma", () => ({ getPrisma: async () => prismaMock }));

beforeEach(() => {
  for (const spy of spies) {
    spy.mockReset();
  }
  prismaMock.$transaction.mockImplementation(async (run: (transaction: PrismaMock) => unknown) =>
    run(prismaMock),
  );
});
