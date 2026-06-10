import type { ModalMachineContext } from "@timeline-studio/core/types/modals"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ModalEventHandlers")

export type ModalBackendEvent =
  | {
      type: "ModalOpened"
      payload: {
        modal_type: string
        modal_data: unknown | null
      }
    }
  | {
      type: "ModalClosed"
      payload: Record<string, never>
    }
  | {
      type: "ModalSubmitted"
      payload: {
        data: unknown | null
      }
    }
  | { type: string; payload?: unknown }

export function handleModalBackendEvent(
  context: ModalMachineContext,
  event: ModalBackendEvent,
): Partial<ModalMachineContext> {
  logger.info("Handling modal backend event:", { event: event.type })

  switch (event.type) {
    case "ModalOpened":
      return handleModalOpened(event)
    case "ModalClosed":
      return handleModalClosed(context)
    case "ModalSubmitted":
      return handleModalSubmitted(event)
    default:
      logger.debug("Unhandled modal backend event type:", { type: event.type })
      return {}
  }
}

function handleModalOpened(event: ModalBackendEvent): Partial<ModalMachineContext> {
  if (event.type !== "ModalOpened") return {}
  const { modal_type, modal_data } = event.payload as { modal_type: string; modal_data: unknown | null }

  logger.info("Modal opened:", { modal_type })

  return {
    modalType: modal_type as ModalMachineContext["modalType"],
    modalData: (modal_data as ModalMachineContext["modalData"]) || null,
  }
}

function handleModalClosed(context: ModalMachineContext): Partial<ModalMachineContext> {
  logger.info("Modal closed")

  if (context.previousModal) {
    return {
      modalType: context.previousModal,
      modalData: null,
      previousModal: null,
    }
  }

  return {
    modalType: "none",
    modalData: null,
    previousModal: null,
  }
}

function handleModalSubmitted(event: ModalBackendEvent): Partial<ModalMachineContext> {
  if (event.type !== "ModalSubmitted") return {}
  const { data } = event.payload as { data: unknown | null }

  logger.info("Modal submitted:", { data })

  return {
    modalType: "none",
    modalData: null,
    previousModal: null,
  }
}
