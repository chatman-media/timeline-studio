import { ThemeProvider as NextThemeProvider } from "next-themes"
import type React from "react"

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem data-oid="atma0oi">
      {children}
    </NextThemeProvider>
  )
}
// Реэкспортируем useTheme из next-themes для обратной совместимости
export { useTheme } from "next-themes"
