import { useCallback, useEffect, useRef } from "react"

interface HistogramScopeProps {
  width: number
  height: number
  refreshRate: number
}

export function HistogramScope({ width, height, refreshRate }: HistogramScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(null)
  const lastUpdateRef = useRef<number>(0)

  // Функция для получения данных изображения
  const getVideoFrameData = useCallback(() => {
    const videoElement = document.querySelector("video")

    if (videoElement && !videoElement.paused) {
      const tempCanvas = document.createElement("canvas")
      const scale = 0.5 // Баланс между производительностью и точностью
      tempCanvas.width = (videoElement.videoWidth || 320) * scale
      tempCanvas.height = (videoElement.videoHeight || 240) * scale
      const tempCtx = tempCanvas.getContext("2d")

      if (tempCtx) {
        tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height)
        return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      }
    }

    return null
  }, [])

  // Рендеринг histogram
  const renderHistogram = useCallback(() => {
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

    // Вертикальные линии (25%, 50%, 75%)
    ;[0.25, 0.5, 0.75].forEach((x) => {
      ctx.beginPath()
      ctx.moveTo(width * x, 0)
      ctx.lineTo(width * x, height)
      ctx.stroke()
    })

    // Горизонтальные линии
    ;[0.25, 0.5, 0.75].forEach((y) => {
      ctx.beginPath()
      ctx.moveTo(0, height * y)
      ctx.lineTo(width, height * y)
      ctx.stroke()
    })

    // Получаем данные изображения
    const imageData = getVideoFrameData()

    if (imageData) {
      // Создаем гистограммы для каждого канала
      const histogramR = new Uint32Array(256)
      const histogramG = new Uint32Array(256)
      const histogramB = new Uint32Array(256)
      const histogramL = new Uint32Array(256) // Luminance

      // Подсчитываем значения
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]

        histogramR[r]++
        histogramG[g]++
        histogramB[b]++

        // Рассчитываем яркость
        const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
        histogramL[luminance]++
      }

      // Находим максимальное значение для нормализации
      let maxValue = 0
      for (let i = 0; i < 256; i++) {
        maxValue = Math.max(maxValue, histogramR[i], histogramG[i], histogramB[i])
      }

      // Масштабируем для отображения
      const scale = (height * 0.9) / maxValue
      const barWidth = width / 256

      // Рисуем гистограмму яркости (серый фон)
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
      ctx.beginPath()
      ctx.moveTo(0, height)

      for (let i = 0; i < 256; i++) {
        const x = i * barWidth
        const h = histogramL[i] * scale
        ctx.lineTo(x, height - h)
      }

      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.fill()

      // Рисуем RGB каналы
      const channels = [
        {
          data: histogramR,
          color: "rgba(255, 0, 0, 0.6)",
          strokeColor: "#ff0000",
        },
        {
          data: histogramG,
          color: "rgba(0, 255, 0, 0.6)",
          strokeColor: "#00ff00",
        },
        {
          data: histogramB,
          color: "rgba(0, 0, 255, 0.6)",
          strokeColor: "#0000ff",
        },
      ]

      channels.forEach((channel) => {
        // Заливка
        ctx.fillStyle = channel.color
        ctx.beginPath()
        ctx.moveTo(0, height)

        for (let i = 0; i < 256; i++) {
          const x = i * barWidth
          const h = channel.data[i] * scale
          ctx.lineTo(x, height - h)
        }

        ctx.lineTo(width, height)
        ctx.closePath()
        ctx.fill()

        // Контур
        ctx.strokeStyle = channel.strokeColor
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.8
        ctx.beginPath()

        for (let i = 0; i < 256; i++) {
          const x = i * barWidth + barWidth / 2
          const h = channel.data[i] * scale

          if (i === 0) {
            ctx.moveTo(x, height - h)
          } else {
            ctx.lineTo(x, height - h)
          }
        }

        ctx.stroke()
        ctx.globalAlpha = 1
      })
    } else {
      // Демо режим - генерируем случайные гистограммы
      const demoHistogram = {
        r: new Array(256).fill(0).map((_, i) => Math.max(0, Math.sin((i / 256) * Math.PI) * 0.8 + Math.random() * 0.2)),
        g: new Array(256)
          .fill(0)
          .map((_, i) => Math.max(0, Math.sin((i / 256) * Math.PI * 1.2) * 0.7 + Math.random() * 0.2)),
        b: new Array(256)
          .fill(0)
          .map((_, i) => Math.max(0, Math.sin((i / 256) * Math.PI * 0.8) * 0.6 + Math.random() * 0.2)),
      }

      const barWidth = width / 256

      // Рисуем демо каналы
      const channels = [
        { data: demoHistogram.r, color: "rgba(255, 0, 0, 0.4)" },
        { data: demoHistogram.g, color: "rgba(0, 255, 0, 0.4)" },
        { data: demoHistogram.b, color: "rgba(0, 0, 255, 0.4)" },
      ]

      channels.forEach((channel) => {
        ctx.fillStyle = channel.color
        ctx.beginPath()
        ctx.moveTo(0, height)

        channel.data.forEach((value, i) => {
          const x = i * barWidth
          const h = value * height * 0.8
          ctx.lineTo(x, height - h)
        })

        ctx.lineTo(width, height)
        ctx.closePath()
        ctx.fill()
      })
    }

    // Добавляем метки
    ctx.fillStyle = "#666666"
    ctx.font = "10px monospace"

    // Метки по оси X (0, 64, 128, 192, 255)
    ;[0, 64, 128, 192, 255].forEach((val) => {
      const x = (val / 255) * width
      ctx.textAlign = "center"
      ctx.fillText(val.toString(), x, height - 2)
    })

    // Метки по оси Y
    ctx.textAlign = "right"
    ctx.fillText("100%", 30, 12)
    ctx.fillText("50%", 30, height / 2)
    ctx.fillText("0%", 30, height - 5)
  }, [width, height, getVideoFrameData])

  // Анимационный цикл
  const animate = useCallback(() => {
    const now = Date.now()
    const frameInterval = 1000 / refreshRate

    if (now - lastUpdateRef.current >= frameInterval) {
      renderHistogram()
      lastUpdateRef.current = now
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [refreshRate, renderHistogram])

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

  return <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: "auto" }} data-oid=":yv.jj3" />
}
