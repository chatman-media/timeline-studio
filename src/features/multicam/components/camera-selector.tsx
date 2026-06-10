/**
 * Компонент для выбора активной камеры в мультикамерном режиме
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@timeline-studio/ui/components/dropdown-menu"
import { Camera, Check } from "lucide-react"
import { cn } from "@/lib/utils"

import type { MulticamAngle } from "../hooks/use-multicam"

interface CameraSelectorProps {
  /**
   * Список углов камер
   */
  angles: MulticamAngle[]

  /**
   * Индекс активного угла
   */
  activeAngleIndex: number

  /**
   * Обработчик выбора камеры
   */
  onSelectAngle: (angleIndex: number) => void

  /**
   * Отключен ли селектор
   */
  disabled?: boolean

  /**
   * Класс для кнопки
   */
  className?: string
}

export function CameraSelector({
  angles,
  activeAngleIndex,
  onSelectAngle,
  disabled = false,
  className,
}: CameraSelectorProps) {
  const activeAngle = angles[activeAngleIndex]

  if (angles.length <= 1) {
    return null
  }

  return (
    <DropdownMenu data-oid="4uc:wdo">
      <DropdownMenuTrigger asChild data-oid="ke7lmmh">
        <Button variant="outline" size="sm" disabled={disabled} className={cn("gap-2", className)} data-oid="uxy7ow6">
          <Camera className="w-4 h-4" data-oid="uz-q95n" />
          <span className="font-mono" data-oid="gw99i4k">
            {activeAngleIndex + 1}/{angles.length}
          </span>
          {activeAngle?.name && (
            <span className="text-muted-foreground ml-1" data-oid="3ks96wg">
              {activeAngle.name}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56" data-oid="7qeh.0-">
        <DropdownMenuLabel data-oid="i0_as11">Выберите камеру</DropdownMenuLabel>
        <DropdownMenuSeparator data-oid="4nabugo" />

        {angles.map((angle, index) => (
          <DropdownMenuItem key={angle.id} onClick={() => onSelectAngle(index)} className="gap-2" data-oid="-7zwav7">
            <div className="flex items-center gap-2 flex-1" data-oid="z75jlwo">
              <Badge variant="outline" className="w-6 h-6 p-0 justify-center" data-oid=".7-olgu">
                {index + 1}
              </Badge>
              <span className="flex-1" data-oid="xt0f7:8">
                {angle.name}
              </span>
              {angle.syncOffset !== 0 && (
                <span className="text-xs text-muted-foreground" data-oid="ifcue52">
                  {angle.syncOffset > 0 ? "+" : ""}
                  {angle.syncOffset.toFixed(1)}s
                </span>
              )}
            </div>
            {index === activeAngleIndex && <Check className="w-4 h-4 text-primary" data-oid="l377nxu" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
