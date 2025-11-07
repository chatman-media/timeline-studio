import { useId, useMemo } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { TimelineMark } from "./timeline-mark"

const logger = createLogger({ module: "TimelineMarks" })

interface TimelineMarksProps {
  startTime: number
  endTime: number
  duration: number
  timeStep: number
  subStep: number
  isActive: boolean
  zoomLevel?: number
  timeToPosition?: (time: number) => number
  sectionId?: string // Опциональный ID секции для уникальности ключей
}

export function TimelineMarks({
  startTime,
  endTime,
  duration,
  timeStep,
  subStep,
  isActive,
  timeToPosition,
  sectionId,
}: TimelineMarksProps) {
  // Используем React useId для создания уникального идентификатора компонента
  const componentId = useId()

  // Если функция timeToPosition не передана, создаем ее локально
  const calculatePosition =
    timeToPosition ||
    ((time: number) => {
      return ((time - startTime) / duration) * 100
    })

  // Используем useMemo для кэширования расчетов меток
  const marks = useMemo(() => {
    const marksArray = []

    // Определяем шаги для разных уровней меток
    const level1Step = timeStep // Основные метки с подписями
    const level2Step = subStep // Средние метки
    const level3Step = subStep / 2 // Малые метки
    const level4Step = subStep / 4 // Наименьшие метки

    // Определяем, нужно ли показывать метки определенного уровня в зависимости от шага
    const showLevel3 = level1Step >= 5 // Показываем малые метки только при достаточном масштабе
    const showLevel4 = level1Step >= 10 // Показываем наименьшие метки только при большом масштабе

    // Определяем шаг для цикла в зависимости от масштаба
    const iterationStep = showLevel4 ? level4Step : showLevel3 ? level3Step : level2Step

    // Находим первую метку, которая попадает в видимую область
    const firstMark = Math.floor(startTime / iterationStep) * iterationStep

    // Отключаем логирование для уменьшения количества сообщений
    // logger.info(
    //   `[TimelineMarks] Шаги: L1=${level1Step}с, L2=${level2Step}с, L3=${level3Step}с, L4=${level4Step}с, Итерация=${iterationStep}с`,
    // )

    for (let timestamp = firstMark; timestamp <= endTime; timestamp += iterationStep) {
      const position = calculatePosition(timestamp)

      // Пропускаем метки, которые находятся за пределами видимой области
      if (position < 0 || position > 100) continue

      let markType: "large" | "medium" | "small" | "smallest"
      let showValue = false

      // Определяем тип метки и нужно ли показывать значение
      if (timestamp % level1Step === 0) {
        markType = "large"
        showValue = true
      } else if (timestamp % level2Step === 0) {
        markType = "medium"
      } else if (showLevel3 && timestamp % level3Step === 0) {
        markType = "small"
      } else if (showLevel4) {
        markType = "smallest"
      } else {
        // Пропускаем метки, которые не нужно показывать при текущем масштабе
        continue
      }

      // Генерируем уникальный ключ, добавляя префикс к timestamp, startTime и componentId
      // Это предотвращает конфликты ключей между разными секциями таймлайна
      // Используем sectionId (если передан) или componentId для обеспечения уникальности
      const sectionPrefix = sectionId || componentId.replace(/:/g, "-")
      // Добавляем случайный суффикс к ключу для обеспечения уникальности
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const markKey = `mark-${sectionPrefix}-${startTime.toFixed(0)}-${timestamp.toFixed(0)}-${markType}-${randomSuffix}`

      marksArray.push(
        <TimelineMark
          key={markKey}
          timestamp={timestamp}
          position={position}
          markType={markType}
          showValue={showValue}
          isFirstMark={timestamp === Math.ceil(startTime / level1Step) * level1Step}
        />,
      )
    }

    return marksArray
  }, [startTime, endTime, duration, timeStep, subStep, calculatePosition, componentId, sectionId]) // Пересчитываем только при изменении этих зависимостей

  return (
    <div className="flex">
      {/* Удалена левая панель */}
      <div
        className={`relative h-8 ${isActive ? "" : "bg-muted/50"}`}
        style={{
          width: "100%",
        }}
      >
        {marks}
      </div>
    </div>
  )
}
