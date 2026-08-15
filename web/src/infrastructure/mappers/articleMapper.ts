import { DocumentData } from "firebase/firestore";
import { Article, createArticle } from "../../domain/entities/article";

interface FirestoreDoc {
  id: string;
  data(): DocumentData;
}

export function toArticle(docItem: FirestoreDoc): Article {
  const data = docItem.data();
  return createArticle({
    id: docItem.id,
    title: data.title,
    link: data.link,
    source: data.source,
    feedUrl: data.feedUrl,
    snippet: data.snippet,
    publishedAt: data.publishedAt,
    fetchedAt: data.fetchedAt,
    read: data.read,
    starred: data.starred,
    ownerEmail: data.ownerEmail,
  });
}

export function toArticles(docs: FirestoreDoc[]): Article[] {
  return docs.map(toArticle);
}
