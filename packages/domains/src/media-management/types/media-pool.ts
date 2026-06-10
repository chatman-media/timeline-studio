/**
 * Media Pool - централизованное хранилище медиафайлов проекта
 * Вдохновлено DaVinci Resolve и Adobe Premiere Pro
 */

/**
 * Тип элемента в Media Pool
 */
export type MediaItemType = "video" | "audio" | "image" | "sequence" | "compound"

/**
 * Статус доступности медиа элемента
 */
export type MediaItemStatus = "online" | "offline" | "missing" | "proxy"

/**
 * Элемент в Media Pool
 */
export interface MediaPoolItem {
  /** Уникальный идентификатор */
  id: string

  /** Тип элемента */
  type: MediaItemType

  /** Имя элемента */
  name: string

  /** Описание (опционально) */
  description?: string

  /** Путь к исходному файлу */
  source: {
    path: string // Абсолютный путь к файлу
    relativePath?: string // Относительный путь от проекта
    hash?: string // MD5 хеш для проверки целостности
  }

  /** Статус доступности */
  status: MediaItemStatus

  /** ID папки, в которой находится элемент */
  binId: string

  /** Технические метаданные */
  metadata: {
    duration?: number // Длительность в секундах
    frameRate?: number // Частота кадров
    resolution?: {
      width: number
      height: number
    }
    codec?: string // Видео/аудио кодек
    bitRate?: number // Битрейт
    fileSize: number // Размер файла в байтах
    createdDate: Date // Дата создания файла
    modifiedDate: Date // Дата изменения файла
    importedDate: Date // Дата импорта в проект
  }

  /** Использование в проекте */
  usage: {
    sequences: string[] // ID секвенций, где используется
    count: number // Общее количество использований
    lastUsed?: Date // Последнее использование
  }

  /** Прокси и кэш */
  proxy?: {
    path: string // Путь к прокси файлу
    resolution: string // Разрешение прокси
    codec: string // Кодек прокси
    generated: Date // Дата генерации
  }

  /** Превью */
  thumbnail?: {
    path: string // Путь к миниатюре
    timestamp: number // Временная метка для видео
  }

  /** Аудио волновая форма */
  waveform?: {
    path: string // Путь к данным волновой формы
    peaks: Float32Array // Пиковые значения
  }

  /** Теги и метки */
  tags: string[]

  /** Цветовая метка */
  colorLabel?: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink"

  /** Рейтинг (1-5 звезд) */
  rating?: 1 | 2 | 3 | 4 | 5

  /** Заметки */
  notes?: string
}

/**
 * Папка (Bin) для организации медиа
 */
export interface MediaBin {
  /** Уникальный идентификатор */
  id: string

  /** Имя папки */
  name: string

  /** ID родительской папки (null для корневой) */
  parentId: string | null

  /** Цвет папки */
  color?: string

  /** Иконка папки */
  icon?: string

  /** Порядок сортировки */
  sortOrder: number

  /** Дата создания */
  createdDate: Date

  /** Развернута ли папка в UI */
  isExpanded?: boolean
}

/**
 * Умная коллекция (автоматическая группировка по критериям)
 */
export interface SmartCollection {
  /** Уникальный идентификатор */
  id: string

  /** Название коллекции */
  name: string

  /** Критерии фильтрации */
  criteria: {
    type?: MediaItemType[]
    tags?: string[]
    rating?: { min: number; max: number }
    dateRange?: { start: Date; end: Date }
    unused?: boolean // Только неиспользуемые файлы
    offline?: boolean // Только оффлайн файлы
    hasProxy?: boolean // Только с прокси
    custom?: string // Пользовательский фильтр
  }

  /** Цвет коллекции */
  color?: string

  /** Иконка коллекции */
  icon?: string
}

/**
 * Media Pool - главная структура
 */
export interface MediaPool {
  /** Все элементы в пуле */
  items: Map<string, MediaPoolItem>

  /** Структура папок */
  bins: Map<string, MediaBin>

  /** Умные коллекции */
  smartCollections: SmartCollection[]

  /** Настройки отображения */
  viewSettings: {
    sortBy: "name" | "date" | "type" | "duration" | "usage" | "rating"
    sortOrder: "asc" | "desc"
    viewMode: "list" | "thumbnails" | "filmstrip"
    thumbnailSize: "small" | "medium" | "large"
    showOfflineMedia: boolean
    showProxyBadge: boolean
  }

  /** Статистика */
  stats: {
    totalItems: number
    totalSize: number // Общий размер в байтах
    onlineItems: number
    offlineItems: number
    proxyItems: number
    unusedItems: number
  }
}

/**
 * Операции с Media Pool
 */
export interface MediaPoolOperations {
  /** Импорт медиафайлов */
  importMedia(files: File[], binId?: string): Promise<MediaPoolItem[]>

  /** Создание папки */
  createBin(name: string, parentId?: string): MediaBin

  /** Перемещение элементов между папками */
  moveItems(itemIds: string[], targetBinId: string): void

  /** Удаление элементов */
  deleteItems(itemIds: string[]): void

  /** Создание прокси */
  generateProxy(itemId: string, settings: ProxySettings): Promise<void>

  /** Поиск отсутствующих файлов */
  relinkOfflineMedia(itemIds: string[]): Promise<MediaPoolItem[]>

  /** Удаление неиспользуемых элементов */
  removeUnusedItems(): MediaPoolItem[]

  /** Экспорт списка медиа */
  exportMediaList(format: "csv" | "xml" | "json"): string
}

/**
 * Настройки прокси
 */
export interface ProxySettings {
  resolution: "1/4" | "1/2" | "custom"
  customResolution?: { width: number; height: number }
  codec: "h264" | "prores" | "dnxhd"
  quality: "low" | "medium" | "high"
  location: "project" | "cache" | "custom"
  customPath?: string
}

/**
 * Результат импорта медиа
 */
export interface MediaImportResult {
  imported: MediaPoolItem[]
  failed: { file: File; reason: string }[]
  duplicates: MediaPoolItem[]
}

/**
 * События Media Pool
 */
export interface MediaPoolEvents {
  onItemAdded: (item: MediaPoolItem) => void
  onItemRemoved: (itemId: string) => void
  onItemUpdated: (item: MediaPoolItem) => void
  onBinCreated: (bin: MediaBin) => void
  onBinDeleted: (binId: string) => void
  onProxyGenerated: (itemId: string) => void
  onMediaOffline: (itemId: string) => void
  onMediaOnline: (itemId: string) => void
}
