import { useEffect, useState } from "react"

import { logInfo } from "@/lib/tauri-logger"

/**
 * Хук для отслеживания изменений полноэкранного режима
 * @returns Объект с состоянием полноэкранного режима и функциями для управления им
 */
export function useFullscreen() {
  logInfo("[useFullscreen] Инициализация хука")

  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreen = () => {
      const isCurrentlyFullscreen =
        document.fullscreenElement ??
        (document as any).webkitFullscreenElement ??
        (document as any).mozFullScreenElement ??
        (document as any).msFullscreenElement

      setIsFullscreen(!!isCurrentlyFullscreen)
      console.log(`[FullscreenChange] Полноэкранный режим ${isCurrentlyFullscreen ? "включен" : "выключен"}`)
    }

    // Добавляем слушатели для разных браузеров
    document.addEventListener("fullscreenchange", handleFullscreen)
    document.addEventListener("webkitfullscreenchange", handleFullscreen)
    document.addEventListener("mozfullscreenchange", handleFullscreen)
    document.addEventListener("MSFullscreenChange", handleFullscreen)

    return () => {
      // Удаляем слушатели при размонтировании
      document.removeEventListener("fullscreenchange", handleFullscreen)
      document.removeEventListener("webkitfullscreenchange", handleFullscreen)
      document.removeEventListener("mozfullscreenchange", handleFullscreen)
      document.removeEventListener("MSFullscreenChange", handleFullscreen)
    }
  }, [])

  /**
   * Функция для входа в полноэкранный режим
   * @param element Элемент, который нужно отобразить в полноэкранном режиме
   */
  const enterFullscreen = (element: HTMLElement) => {
    void element.requestFullscreen()
  }

  /**
   * Функция для выхода из полноэкранного режима
   */
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      ;(document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      ;(document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      ;(document as any).msExitFullscreen()
    }
  }

  /**
   * Функция для переключения полноэкранного режима
   * @param element Элемент, который нужно отобразить в полноэкранном режиме
   */
  const toggleFullscreen = (element: HTMLElement) => {
    if (document.fullscreenElement) {
      exitFullscreen()
    } else {
      enterFullscreen(element)
    }
  }

  logInfo("[useFullscreen] Хук готов", { isFullscreen })

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}
