/**
 * Hook для Scenario Wizard UI
 * Управляет пошаговой навигацией и состоянием wizard'а
 */

import type { TimelineStudioProject } from "@timeline-studio/core/types/project"
import { useCallback, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"

import type { Scenario, ScenarioStep } from "../types/scenario"

const logger = createLogger("useScenarioWizard")

export interface UseScenarioWizardOptions {
  /** Сценарий для wizard'а */
  scenario: Scenario

  /** Текущий проект */
  project: TimelineStudioProject

  /** Callback при завершении wizard'а */
  onComplete?: (data: WizardData) => void

  /** Callback при отмене */
  onCancel?: () => void

  /** Callback при изменении шага */
  onStepChange?: (step: number) => void

  /** Разрешить возврат к предыдущим шагам */
  allowBackNavigation?: boolean

  /** Разрешить пропуск опциональных шагов */
  allowSkipOptional?: boolean
}

export interface WizardStepState {
  /** Текущий шаг */
  step: ScenarioStep

  /** Индекс шага */
  index: number

  /** Завершен ли шаг */
  completed: boolean

  /** Пропущен ли шаг */
  skipped: boolean

  /** Данные шага */
  data: unknown

  /** Ошибка валидации */
  error: string | null

  /** Валиден ли шаг */
  isValid: boolean
}

export interface WizardData {
  /** Данные всех шагов */
  steps: Record<string, unknown>

  /** Завершенные шаги */
  completedSteps: string[]

  /** Пропущенные шаги */
  skippedSteps: string[]
}

export interface UseScenarioWizardReturn {
  // Состояние
  currentStepIndex: number
  currentStep: WizardStepState | null
  allSteps: WizardStepState[]
  isFirstStep: boolean
  isLastStep: boolean
  canGoNext: boolean
  canGoBack: boolean
  canSkip: boolean
  isCompleted: boolean

  // Прогресс
  progress: number
  completedCount: number
  totalCount: number

  // Данные
  wizardData: WizardData

  // Навигация
  goNext: () => void
  goBack: () => void
  goToStep: (index: number) => void
  skipStep: () => void

  // Управление данными
  setStepData: (stepId: string, data: unknown) => void
  getStepData: (stepId: string) => unknown
  clearStepData: (stepId: string) => void

  // Валидация
  validateCurrentStep: () => boolean
  validateStep: (stepId: string) => boolean

  // Завершение
  complete: () => void
  cancel: () => void
  reset: () => void
}

export function useScenarioWizard(options: UseScenarioWizardOptions): UseScenarioWizardReturn {
  const {
    scenario,
    project,
    onComplete,
    onCancel,
    onStepChange,
    allowBackNavigation = true,
    allowSkipOptional = true,
  } = options

  // Текущий индекс шага
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Состояние всех шагов
  const [stepsState, setStepsState] = useState<Map<string, WizardStepState>>(() => {
    const initialState = new Map<string, WizardStepState>()

    scenario.steps.forEach((step, index) => {
      initialState.set(step.id, {
        step,
        index,
        completed: false,
        skipped: false,
        data: null,
        error: null,
        isValid: !step.validation?.required,
      })
    })

    return initialState
  })

  // Получение текущего шага
  const currentStep = scenario.steps[currentStepIndex]
  const currentStepState = currentStep ? stepsState.get(currentStep.id) || null : null

  // Массив всех состояний шагов
  const allSteps = Array.from(stepsState.values()).sort((a, b) => a.index - b.index)

  // Проверки состояния
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === scenario.steps.length - 1

  // Подсчет завершенных шагов
  const completedCount = allSteps.filter((s) => s.completed).length
  const totalCount = scenario.steps.length

  // Прогресс
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Проверка возможности перехода к следующему шагу
  const canGoNext = currentStepState?.isValid || currentStepState?.completed || false

  // Проверка возможности возврата
  const canGoBack = allowBackNavigation && !isFirstStep

  // Проверка возможности пропуска
  const canSkip = allowSkipOptional && currentStep?.optional === true

  // Проверка завершения
  const isCompleted = completedCount === totalCount

  // Сбор данных wizard'а
  const wizardData: WizardData = {
    steps: Object.fromEntries(Array.from(stepsState.entries()).map(([id, state]) => [id, state.data])),
    completedSteps: allSteps.filter((s) => s.completed).map((s) => s.step.id),
    skippedSteps: allSteps.filter((s) => s.skipped).map((s) => s.step.id),
  }

  /**
   * Валидация шага
   */
  const validateStepInternal = useCallback(
    (stepId: string): boolean => {
      const stepState = stepsState.get(stepId)
      if (!stepState) return false

      const step = stepState.step

      // Если нет валидации, шаг валиден
      if (!step.validation) return true

      // Проверка обязательности
      if (step.validation.required && !stepState.data) {
        return false
      }

      // Кастомная валидация
      if (step.validation.validator) {
        const result = step.validation.validator(stepState.data)

        if (typeof result === "string") {
          // Возвращена строка с ошибкой
          return false
        }

        return result
      }

      return true
    },
    [stepsState],
  )

  /**
   * Обновление состояния шага
   */
  const updateStepState = useCallback((stepId: string, updates: Partial<WizardStepState>) => {
    setStepsState((prev) => {
      const newState = new Map(prev)
      const current = newState.get(stepId)

      if (current) {
        newState.set(stepId, {
          ...current,
          ...updates,
        })
      }

      return newState
    })
  }, [])

  /**
   * Переход к следующему шагу
   */
  const goNext = useCallback(() => {
    if (!canGoNext) {
      logger.warn("Cannot go to next step - current step is not valid")
      return
    }

    if (isLastStep) {
      logger.info("Already at last step")
      return
    }

    // Отмечаем текущий шаг как завершенный
    if (currentStep) {
      updateStepState(currentStep.id, { completed: true })
    }

    const nextIndex = currentStepIndex + 1
    setCurrentStepIndex(nextIndex)
    onStepChange?.(nextIndex)

    logger.info("Navigated to next step", { step: nextIndex })
  }, [canGoNext, isLastStep, currentStep, currentStepIndex, updateStepState, onStepChange])

  /**
   * Возврат к предыдущему шагу
   */
  const goBack = useCallback(() => {
    if (!canGoBack) {
      logger.warn("Cannot go back")
      return
    }

    const prevIndex = currentStepIndex - 1
    setCurrentStepIndex(prevIndex)
    onStepChange?.(prevIndex)

    logger.info("Navigated to previous step", { step: prevIndex })
  }, [canGoBack, currentStepIndex, onStepChange])

  /**
   * Переход к конкретному шагу
   */
  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= scenario.steps.length) {
        logger.warn("Invalid step index", { index })
        return
      }

      // Проверяем, можем ли перейти к этому шагу
      if (!allowBackNavigation && index < currentStepIndex) {
        logger.warn("Back navigation is not allowed")
        return
      }

      setCurrentStepIndex(index)
      onStepChange?.(index)

      logger.info("Navigated to step", { step: index })
    },
    [scenario.steps.length, allowBackNavigation, currentStepIndex, onStepChange],
  )

  /**
   * Пропуск текущего шага
   */
  const skipStep = useCallback(() => {
    if (!canSkip) {
      logger.warn("Cannot skip current step")
      return
    }

    if (currentStep) {
      updateStepState(currentStep.id, { skipped: true, completed: true })
    }

    goNext()

    logger.info("Step skipped", { stepId: currentStep?.id })
  }, [canSkip, currentStep, updateStepState, goNext])

  /**
   * Установка данных шага
   */
  const setStepData = useCallback(
    (stepId: string, data: unknown) => {
      // Валидация данных
      const isValid = validateStepInternal(stepId)

      updateStepState(stepId, {
        data,
        isValid,
        error: isValid ? null : "Validation failed",
      })

      logger.debug("Step data updated", { stepId, isValid })
    },
    [validateStepInternal, updateStepState],
  )

  /**
   * Получение данных шага
   */
  const getStepData = useCallback(
    (stepId: string): unknown => {
      const stepState = stepsState.get(stepId)
      return stepState?.data || null
    },
    [stepsState],
  )

  /**
   * Очистка данных шага
   */
  const clearStepData = useCallback(
    (stepId: string) => {
      updateStepState(stepId, {
        data: null,
        isValid: false,
        completed: false,
        skipped: false,
        error: null,
      })

      logger.debug("Step data cleared", { stepId })
    },
    [updateStepState],
  )

  /**
   * Валидация текущего шага
   */
  const validateCurrentStep = useCallback((): boolean => {
    if (!currentStep) return false
    return validateStepInternal(currentStep.id)
  }, [currentStep, validateStepInternal])

  /**
   * Валидация конкретного шага
   */
  const validateStep = useCallback(
    (stepId: string): boolean => {
      return validateStepInternal(stepId)
    },
    [validateStepInternal],
  )

  /**
   * Завершение wizard'а
   */
  const complete = useCallback(() => {
    // Отмечаем текущий шаг как завершенный
    if (currentStep) {
      updateStepState(currentStep.id, { completed: true })
    }

    logger.info("Wizard completed", {
      scenarioId: scenario.id,
      completedSteps: wizardData.completedSteps.length,
    })

    onComplete?.(wizardData)
  }, [currentStep, scenario.id, wizardData, updateStepState, onComplete])

  /**
   * Отмена wizard'а
   */
  const cancel = useCallback(() => {
    logger.info("Wizard cancelled", { scenarioId: scenario.id })
    onCancel?.()
  }, [scenario.id, onCancel])

  /**
   * Сброс wizard'а
   */
  const reset = useCallback(() => {
    setCurrentStepIndex(0)

    // Сброс состояния всех шагов
    setStepsState(() => {
      const resetState = new Map<string, WizardStepState>()

      scenario.steps.forEach((step, index) => {
        resetState.set(step.id, {
          step,
          index,
          completed: false,
          skipped: false,
          data: null,
          error: null,
          isValid: !step.validation?.required,
        })
      })

      return resetState
    })

    logger.info("Wizard reset", { scenarioId: scenario.id })
  }, [scenario])

  return {
    // Состояние
    currentStepIndex,
    currentStep: currentStepState,
    allSteps,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoBack,
    canSkip,
    isCompleted,

    // Прогресс
    progress,
    completedCount,
    totalCount,

    // Данные
    wizardData,

    // Навигация
    goNext,
    goBack,
    goToStep,
    skipStep,

    // Управление данными
    setStepData,
    getStepData,
    clearStepData,

    // Валидация
    validateCurrentStep,
    validateStep,

    // Завершение
    complete,
    cancel,
    reset,
  }
}
