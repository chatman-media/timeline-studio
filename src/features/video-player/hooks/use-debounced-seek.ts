import { useCallback, useEffect, useRef } from "react"

export interface DebouncedSeekOptions {
  /**
   * Задержка перед выполнением seek в миллисекундах
   * @default 100
   */
  delay?: number

  /**
   * Callback, вызываемый при начале seek (для мгновенного обновления UI)
   */
  onSeekStart?: (time: number) => void

  /**
   * Callback, вызываемый после завершения seek
   */
  onSeekEnd?: (time: number) => void
}

export interface DebouncedSeekResult {
  /**
   * Debounced версия seek - используется для слайдеров
   * Откладывает выполнение на delay миллисекунд
   */
  debouncedSeek: (time: number) => void

  /**
   * Немедленный seek - используется для кнопок навигации
   * Выполняется сразу без задержки
   */
  immediateSeek: (time: number) => Promise<void>

  /**
   * Отменить pending seek операцию
   */
  cancelPendingSeek: () => void

  /**
   * Проверить, есть ли pending seek
   */
  isPending: boolean
}

/**
 * Хук для оптимизации seek операций с debouncing
 *
 * Предотвращает отправку множества команд в backend при быстрых изменениях (например, при перетаскивании слайдера).
 * Вместо отправки сотен команд, отправляется только последняя после задержки.
 *
 * @example
 * ```tsx
 * const { debouncedSeek, immediateSeek } = useDebouncedSeek(seek, {
 *   delay: 100,
 *   onSeekStart: (time) => setLocalDisplayTime(time), // Мгновенное обновление UI
 * })
 *
 * // Для слайдера - debounced
 * <Slider onValueChange={(value) => debouncedSeek(value[0])} />
 *
 * // Для кнопок - immediate
 * <Button onClick={() => immediateSeek(currentTime + 5)} />
 * ```
 */
export function useDebouncedSeek(
  seek: (time: number) => Promise<void>,
  options: DebouncedSeekOptions = {},
): DebouncedSeekResult {
  const { delay = 100, onSeekStart, onSeekEnd } = options

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pendingTimeRef = useRef<number | undefined>(undefined)
  const isPendingRef = useRef(false)

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const cancelPendingSeek = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = undefined
    pendingTimeRef.current = undefined
    isPendingRef.current = false
  }, [])

  const debouncedSeek = useCallback(
    (time: number) => {
      // Сохраняем время для UI
      pendingTimeRef.current = time
      isPendingRef.current = true

      // Вызываем callback для мгновенного обновления UI
      onSeekStart?.(time)

      // Отменяем предыдущий таймер
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
      }

      // Устанавливаем новый таймер
      timeoutRef.current = setTimeout(async () => {
        if (pendingTimeRef.current !== undefined) {
          const seekTime = pendingTimeRef.current
          try {
            await seek(seekTime)
            onSeekEnd?.(seekTime)
          } catch (error) {
            console.error("Seek failed:", error)
          } finally {
            pendingTimeRef.current = undefined
            isPendingRef.current = false
          }
        }
      }, delay)
    },
    [seek, delay, onSeekStart, onSeekEnd],
  )

  const immediateSeek = useCallback(
    async (time: number) => {
      // Отменяем любой pending debounced seek
      cancelPendingSeek()

      // Выполняем seek немедленно
      try {
        onSeekStart?.(time)
        await seek(time)
        onSeekEnd?.(time)
      } catch (error) {
        console.error("Immediate seek failed:", error)
        throw error
      }
    },
    [seek, onSeekStart, onSeekEnd, cancelPendingSeek],
  )

  return {
    debouncedSeek,
    immediateSeek,
    cancelPendingSeek,
    isPending: isPendingRef.current,
  }
}
