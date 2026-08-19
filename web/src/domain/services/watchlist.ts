/**
 * Returns the watchlist keywords that match the given article text.
 * Matching is case-insensitive against title + snippet.
 */
export function matchWatchKeywords(
  title: string,
  snippet: string,
  keywords: string[]
): string[] {
  if (keywords.length === 0) return [];
  const haystack = `${title} ${snippet}`.toLowerCase();
  return keywords.filter(
    (keyword) =>
      keyword.trim().length > 0 &&
      haystack.includes(keyword.trim().toLowerCase())
  );
}

const MAX_KEYWORDS = 50;
const MAX_KEYWORD_LENGTH = 100;

/**
 * Normalizes a raw keyword list: trims, drops empties/duplicates
 * (case-insensitive), and enforces size limits aligned with firestore.rules.
 */
export function normalizeKeywords(rawKeywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of rawKeywords) {
    const keyword = raw.trim().slice(0, MAX_KEYWORD_LENGTH);
    if (keyword.length === 0) continue;
    const lower = keyword.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    result.push(keyword);
    if (result.length >= MAX_KEYWORDS) break;
  }
  return result;
}
