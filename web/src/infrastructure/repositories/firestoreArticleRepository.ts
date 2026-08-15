import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArticleRepository } from "../../domain/repositories/articleRepository";
import { Article } from "../../domain/entities/article";
import { db, OWNER_EMAIL } from "../../lib/firebase";
import { toArticles } from "../mappers/articleMapper";

export class FirestoreArticleRepository implements ArticleRepository {
  subscribeAll(
    isOwner: boolean,
    onChange: Parameters<ArticleRepository["subscribeAll"]>[1]
  ) {
    if (!isOwner) {
      onChange([], false, null);
      return () => {};
    }

    const q = query(
      collection(db, "articles"),
      where("ownerEmail", "==", OWNER_EMAIL),
      orderBy("publishedAt", "desc")
    );

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
