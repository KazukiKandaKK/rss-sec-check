import { coerceToString } from "../../lib/string";

export interface Feed {
  id: string;
  url: string;
  name: string;
  category: string;
  enabled: boolean;
  ownerEmail: string;
  /** Fetch health (written by the fetch job via Admin SDK). */
  lastFetchedAt: Date | null;
  lastSuccessAt: Date | null;
  lastError: string | null;
  consecutiveFailures: number;
}

export interface FeedDraft {
  url: string;
  name: string;
  category: string;
  enabled: boolean;
}

export type FeedInput = {
  id?: unknown;
  url?: unknown;
  name?: unknown;
  category?: unknown;
  enabled?: unknown;
  ownerEmail?: unknown;
  lastFetchedAt?: unknown;
  lastSuccessAt?: unknown;
  lastError?: unknown;
  consecutiveFailures?: unknown;
};

export type FeedDraftInput = {
  url?: unknown;
  name?: unknown;
  category?: unknown;
  enabled?: unknown;
};

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      if (!Number.isNaN(date.getTime())) return date;
    } catch {
      // fall through
    }
  }
  return null;
}

export function createFeed(input: FeedInput): Feed {
  const failures = Number(input.consecutiveFailures);
  return {
    id: coerceToString(input.id),
    url: coerceToString(input.url),
    name: coerceToString(input.name),
    category: coerceToString(input.category),
    enabled: !!input.enabled,
    ownerEmail: coerceToString(input.ownerEmail),
    lastFetchedAt: toDateOrNull(input.lastFetchedAt),
    lastSuccessAt: toDateOrNull(input.lastSuccessAt),
    lastError:
      typeof input.lastError === "string" && input.lastError.length > 0
        ? input.lastError
        : null,
    consecutiveFailures:
      Number.isFinite(failures) && failures > 0 ? failures : 0,
  };
}

export function createFeedDraft(input: FeedDraftInput): FeedDraft {
  return {
    url: coerceToString(input.url),
    name: coerceToString(input.name),
    category: coerceToString(input.category),
    enabled: !!input.enabled,
  };
}

export function withEnabled(feed: Feed, enabled: boolean): Feed {
  return { ...feed, enabled };
}

export function toggleEnabled(feed: Feed): Feed {
  return withEnabled(feed, !feed.enabled);
}

export function isEnabled(feed: Feed): boolean {
  return feed.enabled;
}

/** A feed is unhealthy when its most recent fetches keep failing. */
export function isUnhealthy(feed: Feed): boolean {
  return feed.consecutiveFailures > 0;
}
