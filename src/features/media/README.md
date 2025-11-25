# Модуль Media

Комплексное управление медиафайлами для Timeline Studio, включающее импорт, генерацию превью, извлечение метаданных, кэширование и потоковую передачу.

## Обзор

Модуль media обеспечивает:
- **Импорт и сканирование** - Drag-and-drop файлов, сканирование папок, пакетная обработка
- **Генерация превью** - Миниатюры, кадры таймлайна, разные размеры
- **Извлечение метаданных** - Длительность, разрешение, кодеки через FFmpeg
- **Видео стриминг** - Локальный сервер для плавного воспроизведения
- **Восстановление файлов** - Автоматическое восстановление отсутствующих файлов
- **Производительность** - IndexedDB кэширование, пакетные операции, предзагрузка превью

## Быстрый старт

### Базовое использование
```typescript
import { MediaContent } from '@/features/media/components/media-content'
import { useMediaImport } from '@/features/media/hooks'

function MyMediaBrowser() {
  const { importFiles, isImporting } = useMediaImport()
  
  return (
    <MediaContent 
      onImport={importFiles}
      isLoading={isImporting}
    />
  )
}
```

### Доступные хуки
```typescript
import {
  useMediaImport,      // Импорт файлов/папок
  useMediaProcessor,   // Извлечение метаданных
  useMediaPreview,     // Генерация миниатюр
  useFramePreview,     // Кадры таймлайна
  useVideoStreaming,   // Интеграция с видео сервером
  useCacheStatistics,  // Управление кэшем
  useMediaRestoration  // Восстановление отсутствующих файлов
} from '@/features/media/hooks'
```

## Тестирование

Модуль поддерживает высокое покрытие тестами всех компонентов:

### Покрытие тестами
- **Общее**: ~87% покрытие инструкций
- **Хуки**: 92% инструкций, 84% ветвлений
- **Сервисы**: 88% инструкций, 90% ветвлений
- **Компоненты**: 83% инструкций, 69% ветвлений

### Запуск тестов
```bash
# Все тесты модуля media
bun run test src/features/media/__tests__/

# С отчетом о покрытии
bun run test:coverage -- src/features/media/

# Конкретный файл теста
bun run test src/features/media/__tests__/hooks/use-media-import.test.tsx
```

## Структура проекта
```
media/
├── components/    # UI компоненты
├── hooks/         # React хуки
├── services/      # Бизнес-логика
├── types/         # TypeScript типы
├── utils/         # Вспомогательные функции
└── __tests__/     # Тестовые файлы
```

## Документация

- **[DEV.md](./DEV.md)** - Подробная техническая документация для разработчиков
- **[API Reference](./types)** - TypeScript определения типов
- **[Примеры тестов](./\_\_tests\_\_)** - Паттерны тестирования и примеры

## Участие в разработке

1. Следуйте существующим паттернам и архитектуре
2. Пишите тесты для новых функций (>80% покрытия)
3. Обновляйте документацию (README.md для обзора, DEV.md для технических деталей)
4. Используйте TypeScript strict mode
5. Запускайте `bun run lint` перед коммитом

## API (Backend Commands)

| Command | Parameters | Description |
|---------|------------|-------------|
| `get_media_metadata` | `{ filePath: string }` | Extract video/audio metadata via FFmpeg |
| `cancel_media_processing` | - | Cancel ongoing media processing |
| `clear_media_preview_data` | `{ fileId: string }` | Clear cached preview data for file |
| `save_preview_data` | `{ path: string }` | Save preview cache to disk |
| `load_preview_data` | `{ path: string }` | Load preview cache from disk |
| `save_timeline_frames` | `{ fileId: string, frames: Frame[] }` | Save timeline preview frames |

## Behavior (from tests) / Поведение (из тестов)

### media-restoration-service.test.ts
- ✓ Должен восстановить файл по оригинальному пути
- ✓ Должен найти файл по относительному пути
- ✓ Должен найти файл в альтернативных местах
- ✓ Должен вернуть missing если файл не найден
- ✓ Должен восстановить все файлы проекта
- ✓ Должен обрабатывать отсутствующие файлы
- ✓ Должен генерировать отчет о восстановлении
- ✓ Должен открыть диалог выбора файла через Tauri
- ✓ Должен обработать edge cases (Unicode, спецсимволы, длинные пути)

### indexeddb-cache-service.test.ts
- ✓ Should return the same instance (Singleton pattern)
- ✓ Should cache preview/timeline frames/recognition/subtitle frames successfully
- ✓ Should retrieve cached data with expiration check
- ✓ Should remove expired entries and return null
- ✓ Should calculate cache statistics correctly
- ✓ Should clear individual and all cache types
- ✓ Should cleanup expired cache entries
- ✓ Should estimate size correctly (string and object)
- ✓ Should trigger cleanup when cache size exceeds limit
- ✓ Should remove oldest entries first during cleanup
- ✓ Should handle IndexedDB errors gracefully
- ✓ Should handle edge cases (empty strings, large data, special characters, concurrent operations)

### use-file-selection.test.tsx
- ✓ Должен возвращать правильное начальное состояние
- ✓ Должен переключать состояние выбора файла
- ✓ Должен выбирать/отменять выбор файла
- ✓ Должен обрабатывать клик с Shift для множественного выбора

### tracks-utils.test.ts / audio-tracks.test.ts / preview-sizes.test.ts
- ✓ Should extract audio tracks from media files
- ✓ Should calculate optimal preview sizes based on container
- ✓ Should handle media with/without audio tracks
- ✓ Should validate track metadata

## Dependencies / Зависимости

**Used by:**
- `@/features/browser` - Media file browsing and selection
- `@/features/timeline` - Timeline clips and media references
- `@/features/video-player` - Video streaming integration
- `@/domains/project` - Project media restoration
- `@/features/recognition` - Media analysis and caching

**Depends on:**
- `@tauri-apps/api` - File system and media commands
- `@/domains/browser` - Browser state management
- `idb` - IndexedDB wrapper for caching
- FFmpeg (backend) - Metadata extraction

## Лицензия

Часть Timeline Studio - смотрите корневой файл LICENSE

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/media/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Открытие диалога выбора медиафайла | ⏳ Planned | - | 🔴 High |
| Выбор одиночного медиафайла (open dialog) | ⏳ Planned | - | 🔴 High |
| Выбор множественных медиафайлов | ⏳ Planned | - | 🔴 High |
| Выбор аудиофайлов через selectAudioFile | ⏳ Planned | - | 🟡 Medium |
| Выбор директории (selectMediaDirectory) | ⏳ Planned | - | 🔴 High |
| Получение списка файлов в директории (get_media_files) | ⏳ Planned | - | 🔴 High |
| Извлечение метаданных видео (get_media_metadata) | ⏳ Planned | - | 🔴 High |
| Извлечение метаданных аудио | ⏳ Planned | - | 🟡 Medium |
| Извлечение метаданных изображения | ⏳ Planned | - | 🟡 Medium |
| Обработка неизвестного типа файла | ⏳ Planned | - | 🟡 Medium |
| Генерация превью миниатюры | ⏳ Planned | - | 🔴 High |
| Генерация кадров таймлайна | ⏳ Planned | - | 🔴 High |
| Сохранение preview data (save_preview_data) | ⏳ Planned | - | 🟡 Medium |
| Загрузка preview data (load_preview_data) | ⏳ Planned | - | 🟡 Medium |
| Очистка preview data (clear_media_preview_data) | ⏳ Planned | - | 🟢 Low |
| Отмена обработки (cancel_media_processing) | ⏳ Planned | - | 🟡 Medium |
| Кэширование в IndexedDB | ⏳ Planned | - | 🟡 Medium |
| Очистка expired кэша | ⏳ Planned | - | 🟢 Low |
| Статистика кэша | ⏳ Planned | - | 🟢 Low |
| Восстановление отсутствующих файлов | ⏳ Planned | - | 🔴 High |
| Поиск файлов по относительному пути | ⏳ Planned | - | 🟡 Medium |
| Генерация отчета восстановления | ⏳ Planned | - | 🟢 Low |
| Drag-and-drop файлов | ⏳ Planned | - | 🔴 High |
| Импорт аудиотреков из видео | ⏳ Planned | - | 🟡 Medium |
| Видео стриминг интеграция | ⏳ Planned | - | 🟡 Medium |

### Приоритеты
- 🔴 High - критичный функционал, тестировать первым
- 🟡 Medium - важный функционал
- 🟢 Low - дополнительный функционал

### Tauri команды используемые модулем
- `get_media_metadata` - извлечение метаданных через FFmpeg
- `get_media_files` - получение списка медиафайлов в директории
- `cancel_media_processing` - отмена текущей обработки
- `clear_media_preview_data` - очистка кэшированных превью
- `save_preview_data` - сохранение превью на диск
- `load_preview_data` - загрузка превью с диска
- `save_timeline_frames` - сохранение кадров таймлайна
- `@tauri-apps/plugin-dialog` (open) - диалоги выбора файлов/директорий

### Примечания
- Модуль использует IndexedDB для кэширования превью
- FFmpeg используется для извлечения метаданных (backend)
- Поддержка drag-and-drop и пакетной обработки
- Интеграция с video streaming сервером