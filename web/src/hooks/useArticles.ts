import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, OWNER_EMAIL } from "../lib/firebase";
import { Article } from "../types";
import { toArticles } from "../lib/article";

export function useArticles(isOwner: boolean) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) {
      setArticles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "articles"),
      where("ownerEmail", "==", OWNER_EMAIL),
      orderBy("publishedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setArticles(toArticles(snapshot.docs));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [isOwner]);

  return { articles, loading, error };
}
