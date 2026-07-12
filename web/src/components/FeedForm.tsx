import { useState } from "react";

interface FeedFormProps {
  onSubmit: (feed: { url: string; name: string; category: string; enabled: boolean }) => Promise<void>;
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
      className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 space-y-3"
    >
      <h3 className="font-semibold">フィード追加</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="RSS URL"
          required
          className="px-3 py-2 rounded-md border dark:bg-gray-900 dark:border-gray-600"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="表示名"
          required
          className="px-3 py-2 rounded-md border dark:bg-gray-900 dark:border-gray-600"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="カテゴリ（任意）"
          className="px-3 py-2 rounded-md border dark:bg-gray-900 dark:border-gray-600"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        追加
      </button>
    </form>
  );
}
