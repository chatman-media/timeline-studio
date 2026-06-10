"use client"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Skeleton } from "@timeline-studio/ui/components/skeleton"

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
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30" data-oid="12hvr:p">
      <div
        className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"
        data-oid="tr2wbsw"
      />

      <span className="text-xs text-muted-foreground" data-oid="49.tubx">
        Загрузка ресурсов...
      </span>
    </div>
  )
}

/**
 * Компонент-заглушка для скелетона загрузки списка ресурсов
 */
export function BrowserResourcesSkeleton() {
  return (
    <div className="p-3 space-y-3" data-oid="qxb8gso">
      <div className="flex items-center justify-between" data-oid="5_iy0a-">
        <Skeleton className="h-6 w-32" data-oid="9ei4fdj" />
        <Skeleton className="h-5 w-20" data-oid="pf_b_y7" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3" data-oid="j_hylxg">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2" data-oid="xpfni7q">
            <Skeleton className="aspect-video rounded" data-oid=".__dqq3" />
            <Skeleton className="h-4 w-full" data-oid="s00l6ge" />
            <Skeleton className="h-3 w-3/4" data-oid="ha-er58" />
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
    <Badge variant={isLoading ? "secondary" : "outline"} className="ml-1 text-xs h-5 min-w-5 px-1" data-oid="iov6pde">
      {isLoading ? (
        <div
          className="animate-spin h-2 w-2 border border-current border-t-transparent rounded-full"
          data-oid="wwrtt6b"
        />
      ) : (
        count
      )}
    </Badge>
  )
}
