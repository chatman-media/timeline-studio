import { Checkbox } from "@/components/ui/checkbox"
import type { MediaFile } from "@/domains/media-management"
import { useFileSelection } from "@/features/media/hooks"
import { cn } from "@/lib/utils"

interface FileSelectionCheckboxProps {
  file: MediaFile
  size: number
  className?: string
}

/**
 * Компонент чекбокса для выбора файла в браузере
 *
 * Предоставляет унифицированный UI для выбора файлов во всех preview компонентах
 * - Автоматически позиционируется в зависимости от размера
 * - Использует хук useFileSelection для логики
 * - Стилизован для лучшей видимости на превью
 *
 * @param file - медиафайл
 * @param size - размер превью (влияет на позиционирование)
 * @param className - дополнительные CSS классы
 */
export function FileSelectionCheckbox({ file, size, className }: FileSelectionCheckboxProps) {
  const { isSelected, handleToggleSelection } = useFileSelection(file)

  return (
    <div
      className={cn("absolute pointer-events-auto", size > 100 ? "top-1 left-1" : "top-0.5 left-0.5", className)}
      style={{ zIndex: 30 }}
      onClick={handleToggleSelection}
    >
      <Checkbox
        checked={isSelected}
        className="h-4 w-4 border-white/80 bg-black/60 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
      />
    </div>
  )
}
