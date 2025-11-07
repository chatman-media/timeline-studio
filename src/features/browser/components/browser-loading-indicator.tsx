"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

import { useLoadingState, useResourcesStats } from "../hooks/use-resources"
import type { ResourceSource } from "../types/browser-resources-provider"

/**
 * Маппинг источников данных к человекочитаемым названиям
 */
const SOURCE_DISPLAY_NAMES: Record<ResourceSource, string> = {
  "built-in": "effects",
  local: "filters",
  remote: "transitions",
  imported: "templates",
}

/**
 * Индикатор загрузки ресурсов для Browser
 */
export function BrowserLoadingIndicator() {
  const loadingState = useLoadingState()
  const stats = useResourcesStats()

  // Показываем индикатор только если идет загрузка или есть ошибка
  if (!loadingState.isLoading && !loadingState.error) {
    return null
  }

  return (
    <div className="p-3 border-b bg-muted/30">
      <div className="flex items-center justify-between gap-3">
        {/* Статус загрузки */}
        <div className="flex items-center gap-2">
          {loadingState.isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm font-medium">Загрузка ресурсов...</span>
            </>
          ) : loadingState.error ? (
            <>
              <div className="h-4 w-4 bg-destructive rounded-full" />
              <span className="text-sm font-medium text-destructive">Ошибка загрузки</span>
            </>
          ) : (
            <>
              <div className="h-4 w-4 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-green-600">Загрузка завершена</span>
            </>
          )}
        </div>

        {/* Статистика */}
        <div className="flex items-center gap-2">
          {stats.total > 0 && (
            <Badge variant="secondary" className="text-xs">
              {stats.total} ресурсов
            </Badge>
          )}

          {loadingState.loadedSources.size > 0 && (
            <Badge variant="outline" className="text-xs">
              {loadingState.loadedSources.size} источников
            </Badge>
          )}
        </div>
      </div>

      {/* Прогресс-бар */}
      {loadingState.isLoading && (
        <div className="mt-2 space-y-1">
          <Progress value={loadingState.progress} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {loadingState.loadingQueue.length > 0 &&
                `Загружается: ${loadingState.loadingQueue.map((source) => SOURCE_DISPLAY_NAMES[source]).join(", ")}`}
            </span>
            <span>{Math.round(loadingState.progress)}%</span>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {loadingState.error && (
        <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">{loadingState.error}</div>
      )}

      {/* Детальная статистика (только при загрузке) */}
      {loadingState.isLoading && stats.total > 0 && (
        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
          {stats.byType.effect > 0 && <span>Эффекты: {stats.byType.effect}</span>}
          {stats.byType.filter > 0 && <span>Фильтры: {stats.byType.filter}</span>}
          {stats.byType.transition > 0 && <span>Переходы: {stats.byType.transition}</span>}
        </div>
      )}
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
