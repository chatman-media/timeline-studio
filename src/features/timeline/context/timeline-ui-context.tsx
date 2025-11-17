/**
 * Timeline UI Context - Управление UI состоянием Timeline
 *
 * Предоставляет доступ к UI параметрам Timeline (timeScale, scroll, zoom и т.д.)
 */

import { createContext, type ReactNode, useCallback, useContext, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("TimelineUIContext")

export interface TimelineUIState {
  /**
   * Масштаб времени - пикселей на секунду
   * @default 60
   */
  timeScale: number

  /**
   * Позиция скролла
   */
  scrollPosition: { x: number; y: number }

  /**
   * Минимальный и максимальный масштаб
   */
  minTimeScale: number
  maxTimeScale: number
}

export interface TimelineUIContextType {
  /**
   * Текущее UI состояние
   */
  uiState: TimelineUIState

  /**
   * Установить масштаб времени
   */
  setTimeScale: (scale: number) => void

  /**
   * Установить позицию скролла
   */
  setScrollPosition: (position: { x: number; y: number }) => void

  /**
   * Zoom in/out
   */
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

const DEFAULT_UI_STATE: TimelineUIState = {
  timeScale: 60,
  scrollPosition: { x: 0, y: 0 },
  minTimeScale: 10,
  maxTimeScale: 200,
}

const TimelineUIContext = createContext<TimelineUIContextType | null>(null)

export interface TimelineUIProviderProps {
  children: ReactNode
  /**
   * Начальное состояние UI (опционально)
   */
  initialState?: Partial<TimelineUIState>
}

export function TimelineUIProvider({ children, initialState }: TimelineUIProviderProps) {
  const [uiState, setUIState] = useState<TimelineUIState>({
    ...DEFAULT_UI_STATE,
    ...initialState,
  })

  const setTimeScale = useCallback((scale: number) => {
    setUIState((prev) => {
      const newScale = Math.max(prev.minTimeScale, Math.min(prev.maxTimeScale, scale))
      logger.debug("Setting time scale:", { old: prev.timeScale, new: newScale })
      return { ...prev, timeScale: newScale }
    })
  }, [])

  const setScrollPosition = useCallback((position: { x: number; y: number }) => {
    setUIState((prev) => ({ ...prev, scrollPosition: position }))
  }, [])

  const zoomIn = useCallback(() => {
    setUIState((prev) => {
      const newScale = Math.min(prev.maxTimeScale, prev.timeScale * 1.2)
      logger.debug("Zoom in:", { old: prev.timeScale, new: newScale })
      return { ...prev, timeScale: newScale }
    })
  }, [])

  const zoomOut = useCallback(() => {
    setUIState((prev) => {
      const newScale = Math.max(prev.minTimeScale, prev.timeScale / 1.2)
      logger.debug("Zoom out:", { old: prev.timeScale, new: newScale })
      return { ...prev, timeScale: newScale }
    })
  }, [])

  const resetZoom = useCallback(() => {
    setUIState((prev) => {
      logger.debug("Reset zoom to default:", { old: prev.timeScale, new: DEFAULT_UI_STATE.timeScale })
      return { ...prev, timeScale: DEFAULT_UI_STATE.timeScale }
    })
  }, [])

  const value: TimelineUIContextType = {
    uiState,
    setTimeScale,
    setScrollPosition,
    zoomIn,
    zoomOut,
    resetZoom,
  }

  return <TimelineUIContext.Provider value={value}>{children}</TimelineUIContext.Provider>
}

/**
 * Хук для доступа к Timeline UI context
 */
export function useTimelineUI(): TimelineUIContextType {
  const context = useContext(TimelineUIContext)
  if (!context) {
    throw new Error("useTimelineUI must be used within TimelineUIProvider")
  }
  return context
}

/**
 * Хук для получения только timeScale (удобнее для часто используемого параметра)
 */
export function useTimeScale(): number {
  const { uiState } = useTimelineUI()
  return uiState.timeScale
}
