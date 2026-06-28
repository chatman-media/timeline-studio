/**
 * Minimal typed access to the Telegram WebApp runtime (#330).
 *
 * Reads `window.Telegram.WebApp` directly (initData, theme, BackButton, haptics)
 * — kept dependency-free; the richer `@twa-dev/sdk` can replace this later
 * without changing callers.
 */

export interface TelegramWebAppUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramHapticFeedback {
  impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void
  notificationOccurred: (type: "error" | "success" | "warning") => void
  selectionChanged: () => void
}

export interface TelegramBackButton {
  show: () => void
  hide: () => void
  onClick: (cb: () => void) => void
  offClick: (cb: () => void) => void
}

export interface TelegramMainButton {
  setText: (text: string) => void
  show: () => void
  hide: () => void
  enable: () => void
  disable: () => void
  showProgress: (leaveActive?: boolean) => void
  hideProgress: () => void
  onClick: (cb: () => void) => void
  offClick: (cb: () => void) => void
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe?: { user?: TelegramWebAppUser }
  colorScheme?: "light" | "dark"
  ready: () => void
  expand: () => void
  HapticFeedback?: TelegramHapticFeedback
  BackButton?: TelegramBackButton
  MainButton?: TelegramMainButton
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export function getWebApp(): TelegramWebApp | undefined {
  return typeof window === "undefined" ? undefined : window.Telegram?.WebApp
}

/** The raw `initData` to send to the gateway, or `undefined` outside Telegram. */
export function getInitData(): string | undefined {
  const data = getWebApp()?.initData
  return data && data.length > 0 ? data : undefined
}

/** Best-effort haptic feedback (no-op outside Telegram). */
export const haptics = {
  impact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light"): void {
    getWebApp()?.HapticFeedback?.impactOccurred(style)
  },
  notify(type: "error" | "success" | "warning"): void {
    getWebApp()?.HapticFeedback?.notificationOccurred(type)
  },
}

/**
 * Wire the Telegram BackButton to a callback while shown; returns a cleanup that
 * hides it and detaches the handler. No-op outside Telegram.
 */
export function showBackButton(onBack: () => void): () => void {
  const back = getWebApp()?.BackButton
  if (!back) return () => {}
  back.onClick(onBack)
  back.show()
  return () => {
    back.offClick(onBack)
    back.hide()
  }
}

/**
 * Show the Telegram MainButton (the native bottom action) with `text` wired to
 * `onClick` while mounted; returns a cleanup that hides it and detaches the
 * handler. No-op outside Telegram.
 */
export function showMainButton(text: string, onClick: () => void): () => void {
  const main = getWebApp()?.MainButton
  if (!main) return () => {}
  main.setText(text)
  main.onClick(onClick)
  main.show()
  return () => {
    main.offClick(onClick)
    main.hideProgress()
    main.hide()
  }
}

/** Toggle the MainButton's spinner + disabled state (no-op outside Telegram). */
export function setMainButtonBusy(busy: boolean): void {
  const main = getWebApp()?.MainButton
  if (!main) return
  if (busy) {
    main.disable()
    main.showProgress()
  } else {
    main.hideProgress()
    main.enable()
  }
}
