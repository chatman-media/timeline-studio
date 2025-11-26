# Recognition

[English](./README.md) | **Русский**

## Обзор

Модуль распознавания объектов YOLO для Timeline Studio. Предоставляет компоненты для визуализации, анализа и взаимодействия с результатами распознавания объектов в видео. Поддерживает несколько моделей YOLO (YOLO11, YOLO8) для обнаружения объектов и распознавания лиц.

## Статус

- ✅ **Компоненты**: Наложение данных, визуализация, график, треки
- ✅ **Хуки**: use-yolo-data (43 теста)
- ✅ **Сервисы**: YoloDataService, SceneContextService
- ✅ **Тесты**: 43 теста проходят

## Структура

```
recognition/
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
├── __tests__/              # Тесты (43 теста)
│   ├── components/              # Тесты компонентов
│   ├── hooks/                   # Тесты хуков
│   └── services/                # Тесты сервисов
└── __mocks__/              # Общие моки для тестов
```

## Функции

### ✅ Реализовано

- [x] Инициализация YOLO процессора (модели YOLO11, YOLO8)
- [x] Визуализация обнаружения объектов
- [x] Поддержка распознавания лиц
- [x] Ограничивающие рамки с подписями поверх видео
- [x] Интерактивные графики и статистика
- [x] Временная шкала с навигацией по клику
- [x] Визуализация отслеживания объектов
- [x] Кэширование данных для производительности
- [x] Ленивая загрузка
- [x] Предзагрузка для списков видео
- [x] Создание контекста сцены для ИИ
- [x] Экспорт в JSON
- [x] Фильтрация по классам
- [x] Поддержка интернационализации

### ❌ Не реализовано

- [ ] Интеграция с Timeline для отображения данных
- [ ] Экспорт аннотированных кадров
- [ ] Фильтрация по уверенности
- [ ] Поддержка пользовательских моделей YOLO
- [ ] Анализ движения и поведения
- [ ] Распознавание в реальном времени
- [ ] Улучшение отслеживания множественных объектов

## Использование

### Базовое использование

```typescript
import { YoloDataOverlay, useYoloData } from '@/features/recognition'

function VideoPlayer({ video, currentTime }) {
  return (
    <div className="relative">
      <video src={video.path} />
      <YoloDataOverlay
        video={video}
        currentTime={currentTime}
      />
    </div>
  )
}
```

### Использование хука

```typescript
import { useYoloData } from '@/features/recognition'

function VideoAnalysis({ videoId }) {
  const {
    getYoloDataAtTimestamp,
    getVideoSummary,
    isLoading,
    getError
  } = useYoloData()

  const [detections, setDetections] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const data = await getYoloDataAtTimestamp(videoId, currentTime)
      setDetections(data)
    }
    loadData()
  }, [videoId, currentTime])

  if (isLoading(videoId)) return <div>Загрузка...</div>
  if (getError(videoId)) return <div>Ошибка: {getError(videoId)}</div>

  return (
    <div>
      <h3>Обнаружено объектов: {detections.length}</h3>
      {detections.map((detection, index) => (
        <div key={index}>
          {detection.class} ({Math.round(detection.confidence * 100)}%)
        </div>
      ))}
    </div>
  )
}
```

### Контекст сцены для ИИ

```typescript
import { SceneContextService } from '@/features/recognition'

const sceneService = new SceneContextService()

function AIAnalysis({ video, detections, timestamp }) {
  const context = sceneService.createSceneContext(
    { id: video.id, name: video.name },
    detections,
    timestamp
  )

  const chatDescription = sceneService.createChatDescription(context)
  const detailedDescription = sceneService.createDetailedDescription(context)

  return (
    <div>
      <h3>Контекст сцены</h3>
      <p>{chatDescription}</p>
      <button onClick={() => {
        navigator.clipboard.writeText(sceneService.exportToJSON(context))
      }}>
        Скопировать JSON
      </button>
    </div>
  )
}
```

## Интеграция

- **Зависит от**:
  - `@tauri-apps/api/core` - для invoke команд
  - `@/lib/tauri-logger` - для логирования
  - ONNX Runtime - для вывода модели
- **Используется в**:
  - Video Player - для отображения наложения
  - AI Chat - для контекста сцены
  - Media Browser - для анализа видео

## Тестирование

- **Всего тестов**: 43
- **Покрытие**: Компоненты, хуки, сервисы
- **Тестовые файлы**:
  - `services/montage-planner-machine.test.ts` - Тесты XState машины
  - `services/content-analyzer.test.ts` - Тесты анализа контента
  - `services/moment-detector.test.ts` - Тесты обнаружения моментов
  - `hooks/use-montage-planner.test.tsx` - Функциональность хука
  - `components/analysis/quality-meter.test.tsx` - Тесты компонентов

## TODO / Roadmap

- [ ] E2E тесты для workflow распознавания (18 тестов запланировано)
- [ ] Интеграция с Timeline для отображения данных
- [ ] Функция экспорта аннотированных кадров
- [ ] UI фильтрации по уверенности
- [ ] Поддержка пользовательских моделей YOLO
- [ ] Анализ движения и поведения
- [ ] Обработка распознавания в реальном времени
- [ ] Улучшение отслеживания множественных объектов
- [ ] Пакетная обработка распознавания
- [ ] Оптимизация производительности модели
