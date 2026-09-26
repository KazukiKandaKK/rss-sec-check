import { Article } from "../entities/article";

/**
 * Strips tracking parameters and fragments so syndicated copies of the same
 * story compare equal. Mirrors the server-side normalization in
 * functions/src/lib/fetchFeeds.ts (kept in sync manually).
 */
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

export function normalizeLinkForDedupe(link: string): string {
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
    return url.href.toLowerCase();
  } catch {
    return link.toLowerCase();
  }
}

export interface CollapsedArticle {
  article: Article;
  /** Number of hidden duplicates collapsed into this entry. */
  duplicateCount: number;
}

/**
 * Collapses articles pointing at the same normalized URL into one entry,
 * keeping the first occurrence in the given order (the list is expected to
 * be sorted by publishedAt desc, so the newest copy wins).
 */
export function collapseDuplicateArticles(
  articles: Article[]
): CollapsedArticle[] {
  const byLink = new Map<string, CollapsedArticle>();
  const order: string[] = [];

  for (const article of articles) {
    const key = normalizeLinkForDedupe(article.link);
    const existing = byLink.get(key);
    if (existing) {
      existing.duplicateCount += 1;
    } else {
      byLink.set(key, { article, duplicateCount: 0 });
      order.push(key);
    }
  }

  return order.map((key) => byLink.get(key) as CollapsedArticle);
}
