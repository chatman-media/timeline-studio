/**
 * Style Template Drag Source
 * Компонент для drag & drop стилистических шаблонов на Timeline
 */

import { useDraggable } from "@dnd-kit/core"
import React from "react"
import { cn } from "@/lib/utils"
import type { StyleTemplate } from "../types"

export interface StyleTemplateDragSourceProps {
  template: StyleTemplate
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

/**
 * Компонент-обертка для drag & drop стилистических шаблонов
 * Интегрируется с Timeline drag-drop системой
 */
export function StyleTemplateDragSource({
  template,
  children,
  className,
  disabled = false,
}: StyleTemplateDragSourceProps) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `style-template-${template.id}`,
    data: {
      type: "style-template",
      template,
      resourceType: "style-template",
      resourceId: template.id,
    },
    disabled,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-opacity",
        isDragging && "opacity-50 cursor-grabbing",
        !isDragging && !disabled && "cursor-grab hover:opacity-90",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}
