import { AlertCircle, RefreshCw } from "lucide-react"
import React, { Component, type ErrorInfo, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("video-player:error-boundary")

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary для видеоплеера
 *
 * Перехватывает ошибки рендеринга и предоставляет fallback UI
 *
 * @example
 * ```tsx
 * <PlayerErrorBoundary>
 *   <VideoPlayer />
 * </PlayerErrorBoundary>
 * ```
 */
export class PlayerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Video player error caught by boundary", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Если предоставлен кастомный fallback
      if (fallback) {
        return fallback(error, this.handleReset)
      }

      // Дефолтный fallback UI
      return <DefaultErrorFallback error={error} onReset={this.handleReset} data-oid="arqwek1" />
    }

    return children
  }
}

interface DefaultErrorFallbackProps {
  error: Error
  onReset: () => void
}

/**
 * Дефолтный fallback UI при ошибке
 */
function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black p-8 text-white" data-oid="8sx4zdw">
      <div className="flex max-w-md flex-col items-center gap-6 text-center" data-oid="otje78g">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20" data-oid="x87c6to">
          <AlertCircle className="h-8 w-8 text-red-500" data-oid="po645ka" />
        </div>

        <div className="space-y-2" data-oid="kanhrfp">
          <h2 className="text-2xl font-bold" data-oid="sdueeb0">
            Ошибка видеоплеера
          </h2>
          <p className="text-sm text-gray-400" data-oid="3or-nl-">
            Произошла ошибка при воспроизведении видео. Попробуйте обновить плеер или перезагрузить приложение.
          </p>
        </div>

        {/* Детали ошибки (опционально, для debugging) */}
        {process.env.NODE_ENV === "development" && (
          <details className="w-full max-w-md" data-oid="z66t980">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400" data-oid="4cvbmr5">
              Показать детали ошибки
            </summary>
            <pre
              className="mt-2 max-h-40 overflow-auto rounded bg-gray-900 p-3 text-left text-xs text-red-400"
              data-oid="w2sg608"
            >
              {error.message}
              {"\n\n"}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-3" data-oid="dd.l:1e">
          <Button onClick={onReset} variant="default" size="lg" className="gap-2" data-oid="0gxa:0z">
            <RefreshCw className="h-4 w-4" data-oid="j-hnh9q" />
            Обновить плеер
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="lg"
            className="border-gray-700 hover:bg-gray-800"
            data-oid="5mh9bh-"
          >
            Перезагрузить приложение
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Хук для использования error boundary в функциональных компонентах
 *
 * @example
 * ```tsx
 * function VideoPlayer() {
 *   const throwError = usePlayerErrorHandler()
 *
 *   try {
 *     // ... код плеера
 *   } catch (error) {
 *     throwError(error)
 *   }
 * }
 * ```
 */
export function usePlayerErrorHandler() {
  const [, setState] = React.useState()

  return React.useCallback((error: Error) => {
    setState(() => {
      throw error
    })
  }, [])
}
