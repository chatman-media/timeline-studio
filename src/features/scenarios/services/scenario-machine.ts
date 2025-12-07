/**
 * Scenario State Machine
 * XState машина для управления состоянием выполнения сценария
 */

import { assign, setup } from "xstate"
import type { TimelineStudioProject } from "@/domains/project-management/types"
import { createLogger } from "@/lib/tauri-logger"

import type { Scenario, ScenarioResult, ScenarioStep } from "../types/scenario"
import type { ExecuteScenarioOptions, StepExecutionResult } from "./scenario-executor"

const logger = createLogger("ScenarioMachine")

/**
 * Контекст машины состояний
 */
export interface ScenarioMachineContext {
  /** Выбранный сценарий */
  scenario: Scenario | null

  /** Текущий проект */
  project: TimelineStudioProject | null

  /** Текущий шаг */
  currentStepIndex: number

  /** Текущий шаг */
  currentStep: ScenarioStep | null

  /** Прогресс выполнения (0-100) */
  progress: number

  /** Результаты выполненных шагов */
  stepResults: Map<string, StepExecutionResult>

  /** Итоговый результат */
  result: ScenarioResult | null

  /** Ошибка */
  error: string | null

  /** Опции выполнения */
  options: ExecuteScenarioOptions
}

/**
 * События машины состояний
 */
export type ScenarioMachineEvent =
  | { type: "START"; scenario: Scenario; project: TimelineStudioProject; options?: ExecuteScenarioOptions }
  | { type: "NEXT_STEP" }
  | { type: "SKIP_STEP" }
  | { type: "RETRY_STEP" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "CANCEL" }
  | { type: "RESET" }
  | { type: "STEP_COMPLETE"; result: StepExecutionResult }
  | { type: "STEP_FAILED"; error: string }
  | { type: "SCENARIO_COMPLETE"; result: ScenarioResult }
  | { type: "SCENARIO_FAILED"; error: string }

/**
 * Создание XState машины для сценариев
 */
export const scenarioMachine = setup({
  types: {
    context: {} as ScenarioMachineContext,
    events: {} as ScenarioMachineEvent,
  },
  actions: {
    /**
     * Инициализация сценария
     */
    initializeScenario: assign(({ event }) => {
      if (event.type !== "START") return {}

      logger.info("Initializing scenario", { scenarioId: event.scenario.id })

      return {
        scenario: event.scenario,
        project: event.project,
        currentStepIndex: 0,
        currentStep: event.scenario.steps[0] || null,
        progress: 0,
        stepResults: new Map(),
        result: null,
        error: null,
        options: event.options || {},
      }
    }),

    /**
     * Переход к следующему шагу
     */
    nextStep: assign(({ context }) => {
      const nextIndex = context.currentStepIndex + 1

      if (!context.scenario || nextIndex >= context.scenario.steps.length) {
        return {
          currentStep: null,
        }
      }

      logger.debug("Moving to next step", {
        currentIndex: context.currentStepIndex,
        nextIndex,
      })

      return {
        currentStepIndex: nextIndex,
        currentStep: context.scenario.steps[nextIndex],
      }
    }),

    /**
     * Обновление прогресса
     */
    updateProgress: assign(({ context }) => {
      if (!context.scenario) return {}

      const progress = ((context.currentStepIndex + 1) / context.scenario.steps.length) * 100

      return {
        progress,
      }
    }),

    /**
     * Сохранение результата шага
     */
    saveStepResult: assign(({ context, event }) => {
      if (event.type !== "STEP_COMPLETE") return {}

      const stepId = context.currentStep?.id
      if (!stepId) return {}

      const newResults = new Map(context.stepResults)
      newResults.set(stepId, event.result)

      logger.debug("Step result saved", { stepId, success: event.result.success })

      return {
        stepResults: newResults,
      }
    }),

    /**
     * Сохранение результата сценария
     */
    saveScenarioResult: assign(({ event }) => {
      if (event.type !== "SCENARIO_COMPLETE") return {}

      logger.info("Scenario completed", {
        scenarioId: event.result.scenarioId,
        status: event.result.status,
      })

      return {
        result: event.result,
      }
    }),

    /**
     * Сохранение ошибки
     */
    saveError: assign(({ event }) => {
      if (event.type !== "SCENARIO_FAILED" && event.type !== "STEP_FAILED") return {}

      logger.error("Error occurred", { error: event.error })

      return {
        error: event.error,
      }
    }),

    /**
     * Сброс состояния
     */
    reset: assign(() => {
      logger.debug("Resetting machine state")

      return {
        scenario: null,
        project: null,
        currentStepIndex: 0,
        currentStep: null,
        progress: 0,
        stepResults: new Map(),
        result: null,
        error: null,
        options: {},
      }
    }),
  },
  guards: {
    /**
     * Проверка наличия следующего шага
     */
    hasNextStep: ({ context }) => {
      if (!context.scenario) return false
      return context.currentStepIndex < context.scenario.steps.length - 1
    },

    /**
     * Проверка, можно ли пропустить шаг
     */
    canSkipStep: ({ context }) => {
      return context.currentStep?.optional === true && context.options.allowSkip === true
    },

    /**
     * Проверка, нужно ли останавливаться при ошибке
     */
    shouldStopOnError: ({ context }) => {
      return context.options.stopOnError === true
    },
  },
}).createMachine({
  id: "scenario",
  initial: "idle",
  context: {
    scenario: null,
    project: null,
    currentStepIndex: 0,
    currentStep: null,
    progress: 0,
    stepResults: new Map(),
    result: null,
    error: null,
    options: {},
  },
  states: {
    /**
     * Начальное состояние
     */
    idle: {
      on: {
        START: {
          target: "loading",
          actions: ["initializeScenario"],
        },
      },
    },

    /**
     * Загрузка сценария
     */
    loading: {
      always: {
        target: "executing",
      },
    },

    /**
     * Выполнение сценария
     */
    executing: {
      initial: "runningStep",
      states: {
        /**
         * Выполнение текущего шага
         */
        runningStep: {
          entry: ["updateProgress"],
          on: {
            STEP_COMPLETE: {
              target: "stepComplete",
              actions: ["saveStepResult"],
            },
            STEP_FAILED: {
              target: "#scenario.failed",
              actions: ["saveError"],
            },
            PAUSE: {
              target: "#scenario.paused",
            },
            CANCEL: {
              target: "#scenario.cancelled",
            },
          },
        },

        /**
         * Шаг завершен
         */
        stepComplete: {
          always: [
            {
              target: "#scenario.completed",
              guard: "hasNextStep",
            },
            {
              target: "runningStep",
              actions: ["nextStep"],
            },
          ],
        },
      },
    },

    /**
     * Пауза
     */
    paused: {
      on: {
        RESUME: {
          target: "executing",
        },
        CANCEL: {
          target: "cancelled",
        },
      },
    },

    /**
     * Завершено успешно
     */
    completed: {
      entry: ["saveScenarioResult"],
      on: {
        RESET: {
          target: "idle",
          actions: ["reset"],
        },
      },
    },

    /**
     * Ошибка выполнения
     */
    failed: {
      on: {
        RESET: {
          target: "idle",
          actions: ["reset"],
        },
        RETRY_STEP: {
          target: "executing",
        },
      },
    },

    /**
     * Отменено пользователем
     */
    cancelled: {
      on: {
        RESET: {
          target: "idle",
          actions: ["reset"],
        },
      },
    },
  },
})

/**
 * Создание актора для машины сценариев
 */
export function createScenarioActor() {
  return scenarioMachine
}
