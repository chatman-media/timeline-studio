import { useCallback, useEffect, useRef } from "react"

interface WaveformScopeProps {
  width: number
  height: number
  refreshRate: number
}

export function WaveformScope({ width, height, refreshRate }: WaveformScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)

  // Функция для получения данных изображения из видео плеера
  const getVideoFrameData = useCallback(() => {
    // В реальном приложении здесь будет интеграция с Video Player
    // Пока возвращаем симулированные данные
    const videoElement = document.querySelector("video")

    if (videoElement && !videoElement.paused) {
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = videoElement.videoWidth || 320
      tempCanvas.height = videoElement.videoHeight || 240
      const tempCtx = tempCanvas.getContext("2d")

      if (tempCtx) {
        tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height)
        return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      }
    }

    return null
  }, [])

  // Рендеринг waveform
  const renderWaveform = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очистка canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, width, height)

    // Рисуем сетку
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 0.5

    // Горизонтальные линии (10%, 50%, 90%)
    const levels = [0.1, 0.5, 0.9]
    levels.forEach((level) => {
      const y = height * (1 - level)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    })

    // Получаем данные изображения
    const imageData = getVideoFrameData()

    if (imageData) {
      // Анализируем яркость для каждого столбца
      const waveformData = new Float32Array(width)
      const columnWidth = imageData.width / width

      for (let x = 0; x < width; x++) {
        let maxLuminance = 0
        const startX = Math.floor(x * columnWidth)
        const endX = Math.floor((x + 1) * columnWidth)

        for (let imgX = startX; imgX < endX; imgX++) {
          for (let imgY = 0; imgY < imageData.height; imgY++) {
            const idx = (imgY * imageData.width + imgX) * 4
            const r = imageData.data[idx]
            const g = imageData.data[idx + 1]
            const b = imageData.data[idx + 2]

            // Рассчитываем яркость (ITU-R BT.709)
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
            maxLuminance = Math.max(maxLuminance, luminance / 255)
          }
        }

        waveformData[x] = maxLuminance
      }

      // Рисуем waveform
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.8

      ctx.beginPath()
      for (let x = 0; x < width; x++) {
        const y = height * (1 - waveformData[x])
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // Добавляем свечение для ярких областей
      ctx.globalAlpha = 0.3
      ctx.shadowBlur = 10
      ctx.shadowColor = "#00ff00"
      ctx.stroke()

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    } else {
      // Демо режим - рисуем симулированный waveform
      const demoWaveform = []
      for (let x = 0; x < width; x++) {
        const phase = (x / width) * Math.PI * 4
        const value = 0.5 + 0.3 * Math.sin(phase) + 0.1 * Math.sin(phase * 3)
        demoWaveform.push(Math.max(0, Math.min(1, value)))
      }

      // Рисуем демо waveform
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.8

      ctx.beginPath()
      demoWaveform.forEach((value, x) => {
        const y = height * (1 - value)
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()
    }

    // Добавляем метки уровней
    ctx.fillStyle = "#666666"
    ctx.font = "10px monospace"
    ctx.textAlign = "right"

    levels.forEach((level) => {
      const y = height * (1 - level)
      ctx.fillText(`${Math.round(level * 100)}%`, width - 5, y - 2)
    })
  }, [width, height, getVideoFrameData])

  // Анимационный цикл
  const animate = useCallback(() => {
    const now = Date.now()
    const frameInterval = 1000 / refreshRate

    if (now - lastUpdateRef.current >= frameInterval) {
      renderWaveform()
      lastUpdateRef.current = now
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [refreshRate, renderWaveform])

  // Запуск анимации
  useEffect(() => {
    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  // Обновление размеров canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = width
      canvas.height = height
    }
  }, [width, height])

  return <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: "pixelated" }} data-oid="ci6qq:2" />
}
