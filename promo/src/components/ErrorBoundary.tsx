import type React from "react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-[#12192C] flex items-center justify-center px-6"
          data-oid="2pkx3tk"
        >
          <div className="max-w-md text-center" data-oid="htp6iyv">
            <h1
              className="text-3xl font-bold text-white mb-4"
              data-oid="f77ff4g"
            >
              Что-то пошло не так
            </h1>
            <p className="text-gray-400 mb-6" data-oid="426swow">
              Произошла ошибка при загрузке страницы. Попробуйте обновить
              страницу.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              data-oid="nsfd2na"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
