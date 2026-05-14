import { ThemeProvider as NextThemeProvider } from "next-themes"
import type React from "react"

// next-themes injects an inline <script> for SSR theme detection (prevents flash).
// React 19 warns about any <script> encountered during render — this is a false positive
// for SSR-only scripts. Suppress the specific warning in dev.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const _origError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering React component"))
      return
    _origError(...args)
  }
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem data-oid="atma0oi">
      {children}
    </NextThemeProvider>
  )
}
// Реэкспортируем useTheme из next-themes для обратной совместимости
export { useTheme } from "next-themes"
