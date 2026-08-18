import { describe, it, expect } from "vitest";
import { coerceToString } from "./string";

describe("coerceToString", () => {
  it("returns a string as-is", () => {
    expect(coerceToString("hello")).toBe("hello");
  });

  it("returns an empty string for null", () => {
    expect(coerceToString(null)).toBe("");
  });

  it("returns an empty string for undefined", () => {
    expect(coerceToString(undefined)).toBe("");
  });

  it("stringifies a number", () => {
    expect(coerceToString(42)).toBe("42");
  });

  it("stringifies an object", () => {
    expect(coerceToString({})).toBe("[object Object]");
  });

  it("stringifies a boolean", () => {
    expect(coerceToString(true)).toBe("true");
    expect(coerceToString(false)).toBe("false");
  });

  it("stringifies an array", () => {
    expect(coerceToString([1, 2, 3])).toBe("1,2,3");
  });

  it("stringifies the number zero", () => {
    expect(coerceToString(0)).toBe("0");
  });
});
