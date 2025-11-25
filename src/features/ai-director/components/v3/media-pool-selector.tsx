"use client"

/**
 * Media Pool Selector Component for AI Director v3
 * Кнопка для открытия медиапула и отображение выбранных файлов
 */

import { Folder } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface MediaPoolSelectorProps {
  /** Количество выбранных файлов */
  selectedCount: number

  /** Callback для открытия медиапула */
  onOpenMediaPool: () => void

  /** Disabled state */
  disabled?: boolean
}

export function MediaPoolSelector({ selectedCount, onOpenMediaPool, disabled = false }: MediaPoolSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <Button onClick={onOpenMediaPool} variant="outline" size="lg" disabled={disabled} className="flex-1">
        <Folder className="mr-2 h-5 w-5" />
        Select Files from Media Pool
        {selectedCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {selectedCount} selected
          </Badge>
        )}
      </Button>
    </div>
  )
}
