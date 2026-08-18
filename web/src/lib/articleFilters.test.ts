import { describe, it, expect } from "vitest";
import { hasActiveFilter } from "./articleFilters";

describe("hasActiveFilter", () => {
  it("returns false when all filters are at their defaults", () => {
    expect(hasActiveFilter("all", "all", "")).toBe(false);
    expect(hasActiveFilter("all", "all", "   ")).toBe(false);
  });

  it("returns true when status filter is not 'all'", () => {
    expect(hasActiveFilter("unread", "all", "")).toBe(true);
    expect(hasActiveFilter("starred", "all", "")).toBe(true);
  });

  it("returns true when a source is selected", () => {
    expect(hasActiveFilter("all", "Hacker News", "")).toBe(true);
  });

  it("returns true when search is non-empty after trimming", () => {
    expect(hasActiveFilter("all", "all", "  CVE  ")).toBe(true);
  });

  it("returns true when multiple filters are active", () => {
    expect(hasActiveFilter("unread", "A", "security")).toBe(true);
  });
});
