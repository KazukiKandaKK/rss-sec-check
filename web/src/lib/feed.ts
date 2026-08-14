import { DocumentData } from "firebase/firestore";
import { Feed } from "../types";
import { coerceToString } from "./string";

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
  } as Feed;
}

export function toFeeds(docs: FirestoreDoc[]): Feed[] {
  return docs.map(toFeed);
}
