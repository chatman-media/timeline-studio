# Стандартизация формата Duration

## Обзор

В проекте был стандартизирован формат хранения и форматирования длительности видео/аудио файлов.

**Стандарт:**
- **Internal representation (хранение):** `number` (секунды)
- **Display format (отображение):** `string` в виде `"MM:SS"` или `"HH:MM:SS"`
- **Parsing (парсинг):** используется утилита `parseDurationString()`

## Структура

### 1. Новая утилита: `/src/lib/duration-formatter.ts`

Центральное место для всех операций с длительностью:

```typescript
// Форматирование для отображения
formatDurationSeconds(seconds: number, showHours?: boolean): string
formatDurationMs(ms: number, showHours?: boolean): string

// Человекочитаемый формат для логов/описаний
formatDurationHuman(seconds: number): string

// Парсинг строк длительности
parseDurationString(durationStr: unknown): number | null
```

### 2. Re-export через `/src/lib/date.ts`

Для удобства, все функции переэкспортированы в `date.ts`:

```typescript
import { formatDurationSeconds, parseDurationString } from "@/lib/date"
```

## Использование

### Пример 1: Форматирование для UI

```typescript
import { formatDurationSeconds } from "@/lib/duration-formatter"

// MediaFile с duration в секундах
const mediaFile = {
  duration: 125 // секунды
}

// Отображение
const display = formatDurationSeconds(mediaFile.duration)
// Результат: "2:05" (без часов, если < 3600 сек)
// Результат: "01:02:05" (с часами для больших значений)
```

### Пример 2: Форматирование из миллисекунд

```typescript
import { formatDurationMs } from "@/lib/duration-formatter"

// AudioContext работает с миллисекундами
const duration = formatDurationMs(125000) // "2:05"
```

### Пример 3: Человекочитаемый формат

```typescript
import { formatDurationHuman } from "@/lib/duration-formatter"

const log = `Processing video: ${formatDurationHuman(125)}`
// "Processing video: 2m 5s"
```

### Пример 4: Парсинг строк

```typescript
import { parseDurationString } from "@/lib/duration-formatter"

// Парсинг различных форматов
const sec1 = parseDurationString("01:23:45") // 5025
const sec2 = parseDurationString("1:05")     // 65
const sec3 = parseDurationString("123")      // 123
const sec4 = parseDurationString(65)         // 65 (число как есть)

// Некорректные значения
const invalid = parseDurationString("abc")   // null
```

## Поддерживаемые форматы парсинга

| Формат | Пример | Результат (сек) |
|--------|--------|-----------------|
| HH:MM:SS | "01:23:45" | 5025 |
| MM:SS | "1:05" | 65 |
| SS | "123" | 123 |
| Number | 65 | 65 |
| Whitespace | "  1:05  " | 65 |

## Измененные файлы

### Основной файл утилиты
- `/src/lib/duration-formatter.ts` - Новая утилита (создана)

### Обновленные компоненты
- `/src/features/browser/adapters/use-media-adapter.tsx` - Использует `formatDurationSeconds()` и `parseDurationString()`
- `/src/features/media/services/media-api.ts` - Обновлена функция `formatDuration()`
- `/src/features/publication/hooks/use-publication-tasks.ts` - Использует `formatDurationSeconds()`
- `/src/features/video-compiler/hooks/use-render-jobs.ts` - Использует `formatDurationSeconds()`
- `/src/features/voice-recording/hooks/use-voice-recording.ts` - Использует `formatDurationSeconds()`
- `/src/features/camera-capture/hooks/use-recording.ts` - Использует `formatDurationSeconds()`
- `/src/features/camera-capture/utils.ts` - Использует `formatDurationMs()`
- `/src/features/person-identification/components/person-detail.tsx` - Использует `formatDurationSeconds()`
- `/src/lib/date.ts` - Переэкспортирует функции из `duration-formatter.ts`

### Тесты
- `/src/lib/__tests__/duration-formatter.test.ts` - 17 тестов покрывают все функции

## Миграция с старого кода

### До (старый код)

```typescript
// Inline преобразование duration (плохо)
const hours = Math.floor(duration / 3600)
const minutes = Math.floor((duration % 3600) / 60)
const seconds = Math.floor(duration % 60)
const durationStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
```

### После (новый код)

```typescript
import { formatDurationSeconds } from "@/lib/duration-formatter"

// Одна строка (хорошо!)
const durationStr = formatDurationSeconds(duration)
```

## Функции которые НЕ были изменены

Следующие функции имеют специфичные форматы и остались без изменений:

### SRT-время (с миллисекундами)
- `src/features/timeline/hooks/use-timeline-markers.ts` - `formatSRTTime()`
- Формат: `HH:MM:SS,mmm` (с запятой для миллисекунд)

### Timecode (с кадрами)
- `src/features/timeline/hooks/use-timeline-markers.ts` - `formatTimeCode()`
- `src/features/timeline/types/markers.ts` - Timecode форматирование
- `src/features/timeline/utils/utils.ts` - Фрейм-based форматирование
- `src/features/multicam/services/timecode-sync.ts` - Synced timecode
- Формат: `HH:MM:SS:ff` (где ff - номер кадра)

## Тестирование

Все функции покрыты тестами:

```bash
# Запустить тесты утилиты
bun run test src/lib/__tests__/duration-formatter.test.ts

# Результат: 17 passed
```

## Best Practices

1. **Всегда используйте `number` для хранения duration:**
   ```typescript
   interface MediaFile {
     duration: number // секунды
   }
   ```

2. **Используйте форматеры только для отображения:**
   ```typescript
   // ✅ Правильно
   const display = formatDurationSeconds(file.duration)

   // ❌ Неправильно
   const sortValue = formatDurationSeconds(file.duration) // Это строка!
   ```

3. **Для сортировки и сравнения используйте числа:**
   ```typescript
   // ✅ Правильно
   const sorted = items.sort((a, b) => a.duration - b.duration)

   // ❌ Неправильно
   const sorted = items.sort((a, b) =>
     formatDurationSeconds(a.duration).localeCompare(formatDurationSeconds(b.duration))
   )
   ```

4. **При парсинге используйте `parseDurationString()` с проверкой null:**
   ```typescript
   const seconds = parseDurationString(input)
   if (seconds === null) {
     // Обработка ошибки
   }
   ```

## Расширение функциональности

Если нужны новые форматы, добавьте их в `duration-formatter.ts`:

```typescript
/**
 * Форматирует длительность в формат HH:MM:SS.mmm
 * @param seconds - Длительность в секундах
 * @returns Строка с миллисекундами
 */
export function formatDurationWithMillis(seconds: number): string {
  const ms = Math.round((seconds % 1) * 1000)
  return formatDurationSeconds(Math.floor(seconds)) + `.${ms.toString().padStart(3, "0")}`
}
```

Обновите тесты и переэкспортируйте в `date.ts`.
