import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  Article,
  createArticle,
  isUnread,
  isStarred,
  markAsRead,
  markAsUnread,
  toggleRead,
  toggleStar,
} from "./article";

function makeArticle(overrides: Partial<Article> = {}): Article {
  return createArticle({
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
  });
}

describe("createArticle", () => {
  it("creates an article with valid typed fields", () => {
    const article = makeArticle({
      id: "article-1",
      title: "Hello",
      link: "https://example.com/hello",
      source: "Example",
      feedUrl: "https://example.com/feed",
      snippet: "Summary",
      publishedAt: new Date("2024-03-01T00:00:00Z"),
      fetchedAt: new Date("2024-03-02T00:00:00Z"),
      read: true,
      starred: true,
      ownerEmail: "owner@example.com",
    });

    expect(article.id).toBe("article-1");
    expect(article.title).toBe("Hello");
    expect(article.link).toBe("https://example.com/hello");
    expect(article.source).toBe("Example");
    expect(article.publishedAt.toISOString()).toBe("2024-03-01T00:00:00.000Z");
    expect(article.fetchedAt.toISOString()).toBe("2024-03-02T00:00:00.000Z");
    expect(article.read).toBe(true);
    expect(article.starred).toBe(true);
  });

  it("coerces non-string fields to strings", () => {
    const article = createArticle({
      id: 123,
      title: 456,
      source: null,
      snippet: undefined,
    } as never);

    expect(article.id).toBe("123");
    expect(article.title).toBe("456");
    expect(article.source).toBe("");
    expect(article.snippet).toBe("");
  });

  it("falls back to now for missing or invalid publishedAt", () => {
    const article = createArticle({
      publishedAt: "not a date",
      fetchedAt: undefined,
    } as never);

    expect(article.publishedAt).toBeInstanceOf(Date);
    expect(Number.isNaN(article.publishedAt.getTime())).toBe(false);
    expect(article.fetchedAt).toBeInstanceOf(Date);
    expect(Number.isNaN(article.fetchedAt.getTime())).toBe(false);
  });

  it("accepts Firestore Timestamp objects", () => {
    const published = new Date("2024-05-01T00:00:00Z");
    const fetched = new Date("2024-05-02T00:00:00Z");
    const article = createArticle({
      publishedAt: Timestamp.fromDate(published),
      fetchedAt: Timestamp.fromDate(fetched),
    } as never);

    expect(article.publishedAt.toISOString()).toBe(published.toISOString());
    expect(article.fetchedAt.toISOString()).toBe(fetched.toISOString());
  });

  it("normalizes missing read and starred flags", () => {
    const article = createArticle({ read: undefined, starred: undefined } as never);
    expect(article.read).toBe(false);
    expect(article.starred).toBe(false);
  });
});

describe("article behavior", () => {
  it("toggleRead inverts the read flag without mutating the original", () => {
    const article = makeArticle({ id: "1", read: false });
    const next = toggleRead(article);

    expect(article.read).toBe(false);
    expect(next.read).toBe(true);
    expect(next.id).toBe("1");
  });

  it("toggleStar inverts the starred flag without mutating the original", () => {
    const article = makeArticle({ id: "1", starred: false });
    const next = toggleStar(article);

    expect(article.starred).toBe(false);
    expect(next.starred).toBe(true);
  });

  it("markAsRead and markAsUnread set the read flag explicitly", () => {
    const article = makeArticle({ read: false });

    expect(markAsRead(article).read).toBe(true);
    expect(markAsUnread(makeArticle({ read: true })).read).toBe(false);
  });

  it("isUnread and isStarred reflect the article state", () => {
    const unread = makeArticle({ read: false });
    const starred = makeArticle({ starred: true });

    expect(isUnread(unread)).toBe(true);
    expect(isStarred(starred)).toBe(true);
  });
});
