import { useNotifications } from "@timeline-studio/core/hooks"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { YoloDetection } from "@/features/recognition/types/yolo"
import { createLogger } from "@/lib/tauri-logger"
import { useYoloData } from "../hooks/use-yolo-data"

const logger = createLogger({ module: "YoloDataOverlay" })

interface YoloDataOverlayProps {
  video: {
    id: string
    name: string
    path: string
  }
  currentTime: number
}

/**
 * Компонент для отображения данных YOLO поверх видео
 * Показывает рамки вокруг обнаруженных объектов и информацию о них
 */
export function YoloDataOverlay({ video, currentTime }: YoloDataOverlayProps) {
  const { t } = useTranslation()
  const { showInfo } = useNotifications()
  const [detections, setDetections] = useState<YoloDetection[]>([])
  const { getYoloDataAtTimestamp } = useYoloData()

  // Загружаем данные YOLO для текущего времени
  useEffect(() => {
    const loadYoloData = async () => {
      try {
        // Округляем время до ближайшей секунды для оптимизации
        const timestamp = Math.round(currentTime)

        // Проверяем, есть ли данные для этого видео
        if (!video?.id) {
          setDetections([])
          return
        }

        const data = await getYoloDataAtTimestamp(video.id, timestamp)
        setDetections(data)
      } catch (error) {
        logger.error("[YoloDataOverlay] Ошибка при получении данных YOLO:", {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    void loadYoloData()
  }, [video?.id, currentTime, getYoloDataAtTimestamp])

  // Если нет обнаружений, не отображаем ничего
  if (!detections || detections.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10" data-oid="ho:69fd">
      {/* Отображаем рамки для каждого обнаруженного объекта */}
      {detections.map((detection, index) => (
        <DetectionBox key={index} detection={detection} data-oid=".j8ohws" />
      ))}

      {/* Информационная панель */}
      <div
        className="pointer-events-auto absolute top-4 left-4 rounded bg-black bg-opacity-50 p-2 text-white"
        data-oid="epyi.rm"
      >
        <div className="text-sm" data-oid="5:.knvc">
          {t("recognition.yolo.objectsDetected")}: {detections.length}
        </div>
        <div className="text-xs" data-oid="70:y48h">
          {detections
            .map((d) => d.class)
            .filter((value, index, self) => self.indexOf(value) === index)
            .join(", ")}
        </div>
      </div>

      {/* Кнопка для генерации контекста сцены для ИИ */}
      <button
        className="pointer-events-auto absolute right-4 bottom-4 rounded bg-blue-500 px-4 py-2 text-white"
        onClick={() => {
          // Копируем контекст сцены в буфер обмена
          void navigator.clipboard.writeText(
            JSON.stringify(
              {
                currentVideo: {
                  id: video.id,
                  name: video.name,
                  timestamp: currentTime,
                },
                detectedObjects: detections.map((d) => ({
                  class: d.class,
                  confidence: d.confidence,
                  position: calculatePosition(d),
                  size: calculateSize(d),
                })),
              },
              null,
              2,
            ),
          )

          showInfo(t("recognition.yolo.sceneContextCopiedTitle"), t("recognition.yolo.sceneContextCopiedMessage"))
        }}
        data-oid="kveq9.l"
      >
        {t("recognition.yolo.copySceneContext")}
      </button>
    </div>
  )
}

/**
 * Компонент для отображения рамки вокруг обнаруженного объекта
 */
function DetectionBox({ detection }: { detection: YoloDetection }) {
  // Определяем цвет рамки в зависимости от класса объекта
  const getColorForClass = (className: string): string => {
    const colors: Record<string, string> = {
      person: "rgba(255, 0, 0, 0.5)",
      car: "rgba(0, 255, 0, 0.5)",
      dog: "rgba(0, 0, 255, 0.5)",
      cat: "rgba(255, 255, 0, 0.5)",
    }

    return colors[className] || "rgba(255, 165, 0, 0.5)"
  }

  const { x, y, width, height } = detection.bbox
  const color = getColorForClass(detection.class)

  return (
    <div
      className="absolute flex items-end justify-start border-2"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${width * 100}%`,
        height: `${height * 100}%`,
        borderColor: color,
      }}
      data-oid="ioavauu"
    >
      <div
        className="max-w-full truncate px-1 text-xs text-white"
        style={{ backgroundColor: color }}
        data-oid="8cn5ii1"
      >
        {detection.class} ({Math.round(detection.confidence * 100)}%)
      </div>
    </div>
  )
}

/**
 * Рассчитать позицию объекта в кадре
 * @param detection Информация об обнаруженном объекте
 * @returns Текстовое описание позиции
 */
function calculatePosition(detection: YoloDetection): string {
  // Рассчитываем центр объекта
  const centerX = detection.bbox.x + detection.bbox.width / 2

  // Определяем горизонтальную позицию
  let horizontalPosition: string
  if (centerX < 0.33) {
    horizontalPosition = "left"
  } else if (centerX < 0.66) {
    horizontalPosition = "center"
  } else {
    horizontalPosition = "right"
  }

  // Рассчитываем вертикальную позицию
  const centerY = detection.bbox.y + detection.bbox.height / 2
  let verticalPosition: string
  if (centerY < 0.33) {
    verticalPosition = "top"
  } else if (centerY < 0.66) {
    verticalPosition = "middle"
  } else {
    verticalPosition = "bottom"
  }

  // Возвращаем комбинированную позицию
  return `${verticalPosition}-${horizontalPosition}`
}

/**
 * Рассчитать размер объекта в кадре
 * @param detection Информация об обнаруженном объекте
 * @returns Текстовое описание размера
 */
function calculateSize(detection: YoloDetection): string {
  // Рассчитываем площадь объекта относительно всего кадра
  const area = detection.bbox.width * detection.bbox.height

  // Определяем размер
  if (area < 0.05) {
    return "small"
  }
  if (area < 0.15) {
    return "medium"
  }
  return "large"
}
