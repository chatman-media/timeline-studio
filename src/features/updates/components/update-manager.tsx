/**
 * UpdateManager - компонент для управления показом уведомлений об обновлениях
 * Автоматически показывает уведомления в зависимости от состояния обновлений
 */

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useUpdateManager } from "../hooks/use-update-manager"
import { UpdateNotification } from "./update-notification"

interface UpdateManagerProps {
  /** Позиция уведомления на экране */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  /** Автоматически скрывать уведомление через указанное время (мс) */
  autoHideDelay?: number
  /** Показывать ли прогресс загрузки */
  showProgress?: boolean
  /** Классы для кастомизации */
  className?: string
}

/**
 * Менеджер уведомлений об обновлениях
 */
export function UpdateManager({
  position = "top-right",
  autoHideDelay,
  showProgress = true,
  className,
}: UpdateManagerProps) {
  const { isUpdateAvailable, isDownloading, isReadyToInstall, isInstalling, isInstalled, isError, enableAutoCheck } =
    useUpdateManager()

  const [isVisible, setIsVisible] = useState(false)
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null)

  // Определяем, должно ли быть видно уведомление
  const shouldShowNotification =
    isUpdateAvailable || isDownloading || isReadyToInstall || isInstalling || isInstalled || isError

  // Включаем автопроверку при монтировании компонента
  useEffect(() => {
    enableAutoCheck(60) // Проверять каждый час
  }, [enableAutoCheck])

  // Управление видимостью уведомления
  useEffect(() => {
    if (shouldShowNotification) {
      setIsVisible(true)

      // Очищаем предыдущий таймер
      if (autoHideTimer) {
        clearTimeout(autoHideTimer)
        setAutoHideTimer(null)
      }

      // Устанавливаем новый таймер для автоскрытия (только для некритичных состояний)
      if (autoHideDelay && (isInstalled || isError)) {
        const timer = setTimeout(() => {
          setIsVisible(false)
        }, autoHideDelay)
        setAutoHideTimer(timer)
      }
    } else {
      setIsVisible(false)
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer)
      }
    }
  }, [shouldShowNotification, autoHideDelay, isInstalled, isError])

  const handleClose = () => {
    setIsVisible(false)
    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
      setAutoHideTimer(null)
    }
  }

  // Позиционирование уведомления
  const getPositionClasses = () => {
    const base = "fixed z-50"
    switch (position) {
      case "top-left":
        return `${base} top-4 left-4`
      case "top-right":
        return `${base} top-4 right-4`
      case "bottom-left":
        return `${base} bottom-4 left-4`
      case "bottom-right":
        return `${base} bottom-4 right-4`
      default:
        return `${base} top-4 right-4`
    }
  }

  // Анимация появления/исчезновения
  const getAnimationProps = () => {
    const isTop = position.includes("top")
    const isRight = position.includes("right")

    return {
      initial: {
        opacity: 0,
        scale: 0.8,
        x: isRight ? 20 : -20,
        y: isTop ? -20 : 20,
      },
      animate: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      },
      exit: {
        opacity: 0,
        scale: 0.8,
        x: isRight ? 20 : -20,
        y: isTop ? -20 : 20,
      },
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      },
    }
  }

  return (
    <div className={getPositionClasses()} data-oid="iek1v2_">
      <AnimatePresence mode="wait" data-oid="_1o0e9l">
        {isVisible && (
          <motion.div {...getAnimationProps()} data-oid="ko_kuwi">
            <UpdateNotification
              className={className}
              onClose={handleClose}
              showProgress={showProgress}
              data-oid="6aiu:eo"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Упрощенный компонент менеджера обновлений для встраивания в другие компоненты
 */
export function InlineUpdateManager({ className }: { className?: string }) {
  const { isUpdateAvailable, isDownloading, isReadyToInstall, isInstalling, isInstalled, isError } = useUpdateManager()

  const shouldShow = isUpdateAvailable || isDownloading || isReadyToInstall || isInstalling || isInstalled || isError

  if (!shouldShow) {
    return null
  }

  return (
    <div className={className} data-oid="orpghs.">
      <UpdateNotification showProgress={true} data-oid="1k4h949" />
    </div>
  )
}
