import { ArticleFilter } from "../types";

interface ArticleFiltersProps {
  filter: ArticleFilter;
  source: string;
  search: string;
  sources: string[];
  onFilterChange: (filter: ArticleFilter) => void;
  onSourceChange: (source: string) => void;
  onSearchChange: (search: string) => void;
}

const FILTER_LABELS: Record<ArticleFilter, string> = {
  all: "すべて",
  unread: "未読",
  starred: "スター",
};

export function ArticleFilters({
  filter,
  source,
  search,
  sources,
  onFilterChange,
  onSourceChange,
  onSearchChange,
}: ArticleFiltersProps) {
  const hasSourceFilter = source !== "all";
  const hasSearchFilter = search.trim().length > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="記事絞り込み">
        {(Object.keys(FILTER_LABELS) as ArticleFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950 ${
              filter === key
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
            aria-pressed={filter === key}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative">
          <label htmlFor="source-filter" className="sr-only">
            ソースで絞り込み
          </label>
          <select
            id="source-filter"
            value={source}
            onChange={(e) => onSourceChange(e.target.value)}
            className="w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:ring-offset-gray-950 sm:w-auto"
          >
            <option value="all">すべてのソース</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {hasSourceFilter && (
            <button
              onClick={() => onSourceChange("all")}
              className="absolute right-7 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label="ソース絞り込みを解除"
              title="ソース絞り込みを解除"
            >
              ×
            </button>
          )}
        </div>
        <div className="relative">
          <label htmlFor="search-filter" className="sr-only">
            検索
          </label>
          <input
            id="search-filter"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="タイトル・スニペットで検索"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-offset-gray-950 sm:w-64"
          />
          {hasSearchFilter && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label="検索をクリア"
              title="検索をクリア"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
