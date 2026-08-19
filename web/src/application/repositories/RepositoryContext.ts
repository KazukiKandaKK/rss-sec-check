import { createContext, useContext } from "react";
import { ArticleRepository } from "../../domain/repositories/articleRepository";
import { FeedRepository } from "../../domain/repositories/feedRepository";
import { WatchlistRepository } from "../../domain/repositories/watchlistRepository";

export interface RepositoryContextValue {
  articleRepository: ArticleRepository;
  feedRepository: FeedRepository;
  watchlistRepository: WatchlistRepository;
}

export const RepositoryContext = createContext<RepositoryContextValue | null>(
  null
);

export function useRepositories(): RepositoryContextValue {
  const value = useContext(RepositoryContext);
  if (!value) {
    throw new Error("useRepositories must be used within a RepositoryProvider");
  }
  return value;
}
