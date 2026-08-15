import { Feed, FeedDraft } from "../entities/feed";

export type FeedListCallback = (feeds: Feed[], loading: boolean) => void;

export interface FeedRepository {
  subscribeAll(isOwner: boolean, onChange: FeedListCallback): () => void;
  addFeed(feed: FeedDraft, ownerEmail: string): Promise<void>;
  updateFeed(id: string, feed: Partial<Feed>): Promise<void>;
  deleteFeed(id: string): Promise<void>;
}
