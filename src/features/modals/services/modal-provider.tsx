/**
 * Modal Provider - Event-driven Architecture
 *
 * Провайдер модальных окон с использованием BackendSync
 * Использует event-driven архитектуру для синхронизации с backend
 * Только важные модалы синхронизируются с backend
 */

import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef } from "react"
import { createActor } from "xstate"
import { type ModalData, type ModalType, modalMachine } from "@/domains/system-integration/machines/modal-machine"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ModalProvider")

// Define ProjectEvent type locally for modal events
type ProjectEvent =
  | { type: "ModalOpened"; payload: { modal_type: string; modal_data: any | null } }
  | { type: "ModalClosed"; payload: Record<string, never> }
  | { type: "ModalSubmitted"; payload: { data: any | null } }
  | { type: string; payload?: any }

// Re-export types for convenience
export type { ModalType, ModalData }

/**
 * Интерфейс для контекста модальных окон
 */
export interface ModalContextType {
  modalType: ModalType
  modalData: ModalData | null
  isOpen: boolean
  isLoading: boolean
  error: string | null
  openModal: (modalType: ModalType, modalData?: ModalData) => Promise<void>
  closeModal: () => Promise<void>
  submitModal: (data?: ModalData) => Promise<void>
}

/**
 * Пропсы для провайдера модальных окон
 */
interface ModalProviderProps {
  children: ReactNode
}

/**
 * Контекст для модальных окон
 */
const ModalContext = createContext<ModalContextType | null>(null)

// Модальные окна, которые требуют синхронизации с backend
const BACKEND_SYNCED_MODALS: ModalType[] = [
  "project-settings",
  "export",
  "user-settings",
  "cache-settings",
  "missing-files",
]

/**
 * Провайдер для модальных окон с выборочной синхронизацией BackendSync
 *
 * Только важные модальные окна синхронизируются с backend
 * Использует event-driven архитектуру для инкрементальных обновлений
 */
export function ModalProvider({ children }: ModalProviderProps) {
  const backendSync = getBackendSync()

  // ✅ НОВАЯ АРХИТЕКТУРА: Используем XState машину для кэширования состояния
  const modalActorRef = useRef(createActor(modalMachine))
  const modalActor = modalActorRef.current

  // Запускаем актор при монтировании
  useEffect(() => {
    modalActor.start()
    return () => {
      modalActor.stop()
    }
  }, [modalActor])

  // Получаем состояние из машины через useSelector
  const modalType = useSelector(modalActor, (state) => state.context.modalType)
  const modalData = useSelector(modalActor, (state) => state.context.modalData)
  const isLoading = useSelector(modalActor, (state) => state.context.isLoading ?? false)
  const error = useSelector(modalActor, (state) => state.context.error ?? null)
  const isOpen = useSelector(modalActor, (state) => state.matches("opened"))

  // ✅ НОВАЯ АРХИТЕКТУРА: Подписываемся на backend СОБЫТИЯ (не на state changes)
  useEffect(() => {
    const handleBackendEvent = (event: ProjectEvent) => {
      logger.info("[ModalProvider] Received backend event, forwarding to machine", {
        eventType: event.type,
      })

      // Проверяем события модалов
      if (event.type === "ModalOpened" || event.type === "ModalClosed" || event.type === "ModalSubmitted") {
        // Отправляем событие напрямую в машину для инкрементальных обновлений
        modalActor.send({
          type: "BACKEND_EVENT",
          event: {
            type: event.type,
            payload: event.payload || {},
          },
        })
      }
    }

    // Подписываемся на backend события
    const unsubscribeEvents = backendSync.onEvent(handleBackendEvent)

    return () => {
      unsubscribeEvents()
    }
  }, [backendSync, modalActor])

  // ✅ Вспомогательная функция для проверки, нужна ли backend синхронизация
  const shouldSyncWithBackend = (type: ModalType): boolean => {
    return BACKEND_SYNCED_MODALS.includes(type)
  }

  // Modal actions implementation
  const openModal = async (modalType: ModalType, modalData?: ModalData): Promise<void> => {
    logger.info("[ModalProvider] Opening modal", { modalType })

    // ✅ Оптимистичное обновление - обновляем машину сразу
    modalActor.send({ type: "OPEN_MODAL", modalType, modalData })

    // Отправляем команду на backend только для важных модалов
    if (shouldSyncWithBackend(modalType)) {
      try {
        modalActor.send({ type: "SET_LOADING", isLoading: true })

        const result = await backendSync.executeCommand({
          type: "OpenModal" as any,
          params: {
            modal_type: modalType,
            modal_data: modalData || null,
          },
        } as any)

        if (!result.success) {
          throw new Error(result.error || "Failed to open modal")
        }

        logger.info("[ModalProvider] Modal open command sent successfully")
        // Backend пришлет событие ModalOpened для подтверждения

        modalActor.send({ type: "SET_LOADING", isLoading: false })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to open modal"
        modalActor.send({ type: "SET_ERROR", error: errorMsg })
        logger.error("Modal open failed:", { modalType, error: err })
        throw err
      }
    }
  }

  const closeModal = async (): Promise<void> => {
    logger.info("[ModalProvider] Closing modal", { currentModal: modalType })

    // ✅ Оптимистичное обновление
    modalActor.send({ type: "CLOSE_MODAL" })

    // Отправляем команду на backend только для важных модалов
    if (shouldSyncWithBackend(modalType)) {
      try {
        const result = await backendSync.executeCommand({
          type: "CloseModal" as any,
        })

        if (!result.success) {
          throw new Error(result.error || "Failed to close modal")
        }

        logger.info("[ModalProvider] Modal close command sent successfully")
        // Backend пришлет событие ModalClosed для подтверждения
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to close modal"
        modalActor.send({ type: "SET_ERROR", error: errorMsg })
        logger.error("Modal close failed:", { error: err })
        throw err
      }
    }
  }

  const submitModal = async (data?: ModalData): Promise<void> => {
    logger.info("[ModalProvider] Submitting modal", { currentModal: modalType, data })

    // ✅ Оптимистичное обновление
    modalActor.send({ type: "SUBMIT_MODAL", data })

    // Отправляем команду на backend только для важных модалов
    if (shouldSyncWithBackend(modalType)) {
      try {
        const result = await backendSync.executeCommand({
          type: "SubmitModal" as any,
          params: {
            data: data || null,
          },
        } as any)

        if (!result.success) {
          throw new Error(result.error || "Failed to submit modal")
        }

        logger.info("[ModalProvider] Modal submit command sent successfully")
        // Backend пришлет событие ModalSubmitted для подтверждения
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to submit modal"
        modalActor.send({ type: "SET_ERROR", error: errorMsg })
        logger.error("Modal submit failed:", { error: err })
        throw err
      }
    }
  }

  const contextValue: ModalContextType = useMemo(
    () => ({
      modalType,
      modalData,
      isOpen,
      isLoading,
      error,
      openModal,
      closeModal,
      submitModal,
    }),
    [modalType, modalData, isOpen, isLoading, error],
  )

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>
}

/**
 * Хук для использования контекста модальных окон
 */
export function useModal(): ModalContextType {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}
