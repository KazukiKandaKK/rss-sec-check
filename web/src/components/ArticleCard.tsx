import { Article } from "../types";
import { formatRelativeTime, formatAbsoluteTime } from "../lib/formatTime";
import { SourceBadge } from "./SourceBadge";
import { StarIcon, StarOutlineIcon, CheckIcon } from "./Icons";

interface ArticleCardProps {
  article: Article;
  onToggleRead: (article: Article) => void;
  onToggleStar: (article: Article) => void;
}

export function ArticleCard({
  article,
  onToggleRead,
  onToggleStar,
}: ArticleCardProps) {
  const published = article.publishedAt?.toDate
    ? article.publishedAt.toDate()
    : new Date();

  return (
    <article
      className={`relative rounded-lg border bg-white p-4 transition dark:bg-gray-900 ${
        article.read
          ? "border-gray-200 dark:border-gray-800"
          : "border-l-4 border-l-blue-500 border-gray-200 dark:border-gray-800 dark:border-l-blue-400"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2
            className={`text-lg leading-snug ${
              article.read
                ? "font-medium text-gray-600 dark:text-gray-400"
                : "font-semibold text-gray-900 dark:text-gray-100"
            }`}
          >
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950"
              onClick={() => !article.read && onToggleRead(article)}
            >
              {article.title}
            </a>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <SourceBadge name={article.source} />
            <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">
              /
            </span>
            <time
              className="text-gray-500 dark:text-gray-500"
              dateTime={published.toISOString()}
              title={formatAbsoluteTime(published)}
            >
              {formatRelativeTime(published)}
            </time>
          </div>
          <p
            className={`mt-2 line-clamp-3 text-sm ${
              article.read
                ? "text-gray-500 dark:text-gray-500"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {article.snippet}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <button
            onClick={() => onToggleRead(article)}
            className={`inline-flex min-h-[2.75rem] min-w-[4.5rem] items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950 ${
              article.read
                ? "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
            }`}
            aria-label={article.read ? "未読にする" : "既読にする"}
            title={article.read ? "未読にする" : "既読にする"}
          >
            {article.read && (
              <CheckIcon className="h-4 w-4" />
            )}
            {article.read ? "未読" : "既読"}
          </button>
          <button
            onClick={() => onToggleStar(article)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950 ${
              article.starred
                ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900"
                : "border-gray-200 bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label={article.starred ? "スター解除" : "スター"}
            title={article.starred ? "スター解除" : "スター"}
          >
            {article.starred ? (
              <StarIcon className="h-5 w-5" />
            ) : (
              <StarOutlineIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
