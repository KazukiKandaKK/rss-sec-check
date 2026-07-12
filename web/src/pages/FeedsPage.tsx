import { FeedForm } from "../components/FeedForm";
import { FeedList } from "../components/FeedList";
import { useFeeds } from "../hooks/useFeeds";

export function FeedsPage() {
  const { feeds, loading, addFeed, updateFeed, deleteFeed } = useFeeds();

  const handleToggleEnabled = (feed: { id: string; enabled: boolean }) => {
    updateFeed(feed.id, { enabled: !feed.enabled });
  };

  const handleDelete = (feed: { id: string }) => {
    if (confirm("このフィードを削除しますか？")) {
      deleteFeed(feed.id);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <FeedForm onSubmit={addFeed} />
      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中…</div>
      ) : (
        <FeedList
          feeds={feeds}
          onToggleEnabled={handleToggleEnabled}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}
