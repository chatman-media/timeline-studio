# План улучшения модуля Multicam

**Дата:** 2025-11-08
**Статус:** ✅ Завершено (100%)
**Обновлено:** 2025-11-27
**Приоритет:** Высокий

## Краткое резюме (обновлено 2025-11-27)

### ✅ ВСЁ РЕАЛИЗОВАНО:
- ✅ Тесты useMulticam (442 строки, полное покрытие)
- ✅ SimpleEventBus создан (замена Node.js EventEmitter)
- ✅ Audio инфраструктура в Rust (symphonia, FFmpeg, UnifiedAudioAnalyzer)
- ✅ Timecode sync работает
- ✅ **Audio Sync** - создана Tauri команда `correlate_audio_files` в Rust
- ✅ **TypeScript** - исправлены все 5 мест с `any` типами
- ✅ **reorderAngles** - полностью реализован с `multicamOrder` полем

## Итоговая оценка модуля: 9/10

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| Архитектура | 9/10 | Feature-based, SimpleEventBus, Tauri интеграция |
| Функциональность | 9/10 | Timecode sync ✅, Audio sync ✅, reorderAngles ✅ |
| Качество кода | 9/10 | Строгая типизация, 0 мест с `any` |
| Тестирование | 9/10 | 297 тестов, все хуки и компоненты покрыты |
| Документация | 8/10 | Отличный README |

---

## Выявленные проблемы

### 🔴 Критические

#### 1. Audio Sync - полностью заглушка

**Файлы:**
- `src/features/multicam/services/audio-sync.ts:149-170`
- `src/features/multicam/services/audio-sync-adapter.ts` (весь файл)

**Проблема:**
```typescript
// audio-sync-adapter.ts - ВСЯ ФУНКЦИЯ ЗАГЛУШКА!
export async function syncByAudio(
  basePath: string,
  targetPath: string,
  options?: { onProgress?: (progress: number) => void; signal?: AbortSignal },
): Promise<AudioCorrelationResult> {
  // Возвращаем случайный результат для демонстрации
  const offset = (Math.random() - 0.5) * 10 // ❌ Случайное смещение
  const confidence = 0.7 + Math.random() * 0.3 // ❌ Случайная уверенность

  return { offset, confidence, correlationPeak: confidence }
}
```

```typescript
// audio-sync.ts:149 - генерирует синус вместо реального аудио
async function extractAudioSamples(
  _mediaFile: MediaFile,
  duration = 30,
  onProgress?: (progress: number) => void,
): Promise<Float32Array> {
  const sampleRate = 48000
  const samples = new Float32Array(duration * sampleRate)

  // Генерируем тестовый сигнал
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5 // ❌
  }

  return samples
}
```

**Решение:**
- Интегрировать с FFmpeg через Tauri commands для извлечения аудио
- Реализовать cross-correlation алгоритм
- Добавить поддержку сегментной обработки для больших файлов

---

#### 2. useMulticam не имеет тестов

**Файл:** `src/features/multicam/hooks/use-multicam.ts` (308 строк)

**Проблема:**
Главный хук модуля не покрыт тестами, что делает рефакторинг рискованным.

**Решение:**
Создать `src/features/multicam/__tests__/use-multicam.test.tsx` с покрытием:
- Переключение камер
- Синхронизация
- Добавление/удаление углов
- Edge cases

---

#### 3. TypeScript ошибки - использование `any`

**Места:**

1. **use-camera-sync.ts:68, 121**
```typescript
const baseClip = allClips.find((c: any) => c.id === baseClipId) // ❌
// Должно быть:
const baseClip = allClips.find((c) => c.id === baseClipId)
```

2. **multicam-manager.ts:79**
```typescript
logger.warn(`Unknown command: ${(command as any).type}`) // ❌
// Должно быть:
logger.warn(`Unknown command type`)
```

3. **audio-sync.ts:17** - дублирование типа
```typescript
method: "timecode" | "creation_time" | "audio" | "none" // ❌
// Должно быть:
method: SyncMethod
```

---

### 🟡 Важные

#### 4. Node.js EventEmitter в браузере

**Файл:** `src/features/multicam/services/multicam-manager.ts:6`

**Проблема:**
```typescript
import { EventEmitter } from "events" // ❌ Node.js зависимость
```

**Решение:**
Создать собственный EventBus или использовать Zustand для state management.

---

#### 5. Дублирование типов

**Проблема:**
Тип `SyncResult` определен в 3 местах:
- `audio-sync.ts:13-18`
- `timecode-sync.ts:20-25`
- `types/multicam.ts:18-23`

**Решение:**
Использовать единый тип из `types/multicam.ts`, удалить дубликаты.

---

#### 6. Функция reorderAngles не реализована

**Файл:** `use-multicam.ts:251`

**Проблема:**
```typescript
const reorderAngles = useCallback((fromIndex: number, toIndex: number) => {
  // TODO: Реализовать изменение порядка углов
  logger.debug({ fromIndex, toIndex }, "Reordering angles") // ❌ Только лог
}, [])
```

**Решение:**
Реализовать перестановку углов в массиве с сохранением в linked-clips.

---

#### 7. Неоптимальные вычисления на каждый рендер

**Файл:** `use-multicam.ts:278`

**Проблема:**
```typescript
syncOffsets: angles.map((angle) => cameraSync.getSyncOffset(angle.clipId)),
// ❌ Вычисляется на каждый рендер
```

**Решение:**
```typescript
const syncOffsets = useMemo(
  () => angles.map((angle) => cameraSync.getSyncOffset(angle.clipId)),
  [angles, cameraSync]
)
```

---

### 🟢 Средние

#### 8. AngleViewer - проблемы производительности

**Файл:** `angle-viewer.tsx:95, 114, 185`

**Проблемы:**
1. Загружает все видео одновременно (нет lazy loading)
2. Смещение применяется неправильно: `currentTime + offset` вместо `currentTime - offset`
3. Hardcoded `media-loader://` протокол

**Решение:**
- Добавить Intersection Observer для lazy loading
- Исправить формулу offset
- Сделать протокол конфигурируемым

---

#### 9. Искусственные задержки

**Файл:** `sync-controls.tsx:57`

**Проблема:**
```typescript
await new Promise((resolve) => setTimeout(resolve, 500)) // ❌ Зачем?
```

**Решение:**
Удалить или объяснить необходимость задержки.

---

#### 10. Смешение logInfo и logger

**Файл:** `use-multicam-shortcuts.ts:12`

**Проблема:**
```typescript
logInfo("[useMulticamShortcuts] Инициализация хука") // ❌
// Должно быть:
logger.info("[useMulticamShortcuts] Инициализация хука")
```

---

## План исправлений

### Фаза 1: Критические исправления (3-4 дня)

#### 1.1. Исправить TypeScript ошибки
- [ ] Убрать все `any` типы
- [ ] Объединить дублирующиеся типы SyncResult
- [ ] Переместить MulticamAngle в types/multicam.ts
- [ ] Добавить strict проверки

**Файлы:**
- `src/features/multicam/hooks/use-camera-sync.ts`
- `src/features/multicam/services/multicam-manager.ts`
- `src/features/multicam/services/audio-sync.ts`
- `src/features/multicam/types/multicam.ts`

---

#### 1.2. Создать тесты для useMulticam
- [ ] Базовые сценарии (switch, sync, add/remove)
- [ ] Edge cases (нет baseClipId, пустая группа)
- [ ] Integration с useLinkedClips

**Файл:** `src/features/multicam/__tests__/use-multicam.test.tsx`

---

#### 1.3. Заменить EventEmitter
- [ ] Создать SimpleEventBus
- [ ] Заменить в multicam-manager.ts
- [ ] Обновить тесты

**Файлы:**
- `src/features/multicam/utils/event-bus.ts` (новый)
- `src/features/multicam/services/multicam-manager.ts`

---

### Фаза 2: Функциональные улучшения (4-5 дней)

#### 2.1. Реализовать реальную аудио синхронизацию

**Подход:**
1. Создать Tauri command для извлечения аудио через FFmpeg
2. Реализовать cross-correlation в Rust (производительность)
3. Добавить fallback на Web Audio API для браузерной версии
4. Добавить сегментную обработку (chunks) для больших файлов

**Файлы:**
- `src-tauri/src/audio/mod.rs` (новый)
- `src-tauri/src/audio/extraction.rs` (новый)
- `src-tauri/src/audio/correlation.rs` (новый)
- `src/features/multicam/services/audio-sync.ts` (обновить)
- `src/features/multicam/services/audio-sync-adapter.ts` (обновить)

**Алгоритм:**
```rust
// Псевдокод
fn cross_correlate(signal1: &[f32], signal2: &[f32]) -> (f64, f64) {
    let max_correlation = 0.0;
    let best_offset = 0;

    for offset in -max_offset..max_offset {
        let correlation = calculate_correlation(signal1, signal2, offset);
        if correlation > max_correlation {
            max_correlation = correlation;
            best_offset = offset;
        }
    }

    (best_offset as f64 / sample_rate, max_correlation)
}
```

---

#### 2.2. Реализовать reorderAngles
- [ ] Добавить логику перестановки
- [ ] Синхронизировать с linked-clips
- [ ] Добавить тесты

**Файл:** `src/features/multicam/hooks/use-multicam.ts:251`

---

#### 2.3. Оптимизировать AngleViewer
- [ ] Добавить Intersection Observer для lazy loading
- [ ] Исправить формулу offset
- [ ] Добавить error handling с UI
- [ ] Виртуализация для >9 камер

**Файл:** `src/features/multicam/components/angle-viewer.tsx`

---

### Фаза 3: Качество и документация (2-3 дня)

#### 3.1. Мемоизация и производительность
- [ ] Мемоизировать syncOffsets в useMulticam
- [ ] Мемоизировать angles mapping
- [ ] Добавить React.memo для AngleViewer

---

#### 3.2. Улучшить документацию
- [ ] Указать, что audio sync требует FFmpeg
- [ ] Добавить troubleshooting секцию
- [ ] Документировать создание multicam groups
- [ ] Добавить примеры кода

---

#### 3.3. Добавить сохранение настроек
- [ ] Сохранять sync offsets в .timeline файл
- [ ] Загружать при открытии проекта
- [ ] Добавить миграцию для старых проектов

---

## Приоритизация задач

### Must Have (до релиза):
1. ✅ Исправить TypeScript ошибки (Фаза 1.1)
2. ✅ Создать тесты для useMulticam (Фаза 1.2)
3. ✅ Заменить EventEmitter (Фаза 1.3)
4. ⚠️ Реализовать reorderAngles (Фаза 2.2)

### Should Have:
5. ⚠️ Реальная аудио синхронизация (Фаза 2.1)
6. ⚠️ Оптимизировать AngleViewer (Фаза 2.3)
7. ⚠️ Мемоизация (Фаза 3.1)

### Nice to Have:
8. 💡 Сохранение настроек (Фаза 3.2)
9. 💡 Улучшенная документация (Фаза 3.3)

---

## Миграционный план

### Этап 1: Подготовка (1 день)
- [ ] Создать feature branch `feature/multicam-improvements`
- [ ] Ревью существующего кода
- [ ] Подготовить моки для тестов

### Этап 2: Фаза 1 (3-4 дня)
- [ ] TypeScript исправления
- [ ] Тесты для useMulticam
- [ ] Замена EventEmitter

### Этап 3: Фаза 2 (4-5 дней)
- [ ] Аудио синхронизация (опционально)
- [ ] reorderAngles
- [ ] Оптимизация AngleViewer

### Этап 4: Фаза 3 (2-3 дня)
- [ ] Производительность
- [ ] Документация
- [ ] Сохранение настроек

### Этап 5: Финализация (1 день)
- [ ] Code review
- [ ] Integration тесты
- [ ] Merge в main

**Общее время:** 11-14 дней

---

## Метрики успеха

### Код качество
- ✅ 0 TypeScript ошибок с `any`
- ✅ Test coverage useMulticam > 80%
- ✅ Все критичные функции покрыты тестами

### Функциональность
- ✅ reorderAngles работает
- ⚠️ Audio sync реализован (опционально)
- ✅ AngleViewer lazy loading

### Производительность
- ✅ Мемоизация вычислений
- ✅ Виртуализация для >9 камер
- ✅ Нет искусственных задержек

### Документация
- ✅ README обновлен
- ✅ Ограничения указаны
- ✅ Примеры использования

---

## Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Аудио синхронизация слишком сложна | Высокая | Высокое | Реализовать в Rust, использовать существующие библиотеки (aubio) |
| Breaking changes для existing users | Средняя | Высокое | Обратная совместимость, миграция |
| Производительность аудио sync | Средняя | Среднее | Сегментная обработка, Web Workers |
| Тесты падают после рефакторинга | Низкая | Среднее | Incremental refactoring, CI checks |

---

## 🚀 Актуальный план реализации (2025-11-27)

### Фаза 1: TypeScript исправления (2-3 часа)

**Файл:** `src/features/multicam/hooks/use-camera-sync.ts`
- [ ] Строка 84: `mediaItemsToMediaFiles(mediaFiles as any)` → правильный тип
- [ ] Строка 85: `syncByTimecodeService(baseClip as any, clips as any, ...)` → типизация
- [ ] Строка 141: `multicamGroup.filter((clip: any) => ...)` → TimelineClip
- [ ] Строка 242: `allClips.find((c: any) => ...)` → TimelineClip

**Файл:** `src/features/multicam/utils/media-mapper.ts`
- [ ] Строка 15: `(item.media_type as any as string)` → String(item.media_type)

---

### Фаза 2: Audio Sync интеграция (1-2 дня)

#### 2a. Tauri команда (Rust)

**Создать:** `src-tauri/src/commands/audio_correlation.rs`

```rust
use symphonia::core::...;

#[tauri::command]
pub async fn correlate_audio_files(
    base_path: String,
    target_path: String,
    max_offset_seconds: f64,
) -> Result<AudioCorrelationResult, String> {
    // 1. Извлечь аудио сэмплы через symphonia (уже есть в audio_analysis.rs)
    // 2. Применить cross-correlation алгоритм
    // 3. Вернуть offset и confidence
}

pub struct AudioCorrelationResult {
    pub offset_seconds: f64,
    pub confidence: f64,
    pub correlation_peak: f64,
}
```

**Паттерн:** Использовать существующий `src-tauri/src/commands/audio_analysis.rs` как референс

#### 2b. Frontend интеграция

**Обновить:** `src/features/multicam/services/audio-sync-adapter.ts`

```typescript
import { invoke } from "@tauri-apps/api/core"

export async function syncByAudio(
  basePath: string,
  targetPath: string,
  options?: { onProgress?: (progress: number) => void },
): Promise<AudioCorrelationResult> {
  // Заменить заглушку на реальный вызов Tauri
  const result = await invoke<AudioCorrelationResult>("correlate_audio_files", {
    basePath,
    targetPath,
    maxOffsetSeconds: 10.0,
  })
  return result
}
```

---

### Фаза 3: reorderAngles (3-4 часа)

**Файл:** `src/features/multicam/hooks/use-multicam.ts:242-257`

**Подход через trackId:**
```typescript
const reorderAngles = useCallback((fromIndex: number, toIndex: number) => {
  const newAngles = [...angles]
  const [moved] = newAngles.splice(fromIndex, 1)
  newAngles.splice(toIndex, 0, moved)

  // Обновить trackId для сохранения порядка
  newAngles.forEach((angle, idx) => {
    // Использовать linked-clips для обновления
  })

  setAngles(newAngles)
}, [angles, linkedClips])
```

---

### Фаза 4: Мелкие оптимизации (1 час)

- [ ] `use-multicam-shortcuts.ts:12` - заменить `logInfo` на `logger.info`
- [ ] Проверить что все тесты проходят
- [ ] Обновить README с информацией о audio sync

---

## Порядок выполнения

```
Фаза 1 (TypeScript) ──┬──> Фаза 4 (Оптимизации)
                      │
Фаза 2a (Rust) ───────┼──> Фаза 2b (Frontend) ──> Тесты audio sync
                      │
Фаза 3 (reorder) ─────┘
```

**Фазы 1, 2a, 3 можно делать параллельно!**

---

## Дополнительные материалы

### Ссылки
- [Cross-correlation algorithm](https://en.wikipedia.org/wiki/Cross-correlation)
- [FFmpeg audio extraction](https://ffmpeg.org/ffmpeg-filters.html#aformat)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Aubio library for Rust](https://github.com/katyo/aubio-rs)

### Примеры из других проектов
- [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) - multicam workflow
- [Premiere Pro](https://helpx.adobe.com/premiere-pro/using/multicam-workflows.html) - audio sync
- [OpenShot](https://www.openshot.org/) - open source alternative
