import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Article } from "../types";

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
      className={`p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 transition ${
        article.read ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold leading-tight">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => !article.read && onToggleRead(article)}
            >
              {article.title}
            </a>
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">{article.source}</span>
            <span>•</span>
            <span>{formatDistanceToNow(published, { addSuffix: true, locale: ja })}</span>
          </div>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
            {article.snippet}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onToggleRead(article)}
            className={`px-3 py-1 text-xs rounded-md border ${
              article.read
                ? "bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-200"
            }`}
            aria-label={article.read ? "未読にする" : "既読にする"}
          >
            {article.read ? "未読" : "既読"}
          </button>
          <button
            onClick={() => onToggleStar(article)}
            className={`px-3 py-1 text-xs rounded-md border ${
              article.starred
                ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200"
                : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            }`}
            aria-label={article.starred ? "スター解除" : "スター"}
          >
            {article.starred ? "★" : "☆"}
          </button>
        </div>
      </div>
    </article>
  );
}
