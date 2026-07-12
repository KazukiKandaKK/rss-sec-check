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
  starred: "スター付き",
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
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as ArticleFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filter === key
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          className="px-3 py-1.5 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
        >
          <option value="all">すべてのソース</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="タイトル・スニペットで検索"
          className="px-3 py-1.5 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-600 text-sm min-w-[240px]"
        />
      </div>
    </div>
  );
}
