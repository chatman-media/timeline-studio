/**
 * Hook для работы со сценариями монтажа
 */

import { useMachine } from "@xstate/react"
import { useCallback, useMemo, useState } from "react"
import type { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"
import { createLogger } from "@/lib/tauri-logger"

import { allScenarios, getScenariosByCategory, getScenariosByDifficulty } from "../lib/scenarios"
import {
  type ExecuteScenarioOptions,
  type ScenarioMachineEvent,
  type StepExecutionResult,
  scenarioExecutor,
  scenarioMachine,
} from "../services"
import type { Scenario, ScenarioFilter, ScenarioResult, ScenarioSortBy } from "../types/scenario"

const logger = createLogger("useScenario")

export interface UseScenarioReturn {
  // Данные
  scenarios: Scenario[]
  selectedScenario: Scenario | null
  currentStep: number
  totalSteps: number
  progress: number

  // Результаты
  result: ScenarioResult | null
  stepResults: Map<string, StepExecutionResult>

  // Состояние
  isExecuting: boolean
  isPaused: boolean
  isCompleted: boolean
  isFailed: boolean
  error: string | null

  // Действия - выбор
  selectScenario: (id: string) => void
  clearSelection: () => void

  // Действия - выполнение
  startExecution: (project: TimelineStudioProject, options?: ExecuteScenarioOptions) => Promise<void>
  pauseExecution: () => void
  resumeExecution: () => void
  cancelExecution: () => void
  resetExecution: () => void

  // Действия - шаги
  completeStep: (result: StepExecutionResult) => void
  skipStep: () => void
  retryStep: () => void

  // Фильтрация и поиск
  filterScenarios: (filter: ScenarioFilter) => void
  searchScenarios: (query: string, lang?: "ru" | "en") => void
  sortScenarios: (sortBy: ScenarioSortBy, order?: "asc" | "desc") => void
  resetFilters: () => void

  // Утилиты
  getScenarioById: (id: string) => Scenario | undefined
  canExecute: () => boolean
  canPause: () => boolean
  canResume: () => boolean
  canCancel: () => boolean
}

export function useScenario(): UseScenarioReturn {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [project, setProject] = useState<TimelineStudioProject | null>(null)

  // Фильтры
  const [currentFilter, setCurrentFilter] = useState<ScenarioFilter | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortBy, setSortBy] = useState<ScenarioSortBy>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // XState машина
  const [state, send] = useMachine(scenarioMachine)

  // Получение сценариев с применением фильтров
  const scenarios = useMemo(() => {
    let result: Scenario[] = allScenarios

    // Применяем фильтры
    if (currentFilter) {
      if (currentFilter.category) {
        // Проверяем, что категория валидна
        const validCategories: Array<Scenario["category"]> = ["automation", "structure", "effects", "workflow"]
        if (validCategories.includes(currentFilter.category as Scenario["category"])) {
          result = getScenariosByCategory(currentFilter.category as Scenario["category"])
        }
      } else if (currentFilter.difficulty) {
        // Проверяем, что сложность валидна
        const validDifficulties: Array<Scenario["difficulty"]> = ["beginner", "intermediate", "advanced"]
        if (validDifficulties.includes(currentFilter.difficulty as Scenario["difficulty"])) {
          result = getScenariosByDifficulty(currentFilter.difficulty as Scenario["difficulty"])
        }
      }

      // Дополнительные фильтры
      if (currentFilter.aiAssisted !== undefined) {
        result = result.filter((s) => s.requirements.aiAssisted === currentFilter.aiAssisted)
      }

      if (currentFilter.estimatedTime) {
        if (currentFilter.estimatedTime.min !== undefined) {
          result = result.filter((s) => s.estimatedTime >= (currentFilter.estimatedTime?.min || 0))
        }
        if (currentFilter.estimatedTime.max !== undefined) {
          result = result.filter(
            (s) => s.estimatedTime <= (currentFilter.estimatedTime?.max || Number.POSITIVE_INFINITY),
          )
        }
      }
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.en.toLowerCase().includes(query) ||
          s.name.ru.toLowerCase().includes(query) ||
          s.description?.en.toLowerCase().includes(query) ||
          s.description?.ru.toLowerCase().includes(query),
      )
    }

    // Сортировка
    result.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.en.localeCompare(b.name.en)
          break
        case "difficulty": {
          const difficultyOrder: Record<Scenario["difficulty"], number> = { beginner: 0, intermediate: 1, advanced: 2 }
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
          break
        }
        case "time":
          comparison = a.estimatedTime - b.estimatedTime
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [currentFilter, searchQuery, sortBy, sortOrder])

  // Извлечение данных из state machine
  const currentStep = state.context.currentStepIndex
  const totalSteps = selectedScenario?.steps.length || 0
  const progress = state.context.progress
  const result = state.context.result
  const stepResults = state.context.stepResults
  const error = state.context.error

  // Статусы
  const isExecuting = state.matches("executing")
  const isPaused = state.matches("paused")
  const isCompleted = state.matches("completed")
  const isFailed = state.matches("failed")

  /**
   * Выбор сценария
   */
  const selectScenario = useCallback(
    (id: string) => {
      const scenario = scenarios.find((s) => s.id === id)
      if (scenario) {
        setSelectedScenario(scenario)
        logger.info("Scenario selected", { scenarioId: id })
      }
    },
    [scenarios],
  )

  /**
   * Очистка выбора
   */
  const clearSelection = useCallback(() => {
    setSelectedScenario(null)
    setProject(null)
  }, [])

  /**
   * Запуск выполнения сценария
   */
  const startExecution = useCallback(
    async (currentProject: TimelineStudioProject, options?: ExecuteScenarioOptions) => {
      if (!selectedScenario) {
        throw new Error("No scenario selected")
      }

      setProject(currentProject)

      // Инициализируем state machine
      send({
        type: "START",
        scenario: selectedScenario,
        project: currentProject,
        options,
      } as ScenarioMachineEvent)

      logger.info("Starting scenario execution", {
        scenarioId: selectedScenario.id,
        projectId: currentProject.metadata.id,
      })

      try {
        // Запускаем выполнение через executor
        const scenarioResult = await scenarioExecutor.executeScenario(selectedScenario, currentProject, {
          ...options,
          onProgress: (stepId: string, stepProgress: number) => {
            logger.debug("Step progress", { stepId, progress: stepProgress })
            options?.onProgress?.(stepId, stepProgress)
          },
          onStepComplete: (stepId: string, stepResult: StepExecutionResult) => {
            logger.info("Step completed", { stepId, success: stepResult.success })

            // Отправляем событие в state machine
            if (stepResult.success) {
              send({ type: "STEP_COMPLETE", result: stepResult } as ScenarioMachineEvent)
            } else {
              send({ type: "STEP_FAILED", error: stepResult.error || "Unknown error" } as ScenarioMachineEvent)
            }

            options?.onStepComplete?.(stepId, stepResult)
          },
        })

        // Завершаем выполнение
        send({ type: "SCENARIO_COMPLETE", result: scenarioResult } as ScenarioMachineEvent)

        logger.info("Scenario execution completed", {
          scenarioId: selectedScenario.id,
          status: scenarioResult.status,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        send({ type: "SCENARIO_FAILED", error: errorMessage } as ScenarioMachineEvent)
        logger.error("Scenario execution failed", { error: errorMessage })
        throw err
      }
    },
    [selectedScenario, send],
  )

  /**
   * Пауза выполнения
   */
  const pauseExecution = useCallback(() => {
    send({ type: "PAUSE" } as ScenarioMachineEvent)
    scenarioExecutor.pauseExecution()
    logger.info("Scenario execution paused")
  }, [send])

  /**
   * Возобновление выполнения
   */
  const resumeExecution = useCallback(() => {
    send({ type: "RESUME" } as ScenarioMachineEvent)
    scenarioExecutor.resumeExecution()
    logger.info("Scenario execution resumed")
  }, [send])

  /**
   * Отмена выполнения
   */
  const cancelExecution = useCallback(() => {
    send({ type: "CANCEL" } as ScenarioMachineEvent)
    scenarioExecutor.cancelExecution()
    logger.info("Scenario execution cancelled")
  }, [send])

  /**
   * Сброс состояния
   */
  const resetExecution = useCallback(() => {
    send({ type: "RESET" } as ScenarioMachineEvent)
    logger.info("Scenario execution reset")
  }, [send])

  /**
   * Завершение текущего шага
   */
  const completeStep = useCallback(
    (stepResult: StepExecutionResult) => {
      send({ type: "STEP_COMPLETE", result: stepResult } as ScenarioMachineEvent)
    },
    [send],
  )

  /**
   * Пропуск текущего шага
   */
  const skipStep = useCallback(() => {
    send({ type: "SKIP_STEP" } as ScenarioMachineEvent)
  }, [send])

  /**
   * Повтор текущего шага
   */
  const retryStep = useCallback(() => {
    send({ type: "RETRY_STEP" } as ScenarioMachineEvent)
  }, [send])

  /**
   * Фильтрация сценариев
   */
  const filterScenarios = useCallback((filter: ScenarioFilter) => {
    setCurrentFilter(filter)
    setSearchQuery("") // Сброс поиска при фильтрации
  }, [])

  /**
   * Поиск сценариев
   */
  const searchScenarios = useCallback((query: string, _lang: "ru" | "en" = "en") => {
    setSearchQuery(query)
    setCurrentFilter(null) // Сброс фильтров при поиске
  }, [])

  /**
   * Сортировка сценариев
   */
  const sortScenarios = useCallback((newSortBy: ScenarioSortBy, order: "asc" | "desc" = "asc") => {
    setSortBy(newSortBy)
    setSortOrder(order)
  }, [])

  /**
   * Сброс фильтров
   */
  const resetFilters = useCallback(() => {
    setCurrentFilter(null)
    setSearchQuery("")
    setSortBy("name")
    setSortOrder("asc")
  }, [])

  /**
   * Получение сценария по ID
   */
  const getScenarioById = useCallback(
    (id: string) => {
      return scenarios.find((s) => s.id === id)
    },
    [scenarios],
  )

  /**
   * Проверка возможности выполнения
   */
  const canExecute = useCallback(() => {
    return selectedScenario !== null && state.matches("idle")
  }, [selectedScenario, state])

  /**
   * Проверка возможности паузы
   */
  const canPause = useCallback(() => {
    return state.matches("executing")
  }, [state])

  /**
   * Проверка возможности возобновления
   */
  const canResume = useCallback(() => {
    return state.matches("paused")
  }, [state])

  /**
   * Проверка возможности отмены
   */
  const canCancel = useCallback(() => {
    return state.matches("executing") || state.matches("paused")
  }, [state])

  return {
    // Данные
    scenarios,
    selectedScenario,
    currentStep,
    totalSteps,
    progress,

    // Результаты
    result,
    stepResults,

    // Состояние
    isExecuting,
    isPaused,
    isCompleted,
    isFailed,
    error,

    // Действия - выбор
    selectScenario,
    clearSelection,

    // Действия - выполнение
    startExecution,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    resetExecution,

    // Действия - шаги
    completeStep,
    skipStep,
    retryStep,

    // Фильтрация и поиск
    filterScenarios,
    searchScenarios,
    sortScenarios,
    resetFilters,

    // Утилиты
    getScenarioById,
    canExecute,
    canPause,
    canResume,
    canCancel,
  }
}
