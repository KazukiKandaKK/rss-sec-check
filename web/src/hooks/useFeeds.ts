import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, OWNER_EMAIL } from "../lib/firebase";
import { Feed } from "../types";
import { toFeeds } from "../lib/feed";

export function useFeeds(isOwner: boolean) {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOwner) {
      setFeeds([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "feeds"),
      where("ownerEmail", "==", OWNER_EMAIL),
      orderBy("name", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeeds(toFeeds(snapshot.docs));
      setLoading(false);
    });
    return unsubscribe;
  }, [isOwner]);

  return { feeds, loading };
}
