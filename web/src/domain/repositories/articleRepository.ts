import { Article } from "../entities/article";

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
  updateRead(article: Article): Promise<void>;
  updateStar(article: Article): Promise<void>;
}
