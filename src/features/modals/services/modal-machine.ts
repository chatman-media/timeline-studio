/**
 * Modal Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @/domains/system-integration
 * Этот файл оставлен для обратной совместимости
 */

// Re-export everything from the new domain location
export type {
  ModalActor,
  ModalContext,
  ModalData,
  ModalEvent,
  ModalMachine,
  ModalType,
} from "@/domains/system-integration/machines/modal-machine"

export { modalMachine } from "@/domains/system-integration/machines/modal-machine"
