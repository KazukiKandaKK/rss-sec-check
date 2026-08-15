import { useCallback } from "react";
import { useRepositories } from "../application/repositories/RepositoryContext";
import { Feed, FeedDraft, createFeedDraft } from "../domain/entities/feed";
import { useAuth } from "./useAuth";

export function useFeedActions() {
  const { feedRepository } = useRepositories();
  const { user } = useAuth();

  const addFeed = useCallback(
    async (feed: FeedDraft) => {
      const draft = createFeedDraft(feed);
      await feedRepository.addFeed(draft, user?.email ?? "");
    },
    [feedRepository, user]
  );

  const updateFeed = useCallback(
    async (id: string, feed: Partial<Feed>) => {
      await feedRepository.updateFeed(id, feed);
    },
    [feedRepository]
  );

  const deleteFeed = useCallback(
    async (id: string) => {
      await feedRepository.deleteFeed(id);
    },
    [feedRepository]
  );

  return { addFeed, updateFeed, deleteFeed };
}
