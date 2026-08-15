import { useCallback } from "react";
import { useRepositories } from "../application/repositories/RepositoryContext";
import { useAuth } from "./useAuth";
import { Feed } from "../domain/types";

export function useFeedActions() {
  const { feedRepository } = useRepositories();
  const { user } = useAuth();

  const addFeed = useCallback(
    async (feed: Omit<Feed, "id" | "ownerEmail">) => {
      await feedRepository.addFeed(feed, user?.email ?? "");
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
