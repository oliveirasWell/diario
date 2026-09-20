import { describe, expect, it } from "vitest";
import { normalizeText } from "./normalize-text";

describe("normalizeText", () => {
  it("lowercases the input", () => {
    expect(normalizeText("BIBLIOTECA")).toBe("biblioteca");
  });

  it("strips accents", () => {
    expect(normalizeText("Educação")).toBe("educacao");
    expect(normalizeText("Matemática")).toBe("matematica");
    expect(normalizeText("Ginásio")).toBe("ginasio");
  });

  it("treats accented and unaccented spellings as equal", () => {
    expect(normalizeText("Coordenação")).toBe(normalizeText("coordenacao"));
  });

  it("leaves already-normalized text unchanged", () => {
    expect(normalizeText("sala 07")).toBe("sala 07");
  });

  it("coerces non-string input", () => {
    expect(normalizeText(7 as unknown as string)).toBe("7");
  });
});
