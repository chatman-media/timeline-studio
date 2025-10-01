/**
 * Re-export modal machine from new domain location
 * Для обратной совместимости
 */

export type {
  ModalActor,
  ModalData,
  ModalMachine,
  ModalType,
} from "@/domains/system-integration/machines/modal-machine"
export { modalMachine } from "@/domains/system-integration/machines/modal-machine"
