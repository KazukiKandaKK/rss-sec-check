import { createHash } from "crypto";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import Parser from "rss-parser";

export interface FeedDoc {
  url: string;
  name: string;
  category: string;
  enabled: boolean;
}

export interface FeedItem {
  title: string;
  link: string;
  snippet: string;
  publishedAt: Date;
}

export interface FetchResult {
  feed: FeedDoc;
  inserted: number;
  updated: number;
  error?: string;
}

const MAX_ITEMS_PER_FEED = 50;
const MAX_SNIPPET_LENGTH = 200;

const parser = new Parser({ timeout: 30000 });

function toSnippet(item: Parser.Item): string {
  // Only a short snippet is stored — never the full article body (copyright).
  const raw = item.contentSnippet || item.summary || "";
  const text = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= MAX_SNIPPET_LENGTH) {
    return text;
  }
  return `${text.slice(0, MAX_SNIPPET_LENGTH)}…`;
}

function toPublishedAt(item: Parser.Item): Date {
  const dateString = item.isoDate || item.pubDate;
  if (dateString) {
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export function articleIdForLink(link: string): string {
  return createHash("sha256").update(link).digest("hex").slice(0, 40);
}

export async function fetchFeedItems(feedUrl: string): Promise<FeedItem[]> {
  const parsed = await parser.parseURL(feedUrl);
  const items: FeedItem[] = [];
  for (const item of parsed.items.slice(0, MAX_ITEMS_PER_FEED)) {
    const link = item.link?.trim();
    const title = item.title?.trim();
    if (!link || !title) {
      continue;
    }
    items.push({
      title,
      link,
      snippet: toSnippet(item),
      publishedAt: toPublishedAt(item),
    });
  }
  return items;
}

async function storeFeedItems(
  db: Firestore,
  feed: FeedDoc,
  items: FeedItem[]
): Promise<{ inserted: number; updated: number }> {
  if (items.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  const refs = items.map((item) =>
    db.collection("articles").doc(articleIdForLink(item.link))
  );
  const snapshots = await db.getAll(...refs);

  const batch = db.batch();
  const fetchedAt = Timestamp.now();
  let inserted = 0;
  let updated = 0;

  items.forEach((item, index) => {
    const ref = refs[index];
    const base = {
      title: item.title,
      link: item.link,
      source: feed.name,
      feedUrl: feed.url,
      snippet: item.snippet,
      publishedAt: Timestamp.fromDate(item.publishedAt),
      fetchedAt,
    };
    if (snapshots[index].exists) {
      // Keep the user's read/starred flags on refresh.
      batch.set(ref, base, { merge: true });
      updated += 1;
    } else {
      batch.set(ref, { ...base, read: false, starred: false });
      inserted += 1;
    }
  });

  await batch.commit();
  return { inserted, updated };
}

export async function fetchAllFeeds(db: Firestore): Promise<FetchResult[]> {
  const feedsSnapshot = await db
    .collection("feeds")
    .where("enabled", "==", true)
    .get();

  const results: FetchResult[] = [];

  for (const feedDoc of feedsSnapshot.docs) {
    const feed = feedDoc.data() as FeedDoc;
    try {
      const items = await fetchFeedItems(feed.url);
      const { inserted, updated } = await storeFeedItems(db, feed, items);
      results.push({ feed, inserted, updated });
      console.log(
        `[${feed.name}] inserted=${inserted}, updated=${updated} (items=${items.length})`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ feed, inserted: 0, updated: 0, error: message });
      console.error(`[${feed.name}] error: ${message}`);
    }
  }

  return results;
}
