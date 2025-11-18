/**
 * Hook для управления историей планов монтажа
 * Позволяет сохранять, загружать и переключаться между планами
 */

import { useCallback, useState } from "react"

import { createLogger } from "@/lib/tauri-logger"

import type { MontagePlan } from "../types/montage-plan"

const logger = createLogger("useMontagePlanHistory")

const STORAGE_KEY = "montage-plans-history"
const MAX_HISTORY_SIZE = 20 // Максимум сохраненных планов

export interface MontagePlanHistoryEntry {
  id: string
  plan: MontagePlan
  savedAt: Date
  appliedAt?: Date // Когда план был применен к timeline
  isApplied: boolean
}

export interface UseMontagePlanHistoryReturn {
  /** Список всех планов в истории */
  history: MontagePlanHistoryEntry[]
  /** Добавить новый план в историю */
  addToHistory: (plan: MontagePlan) => void
  /** Удалить план из истории */
  removeFromHistory: (planId: string) => void
  /** Очистить всю историю */
  clearHistory: () => void
  /** Отметить план как примененный */
  markAsApplied: (planId: string) => void
  /** Получить план по ID */
  getPlanById: (planId: string) => MontagePlan | null
  /** Получить последний план */
  getLatestPlan: () => MontagePlan | null
  /** Получить все примененные планы */
  getAppliedPlans: () => MontagePlanHistoryEntry[]
}

/**
 * Hook для управления историей планов монтажа
 */
export function useMontagePlanHistory(): UseMontagePlanHistoryReturn {
  const [history, setHistory] = useState<MontagePlanHistoryEntry[]>(() => {
    // Загружаем историю из localStorage при инициализации
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Преобразуем строки дат обратно в Date объекты
        return parsed.map((entry: any) => ({
          ...entry,
          savedAt: new Date(entry.savedAt),
          appliedAt: entry.appliedAt ? new Date(entry.appliedAt) : undefined,
          plan: {
            ...entry.plan,
            createdAt: new Date(entry.plan.createdAt),
            updatedAt: entry.plan.updatedAt ? new Date(entry.plan.updatedAt) : undefined,
          },
        }))
      }
    } catch (error) {
      logger.errorSync("[useMontagePlanHistory] Failed to load history from localStorage", error as any)
    }
    return []
  })

  // Сохранить историю в localStorage
  const saveToStorage = useCallback((newHistory: MontagePlanHistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    } catch (error) {
      logger.errorSync("[useMontagePlanHistory] Failed to save history to localStorage", error as any)
    }
  }, [])

  // Добавить новый план в историю
  const addToHistory = useCallback(
    (plan: MontagePlan) => {
      const entry: MontagePlanHistoryEntry = {
        id: `history-${plan.id}-${Date.now()}`,
        plan,
        savedAt: new Date(),
        isApplied: false,
      }

      setHistory((prev) => {
        // Добавляем в начало списка
        let newHistory = [entry, ...prev]

        // Ограничиваем размер истории
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory = newHistory.slice(0, MAX_HISTORY_SIZE)
        }

        saveToStorage(newHistory)
        logger.infoSync(`[useMontagePlanHistory] Added plan to history: ${plan.id}`)

        return newHistory
      })
    },
    [saveToStorage],
  )

  // Удалить план из истории
  const removeFromHistory = useCallback(
    (planId: string) => {
      setHistory((prev) => {
        const newHistory = prev.filter((entry) => entry.id !== planId)
        saveToStorage(newHistory)
        logger.infoSync(`[useMontagePlanHistory] Removed plan from history: ${planId}`)
        return newHistory
      })
    },
    [saveToStorage],
  )

  // Очистить всю историю
  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
    logger.infoSync("[useMontagePlanHistory] Cleared all history")
  }, [])

  // Отметить план как примененный
  const markAsApplied = useCallback(
    (planId: string) => {
      setHistory((prev) => {
        const newHistory = prev.map((entry) =>
          entry.id === planId
            ? {
                ...entry,
                isApplied: true,
                appliedAt: new Date(),
              }
            : entry,
        )
        saveToStorage(newHistory)
        logger.infoSync(`[useMontagePlanHistory] Marked plan as applied: ${planId}`)
        return newHistory
      })
    },
    [saveToStorage],
  )

  // Получить план по ID
  const getPlanById = useCallback(
    (planId: string): MontagePlan | null => {
      const entry = history.find((e) => e.id === planId || e.plan.id === planId)
      return entry ? entry.plan : null
    },
    [history],
  )

  // Получить последний план
  const getLatestPlan = useCallback((): MontagePlan | null => {
    return history.length > 0 ? history[0].plan : null
  }, [history])

  // Получить все примененные планы
  const getAppliedPlans = useCallback((): MontagePlanHistoryEntry[] => {
    return history.filter((entry) => entry.isApplied)
  }, [history])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    markAsApplied,
    getPlanById,
    getLatestPlan,
    getAppliedPlans,
  }
}
