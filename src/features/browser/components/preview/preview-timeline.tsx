import { useEffect, useRef, useState } from "react"

interface PreviewTimelineProps {
  time: number
  duration: number
  videoRef?: HTMLVideoElement | null | HTMLAudioElement | undefined
}

/**
 * Компонент для отображения временной шкалы в предварительном просмотре медиафайлов
 *
 * @param time - Текущее время в секундах
 * @param duration - Длительность видео в секундах
 * @param videoRef - Ссылка на HTMLVideoElement или HTMLAudioElement
 */
export function PreviewTimeline({ time, duration, videoRef }: PreviewTimelineProps) {
  const animationRef = useRef<number | undefined>(undefined)
  const [displayTime, setDisplayTime] = useState(time)
  const lastTimeRef = useRef<number>(time)
  const [isVisible, setIsVisible] = useState(true)

  // Эффект для анимации движения индикатора во время проигрывания
  useEffect(() => {
    if (!videoRef) return

    // Функция для обновления позиции индикатора
    const updatePosition = () => {
      const currentTime = videoRef.currentTime

      // Обновляем позицию только если время изменилось
      if (currentTime !== lastTimeRef.current) {
        setDisplayTime(currentTime)
        lastTimeRef.current = currentTime
      }

      // Запрашиваем следующий кадр анимации
      animationRef.current = requestAnimationFrame(updatePosition)
    }

    // Запускаем анимацию сразу если видео уже играет
    if (!videoRef.paused) {
      animationRef.current = requestAnimationFrame(updatePosition)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseMove = () => {
      updatePosition()
    }

    const handleTimeUpdate = () => {
      setDisplayTime(videoRef.currentTime)
      lastTimeRef.current = videoRef.currentTime
    }

    // Регистрируем слушатели
    videoRef.addEventListener("mouseenter", handleMouseEnter)
    videoRef.addEventListener("mousemove", handleMouseMove)
    videoRef.addEventListener("mouseleave", handleMouseLeave)
    videoRef.addEventListener("timeupdate", handleTimeUpdate)
    // Очистка при размонтировании
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      videoRef.removeEventListener("mouseenter", handleMouseEnter)
      videoRef.removeEventListener("mouseleave", handleMouseLeave)
      videoRef.removeEventListener("timeupdate", handleTimeUpdate)
      videoRef.removeEventListener("mousemove", handleMouseMove)
    }
  }, [videoRef])

  // Защита от деления на ноль
  const positionPercent = duration > 0 ? (displayTime / duration) * 100 : 0
  if (positionPercent === 0 || !isVisible) return null

  return (
    <div
      data-testid="preview-timeline"
      className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-red-500"
      style={{
        left: `${positionPercent}%`,
      }}
      data-oid="sglrh6-"
    />
  )
}
