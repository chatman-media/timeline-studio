# Transcription Module

Модуль транскрипции для Timeline Studio обеспечивает высокоскоростное распознавание речи с использованием передовых AI технологий.

## 📊 Статус модуля

- ✅ **Готовность**: Полностью реализован и готов к использованию
- ✅ **Компоненты**: 4 компонента для транскрипции
- ✅ **Хуки**: 2 хука для управления транскрипцией и моделями
- ✅ **Сервисы**: Унифицированный сервис для всех провайдеров
- ✅ **Провайдеры**: OpenAI Whisper, локальный Whisper, Faster Whisper
- ✅ **Интернационализация**: Поддержка 20+ языков распознавания

## 📁 Архитектура модуля

```
src/features/transcription/
├── components/                      # React компоненты
│   ├── transcription-panel.tsx     # Основная панель транскрипции
│   ├── transcription-editor.tsx    # Редактор результатов
│   ├── model-selector.tsx          # Выбор и загрузка моделей
│   ├── language-selector.tsx       # Выбор языка
│   └── index.ts                    # Экспорты компонентов
├── hooks/                          # React хуки
│   └── use-transcription.ts        # Хуки для транскрипции
├── services/                       # Сервисы
│   └── transcription-service.ts    # Основной сервис транскрипции
├── types/                          # TypeScript типы
│   └── index.ts                    # Интерфейсы и типы
├── index.ts                        # Главный экспорт модуля
└── README.md                       # Документация модуля
```

## 🚀 Возможности

### ✅ Реализовано

1. **Множественные провайдеры**
   - OpenAI Whisper API (облачный)
   - Локальный Whisper (whisper.cpp)
   - Faster Whisper (до 4x быстрее)
   - Автоматический выбор лучшего провайдера

2. **Модели и языки**
   - 6 размеров моделей (tiny → large-v3)
   - 20+ языков с автоопределением
   - Word-level timestamps
   - VAD (Voice Activity Detection)

3. **UI/UX**
   - Интуитивная панель транскрипции
   - Прогресс в реальном времени
   - Редактор с временными метками
   - Управление моделями

4. **Экспорт**
   - SRT (SubRip)
   - VTT (WebVTT)  
   - ASS (Advanced SubStation)
   - Прямое добавление на таймлайн

### 🚧 В разработке

- Streaming обработка больших файлов
- Кэширование результатов
- Batch processing
- Background tasks

## 💡 Использование модуля

### Быстрый старт

```typescript
import { TranscriptionPanel } from '@/features/transcription';

function MyComponent() {
  const handleAddToTimeline = (segments) => {
    // Добавление субтитров на таймлайн
    logger.debugSync('Добавлено сегментов:', segments.length);
  };

  return (
    <TranscriptionPanel onAddToTimeline={handleAddToTimeline} />
  );
}
```

### Использование хука транскрипции

```typescript
import { useTranscription } from '@/features/transcription';

function TranscribeButton() {
  const { transcribe, isTranscribing, result, progress } = useTranscription();
  
  const handleTranscribe = async () => {
    const result = await transcribe('/path/to/media.mp4', {
      modelSize: 'base',
      language: 'auto',
      task: 'transcribe',
      wordTimestamps: true,
      vadFilter: true
    });
    
    if (result) {
      logger.debugSync(`Распознано: ${result.segments.length} сегментов`);
    }
  };
  
  return (
    <div>
      <button onClick={handleTranscribe} disabled={isTranscribing}>
        {isTranscribing ? `Обработка... ${progress.progress}%` : 'Транскрибировать'}
      </button>
      
      {result && (
        <p>Язык: {result.language} • Сегментов: {result.segments.length}</p>
      )}
    </div>
  );
}
```

### Управление моделями

```typescript
import { useWhisperModels } from '@/features/transcription';
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

function ModelManager() {
  const { models, loadModels, downloadModel, downloadProgress } = useWhisperModels();
  
  useEffect(() => {
    loadModels();
  }, []);
  
  return (
    <div>
      {models.map(model => (
        <div key={model.name}>
          <h4>{model.name} ({model.size})</h4>
          {model.isDownloaded ? (
            <span>✅ Скачано</span>
          ) : (
            <button onClick={() => downloadModel(model.name)}>
              Скачать {downloadProgress[model.name] && `(${downloadProgress[model.name]}%)`}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## 🔗 API Reference

### TranscriptionOptions

```typescript
interface TranscriptionOptions {
  language?: string              // Код языка или undefined для автоопределения
  task: "transcribe" | "translate"
  modelSize: "tiny" | "base" | "small" | "medium" | "large-v1" | "large-v2" | "large-v3"
  wordTimestamps: boolean
  vadFilter: boolean
  maxSegmentLength?: number
  provider?: "openai" | "local" | "faster-whisper"
  device?: "auto" | "cpu" | "cuda" | "mps"
  computeType?: "auto" | "int8" | "float16" | "float32"
}
```

### TranscriptionResult

```typescript
interface TranscriptionResult {
  segments: TranscriptionSegment[]
  language: string
  languageProbability: number
  duration: number
  text: string
  processingTime?: number
}
```

### TranscriptionSegment

```typescript
interface TranscriptionSegment {
  id: number
  start: number
  end: number
  text: string
  words?: TranscriptionWord[]
  confidence?: number
}
```

## 🎨 Компоненты

### TranscriptionPanel
Основная панель для транскрипции медиафайлов с полным UI.

**Props:**
- `onAddToTimeline?: (segments: TranscriptionSegment[]) => void` - Callback для добавления на таймлайн

### TranscriptionEditor
Редактор результатов транскрипции с возможностью редактирования текста и просмотра временных меток.

**Props:**
- `result: TranscriptionResult` - Результат транскрипции
- `onAddToTimeline?: (segments: TranscriptionSegment[]) => void` - Callback для добавления на таймлайн

### ModelSelector
Компонент для просмотра и загрузки моделей Whisper.

### LanguageSelector
Компонент выбора языка с поддержкой автоопределения.

**Props:**
- `value?: string` - Выбранный язык
- `onChange: (value: string | undefined) => void` - Callback изменения
- `includeAutoDetect?: boolean` - Показывать опцию автоопределения

## 🛠️ Сервисы

### TranscriptionService
Основной сервис для работы с транскрипцией.

**Методы:**
- `transcribeMedia(path, options, onProgress?)` - Транскрибировать медиафайл
- `generateSubtitles(result, format)` - Генерировать субтитры
- `getAvailableModels()` - Получить список моделей
- `downloadModel(name, onProgress?)` - Скачать модель
- `getSupportedLanguages()` - Получить поддерживаемые языки
- `recommendModel(duration, useLocal?)` - Рекомендовать модель

## ⚡ Производительность

### Сравнение провайдеров

| Провайдер | Скорость | Память | Точность | Требования |
|-----------|----------|---------|----------|------------|
| OpenAI API | Средняя | - | Высокая | API ключ, интернет |
| Локальный Whisper | 1x | Высокая | Высокая | CPU/GPU |
| Faster Whisper | 4x | Низкая | Высокая | CPU/GPU, Python |

### Рекомендации по выбору модели

- **tiny** (39MB) - Для коротких записей, быстрая обработка
- **base** (74MB) - Оптимальный баланс скорости и качества
- **small** (244MB) - Улучшенное качество для общих задач
- **medium** (769MB) - Высокое качество для важных проектов
- **large-v3** (1.5GB) - Максимальная точность для профессиональных задач

## 🌍 Поддерживаемые языки

Автоопределение, English, Русский, Español, Français, Deutsch, Italiano, Português, 中文, 日本語, 한국어, العربية, हिन्दी, Türkçe, Polski, Nederlands, Svenska, Dansk, Norsk, Suomi и другие.

## 📖 Интеграция с другими модулями

- **Subtitles** - Автоматическое создание субтитров
- **Timeline** - Добавление результатов на таймлайн
- **AI Chat** - Использование транскрипций как контекста
- **Export** - Включение субтитров в финальное видео

## 🎯 Заключение

Модуль транскрипции предоставляет мощные возможности для автоматического распознавания речи с поддержкой множества провайдеров и языков. Он оптимизирован для работы с Timeline Studio и готов к использованию в продакшене.

---

**Версия:** 0.68.1  
**Последнее обновление:** 7 августа 2025  
**Разработано с ❤️ командой Timeline Studio**