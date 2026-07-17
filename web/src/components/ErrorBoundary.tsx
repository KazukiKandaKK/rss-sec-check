import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              表示中にエラーが発生しました
            </h1>
            <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
              {this.state.error?.message || "予期しないエラーです。ページを再読み込みしてください。"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950"
            >
              再読み込み
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
