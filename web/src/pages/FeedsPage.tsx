import { FeedForm } from "../components/FeedForm";
import { FeedList } from "../components/FeedList";
import { useFeeds } from "../hooks/useFeeds";

export function FeedsPage() {
  const { feeds, loading, addFeed, updateFeed, deleteFeed } = useFeeds();

  const handleToggleEnabled = (feed: { id: string; enabled: boolean }) => {
    updateFeed(feed.id, { enabled: !feed.enabled });
  };

  const handleDelete = (feed: { id: string; name: string }) => {
    if (
      confirm(
        `「${feed.name}」を削除しますか？この操作は元に戻せません。`
      )
    ) {
      deleteFeed(feed.id);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="space-y-6">
        <FeedForm onSubmit={addFeed} />
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-12 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
              aria-hidden="true"
            />
            読み込み中…
          </div>
        ) : (
          <FeedList
            feeds={feeds}
            onToggleEnabled={handleToggleEnabled}
            onDelete={handleDelete}
          />
        )}
      </div>
    </main>
  );
}
