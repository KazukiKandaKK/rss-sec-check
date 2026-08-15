import { useCallback } from "react";
import { useRepositories } from "../application/repositories/RepositoryContext";
import { Article } from "../domain/types";

export function useArticleActions() {
  const { articleRepository } = useRepositories();

  const toggleRead = useCallback(
    async (article: Article) => {
      await articleRepository.toggleRead(article);
    },
    [articleRepository]
  );

  const toggleStar = useCallback(
    async (article: Article) => {
      await articleRepository.toggleStar(article);
    },
    [articleRepository]
  );

  return { toggleRead, toggleStar };
}
