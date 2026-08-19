import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { toArticle, toArticles } from "./articleMapper";

function makeDoc(
  id: string,
  overrides: Record<string, unknown> = {}
): { id: string; data: () => Record<string, unknown> } {
  return {
    id,
    data: () => ({
      title: "Title",
      link: "https://example.com/article",
      source: "Source",
      feedUrl: "https://example.com/feed",
      snippet: "Snippet",
      publishedAt: Timestamp.fromDate(new Date("2024-01-01T00:00:00Z")),
      fetchedAt: Timestamp.fromDate(new Date("2024-01-02T00:00:00Z")),
      read: false,
      starred: false,
      ownerEmail: "owner@example.com",
      ...overrides,
    }),
  };
}

describe("toArticle", () => {
  it("maps a Firestore document to an Article with Date fields", () => {
    const doc = makeDoc("doc-1");
    const article = toArticle(doc);

    expect(article.id).toBe("doc-1");
    expect(article.title).toBe("Title");
    expect(article.link).toBe("https://example.com/article");
    expect(article.source).toBe("Source");
    expect(article.feedUrl).toBe("https://example.com/feed");
    expect(article.snippet).toBe("Snippet");
    expect(article.publishedAt).toBeInstanceOf(Date);
    expect(article.fetchedAt).toBeInstanceOf(Date);
    expect(article.publishedAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    expect(article.fetchedAt.toISOString()).toBe("2024-01-02T00:00:00.000Z");
    expect(article.read).toBe(false);
    expect(article.starred).toBe(false);
    expect(article.ownerEmail).toBe("owner@example.com");
  });

  it("normalizes missing read and starred flags", () => {
    const doc = makeDoc("doc-2", { read: undefined, starred: undefined });
    const article = toArticle(doc);

    expect(article.read).toBe(false);
    expect(article.starred).toBe(false);
  });

  it("coerces non-string fields to strings", () => {
    const doc = makeDoc("doc-3", {
      title: 123,
      source: null,
      snippet: undefined,
    });
    const article = toArticle(doc);

    expect(article.title).toBe("123");
    expect(article.source).toBe("");
    expect(article.snippet).toBe("");
  });

  it("falls back to now when publishedAt is missing", () => {
    const doc = makeDoc("doc-4", { publishedAt: undefined });
    const article = toArticle(doc);
    expect(article.publishedAt).toBeInstanceOf(Date);
    expect(Number.isNaN(article.publishedAt.getTime())).toBe(false);
  });
});

describe("toArticles", () => {
  it("maps multiple documents", () => {
    const docs = [makeDoc("a"), makeDoc("b")];
    const articles = toArticles(docs);
    expect(articles).toHaveLength(2);
    expect(articles[0]?.id).toBe("a");
    expect(articles[1]?.id).toBe("b");
  });
});
