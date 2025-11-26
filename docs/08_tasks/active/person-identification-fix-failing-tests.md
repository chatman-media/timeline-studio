# Исправление падающих тестов в person-identification

**Статус:** 🔴 Активная
**Приоритет:** Высокий
**Дата создания:** 2025-11-26
**Последнее обновление:** 2025-11-26

## Описание проблемы

После исправления ошибок линтера (коммит `92accf3`) обнаружено, что 26 тестовых файлов падают, из них большая часть связана с модулем `person-identification`. Анализ показал, что проблемы существовали **до** исправлений линтера.

### Статистика падающих тестов
- **Test Files:** 26 failed | 564 passed | 8 skipped
- **Tests:** 257 failed | 11081 passed | 166 skipped

## Детальный анализ проблем

### 1. Корневая причина большинства ошибок

**Функция-заглушка `extractVideoFrames()`**

Файл: `src/features/person-identification/hooks/use-advanced-person-identification.ts:530-548`

```typescript
async function extractVideoFrames(
  videoPath: string,
  options: {...}
): Promise<Array<{...}>> {
  logger.infoSync("Extracting frames from video:", { videoPath, options })
  return []  // ← ПРОБЛЕМА: всегда возвращает пустой массив!
}
```

**Последствия:**
- Цикл обработки кадров (строки 161-212) никогда не выполняется
- `onProgress` callback никогда не вызывается → `progressUpdates.length === 0`
- `detectedFaces` остается пустым → `statistics.totalFaces === 0`
- `clusterUnidentifiedFaces` не вызывается → тесты падают
- `detectFacesAdvanced` не вызывается → unhandled error

### 2. Падающие тесты

#### A. `use-advanced-person-identification.test.tsx`

| Тест | Проблема | Причина |
|------|----------|---------|
| "should update progress during analysis" | `progressUpdates.length === 0` | Пустой массив кадров → `onProgress` не вызывается |
| "should handle auto-identification when enabled" | `identifiedPersons.size === 0` | Цикл обработки не выполняется |
| "should accumulate statistics" | `statistics.totalFaces === 0` | `detectedFaces` пустой |
| "should cluster unidentified faces when enabled" | `clusterUnidentifiedFaces` не вызывается | `unidentifiedFaces.length === 0` |
| "should blur unidentified faces" | Unhandled error: promise resolved instead of rejected | `detectFacesAdvanced` не вызывается |

#### B. `use-person-identification.integration.test.tsx`

| Тест | Проблема | Причина |
|------|----------|---------|
| "should handle add person errors" | `error === null` вместо "Ошибка добавления персоны" | Race condition: проверка до применения `setError` |
| "should handle update errors" | `error === null` вместо "Ошибка обновления персоны" | Та же race condition |

**Race condition детали:**
```typescript
// Тест (строка 182-188)
await expect(
  act(async () => {
    await result.current.addPerson({ name: "Test" })
  }),
).rejects.toThrow()  // ← ошибка поймана

expect(result.current.error).toBe("Ошибка...")  // ← проверка СРАЗУ после
// Проблема: React batch updates может не успеть применить setError
```

## Решение

### Краткосрочное (для прохождения тестов)

#### Шаг 1: Реализовать `extractVideoFrames` через Tauri backend

**На бэкенде уже есть функционал!**

Найденные команды:
- `src-tauri/src/video_compiler/commands/frame_extraction/commands.rs`:
  - `extract_video_frame` - извлечение одного кадра
  - `extract_video_frames_batch` - пакетное извлечение кадров

- `src-tauri/src/video_compiler/commands/frame_extraction/business_logic.rs`:
  - `extract_video_frame_advanced` - продвинутое извлечение
  - `extract_video_frames_batch_advanced` - пакетное с настройками

**Задача:** Интегрировать существующий backend функционал в `extractVideoFrames()`:

```typescript
async function extractVideoFrames(
  videoPath: string,
  options: {
    startTime?: number
    endTime?: number
    skipFrames?: number
  } = {},
): Promise<Array<{ frameNumber: number; timestamp: number; data: ArrayBuffer }>> {
  try {
    // Вызов Tauri команды
    const frames = await invoke<VideoFrame[]>('extract_video_frames_batch', {
      videoPath,
      startTime: options.startTime || 0,
      endTime: options.endTime,
      frameInterval: options.skipFrames || 5,
    })

    return frames
  } catch (error) {
    logger.errorSync("Failed to extract video frames:", { error })
    throw error
  }
}
```

**Файлы для изменения:**
- `src/features/person-identification/hooks/use-advanced-person-identification.ts:530-548`

#### Шаг 2: Исправить race conditions в integration тестах

**Файлы для изменения:**
- `src/features/person-identification/__tests__/hooks/use-person-identification.integration.test.tsx`

**Изменения:**

```typescript
// До (строка 182-188)
await expect(
  act(async () => {
    await result.current.addPerson({ name: "Test" })
  }),
).rejects.toThrow()

expect(result.current.error).toBe("Ошибка добавления персоны")

// После
await expect(
  act(async () => {
    await result.current.addPerson({ name: "Test" })
  }),
).rejects.toThrow()

await waitFor(() => {  // ← Добавить waitFor!
  expect(result.current.error).toBe("Ошибка добавления персоны")
})
```

Аналогично для теста "should handle update errors" (строка 226).

### Долгосрочное (архитектура)

1. **Вынести `extractVideoFrames` как инжектируемую зависимость**
   - Использовать DI pattern для лучшей тестируемости
   - Создать интерфейс `IFrameExtractor`

2. **Рассмотреть использование генераторов**
   - Вместо загрузки всех кадров сразу использовать `AsyncGenerator`
   - Потоковая обработка для больших видео

3. **Добавить unit-тесты для `extractVideoFrames`**
   - Отдельные тесты для backend команды
   - Mock для тестирования хуков

4. **Рефакторинг `analyzeVideo`**
   - Разбить на более мелкие тестируемые функции
   - Вынести логику обработки кадров

## План выполнения

### Фаза 1: Интеграция backend (2-3 часа)
- [ ] Изучить существующие Tauri команды для извлечения кадров
- [ ] Реализовать `extractVideoFrames()` с вызовом backend
- [ ] Добавить типы для `VideoFrame`
- [ ] Протестировать извлечение кадров вручную

### Фаза 2: Исправление тестов (1-2 часа)
- [ ] Исправить race condition в integration тестах (добавить `waitFor`)
- [ ] Запустить тесты и проверить результат
- [ ] Убедиться что все 257 falling тестов теперь проходят

### Фаза 3: Документация и cleanup (1 час)
- [ ] Обновить документацию по использованию `extractVideoFrames`
- [ ] Добавить примеры использования
- [ ] Создать changelog entry

## Технические детали

### Backend API (уже существует)

**Команда:** `extract_video_frames_batch`

**Параметры:**
```rust
struct VideoFrameParams {
  video_path: String,
  start_time: f64,
  end_time: Option<f64>,
  frame_interval: u32,  // пропускать каждые N кадров
}
```

**Возвращает:**
```rust
struct VideoFrame {
  frame_number: u32,
  timestamp: f64,
  data: Vec<u8>,  // raw image data
}
```

### Frontend Integration

**Файл:** `src/features/person-identification/types/frames.ts`

```typescript
export interface VideoFrame {
  frameNumber: number
  timestamp: number
  data: ArrayBuffer
}

export interface FrameExtractionOptions {
  startTime?: number
  endTime?: number
  skipFrames?: number
}
```

## Зависимости

- ✅ Backend команды уже реализованы в `src-tauri/src/video_compiler/commands/frame_extraction/`
- ✅ FFmpeg уже настроен для работы с видео
- ⚠️ Нужно добавить TypeScript типы для Tauri команд

## Риски и ограничения

1. **Производительность**: Извлечение большого количества кадров может занять время
   - *Митигация*: Использовать `skipFrames` параметр, progress callbacks

2. **Память**: Хранение всех кадров в памяти
   - *Митигация*: Рассмотреть потоковую обработку в будущем

3. **Совместимость**: Backend команды могут требовать обновления
   - *Митигация*: Проверить совместимость, добавить версионирование API

## Критерии успеха

- ✅ Все 257 падающих тестов проходят
- ✅ `extractVideoFrames()` работает с реальными видео
- ✅ Progress callbacks работают корректно
- ✅ Нет race conditions в integration тестах
- ✅ Производительность приемлема (< 5 сек для 100 кадров)

## Связанные файлы

### Frontend
- `src/features/person-identification/hooks/use-advanced-person-identification.ts`
- `src/features/person-identification/hooks/use-person-identification.tsx`
- `src/features/person-identification/__tests__/hooks/use-advanced-person-identification.test.tsx`
- `src/features/person-identification/__tests__/hooks/use-person-identification.integration.test.tsx`

### Backend
- `src-tauri/src/video_compiler/commands/frame_extraction/commands.rs`
- `src-tauri/src/video_compiler/commands/frame_extraction/business_logic.rs`
- `src-tauri/src/video_compiler/core/ffmpeg/keyframes.rs`

## Ссылки

- Оригинальный анализ: Agent investigation (2025-11-26)
- Коммит с исправлениями линтера: `92accf3cf80`
- Related task: `person-identification-advanced.md`

## Примечания

Эта проблема была обнаружена после исправления ошибок линтера, но корневая причина существовала до этого. Тесты писались с ожиданием, что `extractVideoFrames()` будет реализована позже, но заглушка осталась и стала причиной падения тестов.

---

**Следующий шаг:** Начать с Фазы 1 - интеграция backend функционала.
