# Subtitles Service

Сервис для работы с субтитрами в домене video-editing.

## Обзор

`SubtitlesService` предоставляет методы для экспорта и импорта субтитров через Tauri команды. Этот сервис является частью домена video-editing и содержит бизнес-логику работы с субтитрами, изолированную от React-компонентов и хуков.

## Архитектура

```
domains/video-editing/services/subtitles/
├── subtitles-service.ts    # Основной сервис
├── index.ts                # Экспорты
└── README.md               # Документация
```

## API

### `SubtitlesService.saveSubtitleFile(options)`

Сохраняет субтитры в файл через Tauri команду `save_subtitle_file`.

**Параметры:**
- `options: SubtitleExportOptions` - Опции экспорта
  - `format: "srt" | "vtt" | "ass"` - Формат файла субтитров
  - `content: string` - Контент для сохранения
  - `output_path: string` - Путь для сохранения файла

**Возвращает:** `Promise<void>`

**Пример использования:**
```typescript
import { SubtitlesService } from "@/domains/video-editing/services/subtitles"

await SubtitlesService.saveSubtitleFile({
  format: "srt",
  content: "1\n00:00:00,000 --> 00:00:02,000\nПривет, мир!\n\n",
  output_path: "/path/to/subtitles.srt",
})
```

### `SubtitlesService.updateTimelineSubtitles(params)`

Обновляет субтитры на треке таймлайна через Tauri команду `update_timeline_subtitles`.

**Параметры:**
- `params: UpdateTimelineSubtitlesParams` - Параметры обновления
  - `trackId: string` - ID трека для обновления
  - `subtitles: any[]` - Массив субтитров для добавления

**Возвращает:** `Promise<void>`

**Пример использования:**
```typescript
import { SubtitlesService } from "@/domains/video-editing/services/subtitles"

await SubtitlesService.updateTimelineSubtitles({
  trackId: "track-123",
  subtitles: [
    { id: "sub-1", text: "Привет", startTime: 0, duration: 2 },
    { id: "sub-2", text: "Мир", startTime: 2, duration: 2 },
  ],
})
```

## Использование в Features

Сервис используется в хуках features/subtitles:

### use-subtitles-export.ts
```typescript
import { SubtitlesService } from "@/domains/video-editing/services/subtitles"

// Вместо прямого вызова invoke
await SubtitlesService.saveSubtitleFile({
  format,
  content,
  output_path: filePath,
})
```

### use-subtitle-import.ts
```typescript
import { SubtitlesService } from "@/domains/video-editing/services/subtitles"

// Вместо прямого вызова invoke
await SubtitlesService.updateTimelineSubtitles({
  trackId: targetTrackId,
  subtitles: clipsToAdd,
})
```

## Tauri Backend Commands

Сервис взаимодействует со следующими Tauri командами:

### `save_subtitle_file`
Сохраняет файл субтитров на диск в указанном формате (SRT/VTT/ASS).

**Backend:** `src-tauri/src/state/commands/handler.rs`

### `update_timeline_subtitles`
Обновляет субтитры на треке таймлайна в состоянии проекта.

**Backend:** `src-tauri/src/state/commands/handler.rs`

## Логирование

Сервис использует `createLogger("SubtitlesService")` для логирования всех операций:
- Информационные сообщения о начале/завершении операций
- Ошибки при неудачных операциях
- Метаданные (формат, количество субтитров, пути файлов)

## Тестирование

Логика сервиса покрыта тестами через хуки:
- `src/features/subtitles/__tests__/hooks/use-subtitles-export.test.ts`
- `src/features/subtitles/__tests__/hooks/use-subtitles-import.test.ts`

## Будущие улучшения

- [ ] Добавить валидацию параметров на уровне сервиса
- [ ] Добавить поддержку дополнительных форматов субтитров
- [ ] Реализовать batch операции для множественных файлов
- [ ] Добавить кэширование результатов экспорта
