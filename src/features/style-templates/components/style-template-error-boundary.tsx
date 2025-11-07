import { AlertTriangle, RefreshCw } from "lucide-react"
import type React from "react"
import { Component, type ErrorInfo, type ReactNode } from "react"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "StyleTemplateErrorBoundary" })

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary для стилистических шаблонов
 * Перехватывает ошибки и показывает fallback UI
 */
export class StyleTemplateErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Обновляем состояние, чтобы показать fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логируем ошибку для отладки (используем sync версию для Error Boundary)
    logger.errorSync("StyleTemplateErrorBoundary caught an error", { error, errorInfo })
  }

  handleRetry = () => {
    // Сбрасываем состояние ошибки для повторной попытки
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Показываем fallback UI если есть ошибка
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-red-500 bg-red-50 p-6 text-center dark:bg-red-900/20">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">Ошибка загрузки шаблонов</h3>
          <p className="mb-4 text-sm text-red-600 dark:text-red-300">
            {this.state.error?.message || "Произошла неизвестная ошибка"}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Попробовать снова
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC для оборачивания компонентов в Error Boundary
 */
export function withStyleTemplateErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  return function WrappedComponent(props: P) {
    return (
      <StyleTemplateErrorBoundary fallback={fallback}>
        <Component {...props} />
      </StyleTemplateErrorBoundary>
    )
  }
}
