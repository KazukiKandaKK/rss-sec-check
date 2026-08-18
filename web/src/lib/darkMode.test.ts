import { describe, it, expect } from "vitest";
import { getInitialDarkMode, DARK_MODE_STORAGE_KEY } from "./darkMode";

describe("getInitialDarkMode", () => {
  it("returns true when stored value is 'true'", () => {
    expect(getInitialDarkMode("true", false)).toBe(true);
  });

  it("returns false when stored value is 'false'", () => {
    expect(getInitialDarkMode("false", true)).toBe(false);
  });

  it("falls back to prefersDark when no stored value", () => {
    expect(getInitialDarkMode(null, true)).toBe(true);
    expect(getInitialDarkMode(null, false)).toBe(false);
  });

  it("treats any non-'true' stored value as false", () => {
    expect(getInitialDarkMode("yes", true)).toBe(false);
    expect(getInitialDarkMode("", true)).toBe(false);
  });
});

describe("DARK_MODE_STORAGE_KEY", () => {
  it("exposes the storage key as a constant", () => {
    expect(DARK_MODE_STORAGE_KEY).toBe("darkMode");
  });
});
