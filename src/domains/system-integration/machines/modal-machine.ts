/**
 * Modal Machine - System Integration Domain
 *
 * Управляет состоянием модальных окон приложения
 * Перенесено из src/features/modals/services/modal-machine.ts
 */

import { assign, setup } from "xstate"

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
 * Создание машины состояний для модальных окон
 */
export const modalMachine = setup({
  types: {
    context: {} as {
      modalType: ModalType
      modalData: ModalData | null
      previousModal: ModalType | null
    },
    events: {} as
      | { type: "OPEN_MODAL"; modalType: ModalType; modalData?: ModalData }
      | { type: "CLOSE_MODAL" }
      | { type: "SUBMIT_MODAL"; data?: ModalData },
  },
  actions: {
    /**
     * Действие для логирования отправки формы
     */
    logFormSubmission: ({ context, event }) => {
      if (event.type === "SUBMIT_MODAL") {
        console.log(`[System Integration] Modal ${context.modalType} submitted with data:`, event.data)
      }
    },
  },
}).createMachine({
  id: "system-integration-modal",
  initial: "closed",
  context: {
    modalType: "none",
    modalData: null,
    previousModal: null,
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
