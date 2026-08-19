import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  WatchlistRepository,
  WatchlistCallback,
} from "../../domain/repositories/watchlistRepository";
import { normalizeKeywords } from "../../domain/services/watchlist";
import { db } from "../../lib/firebase";

export class FirestoreWatchlistRepository implements WatchlistRepository {
  subscribe(isOwner: boolean, onChange: WatchlistCallback) {
    if (!isOwner) {
      onChange([], false);
      return () => {};
    }

    return onSnapshot(
      doc(db, "settings", "watchlist"),
      (snapshot) => {
        const data = snapshot.data();
        const keywords = Array.isArray(data?.keywords)
          ? data.keywords.filter(
              (keyword): keyword is string => typeof keyword === "string"
            )
          : [];
        onChange(keywords, false);
      },
      () => {
        // Doc may not exist yet or be unreadable; treat as empty watchlist.
        onChange([], false);
      }
    );
  }

  async save(keywords: string[], ownerEmail: string) {
    await setDoc(doc(db, "settings", "watchlist"), {
      ownerEmail,
      keywords: normalizeKeywords(keywords),
    });
  }
}
