import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { Article, ArticleFilter } from "../types";
import { toArticle, toArticles, filterArticles } from "./article";

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

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "id",
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
  };
}

describe("toArticle", () => {
  it("maps a Firestore document to an Article", () => {
    const doc = makeDoc("doc-1");
    const article = toArticle(doc);

    expect(article.id).toBe("doc-1");
    expect(article.title).toBe("Title");
    expect(article.link).toBe("https://example.com/article");
    expect(article.source).toBe("Source");
    expect(article.feedUrl).toBe("https://example.com/feed");
    expect(article.snippet).toBe("Snippet");
    expect(article.publishedAt).toStrictEqual(doc.data().publishedAt);
    expect(article.fetchedAt).toStrictEqual(doc.data().fetchedAt);
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
    expect(article.publishedAt).toBeInstanceOf(Timestamp);
  });
});

describe("toArticles", () => {
  it("maps multiple documents", () => {
    const docs = [makeDoc("a"), makeDoc("b")];
    const articles = toArticles(docs);
    expect(articles).toHaveLength(2);
    expect(articles[0].id).toBe("a");
    expect(articles[1].id).toBe("b");
  });
});

describe("filterArticles", () => {
  const articles: Article[] = [
    makeArticle({ id: "1", title: "Alpha", source: "A", read: false, starred: true }),
    makeArticle({ id: "2", title: "Beta", source: "B", read: true, starred: false }),
    makeArticle({ id: "3", title: "Gamma", source: "A", read: false, starred: false }),
  ];

  it("returns all articles when filters are default", () => {
    const result = filterArticles(articles, "all" as ArticleFilter, "all", "");
    expect(result).toHaveLength(3);
  });

  it("filters by unread", () => {
    const result = filterArticles(articles, "unread" as ArticleFilter, "all", "");
    expect(result.map((a) => a.id)).toEqual(["1", "3"]);
  });

  it("filters by starred", () => {
    const result = filterArticles(articles, "starred" as ArticleFilter, "all", "");
    expect(result.map((a) => a.id)).toEqual(["1"]);
  });

  it("filters by source", () => {
    const result = filterArticles(articles, "all" as ArticleFilter, "A", "");
    expect(result.map((a) => a.id)).toEqual(["1", "3"]);
  });

  it("filters by search term (case-insensitive)", () => {
    const result = filterArticles(articles, "all" as ArticleFilter, "all", "alp");
    expect(result.map((a) => a.id)).toEqual(["1"]);
  });

  it("matches search term in snippet", () => {
    const result = filterArticles(articles, "all" as ArticleFilter, "all", "snippet");
    expect(result).toHaveLength(3);
  });

  it("combines filter, source and search", () => {
    const result = filterArticles(articles, "unread" as ArticleFilter, "A", "gamma");
    expect(result.map((a) => a.id)).toEqual(["3"]);
  });

  it("returns an empty array when nothing matches", () => {
    const result = filterArticles(articles, "starred" as ArticleFilter, "B", "");
    expect(result).toEqual([]);
  });

  it("ignores whitespace-only search", () => {
    const result = filterArticles(articles, "all" as ArticleFilter, "all", "   ");
    expect(result).toHaveLength(3);
  });
});
