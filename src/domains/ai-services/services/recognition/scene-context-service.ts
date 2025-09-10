import type { YoloDetection } from "@/features/recognition/types/yolo"

/**
 * Интерфейс для контекста сцены, понятного для ИИ
 */
export interface AISceneContext {
  /** Информация о текущем видео */
  currentVideo: {
    id: string
    name: string
    timestamp: number
  }
  /** Обнаруженные объекты в понятном для ИИ формате */
  detectedObjects: Array<{
    class: string
    confidence: number
    position: string
    size: string
    description?: string
  }>
  /** Общее описание сцены */
  sceneDescription: string
  /** Количество объектов по типам */
  objectCounts: Record<string, number>
  /** Доминирующие объекты в сцене */
  dominantObjects: string[]
}

/**
 * Сервис для создания контекста сцены для ИИ
 * Преобразует технические данные YOLO в понятный для ИИ формат
 */
export class SceneContextService {
  /**
   * Создать контекст сцены для ИИ на основе данных YOLO
   * @param videoInfo Информация о видео
   * @param detections Обнаруженные объекты
   * @param timestamp Временная метка
   * @returns Контекст сцены для ИИ
   */
  public createSceneContext(
    videoInfo: { id: string; name: string },
    detections: YoloDetection[],
    timestamp: number,
  ): AISceneContext {
    // Подсчитываем объекты по типам
    const objectCounts: Record<string, number> = {}
    detections.forEach((detection) => {
      const className = detection.class
      objectCounts[className] = (objectCounts[className] || 0) + 1
    })

    // Определяем доминирующие объекты (более 20% от общего количества)
    const totalObjects = detections.length
    const dominantObjects = Object.entries(objectCounts)
      .filter(([, count]) => count / totalObjects > 0.2)
      .map(([className]) => className)

    // Преобразуем технические данные в понятный для ИИ формат
    const detectedObjects = detections.map((detection) => ({
      class: detection.class,
      confidence: detection.confidence,
      position: this.calculatePosition(detection),
      size: this.calculateSize(detection),
      description: this.generateObjectDescription(detection),
    }))

    // Создаем общее описание сцены
    const sceneDescription = this.generateSceneDescription(detectedObjects, objectCounts)

    return {
      currentVideo: {
        id: videoInfo.id,
        name: videoInfo.name,
        timestamp,
      },
      detectedObjects,
      sceneDescription,
      objectCounts,
      dominantObjects,
    }
  }

  /**
   * Рассчитать позицию объекта в кадре
   * @param detection Информация об обнаруженном объекте
   * @returns Текстовое описание позиции
   */
  private calculatePosition(detection: YoloDetection): string {
    // Рассчитываем центр объекта
    const centerX = detection.bbox.x + detection.bbox.width / 2
    const centerY = detection.bbox.y + detection.bbox.height / 2

    // Определяем горизонтальную позицию
    let horizontalPosition: string
    if (centerX < 0.33) {
      horizontalPosition = "слева"
    } else if (centerX < 0.66) {
      horizontalPosition = "в центре"
    } else {
      horizontalPosition = "справа"
    }

    // Определяем вертикальную позицию
    let verticalPosition: string
    if (centerY < 0.33) {
      verticalPosition = "вверху"
    } else if (centerY < 0.66) {
      verticalPosition = "в середине"
    } else {
      verticalPosition = "внизу"
    }

    // Возвращаем комбинированную позицию
    return `${verticalPosition} ${horizontalPosition} кадра`
  }

  /**
   * Рассчитать размер объекта в кадре
   * @param detection Информация об обнаруженном объекте
   * @returns Текстовое описание размера
   */
  private calculateSize(detection: YoloDetection): string {
    // Рассчитываем площадь объекта относительно всего кадра
    const area = detection.bbox.width * detection.bbox.height

    // Определяем размер
    if (area < 0.05) {
      return "маленький"
    }
    if (area < 0.15) {
      return "средний"
    }
    if (area < 0.4) {
      return "большой"
    }
    return "очень большой"
  }

  /**
   * Сгенерировать описание объекта
   * @param detection Информация об обнаруженном объекте
   * @returns Описание объекта
   */
  private generateObjectDescription(detection: YoloDetection): string {
    const className = detection.class
    const position = this.calculatePosition(detection)
    const size = this.calculateSize(detection)
    const confidence = Math.round(detection.confidence * 100)

    return `${size} ${className} ${position} (уверенность: ${confidence}%)`
  }

  /**
   * Сгенерировать общее описание сцены
   * @param detectedObjects Обнаруженные объекты
   * @param objectCounts Количество объектов по типам
   * @returns Описание сцены
   */
  private generateSceneDescription(
    detectedObjects: Array<{ class: string; position: string; size: string }>,
    objectCounts: Record<string, number>,
  ): string {
    if (detectedObjects.length === 0) {
      return "В кадре не обнаружено объектов."
    }

    const descriptions: string[] = []

    // Группируем объекты по типам и создаем описания
    Object.entries(objectCounts).forEach(([className, count]) => {
      const objectsOfClass = detectedObjects.filter((obj) => obj.class === className)

      if (count === 1) {
        const obj = objectsOfClass[0]
        descriptions.push(`${obj.size} ${className} ${obj.position}`)
      } else {
        // Для множественных объектов создаем обобщенное описание
        const positions = objectsOfClass.map((obj) => obj.position)
        const uniquePositions = [...new Set(positions)]

        if (uniquePositions.length === 1) {
          descriptions.push(`${count} ${className}(ов) ${uniquePositions[0]}`)
        } else if (uniquePositions.length <= 2) {
          descriptions.push(`${count} ${className}(ов) ${uniquePositions.join(" и ")}`)
        } else {
          descriptions.push(`${count} ${className}(ов) в разных частях кадра`)
        }
      }
    })

    return `В кадре обнаружено: ${descriptions.join(", ")}.`
  }

  /**
   * Создать краткое описание сцены для чата с ИИ
   * @param context Контекст сцены
   * @returns Краткое описание
   */
  public createChatDescription(context: AISceneContext): string {
    const { detectedObjects, objectCounts } = context

    if (detectedObjects.length === 0) {
      return "Пустая сцена без объектов."
    }

    // Создаем краткое описание для чата
    const totalObjects = detectedObjects.length
    const uniqueClasses = Object.keys(objectCounts).length

    let description = `Сцена содержит ${totalObjects} объект(ов) ${uniqueClasses} типа(ов): `

    const classDescriptions = Object.entries(objectCounts).map(([className, count]) => {
      return count === 1 ? className : `${count} ${className}(ов)`
    })

    description += `${classDescriptions.join(", ")}.`

    // Добавляем информацию о доминирующих объектах
    if (context.dominantObjects.length > 0) {
      description += ` Основные объекты: ${context.dominantObjects.join(", ")}.`
    }

    return description
  }

  /**
   * Создать детальное описание для анализа ИИ
   * @param context Контекст сцены
   * @returns Детальное описание
   */
  public createDetailedDescription(context: AISceneContext): string {
    const { detectedObjects, sceneDescription, currentVideo } = context

    let description = `Анализ видео "${currentVideo.name}" на временной метке ${currentVideo.timestamp.toFixed(1)} секунд:\n\n`

    description += `${sceneDescription}\n\n`

    if (detectedObjects.length > 0) {
      description += "Детальная информация об объектах:\n"
      detectedObjects.forEach((obj, index) => {
        description += `${index + 1}. ${obj.description}\n`
      })
    }

    return description
  }

  /**
   * Экспортировать контекст в JSON формат
   * @param context Контекст сцены
   * @returns JSON строка
   */
  public exportToJSON(context: AISceneContext): string {
    return JSON.stringify(context, null, 2)
  }

  /**
   * Создать контекст для конкретного типа объектов
   * @param context Полный контекст сцены
   * @param targetClass Целевой класс объектов
   * @returns Отфильтрованный контекст
   */
  public filterByClass(context: AISceneContext, targetClass: string): AISceneContext {
    const filteredObjects = context.detectedObjects.filter((obj) => obj.class === targetClass)

    const filteredCounts: Record<string, number> = {}
    filteredCounts[targetClass] = context.objectCounts[targetClass] || 0

    return {
      ...context,
      detectedObjects: filteredObjects,
      objectCounts: filteredCounts,
      dominantObjects: context.dominantObjects.includes(targetClass) ? [targetClass] : [],
      sceneDescription: this.generateSceneDescription(filteredObjects, filteredCounts),
    }
  }
}
