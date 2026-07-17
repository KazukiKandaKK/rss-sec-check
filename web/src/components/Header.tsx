import { useAuth } from "../hooks/useAuth";

interface HeaderProps {
  currentPage: "home" | "feeds";
  onChangePage: (page: "home" | "feeds") => void;
}

export function Header({ currentPage, onChangePage }: HeaderProps) {
  const { user, isOwner, signIn, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:text-gray-100 dark:focus-visible:ring-offset-gray-950"
            onClick={(e) => {
              e.preventDefault();
              onChangePage("home");
            }}
          >
            <img
              src="/favicon.svg"
              alt=""
              className="h-6 w-6"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Security News Reader</span>
            <span className="sm:hidden">News</span>
          </a>
          <nav className="flex gap-1" aria-label="ページナビゲーション">
            <button
              onClick={() => onChangePage("home")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950 ${
                currentPage === "home"
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
              aria-current={currentPage === "home" ? "page" : undefined}
            >
              ホーム
            </button>
            {isOwner && (
              <button
                onClick={() => onChangePage("feeds")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950 ${
                  currentPage === "feeds"
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
                aria-current={currentPage === "feeds" ? "page" : undefined}
              >
                フィード
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-600 dark:text-gray-300 sm:inline">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-offset-gray-950"
              >
                サインアウト
              </button>
            </>
          ) : (
            <button
              onClick={signIn}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950"
            >
              サインイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
