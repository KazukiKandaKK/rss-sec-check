import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { Feed } from "../types";

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
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
        enabled: !!docItem.data().enabled,
      })) as Feed[];
      setFeeds(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const addFeed = async (feed: Omit<Feed, "id">) => {
    await addDoc(collection(db, "feeds"), feed);
  };

  const updateFeed = async (id: string, feed: Partial<Feed>) => {
    await updateDoc(doc(db, "feeds", id), feed);
  };

  const deleteFeed = async (id: string) => {
    await deleteDoc(doc(db, "feeds", id));
  };

  return { feeds, loading, addFeed, updateFeed, deleteFeed };
}
