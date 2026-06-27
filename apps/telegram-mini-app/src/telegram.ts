/**
 * Minimal typed access to the Telegram WebApp runtime (#330).
 *
 * Reads `window.Telegram.WebApp.initData` directly — the same string the gateway
 * verifies. Kept dependency-free for the first slice; the richer `@twa-dev/sdk`
 * (theme/viewport helpers) can be layered on later without changing callers.
 */

export interface TelegramWebAppUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe?: { user?: TelegramWebAppUser }
  colorScheme?: "light" | "dark"
  ready: () => void
  expand: () => void
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
