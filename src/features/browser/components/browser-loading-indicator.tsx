"use client"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { useLoadingState, useResourcesStats } from "../hooks/use-resources"

/**
 * Упрощенный индикатор загрузки ресурсов для Browser
 * Показывается только когда идет активная загрузка
 */
export function BrowserLoadingIndicator() {
  const loadingState = useLoadingState()

  // Показываем только при активной загрузке
  if (!loadingState.isLoading) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
      <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
      <span className="text-xs text-muted-foreground">Загрузка ресурсов...</span>
    </div>
  )
}

/**
 * Компонент-заглушка для скелетона загрузки списка ресурсов
 */
export function BrowserResourcesSkeleton() {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-video rounded" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Мини-индикатор статуса загрузки для табов
 */
export function BrowserTabLoadingBadge({ resourceType }: { resourceType: "effect" | "filter" | "transition" }) {
  const loadingState = useLoadingState()
  const stats = useResourcesStats()

  const count = stats.byType[resourceType]
  const isLoading = loadingState.isLoading

  if (count === 0 && !isLoading) {
    return null
  }

  return (
    <Badge variant={isLoading ? "secondary" : "outline"} className="ml-1 text-xs h-5 min-w-5 px-1">
      {isLoading ? (
        <div className="animate-spin h-2 w-2 border border-current border-t-transparent rounded-full" />
      ) : (
        count
      )}
    </Badge>
  )
}
