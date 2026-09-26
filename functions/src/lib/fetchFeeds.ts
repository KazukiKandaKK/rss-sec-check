import { createHash } from "crypto";
import { Firestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import Parser from "rss-parser";

export interface FeedDoc {
  /** Firestore document id. Absent for feeds constructed in tests. */
  id?: string;
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
  /** Items newly inserted in this run (used for notification digests). */
  newItems: FeedItem[];
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
  const lower = hostname.replace(/^\[|\]$/g, "").toLowerCase();
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

// Tracking parameters removed during link normalization so the same story
// shared with different campaign tags dedupes to a single article document.
const TRACKING_PARAM_PREFIXES = ["utm_"];
const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "ref_src",
  "cmpid",
  "smid",
]);

export function normalizeArticleLink(link: string): string {
  try {
    const url = new URL(link);
    url.hash = "";
    const toDelete: string[] = [];
    url.searchParams.forEach((_value, key) => {
      const lower = key.toLowerCase();
      if (
        TRACKING_PARAMS.has(lower) ||
        TRACKING_PARAM_PREFIXES.some((prefix) => lower.startsWith(prefix))
      ) {
        toDelete.push(key);
      }
    });
    for (const key of toDelete) {
      url.searchParams.delete(key);
    }
    if ([...url.searchParams.keys()].length === 0) {
      url.search = "";
    }
    return url.href;
  } catch {
    return link;
  }
}

export function resolveArticleLink(link: string, feedUrl: string): string | null {
  try {
    const absolute = new URL(link, feedUrl);
    if (!ALLOWED_SCHEMES.has(absolute.protocol)) {
      return null;
    }
    if (!isPublicUrl(absolute.href)) {
      return null;
    }
    return normalizeArticleLink(absolute.href);
  } catch {
    return null;
  }
}

export function toSnippet(item: Parser.Item): string {
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

export function toPublishedAt(item: Parser.Item): Date {
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

export function articleContentChanged(
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
): Promise<{ inserted: number; updated: number; newItems: FeedItem[] }> {
  if (items.length === 0) {
    return { inserted: 0, updated: 0, newItems: [] };
  }

  const refs = items.map((item) =>
    db.collection("articles").doc(articleIdForLink(item.link))
  );
  const snapshots = await db.getAll(...refs);

  const batch = db.batch();
  const fetchedAt = Timestamp.now();
  let inserted = 0;
  let updated = 0;
  const newItems: FeedItem[] = [];

  items.forEach((item, index) => {
    const ref = refs[index];
    const snapshot = snapshots[index];
    if (!ref || !snapshot) return;

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
      newItems.push(item);
    }
  });

  await batch.commit();
  return { inserted, updated, newItems };
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
  return snapshot.docs.map((doc) => ({
    ...(doc.data() as FeedDoc),
    id: doc.id,
  }));
}

async function recordFeedHealth(
  db: Firestore,
  feed: FeedDoc,
  result: FetchResult
): Promise<void> {
  if (!feed.id) return;
  try {
    const ref = db.collection("feeds").doc(feed.id);
    if (result.error) {
      await ref.set(
        {
          lastFetchedAt: Timestamp.now(),
          lastError: result.error,
          consecutiveFailures: FieldValue.increment(1),
        },
        { merge: true }
      );
    } else {
      await ref.set(
        {
          lastFetchedAt: Timestamp.now(),
          lastSuccessAt: Timestamp.now(),
          lastError: null,
          consecutiveFailures: 0,
        },
        { merge: true }
      );
    }
  } catch (error) {
    // Health tracking must never fail the fetch itself.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${feed.name}] failed to record feed health: ${message}`);
  }
}

async function processFeed(
  db: Firestore,
  feed: FeedDoc
): Promise<FetchResult> {
  try {
    const items = await fetchFeedItems(feed.url);
    const { inserted, updated, newItems } = await storeFeedItems(
      db,
      feed,
      items
    );
    console.log(
      `[${feed.name}] inserted=${inserted}, updated=${updated} (items=${items.length})`
    );
    return { feed, inserted, updated, newItems };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${feed.name}] error: ${message}`);
    return { feed, inserted: 0, updated: 0, newItems: [], error: message };
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
        newItems: [],
        error: "Owner email not configured",
      });
      continue;
    }
    const result = await processFeed(db, feedWithOwner);
    await recordFeedHealth(db, feedWithOwner, result);
    results.push(result);
  }

  return results;
}

const PRUNE_BATCH_SIZE = 400;

/**
 * Deletes read, non-starred articles older than {@link maxAgeDays}
 * (based on publishedAt) to keep the collection within Spark quotas.
 * Returns the number of deleted documents.
 */
export async function pruneOldArticles(
  db: Firestore,
  maxAgeDays: number
): Promise<number> {
  if (!Number.isFinite(maxAgeDays) || maxAgeDays <= 0) {
    return 0;
  }
  const cutoff = Timestamp.fromDate(
    new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000)
  );

  let totalDeleted = 0;
  // Loop because each query is capped at PRUNE_BATCH_SIZE docs.
  // starred articles are never deleted; unread articles are kept as well
  // so the owner never loses something they haven't triaged yet.
  for (;;) {
    const snapshot = await db
      .collection("articles")
      .where("read", "==", true)
      .where("starred", "==", false)
      .where("publishedAt", "<", cutoff)
      .limit(PRUNE_BATCH_SIZE)
      .get();

    if (snapshot.empty) break;

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    totalDeleted += snapshot.docs.length;

    if (snapshot.docs.length < PRUNE_BATCH_SIZE) break;
  }

  if (totalDeleted > 0) {
    console.log(`[prune] deleted ${totalDeleted} old article(s)`);
  }
  return totalDeleted;
}

export interface WatchlistDoc {
  keywords: string[];
}

export async function loadWatchlistKeywords(db: Firestore): Promise<string[]> {
  try {
    const doc = await db.collection("settings").doc("watchlist").get();
    if (!doc.exists) return [];
    const data = doc.data();
    if (!data || !Array.isArray(data.keywords)) return [];
    return data.keywords
      .filter((keyword): keyword is string => typeof keyword === "string")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);
  } catch {
    return [];
  }
}

export function matchesKeywords(
  item: FeedItem,
  keywords: string[]
): string[] {
  const haystack = `${item.title} ${item.snippet}`.toLowerCase();
  return keywords.filter((keyword) =>
    haystack.includes(keyword.toLowerCase())
  );
}

export interface DigestEntry {
  feedName: string;
  category: string;
  title: string;
  link: string;
  matchedKeywords: string[];
}

export interface Digest {
  entries: DigestEntry[];
  fetchErrors: Array<{ feedName: string; error: string }>;
}

const ALERT_CATEGORIES = new Set(["alert"]);
const MAX_DIGEST_ENTRIES = 20;

/**
 * Builds a notification digest from fetch results: new articles from Alert
 * category feeds and new articles matching any watchlist keyword.
 */
export function buildDigest(
  results: FetchResult[],
  watchlistKeywords: string[]
): Digest {
  const entries: DigestEntry[] = [];
  const fetchErrors: Array<{ feedName: string; error: string }> = [];

  for (const result of results) {
    if (result.error) {
      fetchErrors.push({ feedName: result.feed.name, error: result.error });
      continue;
    }
    const isAlertFeed = ALERT_CATEGORIES.has(
      result.feed.category.toLowerCase()
    );
    for (const item of result.newItems) {
      const matchedKeywords = matchesKeywords(item, watchlistKeywords);
      if (isAlertFeed || matchedKeywords.length > 0) {
        entries.push({
          feedName: result.feed.name,
          category: result.feed.category,
          title: item.title,
          link: item.link,
          matchedKeywords,
        });
      }
    }
  }

  return { entries, fetchErrors };
}

export function formatDigestText(digest: Digest): string | null {
  if (digest.entries.length === 0 && digest.fetchErrors.length === 0) {
    return null;
  }

  const lines: string[] = [];
  if (digest.entries.length > 0) {
    lines.push(`🔔 セキュリティ記事ダイジェスト (${digest.entries.length}件)`);
    for (const entry of digest.entries.slice(0, MAX_DIGEST_ENTRIES)) {
      const keywordNote =
        entry.matchedKeywords.length > 0
          ? ` [watch: ${entry.matchedKeywords.join(", ")}]`
          : "";
      lines.push(`• [${entry.feedName}] ${entry.title}${keywordNote}`);
      lines.push(`  ${entry.link}`);
    }
    if (digest.entries.length > MAX_DIGEST_ENTRIES) {
      lines.push(`…ほか ${digest.entries.length - MAX_DIGEST_ENTRIES} 件`);
    }
  }
  if (digest.fetchErrors.length > 0) {
    lines.push(`⚠️ フィード取得エラー (${digest.fetchErrors.length}件)`);
    for (const failure of digest.fetchErrors) {
      lines.push(`• ${failure.feedName}: ${failure.error}`);
    }
  }
  return lines.join("\n");
}
