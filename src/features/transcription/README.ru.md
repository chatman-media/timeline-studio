# Transcription

[English](./README.md) | **Русский**

## Обзор

Модуль транскрипции обеспечивает высокоскоростное распознавание речи для Timeline Studio с использованием передовых AI технологий, включая OpenAI Whisper, локальный Whisper и Faster Whisper.

## Статус

**100% Готов** - Основной функционал полностью реализован и протестирован.

- ✅ **Компоненты**: 4 компонента для интерфейса транскрипции
- ✅ **Хуки**: 2 хука для транскрипции и управления моделями
- ✅ **Сервисы**: Унифицированный сервис для всех провайдеров (в `/src/domains/ai-services/`)
- ✅ **Тесты**: Полное покрытие unit тестами
- ✅ **Провайдеры**: OpenAI Whisper, локальный Whisper, Faster Whisper

## Структура

```
transcription/
├── components/                      # React компоненты
│   ├── transcription-panel.tsx     # Основная панель транскрипции
│   ├── transcription-editor.tsx    # Редактор результатов
│   ├── model-selector.tsx          # Выбор и загрузка моделей
│   └── language-selector.tsx       # Выбор языка
├── hooks/                          # React хуки
│   ├── use-transcription.ts        # Основной хук транскрипции
│   └── use-enhanced-subtitle-automation.ts  # Расширенная автоматизация субтитров
├── __tests__/                      # Файлы тестов
│   ├── hooks/                      # Тесты хуков
│   └── components/                 # Тесты компонентов
├── __mocks__/                      # Моки для тестов
│   └── transcription-service.ts    # Mock TranscriptionService
└── types.ts                        # TypeScript типы (реэкспорт из domains)
```

## Возможности

### ✅ Реализовано

**Множественные провайдеры:**
- [x] OpenAI Whisper API (облачный)
- [x] Локальный Whisper (whisper.cpp)
- [x] Faster Whisper (до 4x быстрее)
- [x] Автоматический выбор провайдера

**Модели и языки:**
- [x] 6 размеров моделей (tiny → large-v3)
- [x] 20+ языков с автоопределением
- [x] Временные метки на уровне слов
- [x] VAD (Voice Activity Detection)

**UI/UX:**
- [x] Интуитивная панель транскрипции
- [x] Отслеживание прогресса в реальном времени
- [x] Редактор с временными метками
- [x] Управление моделями

**Экспорт:**
- [x] Формат SRT (SubRip)
- [x] Формат VTT (WebVTT)
- [x] Формат ASS (Advanced SubStation)
- [x] Прямая интеграция с таймлайном

### 🚀 Будущие улучшения

Эти функции запланированы для будущих релизов, но не требуются для основного функционала:

**Идентификация говорящих (Запланировано):**
- [ ] Backend speaker diarization
- [ ] Метки говорящих в результатах транскрипции
- [ ] Интеграция идентификации персон

**Продвинутые возможности:**
- [ ] Потоковая обработка больших файлов
- [ ] Кэширование результатов
- [ ] Пакетная обработка
- [ ] Фоновые задачи

## Использование

```typescript
import { TranscriptionPanel } from '@/features/transcription';
import { useTranscription } from '@/features/transcription';

function MyComponent() {
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
      console.log(`Распознано: ${result.segments.length} сегментов`);
    }
  };

  return (
    <div>
      <button onClick={handleTranscribe} disabled={isTranscribing}>
        {isTranscribing ? `Обработка... ${progress.progress}%` : 'Транскрибировать'}
      </button>
    </div>
  );
}
```

## Интеграция

- **Зависит от**: `@/domains/ai-services` (TranscriptionService)
- **Используется в**: `@/features/subtitles`, `@/features/timeline`, `@/features/ai-chat`
- **Интеграция**: Автоматическое создание субтитров, добавление на таймлайн, контекст для AI

## Тестирование

- **Тесты хуков**: `use-transcription`, `use-enhanced-subtitle-automation`
- **Тесты компонентов**: Селектор языка, селектор модели, селектор размера модели

```bash
# Запустить все тесты транскрипции
bun run test src/features/transcription

# Запустить в watch режиме
bun run test:watch src/features/transcription

# Запустить с coverage
bun run test:coverage src/features/transcription
```

## TODO / Планы развития

### Высокий приоритет
- [ ] E2E тесты для операций транскрипции
- [ ] Backend реализация speaker diarization
- [ ] Интеграция идентификации персон

### Средний приоритет
- [ ] Потоковая обработка больших файлов
- [ ] Система кэширования результатов
- [ ] Пакетная обработка нескольких файлов

### Низкий приоритет
- [ ] Обучение пользовательских моделей
- [ ] Продвинутая предобработка аудио
- [ ] Расширенная поддержка языков (30+ языков)

## Производительность

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

---

**Версия:** 0.68.1
**Последнее обновление:** 26 ноября 2025
