# Montage Planning Tool - Интеграция с Timeline

## Обзор

Инструмент интегрирует Smart Montage Planner с Timeline, позволяя автоматически применять сгенерированные планы монтажа к рабочей области.

## Архитектура

### Основные компоненты

1. **MontagePlanningTool** - AI Tool для работы через чат
2. **applyPlanToTimeline()** - Функция применения плана к Timeline
3. **VideoEditingOrchestrator** - API для управления Timeline

## API для применения плана

### `applyPlanToTimeline(plan: MontagePlan)`

Применяет план монтажа к Timeline.

**Параметры:**
- `plan: MontagePlan` - План монтажа из генетического алгоритма

**Возвращает:**
```typescript
{
  success: boolean           // Успешность операции
  appliedClips: number       // Количество добавленных клипов
  appliedTransitions: number // Количество примененных переходов
  errors: string[]           // Список ошибок
}
```

**Алгоритм работы:**

1. **Создание треков**
   - Для каждого `Sequence` создается отдельный видео трек
   - Название трека: `{sequence.type} - {sequence.purpose}`

2. **Добавление клипов**
   - Клипы из `sequence.clips` добавляются последовательно
   - Учитывается `sequenceOrder` для правильного порядка
   - Позиция на timeline рассчитывается с учетом длительности предыдущих клипов

3. **Применение adjustments**
   - `speedMultiplier` -> `clip.speed` и `clip.playbackRate`
   - `crop` -> `clip.position`
   - `colorCorrection` -> TODO
   - `stabilization` -> TODO

4. **Применение переходов**
   - Переходы между клипами (`sequence.transitions`)
   - Переходы между sequences (`plan.transitions`)
   - TODO: Полная реализация через Timeline Transition API

## Использование

### Через AI Chat

```typescript
// Генерация и автоматическое применение плана
{
  operation: "generate_plan",
  prompt: "Создай динамичный монтаж на 2 минуты",
  applyToTimeline: true  // Автоматически применить
}
```

### Программное использование

```typescript
import { applyPlanToTimeline } from '@/domains/ai-tools/tools/automation/montage-planning'

const plan = await generateMontagePlan(...)
const result = await applyPlanToTimeline(plan)

if (result.success) {
  console.log(`Применено ${result.appliedClips} клипов`)
} else {
  console.error('Ошибки:', result.errors)
}
```

## Структура данных

### MontagePlan → Timeline

```
MontagePlan
├── sequences[] (Sequence)
│   ├── id, type, purpose
│   ├── clips[] (PlannedClip)
│   │   ├── fragment (Fragment)
│   │   │   ├── sourceFile (MediaFile)
│   │   │   ├── startTime, endTime, duration
│   │   │   └── objects[], people[]
│   │   ├── adjustments (ClipAdjustments)
│   │   │   ├── speedMultiplier
│   │   │   ├── crop
│   │   │   └── colorCorrection
│   │   └── suggestions[]
│   └── transitions[] (TransitionPlan)
├── transitions[] (SequenceTransition)
└── metadata, style, pacing

           ↓ Преобразование

Timeline
├── tracks[] (Track)
│   ├── id, name, type: "video"
│   └── clips[] (TimelineClip)
│       ├── mediaId, mediaFile
│       ├── startTime, duration
│       ├── speed, playbackRate
│       ├── position (crop)
│       └── transitions[]
```

### Fragment → TimelineClip

```typescript
// Fragment из плана
{
  sourceFile: MediaFile,
  startTime: 10.5,
  endTime: 15.2,
  duration: 4.7
}

// Конвертируется в TimelineClip
{
  mediaId: sourceFile.id,
  mediaFile: sourceFile,
  startTime: currentTime,      // Позиция на timeline
  duration: 4.7,
  mediaStartTime: 10.5,        // Начало в исходном файле
  mediaEndTime: 15.2,          // Конец в исходном файле
  speed: adjustments?.speedMultiplier || 1.0
}
```

## Timeline APIs

### Используемые API из VideoEditingOrchestrator

```typescript
// Создание трека
await orchestrator.addTrack(
  "video",           // type
  "Intro - Hook"     // name
)

// Добавление клипа
await orchestrator.addClip(
  trackId,           // string
  mediaFile,         // MediaFile | string
  time               // number (seconds)
)

// Обновление клипа
await orchestrator.updateClip(
  clipId,            // string
  updates            // Partial<TimelineClip>
)
```

## Особенности реализации

### 1. Track ID Management

**Проблема:** Backend создает трек асинхронно, ID возвращается через event.

**Временное решение:**
```typescript
const trackId = `track-${sequence.id}-${Date.now()}`
```

**TODO:** Подписаться на `TrackAdded` event и получить реальный ID.

### 2. Clip ID Management

**Проблема:** Clip ID генерируется на backend при добавлении.

**Текущее решение:**
```typescript
const clipId = `clip-${fragment.id}` // Временный ID
```

**Ограничение:** `updateClip()` может не работать сразу после `addClip()`.

**TODO:** Дождаться события `ClipAdded` с реальным ID.

### 3. Transitions

**Статус:** Частично реализовано

**Реализовано:**
- Логирование transitions для отладки
- Подсчет transitions

**TODO:**
- Применение transitions через Timeline Transition API
- Синхронизация с backend

### 4. Effects & Filters

**Статус:** Не реализовано

**TODO:**
- Применение color correction
- Применение stabilization
- Применение effects из suggestions

## Error Handling

Функция `applyPlanToTimeline` использует robust error handling:

```typescript
// Собираем все ошибки, но продолжаем работу
const errors: string[] = []

try {
  // ... добавление клипа
} catch (error) {
  errors.push(`Не удалось добавить клип: ${error.message}`)
  // Продолжаем со следующим клипом
}

return {
  success: errors.length === 0,
  errors
}
```

**Стратегия:**
- Ошибки в одном sequence не блокируют другие sequences
- Ошибки в одном clip не блокируют другие clips
- Все ошибки собираются и возвращаются пользователю
- Partial success: часть плана может быть применена успешно

## Примеры использования

### Пример 1: Базовое применение

```typescript
const plan: MontagePlan = {
  sequences: [
    {
      id: 'seq-1',
      type: SequenceType.Intro,
      purpose: SequencePurpose.Hook,
      clips: [
        {
          fragmentId: 'frag-1',
          fragment: {
            sourceFile: mediaFile1,
            startTime: 0,
            endTime: 5,
            duration: 5
          },
          sequenceOrder: 0
        }
      ]
    }
  ]
}

const result = await applyPlanToTimeline(plan)
// Результат: создан 1 трек "Intro - Hook", добавлен 1 клип
```

### Пример 2: С adjustments

```typescript
const clip: PlannedClip = {
  fragment: {
    sourceFile: mediaFile,
    startTime: 10,
    endTime: 15,
    duration: 5
  },
  adjustments: {
    speedMultiplier: 2.0,  // 2x скорость
    crop: {
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8
    }
  }
}

// Результат:
// - Клип добавлен на timeline
// - speed = 2.0, playbackRate = 2.0
// - position = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
// - duration на timeline = 5 / 2.0 = 2.5 секунды
```

### Пример 3: Error handling

```typescript
const result = await applyPlanToTimeline(plan)

if (result.success) {
  console.log(`✅ План применен: ${result.appliedClips} клипов`)
} else {
  console.warn(`⚠️ План применен частично:`)
  console.log(`  Клипов добавлено: ${result.appliedClips}`)
  console.log(`  Ошибки:`)
  result.errors.forEach(err => console.log(`    - ${err}`))
}
```

## Testing

### Unit Tests

TODO: Создать тесты для `applyPlanToTimeline`:

```typescript
describe('applyPlanToTimeline', () => {
  it('should create tracks for each sequence', async () => {
    // ...
  })

  it('should add clips in correct order', async () => {
    // ...
  })

  it('should apply speed adjustments', async () => {
    // ...
  })

  it('should handle errors gracefully', async () => {
    // ...
  })
})
```

### Integration Tests

TODO: E2E тесты:
1. Генерация плана через backend
2. Применение к timeline
3. Проверка timeline state
4. Проверка backend sync

## Roadmap

### Phase 1: Core (✅ Done)
- [x] Basic clip addition
- [x] Track creation
- [x] Speed adjustments
- [x] Crop adjustments
- [x] Error handling

### Phase 2: Transitions (TODO)
- [ ] Clip transitions
- [ ] Sequence transitions
- [ ] Timeline Transition API integration

### Phase 3: Effects (TODO)
- [ ] Color correction
- [ ] Stabilization
- [ ] Effects from suggestions

### Phase 4: Advanced (TODO)
- [ ] Undo/Redo support
- [ ] Batch operations optimization
- [ ] Real-time preview
- [ ] Conflict resolution

## Known Issues

1. **Track ID не синхронизируется с backend**
   - Workaround: Временный ID генерируется локально
   - Impact: Нельзя сразу обновить трек после создания

2. **Clip ID не известен после addClip()**
   - Workaround: Используется fragment.id
   - Impact: updateClip() может не работать

3. **Transitions не применяются**
   - Status: Частично реализовано
   - Impact: Переходы нужно добавлять вручную

## References

- [Timeline Types](/src/domains/video-editing/types/timeline.ts)
- [Video Editing Orchestrator](/src/domains/video-editing/services/video-editing-orchestrator.ts)
- [Timeline Providers](/src/domains/video-editing/providers/timeline-providers.tsx)
- [Montage Planner Types](/src/features/montage-planner/types/index.ts)
