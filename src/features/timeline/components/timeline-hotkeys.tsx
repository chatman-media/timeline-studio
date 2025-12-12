import { useGroupHotkeys } from "../hooks/hotkeys/use-group-hotkeys"
import { useJLCutHotkeys } from "../hooks/hotkeys/use-jl-cut-hotkeys"
import { useMarkerHotkeys } from "../hooks/hotkeys/use-marker-hotkeys"
import { useSpeedRampingHotkeys } from "../hooks/speed-ramping/use-speed-ramping-hotkeys"

/**
 * Компонент для инициализации всех горячих клавиш timeline
 * Не рендерит ничего, только регистрирует обработчики
 */
export function TimelineHotkeys() {
  // Инициализация хотки для группировки
  useGroupHotkeys()

  // Инициализация хотки для J/L cuts
  useJLCutHotkeys()

  // Инициализация хотки для маркеров
  useMarkerHotkeys()

  // Инициализация хотки для speed ramping
  useSpeedRampingHotkeys()

  return null
}
