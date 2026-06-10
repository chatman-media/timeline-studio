/**
 * Статус доступности сохраненного медиафайла
 */
export type FileStatus = "available" | "missing" | "moved" | "unknown"

/**
 * Интерфейс для сохраненного медиафайла в проекте
 * Содержит всю необходимую информацию для восстановления файла при открытии проекта
 */
export interface SavedMediaFile {
  /** Уникальный ID файла (hash от пути + размера + даты) */
  id: string

  /** Оригинальный абсолютный путь к файлу */
  originalPath: string

  /** Относительный путь от файла проекта (если файл в поддиректории проекта) */
  relativePath?: string

  /** Имя файла */
  name: string

  /** Размер файла в байтах */
  size: number

  /** Время последней модификации файла (timestamp) */
  lastModified: number

  /** Флаг видеофайла */
  isVideo: boolean

  /** Флаг аудиофайла */
  isAudio: boolean

  /** Флаг изображения */
  isImage: boolean

  /** Сохраненные метаданные файла */
  metadata: SavedFileMetadata

  /** Текущий статус доступности файла */
  status: FileStatus

  /** Альтернативные пути для поиска перемещенных файлов */
  alternativePaths?: string[]

  /** Время последней проверки доступности файла */
  lastChecked: number
}

/**
 * Интерфейс для сохраненного музыкального файла
 * Расширяет SavedMediaFile дополнительными музыкальными метаданными
 */
export interface SavedMusicFile extends SavedMediaFile {
  /** Дополнительные музыкальные метаданные */
  musicMetadata?: MusicMetadata
}

/**
 * Метаданные медиафайла, сохраненные в проекте
 */
export interface SavedFileMetadata {
  /** Длительность в секундах (для видео/аудио) */
  duration?: number

  /** Время начала в секундах */
  startTime?: number

  /** Дата создания файла (ISO string) */
  createdAt?: string

  /** Данные FFprobe (streams и format) */
  probeData?: {
    streams: any[]
    format: any
  }
}

/**
 * Музыкальные метаданные
 */
export interface MusicMetadata {
  /** Исполнитель */
  artist?: string

  /** Альбом */
  album?: string

  /** Жанр */
  genre?: string

  /** Год выпуска */
  year?: number

  /** Номер трека */
  track?: number

  /** Название композиции */
  title?: string

  /** Длительность альбома */
  albumDuration?: number
}

/**
 * Состояние браузера медиафайлов для сохранения в проект
 */
export interface SavedBrowserState {
  /** Состояние медиавкладки */
  media: {
    viewMode: "list" | "grid" | "thumbnails"
    sortBy: string
    sortOrder: "asc" | "desc"
    searchQuery: string
    filterType: string
    groupBy: string
  }

  /** Состояние музыкальной вкладки */
  music: {
    viewMode: "list" | "thumbnails"
    sortBy: string
    sortOrder: "asc" | "desc"
    searchQuery: string
    filterType: string
    groupBy: "none" | "artist" | "genre" | "album"
    showFavoritesOnly: boolean
  }
}

/**
 * Избранные файлы, специфичные для проекта
 */
export interface ProjectFavorites {
  /** ID избранных медиафайлов */
  mediaFiles: string[]

  /** ID избранных музыкальных файлов */
  musicFiles: string[]
}

/**
 * Медиабиблиотека проекта
 */
export interface ProjectMediaLibrary {
  /** Сохраненные медиафайлы */
  mediaFiles: SavedMediaFile[]

  /** Сохраненные музыкальные файлы */
  musicFiles: SavedMusicFile[]

  /** Время последнего обновления библиотеки */
  lastUpdated: number

  /** Версия формата библиотеки */
  version: string
}

/**
 * Результат валидации медиафайлов при загрузке проекта
 */
export interface MediaValidationResult {
  /** Доступные медиафайлы */
  availableMedia: SavedMediaFile[]

  /** Доступные музыкальные файлы */
  availableMusic: SavedMusicFile[]

  /** Недостающие файлы */
  missingFiles: SavedMediaFile[]

  /** Файлы с измененными метаданными */
  modifiedFiles: SavedMediaFile[]
}

/**
 * Опции для поиска недостающих файлов
 */
export interface FileSearchOptions {
  /** Искать в поддиректориях */
  searchSubdirectories: boolean

  /** Максимальная глубина поиска */
  maxDepth: number

  /** Дополнительные директории для поиска */
  additionalPaths: string[]

  /** Проверять размер файла */
  checkFileSize: boolean

  /** Проверять дату модификации */
  checkModificationDate: boolean
}

/**
 * Результат поиска недостающего файла
 */
export interface FileSearchResult {
  /** Исходный сохраненный файл */
  originalFile: SavedMediaFile

  /** Найденный путь к файлу */
  foundPath?: string

  /** Уверенность в совпадении (0-1) */
  confidence: number

  /** Причина, если файл не найден */
  reason?: string
}

/**
 * Действия для обработки недостающих файлов
 */
export interface MissingFileActions {
  /** Поиск файлов в новом расположении */
  relocateFiles: (files: SavedMediaFile[]) => Promise<SavedMediaFile[]>

  /** Удаление ссылок на недостающие файлы */
  removeFiles: (files: SavedMediaFile[]) => void

  /** Игнорировать недостающие файлы */
  ignore: () => void

  /** Поиск файлов автоматически */
  autoSearch: (options: FileSearchOptions) => Promise<FileSearchResult[]>
}

/**
 * Утилитарные типы для работы с сохраненными файлами
 */

/** Тип для конвертации MediaFile в SavedMediaFile */
export type MediaFileToSaved = (file: any, projectPath?: string) => Promise<SavedMediaFile>

/** Тип для конвертации SavedMediaFile в MediaFile */
export type SavedToMediaFile = (saved: SavedMediaFile) => any

/** Тип для генерации уникального ID файла */
export type FileIdGenerator = (filePath: string, metadata: any) => string

/** Тип для вычисления относительного пути */
export type RelativePathCalculator = (filePath: string, projectPath: string) => Promise<string | undefined>
