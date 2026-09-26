import { describe, it, expect } from "vitest";
import { createArticle, Article } from "../entities/article";
import {
  normalizeLinkForDedupe,
  collapseDuplicateArticles,
} from "./collapseDuplicates";

function makeArticle(id: string, link: string): Article {
  return createArticle({
    id,
    title: `Article ${id}`,
    link,
    source: "Example",
    feedUrl: "https://example.com/feed",
    snippet: "snippet",
    publishedAt: new Date("2024-06-01T00:00:00Z"),
    fetchedAt: new Date("2024-06-01T00:00:00Z"),
    read: false,
    starred: false,
    ownerEmail: "owner@example.com",
  });
}

describe("normalizeLinkForDedupe", () => {
  it("strips utm params and fragments", () => {
    expect(
      normalizeLinkForDedupe("https://example.com/a?utm_source=x#frag")
    ).toBe("https://example.com/a");
  });

  it("keeps meaningful query params", () => {
    expect(normalizeLinkForDedupe("https://example.com/a?p=1")).toBe(
      "https://example.com/a?p=1"
    );
  });

  it("lowercases for comparison", () => {
    expect(normalizeLinkForDedupe("https://Example.com/A")).toBe(
      normalizeLinkForDedupe("https://example.com/a")
    );
  });

  it("falls back to lowercased input for unparseable links", () => {
    expect(normalizeLinkForDedupe("Not A URL")).toBe("not a url");
  });
});

describe("collapseDuplicateArticles", () => {
  it("collapses articles sharing a normalized link", () => {
    const articles = [
      makeArticle("1", "https://example.com/a"),
      makeArticle("2", "https://example.com/a?utm_source=feed"),
      makeArticle("3", "https://example.com/b"),
    ];
    const collapsed = collapseDuplicateArticles(articles);
    expect(collapsed).toHaveLength(2);
    expect(collapsed[0]?.article.id).toBe("1");
    expect(collapsed[0]?.duplicateCount).toBe(1);
    expect(collapsed[1]?.article.id).toBe("3");
    expect(collapsed[1]?.duplicateCount).toBe(0);
  });

  it("keeps the first occurrence (newest given sort order)", () => {
    const articles = [
      makeArticle("newest", "https://example.com/a"),
      makeArticle("older", "https://example.com/a#section"),
    ];
    const collapsed = collapseDuplicateArticles(articles);
    expect(collapsed[0]?.article.id).toBe("newest");
  });

  it("returns an empty array for empty input", () => {
    expect(collapseDuplicateArticles([])).toEqual([]);
  });
});
