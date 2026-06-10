import type { IModalService, ModalStateSnapshot, ModalSubscription } from "../ports/modal.port"
import type { ModalData, ModalMachineContext, ModalType } from "../types/modals"

type ModalListener = (state: ModalStateSnapshot) => void

export class MemoryModalService implements IModalService {
  private context: ModalMachineContext = {
    modalType: "none",
    modalData: null,
    previousModal: null,
    isLoading: false,
    error: null,
  }

  private listeners = new Set<ModalListener>()

  getActiveModal(): ModalType {
    return this.context.modalType
  }

  getModalData(): ModalData | null {
    return this.context.modalData
  }

  async openModal(modal: ModalType, data?: ModalData): Promise<void> {
    this.context = {
      ...this.context,
      modalType: modal,
      modalData: data ?? null,
      previousModal: this.context.modalType === "none" ? null : (data?.returnTo ?? this.context.modalType),
      error: null,
    }
    this.notify()
  }

  async closeModal(): Promise<void> {
    this.context = this.context.previousModal
      ? {
          ...this.context,
          modalType: this.context.previousModal,
          modalData: null,
          previousModal: null,
          error: null,
        }
      : {
          ...this.context,
          modalType: "none",
          modalData: null,
          previousModal: null,
          error: null,
        }
    this.notify()
  }

  async submitModal(_data?: ModalData): Promise<void> {
    this.context = {
      ...this.context,
      modalType: "none",
      modalData: null,
      previousModal: null,
      error: null,
    }
    this.notify()
  }

  subscribeToModals(callback: ModalListener): ModalSubscription {
    this.listeners.add(callback)
    return {
      unsubscribe: () => {
        this.listeners.delete(callback)
      },
    }
  }

  private notify(): void {
    const state = { context: { ...this.context } }
    for (const listener of this.listeners) {
      listener(state)
    }
  }
}

let memoryModalService: MemoryModalService | null = null

export function getMemoryModalService(): MemoryModalService {
  memoryModalService ??= new MemoryModalService()
  return memoryModalService
}

export function resetMemoryModalService(): void {
  memoryModalService = null
}
