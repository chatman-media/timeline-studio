import { useCallback, useEffect, useState } from "react"

import { container } from "../container"
import { getMemoryModalService } from "../services/modal-service"
import type { ModalData, ModalType } from "../types/modals"

function getModalService() {
  if (!container.hasModal()) {
    container.registerModal(getMemoryModalService())
  }

  return container.getModal()
}

export function useModals() {
  const [modalService] = useState(getModalService)
  const [activeModal, setActiveModal] = useState<ModalType>(() => modalService.getActiveModal())
  const [modalData, setModalData] = useState<ModalData | null>(() => modalService.getModalData())

  useEffect(() => {
    const subscription = modalService.subscribeToModals((state) => {
      setActiveModal(state.context.modalType)
      setModalData(state.context.modalData)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [modalService])

  const openModal = useCallback(
    async (modal: ModalType, data?: ModalData) => {
      await modalService.openModal(modal, data)
    },
    [modalService],
  )

  const closeModal = useCallback(async () => {
    await modalService.closeModal()
  }, [modalService])

  const submitModal = useCallback(
    async (data?: ModalData) => {
      await modalService.submitModal(data)
    },
    [modalService],
  )

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
    activeModal,
    modalData,
    isModalOpen: activeModal !== "none",
    openModal,
    closeModal,
    submitModal,
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
