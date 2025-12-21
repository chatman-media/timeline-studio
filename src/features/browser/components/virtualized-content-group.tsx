import { useVirtualizer } from "@tanstack/react-virtual"
import { CopyPlus } from "lucide-react"
import React, { useRef } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Порог количества элементов для включения виртуализации
 */
const VIRTUALIZATION_THRESHOLD = 50

/**
 * Интерфейс свойств компонента VirtualizedContentGroup
 */
interface VirtualizedContentGroupProps<T> {
  /** Заголовок группы */
  title: string
  /** Элементы в группе */
  items: T[]
  /** Режим отображения */
  viewMode?: "list" | "grid" | "thumbnails"
  /** Функция рендеринга элемента */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Функция для получения уникального ключа элемента */
  getItemKey?: (item: T, index: number) => string | number
  /** Функция для добавления всех элементов группы */
  onAddAll?: (items: T[]) => void
  /** Проверка, все ли элементы добавлены */
  areAllItemsAdded?: (items: T[]) => boolean
  /** Текст кнопки добавления */
  addButtonText?: string
  /** Текст кнопки когда все добавлены */
  addedButtonText?: string
  /** Размер элемента (для расчёта виртуализации) */
  itemSize?: number
  /** Количество колонок для grid/thumbnails */
  columns?: number
}

/**
 * Вспомогательный компонент для виртуализированного рендеринга
 * Выделен отдельно, чтобы useVirtualizer вызывался только когда нужна виртуализация
 */
function VirtualizedContent<T>({
  items,
  viewMode,
  renderItem,
  getItemKey,
  itemSize,
  columns,
}: {
  items: T[]
  viewMode: "list" | "grid" | "thumbnails"
  renderItem: (item: T, index: number) => React.ReactNode
  getItemKey?: (item: T, index: number) => string | number
  itemSize: number
  columns: number
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const isListView = viewMode === "list"

  // Рассчитываем количество строк для grid
  const rowCount = isListView ? items.length : Math.ceil(items.length / columns)

  // Row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isListView ? 48 : itemSize + 16), // 16px gap
    overscan: 5,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  if (isListView) {
    // List view - одна строка = один элемент
    return (
      <div ref={parentRef} className="max-h-[400px] overflow-auto" style={{ contain: "strict" }}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = items[virtualRow.index]
            return (
              <div
                key={getItemKey ? getItemKey(item, virtualRow.index) : virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {renderItem(item, virtualRow.index)}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Grid/Thumbnails view - одна строка = несколько элементов
  return (
    <div ref={parentRef} className="max-h-[600px] overflow-auto" style={{ contain: "strict" }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const startIndex = virtualRow.index * columns
          const rowItems = items.slice(startIndex, startIndex + columns)

          return (
            <div
              key={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex gap-3"
            >
              {rowItems.map((item, colIndex) => {
                const itemIndex = startIndex + colIndex
                return (
                  <React.Fragment key={getItemKey ? getItemKey(item, itemIndex) : itemIndex}>
                    {renderItem(item, itemIndex)}
                  </React.Fragment>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Виртуализированный компонент для отображения группы контента
 * Использует @tanstack/react-virtual для эффективного рендеринга больших списков
 */
export function VirtualizedContentGroup<T>({
  title,
  items,
  viewMode = "thumbnails",
  renderItem,
  getItemKey,
  onAddAll,
  areAllItemsAdded,
  addButtonText,
  addedButtonText,
  itemSize = 120,
  columns = 4,
}: VirtualizedContentGroupProps<T>) {
  const { t } = useTranslation()

  // Не показываем группу, если в ней нет элементов
  if (items.length === 0) {
    return null
  }

  // Проверяем, все ли элементы в группе уже добавлены
  const allItemsAdded = areAllItemsAdded ? areAllItemsAdded(items) : false

  // Определяем, нужна ли виртуализация
  const shouldVirtualize = items.length > VIRTUALIZATION_THRESHOLD

  // Для list view - виртуализация по строкам
  const isListView = viewMode === "list"

  // Рендер без виртуализации (для небольших списков)
  const renderWithoutVirtualization = () => {
    const containerClasses = isListView
      ? "space-y-1"
      : viewMode === "grid"
        ? "items-left flex flex-wrap gap-3"
        : "flex flex-wrap justify-between gap-3"

    return (
      <div className={containerClasses}>
        {items.map((item, index) => (
          <React.Fragment key={getItemKey ? getItemKey(item, index) : index}>{renderItem(item, index)}</React.Fragment>
        ))}
      </div>
    )
  }

  // Рендер с виртуализацией (только когда нужна)
  const renderWithVirtualization = () => (
    <VirtualizedContent
      items={items}
      viewMode={viewMode}
      renderItem={renderItem}
      getItemKey={getItemKey}
      itemSize={itemSize}
      columns={columns}
    />
  )

  // Если группа не имеет заголовка, отображаем только элементы
  if (!title || title === "") {
    return shouldVirtualize ? renderWithVirtualization() : renderWithoutVirtualization()
  }

  // Если группа имеет заголовок, отображаем заголовок и элементы
  return (
    <div key={title} className="mb-4">
      <div className="mb-2 flex items-center justify-between pl-2">
        <h3 className="text-sm font-medium">
          {title}
          {shouldVirtualize && <span className="ml-2 text-xs text-muted-foreground">({items.length})</span>}
        </h3>
        {onAddAll && (
          <Button
            variant="secondary"
            size="sm"
            className={cn(
              "flex h-7 cursor-pointer items-center gap-1 rounded-sm bg-[#dddbdd] px-2 text-xs hover:bg-[#38dacac3] dark:bg-[#45444b] dark:hover:bg-[#35d1c1] dark:hover:text-black",
              allItemsAdded && "cursor-not-allowed opacity-50",
            )}
            onClick={() => onAddAll(items)}
            disabled={allItemsAdded}
          >
            <span className="px-1 text-xs">
              {allItemsAdded ? addedButtonText || t("common.allFilesAdded") : addButtonText || t("common.add")}
            </span>
            <CopyPlus className="mr-1 h-3 w-3" />
          </Button>
        )}
      </div>
      {shouldVirtualize ? renderWithVirtualization() : renderWithoutVirtualization()}
    </div>
  )
}
