# Timeline Utils

Утилиты для работы с Timeline функциональностью. Включает 8 основных утилит для обработки данных, расчетов и операций редактирования.

## 📁 Структура утилит

```
src/features/timeline/utils/
├── clip-operations.ts          # Операции с клипами
├── timeline-to-project.ts      # Конвертация данных
├── snap-engine.ts             # Механизм привязки
├── drag-calculations.ts       # Drag & Drop расчеты
├── speed-ramping-utils.ts     # Speed ramping утилиты
├── edit-operations.ts         # Редактирование клипов
├── keyframe-interpolation.ts  # Keyframe анимация
├── utils.ts                   # Общие утилиты
└── README.md                  # Документация (этот файл)
```

## 🎯 Основные утилиты

### `clip-operations.ts`
Операции с клипами.

```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
// Проверка пересечения клипов
export function clipsOverlap(
  clip1: TimelineClip, 
  clip2: TimelineClip
): boolean

// Расчет конечного времени клипа
export function getClipEndTime(clip: TimelineClip): number

// Сортировка клипов по времени
export function sortClipsByTime(clips: TimelineClip[]): TimelineClip[]

// Поиск свободного места на треке
export function findFreeSpaceOnTrack(
  track: TimelineTrack,
  duration: number,
  startTime?: number
): number | null
```

### `timeline-to-project.ts`
Конвертация данных Timeline в формат проекта.

```typescript
// Конвертация Timeline в Project
export function timelineToProject(
  timeline: TimelineState
): Project

// Конвертация Project в Timeline
export function projectToTimeline(
  project: Project
): TimelineState

// Синхронизация изменений
export function syncTimelineChanges(
  timeline: TimelineState,
  changes: TimelineChanges
): Project
```

### `snap-engine.ts`
Механизм привязки элементов.

```typescript
// Настройки привязки
interface SnapSettings {
  enabled: boolean
  threshold: number  // В пикселях
  snapToGrid: boolean
  snapToClips: boolean
  snapToMarkers: boolean
}

// Поиск точек привязки
export function findSnapPoints(
  position: number,
  settings: SnapSettings,
  context: SnapContext
): SnapPoint[]

// Применение привязки
export function applySnap(
  position: number,
  snapPoints: SnapPoint[]
): number
```

### `drag-calculations.ts`
Вычисления для drag & drop операций.

```typescript
// Расчет новой позиции при перетаскивании
export function calculateDragPosition(
  mouseX: number,
  timeScale: number,
  scrollOffset: number,
  snapEnabled: boolean
): number

// Проверка валидности drop позиции
export function isValidDropPosition(
  clip: TimelineClip,
  track: TimelineTrack,
  position: number
): boolean

// Расчет дельты перемещения
export function calculateMoveDelta(
  clips: TimelineClip[],
  deltaTime: number,
  deltaTrack: number
): MoveOperation[]
```

### `speed-ramping-utils.ts`
Утилиты для работы со скоростью.

```typescript
// Интерполяция скорости между ключевыми кадрами
export function interpolateSpeed(
  time: number,
  keyframes: SpeedKeyframe[]
): number

// Расчет длительности с учетом скорости
export function calculateAdjustedDuration(
  originalDuration: number,
  keyframes: SpeedKeyframe[]
): number

// Генерация кривой скорости
export function generateSpeedCurve(
  keyframes: SpeedKeyframe[],
  resolution: number
): SpeedCurvePoint[]
```

### `edit-operations.ts`
Операции редактирования.

```typescript
// Разделение клипа
export function splitClip(
  clip: TimelineClip,
  splitTime: number
): [TimelineClip, TimelineClip]

// Обрезка клипа
export function trimClip(
  clip: TimelineClip,
  trimStart: number,
  trimEnd: number
): TimelineClip

// Ripple удаление
export function rippleDelete(
  clips: TimelineClip[],
  deletedClip: TimelineClip
): TimelineClip[]

// Roll редактирование
export function rollEdit(
  clip1: TimelineClip,
  clip2: TimelineClip,
  delta: number
): [TimelineClip, TimelineClip]
```

### `keyframe-interpolation.ts` ✅ НОВОЕ
Утилиты для keyframe анимации и интерполяции.

```typescript
// Типы интерполяции
type InterpolationType = 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'

// Интерполяция между keyframes
export function interpolateKeyframes(
  keyframes: Keyframe[],
  time: number,
  interpolationType: InterpolationType = 'linear'
): number

// Создание keyframe
export function createKeyframe(
  time: number,
  value: number,
  easing?: EasingFunction
): Keyframe

// Optimized keyframe поиск
export function findKeyframeAtTime(
  keyframes: Keyframe[],
  time: number
): Keyframe | null

// Генерация keyframe кривой
export function generateKeyframeCurve(
  keyframes: Keyframe[],
  resolution: number = 100
): CurvePoint[]
```

### `utils.ts` 
Общие утилиты и хелперы.

```typescript
// Форматирование времени
export function formatTime(seconds: number): string

// Парсинг времени
export function parseTime(timeString: string): number

// Конвертация единиц
export function framesToSeconds(frames: number, fps: number): number
export function secondsToFrames(seconds: number, fps: number): number

// Валидация данных
export function isValidClip(clip: TimelineClip): boolean
export function isValidTrack(track: TimelineTrack): boolean

// Debounce и memoization
export const debouncedOperation = debounce(operation, delay)
export const memoizedCalculation = memoize(calculation)
```

## 🚀 Новые утилиты (август 2025)

### ✅ ДОБАВЛЕНО: Keyframe Animation Support

**keyframe-interpolation.ts** - Полная система анимации:
- Интерполяция между keyframes (linear, bezier, easing)
- Optimized поиск keyframes по времени
- Генерация smooth кривых анимации
- TypeScript типы для всех функций keyframe

### ✅ УЛУЧШЕНО: Speed Ramping Utils

**speed-ramping-utils.ts** - Расширенные возможности:
- Интерполяция скорости между ключевыми кадрами
- Расчет adjusted длительности с учетом ramping
- Генерация smooth speed кривых
- Поддержка multiple keyframes на одном клипе

### ✅ УЛУЧШЕНО: Edit Operations

**edit-operations.ts** - Новые режимы редактирования:
- SLIP/SLIDE операции для профессионального редактирования
- Ripple edit с cascading updates
- Roll edit между соседними клипами
- Batch операции для множественных клипов

### ✅ УЛУЧШЕНО: Drag Calculations

**drag-calculations.ts** - Продвинутые расчеты:
- Multi-select drag support
- Snap-to-grid визуализация
- Collision detection между клипами
- Optimized performance для больших проектов

## 🛠️ Интеграция с новыми системами

### Version Control Integration
```typescript
// Интеграция с Undo/Redo системой
export function createVersionControlledOperation(
  operation: EditOperation,
  canUndo: boolean = true
): VersionControlledOperation

// Batch операции для автоматических снимков
export function batchOperationsForSnapshot(
  operations: EditOperation[]
): BatchSnapshot
```

### Video Fade Support
```typescript
// Утилиты для video fade transitions
export function calculateFadeDuration(
  clip: TimelineClip,
  fadeType: FadeType
): number

export function generateFadeCurve(
  duration: number,
  curveType: 'linear' | 'exponential' | 'cosine'
): FadeCurvePoint[]
```

## 🔧 Вспомогательные функции

### Performance Optimization
```typescript
// Optimized для больших проектов
export const debouncedUpdateClip = debounce(updateClip, 100)
export const memoizedSnapCalculation = memoize(calculateSnapPoints)
export const throttledDragUpdate = throttle(updateDragPosition, 16) // 60fps
```

### Type Safety
```typescript
// Строгая типизация для всех операций
export function isValidEditOperation(operation: EditOperation): boolean
export function validateClipBounds(clip: TimelineClip, track: TimelineTrack): boolean
export function ensureTimelineConsistency(timeline: TimelineState): ValidationResult
```

## Использование

```typescript
import { 
  clipsOverlap,
  findSnapPoints,
  formatTime,
  splitClip
} from '@/features/timeline/utils'

// Проверка пересечения
if (clipsOverlap(clip1, clip2)) {
  logger.debugSync('Клипы пересекаются!')
}

// Форматирование времени
const timeString = formatTime(125.5) // "00:02:05.500"

// Разделение клипа
const [leftClip, rightClip] = splitClip(clip, 10.5)
```

## 🧪 Тестирование

Все утилиты покрыты comprehensive unit-тестами:

```bash
# Запуск всех тестов утилит
bun run test src/features/timeline/__tests__/utils

# Запуск конкретных тестов
bun run test src/features/timeline/__tests__/utils/keyframe-interpolation.test.ts
bun run test src/features/timeline/__tests__/utils/speed-ramping-utils.test.ts
bun run test src/features/timeline/__tests__/utils/drag-calculations.test.ts
```

### Покрытие тестами
- **clip-operations.ts**: 15 тестов (100% coverage)
- **drag-calculations.ts**: 12 тестов (100% coverage)
- **edit-operations.ts**: 18 тестов (100% coverage)
- **keyframe-interpolation.ts**: 14 тестов (100% coverage) ✅ НОВОЕ
- **snap-engine.ts**: 16 тестов (100% coverage)
- **speed-ramping-utils.ts**: 13 тестов (100% coverage)
- **timeline-to-project.ts**: 8 тестов (100% coverage)
- **utils.ts**: 22 тестов (100% coverage)

**Общее покрытие: 118 unit тестов, 100% покрытие кода**

## 📝 Примеры использования

### Keyframe Animation
```typescript
import { interpolateKeyframes, createKeyframe } from '@/features/timeline/utils'

// Создание keyframes для opacity анимации
const opacityKeyframes = [
  createKeyframe(0, 0),      // Start: transparent
  createKeyframe(1, 1),      // 1s: fully opaque
  createKeyframe(3, 1),      // Hold at 3s
  createKeyframe(4, 0)       // 4s: fade out
]

// Получение значения в любой момент времени
const opacityAt2_5s = interpolateKeyframes(opacityKeyframes, 2.5) // 1.0
```

### Version Control Integration
```typescript
import { createVersionControlledOperation } from '@/features/timeline/utils'

// Операция с automatic snapshot support
const moveOperation = createVersionControlledOperation({
  type: 'MOVE_CLIP',
  clipId: 'clip-123',
  newPosition: 15.5,
  oldPosition: 10.0
}, true) // canUndo = true
```

### Performance-Optimized Operations
```typescript
import { 
  debouncedUpdateClip,
  memoizedSnapCalculation,
  throttledDragUpdate 
} from '@/features/timeline/utils'

// Debounced updates для частых изменений
debouncedUpdateClip(clipId, updates)

// Memoized snap calculations для производительности
const snapPoints = memoizedSnapCalculation(position, settings)

// Throttled drag updates для плавности (60fps)
throttledDragUpdate(newPosition)
```