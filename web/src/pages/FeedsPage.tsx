import { useRef, useState } from "react";
import { Feed, toggleFeedEnabled } from "../domain/types";
import { FeedForm } from "../components/FeedForm";
import { FeedList } from "../components/FeedList";
import { WatchlistForm } from "../components/WatchlistForm";
import { feedsToOpml, parseOpml } from "../lib/opml";
import { useAuth } from "../hooks/useAuth";
import { useFeeds } from "../hooks/useFeeds";
import { useFeedActions } from "../hooks/useFeedActions";
import { useWatchlist } from "../hooks/useWatchlist";

export function FeedsPage() {
  const { isOwner } = useAuth();
  const { feeds, loading } = useFeeds(isOwner);
  const { addFeed, updateFeed, deleteFeed } = useFeedActions();
  const {
    keywords,
    loading: watchlistLoading,
    saveKeywords,
  } = useWatchlist(isOwner);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleToggleEnabled = (feed: Feed) => {
    const next = toggleFeedEnabled(feed);
    void updateFeed(next.id, { enabled: next.enabled });
  };

  const handleDelete = (feed: Feed) => {
    if (confirm(`「${feed.name}」を削除しますか？この操作は元に戻せません。`)) {
      void deleteFeed(feed.id);
    }
  };

  const handleExportOpml = () => {
    const opml = feedsToOpml(feeds);
    const blob = new Blob([opml], { type: "text/x-opml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rss-sec-check-feeds.opml";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportOpml = async (file: File) => {
    setImportMessage(null);
    const text = await file.text();
    const { feeds: drafts, errors } = parseOpml(text);
    if (drafts.length === 0) {
      setImportMessage(
        errors.length > 0
          ? errors.join(" / ")
          : "OPMLにフィードが見つかりませんでした。"
      );
      return;
    }

    const existingUrls = new Set(feeds.map((feed) => feed.url));
    let imported = 0;
    let failed = 0;
    for (const draft of drafts) {
      if (existingUrls.has(draft.url)) continue;
      try {
        await addFeed(draft);
        imported += 1;
      } catch (error) {
        console.error(`Failed to import feed: ${draft.url}`, error);
        failed += 1;
      }
    }
    const skipped = drafts.length - imported - failed;
    const parts = [`${imported}件インポートしました`];
    if (skipped > 0) parts.push(`${skipped}件は登録済みのためスキップ`);
    if (failed > 0) parts.push(`${failed}件は失敗`);
    if (errors.length > 0) parts.push(...errors);
    setImportMessage(parts.join(" / "));
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="space-y-6">
        <WatchlistForm
          keywords={keywords}
          loading={watchlistLoading}
          onSave={saveKeywords}
        />
        <FeedForm onSubmit={addFeed} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportOpml}
            disabled={feeds.length === 0}
            className="inline-flex min-h-[2.75rem] items-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-offset-gray-950"
          >
            OPMLエクスポート
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-[2.75rem] items-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-offset-gray-950"
          >
            OPMLインポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".opml,.xml,text/xml,text/x-opml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleImportOpml(file);
              }
              e.target.value = "";
            }}
          />
          {importMessage && (
            <p
              className="text-sm text-gray-600 dark:text-gray-400"
              role="status"
            >
              {importMessage}
            </p>
          )}
        </div>
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
