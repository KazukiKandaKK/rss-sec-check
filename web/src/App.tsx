import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { FeedsPage } from "./pages/FeedsPage";
import { useAuth } from "./hooks/useAuth";
import { useFeeds } from "./hooks/useFeeds";

function App() {
  const [page, setPage] = useState<"home" | "feeds">("home");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("darkMode");
    if (stored != null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const { user, loading, isOwner, signIn } = useAuth();
  const { feeds } = useFeeds();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const sources = feeds.map((feed) => feed.name);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        読み込み中…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-gray-900">
        <h1 className="text-2xl font-bold">RSS Security News</h1>
        <p className="text-gray-600 dark:text-gray-400">
          続けるには Google サインインが必要です。
        </p>
        <button
          onClick={signIn}
          className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Google サインイン
        </button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-gray-900">
        <h1 className="text-2xl font-bold">権限がありません</h1>
        <p className="text-gray-600 dark:text-gray-400">
          このアプリは所有者のみアクセスできます。
        </p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header currentPage={page} onChangePage={setPage} />
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setDarkMode((prev) => !prev)}
          className="rounded-full bg-white dark:bg-gray-800 p-3 shadow-md border dark:border-gray-700"
          aria-label="ダークモード切り替え"
        >
          {darkMode ? "🌙" : "☀️"}
        </button>
      </div>
      {page === "home" ? <HomePage sources={sources} /> : <FeedsPage />}
    </div>
  );
}

export default App;
