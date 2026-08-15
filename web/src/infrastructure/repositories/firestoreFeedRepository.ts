import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { FeedRepository } from "../../domain/repositories/feedRepository";
import { Feed } from "../../domain/types";
import { db, OWNER_EMAIL } from "../../lib/firebase";
import { toFeeds } from "../mappers/feedMapper";

export class FirestoreFeedRepository implements FeedRepository {
  subscribeAll(
    isOwner: boolean,
    onChange: Parameters<FeedRepository["subscribeAll"]>[1]
  ) {
    if (!isOwner) {
      onChange([], false);
      return () => {};
    }

    const q = query(
      collection(db, "feeds"),
      where("ownerEmail", "==", OWNER_EMAIL),
      orderBy("name", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      onChange(toFeeds(snapshot.docs), false);
    });
  }

  async addFeed(
    feed: Omit<Feed, "id" | "ownerEmail">,
    ownerEmail: string
  ) {
    await addDoc(collection(db, "feeds"), {
      ...feed,
      ownerEmail,
    });
  }

  async updateFeed(id: string, feed: Partial<Feed>) {
    await updateDoc(doc(db, "feeds", id), feed);
  }

  async deleteFeed(id: string) {
    await deleteDoc(doc(db, "feeds", id));
  }
}
