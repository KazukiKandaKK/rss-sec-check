import { describe, it, expect } from "vitest";
import { SearchQuery } from "./searchQuery";

describe("SearchQuery", () => {
  it("normalizes raw input to lowercased trimmed term", () => {
    const query = SearchQuery.of("  Hello World  ");
    expect(query.term).toBe("hello world");
  });

  it("is empty when raw input is whitespace", () => {
    expect(SearchQuery.of("").isEmpty).toBe(true);
    expect(SearchQuery.of("   ").isEmpty).toBe(true);
  });

  it("matches when term is included in any text", () => {
    const query = SearchQuery.of("Security");
    expect(query.isIncludedIn("Security News", "Snippet")).toBe(true);
    expect(query.isIncludedIn("Latest snippet", "Security")).toBe(true);
  });

  it("does not match when term is missing", () => {
    const query = SearchQuery.of("Kubernetes");
    expect(query.isIncludedIn("Security News", "Snippet")).toBe(false);
  });

  it("matches empty query against any text", () => {
    const query = SearchQuery.of("");
    expect(query.isIncludedIn("Anything")).toBe(true);
  });

  it("matches case-insensitively", () => {
    const query = SearchQuery.of("CVE");
    expect(query.isIncludedIn("new cve reported")).toBe(true);
  });

  it("treats multi-byte whitespace as a delimiter", () => {
    const query = SearchQuery.of("  Hello\tWorld  ");
    expect(query.term).toBe("hello\tworld");
  });

  it("matches special characters literally", () => {
    const query = SearchQuery.of("C++");
    expect(query.isIncludedIn("Learn C++ today")).toBe(true);
    expect(query.isIncludedIn("Learn C today")).toBe(false);
  });

  it("does not match when text is empty and query is not", () => {
    const query = SearchQuery.of("term");
    expect(query.isIncludedIn("")).toBe(false);
  });
});
