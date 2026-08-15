import { DocumentData } from "firebase/firestore";
import { Feed, createFeed } from "../../domain/entities/feed";

interface FirestoreDoc {
  id: string;
  data(): DocumentData;
}

export function toFeed(docItem: FirestoreDoc): Feed {
  const data = docItem.data();
  return createFeed({
    id: docItem.id,
    url: data.url,
    name: data.name,
    category: data.category,
    enabled: data.enabled,
    ownerEmail: data.ownerEmail,
  });
}

export function toFeeds(docs: FirestoreDoc[]): Feed[] {
  return docs.map(toFeed);
}
