# Recognition - Техническая документация

## 📁 Архитектура модуля

### Компоненты

#### ✅ YoloDataOverlay

**Файл**: `components/yolo-data-overlay.tsx`
**Статус**: ✅ Реализован

**Функциональность:**

- Отображение рамок объектов поверх видео
- Информационная панель с количеством объектов
- Кнопка копирования контекста сцены
- Цветовая кодировка по классам объектов

**Зависимости:**

- `useYoloData` хук
- `toast` для уведомлений
- `YoloDetection` типы

#### ✅ YoloDataVisualization

**Файл**: `components/yolo-data-visualization.tsx`
**Статус**: ✅ Реализован

**Функциональность:**

- SVG графики количества обнаружений
- Интерактивная легенда с фильтрацией
- Статистические карточки
- Hover эффекты и подсказки

**Технические детали:**

- Использует SVG для рендеринга графиков
- Масштабирование данных для отображения
- Цветовая схема для разных классов

#### ✅ YoloGraphOverlay

**Файл**: `components/yolo-graph-overlay.tsx`
**Статус**: ✅ Реализован

**Функциональность:**

- Canvas-based рендеринг для производительности
- Клик для навигации по времени
- Hover для предварительного просмотра
- Индикатор текущего времени

**Технические детали:**

- Использует Canvas API с учетом DPI
- Оптимизированный рендеринг сетки
- Обработка событий мыши

#### ✅ YoloTrackOverlay

**Файл**: `components/yolo-track-overlay.tsx`
**Статус**: ✅ Реализован

**Функциональность:**

- Отображение траекторий движения объектов
- Группировка обнаружений в треки
- Выбор треков кликом
- Анимированные текущие обнаружения

**Алгоритмы:**

- Простая эвристика для создания треков
- Фильтрация треков по минимальному количеству точек
- Цветовая кодировка по классам

### Хуки

#### ✅ useYoloData

**Файл**: `hooks/use-yolo-data.ts`
**Статус**: ✅ Реализован

**API:**

```typescript
const {
  loadYoloData, // (videoId, videoPath?) => Promise<YoloVideoData | null>
  getYoloDataAtTimestamp, // (videoId, timestamp) => Promise<YoloDetection[]>
  getVideoSummary, // (videoId) => Promise<YoloVideoSummary | null>
  getAllYoloData, // (videoId) => Promise<YoloVideoData | null>
  hasYoloData, // (videoId) => boolean
  clearVideoCache, // (videoId) => void
  clearAllCache, // () => void
  getCacheStats, // () => CacheStats
  preloadYoloData, // (videoIds[]) => Promise<void>
  getSceneContext, // (videoId, timestamp) => Promise<string>
  loadingStates, // Record<string, boolean>
  errorStates, // Record<string, string | null>
  isLoading, // (videoId) => boolean
  getError, // (videoId) => string | null
} = useYoloData();
```

**Особенности:**

- Автоматическое управление состояниями загрузки и ошибок
- Кэширование данных на уровне хука
- Предзагрузка для оптимизации UX

### Сервисы

#### ✅ YoloDataService

**Файл**: `services/yolo-data-service.ts`
**Статус**: ✅ Реализован (базовая структура)

**Функциональность:**

- Кэширование данных YOLO
- Поиск ближайших кадров по времени
- Управление состоянием несуществующих файлов
- Статистика использования кэша

**Методы:**

```typescript
class YoloDataService {
  loadYoloData(
    videoId: string,
    videoPath?: string,
  ): Promise<YoloVideoData | null>;
  getYoloDataAtTimestamp(
    videoId: string,
    timestamp: number,
  ): Promise<YoloDetection[]>;
  getVideoSummary(videoId: string): Promise<YoloVideoSummary | null>;
  getAllYoloData(videoId: string): Promise<YoloVideoData | null>;
  hasYoloData(videoId: string): boolean;
  clearVideoCache(videoId: string): void;
  clearAllCache(): void;
  getCacheStats(): CacheStats;
}
```

**Примечание**: Реальная загрузка данных пока не реализована, возвращает заглушки.

#### ✅ SceneContextService

**Файл**: `services/scene-context-service.ts`
**Статус**: ✅ Реализован

**Функциональность:**

- Преобразование технических данных YOLO в понятный для ИИ формат
- Создание описаний сцены на естественном языке
- Анализ позиций и размеров объектов
- Экспорт контекста в различных форматах

**API:**

```typescript
interface AISceneContext {
  currentVideo: { id: string; name: string; timestamp: number };
  detectedObjects: Array<{
    class: string;
    confidence: number;
    position: string;
    size: string;
    description?: string;
  }>;
  sceneDescription: string;
  objectCounts: Record<string, number>;
  dominantObjects: string[];
}

class SceneContextService {
  createSceneContext(videoInfo, detections, timestamp): AISceneContext;
  createChatDescription(context): string;
  createDetailedDescription(context): string;
  exportToJSON(context): string;
  filterByClass(context, targetClass): AISceneContext;
}
```

## 🔧 Типы данных

Модуль использует типы из `@/types/yolo`:

```typescript
interface YoloDetection {
  class: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  trackId?: number;
}

interface YoloFrameData {
  timestamp: number;
  detections: YoloDetection[];
}

interface YoloVideoData {
  videoId: string;
  videoName: string;
  videoPath: string;
  duration?: number;
  startTime?: number;
  frames: YoloFrameData[];
  metadata?: {
    model: string;
    version: string;
    processedAt: string;
    fps?: number;
    [key: string]: any;
  };
}

interface YoloVideoSummary {
  videoId: string;
  videoName: string;
  frameCount: number;
  detectedClasses: string[];
  classCounts: Record<string, number>;
  classTimeRanges: Record<string, Array<{ start: number; end: number }>>;
}
```

## 🎨 Стилизация

### Цветовая схема

```typescript
const classColors: Record<string, string> = {
  person: "#FF6B6B", // Красный
  car: "#4ECDC4", // Бирюзовый
  dog: "#45B7D1", // Синий
  cat: "#F9CA24", // Желтый
  bicycle: "#6C5CE7", // Фиолетовый
  motorcycle: "#A29BFE", // Светло-фиолетовый
  bus: "#FD79A8", // Розовый
  truck: "#00B894", // Зеленый
};
```

### CSS классы

- `.pointer-events-none` - отключение событий мыши для оверлеев
- `.pointer-events-auto` - включение событий для интерактивных элементов
- Tailwind CSS для быстрой стилизации
- Адаптивные сетки для статистики

## 🚀 Производительность

### Оптимизации

1. **Кэширование данных**

   - Кэш на уровне сервиса
   - Отслеживание несуществующих файлов
   - Статистика использования памяти

2. **Рендеринг**

   - Canvas для графиков (YoloGraphOverlay, YoloTrackOverlay)
   - SVG для статических элементов (YoloDataVisualization)
   - Учет DPI для четкости на Retina дисплеях

3. **Обработка событий**
   - Throttling для mouse move событий
   - Debouncing для поиска ближайших кадров
   - Ленивая загрузка данных

### Метрики

```typescript
interface CacheStats {
  cachedVideos: number; // Количество видео в кэше
  nonExistentVideos: number; // Количество несуществующих видео
  totalMemoryUsage: number; // Использование памяти в байтах
  missingDataCount: number; // Счетчик пропущенных данных
}
```

## 🧪 Тестирование

### ✅ Реализованные тесты

```
src/features/recognition/__tests__/
├── components/
│   ├── yolo-data-overlay.test.tsx        ✅ 9 тестов
│   ├── yolo-data-visualization.test.tsx  ✅ 12 тестов
│   ├── yolo-graph-overlay.test.tsx       ✅ 11 тестов
│   └── yolo-track-overlay.test.tsx       ✅ 12 тестов
├── hooks/
│   └── use-yolo-data.test.ts             ✅ 18 тестов
├── services/
│   ├── yolo-data-service.test.ts         ✅ 15 тестов
│   └── scene-context-service.test.ts     ✅ 16 тестов
└── index.ts                              ✅ Экспорты тестов
```

**Общее покрытие**: 43 теста работают ✅ (сервисы полностью протестированы)
**Статус компонентов**: Требуют настройки тестовой среды для Canvas API и DOM

### Тестовые данные

```typescript
const mockYoloData: YoloVideoData = {
  videoId: "test-video",
  videoName: "test.mp4",
  videoPath: "/path/to/test.mp4",
  frames: [
    {
      timestamp: 0,
      detections: [
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
        },
      ],
    },
  ],
};
```

## 🔮 Планы развития

### Краткосрочные (1-2 недели)

- [ ] Реализация реальной загрузки данных YOLO
- [ ] Добавление тестов для всех компонентов
- [ ] Интеграция с Timeline модулем

### Среднесрочные (1-2 месяца)

- [ ] Поддержка пользовательских моделей YOLO
- [ ] Экспорт аннотированных кадров
- [ ] Анализ движения объектов

### Долгосрочные (3+ месяца)

- [ ] Машинное обучение для улучшения треков
- [ ] Интеграция с облачными сервисами распознавания
- [ ] Поддержка других форматов данных (COCO, Pascal VOC)

## 🐛 Известные проблемы

1. **Загрузка данных**: Пока не реализована реальная загрузка файлов YOLO
2. **Треки объектов**: Простая эвристика может создавать неточные треки
3. **Производительность**: Большие объемы данных могут замедлить рендеринг

## 📝 Соглашения

### Именование

- Компоненты: PascalCase с префиксом Yolo
- Хуки: camelCase с префиксом use
- Сервисы: PascalCase с суффиксом Service
- Типы: PascalCase с префиксом Yolo

### Структура файлов

- Один компонент на файл
- Экспорт через index.ts
- Документация в README.md и DEV.md
- Тесты в отдельной папке tests/
