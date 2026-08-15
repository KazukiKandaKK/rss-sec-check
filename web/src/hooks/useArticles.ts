import { useEffect, useState } from "react";
import { useRepositories } from "../application/repositories/RepositoryContext";
import { Article } from "../domain/types";

export function useArticles(isOwner: boolean) {
  const { articleRepository } = useRepositories();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    return articleRepository.subscribeAll(isOwner, (data, loading, err) => {
      setArticles(data);
      setLoading(loading);
      setError(err);
    });
  }, [isOwner, articleRepository]);

  return { articles, loading, error };
}
