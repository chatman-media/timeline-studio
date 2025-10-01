import type { YoloDetection, YoloFrameData, YoloVideoData, YoloVideoSummary } from "@/features/recognition/types/yolo"

/**
 * Сервис для работы с данными YOLO
 * Обеспечивает загрузку, кэширование и обработку данных распознавания объектов
 */
export class YoloDataService {
  // Кэш для хранения данных YOLO
  private yoloDataCache: Record<string, YoloVideoData> = {}

  // Кэш для отслеживания видео, для которых нет данных
  private nonExistentFiles: Record<string, boolean> = {}

  // Счетчик для отслеживания количества сообщений о ненайденных данных YOLO
  private missingDataCount = 0

  // Флаг инициализации YOLO процессора
  private yoloInitialized = false

  /**
   * Найти ближайший кадр к указанной временной метке
   * @param frames Массив кадров
   * @param timestamp Временная метка
   * @returns Ближайший кадр или null, если кадры не найдены
   */
  private findClosestFrame(frames: YoloFrameData[], timestamp: number): YoloFrameData | null {
    if (!frames || frames.length === 0) {
      return null
    }

    // Если только один кадр, возвращаем его
    if (frames.length === 1) {
      return frames[0]
    }

    // Находим ближайший кадр
    let closestFrame = frames[0]
    let minDiff = Math.abs(closestFrame.timestamp - timestamp)

    for (let i = 1; i < frames.length; i++) {
      const diff = Math.abs(frames[i].timestamp - timestamp)
      if (diff < minDiff) {
        minDiff = diff
        closestFrame = frames[i]
      }
    }

    return closestFrame
  }

  /**
   * Загрузить данные YOLO для видео
   * @param videoId ID видео
   * @param videoPath Путь к видеофайлу (опционально)
   * @returns Данные YOLO или null, если не найдены
   */
  public async loadYoloData(videoId: string, videoPath?: string): Promise<YoloVideoData | null> {
    // Проверяем кэш
    if (this.yoloDataCache[videoId]) {
      return this.yoloDataCache[videoId]
    }

    // Проверяем, не пытались ли мы уже загрузить данные для этого видео
    if (this.nonExistentFiles[videoId]) {
      return null
    }

    try {
      // Пытаемся загрузить сохраненные данные из Tauri
      const { invoke } = await import("@tauri-apps/api/core")
      const savedData = await invoke<any>("load_yolo_data", { videoId })

      if (savedData) {
        const yoloData = savedData as YoloVideoData
        this.yoloDataCache[videoId] = yoloData
        return yoloData
      }

      // Если сохраненных данных нет и есть путь к видео, анализируем видео
      if (videoPath) {
        console.log(`[YoloDataService] Анализируем видео ${videoPath} с YOLO`)

        // Инициализируем YOLO процессор если еще не инициализирован
        const isInitialized = await this.ensureYoloInitialized()
        if (!isInitialized) {
          console.error("[YoloDataService] Не удалось инициализировать YOLO процессор")
          this.nonExistentFiles[videoId] = true
          return null
        }

        // Анализируем видео
        const results = await invoke<any[]>("analyze_video_with_yolo", {
          request: {
            video_path: videoPath,
            confidence_threshold: 0.5,
            skip_frames: 10, // Анализируем каждый 10-й кадр для производительности
          },
        })

        // Преобразуем результаты в формат YoloVideoData
        const frames: YoloFrameData[] = results.map((result) => ({
          frameNumber: result.frame_number,
          timestamp: result.timestamp,
          detections: result.detections.map((det: any) => ({
            id: `${result.frame_number}_${det.class_id}_${Math.random().toString(36).substring(7)}`,
            class: det.class,
            classId: det.class_id,
            confidence: det.confidence,
            bbox: det.bbox,
            trackId: det.track_id,
          })),
        }))

        const yoloData: YoloVideoData = {
          videoId,
          videoName: videoPath.split("/").pop() || videoId,
          videoPath: videoPath,
          frames,
          metadata: {
            model: "YOLOv11",
            version: "11.0",
            processedAt: new Date().toISOString(),
          },
        }

        // Сохраняем данные
        await invoke("save_yolo_data", { videoId, data: yoloData })

        this.yoloDataCache[videoId] = yoloData
        return yoloData
      }

      // Отмечаем, что данные для этого видео отсутствуют
      this.nonExistentFiles[videoId] = true
      return null
    } catch (error) {
      console.error(`[YoloDataService] Ошибка загрузки данных YOLO для видео ${videoId}:`, error)
      this.nonExistentFiles[videoId] = true
      return null
    }
  }

  /**
   * Получить данные YOLO для конкретного момента времени
   * @param videoId ID видео
   * @param timestamp Временная метка (в секундах от начала видео)
   * @returns Массив обнаруженных объектов или пустой массив, если данные не найдены
   */
  public async getYoloDataAtTimestamp(videoId: string, timestamp: number): Promise<YoloDetection[]> {
    // Проверяем, не пытались ли мы уже загрузить данные для этого видео
    if (this.nonExistentFiles[videoId]) {
      return []
    }

    // Проверяем кэш
    if (this.yoloDataCache[videoId]) {
      const yoloData = this.yoloDataCache[videoId]

      if (!yoloData.frames || yoloData.frames.length === 0) {
        return []
      }

      // Находим ближайший кадр к указанной временной метке
      const closestFrame = this.findClosestFrame(yoloData.frames, timestamp)

      if (!closestFrame) {
        return []
      }

      return closestFrame.detections
    }

    // Пытаемся загрузить данные
    const yoloData = await this.loadYoloData(videoId)
    if (yoloData) {
      return this.getYoloDataAtTimestamp(videoId, timestamp)
    }

    return []
  }

  /**
   * Получить сводную информацию о распознанных объектах в видео
   * @param videoId ID видео
   * @returns Сводная информация или null, если данные не найдены
   */
  public async getVideoSummary(videoId: string): Promise<YoloVideoSummary | null> {
    // Проверяем, не пытались ли мы уже загрузить данные для этого видео
    if (this.nonExistentFiles[videoId]) {
      return null
    }

    // Проверяем кэш
    if (this.yoloDataCache[videoId]) {
      const yoloData = this.yoloDataCache[videoId]

      if (!yoloData.frames || yoloData.frames.length === 0) {
        return null
      }

      // Собираем статистику
      const detectedClasses = new Set<string>()
      const classCounts: Record<string, number> = {}
      const classTimeRanges: Record<string, Array<{ start: number; end: number }>> = {}

      // Обрабатываем все кадры
      yoloData.frames.forEach((frame) => {
        frame.detections.forEach((detection) => {
          const className = detection.class
          detectedClasses.add(className)

          if (!classCounts[className]) {
            classCounts[className] = 0
          }
          classCounts[className]++

          // Обновляем временные диапазоны
          if (!classTimeRanges[className]) {
            classTimeRanges[className] = []
          }

          // Простая логика для создания временных диапазонов
          const lastRange = classTimeRanges[className][classTimeRanges[className].length - 1]
          if (!lastRange || frame.timestamp - lastRange.end > 2) {
            // Создаем новый диапазон, если прошло больше 2 секунд
            classTimeRanges[className].push({
              start: frame.timestamp,
              end: frame.timestamp,
            })
          } else {
            // Расширяем существующий диапазон
            lastRange.end = frame.timestamp
          }
        })
      })

      // Создаем сводную информацию
      return {
        videoId: videoId,
        videoName: yoloData.videoName || videoId,
        frameCount: yoloData.frames.length,
        detectedClasses: Array.from(detectedClasses),
        classCounts: classCounts,
        classTimeRanges: classTimeRanges,
      }
    }

    // Пытаемся загрузить данные
    const yoloData = await this.loadYoloData(videoId)
    if (yoloData) {
      return this.getVideoSummary(videoId)
    }

    return null
  }

  /**
   * Получить все данные YOLO для видео
   * @param videoId ID видео
   * @returns Все данные YOLO или null, если не найдены
   */
  public async getAllYoloData(videoId: string): Promise<YoloVideoData | null> {
    return this.loadYoloData(videoId)
  }

  /**
   * Проверить наличие данных YOLO для видео
   * @param videoId ID видео
   * @returns true, если данные есть в кэше
   */
  public hasYoloData(videoId: string): boolean {
    return !!this.yoloDataCache[videoId] && !this.nonExistentFiles[videoId]
  }

  /**
   * Очистить кэш для конкретного видео
   * @param videoId ID видео
   */
  public clearVideoCache(videoId: string): void {
    delete this.yoloDataCache[videoId]

    delete this.nonExistentFiles[videoId]
  }

  /**
   * Очистить весь кэш
   */
  public clearAllCache(): void {
    this.yoloDataCache = {}
    this.nonExistentFiles = {}
    this.missingDataCount = 0
  }

  /**
   * Получить статистику кэша
   * @returns Статистика использования кэша
   */
  public getCacheStats() {
    return {
      cachedVideos: Object.keys(this.yoloDataCache).length,
      nonExistentVideos: Object.keys(this.nonExistentFiles).length,
      totalMemoryUsage: JSON.stringify(this.yoloDataCache).length,
      missingDataCount: this.missingDataCount,
    }
  }

  /**
   * Сохранить данные YOLO в кэш
   * @param videoId ID видео
   * @param data Данные YOLO для сохранения
   */
  public async saveYoloData(videoId: string, data: YoloVideoData): Promise<void> {
    // Сохраняем в локальный кэш
    this.yoloDataCache[videoId] = data

    // Убираем из списка несуществующих файлов
    if (this.nonExistentFiles[videoId]) {
      delete this.nonExistentFiles[videoId]
    }

    console.log(`[YoloDataService] Данные YOLO сохранены для видео ${videoId}`)
  }

  /**
   * Инициализировать YOLO процессор
   * @returns true если инициализация успешна
   */
  private async ensureYoloInitialized(): Promise<boolean> {
    if (this.yoloInitialized) return true

    try {
      const { invoke } = await import("@tauri-apps/api/core")

      // Инициализируем YOLO процессор с моделью для детекции лиц
      await invoke("init_yolo_processor", {
        model_type: "yolo11-face",
        confidence_threshold: 0.5,
      })

      this.yoloInitialized = true
      console.log("[YoloDataService] YOLO процессор успешно инициализирован")
      return true
    } catch (error) {
      console.error("[YoloDataService] Ошибка инициализации YOLO процессора:", error)
      return false
    }
  }
}
