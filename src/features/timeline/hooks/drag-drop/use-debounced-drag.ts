import { useCallback, useEffect, useRef } from "react"

export interface DebouncedDragOptions {
  /**
   * Задержка между обновлениями в миллисекундах
   * @default 16 (60fps)
   */
  delay?: number

  /**
   * Callback, вызываемый при каждом событии drag (для мгновенного обновления UI)
   */
  onDragUpdate?: (x: number, y?: number) => void

  /**
   * Callback, вызываемый после завершения debounced обновления
   */
  onDragCommit?: (x: number, y?: number) => void
}

export interface DebouncedDragResult {
  /**
   * Debounced версия drag update - используется для mousemove events
   * Откладывает выполнение на delay миллисекунд
   */
  debouncedDragUpdate: (x: number, y?: number) => void

  /**
   * Немедленное обновление - используется для начала и конца drag
   * Выполняется сразу без задержки
   */
  immediateDragUpdate: (x: number, y?: number) => void

  /**
   * Отменить pending drag операцию
   */
  cancelPendingDrag: () => void

  /**
   * Проверить, есть ли pending drag update
   */
  isPending: boolean
}

/**
 * Хук для оптимизации drag операций с debouncing
 *
 * Предотвращает отправку множества обновлений при быстрых движениях мыши.
 * Вместо отправки 60+ событий в секунду, отправляется максимум 60 (при 16ms delay).
 *
 * @example
 * ```tsx
 * const { debouncedDragUpdate, immediateDragUpdate } = useDebouncedDrag({
 *   delay: 16, // 60fps
 *   onDragUpdate: (x) => setLocalPosition(x), // Мгновенное обновление UI
 *   onDragCommit: (x) => updateSlip(x), // Debounced обновление state
 * })
 *
 * // В mousemove handler
 * const handleMouseMove = (e: MouseEvent) => {
 *   debouncedDragUpdate(e.clientX)
 * }
 * ```
 */
export function useDebouncedDrag(options: DebouncedDragOptions = {}): DebouncedDragResult {
  const { delay = 16, onDragUpdate, onDragCommit } = options

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pendingPositionRef = useRef<{ x: number; y?: number } | undefined>(undefined)
  const isPendingRef = useRef(false)
  const lastCommitTimeRef = useRef<number>(0)

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const cancelPendingDrag = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = undefined
    pendingPositionRef.current = undefined
    isPendingRef.current = false
  }, [])

  const debouncedDragUpdate = useCallback(
    (x: number, y?: number) => {
      // Сохраняем позицию для UI
      pendingPositionRef.current = { x, y }
      isPendingRef.current = true

      // Вызываем callback для мгновенного обновления UI (опционально)
      onDragUpdate?.(x, y)

      // Проверяем throttling - не чаще чем delay
      const now = Date.now()
      const timeSinceLastCommit = now - lastCommitTimeRef.current

      if (timeSinceLastCommit >= delay) {
        // Если прошло достаточно времени, выполняем сразу
        lastCommitTimeRef.current = now
        onDragCommit?.(x, y)
        pendingPositionRef.current = undefined
        isPendingRef.current = false
        return
      }

      // Отменяем предыдущий таймер
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
      }

      // Устанавливаем новый таймер на оставшееся время
      const remainingTime = delay - timeSinceLastCommit
      timeoutRef.current = setTimeout(() => {
        if (pendingPositionRef.current !== undefined) {
          const { x: pendingX, y: pendingY } = pendingPositionRef.current
          lastCommitTimeRef.current = Date.now()
          onDragCommit?.(pendingX, pendingY)
          pendingPositionRef.current = undefined
          isPendingRef.current = false
        }
      }, remainingTime)
    },
    [delay, onDragUpdate, onDragCommit],
  )

  const immediateDragUpdate = useCallback(
    (x: number, y?: number) => {
      // Отменяем любой pending drag
      cancelPendingDrag()

      // Выполняем обновление немедленно
      onDragUpdate?.(x, y)
      onDragCommit?.(x, y)
      lastCommitTimeRef.current = Date.now()
    },
    [onDragUpdate, onDragCommit, cancelPendingDrag],
  )

  return {
    debouncedDragUpdate,
    immediateDragUpdate,
    cancelPendingDrag,
    isPending: isPendingRef.current,
  }
}
