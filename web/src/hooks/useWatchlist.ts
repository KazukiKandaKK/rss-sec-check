import { useCallback, useEffect, useState } from "react";
import { useRepositories } from "../application/repositories/RepositoryContext";
import { useAuth } from "./useAuth";

export function useWatchlist(isOwner: boolean) {
  const { watchlistRepository } = useRepositories();
  const { user } = useAuth();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    return watchlistRepository.subscribe(isOwner, (data, isLoading) => {
      setKeywords(data);
      setLoading(isLoading);
    });
  }, [isOwner, watchlistRepository]);

  const saveKeywords = useCallback(
    async (next: string[]) => {
      await watchlistRepository.save(next, user?.email ?? "");
    },
    [watchlistRepository, user]
  );

  return { keywords, loading, saveKeywords };
}
