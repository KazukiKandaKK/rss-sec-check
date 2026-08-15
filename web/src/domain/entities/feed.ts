import { coerceToString } from "../../lib/string";

export interface Feed {
  id: string;
  url: string;
  name: string;
  category: string;
  enabled: boolean;
  ownerEmail: string;
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
};

export type FeedDraftInput = {
  url?: unknown;
  name?: unknown;
  category?: unknown;
  enabled?: unknown;
};

export function createFeed(input: FeedInput): Feed {
  return {
    id: coerceToString(input.id),
    url: coerceToString(input.url),
    name: coerceToString(input.name),
    category: coerceToString(input.category),
    enabled: !!input.enabled,
    ownerEmail: coerceToString(input.ownerEmail),
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
