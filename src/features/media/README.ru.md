# Media

[English](./README.md) | **Русский**

## Обзор

Комплексный модуль управления медиафайлами для Timeline Studio. Обрабатывает импорт медиафайлов, генерацию превью, извлечение метаданных, кэширование и потоковую передачу видео.

## Статус

- ✅ **Компоненты**: MediaContent, выбор файлов, drag-and-drop
- ✅ **Хуки**: useMediaImport, useMediaProcessor, useMediaPreview, useFramePreview, useVideoStreaming, useCacheStatistics, useMediaRestoration
- ✅ **Сервисы**: IndexedDBCacheService, MediaRestorationService, VideoStreamingService
- ✅ **Тесты**: 87% покрытие (~150+ тестов)

## Структура

```
media/
├── components/    # UI компоненты
├── hooks/         # React хуки
├── services/      # Бизнес-логика
├── types/         # TypeScript типы
├── utils/         # Вспомогательные функции
└── __tests__/     # Тестовые файлы
```

## Возможности

### ✅ Реализовано

- [x] Импорт файлов (drag-and-drop, выбор файлов/папок, пакетная обработка)
- [x] Извлечение метаданных через FFmpeg (длительность, разрешение, кодеки)
- [x] Генерация превью (миниатюры, кадры таймлайна, разные размеры)
- [x] Потоковая передача видео через локальный сервер
- [x] Восстановление файлов (автоматическое восстановление отсутствующих файлов)
- [x] Кэширование в IndexedDB (превью, кадры таймлайна, распознавание, субтитры)
- [x] Статистика и управление кэшем
- [x] Извлечение аудиотреков из видео
- [x] TypeScript strict mode с комплексными типами

### ❌ Не реализовано

- [ ] Интеграция с облачными хранилищами
- [ ] Продвинутый анализ видео (обнаружение сцен, метрики качества)
- [ ] Пакетное редактирование метаданных
- [ ] Умные стратегии кэширования превью
- [ ] Организация медиа-библиотеки (теги, коллекции)

## Использование

### Базовый импорт медиа

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

### Управление кэшем

```typescript
import { IndexedDBCacheService } from '@/features/media/services'

const cache = IndexedDBCacheService.getInstance()

// Кэшировать превью
await cache.cachePreview(fileId, previewData, 24 * 60 * 60 * 1000) // 24ч

// Получить кэшированные данные
const preview = await cache.getPreview(fileId)

// Очистить кэш
await cache.clearAllCache()

// Получить статистику
const stats = await cache.getCacheStatistics()
console.log(`Общий размер: ${stats.totalSize} байт`)
```

## Интеграция

- **Зависит от**:
  - `@tauri-apps/api` - Файловая система и команды медиа
  - `@/domains/browser` - Управление состоянием браузера
  - `idb` - Обертка IndexedDB для кэширования
  - FFmpeg (backend) - Извлечение метаданных

- **Используется в**:
  - `@/features/browser` - Просмотр и выбор медиафайлов
  - `@/features/timeline` - Клипы таймлайна и ссылки на медиа
  - `@/features/video-player` - Интеграция потоковой передачи видео
  - `@/domains/project` - Восстановление медиа проекта
  - `@/features/recognition` - Анализ и кэширование медиа

## Тестирование

- **Всего тестов**: 150+ тестов
- **Покрытие**: ~87% инструкций, 90% ветвлений (сервисы), 84% ветвлений (хуки)
- **Категории тестов**:
  - Хуки (use-media-import, use-media-processor, use-file-selection)
  - Сервисы (indexeddb-cache-service, media-restoration-service)
  - Утилиты (tracks-utils, audio-tracks, preview-sizes)

```bash
# Запустить все тесты
bun test src/features/media/__tests__/

# С покрытием
bun test:coverage -- src/features/media/

# Конкретный тестовый файл
bun test src/features/media/__tests__/hooks/use-media-import.test.tsx
```

## Tauri команды

| Команда | Параметры | Описание |
|---------|-----------|----------|
| `get_media_metadata` | `{ filePath: string }` | Извлечение метаданных видео/аудио через FFmpeg |
| `get_media_files` | `{ directoryPath: string }` | Получение списка медиафайлов в директории |
| `cancel_media_processing` | - | Отмена текущей обработки медиа |
| `clear_media_preview_data` | `{ fileId: string }` | Очистка кэшированных данных превью для файла |
| `save_preview_data` | `{ path: string }` | Сохранение кэша превью на диск |
| `load_preview_data` | `{ path: string }` | Загрузка кэша превью с диска |
| `save_timeline_frames` | `{ fileId: string, frames: Frame[] }` | Сохранение кадров превью таймлайна |

Плюс `@tauri-apps/plugin-dialog` (open) для диалогов выбора файлов/папок.

## Ключевые сервисы

### IndexedDBCacheService
- Singleton паттерн для управления кэшем
- Множественные типы кэша (превью, таймлайн, распознавание, субтитры)
- Автоматическое истечение срока и очистка
- Лимиты кэша на основе размера
- Статистика и мониторинг

### MediaRestorationService
- Восстановление отсутствующих файлов по оригинальному пути
- Поиск по относительному пути
- Поиск в альтернативных местах
- Генерация отчета восстановления
- Ручной выбор файла через диалог Tauri

### VideoStreamingService
- Локальный HTTP сервер для воспроизведения видео
- Точное позиционирование по кадрам
- Интеграция с видеоплеером

## TODO / Roadmap

- [ ] **Облачная интеграция** - Поддержка облачных провайдеров (S3, Google Drive, Dropbox)
- [ ] **Продвинутый анализ** - Обнаружение сцен, метрики качества, поиск дубликатов
- [ ] **Пакетное редактирование** - Редактирование метаданных для нескольких файлов одновременно
- [ ] **Умное кэширование** - Предиктивная предзагрузка кэша на основе паттернов использования
- [ ] **Организация библиотеки** - Теги, коллекции, умные папки
- [ ] **E2E тесты** - Полное E2E покрытие
  - Диалоги выбора файлов/папок
  - Извлечение метаданных для видео/аудио/изображений
  - Рабочий процесс генерации превью
  - Операции кэширования IndexedDB
  - Поток восстановления файлов
  - Импорт через drag-and-drop
  - Интеграция потоковой передачи видео
