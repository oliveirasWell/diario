import { describe, expect, it } from "vitest";
import { averageScore, scoreOutOfTen } from "./grade-average";

describe("scoreOutOfTen", () => {
  it("rescales a score to a 10 point scale", () => {
    expect(scoreOutOfTen(10, 20)).toBe(5);
  });

  it("falls back to a max score of 10 when the evaluation has none", () => {
    expect(scoreOutOfTen(8, 0)).toBe(8);
  });
});

describe("averageScore", () => {
  it("returns null without scores", () => {
    expect(averageScore([])).toBeNull();
  });

  it("rounds the average to one decimal", () => {
    expect(averageScore([8, 5])).toBe(6.5);
    expect(averageScore([10, 9, 9])).toBe(9.3);
  });
});
