/**
 * Modal Machine - System Integration Domain
 *
 * Управляет состоянием модальных окон приложения
 * Перенесено из src/features/modals/services/modal-machine.ts
 * Использует event-driven архитектуру для синхронизации с backend
 */

import { assign, setup } from "xstate"
import { createLogger } from "@/lib/tauri-logger"
import type { ModalBackendEvent } from "../utils/modal-backend-handlers"
import { handleModalBackendEvent } from "../utils/modal-backend-handlers"

const logger = createLogger("ModalMachine")

/**
 * Типы модальных окон в приложении
 */
export type ModalType =
  | "camera-capture"
  | "voice-recording"
  | "export"
  | "project-settings"
  | "user-settings"
  | "keyboard-shortcuts"
  | "cache-settings"
  | "cache-statistics"
  | "subtitle-editor"
  | "person-form"
  | "missing-files"
  | "ai-marker-settings"
  | "subtitle-ai-tools"
  | "audio-effects"
  | "midi-learn"
  | "midi-mapping"
  | "midi-configuration"
  | "effect-detail"
  | "color-grading"
  | "none"

/**
 * Интерфейс для данных модального окна
 */
export interface ModalData {
  /** Класс для размера модального окна */
  dialogClass?: string
  /** Модальное окно, к которому нужно вернуться при закрытии */
  returnTo?: ModalType
  /** Дополнительные данные */
  [key: string]: unknown
}

/**
 * Контекст машины состояний для модальных окон
 */
export interface ModalMachineContext {
  modalType: ModalType
  modalData: ModalData | null
  previousModal: ModalType | null
  isLoading?: boolean
  error?: string | null
}

/**
 * Создание машины состояний для модальных окон
 */
export const modalMachine = setup({
  types: {
    context: {} as ModalMachineContext,
    events: {} as
      | { type: "OPEN_MODAL"; modalType: ModalType; modalData?: ModalData }
      | { type: "CLOSE_MODAL" }
      | { type: "SUBMIT_MODAL"; data?: ModalData }
      | { type: "BACKEND_EVENT"; event: ModalBackendEvent }
      | { type: "SET_LOADING"; isLoading: boolean }
      | { type: "SET_ERROR"; error: string | null }
      | { type: "CLEAR_ERROR" },
  },
  actions: {
    /**
     * Действие для логирования отправки формы
     */
    logFormSubmission: ({ context, event }) => {
      if (event.type === "SUBMIT_MODAL") {
        logger.debug(`[System Integration] Modal ${context.modalType} submitted with data`, { data: event.data })
      }
    },

    /**
     * Обработка backend событий
     * Инкрементально обновляет состояние на основе событий
     */
    handleBackendEvent: assign(({ context, event }) => {
      if (event.type !== "BACKEND_EVENT") return context

      logger.info("[ModalMachine] Processing backend event", {
        eventType: event.event.type,
      })

      // Делегируем обработку в event handlers
      const updates = handleModalBackendEvent(context, event.event)

      logger.debug("[ModalMachine] Context updates:", { updates })

      return {
        ...context,
        ...updates,
      }
    }),

    /**
     * Установка состояния загрузки
     */
    setLoading: assign(({ context, event }) => {
      if (event.type !== "SET_LOADING") return context

      return {
        ...context,
        isLoading: event.isLoading,
      }
    }),

    /**
     * Установка ошибки
     */
    setError: assign(({ context, event }) => {
      if (event.type !== "SET_ERROR") return context

      return {
        ...context,
        error: event.error,
        isLoading: false,
      }
    }),

    /**
     * Очистка ошибки
     */
    clearError: assign(({ context }) => ({
      ...context,
      error: null,
    })),

    /**
     * Логирование событий для отладки
     */
    logEvent: ({ event }) => {
      logger.debug("[ModalMachine] Event received:", { event: event.type })
    },
  },
}).createMachine({
  id: "system-integration-modal",
  initial: "closed",
  context: {
    modalType: "none",
    modalData: null,
    previousModal: null,
    isLoading: false,
    error: null,
  },
  on: {
    // Backend события обрабатываются в любом состоянии
    BACKEND_EVENT: {
      actions: ["logEvent", "handleBackendEvent"],
    },
    SET_LOADING: {
      actions: ["setLoading"],
    },
    SET_ERROR: {
      actions: ["setError"],
    },
    CLEAR_ERROR: {
      actions: ["clearError"],
    },
  },
  states: {
    closed: {
      on: {
        OPEN_MODAL: {
          target: "opened",
          actions: assign({
            modalType: ({ event }) => event.modalType,
            modalData: ({ event }) => event.modalData ?? null,
            previousModal: null,
          }),
        },
      },
    },
    opened: {
      on: {
        CLOSE_MODAL: [
          {
            target: "opened",
            actions: assign({
              modalType: ({ context }) => context.previousModal!,
              modalData: null,
              previousModal: null,
            }),
            guard: ({ context }) => context.previousModal !== null,
          },
          {
            target: "closed",
            actions: assign({
              modalType: "none",
              modalData: null,
              previousModal: null,
            }),
          },
        ],
        SUBMIT_MODAL: {
          target: "closed",
          actions: [
            { type: "logFormSubmission" },
            assign({
              modalType: "none",
              modalData: null,
            }),
          ],
        },
        OPEN_MODAL: {
          // Позволяет открыть другое модальное окно без закрытия текущего
          actions: assign({
            previousModal: ({ context, event }) => event.modalData?.returnTo ?? context.modalType,
            modalType: ({ event }) => event.modalType,
            modalData: ({ event }) => event.modalData ?? null,
          }),
        },
      },
    },
  },
})

/**
 * Тип машины состояний для модальных окон
 */
export type ModalMachine = typeof modalMachine

/**
 * Тип актора машины состояний для модальных окон
 */
export type ModalActor = ReturnType<typeof modalMachine.provide>
