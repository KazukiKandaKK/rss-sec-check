import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Article, ArticleFilter, SearchQuery } from "../domain/types";
import { filterArticles } from "../domain/services/filterArticles";

export function useArticleFilters(articles: Article[]) {
  const [filter, setFilter] = useState<ArticleFilter>("all");
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const searchQuery = useMemo(
    () => SearchQuery.of(deferredSearch),
    [deferredSearch]
  );

  const filteredArticles = useMemo(
    () => filterArticles(articles, filter, source, searchQuery),
    [articles, filter, source, searchQuery]
  );

  const resetFilters = useCallback(() => {
    setFilter("all");
    setSource("all");
    setSearch("");
  }, []);

  const hasActiveFilter =
    filter !== "all" || source !== "all" || search.trim().length > 0;

  return {
    filter,
    setFilter,
    source,
    setSource,
    search,
    setSearch,
    deferredSearch,
    searchQuery,
    filteredArticles,
    resetFilters,
    hasActiveFilter,
  };
}
