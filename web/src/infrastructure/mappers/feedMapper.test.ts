import { describe, it, expect } from "vitest";
import { toFeed, toFeeds } from "./feedMapper";

function makeDoc(
  id: string,
  overrides: Record<string, unknown> = {}
): { id: string; data: () => Record<string, unknown> } {
  return {
    id,
    data: () => ({
      url: "https://example.com/feed",
      name: "Example Feed",
      category: "news",
      enabled: true,
      ownerEmail: "owner@example.com",
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
    expect(feed.category).toBe("news");
    expect(feed.enabled).toBe(true);
    expect(feed.ownerEmail).toBe("owner@example.com");
  });

  it("normalizes missing enabled flag", () => {
    const doc = makeDoc("feed-2", { enabled: undefined });
    const feed = toFeed(doc);
    expect(feed.enabled).toBe(false);
  });

  it("coerces non-string fields to strings", () => {
    const doc = makeDoc("feed-3", {
      name: 456,
      category: null,
      url: undefined,
    });
    const feed = toFeed(doc);

    expect(feed.name).toBe("456");
    expect(feed.category).toBe("");
    expect(feed.url).toBe("");
  });
});

describe("toFeeds", () => {
  it("maps multiple documents", () => {
    const docs = [makeDoc("a"), makeDoc("b")];
    const feeds = toFeeds(docs);
    expect(feeds).toHaveLength(2);
    expect(feeds[0]?.id).toBe("a");
    expect(feeds[1]?.id).toBe("b");
  });
});
