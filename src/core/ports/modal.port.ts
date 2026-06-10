import type { ModalData, ModalMachineContext, ModalType } from "../types/modals"

export interface ModalStateSnapshot {
  context: ModalMachineContext
}

export interface ModalSubscription {
  unsubscribe: () => void
}

export interface IModalService {
  getActiveModal(): ModalType
  getModalData(): ModalData | null
  openModal(modal: ModalType, data?: ModalData): Promise<void>
  closeModal(): Promise<void>
  submitModal(data?: ModalData): Promise<void>
  subscribeToModals(callback: (state: ModalStateSnapshot) => void): ModalSubscription
}
