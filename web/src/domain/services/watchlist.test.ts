import { describe, it, expect } from "vitest";
import { matchWatchKeywords, normalizeKeywords } from "./watchlist";

describe("matchWatchKeywords", () => {
  it("matches case-insensitively against title and snippet", () => {
    expect(
      matchWatchKeywords("Critical AWS Cognito flaw", "MFA bypass reported", [
        "aws",
        "mfa",
        "kubernetes",
      ])
    ).toEqual(["aws", "mfa"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(matchWatchKeywords("Title", "Snippet", ["terraform"])).toEqual([]);
  });

  it("returns an empty array for an empty keyword list", () => {
    expect(matchWatchKeywords("Title", "Snippet", [])).toEqual([]);
  });

  it("ignores blank keywords", () => {
    expect(matchWatchKeywords("Title", "Snippet", ["", "  "])).toEqual([]);
  });

  it("trims keywords before matching", () => {
    expect(matchWatchKeywords("OpenSSL patch", "", [" openssl "])).toEqual([
      " openssl ",
    ]);
  });
});

describe("normalizeKeywords", () => {
  it("trims and drops empty entries", () => {
    expect(normalizeKeywords([" aws ", "", "  ", "cve"])).toEqual([
      "aws",
      "cve",
    ]);
  });

  it("dedupes case-insensitively keeping the first spelling", () => {
    expect(normalizeKeywords(["AWS", "aws", "Aws"])).toEqual(["AWS"]);
  });

  it("caps the list at 50 keywords", () => {
    const raw = Array.from({ length: 60 }, (_, i) => `kw${i}`);
    expect(normalizeKeywords(raw)).toHaveLength(50);
  });

  it("truncates overly long keywords to 100 chars", () => {
    const result = normalizeKeywords(["a".repeat(150)]);
    expect(result[0]).toHaveLength(100);
  });
});
