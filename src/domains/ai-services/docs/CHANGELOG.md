# AI Services Domain - Changelog

## История изменений и аудитов

---

## [2025-11-27] Remove AIServicesDomainProvider

**Статус:** Completed

### Изменения
- Удален AIServicesDomainProvider из архитектуры
- Обновлена документация API.md - удалена секция "Providers"
- Обновлена документация ARCHITECTURE.md:
  - Удален Provider слой из Component Diagram
  - Добавлена секция "No Domain Provider Pattern" в Key Design Decisions
  - Обновлен Data Flow - показано прямое использование singleton
- React хуки теперь работают напрямую с singleton UnifiedOrchestrator
- Упрощена архитектура - меньше слоев абстракции

### Причины
- Устранение лишнего слоя абстракции
- Упрощение API для пользователей домена
- Улучшение производительности (нет overhead от React Context)
- Упрощение тестирования

---

## [2025-11-26] Initial Documentation Structure

**Статус:** Completed

### Изменения
- Создана структура документации docs/
- Добавлен API.md с полным API reference
- Добавлен ARCHITECTURE.md с архитектурными диаграммами
- README.md сокращен до обзорного документа

---

## Legacy Documentation (до реструктуризации)

Ниже представлена оригинальная документация до разделения на отдельные файлы.

### AI Services Domain

Специализированные AI сервисы для анализа медиа контента в Timeline Studio.

### Обзор

AI Services домен предоставляет сервисы для глубокого анализа видео и аудио контента, включая детекцию сцен, распознавание объектов, анализ качества и многое другое.

### Структура

```
ai-services/
├── factories/         # Фабрики для создания сервисов
├── services/          # Реализации сервисов анализа
│   ├── content/      # Классификация контента
│   ├── ffmpeg/       # FFmpeg интеграция
│   └── vision/       # Computer Vision сервисы
├── types/            # TypeScript типы
└── index.ts          # Главный экспорт
```

### Основные сервисы

#### Media Analysis Factory

Централизованная фабрика для создания сервисов анализа:

```typescript
import { createMediaAnalysisFactory } from '@/domains/ai-services'

const factory = createMediaAnalysisFactory()

// Создание сервисов
const ffmpegService = factory.createFFmpegService()
const visionService = factory.createVisionService()
const contentService = factory.createContentAnalysisService()

// Проверка доступности
const isFFmpegAvailable = await factory.isFFmpegAvailable()
const availableServices = await factory.getAvailableServices()
```

#### FFmpeg Analysis Service

Анализ видео и аудио с помощью FFmpeg:

```typescript
const ffmpegService = factory.createFFmpegService()

// Анализ видео
const videoAnalysis = await ffmpegService.analyzeVideo('path/to/video.mp4')

// Анализ аудио
const audioAnalysis = await ffmpegService.analyzeAudio('path/to/audio.mp3')

// Извлечение кадров
const frames = await ffmpegService.extractFrames('video.mp4', {
  count: 10,
  format: 'png'
})

// Детекция сцен
const scenes = await ffmpegService.detectScenes('video.mp4', {
  threshold: 0.3
})
```

#### Vision Service

Computer Vision анализ с помощью ML моделей:

```typescript
const visionService = factory.createVisionService()

// Анализ кадра
const frameAnalysis = await visionService.analyzeFrame('frame.jpg')

// Детекция объектов
const objects = await visionService.detectObjects(['frame1.jpg', 'frame2.jpg'])

// Анализ композиции
const composition = await visionService.analyzeComposition('frame.jpg')

// Анализ цветов
const colors = await visionService.analyzeColors('frame.jpg')
```

### Типы данных

#### MediaFile
```typescript
interface MediaFile {
  path: string
  name: string
  duration: number
  type?: string
  size?: number
  metadata?: Record<string, any>
}
```

#### VideoAnalysisResult
```typescript
interface VideoAnalysisResult {
  duration: number
  fps: number
  resolution: { width: number; height: number }
  codec: string
  bitrate: number
  scenes: SceneInfo[]
  quality: QualityMetrics
}
```

### Behavior (from tests)

#### unified-orchestrator.test.ts
- ✓ Orchestrator предоставляет методы для всех AI операций
- ✓ Интеграция с FFmpeg, YOLO, Whisper сервисами
- ✓ Обработка ошибок и retry логика
- ✓ Кэширование результатов анализа

#### chat-machine.test.ts
- ✓ XState машина для управления AI чатом
- ✓ Отправка сообщений и получение ответов
- ✓ Поддержка streaming ответов
- ✓ Управление историей сообщений

#### ai-intelligence-machine.test.ts
- ✓ Машина состояний для AI интеллекта
- ✓ Анализ контента и генерация адаптаций
- ✓ Интеграция с платформами (YouTube, TikTok, Instagram)

### Dependencies

**Depends on:**
- `@tauri-apps/api` - Tauri IPC для коммуникации с backend
- `xstate` - State machines для управления сложным состоянием
- `@/lib/tauri-logger` - Логирование операций

**Used by:**
- `@/features/ai-chat` - AI ассистент в редакторе
- `@/features/ai-director` - AI режиссер для автомонтажа
- `@/features/recognition` - Распознавание объектов и лиц
- `@/domains/ai-tools` - AI инструменты для интеграции

### E2E Tests Checklist

| Тест | Статус | Приоритет |
|------|--------|-----------|
| FFmpeg анализ видео | ⏳ Planned | High |
| FFmpeg детекция сцен | ⏳ Planned | High |
| YOLO детекция объектов | ⏳ Planned | High |
| YOLO анализ видео | ⏳ Planned | High |
| Whisper транскрипция | ⏳ Planned | High |
| Монтаж планнер анализ | ⏳ Planned | High |
| RetinaFace детекция лиц | ⏳ Planned | Medium |
| FaceNet эмбеддинги | ⏳ Planned | Medium |
| AI Chat API ключи | ⏳ Planned | Medium |
