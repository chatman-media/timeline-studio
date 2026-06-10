"use client"

import { useApp } from "@/core/hooks"

export function ProjectLoadingOverlay() {
  const { isConnecting, connectionError } = useApp()

  if (!isConnecting && !connectionError) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      data-oid="knn99uq"
    >
      <div className="flex flex-col items-center gap-4" data-oid="6y8y8ov">
        {isConnecting && (
          <>
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
              data-oid="s3uffdl"
            />

            <p className="text-lg font-medium" data-oid="8_lg0nm">
              Загрузка проекта...
            </p>
          </>
        )}
        {connectionError && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive" data-oid="94vj_gv">
            <p className="font-medium" data-oid="l.s_nk:">
              Ошибка подключения
            </p>
            <p className="text-sm" data-oid="gciprj:">
              {connectionError}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
