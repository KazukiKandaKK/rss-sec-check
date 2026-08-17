import { createHash } from "crypto";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import Parser from "rss-parser";

export interface FeedDoc {
  url: string;
  name: string;
  category: string;
  enabled: boolean;
  ownerEmail?: string;
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

const ALLOWED_SCHEMES = new Set(["http:", "https:"]);

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata",
  "metadata.google",
  "metadata.google.internal",
]);

const PRIVATE_HOST_SUFFIXES = [".internal", ".localhost"];

const PRIVATE_IPv4_REGEX =
  /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.|0\.|255\.)/;

function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.includes(":")) return false;
  const lower = hostname.toLowerCase();
  return (
    lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")
  );
}

export function isPublicUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) return false;

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname)) return false;
  for (const suffix of PRIVATE_HOST_SUFFIXES) {
    if (hostname.endsWith(suffix)) return false;
  }
  if (hostname === "::1" || hostname === "[::1]") return false;
  if (PRIVATE_IPv4_REGEX.test(hostname)) return false;
  if (isPrivateIpv6(hostname)) return false;
  return true;
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}

function resolveArticleLink(link: string, feedUrl: string): string | null {
  try {
    const absolute = new URL(link, feedUrl);
    if (!ALLOWED_SCHEMES.has(absolute.protocol)) {
      return null;
    }
    if (!isPublicUrl(absolute.href)) {
      return null;
    }
    return absolute.href;
  } catch {
    return null;
  }
}

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
  if (!isValidHttpUrl(feedUrl)) {
    throw new Error(`Invalid feed URL scheme: ${feedUrl}`);
  }
  if (!isPublicUrl(feedUrl)) {
    throw new Error(`Private or local feed URL is not allowed: ${feedUrl}`);
  }

  const parsed = await parser.parseURL(feedUrl);
  const items: FeedItem[] = [];
  for (const item of parsed.items.slice(0, MAX_ITEMS_PER_FEED)) {
    const rawLink = item.link?.trim();
    const title = item.title?.trim();
    if (!rawLink || !title) {
      continue;
    }

    const link = resolveArticleLink(rawLink, feedUrl);
    if (!link) {
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

function articleContentChanged(
  snapshot: FirebaseFirestore.DocumentSnapshot,
  item: FeedItem
): boolean {
  const data = snapshot.data();
  if (!data) return true;

  const newPublishedAt = Timestamp.fromDate(item.publishedAt).toMillis();
  const currentPublishedAt =
    data.publishedAt instanceof Timestamp ? data.publishedAt.toMillis() : 0;

  return (
    data.title !== item.title ||
    data.link !== item.link ||
    data.snippet !== item.snippet ||
    currentPublishedAt !== newPublishedAt
  );
}

function buildArticleData(
  item: FeedItem,
  feed: FeedDoc,
  fetchedAt: Timestamp
): Record<string, unknown> {
  return {
    title: item.title,
    link: item.link,
    source: feed.name,
    feedUrl: feed.url,
    snippet: item.snippet,
    publishedAt: Timestamp.fromDate(item.publishedAt),
    fetchedAt,
    ownerEmail: feed.ownerEmail,
  };
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
    const snapshot = snapshots[index];

    if (snapshot.exists) {
      // Avoid overwriting source/feedUrl for existing articles so the
      // denormalized source name stays stable across feeds.
      if (articleContentChanged(snapshot, item)) {
        batch.set(
          ref,
          {
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            publishedAt: Timestamp.fromDate(item.publishedAt),
            fetchedAt,
          },
          { merge: true }
        );
        updated += 1;
      }
    } else {
      batch.set(ref, {
        ...buildArticleData(item, feed, fetchedAt),
        read: false,
        starred: false,
      });
      inserted += 1;
    }
  });

  await batch.commit();
  return { inserted, updated };
}

async function getOwnerEmail(db: Firestore): Promise<string | undefined> {
  try {
    const ownerDoc = await db.collection("config").doc("owner").get();
    if (ownerDoc.exists) {
      const data = ownerDoc.data();
      if (data && typeof data.email === "string") {
        return data.email;
      }
    }
  } catch {
    // Ignore and return undefined so callers can decide how to proceed.
  }
  return undefined;
}

async function loadEnabledFeeds(db: Firestore): Promise<FeedDoc[]> {
  const snapshot = await db
    .collection("feeds")
    .where("enabled", "==", true)
    .get();
  return snapshot.docs.map((doc) => ({ ...(doc.data() as FeedDoc) }));
}

async function processFeed(
  db: Firestore,
  feed: FeedDoc
): Promise<FetchResult> {
  try {
    const items = await fetchFeedItems(feed.url);
    const { inserted, updated } = await storeFeedItems(db, feed, items);
    console.log(
      `[${feed.name}] inserted=${inserted}, updated=${updated} (items=${items.length})`
    );
    return { feed, inserted, updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${feed.name}] error: ${message}`);
    return { feed, inserted: 0, updated: 0, error: message };
  }
}

export async function fetchAllFeeds(db: Firestore): Promise<FetchResult[]> {
  const feeds = await loadEnabledFeeds(db);
  const needsOwner = feeds.some((feed) => !feed.ownerEmail);
  const ownerEmail = needsOwner ? await getOwnerEmail(db) : undefined;

  const results: FetchResult[] = [];
  for (const feed of feeds) {
    const feedWithOwner: FeedDoc = feed.ownerEmail
      ? feed
      : { ...feed, ownerEmail };
    if (!feedWithOwner.ownerEmail) {
      console.error(`[${feed.name}] owner email not configured; skipping`);
      results.push({
        feed: feedWithOwner,
        inserted: 0,
        updated: 0,
        error: "Owner email not configured",
      });
      continue;
    }
    results.push(await processFeed(db, feedWithOwner));
  }

  return results;
}
