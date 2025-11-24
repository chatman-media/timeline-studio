# Timeline API

## Обзор

Timeline API предоставляет полный набор функций для управления видео таймлайном, включая треки, клипы, эффекты и переходы.

## Основные компоненты

### useTimeline Hook

Главный хук для работы с таймлайном.

```typescript
const {
  project,              // Текущий проект
  selectedClipIds,      // Выбранные клипы
  playhead,            // Позиция воспроизведения
  zoom,                // Уровень масштаба
  isPlaying,           // Состояние воспроизведения
  selection,           // Текущее выделение
  undoStack,           // История изменений
  redoStack,           // История отмены
} = useTimeline()
```

### TimelineProvider

Провайдер контекста для таймлайна.

```typescript
<TimelineProvider initialProject={project}>
  <Timeline />
  <TimelineControls />
  <TimelineRuler />
</TimelineProvider>
```

## Структура данных

### TimelineProject

```typescript
interface TimelineProject {
  id: string
  name: string
  settings: ProjectSettings
  tracks: Track[]
  duration: number
  transitions: TimelineTransition[]
  markers: TimelineMarker[]
  metadata: ProjectMetadata
}

interface ProjectSettings {
  resolution: Resolution
  frameRate: number
  aspectRatio: AspectRatio
  audioSampleRate: number
  audioChannels: number
}
```

### Track

```typescript
interface Track {
  id: string
  type: TrackType
  name: string
  clips: Clip[]
  height: number
  muted: boolean
  locked: boolean
  visible: boolean
  solo: boolean
  color?: string
}

type TrackType = 'video' | 'audio' | 'text' | 'overlay'
```

### Clip

```typescript
interface Clip {
  id: string
  trackId: string
  mediaId: string
  startTime: number      // Позиция на таймлайне
  duration: number       // Длительность на таймлайне
  inPoint: number        // Начало в исходном медиа
  outPoint: number       // Конец в исходном медиа
  effects: VideoEffect[]
  keyframes: Keyframe[]
  metadata: ClipMetadata
}

interface ClipMetadata {
  name: string
  thumbnailUrl?: string
  originalDuration: number
  locked: boolean
  disabled: boolean
}
```

## Операции с клипами

### useClips Hook

```typescript
const clips = useClips()

// Добавление клипа
const newClip = await clips.addClip({
  trackId: 'track-1',
  mediaId: 'media-123',
  position: 10.5,
  duration: 5.0
})

// Перемещение клипа
await clips.moveClip(clipId, newTrackId, newPosition)

// Обрезка клипа
await clips.trimClip(clipId, {
  startTime: 2.0,
  duration: 3.5
})

// Разделение клипа
const [leftClip, rightClip] = await clips.splitClip(clipId, splitTime)

// Удаление клипа
await clips.removeClip(clipId)

// Дублирование клипа
const duplicated = await clips.duplicateClip(clipId)
```

### Batch операции

```typescript
// Групповые операции
await clips.batchUpdate([
  { type: 'move', clipId: 'clip1', trackId: 'track2', position: 5 },
  { type: 'trim', clipId: 'clip2', startTime: 1, duration: 4 },
  { type: 'remove', clipId: 'clip3' }
])

// Выравнивание клипов
await clips.alignClips(clipIds, {
  alignment: 'left', // 'left' | 'right' | 'center'
  reference: 'first' // 'first' | 'last' | 'playhead'
})

// Распределение клипов
await clips.distributeClips(clipIds, {
  spacing: 0.5, // Промежуток в секундах
  overlap: false
})
```

## Управление треками

### useTracks Hook

```typescript
const tracks = useTracks()

// Добавление трека
const newTrack = await tracks.addTrack({
  type: 'video',
  name: 'Video Track 2',
  height: 80
})

// Изменение порядка треков
await tracks.reorderTrack(trackId, newIndex)

// Изменение высоты трека
await tracks.resizeTrack(trackId, newHeight)

// Переключение состояний
await tracks.toggleMute(trackId)
await tracks.toggleLock(trackId)
await tracks.toggleSolo(trackId)

// Удаление трека
await tracks.removeTrack(trackId)
```

## Эффекты и фильтры

### Применение эффектов

```typescript
const effects = useEffects()

// Добавление эффекта к клипу
await effects.addEffect(clipId, {
  type: 'brightness',
  params: { intensity: 0.5 }
})

// Обновление параметров эффекта
await effects.updateEffect(clipId, effectId, {
  params: { intensity: 0.7 }
})

// Изменение порядка эффектов
await effects.reorderEffects(clipId, [effectId2, effectId1, effectId3])

// Копирование эффектов между клипами
await effects.copyEffects(sourceClipId, targetClipId)

// Удаление эффекта
await effects.removeEffect(clipId, effectId)
```

### Пресеты эффектов

```typescript
// Сохранение пресета
const preset = await effects.savePreset({
  name: 'Cinematic Look',
  effects: clip.effects
})

// Применение пресета
await effects.applyPreset(clipId, presetId)

// Управление пресетами
const presets = await effects.getPresets()
await effects.deletePreset(presetId)
```

## Переходы

### useTransitions Hook

```typescript
const transitions = useTransitions()

// Добавление перехода между клипами
const transition = await transitions.addTransition({
  type: 'fade',
  duration: 1.0,
  fromClipId: 'clip1',
  toClipId: 'clip2'
})

// Обновление перехода
await transitions.updateTransition(transitionId, {
  duration: 1.5,
  params: { direction: 'left' }
})

// Удаление перехода
await transitions.removeTransition(transitionId)
```

## Маркеры и регионы

### useMarkers Hook

```typescript
const markers = useMarkers()

// Добавление маркера
const marker = await markers.addMarker({
  time: 15.5,
  name: 'Important moment',
  color: '#FF5733',
  type: 'comment' // 'comment' | 'chapter' | 'todo'
})

// Создание региона
const region = await markers.createRegion({
  startTime: 10,
  endTime: 20,
  name: 'Intro',
  color: '#3498DB'
})

// Навигация по маркерам
await markers.jumpToMarker(markerId)
await markers.jumpToNextMarker()
await markers.jumpToPreviousMarker()
```

## Воспроизведение

### usePlayback Hook

```typescript
const playback = usePlayback()

// Управление воспроизведением
playback.play()
playback.pause()
playback.stop()
playback.togglePlayPause()

// Навигация
playback.seek(timeInSeconds)
playback.seekToFrame(frameNumber)
playback.stepForward() // На 1 кадр
playback.stepBackward()

// Скорость воспроизведения
playback.setPlaybackRate(2.0) // 2x скорость

// Loop режимы
playback.setLoopMode('none') // 'none' | 'all' | 'selection'
playback.setLoopRegion(startTime, endTime)
```

## История изменений

### useHistory Hook

```typescript
const history = useHistory()

// Отмена/повтор
history.undo()
history.redo()
history.canUndo() // boolean
history.canRedo() // boolean

// Управление историей
history.clearHistory()
history.checkpoint('Before big change')

// Получение истории
const undoStack = history.getUndoStack()
const action = history.getLastAction()
```

## Выделение и навигация

### useSelection Hook

```typescript
const selection = useSelection()

// Выделение клипов
selection.select(clipId)
selection.selectMultiple([clipId1, clipId2])
selection.selectAll()
selection.deselectAll()

// Выделение региона
selection.selectRegion(startTime, endTime)

// Навигация по выделению
selection.selectNext()
selection.selectPrevious()
selection.extendSelection(clipId)
```

## Масштабирование и прокрутка

### useTimelineView Hook

```typescript
const view = useTimelineView()

// Масштабирование
view.zoomIn()
view.zoomOut()
view.zoomToFit()
view.zoomToSelection()
view.setZoom(pixelsPerSecond)

// Прокрутка
view.scrollToTime(timeInSeconds)
view.scrollToClip(clipId)
view.centerPlayhead()

// Видимая область
const visibleRange = view.getVisibleTimeRange()
// { start: 10, end: 25 }
```

## Snap и выравнивание

### useSnapping Hook

```typescript
const snapping = useSnapping()

// Настройки привязки
snapping.setEnabled(true)
snapping.setSnapToGrid(true)
snapping.setSnapToClips(true)
snapping.setSnapToMarkers(true)
snapping.setSnapThreshold(5) // pixels

// Получение точек привязки
const snapPoints = snapping.getSnapPoints(position)
const snappedPosition = snapping.snap(position)
```

## Экспорт региона

```typescript
// Экспорт выделенного региона
const exportRegion = useExportRegion()

const region = exportRegion.setRegion(startTime, endTime)
const preview = await exportRegion.generatePreview()

await exportRegion.export({
  format: 'mp4',
  quality: 'high',
  outputPath: '/path/to/output.mp4'
})
```

## События таймлайна

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('Timeline')

// Подписка на события
timeline.on('clipAdded', (clip) => {
  logger.infoSync('Clip added', { clipId: clip.id, trackId: clip.trackId })
})

timeline.on('selectionChanged', (selection) => {
  logger.debugSync('Selection changed', { selection })
  updateUI(selection)
})

timeline.on('playheadChanged', (time) => {
  updateTimeDisplay(time)
})

timeline.on('zoomChanged', (zoom) => {
  logger.debugSync('Zoom changed', { zoom })
  updateZoomSlider(zoom)
})

// Отписка
timeline.off('clipAdded', handler)
```

## Производительность

### Оптимизация для больших проектов

```typescript
// Виртуализация треков
const virtualizer = useTrackVirtualizer({
  trackHeight: 80,
  overscan: 2
})

// Ленивая загрузка клипов
const visibleClips = useVisibleClips({
  loadAhead: 5, // секунд
  unloadDelay: 10 // секунд
})

// Дебаунс обновлений
const debouncedUpdate = useDebouncedTimelineUpdate(100)
```

## Интеграция с AI

```typescript
// AI-помощник для таймлайна
const ai = useTimelineAI()

// Автоматическая расстановка клипов
const suggestions = await ai.suggestArrangement(clips)
await ai.applyArrangement(suggestions)

// Умная обрезка
const trimPoints = await ai.detectTrimPoints(clip)
await clips.trimClip(clipId, trimPoints)

// Генерация переходов
const transitions = await ai.generateTransitions(clips)
```

---

*Последнее обновление: 31 июля 2025*