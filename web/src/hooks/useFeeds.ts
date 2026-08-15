import { useEffect, useState } from "react";
import { useRepositories } from "../application/repositories/RepositoryContext";
import { Feed } from "../domain/types";

export function useFeeds(isOwner: boolean) {
  const { feedRepository } = useRepositories();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    return feedRepository.subscribeAll(isOwner, (data, loading) => {
      setFeeds(data);
      setLoading(loading);
    });
  }, [isOwner, feedRepository]);

  return { feeds, loading };
}
