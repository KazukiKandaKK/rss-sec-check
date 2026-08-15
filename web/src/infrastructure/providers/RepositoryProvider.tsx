import { ReactNode, useMemo } from "react";
import { RepositoryContext } from "../../application/repositories/RepositoryContext";
import { FirestoreArticleRepository } from "../repositories/firestoreArticleRepository";
import { FirestoreFeedRepository } from "../repositories/firestoreFeedRepository";

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      articleRepository: new FirestoreArticleRepository(),
      feedRepository: new FirestoreFeedRepository(),
    }),
    []
  );

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}
