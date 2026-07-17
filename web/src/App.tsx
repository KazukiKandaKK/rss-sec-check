import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { FeedsPage } from "./pages/FeedsPage";
import { useAuth } from "./hooks/useAuth";
import { useFeeds } from "./hooks/useFeeds";
import { SunIcon, MoonIcon } from "./components/Icons";

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
      <div className="flex h-screen items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
          aria-hidden="true"
        />
        読み込み中…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.svg"
            alt=""
            className="h-10 w-10"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Security News Reader
          </h1>
        </div>
        <p className="text-center text-gray-600 dark:text-gray-400">
          個人用のセキュリティニュースリーダーです。
          <br className="hidden sm:block" />
          続けるには Google サインインが必要です。
        </p>
        <button
          onClick={signIn}
          className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.194 4.27-4.255 5.566l6.878 5.339C22.505 21.831 24.5 17.36 24.5 12.39c0-.86-.077-1.69-.223-2.489H12.545v3.338H.815v-6.67h11.73v3.331z" />
          </svg>
          Google サインイン
        </button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          権限がありません
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          このアプリは所有者のみアクセスできます。
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">{user.email}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header currentPage={page} onChangePage={setPage} />
      <button
        onClick={() => setDarkMode((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-offset-gray-950"
        aria-label={darkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        title={darkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      >
        {darkMode ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </button>
      {page === "home" ? <HomePage sources={sources} /> : <FeedsPage />}
    </div>
  );
}

export default App;
