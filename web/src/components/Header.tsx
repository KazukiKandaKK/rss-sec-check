import { useAuth } from "../hooks/useAuth";

interface HeaderProps {
  currentPage: "home" | "feeds";
  onChangePage: (page: "home" | "feeds") => void;
}

export function Header({ currentPage, onChangePage }: HeaderProps) {
  const { user, isOwner, signIn, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">RSS Security News</h1>
          <nav className="flex gap-2">
            <button
              onClick={() => onChangePage("home")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === "home"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              ホーム
            </button>
            {isOwner && (
              <button
                onClick={() => onChangePage("feeds")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentPage === "feeds"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                フィード管理
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                サインアウト
              </button>
            </>
          ) : (
            <button
              onClick={signIn}
              className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Google サインイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
