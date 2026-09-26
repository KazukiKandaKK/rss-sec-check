import { useAuth } from "../hooks/useAuth";
import { useArticles } from "../hooks/useArticles";
import { useArticleActions } from "../hooks/useArticleActions";
import { useArticleFilters } from "../hooks/useArticleFilters";
import { useWatchlist } from "../hooks/useWatchlist";
import { matchWatchKeywords } from "../domain/services/watchlist";
import { ArticleFilters } from "./ArticleFilters";
import { ArticleCard } from "./ArticleCard";

interface ArticleListProps {
  sources: string[];
}

export function ArticleList({ sources }: ArticleListProps) {
  const { isOwner } = useAuth();
  const { articles, loading, error } = useArticles(isOwner);
  const { keywords } = useWatchlist(isOwner);
  const { toggleRead, toggleStar } = useArticleActions();
  const {
    filter,
    setFilter,
    source,
    setSource,
    search,
    setSearch,
    collapsedArticles,
    resetFilters,
    hasActiveFilter,
  } = useArticleFilters(articles, keywords);

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

      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-500 dark:text-gray-400">
          {loading ? (
            "読み込み中…"
          ) : (
            <>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {collapsedArticles.length}
              </span>
              件の記事
            </>
          )}
        </p>
        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:text-blue-400 dark:hover:text-blue-300 dark:focus-visible:ring-offset-gray-950"
          >
            絞り込みを解除
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-12 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
            aria-hidden="true"
          />
          読み込み中…
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          <p className="font-medium">エラーが発生しました</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && collapsedArticles.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">
            {filter === "all" && source === "all" && !search.trim()
              ? "まだ記事がありません。フィードを追加して記事を取得してください。"
              : filter === "watched" && keywords.length === 0
                ? "ウォッチキーワードが未登録です。フィード管理ページで登録してください。"
                : "該当する記事がありません。絞り込み条件を変更してください。"}
          </p>
        </div>
      )}

      {!loading && !error && collapsedArticles.length > 0 && (
        <div className="space-y-3">
          {collapsedArticles.map(({ article, duplicateCount }) => (
            <ArticleCard
              key={article.id}
              article={article}
              onToggleRead={toggleRead}
              onToggleStar={toggleStar}
              matchedKeywords={matchWatchKeywords(
                article.title,
                article.snippet,
                keywords
              )}
              duplicateCount={duplicateCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
