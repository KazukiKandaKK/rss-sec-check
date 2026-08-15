import { describe, it, expect } from "vitest";
import { Feed, createFeed, createFeedDraft, isEnabled, toggleEnabled } from "./feed";

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
