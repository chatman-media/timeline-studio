/**
 * Hook для работы с модальными окнами
 */

import { useCallback, useEffect, useState } from "react"
import type { ModalData, ModalType } from "../machines/modal-machine"
import { getSystemIntegrationOrchestrator } from "../services/system-integration-orchestrator"

export function useModals() {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())
  const [activeModal, setActiveModal] = useState<ModalType>(() => orchestrator.getActiveModal())
  const [modalData, setModalData] = useState<ModalData | null>(() => orchestrator.getModalData())

  // Подписка на изменения состояния
  useEffect(() => {
    const subscription = orchestrator.subscribeToModals((state) => {
      setActiveModal(state.context.modalType)
      setModalData(state.context.modalData)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [orchestrator])

  // Открытие модального окна
  const openModal = useCallback(
    async (modal: ModalType, data?: ModalData) => {
      await orchestrator.openModal(modal, data)
    },
    [orchestrator],
  )

  // Закрытие модального окна
  const closeModal = useCallback(async () => {
    await orchestrator.closeModal()
  }, [orchestrator])

  // Отправка данных из модального окна
  const submitModal = useCallback(
    async (data?: ModalData) => {
      await orchestrator.submitModal(data)
    },
    [orchestrator],
  )

  // Удобные методы для конкретных модальных окон
  const openCameraCapture = useCallback(
    async (data?: ModalData) => {
      await openModal("camera-capture", data)
    },
    [openModal],
  )

  const openVoiceRecording = useCallback(
    async (data?: ModalData) => {
      await openModal("voice-recording", data)
    },
    [openModal],
  )

  const openExport = useCallback(
    async (data?: ModalData) => {
      await openModal("export", data)
    },
    [openModal],
  )

  const openProjectSettings = useCallback(
    async (data?: ModalData) => {
      await openModal("project-settings", data)
    },
    [openModal],
  )

  const openUserSettings = useCallback(
    async (data?: ModalData) => {
      await openModal("user-settings", data)
    },
    [openModal],
  )

  const openKeyboardShortcuts = useCallback(
    async (data?: ModalData) => {
      await openModal("keyboard-shortcuts", data)
    },
    [openModal],
  )

  const openColorGrading = useCallback(
    async (data?: ModalData) => {
      await openModal("color-grading", data)
    },
    [openModal],
  )

  const openEffectDetail = useCallback(
    async (effectId: string, data?: ModalData) => {
      await openModal("effect-detail", { ...data, effectId })
    },
    [openModal],
  )

  return {
    // Состояние
    activeModal,
    modalData,
    isModalOpen: activeModal !== "none",

    // Общие методы
    openModal,
    closeModal,
    submitModal,

    // Специфичные методы
    openCameraCapture,
    openVoiceRecording,
    openExport,
    openProjectSettings,
    openUserSettings,
    openKeyboardShortcuts,
    openColorGrading,
    openEffectDetail,
  }
}
