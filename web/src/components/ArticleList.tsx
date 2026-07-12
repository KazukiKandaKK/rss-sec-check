import { useState } from "react";
import { ArticleFilter } from "../types";
import { useArticles } from "../hooks/useArticles";
import { ArticleFilters } from "./ArticleFilters";
import { ArticleCard } from "./ArticleCard";

interface ArticleListProps {
  sources: string[];
}

export function ArticleList({ sources }: ArticleListProps) {
  const [filter, setFilter] = useState<ArticleFilter>("all");
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");

  const { articles, loading, error, toggleRead, toggleStar } = useArticles(
    filter,
    source,
    search
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-500">読み込み中…</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">エラー: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <ArticleFilters
        filter={filter}
        source={source}
        search={search}
        sources={sources}
        onFilterChange={setFilter}
        onSourceChange={setSource}
        onSearchChange={setSearch}
      />
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {articles.length} 件
      </div>
      <div className="space-y-4">
        {articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            該当する記事がありません。
          </div>
        ) : (
          articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onToggleRead={toggleRead}
              onToggleStar={toggleStar}
            />
          ))
        )}
      </div>
    </div>
  );
}
