"use client"

import { useApp } from "@/domains/project-management/providers/app-provider"

export function ProjectLoadingOverlay() {
  const { isConnecting, connectionError } = useApp()

  if (!isConnecting && !connectionError) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {isConnecting && (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-lg font-medium">Загрузка проекта...</p>
          </>
        )}
        {connectionError && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            <p className="font-medium">Ошибка подключения</p>
            <p className="text-sm">{connectionError}</p>
          </div>
        )}
      </div>
    </div>
  )
}
