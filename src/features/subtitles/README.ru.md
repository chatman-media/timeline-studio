# Subtitles / Субтитры

[English](./README.md) | **Русский**

## Обзор

Система профессиональных стилей субтитров с 72 встроенными стилями в 6 категориях. Включает CSS-анимации, AI транскрипцию, автоматическую синхронизацию с аудио и полную поддержку форматов SRT/VTT/ASS для импорта и экспорта.

## Статус

- ✅ **Компоненты**: 9 компонентов для управления и редактирования субтитров
- ✅ **Хуки**: 5 хуков для стилей, импорта, экспорта и управления
- ✅ **Утилиты**: 5 утилит для обработки, парсинга и экспорта
- ✅ **Тесты**: 17 файлов тестов, 100% проходят
- ✅ **Стили**: 72 профессиональных стиля субтитров (12 на категорию)

## Структура

```
subtitles/
├── components/                      # React компоненты (9 файлов)
│   ├── subtitle-ai-tools.tsx       # AI инструменты для субтитров
│   ├── subtitle-ai-tools-modal.tsx # Модальное окно AI инструментов
│   ├── subtitle-auto-sync.tsx      # Автосинхронизация с аудио
│   ├── subtitle-group.tsx          # Группировка по категориям
│   ├── subtitle-import-button.tsx  # Кнопка импорта
│   ├── subtitle-preview.tsx        # Превью стиля
│   ├── subtitle-sync-tools.tsx     # Инструменты синхронизации
│   ├── subtitle-toolbar.tsx        # Панель инструментов
│   └── subtitle-tools.tsx          # Общие инструменты
├── hooks/                          # React хуки (5 файлов)
│   ├── use-subtitle-styles.ts      # Загрузка стилей из JSON
│   ├── use-subtitle-style-manager.ts # Управление стилями
│   ├── use-subtitles-import.ts     # Функциональность импорта
│   └── use-subtitles-export.ts     # Функциональность экспорта
├── utils/                          # Утилиты (5 файлов)
│   ├── css-styles.ts               # CSS утилиты
│   ├── subtitle-processor.ts       # Обработка данных
│   ├── subtitle-parsers.ts         # Парсеры SRT/VTT/ASS
│   ├── subtitle-exporters.ts       # Экспорт в форматы
│   └── subtitle-importers.ts       # Импорт через Tauri
├── data/                           # JSON данные (2 файла)
│   ├── subtitle-styles.json        # 72 профессиональных стиля
│   └── subtitle-categories.json    # 6 категорий с переводами
├── types/                          # TypeScript типы
│   └── subtitles.ts                # Основные интерфейсы
└── __tests__/                      # Тесты (17 файлов)
```

## Функции

### ✅ Реализовано

- [x] **72 стиля субтитров**: 12 стилей в каждой из 6 категорий
- [x] **Категории**: Базовые, Кинематографические, Стилизованные, Минималистичные, Анимированные, Современные
- [x] **Импорт/Экспорт**: Полная поддержка форматов SRT, VTT, ASS
- [x] **AI Транскрипция**: Интеграция OpenAI Whisper
- [x] **Автосинхронизация**: Автоматическая синхронизация с аудио
- [x] **CSS Анимации**: Динамические эффекты субтитров
- [x] **Превью стилей**: Демо-текст с примененными стилями
- [x] **Интернационализация**: Поддержка 15 языков
- [x] **Интеграция с Timeline**: Полная поддержка редактирования на таймлайне

### ❌ Не реализовано

- [ ] Предпросмотр анимаций в реальном времени
- [ ] Визуальный редактор стилей
- [ ] Облачное хранилище субтитров

## Использование

### Загрузка стилей субтитров

```typescript
import { useSubtitles } from '@/features/subtitles'

function MyComponent() {
  const { subtitles: styles, loading, error, reload, isReady } = useSubtitles()

  if (loading) return <div>Загрузка стилей...</div>
  if (error) return <div>Ошибка: {error}</div>

  return (
    <div>
      <h2>Доступно стилей: {styles.length}</h2>
      {styles.map(style => (
        <div key={style.id}>
          {style.labels.ru} ({style.category})
        </div>
      ))}
    </div>
  )
}
```

### Управление стилями

```typescript
import { useSubtitleStyles } from '@/features/subtitles'

function StyleManager() {
  const {
    subtitleStyles,
    getStyleById,
    getComputedStyle,
    getDefaultStyle
  } = useSubtitleStyles()

  const defaultStyle = getDefaultStyle()
  const computed = getComputedStyle('basic-white', { fontSize: 32 })

  return (
    <div>
      <h3>Стиль по умолчанию: {defaultStyle?.name}</h3>
      <p>Вычисленный размер шрифта: {computed.fontSize}px</p>
    </div>
  )
}
```

### Импорт субтитров

```typescript
import { useSubtitlesImport } from '@/features/subtitles'

function ImportButton() {
  const { importSubtitleFile, isImporting } = useSubtitlesImport()

  const handleImport = async () => {
    await importSubtitleFile() // Автоопределение формата
  }

  return (
    <button onClick={handleImport} disabled={isImporting}>
      Импортировать субтитры
    </button>
  )
}
```

### Экспорт субтитров

```typescript
import { useSubtitlesExport } from '@/features/subtitles'

function ExportButton() {
  const {
    exportSubtitleFile,
    exportSelectedSubtitles,
    exportSubtitlesByTimeRange,
    isExporting
  } = useSubtitlesExport()

  return (
    <div>
      <button
        onClick={() => exportSubtitleFile('srt')}
        disabled={isExporting}
      >
        Экспорт в SRT
      </button>
    </div>
  )
}
```

## Интеграция

- **Зависит от**: @/domains/resources, @/features/timeline
- **Используется в**: Timeline, Media Studio, VideoPlayer
- **Ресурсы**: Интегрировано с ResourcesProvider и BrowserStateProvider

## Тестирование

- **Всего тестов**: 17 файлов тестов
- **Покрытие**: ~70% общего
- **Категории**:
  - Компоненты: 5 файлов тестов
  - Хуки: 3 файла тестов
  - Утилиты: 5 файлов тестов
  - Типы: 1 файл тестов
  - Данные: 1 файл тестов

```bash
# Запустить все тесты субтитров
bun run test src/features/subtitles

# Запустить конкретную категорию тестов
bun run test src/features/subtitles/__tests__/components/
bun run test src/features/subtitles/__tests__/hooks/
bun run test src/features/subtitles/__tests__/utils/
```

## TODO / Дорожная карта

- [ ] Добавить предпросмотр анимированных субтитров в реальном времени
- [ ] Реализовать визуальный редактор стилей для пользовательских стилей
- [ ] Добавить больше форматов экспорта (SBV, TTML)
- [ ] Оптимизировать WebWorker для больших файлов субтитров
- [ ] Добавить версионирование субтитров и историю
- [ ] Реализовать облачное хранилище и синхронизацию
