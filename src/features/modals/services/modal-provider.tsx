// Используем типы и машину из домена

import { useMachine } from "@xstate/react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { type ModalData, type ModalType, modalMachine } from "@/domains/system-integration/machines/modal-machine"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { ProjectState } from "@/types/generated/tauri-bindings"

/**
 * Интерфейс для контекста модальных окон
 */
interface ModalContextType {
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

  // Синхронизация с backend только для важных модальных окон
  useEffect(() => {
    // Подписываемся на изменения backend состояния
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setIsConnected(true)

      // Восстанавливаем состояние модальных окон из backend при необходимости
      if (state.ui_state?.active_modal && BACKEND_SYNCED_MODALS.includes(state.ui_state.active_modal as ModalType)) {
        send({
          type: "OPEN_MODAL",
          modalType: state.ui_state.active_modal as ModalType,
          modalData: state.ui_state.modal_data,
        })
      }
    })

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((event) => {
      if (event.type === "MODAL_REQUESTED") {
        // Backend может запросить открытие модального окна
        send({
          type: "OPEN_MODAL",
          modalType: event.data.modalType,
          modalData: event.data.modalData,
        })
      }
    })

    return () => {
      unsubscribe()
      unsubscribeEvents()
    }
  }, [backendSync, send])

  // Синхронизация действий с модальными окнами
  useEffect(() => {
    // Синхронизируем только важные модальные окна
    if (state?.context?.modalType && BACKEND_SYNCED_MODALS.includes(state.context.modalType)) {
      const isOpen = state.matches("opened")

      // Уведомляем backend об открытии/закрытии важных модальных окон
      backendSync
        .executeCommand({
          type: "SaveUIPreferences",
          params: {
            modalType: isOpen ? state.context.modalType : null,
            modalData: isOpen ? state.context.modalData : null,
            isOpen,
          },
        })
        .catch((err) => {
          console.error("[Modal] Failed to sync modal state:", err)
        })
    }
  }, [state, backendSync])

  const value = useMemo(
    () => ({
      modalType: state?.context?.modalType || null,
      modalData: state?.context?.modalData || null,
      isOpen: state?.matches("opened") || false,
      openModal: (modalType: ModalType, modalData?: ModalData) => {
        console.log("Открываем модальное окно:", modalType)
        send({ type: "OPEN_MODAL", modalType, modalData })

        // Для модальных окон с данными проекта, загружаем актуальные данные
        if (modalType === "project-settings" && isConnected) {
          backendSync
            .executeCommand({
              type: "LoadProjectSettings",
              params: {},
            })
            .catch(console.error)
        }
      },
      closeModal: () => {
        console.log("Закрываем модальное окно")
        send({ type: "CLOSE_MODAL" })
      },
      submitModal: async (data?: ModalData) => {
        console.log("Отправляем данные модального окна:", data)

        // Для важных модальных окон синхронизируем результат с backend
        if (state?.context?.modalType && BACKEND_SYNCED_MODALS.includes(state.context.modalType)) {
          try {
            switch (state.context.modalType) {
              case "project-settings":
                await backendSync.executeCommand({
                  type: "UpdateProjectSettings",
                  params: data,
                })
                break

              case "export":
                await backendSync.executeCommand({
                  type: "Export",
                  params: data,
                })
                break

              case "user-settings":
                await backendSync.executeCommand({
                  type: "UpdateUserSettings",
                  params: data,
                })
                break

              case "cache-settings":
                await backendSync.executeCommand({
                  type: "UpdateCacheSettings",
                  params: data,
                })
                break
            }
          } catch (error) {
            console.error(`[Modal] Failed to sync ${state.context.modalType} submission:`, error)
          }
        }

        send({ type: "SUBMIT_MODAL", data })
      },
      isConnected,
    }),
    [state, send, isConnected, backendSync],
  )

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
