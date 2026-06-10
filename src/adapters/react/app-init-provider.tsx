/**
 * App Init Provider
 *
 * React провайдер для инициализации адаптеров.
 * Определяет окружение (Tauri/Browser) и регистрирует соответствующие адаптеры в контейнере.
 *
 * ВАЖНО: Этот провайдер блокирует рендеринг children до завершения инициализации,
 * чтобы гарантировать доступность DI контейнера для downstream провайдеров.
 */

"use client"

import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

import { container } from "@timeline-studio/core/container"
import type { IBackendService, IPlatformService, IStorageService } from "@timeline-studio/core/ports"
import { isDesktop } from "@/lib/environment"

async function isNodeBackendAvailable(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) })
    const json = await res.json()
    return json?.status === "ok"
  } catch {
    return false
  }
}

interface AppInitContextValue {
  initialized: boolean
  isDesktop: boolean
  backend: IBackendService | null
  platform: IPlatformService | null
  storage: IStorageService | null
}

const AppInitContext = createContext<AppInitContextValue>({
  initialized: false,
  isDesktop: false,
  backend: null,
  platform: null,
  storage: null,
})

interface AppInitProviderProps {
  children: ReactNode
  /** Показывать во время инициализации (по умолчанию null - ничего не показывать) */
  fallback?: ReactNode
}

export function AppInitProvider({ children, fallback = null }: AppInitProviderProps) {
  const [state, setState] = useState<AppInitContextValue>({
    initialized: false,
    isDesktop: false,
    backend: null,
    platform: null,
    storage: null,
  })

  useEffect(() => {
    const init = async () => {
      // Determine environment
      const desktop = isDesktop()

      if (desktop) {
        // Initialize Tauri adapters
        const { initTauriApp } = await import("@/adapters/tauri")
        await initTauriApp({ autoConnect: true })
      } else if (
        process.env.NEXT_PUBLIC_NODE_BACKEND_URL &&
        (await isNodeBackendAvailable(process.env.NEXT_PUBLIC_NODE_BACKEND_URL))
      ) {
        // Initialize HTTP adapters connecting to src-node (run `bun dev` in src-node/)
        const { initHttpApp } = await import("@/adapters/http")
        await initHttpApp({ serverUrl: process.env.NEXT_PUBLIC_NODE_BACKEND_URL })
      } else {
        // Initialize Mock adapters for browser (no backend available)
        const { initMockApp } = await import("@/adapters/mock")
        initMockApp({ useLocalStorage: true })
      }

      // Get services from container
      setState({
        initialized: true,
        isDesktop: desktop,
        backend: container.hasBackend() ? container.getBackend() : null,
        platform: container.hasPlatform() ? container.getPlatform() : null,
        storage: container.hasStorage() ? container.getStorage() : null,
      })
    }

    init().catch(console.error)
  }, [])

  // Блокируем рендеринг children до завершения инициализации
  // Это гарантирует, что DI контейнер будет готов для downstream провайдеров
  if (!state.initialized) {
    return (
      <AppInitContext.Provider value={state} data-oid="i9f3hnr">
        {fallback}
      </AppInitContext.Provider>
    )
  }

  return (
    <AppInitContext.Provider value={state} data-oid="vn_n5b0">
      {children}
    </AppInitContext.Provider>
  )
}

/**
 * Hook для доступа к состоянию инициализации
 */
export function useAppInit(): AppInitContextValue {
  return useContext(AppInitContext)
}

/**
 * Hook для проверки готовности приложения
 */
export function useAppReady(): boolean {
  const { initialized } = useContext(AppInitContext)
  return initialized
}
