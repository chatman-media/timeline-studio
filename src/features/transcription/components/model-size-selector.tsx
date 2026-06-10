/**
 * Селектор размера модели для транскрипции
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"

interface ModelSizeSelectorProps {
  value: "medium" | "base" | "small" | "tiny" | "large-v1" | "large-v2" | "large-v3"
  onChange: (value: "medium" | "base" | "small" | "tiny" | "large-v1" | "large-v2" | "large-v3") => void
}

export function ModelSizeSelector({ value, onChange }: ModelSizeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} data-oid="z54fyq0">
      <SelectTrigger data-oid="1l.298e">
        <SelectValue data-oid="nou06x3" />
      </SelectTrigger>
      <SelectContent data-oid="g6m7m9l">
        <SelectItem value="tiny" data-oid=":hry6pu">
          tiny - Самая быстрая
        </SelectItem>
        <SelectItem value="base" data-oid=":kt79a1">
          base - Баланс скорости и качества
        </SelectItem>
        <SelectItem value="small" data-oid="._wbje2">
          small - Улучшенное качество
        </SelectItem>
        <SelectItem value="medium" data-oid="ev1_6wf">
          medium - Высокое качество
        </SelectItem>
        <SelectItem value="large-v1" data-oid="c2ddxdm">
          large-v1 - Превосходное качество
        </SelectItem>
        <SelectItem value="large-v2" data-oid="08vk.i5">
          large-v2 - Превосходное качество
        </SelectItem>
        <SelectItem value="large-v3" data-oid="h6w6.b9">
          large-v3 - Лучшее качество
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
