import { useCallback } from "react";
import { useRepositories } from "../application/repositories/RepositoryContext";
import {
  Article,
  toggleRead as toggleArticleRead,
  toggleStar as toggleArticleStar,
} from "../domain/entities/article";

export function useArticleActions() {
  const { articleRepository } = useRepositories();

  const toggleRead = useCallback(
    async (article: Article) => {
      const next = toggleArticleRead(article);
      await articleRepository.updateRead(next);
    },
    [articleRepository]
  );

  const toggleStar = useCallback(
    async (article: Article) => {
      const next = toggleArticleStar(article);
      await articleRepository.updateStar(next);
    },
    [articleRepository]
  );

  return { toggleRead, toggleStar };
}
