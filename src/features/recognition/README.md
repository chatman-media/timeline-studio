# Recognition - Распознавание объектов YOLO

Модуль для работы с данными распознавания объектов YOLO в видео. Предоставляет компоненты для визуализации, анализа и взаимодействия с результатами распознавания.

## 📁 Структура

```
src/features/recognition/
├── components/              # React компоненты
│   ├── yolo-data-overlay.tsx      # Наложение данных YOLO на видео
│   ├── yolo-data-visualization.tsx # Визуализация данных в виде графиков
│   ├── yolo-graph-overlay.tsx     # График временной шкалы с навигацией
│   └── yolo-track-overlay.tsx     # Отображение треков объектов
├── hooks/                   # React хуки
│   └── use-yolo-data.ts           # Хук для работы с данными YOLO
├── services/                # Сервисы
│   ├── yolo-data-service.ts       # Сервис загрузки и кэширования данных
│   └── scene-context-service.ts   # Сервис создания контекста сцены для ИИ
├── __tests__/              # Тесты (43 работающих теста)
│   ├── components/              # Тесты компонентов
│   ├── hooks/                   # Тесты хуков
│   └── services/                # Тесты сервисов
├── __mocks__/              # Общие моки для тестов
├── index.ts                # Экспорты модуля
├── README.md              # Документация
└── DEV.md                # Техническая документация
```

## 🎯 Основные возможности

### ✅ Компоненты

- **YoloDataOverlay** - отображение рамок объектов поверх видео
- **YoloDataVisualization** - графики и статистика обнаружений
- **YoloGraphOverlay** - временная шкала с навигацией
- **YoloTrackOverlay** - треки движения объектов

### ✅ Хуки

- **useYoloData** - загрузка и управление данными YOLO
- Кэширование данных для оптимизации производительности
- Предзагрузка данных для списка видео

### ✅ Сервисы

- **YoloDataService** - загрузка, кэширование и обработка данных
- **SceneContextService** - создание контекста сцены для ИИ

## 🚀 Использование

### Базовое использование

```typescript
import { YoloDataOverlay, useYoloData } from '@/features/recognition';

function VideoPlayer({ video, currentTime }) {
  return (
    <div className="relative">
      <video src={video.path} />
      <YoloDataOverlay
        video={video}
        currentTime={currentTime}
      />
    </div>
  );
}
```

### Использование хука

```typescript
import { useYoloData } from '@/features/recognition';

function VideoAnalysis({ videoId }) {
  const {
    getYoloDataAtTimestamp,
    getVideoSummary,
    isLoading,
    getError
  } = useYoloData();

  const [detections, setDetections] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await getYoloDataAtTimestamp(videoId, currentTime);
      setDetections(data);
    };
    loadData();
  }, [videoId, currentTime]);

  if (isLoading(videoId)) return <div>Загрузка...</div>;
  if (getError(videoId)) return <div>Ошибка: {getError(videoId)}</div>;

  return (
    <div>
      <h3>Обнаружено объектов: {detections.length}</h3>
      {detections.map((detection, index) => (
        <div key={index}>
          {detection.class} ({Math.round(detection.confidence * 100)}%)
        </div>
      ))}
    </div>
  );
}
```

### Визуализация данных

```typescript
import { YoloDataVisualization } from '@/features/recognition';

function DataAnalysis({ yoloData }) {
  return (
    <YoloDataVisualization
      yoloData={yoloData}
      width={800}
      height={400}
    />
  );
}
```

### Создание контекста для ИИ

```typescript
import { SceneContextService } from '@/features/recognition';

const sceneService = new SceneContextService();

function AIAnalysis({ video, detections, timestamp }) {
  const context = sceneService.createSceneContext(
    { id: video.id, name: video.name },
    detections,
    timestamp
  );

  const chatDescription = sceneService.createChatDescription(context);
  const detailedDescription = sceneService.createDetailedDescription(context);

  return (
    <div>
      <h3>Контекст сцены</h3>
      <p>{chatDescription}</p>

      <button onClick={() => {
        navigator.clipboard.writeText(sceneService.exportToJSON(context));
      }}>
        Скопировать JSON
      </button>
    </div>
  );
}
```

## 📊 API хуков

### useYoloData()

```typescript
const {
  // Основные методы
  loadYoloData, // Загрузка данных для видео
  getYoloDataAtTimestamp, // Получение данных для времени
  getVideoSummary, // Получение сводки по видео
  getAllYoloData, // Получение всех данных
  hasYoloData, // Проверка наличия данных

  // Управление кэшем
  clearVideoCache, // Очистка кэша видео
  clearAllCache, // Очистка всего кэша
  getCacheStats, // Статистика кэша

  // Дополнительные возможности
  preloadYoloData, // Предзагрузка данных
  getSceneContext, // Создание контекста сцены

  // Состояния
  loadingStates, // Состояния загрузки
  errorStates, // Состояния ошибок
  isLoading, // Проверка загрузки
  getError, // Получение ошибки
} = useYoloData();
```

## 🎨 Компоненты

### YoloDataOverlay

Отображает рамки вокруг обнаруженных объектов поверх видео.

**Пропсы:**

- `video: { id: string, name: string, path: string }` - информация о видео
- `currentTime: number` - текущее время воспроизведения

**Возможности:**

- Отображение рамок с подписями
- Информационная панель с количеством объектов
- Кнопка копирования контекста сцены

### YoloDataVisualization

Визуализация данных YOLO в виде графиков и статистики.

**Пропсы:**

- `yoloData: YoloVideoData` - данные YOLO для визуализации
- `width?: number` - ширина графика (по умолчанию 800)
- `height?: number` - высота графика (по умолчанию 400)

**Возможности:**

- Интерактивный график количества обнаружений
- Фильтрация по классам объектов
- Статистические карточки

### YoloGraphOverlay

Временная шкала с возможностью навигации по времени.

**Пропсы:**

- `yoloData: YoloVideoData` - данные YOLO
- `currentTime: number` - текущее время
- `onTimeChange?: (time: number) => void` - обработчик изменения времени
- `width?: number` - ширина (по умолчанию 600)
- `height?: number` - высота (по умолчанию 100)

**Возможности:**

- Клик для перехода к времени
- Hover для предварительного просмотра
- Индикатор текущего времени

### YoloTrackOverlay

Отображение треков движения объектов.

**Пропсы:**

- `yoloData: YoloVideoData` - данные YOLO
- `currentTime: number` - текущее время
- `width?: number` - ширина (по умолчанию 400)
- `height?: number` - высота (по умолчанию 300)
- `showTrajectories?: boolean` - показывать траектории (по умолчанию true)

**Возможности:**

- Отображение траекторий движения
- Выбор треков кликом
- Цветовая кодировка по классам

## 🔧 Сервисы

### YoloDataService

Основной сервис для работы с данными YOLO.

**Методы:**

- `loadYoloData(videoId, videoPath?)` - загрузка данных
- `getYoloDataAtTimestamp(videoId, timestamp)` - данные для времени
- `getVideoSummary(videoId)` - сводка по видео
- `hasYoloData(videoId)` - проверка наличия данных
- `clearVideoCache(videoId)` - очистка кэша

### SceneContextService

Сервис для создания контекста сцены для ИИ.

**Методы:**

- `createSceneContext(videoInfo, detections, timestamp)` - создание контекста
- `createChatDescription(context)` - краткое описание для чата
- `createDetailedDescription(context)` - детальное описание
- `exportToJSON(context)` - экспорт в JSON
- `filterByClass(context, targetClass)` - фильтрация по классу

## 🌍 Интернационализация

Модуль поддерживает переводы для:

- Названий объектов и действий
- Описаний позиций и размеров
- Сообщений об ошибках
- Подсказок интерфейса

## 📈 Производительность

- **Кэширование данных** - автоматическое кэширование загруженных данных
- **Ленивая загрузка** - данные загружаются только при необходимости
- **Оптимизация рендеринга** - использование Canvas для графиков
- **Предзагрузка** - возможность предзагрузки данных для списка видео

## 🔮 Планы развития

- [ ] Интеграция с Timeline для отображения данных на временной шкале
- [ ] Экспорт аннотированных кадров
- [ ] Фильтрация по уверенности распознавания
- [ ] Поддержка пользовательских моделей YOLO
- [ ] Анализ движения и поведения объектов
