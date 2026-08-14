import { useCallback } from "react";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Feed } from "../types";

export function useFeedActions() {
  const addFeed = useCallback(async (feed: Omit<Feed, "id">) => {
    await addDoc(collection(db, "feeds"), feed);
  }, []);

  const updateFeed = useCallback(async (id: string, feed: Partial<Feed>) => {
    await updateDoc(doc(db, "feeds", id), feed);
  }, []);

  const deleteFeed = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "feeds", id));
  }, []);

  return { addFeed, updateFeed, deleteFeed };
}
