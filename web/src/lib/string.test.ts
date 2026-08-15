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
});
