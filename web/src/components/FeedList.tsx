import { Feed } from "../types";

interface FeedListProps {
  feeds: Feed[];
  onToggleEnabled: (feed: Feed) => void;
  onDelete: (feed: Feed) => void;
}

export function FeedList({ feeds, onToggleEnabled, onDelete }: FeedListProps) {
  if (feeds.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        フィードが登録されていません。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="min-w-full bg-white dark:bg-gray-900">
        <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
              有効
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
              名前
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
              カテゴリ
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
              URL
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
              削除
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {feeds.map((feed) => (
            <tr key={feed.id}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={feed.enabled}
                  onChange={() => onToggleEnabled(feed)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                  aria-label={`${feed.name}を有効化/無効化`}
                />
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                {feed.name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {feed.category || "-"}
              </td>
              <td className="max-w-xs px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                <a
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                  title={feed.url}
                >
                  {feed.url}
                </a>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(feed)}
                  className="rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:text-red-400 dark:hover:bg-red-950 dark:focus-visible:ring-offset-gray-950"
                  aria-label={`${feed.name}を削除`}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
