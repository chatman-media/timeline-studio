# Multi-Platform Engine

Движок для адаптации видео контента под требования различных социальных платформ.

## 🎯 Возможности

- **Адаптация формата** - изменение соотношения сторон и длительности
- **Оптимизация контента** - подбор лучших моментов для платформы
- **Генерация метаданных** - заголовки, описания, теги
- **Рекомендации по публикации** - время, хэштеги, аудитория
- **Превью и обложки** - автоматический выбор кадров
- **Соответствие гайдлайнам** - проверка требований платформ

## 🌐 Поддерживаемые платформы

### YouTube
- **Обычные видео**: до 12 часов, горизонтальные
- **Shorts**: до 60 сек, вертикальные
- **Оптимизация**: главы, конечные заставки, карточки

### TikTok
- **Видео**: до 10 мин (обычно 15-60 сек)
- **Формат**: 9:16 вертикальный
- **Особенности**: тренды, звуки, эффекты

### Instagram
- **Reels**: до 90 сек, вертикальные
- **Stories**: до 60 сек, вертикальные
- **IGTV**: до 60 мин, вертикальные/горизонтальные
- **Посты**: до 60 сек, квадратные

### Telegram
- **Видео сообщения**: до 1 мин, круглые
- **Обычные видео**: до 2 ГБ
- **Каналы**: любой формат с превью

### Twitter/X
- **Видео**: до 2:20 мин (140 сек)
- **Формат**: любое соотношение сторон
- **Оптимизация**: автовоспроизведение без звука

## 📁 Структура

```
multi-platform/
├── services/
│   ├── multi-platform-engine.ts    # Главный движок
│   └── platform-adapter.ts         # Адаптер для платформ
├── configs/                        # Конфигурации платформ
│   ├── youtube.config.ts
│   ├── tiktok.config.ts
│   ├── instagram.config.ts
│   └── telegram.config.ts
├── types.ts                        # TypeScript типы
└── README.md
```

## 🚀 Использование

### Базовая адаптация

```typescript
import { MultiPlatformEngine } from './services/multi-platform-engine'

const engine = new MultiPlatformEngine()

// Адаптировать для нескольких платформ
const adaptations = await engine.adaptContent(
  contentAnalysis, // Результат AI анализа
  ['youtube', 'tiktok', 'instagram']
)

// Получить рекомендации для YouTube
console.log(adaptations.youtube.recommendations)
console.log(adaptations.youtube.metadata)
console.log(adaptations.youtube.optimizedContent)
```

### Адаптация для конкретной платформы

```typescript
const youtubeContent = await engine.adaptForPlatform(
  analysis,
  'youtube',
  {
    targetDuration: 600, // 10 минут
    includeChapters: true,
    generateThumbnail: true
  }
)
```

### Проверка соответствия

```typescript
const validation = await engine.validateContent(
  videoFile,
  'instagram',
  'reels'
)

if (!validation.isValid) {
  console.log(validation.issues) // Что нужно исправить
  console.log(validation.suggestions) // Как исправить
}
```

## 📊 Конфигурации платформ

### YouTube Config

```typescript
{
  platform: 'youtube',
  formats: {
    regular: {
      maxDuration: 43200, // 12 часов
      aspectRatios: ['16:9', '4:3'],
      minResolution: '720p',
      features: ['chapters', 'cards', 'endscreen']
    },
    shorts: {
      maxDuration: 60,
      aspectRatios: ['9:16'],
      minResolution: '720p',
      features: ['music', 'effects']
    }
  },
  metadata: {
    titleMaxLength: 100,
    descriptionMaxLength: 5000,
    tagsMax: 500,
    hashtagsInDescription: true
  }
}
```

### TikTok Config

```typescript
{
  platform: 'tiktok',
  formats: {
    video: {
      maxDuration: 600, // 10 мин, но рекомендуется 15-60 сек
      optimalDuration: 30,
      aspectRatios: ['9:16'],
      minResolution: '720p',
      features: ['sounds', 'effects', 'filters', 'duet']
    }
  },
  metadata: {
    captionMaxLength: 2200,
    hashtagsMax: 100,
    mentionsAllowed: true
  },
  algorithm: {
    completionRateImportant: true,
    firstSecondsСritical: 3,
    loopable: true
  }
}
```

## 🎨 Типы адаптации

### Формат видео

```typescript
interface FormatAdaptation {
  aspectRatio: string
  resolution: string
  duration: number
  fps: number
  bitrate: number
  codec: string
}
```

### Контентная адаптация

```typescript
interface ContentAdaptation {
  clips: ClipSelection[]      // Выбранные клипы
  transitions: string[]       // Рекомендуемые переходы
  effects: string[]          // Эффекты для платформы
  music: MusicRecommendation // Музыкальное сопровождение
  pacing: 'slow' | 'medium' | 'fast'
}
```

### Метаданные

```typescript
interface PlatformMetadata {
  title: string
  description: string
  tags: string[]
  hashtags: string[]
  thumbnail: ThumbnailOptions
  category?: string
  language: string
  visibility: 'public' | 'private' | 'unlisted'
}
```

## 🔧 Продвинутые настройки

### Кастомные правила

```typescript
engine.addCustomRule('youtube', {
  name: 'intro-duration',
  check: (content) => content.scenes[0].duration <= 15,
  message: 'Интро должно быть не длиннее 15 секунд',
  autoFix: true
})
```

### Шаблоны адаптации

```typescript
// Создать шаблон для серии видео
const seriesTemplate = engine.createTemplate({
  name: 'tutorial-series',
  platforms: ['youtube', 'instagram'],
  style: {
    intro: 'branded',
    outro: 'cta',
    transitions: 'smooth'
  }
})

// Применить шаблон
const adapted = await engine.adaptWithTemplate(
  analysis,
  seriesTemplate
)
```

### A/B тестирование

```typescript
// Создать варианты для разных платформ
const variants = await engine.generateVariants(
  analysis,
  'tiktok',
  {
    count: 3,
    varyBy: ['hook', 'music', 'effects']
  }
)
```

## 📈 Оптимизация для алгоритмов

### YouTube

```typescript
const youtubeOptimized = await engine.optimizeForAlgorithm(
  content,
  'youtube',
  {
    targetAudience: 'tech-enthusiasts',
    goals: ['watch-time', 'engagement'],
    competitorAnalysis: true
  }
)
```

### TikTok

```typescript
const tiktokOptimized = await engine.optimizeForAlgorithm(
  content,
  'tiktok',
  {
    trends: await engine.getCurrentTrends('tiktok'),
    sounds: 'trending',
    style: 'fast-paced'
  }
)
```

## ⚡ Производительность

- **Анализ**: <1 сек на платформу
- **Адаптация метаданных**: ~2-3 сек
- **Генерация превью**: ~5-10 сек
- **Полная адаптация**: ~10-20 сек

## 🔍 Отладка

```typescript
// Включить подробные логи
engine.debug = true

// Проверить конфигурацию платформы
const config = engine.getPlatformConfig('instagram')

// Симулировать публикацию
const simulation = await engine.simulatePublishing(
  content,
  'youtube',
  { time: '18:00 UTC' }
)
```

## 📝 Примеры

### YouTube Shorts из длинного видео

```typescript
const shorts = await engine.extractShorts(
  longVideo,
  {
    maxShorts: 5,
    style: 'highlight-reel',
    addCaptions: true
  }
)
```

### Instagram карусель

```typescript
const carousel = await engine.createCarousel(
  analysis,
  {
    slides: 10,
    includeVideo: true,
    style: 'educational'
  }
)
```

### Кросс-постинг

```typescript
const crossPost = await engine.prepareCrossPost(
  content,
  {
    primary: 'youtube',
    secondary: ['instagram', 'tiktok'],
    staggerPublishing: true,
    adaptContent: true
  }
)
```