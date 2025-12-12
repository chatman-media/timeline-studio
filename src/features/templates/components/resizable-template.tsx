import React, { useCallback, useEffect, useRef, useState } from "react"

import { ResizableHandle as PanelResizeHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import type { MediaFile } from "@/domains/media-management"
import { usePlayer } from "@/domains/video-editing"
import { createLogger } from "@/lib/tauri-logger"
import { getAllTemplateConfig } from "../lib/all-template-configs"
import type { CellConfiguration } from "../lib/template-config"
import type { AppliedTemplate } from "../services/template-service"
import { TemplateRenderer } from "./template-renderer"
import { VideoPanelComponent } from "./video-panel-component"

const logger = createLogger({ module: "ResizableTemplate" })

interface ResizableTemplateProps {
  appliedTemplate: AppliedTemplate
  videos: MediaFile[]
  activeVideoId: string | null
  videoRefs?: Record<string, HTMLVideoElement>
}

/**
 * Компонент для отображения настраиваемого шаблона с возможностью изменения размеров панелей
 * Использует новую систему конфигурации шаблонов
 */
export function ResizableTemplate({ appliedTemplate, videos, activeVideoId, videoRefs }: ResizableTemplateProps) {
  const { isResizableMode } = usePlayer()
  const template = appliedTemplate.template

  // Получаем конфигурацию шаблона
  const templateConfig = template ? getAllTemplateConfig(template.id) : undefined

  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v?.path)
  const videoCount = Math.min(validVideos.length, template?.screens || 1)

  // Состояние для хранения размеров панелей
  const [panelSizes, setPanelSizes] = useState<number[]>([])

  // Состояние для диагональных шаблонов
  const [splitPoints, setSplitPoints] = useState<{ x: number; y: number }[]>(
    template?.splitPoints ||
      templateConfig?.splitPoints || [
        { x: 66.67, y: 0 },
        { x: 33.33, y: 100 },
      ],
  )

  // Состояние для отслеживания перетаскивания диагонали
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<number>(0)
  const [dragPoint, setDragPoint] = useState<number | null>(null)
  const diagonalContainerRef = useRef<HTMLDivElement>(null)

  // Инициализация размеров панелей
  useEffect(() => {
    if (!template?.resizable) return

    const defaultSizes = Array(videoCount).fill(100 / videoCount)

    // Для шаблонов с позицией разделения используем её
    if (template.splitPosition !== undefined) {
      if (template.split === "vertical" || template.split === "horizontal") {
        setPanelSizes([template.splitPosition, 100 - template.splitPosition])
      }
    } else {
      setPanelSizes(defaultSizes)
    }
  }, [template, videoCount])

  // Обработчики для диагональных шаблонов
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, pointIndex = 0) => {
      e.preventDefault()
      setDragPoint(pointIndex)

      if (diagonalContainerRef.current) {
        const rect = diagonalContainerRef.current.getBoundingClientRect()
        const cursorX = ((e.clientX - rect.left) / rect.width) * 100

        if (pointIndex === 2) {
          const centerX = (splitPoints[0].x + splitPoints[1].x) / 2
          setDragOffset(cursorX - centerX)
        } else {
          setDragOffset(cursorX - splitPoints[pointIndex].x)
        }
      }

      setIsDragging(true)
    },
    [splitPoints],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !diagonalContainerRef.current || dragPoint === null) return

      const rect = diagonalContainerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const newPoints = [...splitPoints]
      const newX = x - dragOffset

      if (dragPoint === 2) {
        const diffX = newX - (splitPoints[0].x + splitPoints[1].x) / 2
        newPoints[0].x = splitPoints[0].x + diffX
        newPoints[1].x = splitPoints[1].x + diffX
      } else {
        newPoints[dragPoint].x = newX
      }

      let newX1 = newPoints[0].x
      let newX2 = newPoints[1].x

      // Ограничения для точек
      if (dragPoint === 2) {
        if (newX1 < 0) {
          const adjustment = -newX1
          newX1 += adjustment
          newX2 += adjustment
        } else if (newX1 > 100) {
          const adjustment = newX1 - 100
          newX1 -= adjustment
          newX2 -= adjustment
        }

        if (newX2 < 0) {
          const adjustment = -newX2
          newX1 += adjustment
          newX2 += adjustment
        } else if (newX2 > 100) {
          const adjustment = newX2 - 100
          newX1 -= adjustment
          newX2 -= adjustment
        }
      } else if (dragPoint === 0) {
        newX1 = Math.max(0, Math.min(100, newX1))
      } else if (dragPoint === 1) {
        newX2 = Math.max(0, Math.min(100, newX2))
      }

      setSplitPoints([
        { x: newX1, y: 0 },
        { x: newX2, y: 100 },
      ])
    },
    [isDragging, splitPoints, dragOffset, dragPoint],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragPoint(null)
  }, [])

  // Добавляем и удаляем обработчики событий для перетаскивания
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Функция рендеринга ячейки с видео
  const renderCell = useCallback(
    (index: number, _cellConfig: CellConfiguration) => {
      if (index >= validVideos.length) {
        return null
      }

      const video = validVideos[index]
      const isActive = video.id === activeVideoId

      return <VideoPanelComponent video={video} isActive={isActive} videoRefs={videoRefs} index={index} />
    },
    [validVideos, activeVideoId, videoRefs],
  )

  // Если нет шаблона или конфигурации, показываем заглушку
  if (!template || !templateConfig) {
    logger.warn(`No configuration found for template: ${template?.id}`)
    return <div>Template configuration not found</div>
  }

  // Обновляем конфигурацию с актуальными splitPoints для диагональных шаблонов
  const configWithUpdatedPoints = template.split === "diagonal" ? { ...templateConfig, splitPoints } : templateConfig

  // Специальная обработка для resizable шаблонов
  if (template.resizable && isResizableMode && (template.split === "vertical" || template.split === "horizontal")) {
    const isVertical = template.split === "vertical"

    return (
      <ResizablePanelGroup direction={isVertical ? "horizontal" : "vertical"}>
        {panelSizes.map((size, index) => (
          <React.Fragment key={index}>
            {index > 0 && <PanelResizeHandle className={isVertical ? "w-px bg-gray-600" : "h-px bg-gray-600"} />}
            <ResizablePanel defaultSize={size} minSize={10}>
              {index < validVideos.length && renderCell(index, templateConfig.cells?.[index] || {})}
            </ResizablePanel>
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
    )
  }

  // Для диагональных шаблонов с возможностью изменения
  if (template.split === "diagonal" && isResizableMode) {
    return (
      <div ref={diagonalContainerRef} className="relative h-full w-full">
        <TemplateRenderer config={configWithUpdatedPoints} renderCell={renderCell} />

        {/* Интерактивные элементы для перетаскивания диагонали */}
        <svg className="absolute inset-0" style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
          {/* Точки для перетаскивания */}
          <circle
            cx={`${splitPoints[0].x}%`}
            cy={`${splitPoints[0].y}%`}
            r="8"
            fill="white"
            stroke="black"
            strokeWidth="2"
            style={{ cursor: "move", pointerEvents: "all" }}
            onMouseDown={(e) => handleMouseDown(e, 0)}
          />
          <circle
            cx={`${splitPoints[1].x}%`}
            cy={`${splitPoints[1].y}%`}
            r="8"
            fill="white"
            stroke="black"
            strokeWidth="2"
            style={{ cursor: "move", pointerEvents: "all" }}
            onMouseDown={(e) => handleMouseDown(e, 1)}
          />

          {/* Невидимая линия для перетаскивания всей диагонали */}
          <line
            x1={`${splitPoints[0].x}%`}
            y1={`${splitPoints[0].y}%`}
            x2={`${splitPoints[1].x}%`}
            y2={`${splitPoints[1].y}%`}
            stroke="transparent"
            strokeWidth="20"
            style={{ cursor: "move", pointerEvents: "all" }}
            onMouseDown={(e) => handleMouseDown(e, 2)}
          />
        </svg>
      </div>
    )
  }

  // Для всех остальных шаблонов используем TemplateRenderer
  return <TemplateRenderer config={configWithUpdatedPoints} renderCell={renderCell} />
}
