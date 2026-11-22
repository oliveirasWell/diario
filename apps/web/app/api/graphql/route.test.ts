import { describe, expect, it, vi } from "vitest";

const INTERNAL_DETAIL = "connection to mongodb+srv://cluster.internal refused";

vi.mock("graphql-yoga", () => ({
  createYoga: vi.fn(() => ({
    handleRequest: vi.fn(() => Promise.reject(new Error(INTERNAL_DETAIL))),
  })),
}));
vi.mock("@/lib/graphql/create-schema", () => ({ createGraphQLSchema: vi.fn() }));
vi.mock("@/lib/graphql/context", () => ({ createGraphQLContext: vi.fn() }));
vi.mock("@/lib/log", () => ({ log: { error: vi.fn() } }));

describe("GraphQL route", () => {
  it("does not echo uncaught error details to the client", async () => {
    const { POST } = await import("./route");

    const response = await POST(new Request("http://test.local/api/graphql", { method: "POST" }));

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain(INTERNAL_DETAIL);
  });
});
