/**
 * Core-facing modal contracts shared by app shell, domains and feature UI.
 */

export type ModalType =
  | "camera-capture"
  | "voice-recording"
  | "export"
  | "project-settings"
  | "user-settings"
  | "about"
  | "keyboard-shortcuts"
  | "cache-settings"
  | "cache-statistics"
  | "subtitle-editor"
  | "person-form"
  | "missing-files"
  | "ai-marker-settings"
  | "subtitle-ai-tools"
  | "audio-effects"
  | "midi-learn"
  | "midi-mapping"
  | "midi-configuration"
  | "effect-detail"
  | "color-grading"
  | "none"

export interface ModalData {
  /** CSS class for the modal size. */
  dialogClass?: string
  /** Modal to restore when closing the current modal. */
  returnTo?: ModalType
  /** Additional modal payload. */
  [key: string]: unknown
}

export interface ModalMachineContext {
  modalType: ModalType
  modalData: ModalData | null
  previousModal: ModalType | null
  isLoading?: boolean
  error?: string | null
}
