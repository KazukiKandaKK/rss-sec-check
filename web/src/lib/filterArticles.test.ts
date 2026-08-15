import { describe, it, expect } from "vitest";
import { Article, ArticleFilter } from "../domain/types";
import { filterArticles } from "./filterArticles";

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "id",
    title: "Title",
    link: "https://example.com/article",
    source: "Source",
    feedUrl: "https://example.com/feed",
    snippet: "Snippet",
    publishedAt: new Date("2024-01-01T00:00:00Z"),
    fetchedAt: new Date("2024-01-02T00:00:00Z"),
    read: false,
    starred: false,
    ownerEmail: "owner@example.com",
    ...overrides,
  };
}

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
