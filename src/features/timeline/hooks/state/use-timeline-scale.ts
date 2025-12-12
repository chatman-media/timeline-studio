import { useMemo } from "react"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UseTimelineScale")

interface TimeScale {
  main: number
  sub: number
}

interface TimeRange {
  startTime: number
  endTime: number
  duration: number
}

/**
 * Хук для расчета параметров шкалы времени на таймлайне
 *
 * @param duration - длительность отображаемого временного отрезка в секундах
 * @param startTime - время начала отрезка (в секундах, может быть Unix timestamp)
 * @param endTime - время окончания отрезка (в секундах)
 * @param scale - коэффициент масштабирования (по умолчанию 1)
 *               - scale > 1: увеличение масштаба (зум в деталь)
 *               - scale < 1: уменьшение масштаба (обзор)
 *
 * @returns {Object} Объект с параметрами шкалы времени:
 *   - timeStep: шаг основных делений шкалы времени
 *   - subStep: шаг промежуточных делений
 *   - adjustedRange: скорректированный временной диапазон с учетом масштаба и отступов
 */
export function useTimelineScale(duration: number, startTime: number, endTime: number, scale = 1) {
  const { timeStep, subStep } = useMemo(() => {
    // Вычисляем скорректированную длительность с учетом масштаба
    const scaledDuration = duration / scale

    const getTimeScale = (duration: number): TimeScale => {
      // Более детальные интервалы в зависимости от длительности
      if (duration <= 5) return { main: 1, sub: 0.2 } // До 5 секунд
      if (duration <= 10) return { main: 2, sub: 0.5 } // До 10 секунд
      if (duration <= 30) return { main: 5, sub: 1 } // До 30 секунд
      if (duration <= 60) return { main: 10, sub: 2 } // До 1 минуты
      if (duration <= 120) return { main: 20, sub: 5 } // До 2 минут
      if (duration <= 300) return { main: 60, sub: 10 } // До 5 минут
      if (duration <= 600) return { main: 120, sub: 30 } // До 10 минут
      if (duration <= 1800) return { main: 300, sub: 60 } // До 30 минут
      if (duration <= 3600) return { main: 600, sub: 120 } // До 1 часа
      if (duration <= 7200) return { main: 1200, sub: 300 } // До 2 часов
      if (duration <= 14400) return { main: 1800, sub: 600 } // До 4 часов
      if (duration <= 43200) return { main: 3600, sub: 900 } // До 12 часов
      return { main: 7200, sub: 1800 } // Более 12 часов
    }

    // Получаем базовую шкалу на основе скорректированной длительности
    const baseScale = getTimeScale(scaledDuration)

    // Отключаем логирование для уменьшения количества сообщений
    // logger.info(
    //   `[useTimelineScale] Масштаб: ${scale}, Длительность: ${duration}с, Скорректированная длительность: ${scaledDuration}с, Шаг: ${baseScale.main}с, Подшаг: ${baseScale.sub}с`,
    // )

    // Возвращаем шаги без дополнительного деления на scale,
    // так как масштаб уже учтен в scaledDuration
    return {
      timeStep: baseScale.main,
      subStep: baseScale.sub,
    }
  }, [duration, scale])

  const adjustedRange = useMemo((): TimeRange => {
    const timeRange = endTime - startTime
    const padding = timeRange * 0.03 // 3% отступ с каждой стороны

    // Вычисляем новую длительность с учетом масштаба
    // При scale > 1 диапазон уменьшается (зум увеличивается)
    // При scale < 1 диапазон увеличивается (зум уменьшается)
    const scaledDuration = timeRange / scale

    // Вычисляем отступы с учетом масштаба
    const scaledPadding = padding / scale

    // Вычисляем полную длительность с учетом отступов
    const totalDuration = scaledDuration + scaledPadding * 2

    // Важно: сохраняем левую границу при масштабировании
    // Это предотвращает "уплывание" шкалы вправо
    const adjustedStartTime = startTime - scaledPadding
    const adjustedEndTime = adjustedStartTime + totalDuration

    return {
      startTime: adjustedStartTime,
      endTime: adjustedEndTime,
      duration: totalDuration,
    }
  }, [startTime, endTime, scale])

  // Добавляем функции для преобразования времени в позицию и обратно
  const timeToPosition = (time: number): number => {
    if (adjustedRange.duration <= 0) return 0
    return ((time - adjustedRange.startTime) / adjustedRange.duration) * 100
  }

  const positionToTime = (position: number): number => {
    if (position < 0 || position > 100) return adjustedRange.startTime
    return adjustedRange.startTime + (position / 100) * adjustedRange.duration
  }

  return {
    timeStep,
    subStep,
    adjustedRange,
    timeToPosition,
    positionToTime,
  }
}
