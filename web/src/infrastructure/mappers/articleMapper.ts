import { DocumentData } from "firebase/firestore";
import { Article } from "../../domain/types";
import { coerceToString } from "../../lib/string";

interface FirestoreDoc {
  id: string;
  data(): DocumentData;
}

function toDate(value: unknown): Date {
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

export function toArticle(docItem: FirestoreDoc): Article {
  const data = docItem.data();
  return {
    id: docItem.id,
    title: coerceToString(data.title),
    link: coerceToString(data.link),
    source: coerceToString(data.source),
    feedUrl: coerceToString(data.feedUrl),
    snippet: coerceToString(data.snippet),
    publishedAt: toDate(data.publishedAt),
    fetchedAt: toDate(data.fetchedAt),
    read: !!data.read,
    starred: !!data.starred,
    ownerEmail: coerceToString(data.ownerEmail),
  };
}

export function toArticles(docs: FirestoreDoc[]): Article[] {
  return docs.map(toArticle);
}
