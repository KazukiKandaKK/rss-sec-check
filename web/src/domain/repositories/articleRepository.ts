import { Article } from "../types";

export type ArticleListCallback = (
  articles: Article[],
  loading: boolean,
  error: string | null
) => void;

export interface ArticleRepository {
  subscribeAll(
    isOwner: boolean,
    onChange: ArticleListCallback
  ): () => void;
  toggleRead(article: Article): Promise<void>;
  toggleStar(article: Article): Promise<void>;
}
