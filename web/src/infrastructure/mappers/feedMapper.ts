import { DocumentData } from "firebase/firestore";
import { Feed } from "../../domain/types";
import { coerceToString } from "../../lib/string";

interface FirestoreDoc {
  id: string;
  data(): DocumentData;
}

export function toFeed(docItem: FirestoreDoc): Feed {
  const data = docItem.data();
  return {
    id: docItem.id,
    url: coerceToString(data.url),
    name: coerceToString(data.name),
    category: coerceToString(data.category),
    enabled: !!data.enabled,
    ownerEmail: coerceToString(data.ownerEmail),
  };
}

export function toFeeds(docs: FirestoreDoc[]): Feed[] {
  return docs.map(toFeed);
}
