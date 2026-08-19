import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timestamp } from "firebase-admin/firestore";

const { parseURLMock } = vi.hoisted(() => ({ parseURLMock: vi.fn() }));

vi.mock("rss-parser", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      parseURL: parseURLMock,
    })),
  };
});

import {
  isPublicUrl,
  isValidHttpUrl,
  resolveArticleLink,
  toSnippet,
  toPublishedAt,
  articleIdForLink,
  articleContentChanged,
  fetchFeedItems,
  fetchAllFeeds,
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

describe("fetchFeedItems", () => {
  beforeEach(() => {
    parseURLMock.mockReset();
  });

  it("throws for an invalid URL scheme", async () => {
    await expect(fetchFeedItems("ftp://example.com/feed")).rejects.toThrow(
      "Invalid feed URL scheme"
    );
  });

  it("throws for a private/local URL", async () => {
    await expect(fetchFeedItems("http://127.0.0.1/feed")).rejects.toThrow(
      "Private or local feed URL is not allowed"
    );
  });

  it("parses items, skipping ones without a link or title", async () => {
    parseURLMock.mockResolvedValue({
      items: [
        {
          title: "Article 1",
          link: "https://example.com/a1",
          contentSnippet: "Snippet 1",
          isoDate: "2024-06-01T00:00:00Z",
        },
        { title: "No link" },
        { link: "https://example.com/no-title" },
        {
          title: "  Trimmed  ",
          link: "  https://example.com/a2  ",
          contentSnippet: "Snippet 2",
        },
      ],
    });

    const items = await fetchFeedItems("https://example.com/feed");
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: "Article 1",
      link: "https://example.com/a1",
      snippet: "Snippet 1",
    });
    expect(items[1]).toMatchObject({
      title: "Trimmed",
      link: "https://example.com/a2",
    });
  });

  it("skips items whose resolved link is private", async () => {
    parseURLMock.mockResolvedValue({
      items: [
        {
          title: "Bad link",
          link: "http://127.0.0.1/secret",
        },
      ],
    });

    const items = await fetchFeedItems("https://example.com/feed");
    expect(items).toHaveLength(0);
  });

  it("caps items at MAX_ITEMS_PER_FEED (50)", async () => {
    parseURLMock.mockResolvedValue({
      items: Array.from({ length: 60 }, (_, i) => ({
        title: `Article ${i}`,
        link: `https://example.com/a${i}`,
      })),
    });

    const items = await fetchFeedItems("https://example.com/feed");
    expect(items).toHaveLength(50);
  });
});

describe("fetchAllFeeds", () => {
  interface FakeDoc {
    id: string;
    exists: boolean;
    data: () => Record<string, unknown> | undefined;
  }

  function makeDb(options: {
    feeds: Array<Record<string, unknown>>;
    owner?: string;
    existingArticles?: Record<string, Record<string, unknown>>;
  }) {
    const { feeds, owner, existingArticles = {} } = options;
    const setCalls: Array<{ id: string; data: unknown }> = [];

    const articleRef = (id: string) => ({
      __id: id,
      __collection: "articles",
    });

    const db = {
      collection(name: string) {
        if (name === "feeds") {
          return {
            where: () => ({
              get: async () => ({
                docs: feeds.map((f) => ({ data: () => f })),
              }),
            }),
          };
        }
        if (name === "config") {
          return {
            doc: () => ({
              get: async () => ({
                exists: owner !== undefined,
                data: () => (owner !== undefined ? { email: owner } : undefined),
              }),
            }),
          };
        }
        if (name === "articles") {
          return {
            doc: (id: string) => articleRef(id),
          };
        }
        throw new Error(`Unexpected collection: ${name}`);
      },
      getAll: async (...refs: Array<{ __id: string }>): Promise<FakeDoc[]> => {
        return refs.map((ref) => {
          const existing = existingArticles[ref.__id];
          return {
            id: ref.__id,
            exists: !!existing,
            data: () => existing,
          };
        });
      },
      batch: () => ({
        set: (ref: { __id: string }, data: unknown) => {
          setCalls.push({ id: ref.__id, data });
        },
        commit: async () => undefined,
      }),
    };

    return { db, setCalls };
  }

  beforeEach(() => {
    parseURLMock.mockReset();
  });

  it("inserts new articles for enabled feeds using their own ownerEmail", async () => {
    parseURLMock.mockResolvedValue({
      items: [
        {
          title: "New article",
          link: "https://example.com/new",
          contentSnippet: "Snippet",
          isoDate: "2024-06-01T00:00:00Z",
        },
      ],
    });

    const { db, setCalls } = makeDb({
      feeds: [
        {
          url: "https://example.com/feed",
          name: "Example",
          category: "sec",
          enabled: true,
          ownerEmail: "owner@example.com",
        },
      ],
    });

    const results = await fetchAllFeeds(db as never);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ inserted: 1, updated: 0 });
    expect(setCalls).toHaveLength(1);
  });

  it("falls back to config/owner email when a feed has no ownerEmail", async () => {
    parseURLMock.mockResolvedValue({ items: [] });

    const { db } = makeDb({
      feeds: [
        {
          url: "https://example.com/feed",
          name: "Example",
          category: "sec",
          enabled: true,
        },
      ],
      owner: "owner@example.com",
    });

    const results = await fetchAllFeeds(db as never);
    expect(results).toHaveLength(1);
    expect(results[0]?.feed.ownerEmail).toBe("owner@example.com");
    expect(results[0]?.error).toBeUndefined();
  });

  it("records an error result when no owner email can be resolved", async () => {
    const { db } = makeDb({
      feeds: [
        {
          url: "https://example.com/feed",
          name: "Example",
          category: "sec",
          enabled: true,
        },
      ],
    });

    const results = await fetchAllFeeds(db as never);
    expect(results).toHaveLength(1);
    expect(results[0]?.error).toBe("Owner email not configured");
    expect(parseURLMock).not.toHaveBeenCalled();
  });

  it("records a fetch error when the feed parser throws", async () => {
    parseURLMock.mockRejectedValue(new Error("network down"));

    const { db } = makeDb({
      feeds: [
        {
          url: "https://example.com/feed",
          name: "Example",
          category: "sec",
          enabled: true,
          ownerEmail: "owner@example.com",
        },
      ],
    });

    const results = await fetchAllFeeds(db as never);
    expect(results[0]?.error).toBe("network down");
    expect(results[0]?.inserted).toBe(0);
  });

  it("returns an empty array when there are no enabled feeds", async () => {
    const { db } = makeDb({ feeds: [] });
    const results = await fetchAllFeeds(db as never);
    expect(results).toEqual([]);
    expect(parseURLMock).not.toHaveBeenCalled();
  });

  it("updates an existing article when content changed and skips when unchanged", async () => {
    const link = "https://example.com/existing";
    const id = articleIdForLink(link);

    parseURLMock.mockResolvedValue({
      items: [
        {
          title: "Updated title",
          link,
          contentSnippet: "New snippet",
          isoDate: "2024-06-02T00:00:00Z",
        },
      ],
    });

    const { db, setCalls } = makeDb({
      feeds: [
        {
          url: "https://example.com/feed",
          name: "Example",
          category: "sec",
          enabled: true,
          ownerEmail: "owner@example.com",
        },
      ],
      existingArticles: {
        [id]: {
          title: "Old title",
          link,
          snippet: "Old snippet",
          publishedAt: Timestamp.fromDate(new Date("2024-01-01T00:00:00Z")),
        },
      },
    });

    const results = await fetchAllFeeds(db as never);
    expect(results[0]).toMatchObject({ inserted: 0, updated: 1 });
    expect(setCalls).toHaveLength(1);
  });
});
