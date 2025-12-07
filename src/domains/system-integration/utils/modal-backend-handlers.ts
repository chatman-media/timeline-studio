/**
 * Backend Event Handlers для Modal Machine
 *
 * Обрабатывает события от Rust backend и обновляет состояние машины
 * Используется паттерн Command-Event для синхронизации
 *
 * Canonical source in domains/system-integration/utils
 */

import type { ModalMachineContext } from "@/domains/system-integration/machines/modal-machine"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ModalEventHandlers")

/**
 * События модалов от backend
 */
export type ModalBackendEvent =
  | {
      type: "ModalOpened"
      payload: {
        modal_type: string
        modal_data: any | null
      }
    }
  | {
      type: "ModalClosed"
      payload: Record<string, never>
    }
  | {
      type: "ModalSubmitted"
      payload: {
        data: any | null
      }
    }
  | { type: string; payload?: any }

/**
 * Главный обработчик backend событий для Modal
 */
export function handleModalBackendEvent(
  context: ModalMachineContext,
  event: ModalBackendEvent,
): Partial<ModalMachineContext> {
  logger.info("Handling modal backend event:", { event: event.type })

  switch (event.type) {
    case "ModalOpened":
      return handleModalOpened(context, event)
    case "ModalClosed":
      return handleModalClosed(context, event)
    case "ModalSubmitted":
      return handleModalSubmitted(context, event)
    default:
      logger.debug("Unhandled modal backend event type:", { type: event.type })
      return {}
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleModalOpened(_context: ModalMachineContext, event: ModalBackendEvent): Partial<ModalMachineContext> {
  if (event.type !== "ModalOpened") return {}
  const { modal_type, modal_data } = event.payload

  logger.info("Modal opened:", { modal_type })

  return {
    modalType: modal_type as any,
    modalData: modal_data || null,
  }
}

function handleModalClosed(context: ModalMachineContext, _event: ModalBackendEvent): Partial<ModalMachineContext> {
  logger.info("Modal closed")

  // Если есть previousModal, возвращаемся к нему
  if (context.previousModal) {
    return {
      modalType: context.previousModal,
      modalData: null,
      previousModal: null,
    }
  }

  // Иначе закрываем полностью
  return {
    modalType: "none",
    modalData: null,
    previousModal: null,
  }
}

function handleModalSubmitted(_context: ModalMachineContext, event: ModalBackendEvent): Partial<ModalMachineContext> {
  if (event.type !== "ModalSubmitted") return {}
  const { data } = event.payload

  logger.info("Modal submitted:", { data })

  // При submit модал закрывается
  return {
    modalType: "none",
    modalData: null,
    previousModal: null,
  }
}
