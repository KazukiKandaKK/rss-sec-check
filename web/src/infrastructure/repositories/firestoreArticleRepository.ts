import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArticleRepository } from "../../domain/repositories/articleRepository";
import { Article } from "../../domain/entities/article";
import { db, OWNER_EMAIL } from "../../lib/firebase";
import { toArticles } from "../mappers/articleMapper";

const DEFAULT_ARTICLES_LIMIT = 1000;

function getArticlesLimit(): number {
  const env = import.meta.env.VITE_ARTICLES_LIMIT;
  if (!env) return DEFAULT_ARTICLES_LIMIT;
  const n = Number(env);
  return Number.isNaN(n) || n <= 0 ? DEFAULT_ARTICLES_LIMIT : n;
}

export class FirestoreArticleRepository implements ArticleRepository {
  subscribeAll(
    isOwner: boolean,
    onChange: Parameters<ArticleRepository["subscribeAll"]>[1]
  ) {
    if (!isOwner) {
      onChange([], false, null);
      return () => {};
    }

    const constraints: QueryConstraint[] = [
      where("ownerEmail", "==", OWNER_EMAIL),
      orderBy("publishedAt", "desc"),
    ];
    const limitValue = getArticlesLimit();
    if (limitValue > 0) {
      constraints.push(limit(limitValue));
    }
    const q = query(collection(db, "articles"), ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        onChange(toArticles(snapshot.docs), false, null);
      },
      (err) => {
        onChange([], false, err.message);
      }
    );
  }

  async updateRead(article: Article) {
    if (!article.id) {
      throw new Error("Cannot update read: article.id is missing");
    }
    await updateDoc(doc(db, "articles", article.id), {
      read: article.read,
    });
  }

  async updateStar(article: Article) {
    if (!article.id) {
      throw new Error("Cannot update star: article.id is missing");
    }
    await updateDoc(doc(db, "articles", article.id), {
      starred: article.starred,
    });
  }
}
