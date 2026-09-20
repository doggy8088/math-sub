import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** 攔截未預期的錯誤，避免整個遊戲變成空白畫面。 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("遊戲發生未預期的錯誤", error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl" aria-hidden="true">
          🧱
        </div>
        <h1 className="text-2xl font-black text-slate-800">哎呀，遊戲卡住了</h1>
        <p className="font-bold text-slate-600">
          請先重新載入頁面；如果一直失敗，換成最新版的 Chrome、Edge 或 Safari 再試一次。
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-2xl bg-indigo-500 px-6 py-3 text-lg font-black text-white shadow-lg hover:bg-indigo-600"
        >
          🔄 重新載入
        </button>
        <details className="w-full text-left">
          <summary className="cursor-pointer text-xs font-bold text-slate-500">技術細節</summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-rose-200">
            {error.message}
          </pre>
        </details>
      </main>
    );
  }
}
