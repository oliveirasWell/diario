import { describe, expect, it } from "vitest";
import { isE2eAuthBypassEnabled, isE2ePublicPath } from "./e2e-bypass";

describe("isE2eAuthBypassEnabled", () => {
  it("is false in production even if the env flag is set", () => {
    expect(isE2eAuthBypassEnabled("production", "1")).toBe(false);
  });

  it("is true only when the flag is 1 outside production", () => {
    expect(isE2eAuthBypassEnabled("test", "1")).toBe(true);
    expect(isE2eAuthBypassEnabled("test", "0")).toBe(false);
  });
});

describe("isE2ePublicPath", () => {
  it("unlocks /mapa and /api/graphql only when bypass is on", () => {
    expect(isE2ePublicPath("/mapa", "test", "1")).toBe(true);
    expect(isE2ePublicPath("/api/graphql", "test", "1")).toBe(true);
    expect(isE2ePublicPath("/classes", "test", "1")).toBe(false);
  });

  it("does not unlock anything when bypass is off", () => {
    expect(isE2ePublicPath("/mapa", "test", undefined)).toBe(false);
  });
});
