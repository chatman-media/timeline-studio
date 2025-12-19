import { Button } from "@/components/ui/button"
import { useModals } from "@/domains/system-integration"
import type { BaseEffect } from "@/features/effects/types"

interface EffectDetailProps {
  effect: BaseEffect
  onApplyEffect: (effect: BaseEffect, preset?: string, customParams?: Record<string, number>) => void
}

/**
 * Компонент для детального просмотра эффекта с возможностью настройки параметров
 */
export function EffectDetail({ effect, onApplyEffect }: EffectDetailProps) {
  const { openModal } = useModals()

  const handleOpen = () => {
    openModal("effect-detail", {
      effect,
      onApplyEffect,
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleOpen} data-oid="id:52es">
      Детали эффекта
    </Button>
  )
}
