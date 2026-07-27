import { describe, expect, it } from "vitest";
import { isUserError, maskGraphQLError, userError } from "./errors";

describe("userError", () => {
  it("marks the error as user facing", () => {
    expect(isUserError(userError("Nome é obrigatório"))).toBe(true);
  });

  it("does not mark plain errors as user facing", () => {
    expect(isUserError(new Error("insert_many failed"))).toBe(false);
  });
});

describe("maskGraphQLError", () => {
  it("keeps user facing messages", () => {
    expect(maskGraphQLError(userError("Nome é obrigatório")).message).toBe("Nome é obrigatório");
  });

  it("hides everything else behind a generic message", () => {
    const masked = maskGraphQLError(new Error("No documents provided to insert_many"));

    expect(masked.message).toBe("Algo deu errado. Tente novamente.");
  });
});
