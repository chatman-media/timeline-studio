/**
 * Modal Provider - Simplified Architecture
 *
 * Провайдер модальных окон использующий SystemIntegrationOrchestrator
 * Orchestrator управляет единственным экземпляром modalMachine
 * и синхронизацией с backend
 */

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react"
import { getSystemIntegrationOrchestrator } from "@/domains/system-integration"
import { type ModalData, type ModalType } from "@/domains/system-integration/machines/modal-machine"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ModalProvider")

// Re-export types for convenience
export type { ModalType, ModalData }

/**
 * Интерфейс для контекста модальных окон
 */
export interface ModalContextType {
  modalType: ModalType
  modalData: ModalData | null
  isOpen: boolean
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

/**
 * Провайдер для модальных окон
 *
 * Использует SystemIntegrationOrchestrator для управления состоянием
 * Orchestrator обеспечивает единственный экземпляр modalMachine и BackendSync
 */
export function ModalProvider({ children }: ModalProviderProps) {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())

  // Подписываемся на изменения состояния модального окна
  const [modalType, setModalType] = useState<ModalType>(() => orchestrator.getActiveModal())
  const [modalData, setModalData] = useState<ModalData | null>(() => orchestrator.getModalData())

  useEffect(() => {
    logger.info("[ModalProvider] Subscribing to modal state changes")

    const subscription = orchestrator.subscribeToModals((state) => {
      setModalType(state.context.modalType)
      setModalData(state.context.modalData)
    })

    return () => {
      logger.info("[ModalProvider] Unsubscribing from modal state changes")
      subscription.unsubscribe()
    }
  }, [orchestrator])

  const contextValue: ModalContextType = useMemo(
    () => ({
      modalType,
      modalData,
      isOpen: modalType !== "none",
      openModal: (type, data) => orchestrator.openModal(type, data),
      closeModal: () => orchestrator.closeModal(),
      submitModal: (data) => orchestrator.submitModal(data),
    }),
    [modalType, modalData, orchestrator],
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
