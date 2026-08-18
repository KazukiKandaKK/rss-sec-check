import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import {
  isPublicUrl,
  isValidHttpUrl,
  resolveArticleLink,
  toSnippet,
  toPublishedAt,
  articleIdForLink,
  articleContentChanged,
  FeedItem,
} from "./fetchFeeds";

describe("isValidHttpUrl", () => {
  it("returns true for http and https URLs", () => {
    expect(isValidHttpUrl("http://example.com")).toBe(true);
    expect(isValidHttpUrl("https://example.com/path")).toBe(true);
  });

  it("returns false for non-HTTP schemes", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("returns false for malformed URLs", () => {
    expect(isValidHttpUrl("not a url")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
  });
});

describe("isPublicUrl", () => {
  it("returns true for public URLs", () => {
    expect(isPublicUrl("https://example.com")).toBe(true);
    expect(isPublicUrl("https://feeds.example.com/rss")).toBe(true);
  });

  it("returns false for localhost", () => {
    expect(isPublicUrl("http://localhost:8080")).toBe(false);
    expect(isPublicUrl("http://127.0.0.1")).toBe(false);
  });

  it("returns false for metadata service hosts", () => {
    expect(isPublicUrl("http://metadata.google.internal")).toBe(false);
    expect(isPublicUrl("http://metadata")).toBe(false);
  });

  it("returns false for private IP ranges", () => {
    expect(isPublicUrl("http://10.0.0.1")).toBe(false);
    expect(isPublicUrl("http://172.16.0.1")).toBe(false);
    expect(isPublicUrl("http://192.168.1.1")).toBe(false);
    expect(isPublicUrl("http://169.254.169.254")).toBe(false);
  });

  it("returns false for IPv6 loopback and link-local", () => {
    expect(isPublicUrl("http://[::1]")).toBe(false);
    expect(isPublicUrl("http://[fe80::1]")).toBe(false);
  });

  it("returns false for non-HTTP schemes", () => {
    expect(isPublicUrl("ftp://example.com")).toBe(false);
  });

  it("returns false for malformed URLs", () => {
    expect(isPublicUrl("")).toBe(false);
    expect(isPublicUrl("not a url")).toBe(false);
  });
});

describe("resolveArticleLink", () => {
  it("resolves an absolute public link", () => {
    expect(resolveArticleLink("https://example.com/article", "https://example.com/feed")).toBe(
      "https://example.com/article"
    );
  });

  it("resolves a relative link against the feed URL", () => {
    expect(resolveArticleLink("/article", "https://example.com/feed")).toBe(
      "https://example.com/article"
    );
  });

  it("returns null for private resolved links", () => {
    expect(resolveArticleLink("http://127.0.0.1/secret", "https://example.com/feed")).toBeNull();
  });

  it("returns null for non-HTTP schemes", () => {
    expect(resolveArticleLink("ftp://example.com/file", "https://example.com/feed")).toBeNull();
  });

  it("returns null for malformed links", () => {
    expect(resolveArticleLink("https://bad host", "https://example.com/feed")).toBeNull();
  });
});

describe("toSnippet", () => {
  it("strips HTML tags and normalizes whitespace", () => {
    const item = { contentSnippet: "<p>Hello  World</p>" };
    expect(toSnippet(item as never)).toBe("Hello World");
  });

  it("uses summary when contentSnippet is missing", () => {
    const item = { summary: "Summary text" };
    expect(toSnippet(item as never)).toBe("Summary text");
  });

  it("falls back to an empty string", () => {
    expect(toSnippet({} as never)).toBe("");
  });

  it("truncates long snippets with an ellipsis", () => {
    const longText = "a".repeat(300);
    const item = { contentSnippet: longText };
    const result = toSnippet(item as never);
    expect(result).toHaveLength(201);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("toPublishedAt", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("parses isoDate", () => {
    const item = { isoDate: "2024-06-14T12:00:00Z" };
    expect(toPublishedAt(item as never).toISOString()).toBe("2024-06-14T12:00:00.000Z");
  });

  it("falls back to pubDate", () => {
    const item = { pubDate: "Fri, 14 Jun 2024 12:00:00 GMT" };
    expect(toPublishedAt(item as never).toISOString()).toBe("2024-06-14T12:00:00.000Z");
  });

  it("prefers isoDate over pubDate", () => {
    const item = {
      isoDate: "2024-06-13T12:00:00Z",
      pubDate: "Fri, 14 Jun 2024 12:00:00 GMT",
    };
    expect(toPublishedAt(item as never).toISOString()).toBe("2024-06-13T12:00:00.000Z");
  });

  it("falls back to now for invalid dates", () => {
    const item = { isoDate: "not a date", pubDate: "" };
    expect(toPublishedAt(item as never).toISOString()).toBe(now.toISOString());
  });

  it("falls back to now when no date is provided", () => {
    expect(toPublishedAt({} as never).toISOString()).toBe(now.toISOString());
  });
});

describe("articleIdForLink", () => {
  it("returns a 40-character hex string", () => {
    const id = articleIdForLink("https://example.com");
    expect(id).toHaveLength(40);
    expect(id).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic for the same link", () => {
    const link = "https://example.com/article";
    expect(articleIdForLink(link)).toBe(articleIdForLink(link));
  });

  it("produces different IDs for different links", () => {
    expect(articleIdForLink("https://a.com")).not.toBe(articleIdForLink("https://b.com"));
  });
});

describe("articleContentChanged", () => {
  const item: FeedItem = {
    title: "Title",
    link: "https://example.com/article",
    snippet: "Snippet",
    publishedAt: new Date("2024-01-02T00:00:00Z"),
  };

  function makeSnapshot(data: Record<string, unknown> | null, exists = true) {
    return {
      exists,
      data: () => data,
    } as never;
  }

  it("returns true when the document does not exist", () => {
    expect(articleContentChanged(makeSnapshot(null, false), item)).toBe(true);
  });

  it("returns true when the snapshot has no data", () => {
    expect(articleContentChanged(makeSnapshot(null, true), item)).toBe(true);
  });

  it("returns false when content matches exactly", () => {
    const snapshot = makeSnapshot({
      title: "Title",
      link: "https://example.com/article",
      snippet: "Snippet",
      publishedAt: Timestamp.fromDate(new Date("2024-01-02T00:00:00Z")),
    });
    expect(articleContentChanged(snapshot, item)).toBe(false);
  });

  it("returns true when the title changes", () => {
    const snapshot = makeSnapshot({
      title: "Old Title",
      link: item.link,
      snippet: item.snippet,
      publishedAt: Timestamp.fromDate(item.publishedAt),
    });
    expect(articleContentChanged(snapshot, item)).toBe(true);
  });

  it("returns true when the publishedAt timestamp differs", () => {
    const snapshot = makeSnapshot({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      publishedAt: Timestamp.fromDate(new Date("2024-01-01T00:00:00Z")),
    });
    expect(articleContentChanged(snapshot, item)).toBe(true);
  });
});
