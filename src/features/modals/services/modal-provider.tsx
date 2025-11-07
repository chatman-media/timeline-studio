// Используем типы и машину из домена

import { useMachine } from "@xstate/react"
import { createContext, useContext, useEffect, useState } from "react"
import { type ModalData, type ModalType, modalMachine } from "@/domains/system-integration/machines/modal-machine"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "ModalProvider" })

// Re-export types for convenience
export type { ModalType, ModalData }

/**
 * Интерфейс для контекста модальных окон
 */
export interface ModalContextType {
  modalType: ModalType
  modalData: ModalData | null
  isOpen: boolean
  openModal: (modalType: ModalType, modalData?: ModalData) => void
  closeModal: () => void
  submitModal: (data?: ModalData) => void
  // BackendSync status
  isConnected: boolean
}

/**
 * Пропсы для провайдера модальных окон
 */
interface ModalProviderProps {
  children: React.ReactNode
}

/**
 * Контекст для модальных окон
 */
const ModalContext = createContext<ModalContextType | undefined>(undefined)

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
 */
export function ModalProvider({ children }: ModalProviderProps) {
  const [state, send] = useMachine(modalMachine)
  const [isConnected, setIsConnected] = useState(false)
  const backendSync = getBackendSync()

  // Проверка подключения к backend
  useEffect(() => {
    // Подписываемся на изменения backend состояния для проверки подключения
    const unsubscribe = backendSync.onStateChange(() => {
      setIsConnected(true)
    })

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((_event) => {
      // Обработка событий, связанных с модалами (если потребуется в будущем)
      // Например: event.type === "ModalRequested"
    })

    return () => {
      unsubscribe()
      unsubscribeEvents()
    }
  }, [backendSync])

  // Синхронизация закрытия модального окна с backend
  useEffect(() => {
    const isOpen = state?.matches("opened")
    const modalType = state?.context?.modalType

    // Если модальное окно закрыто и это было важное модальное окно
    if (!isOpen && modalType && BACKEND_SYNCED_MODALS.includes(modalType)) {
      backendSync
        .executeCommand({
          type: "CloseModal",
        })
        .catch((err) => {
          void logger.error("Failed to sync modal close", {
            error: String(err),
          })
        })
    }
  }, [state, backendSync])

  // Actions
  const openModal = (modalType: ModalType, modalData?: ModalData) => {
    logger.debugSync("Opening modal window", { modalType })
    send({ type: "OPEN_MODAL", modalType, modalData })

    // Уведомляем backend об открытии модального окна
    if (isConnected && BACKEND_SYNCED_MODALS.includes(modalType)) {
      backendSync
        .executeCommand({
          type: "OpenModal",
          params: {
            modal_type: modalType,
            modal_data: (modalData as any) || null,
          },
        })
        .catch((error) => {
          void logger.error("Failed to notify backend about modal opening", {
            error: String(error),
          })
        })
    }
  }

  const closeModal = () => {
    logger.debugSync("Closing modal window")
    send({ type: "CLOSE_MODAL" })
  }

  const submitModal = async (data?: ModalData) => {
    logger.debugSync("Submitting modal data", { data })

    // Уведомляем backend о закрытии модального окна с данными
    if (state?.context?.modalType && BACKEND_SYNCED_MODALS.includes(state.context.modalType) && isConnected) {
      try {
        await backendSync.executeCommand({
          type: "SubmitModal",
          params: {
            data: (data as any) || null,
          },
        })
      } catch (error) {
        void logger.error("Failed to sync modal submission", {
          modalType: state.context.modalType,
          error: String(error),
        })
      }
    }

    send({ type: "SUBMIT_MODAL", data })
  }

  // Context value with safe fallbacks
  const value: ModalContextType = {
    modalType: state?.context?.modalType ?? "none",
    modalData: state?.context?.modalData ?? null,
    isOpen: state?.matches("opened") ?? false,
    openModal,
    closeModal,
    submitModal,
    isConnected,
  }

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

/**
 * Хук для использования контекста модальных окон
 */
export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}
