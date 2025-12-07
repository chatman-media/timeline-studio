/**
 * Типы данных для Person Identification
 *
 * Определяет структуры данных для работы с распознаванием и идентификацией персон.
 *
 * Canonical source in domains/ai-services/types
 */

// Базовые типы для координат и времени
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Timecode {
  seconds: number
  frames?: number
}

export interface TimeRange {
  start: Timecode
  end: Timecode
}

// Face Detection - результат детекции лица
export interface DetectedFace {
  id: string
  bbox: BoundingBox
  confidence: number
  landmarks?: FacialLandmarks

  // Атрибуты лица
  age?: number
  gender?: "male" | "female" | "unknown"
  emotion?: "happy" | "sad" | "angry" | "surprised" | "neutral" | "fear" | "disgust"

  // Качественные характеристики
  blur: number // 0-1, где 1 = очень размыто
  occlusion: number // 0-1, где 1 = полностью закрыто
  pose: HeadPose // Поворот головы

  // Метаданные
  frameNumber?: number
  timestamp: Timecode
  clipId?: string

  // Продвинутые атрибуты (для совместимости с AdvancedFaceDetection)
  personId?: string
  name?: string
  embedding?: Float32Array
  thumbnailUrl?: string
}

// Базовые атрибуты лица
export interface FaceAttributes {
  age?: number
  gender?: "male" | "female" | "unknown"
  emotion?: "happy" | "sad" | "angry" | "surprised" | "neutral" | "fear" | "disgust"
  ethnicity?: string
  glasses?: boolean
  mask?: boolean
  smile?: number // 0-1
}

// Facial landmarks (68 точек)
export interface FacialLandmarks {
  points: Point2D[] // 68 точек лица
  quality: number // Качество детекции landmarks
}

export interface Point2D {
  x: number
  y: number
}

// Поворот головы
export interface HeadPose {
  yaw: number // Поворот влево-вправо (-90 до 90)
  pitch: number // Наклон вверх-вниз (-90 до 90)
  roll: number // Поворот по часовой стрелке (-180 до 180)
}

// 3D поза лица
export interface Face3DPose {
  yaw: number // Поворот влево/вправо
  pitch: number // Наклон вверх/вниз
  roll: number // Наклон влево/вправо

  // 3D позиция
  translation?: {
    x: number
    y: number
    z: number
  }

  // Матрица поворота
  rotationMatrix?: number[][]

  // Уверенность оценки позы
  confidence: number
}

// Качество изображения лица
export interface FaceImageQuality {
  sharpness: number // Резкость (0-1)
  brightness: number // Яркость (0-1)
  contrast: number // Контрастность (0-1)

  // Условия освещения
  lighting: {
    frontLit: number
    leftLit: number
    rightLit: number
    topLit: number
    bottomLit: number
  }

  // Общая оценка качества
  overall: number // Общая оценка качества (0-1)

  // Рекомендации
  usableForRecognition: boolean
  usableForIdentification: boolean
}

// Face Embedding - векторное представление лица
export interface FaceEmbedding {
  vector: Float32Array // 128D или 512D вектор
  quality: number // Качество embedding (0-1)

  // Связь с детекцией
  faceId: string
  personId?: string // ID персоны (может быть не установлен)
  timestamp: Timecode
  frameNumber: number
  clipId?: string
  landmarks?: FacialLandmarks
  createdAt: string
}

// Person Profile - профиль персоны
export interface PersonProfile {
  id: string
  name?: string // Имя (может быть не задано)
  isVerified: boolean // Подтверждена ли идентичность

  // Биометрические данные
  faceEmbeddings: FaceEmbedding[]
  averageEmbedding?: Float32Array // Усредненный вектор

  // Статистика появлений
  appearances: PersonAppearance[]
  totalScreenTime: number // В секундах
  firstSeen: Timecode
  lastSeen: Timecode

  // Метаданные
  tags: string[]
  notes?: string
  thumbnails: PersonThumbnail[]

  // Настройки приватности
  privacy: PersonPrivacySettings

  // Системные поля
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

// Появление персоны в видео
export interface PersonAppearance {
  id: string
  personId: string
  clipId: string

  // Временные рамки
  startTime: Timecode
  endTime: Timecode
  duration: number // В секундах

  // Качество идентификации
  confidence: number // Средняя уверенность
  minConfidence: number // Минимальная уверенность
  maxConfidence: number // Максимальная уверенность

  // Детекции в этом появлении
  detections: DetectedFace[]

  // Метаданные
  createdAt: string
}

// Миниатюра персоны
export interface PersonThumbnail {
  id: string
  imageUrl: string // Base64 или URL
  width: number
  height: number

  // Источник
  sourceClipId: string
  sourceTimestamp: Timecode
  quality: number // Качество изображения

  // Флаги
  isPrimary: boolean // Основная миниатюра
  isGenerated: boolean // Сгенерирована автоматически
}

// Настройки приватности
export interface PersonPrivacySettings {
  blurFace: boolean // Размывать лицо
  hideFromSearch: boolean // Скрывать из поиска
  anonymize: boolean // Полная анонимизация

  // Настройки размытия
  blurIntensity: number // 1-10
  blurTracking: boolean // Следить за движением
}

// Результат поиска персоны
export interface PersonSearchResult {
  person: PersonProfile
  similarity: number // Сходство с запросом (0-1)
  matches: FaceMatch[] // Конкретные совпадения
}

// Совпадение лиц
export interface FaceMatch {
  faceId: string
  personId: string
  similarity: number
  confidence: number

  // Контекст
  clipId: string
  timestamp: Timecode
  thumbnail?: string
}

// Статистика персоны
export interface PersonStats {
  personId: string

  // Основная статистика
  totalAppearances: number
  totalScreenTime: number // В секундах
  averageAppearanceLength: number

  // Распределение по клипам
  clipsCount: number
  clipIds: string[]

  // Качественные метрики
  averageConfidence: number
  bestConfidence: number
  worstConfidence: number

  // Временная статистика
  firstAppearance: Timecode
  lastAppearance: Timecode

  // Эмоциональная статистика
  emotionDistribution: Record<string, number>

  // Вычисленные поля
  screenTimePercentage: number // Процент от общего времени видео
  appearanceFrequency: number // Появлений в минуту
}

// Конфигурация детекции
export interface PersonDetectionConfig {
  // Модель детекции
  faceDetectionModel: "mtcnn" | "retinaface" | "yolo" | "mediapipe"

  // Параметры детекции
  minFaceSize: number // Минимальный размер лица в пикселях
  confidenceThreshold: number // Порог уверенности (0-1)
  maxFacesPerFrame: number // Максимум лиц на кадре

  // Обработка
  skipFrames: number // Пропускать каждые N кадров
  batchSize: number // Размер батча для обработки
  useGPU: boolean // Использовать GPU ускорение

  // Качество
  enableLandmarks: boolean // Детектировать landmarks
  enableAttributes: boolean // Определять возраст, пол, эмоции
  enableQualityCheck: boolean // Проверять качество лиц

  // Фильтры качества
  minBlurThreshold: number // Минимальная четкость
  maxOcclusionRatio: number // Максимальное перекрытие
  allowedPoseRange: {
    // Допустимые углы поворота
    yaw: [number, number]
    pitch: [number, number]
    roll: [number, number]
  }
}

// Конфигурация распознавания
export interface PersonRecognitionConfig {
  // Модель распознавания
  recognitionModel: "facenet" | "arcface" | "vggface" | "dlib"

  // Параметры сопоставления
  similarityThreshold: number // Порог сходства для идентификации
  embeddingDimension: number // Размерность вектора (128, 512, etc.)

  // Создание профилей
  minEmbeddingsForPerson: number // Минимум embeddings для создания профиля
  maxEmbeddingsPerPerson: number // Максимум embeddings на персону

  // Автоматическая группировка
  enableAutoClustering: boolean // Автоматическая кластеризация
  clusteringThreshold: number // Порог для кластеризации

  // Обновление профилей
  enableOnlineLearning: boolean // Обновлять профили новыми детекциями
  learningRate: number // Скорость обучения
}

// Экспорт данных персон
export interface PersonDataExport {
  format: "json" | "csv" | "xml" | "srt"

  // Фильтры
  personIds?: string[]
  timeRange?: TimeRange
  clipIds?: string[]

  // Настройки экспорта
  includeEmbeddings: boolean
  includeThumbnails: boolean
  includeTimecodes: boolean
  includePrivateData: boolean

  // Форматирование
  timestampFormat: "seconds" | "timecode" | "frames"
  includeConfidence: boolean
}

// Кластер персон для группировки неизвестных лиц
export interface PersonCluster {
  id: string
  faces: DetectedFace[]
  centroidEmbedding: Float32Array // Центроид кластера
  confidence: number // Средняя уверенность кластера
  timeRange: TimeRange
  clipIds: string[]
  createdAt: string
}

// События системы персон
export type PersonEvent =
  | { type: "person_detected"; data: { personId: string; appearance: PersonAppearance } }
  | { type: "person_created"; data: { person: PersonProfile } }
  | { type: "person_updated"; data: { personId: string; changes: Partial<PersonProfile> } }
  | { type: "person_merged"; data: { targetPersonId: string; mergedPersonIds: string[] } }
  | { type: "person_deleted"; data: { personId: string } }
  | { type: "detection_processed"; data: { clipId: string; detectionsCount: number } }
