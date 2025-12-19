import { useCallback, useEffect, useRef } from "react"

interface VectorscopeScopeProps {
  width: number
  height: number
  refreshRate: number
}

export function VectorscopeScope({ width, height, refreshRate }: VectorscopeScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)

  // Функция для получения данных изображения
  const getVideoFrameData = useCallback(() => {
    const videoElement = document.querySelector("video")

    if (videoElement && !videoElement.paused) {
      const tempCanvas = document.createElement("canvas")
      const scale = 0.25 // Уменьшаем для производительности
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

  // Конвертация RGB в YUV
  const rgbToYuv = useCallback((r: number, g: number, b: number) => {
    // Нормализуем значения
    r /= 255
    g /= 255
    b /= 255

    // ITU-R BT.709
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const u = -0.09991 * r - 0.33609 * g + 0.436 * b
    const v = 0.615 * r - 0.55861 * g - 0.05639 * b

    return { y, u, v }
  }, [])

  // Рендеринг vectorscope
  const renderVectorscope = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.4

    // Очистка canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, width, height)

    // Рисуем координатную сетку
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 0.5

    // Внешний круг
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Внутренние круги (25%, 50%, 75%)
    ;[0.25, 0.5, 0.75].forEach((scale) => {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2)
      ctx.stroke()
    })

    // Оси
    ctx.beginPath()
    ctx.moveTo(centerX - radius, centerY)
    ctx.lineTo(centerX + radius, centerY)
    ctx.moveTo(centerX, centerY - radius)
    ctx.lineTo(centerX, centerY + radius)
    ctx.stroke()

    // Метки основных цветов
    const colorTargets = [
      { angle: 0, color: "#ff0000", label: "R" }, // Red
      { angle: 60, color: "#ffff00", label: "Yl" }, // Yellow
      { angle: 120, color: "#00ff00", label: "G" }, // Green
      { angle: 180, color: "#00ffff", label: "Cy" }, // Cyan
      { angle: 240, color: "#0000ff", label: "B" }, // Blue
      { angle: 300, color: "#ff00ff", label: "Mg" }, // Magenta
    ]

    colorTargets.forEach((target) => {
      const angle = ((target.angle - 90) * Math.PI) / 180
      const x = centerX + radius * 0.9 * Math.cos(angle)
      const y = centerY + radius * 0.9 * Math.sin(angle)

      // Метка
      ctx.fillStyle = target.color
      ctx.fillRect(x - 3, y - 3, 6, 6)

      // Текст
      ctx.fillStyle = "#666666"
      ctx.font = "10px monospace"
      ctx.textAlign = "center"
      ctx.fillText(target.label, x, y - 8)
    })

    // Получаем данные изображения
    const imageData = getVideoFrameData()

    if (imageData) {
      // Создаем накопительный буфер для плотности точек
      const vectorData = new Uint8Array(width * height)

      // Анализируем каждый пиксель
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]

        const { u, v } = rgbToYuv(r, g, b)

        // Преобразуем UV в координаты на canvas
        const x = Math.round(centerX + u * radius * 2)
        const y = Math.round(centerY - v * radius * 2)

        // Проверяем границы
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = y * width + x
          vectorData[idx] = Math.min(255, vectorData[idx] + 1)
        }
      }

      // Рисуем накопленные данные
      const imgData = ctx.createImageData(width, height)

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x
          const density = vectorData[idx]

          if (density > 0) {
            const pixelIdx = idx * 4
            // Цвет от синего к зеленому к желтому в зависимости от плотности
            if (density < 85) {
              imgData.data[pixelIdx] = 0
              imgData.data[pixelIdx + 1] = density * 3
              imgData.data[pixelIdx + 2] = 255 - density * 3
            } else if (density < 170) {
              imgData.data[pixelIdx] = (density - 85) * 3
              imgData.data[pixelIdx + 1] = 255
              imgData.data[pixelIdx + 2] = 0
            } else {
              imgData.data[pixelIdx] = 255
              imgData.data[pixelIdx + 1] = 255 - (density - 170) * 3
              imgData.data[pixelIdx + 2] = 0
            }
            imgData.data[pixelIdx + 3] = Math.min(255, density * 2)
          }
        }
      }

      ctx.putImageData(imgData, 0, 0)
    } else {
      // Демо режим - рисуем симулированные точки
      const numPoints = 1000
      ctx.fillStyle = "#00ff00"
      ctx.globalAlpha = 0.5

      for (let i = 0; i < numPoints; i++) {
        // Генерируем случайные точки с нормальным распределением
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * Math.random() * radius * 0.7

        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance

        ctx.fillRect(x, y, 1, 1)
      }

      ctx.globalAlpha = 1
    }

    // Центральная точка
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(centerX - 1, centerY - 1, 2, 2)
  }, [width, height, getVideoFrameData, rgbToYuv])

  // Анимационный цикл
  const animate = useCallback(() => {
    const now = Date.now()
    const frameInterval = 1000 / refreshRate

    if (now - lastUpdateRef.current >= frameInterval) {
      renderVectorscope()
      lastUpdateRef.current = now
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [refreshRate, renderVectorscope])

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

  return <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: "auto" }} data-oid="99q9zpk" />
}
