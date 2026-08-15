import { Feed } from "../types";

export type FeedListCallback = (feeds: Feed[], loading: boolean) => void;

export interface FeedRepository {
  subscribeAll(isOwner: boolean, onChange: FeedListCallback): () => void;
  addFeed(
    feed: Omit<Feed, "id" | "ownerEmail">,
    ownerEmail: string
  ): Promise<void>;
  updateFeed(id: string, feed: Partial<Feed>): Promise<void>;
  deleteFeed(id: string): Promise<void>;
}
