import { Feed, FeedDraft } from "../domain/types";

/**
 * Serializes feeds into an OPML 2.0 document. Categories map to
 * the outline `category` attribute.
 */
export function feedsToOpml(feeds: Feed[]): string {
  const outlines = feeds
    .map((feed) => {
      const attrs = [
        `type="rss"`,
        `text="${escapeXml(feed.name)}"`,
        `title="${escapeXml(feed.name)}"`,
        `xmlUrl="${escapeXml(feed.url)}"`,
      ];
      if (feed.category) {
        attrs.push(`category="${escapeXml(feed.category)}"`);
      }
      return `    <outline ${attrs.join(" ")} />`;
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<opml version="2.0">`,
    `  <head>`,
    `    <title>rss-sec-check feeds</title>`,
    `  </head>`,
    `  <body>`,
    outlines,
    `  </body>`,
    `</opml>`,
    ``,
  ].join("\n");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface OpmlParseResult {
  feeds: FeedDraft[];
  errors: string[];
}

/**
 * Parses an OPML document into feed drafts. Nested outline folders are
 * flattened; the nearest folder title becomes the category when the
 * outline itself has none.
 */
export function parseOpml(xml: string): OpmlParseResult {
  const errors: string[] = [];
  const parser = new DOMParser();
  const docParsed = parser.parseFromString(xml, "text/xml");

  if (docParsed.querySelector("parsererror")) {
    return { feeds: [], errors: ["OPMLのXMLとして解析できませんでした。"] };
  }

  const feeds: FeedDraft[] = [];
  const seenUrls = new Set<string>();

  const walk = (element: Element, parentCategory: string) => {
    for (const child of Array.from(element.children)) {
      if (child.tagName.toLowerCase() !== "outline") continue;
      const xmlUrl = child.getAttribute("xmlUrl");
      if (xmlUrl) {
        const url = xmlUrl.trim();
        if (!/^https?:\/\/.+/.test(url)) {
          errors.push(`不正なURLをスキップしました: ${url}`);
        } else if (!seenUrls.has(url)) {
          seenUrls.add(url);
          const name =
            child.getAttribute("title") || child.getAttribute("text") || url;
          const category =
            child.getAttribute("category") || parentCategory || "";
          feeds.push({ url, name, category, enabled: true });
        }
      } else {
        // Folder outline: its title becomes the category for children.
        const folder =
          child.getAttribute("title") || child.getAttribute("text") || "";
        walk(child, folder || parentCategory);
      }
    }
  };

  const body = docParsed.querySelector("body");
  if (!body) {
    return { feeds: [], errors: ["OPMLに<body>がありません。"] };
  }
  walk(body, "");

  return { feeds, errors };
}
