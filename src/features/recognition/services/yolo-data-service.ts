import {
  YoloDetection,
  YoloFrameData,
  YoloVideoData,
  YoloVideoSummary,
} from "@/types/yolo";

/**
 * Сервис для работы с данными YOLO
 * Обеспечивает загрузку, кэширование и обработку данных распознавания объектов
 */
export class YoloDataService {
  // Кэш для хранения данных YOLO
  private yoloDataCache: Record<string, YoloVideoData> = {};

  // Кэш для отслеживания видео, для которых нет данных
  private nonExistentFiles: Record<string, boolean> = {};

  // Счетчик для отслеживания количества сообщений о ненайденных данных YOLO
  private missingDataCount = 0;

  /**
   * Найти ближайший кадр к указанной временной метке
   * @param frames Массив кадров
   * @param timestamp Временная метка
   * @returns Ближайший кадр или null, если кадры не найдены
   */
  private findClosestFrame(
    frames: YoloFrameData[],
    timestamp: number,
  ): YoloFrameData | null {
    if (!frames || frames.length === 0) {
      return null;
    }

    // Если только один кадр, возвращаем его
    if (frames.length === 1) {
      return frames[0];
    }

    // Находим ближайший кадр
    let closestFrame = frames[0];
    let minDiff = Math.abs(closestFrame.timestamp - timestamp);

    for (let i = 1; i < frames.length; i++) {
      const diff = Math.abs(frames[i].timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestFrame = frames[i];
      }
    }

    return closestFrame;
  }

  /**
   * Загрузить данные YOLO для видео
   * @param videoId ID видео
   * @param videoPath Путь к видеофайлу (опционально)
   * @returns Данные YOLO или null, если не найдены
   */
  public async loadYoloData(
    videoId: string,
    videoPath?: string,
  ): Promise<YoloVideoData | null> {
    // Проверяем кэш
    if (this.yoloDataCache[videoId]) {
      return this.yoloDataCache[videoId];
    }

    // Проверяем, не пытались ли мы уже загрузить данные для этого видео
    if (this.nonExistentFiles[videoId]) {
      return null;
    }

    try {
      // Здесь должна быть логика загрузки данных YOLO из файла или API
      // Пока возвращаем null, так как реальная загрузка не реализована

      // Пример структуры данных, которые могли бы быть загружены:
      // const yoloData: YoloVideoData = {
      //   videoId,
      //   videoName: videoPath ? path.basename(videoPath) : videoId,
      //   videoPath: videoPath || "",
      //   frames: [], // Загруженные кадры с обнаружениями
      //   metadata: {
      //     model: "YOLOv8",
      //     version: "8.0",
      //     processedAt: new Date().toISOString(),
      //   }
      // }

      // this.yoloDataCache[videoId] = yoloData
      // return yoloData

      // Отмечаем, что данные для этого видео отсутствуют
      this.nonExistentFiles[videoId] = true;
      return null;
    } catch (error) {
      console.error(
        `[YoloDataService] Ошибка загрузки данных YOLO для видео ${videoId}:`,
        error,
      );
      this.nonExistentFiles[videoId] = true;
      return null;
    }
  }

  /**
   * Получить данные YOLO для конкретного момента времени
   * @param videoId ID видео
   * @param timestamp Временная метка (в секундах от начала видео)
   * @returns Массив обнаруженных объектов или пустой массив, если данные не найдены
   */
  public async getYoloDataAtTimestamp(
    videoId: string,
    timestamp: number,
  ): Promise<YoloDetection[]> {
    // Проверяем, не пытались ли мы уже загрузить данные для этого видео
    if (this.nonExistentFiles[videoId]) {
      return [];
    }

    // Проверяем кэш
    if (this.yoloDataCache[videoId]) {
      const yoloData = this.yoloDataCache[videoId];

      if (!yoloData.frames || yoloData.frames.length === 0) {
        return [];
      }

      // Находим ближайший кадр к указанной временной метке
      const closestFrame = this.findClosestFrame(yoloData.frames, timestamp);

      if (!closestFrame) {
        return [];
      }

      return closestFrame.detections;
    }

    // Пытаемся загрузить данные
    const yoloData = await this.loadYoloData(videoId);
    if (yoloData) {
      return this.getYoloDataAtTimestamp(videoId, timestamp);
    }

    return [];
  }

  /**
   * Получить сводную информацию о распознанных объектах в видео
   * @param videoId ID видео
   * @returns Сводная информация или null, если данные не найдены
   */
  public async getVideoSummary(
    videoId: string,
  ): Promise<YoloVideoSummary | null> {
    // Проверяем, не пытались ли мы уже загрузить данные для этого видео
    if (this.nonExistentFiles[videoId]) {
      return null;
    }

    // Проверяем кэш
    if (this.yoloDataCache[videoId]) {
      const yoloData = this.yoloDataCache[videoId];

      if (!yoloData.frames || yoloData.frames.length === 0) {
        return null;
      }

      // Собираем статистику
      const detectedClasses = new Set<string>();
      const classCounts: Record<string, number> = {};
      const classTimeRanges: Record<
        string,
        Array<{ start: number; end: number }>
      > = {};

      // Обрабатываем все кадры
      yoloData.frames.forEach((frame) => {
        frame.detections.forEach((detection) => {
          const className = detection.class;
          detectedClasses.add(className);

          if (!classCounts[className]) {
            classCounts[className] = 0;
          }
          classCounts[className]++;

          // Обновляем временные диапазоны
          if (!classTimeRanges[className]) {
            classTimeRanges[className] = [];
          }

          // Простая логика для создания временных диапазонов
          const lastRange =
            classTimeRanges[className][classTimeRanges[className].length - 1];
          if (!lastRange || frame.timestamp - lastRange.end > 2) {
            // Создаем новый диапазон, если прошло больше 2 секунд
            classTimeRanges[className].push({
              start: frame.timestamp,
              end: frame.timestamp,
            });
          } else {
            // Расширяем существующий диапазон
            lastRange.end = frame.timestamp;
          }
        });
      });

      // Создаем сводную информацию
      return {
        videoId: videoId,
        videoName: yoloData.videoName || videoId,
        frameCount: yoloData.frames.length,
        detectedClasses: Array.from(detectedClasses),
        classCounts: classCounts,
        classTimeRanges: classTimeRanges,
      };
    }

    // Пытаемся загрузить данные
    const yoloData = await this.loadYoloData(videoId);
    if (yoloData) {
      return this.getVideoSummary(videoId);
    }

    return null;
  }

  /**
   * Получить все данные YOLO для видео
   * @param videoId ID видео
   * @returns Все данные YOLO или null, если не найдены
   */
  public async getAllYoloData(videoId: string): Promise<YoloVideoData | null> {
    return this.loadYoloData(videoId);
  }

  /**
   * Проверить наличие данных YOLO для видео
   * @param videoId ID видео
   * @returns true, если данные есть в кэше
   */
  public hasYoloData(videoId: string): boolean {
    return !!this.yoloDataCache[videoId] && !this.nonExistentFiles[videoId];
  }

  /**
   * Очистить кэш для конкретного видео
   * @param videoId ID видео
   */
  public clearVideoCache(videoId: string): void {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.yoloDataCache[videoId];
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.nonExistentFiles[videoId];
  }

  /**
   * Очистить весь кэш
   */
  public clearAllCache(): void {
    this.yoloDataCache = {};
    this.nonExistentFiles = {};
    this.missingDataCount = 0;
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
    };
  }
}
