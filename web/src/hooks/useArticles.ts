import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Article, ArticleFilter } from "../types";

export function useArticles(
  filter: ArticleFilter,
  source: string,
  search: string
) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "articles"),
      orderBy("publishedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => {
          const docData = docItem.data();
          return {
            id: docItem.id,
            ...docData,
            read: !!docData.read,
            starred: !!docData.starred,
          } as Article;
        });

        const filtered = data.filter((article) => {
          if (filter === "unread" && article.read) return false;
          if (filter === "starred" && !article.starred) return false;
          if (source !== "all" && article.source !== source) return false;
          if (!search.trim()) return true;
          const term = search.toLowerCase();
          return (
            article.title.toLowerCase().includes(term) ||
            article.snippet.toLowerCase().includes(term)
          );
        });

        setArticles(filtered);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filter, source, search]);

  const toggleRead = async (article: Article) => {
    await updateDoc(doc(db, "articles", article.id), {
      read: !article.read,
    });
  };

  const toggleStar = async (article: Article) => {
    await updateDoc(doc(db, "articles", article.id), {
      starred: !article.starred,
    });
  };

  return { articles, loading, error, toggleRead, toggleStar };
}
