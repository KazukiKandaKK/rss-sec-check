import { Feed } from "../types";

interface FeedListProps {
  feeds: Feed[];
  onToggleEnabled: (feed: Feed) => void;
  onDelete: (feed: Feed) => void;
}

export function FeedList({ feeds, onToggleEnabled, onDelete }: FeedListProps) {
  if (feeds.length === 0) {
    return <div className="text-gray-500">フィードが登録されていません。</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold">有効</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">名前</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">カテゴリ</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">URL</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">削除</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-700">
          {feeds.map((feed) => (
            <tr key={feed.id}>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={feed.enabled}
                  onChange={() => onToggleEnabled(feed)}
                  className="h-4 w-4"
                />
              </td>
              <td className="px-4 py-2 text-sm font-medium">{feed.name}</td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                {feed.category || "-"}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                <a
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {feed.url}
                </a>
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => onDelete(feed)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
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
