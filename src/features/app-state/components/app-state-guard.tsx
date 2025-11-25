"use client"

import type { ReactNode } from "react"

interface AppStateGuardProps {
  children: ReactNode
}

/**
 * AppStateGuard - упрощенный компонент
 * Ранее дублировал AIServicesProvider и AppProvider, которые уже есть в Providers
 * Теперь просто пропускает children
 */
export function AppStateGuard({ children }: AppStateGuardProps) {
  return <>{children}</>
}
