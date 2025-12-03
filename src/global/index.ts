// Global: Доступно везде без импорта (shims, vars, env)

/**
 * Tauri shims (mock в browser dev)
 */
export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

/**
 * CSS vars (импорт в globals.css)
 */
export const themeVars = {
  "--primary": "#3b82f6",
  "--effects-blur-max": "20px",
  "--transition-duration": "0.3s",
} as const

/**
 * Env shim (из .env.local)
 */
declare global {
  const APP_ENV: {
    openaiApiKey?: string
    ffmpegPath?: string
    onnxPath?: string
  }
}

export * from "./tauri-mock-provider"
