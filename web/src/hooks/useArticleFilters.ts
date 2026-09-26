import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Article, ArticleFilter, SearchQuery } from "../domain/types";
import { filterArticles } from "../domain/services/filterArticles";
import {
  collapseDuplicateArticles,
  CollapsedArticle,
} from "../domain/services/collapseDuplicates";
import { hasActiveFilter } from "../lib/articleFilters";

export function useArticleFilters(
  articles: Article[],
  watchKeywords: string[] = []
) {
  const [filter, setFilter] = useState<ArticleFilter>("all");
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const searchQuery = useMemo(
    () => SearchQuery.of(deferredSearch),
    [deferredSearch]
  );

  const filteredArticles = useMemo(
    () => filterArticles(articles, filter, source, searchQuery, watchKeywords),
    [articles, filter, source, searchQuery, watchKeywords]
  );

  const collapsedArticles: CollapsedArticle[] = useMemo(
    () => collapseDuplicateArticles(filteredArticles),
    [filteredArticles]
  );

  const resetFilters = useCallback(() => {
    setFilter("all");
    setSource("all");
    setSearch("");
  }, []);

  const isFilterActive = hasActiveFilter(filter, source, search);

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
    collapsedArticles,
    resetFilters,
    hasActiveFilter: isFilterActive,
  };
}
