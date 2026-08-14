import { DocumentData, Timestamp } from "firebase/firestore";
import { Article, ArticleFilter } from "../types";
import { coerceToString } from "./string";

interface FirestoreDoc {
  id: string;
  data(): DocumentData;
}

function toTimestamp(value: unknown): Timestamp {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return value as Timestamp;
  }
  return Timestamp.now();
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
    publishedAt: toTimestamp(data.publishedAt),
    fetchedAt: toTimestamp(data.fetchedAt),
    read: !!data.read,
    starred: !!data.starred,
  } as Article;
}

export function toArticles(docs: FirestoreDoc[]): Article[] {
  return docs.map(toArticle);
}

export function filterArticles(
  articles: Article[],
  filter: ArticleFilter,
  source: string,
  search: string
): Article[] {
  const term = search.trim().toLowerCase();
  return articles.filter((article) => {
    if (filter === "unread" && article.read) return false;
    if (filter === "starred" && !article.starred) return false;
    if (source !== "all" && article.source !== source) return false;
    if (!term) return true;
    return (
      article.title.toLowerCase().includes(term) ||
      article.snippet.toLowerCase().includes(term)
    );
  });
}
