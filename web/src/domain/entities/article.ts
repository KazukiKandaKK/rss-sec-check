import { coerceToString } from "../../lib/string";

export interface Article {
  id: string;
  title: string;
  link: string;
  source: string;
  feedUrl: string;
  snippet: string;
  publishedAt: Date;
  fetchedAt: Date;
  read: boolean;
  starred: boolean;
  ownerEmail: string;
}

export type ArticleInput = {
  id?: unknown;
  title?: unknown;
  link?: unknown;
  source?: unknown;
  feedUrl?: unknown;
  snippet?: unknown;
  publishedAt?: unknown;
  fetchedAt?: unknown;
  read?: unknown;
  starred?: unknown;
  ownerEmail?: unknown;
};

function toValidDate(value: unknown): Date {
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

  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return new Date();
}

export function createArticle(input: ArticleInput): Article {
  return {
    id: coerceToString(input.id),
    title: coerceToString(input.title),
    link: coerceToString(input.link),
    source: coerceToString(input.source),
    feedUrl: coerceToString(input.feedUrl),
    snippet: coerceToString(input.snippet),
    publishedAt: toValidDate(input.publishedAt),
    fetchedAt: toValidDate(input.fetchedAt),
    read: !!input.read,
    starred: !!input.starred,
    ownerEmail: coerceToString(input.ownerEmail),
  };
}

export function withReadStatus(article: Article, read: boolean): Article {
  return { ...article, read };
}

export function withStarredStatus(article: Article, starred: boolean): Article {
  return { ...article, starred };
}

export function markAsRead(article: Article): Article {
  return withReadStatus(article, true);
}

export function markAsUnread(article: Article): Article {
  return withReadStatus(article, false);
}

export function toggleRead(article: Article): Article {
  return withReadStatus(article, !article.read);
}

export function toggleStar(article: Article): Article {
  return withStarredStatus(article, !article.starred);
}

export function isUnread(article: Article): boolean {
  return !article.read;
}

export function isStarred(article: Article): boolean {
  return article.starred;
}
