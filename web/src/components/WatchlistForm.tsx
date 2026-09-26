import { useEffect, useState } from "react";
import { normalizeKeywords } from "../domain/services/watchlist";

interface WatchlistFormProps {
  keywords: string[];
  loading: boolean;
  onSave: (keywords: string[]) => Promise<void>;
}

export function WatchlistForm({
  keywords,
  loading,
  onSave,
}: WatchlistFormProps) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Firestore の内容をフォームに反映(編集中でなければ)
  useEffect(() => {
    setInput(keywords.join(", "));
  }, [keywords]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const next = normalizeKeywords(input.split(","));
      await onSave(next);
    } catch (error) {
      console.error("Failed to save watchlist:", error);
      setSaveError("保存に失敗しました。時間をおいて再試行してください。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
        ウォッチキーワード
      </h2>
      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        カンマ区切りで登録します（最大50件）。一致した記事はハイライトされ、「ウォッチ」フィルタと通知ダイジェストの対象になります。
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="watchlist-input" className="sr-only">
          ウォッチキーワード
        </label>
        <input
          id="watchlist-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例: AWS, Cognito, OpenSSL, supply chain"
          disabled={loading}
          className="w-full flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-offset-gray-950"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loading}
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 disabled:opacity-50 dark:focus-visible:ring-offset-gray-950"
        >
          保存
        </button>
      </div>
      {saveError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {saveError}
        </p>
      )}
    </section>
  );
}
