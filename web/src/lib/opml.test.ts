import { describe, it, expect } from "vitest";
import { createFeed, Feed } from "../domain/entities/feed";
import { feedsToOpml, parseOpml } from "./opml";

function makeFeed(overrides: Partial<Feed>): Feed {
  return createFeed({
    id: "1",
    url: "https://example.com/feed",
    name: "Example",
    category: "News",
    enabled: true,
    ownerEmail: "owner@example.com",
    ...overrides,
  });
}

describe("feedsToOpml", () => {
  it("serializes feeds with escaped attributes", () => {
    const opml = feedsToOpml([
      makeFeed({ name: `A & B <"quoted">`, url: "https://example.com/rss" }),
    ]);
    expect(opml).toContain("&amp;");
    expect(opml).toContain("&lt;");
    expect(opml).toContain("&quot;");
    expect(opml).toContain(`xmlUrl="https://example.com/rss"`);
    expect(opml).toContain(`category="News"`);
  });

  it("omits the category attribute when empty", () => {
    const opml = feedsToOpml([makeFeed({ category: "" })]);
    expect(opml).not.toContain("category=");
  });
});

describe("parseOpml", () => {
  it("parses flat outlines", () => {
    const { feeds, errors } = parseOpml(`<?xml version="1.0"?>
      <opml version="2.0"><head/><body>
        <outline type="rss" title="Feed A" xmlUrl="https://a.example.com/rss" category="Alert"/>
        <outline type="rss" text="Feed B" xmlUrl="https://b.example.com/rss"/>
      </body></opml>`);
    expect(errors).toEqual([]);
    expect(feeds).toEqual([
      {
        url: "https://a.example.com/rss",
        name: "Feed A",
        category: "Alert",
        enabled: true,
      },
      {
        url: "https://b.example.com/rss",
        name: "Feed B",
        category: "",
        enabled: true,
      },
    ]);
  });

  it("uses folder titles as categories for nested outlines", () => {
    const { feeds } = parseOpml(`<opml version="2.0"><body>
      <outline title="Security">
        <outline type="rss" title="Feed A" xmlUrl="https://a.example.com/rss"/>
      </outline>
    </body></opml>`);
    expect(feeds[0]?.category).toBe("Security");
  });

  it("dedupes repeated xmlUrls", () => {
    const { feeds } = parseOpml(`<opml version="2.0"><body>
      <outline type="rss" title="A" xmlUrl="https://a.example.com/rss"/>
      <outline type="rss" title="A again" xmlUrl="https://a.example.com/rss"/>
    </body></opml>`);
    expect(feeds).toHaveLength(1);
  });

  it("skips non-http URLs with an error message", () => {
    const { feeds, errors } = parseOpml(`<opml version="2.0"><body>
      <outline type="rss" title="Bad" xmlUrl="ftp://a.example.com/rss"/>
    </body></opml>`);
    expect(feeds).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it("reports unparseable XML", () => {
    const { feeds, errors } = parseOpml("not xml at all <<<");
    expect(feeds).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it("reports missing body", () => {
    const { feeds, errors } = parseOpml(`<opml version="2.0"><head/></opml>`);
    expect(feeds).toEqual([]);
    expect(errors).toEqual(["OPMLに<body>がありません。"]);
  });

  it("falls back to xmlUrl as the name", () => {
    const { feeds } = parseOpml(`<opml version="2.0"><body>
      <outline type="rss" xmlUrl="https://a.example.com/rss"/>
    </body></opml>`);
    expect(feeds[0]?.name).toBe("https://a.example.com/rss");
  });
});
