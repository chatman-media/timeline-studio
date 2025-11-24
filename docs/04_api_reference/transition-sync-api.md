# API синхронизации переходов

## Обзор

Система синхронизации переходов обеспечивает автоматическое обновление переходов при изменении клипов на таймлайне.

## Основные компоненты

### clip-transition-sync.ts

Сервис для синхронизации переходов при операциях с клипами.

```typescript
// Синхронизация при перемещении клипа
syncTransitionsOnClipMove(
  project: TimelineProject,
  clipId: string,
  oldTrackId: string,
  newTrackId: string,
  oldPosition: number,
  newPosition: number,
  oldDuration: number,
): TimelineProject

// Синхронизация при обрезке клипа
syncTransitionsOnClipTrim(
  project: TimelineProject,
  clipId: string,
  trackId: string,
  oldStartTime: number,
  newStartTime: number,
  oldDuration: number,
  newDuration: number,
): TimelineProject

// Обработка переходов при удалении клипа
syncTransitionsOnClipDelete(
  project: TimelineProject,
  clipId: string,
): TimelineProject

// Обработка переходов при разрезании клипа
syncTransitionsOnClipSplit(
  project: TimelineProject,
  originalClipId: string,
  leftClipId: string,
  rightClipId: string,
  splitTime: number,
): TimelineProject
```

### use-transition-sync.ts

Hook для управления синхронизацией переходов.

```typescript
const {
  syncMoveClip,
  syncTrimClip,
  syncRemoveClip,
  syncSplitClip,
  findClip,
} = useTransitionSync({ project, updateProject })
```

### use-clips-with-transitions.ts

Обёртка над `useClips` с автоматической синхронизацией переходов.

```typescript
const clips = useClipsWithTransitions()

// Все операции с клипами автоматически синхронизируют переходы
await clips.moveClip(clipId, newTrackId, newPosition)
await clips.trimClip(clipId, newStartTime, newDuration)
await clips.removeClip(clipId)
```

## Правила синхронизации

### При перемещении клипа

1. **Между треками**: Все связанные переходы удаляются
2. **В пределах трека**: Переходы корректируют позиции

### При обрезке клипа

- **Переход на вход**: Позиция = новая начальная позиция клипа
- **Переход на выход**: Позиция = новая конечная позиция - длительность перехода
- **Переход между клипами**: Корректируется в зависимости от того, какой клип обрезается

### При удалении клипа

Удаляются все переходы, связанные с клипом:
- Переход на вход (type: "in")
- Переход на выход (type: "out")
- Переходы между клипами (type: "between")

### При разрезании клипа

- **Переход на вход**: Остаётся с левым клипом
- **Переход на выход**: Переходит к правому клипу
- **Переход "до"**: Остаётся с левым клипом
- **Переход "после"**: Переходит к правому клипу

## Обнаружение коллизий

```typescript
// Проверка возможности добавления перехода
canAddTransition(
  project: TimelineProject,
  trackId: string,
  position: number,
  duration: number,
  excludeId?: string,
): boolean

// Устранение коллизий после операции
resolveTransitionCollisions(
  project: TimelineProject,
  trackId: string,
  changedTransitionId?: string,
): TimelineProject
```

## Интеграция с компонентами

### TransitionControlPanel

Панель управления переходами автоматически использует `useTimelineTransitions` для обновления и удаления переходов.

```typescript
const { updateTransition, removeTransition } = useTimelineTransitions()

// Обновление перехода
updateTransition(transitionId, updates)

// Удаление перехода
removeTransition(transitionId)
```

## Примеры использования

### Добавление синхронизации к существующему коду

```typescript
// Было
const handleMoveClip = async (clipId: string, newTrackId: string, newPosition: number) => {
  await moveClip(clipId, newTrackId, newPosition)
}

// Стало
const handleMoveClip = async (clipId: string, newTrackId: string, newPosition: number) => {
  const clip = findClip(clipId)
  if (clip) {
    const oldTrackId = clip.trackId
    const oldPosition = clip.startTime
    const duration = clip.duration
    
    await moveClip(clipId, newTrackId, newPosition)
    
    syncMoveClip(clipId, oldTrackId, newTrackId, oldPosition, newPosition, duration)
  }
}
```

### Использование готового хука

```typescript
const clips = useClipsWithTransitions()

// Все операции автоматически синхронизируют переходы
const handleOperations = async () => {
  // Перемещение
  await clips.moveClip("clip1", "track2", 10.0)
  
  // Обрезка
  await clips.trimClip("clip2", 5.0, 3.0)
  
  // Удаление
  await clips.removeClip("clip3")
}
```

## Ограничения

1. **Backend интеграция**: В текущей реализации синхронизация работает только на клиентской стороне
2. **Split операция**: Требует возврата IDs новых клипов для полной синхронизации
3. **Undo/Redo**: Синхронизация переходов не интегрирована с системой отмены/повтора

## Будущие улучшения

1. Интеграция с backend для персистентности изменений
2. Поддержка групповых операций с клипами
3. Автоматическое разрешение коллизий при вставке
4. Визуальная индикация конфликтов переходов