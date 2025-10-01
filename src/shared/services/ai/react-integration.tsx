/**
 * React Integration for AI Services DI Container
 * Обеспечивает интеграцию DI контейнера с React компонентами
 */

import type { ReactNode } from "react"
import React, { createContext, useContext, useEffect, useState } from "react"

import { type AIDIContainer, initializeAIServices } from "./di-container"
import type { IUnifiedAIService } from "./providers/interfaces"

// Типы для AI сервисов доступных в React
export interface AIServices {
  container: AIDIContainer
  aiService?: IUnifiedAIService
  ffmpegService?: any
  visionService?: any
  contentAnalysisService?: any
  isInitialized: boolean
}

// Context для AI сервисов
const AIServicesContext = createContext<AIServices | null>(null)

// Provider props
interface AIServicesProviderProps {
  children: ReactNode
  config?: any
}

/**
 * Provider для AI сервисов
 * Инициализирует DI контейнер и предоставляет сервисы React компонентам
 */
export function AIServicesProvider({ children, config }: AIServicesProviderProps) {
  const [services, setServices] = useState<AIServices>({
    container: null as any,
    isInitialized: false,
  })

  useEffect(() => {
    let mounted = true

    async function initializeServices() {
      try {
        // Инициализируем AI сервисы
        const container = await initializeAIServices(config)

        // Инициализируем контейнер
        await container.initialize()

        if (mounted) {
          // Резолвим основные сервисы
          const [aiService, ffmpeg, vision, content] = await Promise.all([
            container.resolve("UnifiedAIService"),
            container.resolve("FFmpegService"),
            container.resolve("VisionService"),
            container.resolve("ContentAnalysisService"),
          ])

          setServices({
            container,
            aiService: aiService as any,
            ffmpegService: ffmpeg,
            visionService: vision,
            contentAnalysisService: content,
            isInitialized: true,
          })
        }
      } catch (error) {
        console.error("Failed to initialize AI services:", error)
        if (mounted) {
          setServices((prev) => ({
            ...prev,
            error: error as Error,
            isInitialized: false,
          }))
        }
      }
    }

    initializeServices()

    return () => {
      mounted = false
    }
  }, [config])

  return <AIServicesContext.Provider value={services}>{children}</AIServicesContext.Provider>
}

/**
 * Hook для доступа к AI сервисам
 */
export function useAIServices(): AIServices {
  const context = useContext(AIServicesContext)
  if (!context) {
    throw new Error("useAIServices must be used within AIServicesProvider")
  }
  return context
}

/**
 * Hook для доступа к UnifiedAIService
 */
export function useAIService(): IUnifiedAIService | undefined {
  const { aiService } = useAIServices()
  return aiService
}

/**
 * Hook для lazy loading сервиса
 */
export function useAIServiceLazy<T>(serviceName: string): {
  service: T | undefined
  loading: boolean
  error: Error | null
} {
  const { container, isInitialized } = useAIServices()
  const [state, setState] = useState<{
    service: T | undefined
    loading: boolean
    error: Error | null
  }>({
    service: undefined,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!isInitialized) return

    let mounted = true
    setState((prev) => ({ ...prev, loading: true }))

    container
      .resolve<T>(serviceName)
      .then((service) => {
        if (mounted) {
          setState({ service, loading: false, error: null })
        }
      })
      .catch((error) => {
        if (mounted) {
          setState({ service: undefined, loading: false, error })
        }
      })

    return () => {
      mounted = false
    }
  }, [container, serviceName, isInitialized])

  return state
}

/**
 * HOC для инъекции AI сервисов в компоненты
 */
export function withAIServices<P extends object>(
  Component: React.ComponentType<P & { aiServices: AIServices }>,
): React.ComponentType<P> {
  return function WithAIServicesComponent(props: P) {
    const aiServices = useAIServices()
    return <Component {...props} aiServices={aiServices} />
  }
}
