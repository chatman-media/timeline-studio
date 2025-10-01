"use client"

import type { ReactNode } from "react"

import { AIServicesProvider } from "@/shared/services/ai/react-integration"
import { AppProvider } from "../services/app-provider"

interface AppStateGuardProps {
  children: ReactNode
}

export function AppStateGuard({ children }: AppStateGuardProps) {
  return (
    <AIServicesProvider>
      <AppProvider>{children}</AppProvider>
    </AIServicesProvider>
  )
}
