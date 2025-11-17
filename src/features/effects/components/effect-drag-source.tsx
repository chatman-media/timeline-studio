/**
 * Effect Drag Source
 * Компонент для drag & drop эффектов на Timeline
 */

import { useDraggable } from "@dnd-kit/core"
import React from "react"
import { cn } from "@/lib/utils"
import type { BaseEffect } from "../types"

export interface EffectDragSourceProps {
  effect: BaseEffect
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

/**
 * Компонент-обертка для drag & drop эффектов
 * Интегрируется с Timeline drag-drop системой
 */
export function EffectDragSource({ effect, children, className, disabled = false }: EffectDragSourceProps) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `effect-${effect.id}`,
    data: {
      type: "effect",
      effect,
      resourceType: "effect",
      resourceId: effect.id,
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
