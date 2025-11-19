import React, { useEffect, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import type { CellConfiguration, MediaTemplateConfig } from "../lib/template-config"
import { AnimatedCell } from "./animated-cell"

const logger = createLogger({ module: "TemplateRenderer" })

interface TemplateRendererProps {
  config: MediaTemplateConfig
  renderCell: (index: number, cellConfig: CellConfiguration) => React.ReactNode
  className?: string
  enableAnimations?: boolean // Флаг для включения/отключения анимаций
  activeCell?: number // Индекс активной ячейки (для transition анимаций)
}

/**
 * Компонент для рендеринга шаблонов на основе конфигурации
 * Поддерживает различные типы разделения: vertical, horizontal, diagonal, grid, custom
 * С поддержкой анимаций для ячеек и переходов между layouts
 */
export function TemplateRenderer({
  config,
  renderCell,
  className,
  enableAnimations = true,
  activeCell,
}: TemplateRendererProps) {
  const { split, screens, cells = [], dividers, layout, gridConfig } = config

  // Состояние для отслеживания предыдущей активной ячейки
  const [prevActiveCell, setPrevActiveCell] = useState<number | undefined>(activeCell)
  const [transitioningCells, setTransitioningCells] = useState<Set<number>>(new Set())

  // Отслеживаем изменения активной ячейки для transition анимаций
  useEffect(() => {
    if (activeCell !== undefined && activeCell !== prevActiveCell) {
      const cells = new Set<number>()
      if (prevActiveCell !== undefined) cells.add(prevActiveCell)
      cells.add(activeCell)
      setTransitioningCells(cells)

      // Сбрасываем состояние transition после завершения анимации
      const maxDuration = Math.max(...(config.cells || []).map((cell) => cell.animation?.transition?.duration || 250))
      const timer = setTimeout(() => {
        setTransitioningCells(new Set())
        setPrevActiveCell(activeCell)
      }, maxDuration)

      return () => clearTimeout(timer)
    }
  }, [activeCell, prevActiveCell, config.cells])

  // Генерируем конфигурации ячеек, если они не заданы
  const cellConfigs: CellConfiguration[] = cells.length > 0 ? cells : Array.from({ length: screens }, (_, _i) => ({}))

  // Стили контейнера с поддержкой layout transitions
  const containerStyle: React.CSSProperties = {
    backgroundColor: layout?.backgroundColor,
    borderRadius: layout?.borderRadius,
    padding: layout?.padding,
    ...layout?.containerStyle,
    ...(enableAnimations &&
      layout?.layoutTransition && {
        transition: `all ${layout.layoutTransition.duration || 500}ms ${layout.layoutTransition.easing || "ease-in-out"}`,
      }),
  }

  // Рендеринг разделителя
  const renderDivider = (orientation: "horizontal" | "vertical", key?: string) => {
    if (!dividers?.show) return null

    const dividerStyle: React.CSSProperties = {
      backgroundColor: dividers.color || "#4b5563",
      opacity: dividers.opacity,
      ...(orientation === "horizontal"
        ? {
            height: dividers.width || "1px",
            width: "100%",
          }
        : {
            width: dividers.width || "1px",
            height: "100%",
          }),
      ...(dividers.style === "dashed" && {
        backgroundImage: `repeating-linear-gradient(
          ${orientation === "horizontal" ? "to right" : "to bottom"},
          ${dividers.color || "#4b5563"} 0,
          ${dividers.color || "#4b5563"} ${dividers.dashArray?.split(",")[0] || "5"}px,
          transparent ${dividers.dashArray?.split(",")[0] || "5"}px,
          transparent ${dividers.dashArray?.split(",")[1] || "5"}px
        )`,
        backgroundColor: "transparent",
      }),
      ...(dividers.shadow && {
        boxShadow: `0 0 ${dividers.shadowBlur || "4px"} ${dividers.shadowColor || "rgba(0,0,0,0.2)"}`,
      }),
    }

    return <div key={key} style={dividerStyle} />
  }

  // Рендеринг заголовка ячейки
  const renderCellTitle = (cellConfig: CellConfiguration, index: number) => {
    if (!cellConfig.title?.show) return null

    const { text = String(index + 1), position = "center", style = {} } = cellConfig.title

    const positionClasses = {
      center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      "top-left": "top-4 left-4",
      "top-right": "top-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "bottom-right": "bottom-4 right-4",
    }

    return (
      <div
        className={cn("absolute", positionClasses[position])}
        style={{
          fontSize: style.fontSize || "18px",
          color: style.color || "rgba(156, 163, 175, 0.4)",
          fontWeight: style.fontWeight || "normal",
          opacity: style.opacity,
          fontFamily: style.fontFamily,
          transform: style.transform,
          margin: style.margin,
          padding: style.padding,
        }}
      >
        {text}
      </div>
    )
  }

  // Рендеринг ячейки с настройками и анимациями
  const renderCellWithConfig = (index: number, cellConfig: CellConfiguration, style?: React.CSSProperties) => {
    const cellStyle: React.CSSProperties = {
      ...style,
      backgroundColor: cellConfig.background?.color,
      backgroundImage: cellConfig.background?.gradient || cellConfig.background?.image,
      opacity: cellConfig.background?.opacity,
      borderWidth: cellConfig.border?.width,
      borderColor: cellConfig.border?.color,
      borderStyle: cellConfig.border?.style,
      borderRadius: cellConfig.border?.radius,
      padding: cellConfig.padding,
      margin: cellConfig.margin,
    }

    const cellContent = (
      <div className="relative flex h-full w-full items-center justify-center">
        {renderCell(index, cellConfig)}
        {renderCellTitle(cellConfig, index)}
      </div>
    )

    // Если анимации отключены, рендерим без AnimatedCell
    if (!enableAnimations || !cellConfig.animation) {
      return (
        <div key={`cell-${index}`} className="relative flex items-center justify-center" style={cellStyle}>
          {cellContent}
        </div>
      )
    }

    // Рендерим с анимациями
    return (
      <div key={`cell-${index}`} className="relative" style={cellStyle}>
        <AnimatedCell animation={cellConfig.animation} isVisible={true} isTransitioning={transitioningCells.has(index)}>
          {cellContent}
        </AnimatedCell>
      </div>
    )
  }

  // Рендеринг в зависимости от типа разделения
  switch (split) {
    case "vertical":
      return (
        <div className={cn("flex h-full w-full", className)} style={containerStyle}>
          {cellConfigs.map((cellConfig, index) => (
            <React.Fragment key={`vertical-${index}`}>
              {index > 0 && renderDivider("vertical", `divider-${index}`)}
              {renderCellWithConfig(index, cellConfig, { flex: 1 })}
            </React.Fragment>
          ))}
        </div>
      )

    case "horizontal":
      return (
        <div className={cn("flex h-full w-full flex-col", className)} style={containerStyle}>
          {cellConfigs.map((cellConfig, index) => (
            <React.Fragment key={`horizontal-${index}`}>
              {index > 0 && renderDivider("horizontal", `divider-${index}`)}
              {renderCellWithConfig(index, cellConfig, { flex: 1 })}
            </React.Fragment>
          ))}
        </div>
      )

    case "grid": {
      if (!gridConfig) {
        logger.warn("Grid template requires gridConfig")
        return null
      }

      const gridStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
        gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
        columnGap: gridConfig.columnGap || layout?.gap,
        rowGap: gridConfig.rowGap || layout?.gap,
        ...containerStyle,
      }

      return (
        <div className={cn("h-full w-full", className)} style={gridStyle}>
          {cellConfigs.map((cellConfig, index) => renderCellWithConfig(index, cellConfig))}
        </div>
      )
    }

    case "diagonal": {
      if (!config.splitPoints || config.splitPoints.length < 2) {
        logger.warn("Diagonal template requires at least 2 split points")
        return null
      }

      const [startPoint, endPoint] = config.splitPoints

      return (
        <div className={cn("relative h-full w-full", className)} style={containerStyle}>
          {/* Первая ячейка */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: `polygon(0 0, ${startPoint.x}% ${startPoint.y}%, ${endPoint.x}% ${endPoint.y}%, 0 100%)`,
            }}
          >
            {renderCellWithConfig(0, cellConfigs[0] || {})}
          </div>

          {/* Вторая ячейка */}
          {screens > 1 && (
            <div
              className="absolute inset-0"
              style={{
                clipPath: `polygon(${startPoint.x}% ${startPoint.y}%, 100% 0, 100% 100%, ${endPoint.x}% ${endPoint.y}%)`,
              }}
            >
              {renderCellWithConfig(1, cellConfigs[1] || {})}
            </div>
          )}

          {/* Диагональная линия */}
          {dividers?.show && (
            <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
              <line
                x1={`${startPoint.x}%`}
                y1={`${startPoint.y}%`}
                x2={`${endPoint.x}%`}
                y2={`${endPoint.y}%`}
                stroke={dividers.color || "#4b5563"}
                strokeWidth={dividers.width || "1"}
                strokeDasharray={dividers.style === "dashed" ? dividers.dashArray || "5,5" : undefined}
                opacity={dividers.opacity}
              />
            </svg>
          )}
        </div>
      )
    }

    case "custom": {
      // Для кастомных шаблонов используем cellLayouts если они определены
      if (config.cellLayouts && config.cellLayouts.length > 0) {
        // Используем абсолютное позиционирование с cellLayouts
        const customContainerStyle: React.CSSProperties = {
          ...containerStyle,
          position: "relative",
          width: "100%",
          height: "100%",
        }

        return (
          <div className={cn("relative h-full w-full", className)} style={customContainerStyle}>
            {cellConfigs.map((cellConfig, index) => {
              const cellLayout = config.cellLayouts![index] || {}
              const cellStyle: React.CSSProperties = {
                position: cellLayout.position || "absolute",
                top: cellLayout.top,
                left: cellLayout.left,
                right: cellLayout.right,
                bottom: cellLayout.bottom,
                width: cellLayout.width,
                height: cellLayout.height,
                flex: cellLayout.flex,
                gridColumn: cellLayout.gridColumn,
                gridRow: cellLayout.gridRow,
                zIndex: cellLayout.zIndex,
              }

              return renderCellWithConfig(index, cellConfig, cellStyle)
            })}
          </div>
        )
      }

      // Fallback для старой логики (можно будет удалить после полной миграции)
      const customStyle: React.CSSProperties = {
        ...containerStyle,
        display: "flex",
        flexWrap: "wrap",
        gap: layout?.gap,
      }

      // Определяем размеры ячеек для разных кастомных шаблонов
      const getCellStyle = (index: number): React.CSSProperties => {
        // Базовый стиль
        let cellStyle: React.CSSProperties = { flex: 1 }

        // Специальная логика для разных типов кастомных шаблонов
        if (config.id?.includes("1-3")) {
          // 1:3 layout - первая ячейка меньше
          cellStyle = index === 0 ? { flex: "0 0 25%" } : { flex: "0 0 25%" }
        } else if (config.id?.includes("3-1")) {
          // 3:1 layout - последняя ячейка больше
          cellStyle = index === screens - 1 ? { flex: "0 0 75%" } : { flex: "0 0 25%" }
        } else if (config.id?.includes("mixed-1")) {
          // Mixed layout 1 - первая ячейка больше
          cellStyle = index === 0 ? { flex: "0 0 50%", height: "100%" } : { flex: "0 0 50%", height: "50%" }
        } else if (config.id?.includes("mixed-2")) {
          // Mixed layout 2 - последняя ячейка больше
          cellStyle = index === screens - 1 ? { flex: "0 0 50%", height: "100%" } : { flex: "0 0 50%", height: "50%" }
        } else if (config.id?.includes("custom-5")) {
          // 5-screen layouts с различными конфигурациями
          if (config.id?.includes("5-1")) {
            // 2 больших сверху, 3 маленьких снизу
            cellStyle = index < 2 ? { flex: "0 0 50%", height: "60%" } : { flex: "0 0 33.33%", height: "40%" }
          } else if (config.id?.includes("5-2")) {
            // 1 большой слева, 4 маленьких справа
            cellStyle = index === 0 ? { flex: "0 0 50%", height: "100%" } : { flex: "0 0 25%", height: "50%" }
          } else if (config.id?.includes("5-3")) {
            // Центральный большой, остальные по углам
            cellStyle = index === 2 ? { flex: "0 0 50%", height: "50%" } : { flex: "0 0 25%", height: "50%" }
          }
        } else if (config.id?.includes("custom-7")) {
          // 7-screen layouts
          // Можно добавить специфичную логику для каждого варианта
          cellStyle = { flex: "0 0 33.33%", height: "33.33%" }
        }

        return cellStyle
      }

      return (
        <div className={cn("relative", className)} style={customStyle}>
          {cellConfigs.map((cellConfig, index) => renderCellWithConfig(index, cellConfig, getCellStyle(index)))}
        </div>
      )
    }

    default:
      logger.warn(`Unknown split type: ${split}`)
      return null
  }
}
