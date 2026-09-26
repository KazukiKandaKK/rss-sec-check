export type WatchlistCallback = (keywords: string[], loading: boolean) => void;

export interface WatchlistRepository {
  subscribe(isOwner: boolean, onChange: WatchlistCallback): () => void;
  save(keywords: string[], ownerEmail: string): Promise<void>;
}
