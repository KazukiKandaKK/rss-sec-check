import { useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Article } from "../types";

export function useArticleActions() {
  const toggleRead = useCallback(async (article: Article) => {
    if (!article.id) {
      console.error("Cannot toggle read: article.id is missing");
      return;
    }
    await updateDoc(doc(db, "articles", article.id), {
      read: !article.read,
    });
  }, []);

  const toggleStar = useCallback(async (article: Article) => {
    if (!article.id) {
      console.error("Cannot toggle star: article.id is missing");
      return;
    }
    await updateDoc(doc(db, "articles", article.id), {
      starred: !article.starred,
    });
  }, []);

  return { toggleRead, toggleStar };
}
