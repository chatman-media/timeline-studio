/**
 * HTTP Client for Timeline Studio Node Backend
 *
 * Базовый HTTP клиент для подключения к src-node серверу
 */

export interface HttpClientOptions {
  baseUrl: string
  timeout?: number
  headers?: Record<string, string>
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export class HttpClient {
  private baseUrl: string
  private timeout: number
  private headers: Record<string, string>

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "")
    this.timeout = options.timeout || 30000
    this.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path)
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body)
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body)
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body)
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path)
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()
      return data as ApiResponse<T>
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          error: {
            code: "TIMEOUT",
            message: `Request to ${url} timed out after ${this.timeout}ms`,
          },
        }
      }

      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
        },
      }
    }
  }

  /**
   * Check if server is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get<{ status: string }>("/api/health")
      return response.success && response.data?.status === "healthy"
    } catch {
      return false
    }
  }

  /**
   * Update base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, "")
  }
}
