"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Component, type ErrorInfo, type ReactNode } from "react"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ErrorBoundary")

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Global error boundary component that catches all unhandled errors and rejections
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.errorSync("AppErrorBoundary caught an error", {
      error,
      componentStack: errorInfo.componentStack,
    })
  }

  componentDidMount() {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection)
  }

  componentWillUnmount() {
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection)
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault()
    this.setState({
      hasError: true,
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-oid="q2iuz-.">
          <div
            className="mx-4 flex max-w-md flex-col items-center rounded-lg border bg-background p-6 text-center shadow-lg"
            data-oid="qo052py"
          >
            <AlertTriangle className="mb-4 h-12 w-12 text-destructive" data-oid="yk_93_q" />
            <h3 className="mb-2 text-lg font-semibold" data-oid="kez4u1k">
              An error occurred
            </h3>
            <p className="mb-4 text-sm text-muted-foreground" data-oid="j95yt5x">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              data-oid="rk.-9ga"
            >
              <RefreshCw className="h-4 w-4" data-oid=":ff8dco" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
