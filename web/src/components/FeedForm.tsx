import { useState } from "react";

interface FeedFormProps {
  onSubmit: (feed: {
    url: string;
    name: string;
    category: string;
    enabled: boolean;
  }) => Promise<void>;
}

export function FeedForm({ onSubmit }: FeedFormProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !name) return;
    setSubmitting(true);
    await onSubmit({ url, name, category, enabled: true });
    setUrl("");
    setName("");
    setCategory("");
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
    >
      <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
        フィード追加
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="feed-url" className="sr-only">
            RSS URL
          </label>
          <input
            id="feed-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="RSS URL"
            required
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-offset-gray-950"
          />
        </div>
        <div>
          <label htmlFor="feed-name" className="sr-only">
            表示名
          </label>
          <input
            id="feed-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="表示名"
            required
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-offset-gray-950"
          />
        </div>
        <div>
          <label htmlFor="feed-category" className="sr-only">
            カテゴリ
          </label>
          <input
            id="feed-category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="カテゴリ（任意）"
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-offset-gray-950"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting || !url || !name}
        className="mt-3 inline-flex min-h-[2.75rem] items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 disabled:opacity-50 dark:focus-visible:ring-offset-gray-950"
      >
        追加
      </button>
    </form>
  );
}
