import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { Feed } from "../types";
import { toFeeds } from "../lib/feed";

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setFeeds([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, "feeds"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeeds(toFeeds(snapshot.docs));
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return { feeds, loading };
}
