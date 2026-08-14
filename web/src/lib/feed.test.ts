import { describe, it, expect } from "vitest";
import { toFeed, toFeeds } from "./feed";

function makeDoc(
  id: string,
  overrides: Record<string, unknown> = {}
): { id: string; data: () => Record<string, unknown> } {
  return {
    id,
    data: () => ({
      url: "https://example.com/feed",
      name: "Example Feed",
      category: "News",
      enabled: true,
      ...overrides,
    }),
  };
}

describe("toFeed", () => {
  it("maps a Firestore document to a Feed", () => {
    const doc = makeDoc("feed-1");
    const feed = toFeed(doc);

    expect(feed.id).toBe("feed-1");
    expect(feed.url).toBe("https://example.com/feed");
    expect(feed.name).toBe("Example Feed");
    expect(feed.category).toBe("News");
    expect(feed.enabled).toBe(true);
  });

  it("normalizes missing enabled flag", () => {
    const feed = toFeed(makeDoc("feed-2", { enabled: undefined }));
    expect(feed.enabled).toBe(false);
  });

  it("coerces non-string fields to strings", () => {
    const feed = toFeed(makeDoc("feed-3", { name: 42, category: null }));
    expect(feed.name).toBe("42");
    expect(feed.category).toBe("");
  });
});

describe("toFeeds", () => {
  it("maps multiple documents", () => {
    const feeds = toFeeds([makeDoc("a"), makeDoc("b")]);
    expect(feeds).toHaveLength(2);
    expect(feeds[0].id).toBe("a");
    expect(feeds[1].id).toBe("b");
  });
});
