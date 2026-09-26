import { describe, it, expect } from "vitest";
import {
  Feed,
  createFeed,
  createFeedDraft,
  isEnabled,
  isUnhealthy,
  toggleEnabled,
} from "./feed";

function makeFeed(overrides: Partial<Feed> = {}): Feed {
  return createFeed({
    id: "feed-1",
    url: "https://example.com/feed",
    name: "Example Feed",
    category: "news",
    enabled: true,
    ownerEmail: "owner@example.com",
    ...overrides,
  });
}

describe("createFeed", () => {
  it("creates a feed with valid typed fields", () => {
    const feed = makeFeed({
      id: "feed-1",
      url: "https://example.com/rss",
      name: "My Feed",
      category: "blog",
      enabled: false,
      ownerEmail: "owner@example.com",
    });

    expect(feed.id).toBe("feed-1");
    expect(feed.url).toBe("https://example.com/rss");
    expect(feed.name).toBe("My Feed");
    expect(feed.category).toBe("blog");
    expect(feed.enabled).toBe(false);
  });

  it("coerces non-string fields to strings", () => {
    const feed = createFeed({
      id: 123,
      url: 456,
      name: null,
      category: undefined,
    } as never);

    expect(feed.id).toBe("123");
    expect(feed.url).toBe("456");
    expect(feed.name).toBe("");
    expect(feed.category).toBe("");
  });

  it("normalizes missing enabled flag", () => {
    const feed = createFeed({ enabled: undefined } as never);
    expect(feed.enabled).toBe(false);
  });
});

describe("createFeedDraft", () => {
  it("creates a draft without id and ownerEmail", () => {
    const draft = createFeedDraft({
      url: "https://example.com/rss",
      name: "Draft Feed",
      category: "news",
    });

    expect(draft).toEqual({
      url: "https://example.com/rss",
      name: "Draft Feed",
      category: "news",
      enabled: false,
    });
  });

  it("defaults enabled to false when omitted", () => {
    const draft = createFeedDraft({ url: "https://example.com", name: "Name" });
    expect(draft.enabled).toBe(false);
  });
});

describe("feed behavior", () => {
  it("toggleEnabled inverts the enabled flag without mutating the original", () => {
    const feed = makeFeed({ enabled: true });
    const next = toggleEnabled(feed);

    expect(feed.enabled).toBe(true);
    expect(next.enabled).toBe(false);
  });

  it("isEnabled reflects the feed state", () => {
    expect(isEnabled(makeFeed({ enabled: true }))).toBe(true);
    expect(isEnabled(makeFeed({ enabled: false }))).toBe(false);
  });
});

describe("feed health", () => {
  it("defaults health fields when absent", () => {
    const feed = makeFeed();
    expect(feed.lastFetchedAt).toBeNull();
    expect(feed.lastSuccessAt).toBeNull();
    expect(feed.lastError).toBeNull();
    expect(feed.consecutiveFailures).toBe(0);
  });

  it("converts Firestore Timestamp-like values via toDate", () => {
    const date = new Date("2024-06-01T00:00:00Z");
    const feed = createFeed({
      lastFetchedAt: { toDate: () => date },
      lastSuccessAt: date,
    } as never);
    expect(feed.lastFetchedAt).toEqual(date);
    expect(feed.lastSuccessAt).toEqual(date);
  });

  it("normalizes invalid consecutiveFailures to 0", () => {
    expect(
      createFeed({ consecutiveFailures: "abc" } as never).consecutiveFailures
    ).toBe(0);
    expect(
      createFeed({ consecutiveFailures: -3 } as never).consecutiveFailures
    ).toBe(0);
    expect(
      createFeed({ consecutiveFailures: 2 } as never).consecutiveFailures
    ).toBe(2);
  });

  it("keeps lastError only for non-empty strings", () => {
    expect(createFeed({ lastError: "" } as never).lastError).toBeNull();
    expect(createFeed({ lastError: null } as never).lastError).toBeNull();
    expect(createFeed({ lastError: "boom" } as never).lastError).toBe("boom");
  });

  it("isUnhealthy is true only with consecutive failures", () => {
    expect(isUnhealthy(makeFeed())).toBe(false);
    expect(isUnhealthy(createFeed({ consecutiveFailures: 1 } as never))).toBe(
      true
    );
  });
});
