# План улучшения синхронизации видеоплеера

**Дата:** 2025-11-08
**Статус:** В разработке
**Приоритет:** Критический

## Краткое резюме

Анализ архитектуры видеоплеера выявил **критическую проблему**: отсутствие механизма обновления `currentTime` во время воспроизведения. Это приводит к тому, что прогресс-бар не движется, UI замораживается, и плеер фактически нерабочий для отображения прогресса.

## Найденные проблемы

### 🔴 Критическая #1: Время не обновляется во время воспроизведения

**Местоположение:** `src/features/video-player/contexts/player-provider.tsx:250-255`

**Проблема:**
```typescript
const contextValue: PlayerContextType = {
  currentTime: playbackState ? playbackState.current_time : 0,  // ❌ Статично!
  isPlaying: playbackState ? playbackState.is_playing : false,
}
```

**Симптомы:**
- Прогресс-бар не движется во время playback
- `currentTime` остается на месте
- UI не отражает реальное состояние видео

**Причина:**
- Нет `requestAnimationFrame` цикла для обновления UI
- Нет обработчика `timeupdate` на video элементе
- Backend не публикует события времени во время воспроизведения
- Событие `UPDATE_TIME` определено в state machine, но никогда не отправляется

### 🟡 Проблема #2: Избыточная синхронизация с бэкендом

**Местоположение:** `src/features/video-player/services/backend-sync.ts:150-158`

**Проблема:**
```typescript
private async fetchAndNotifyState() {
  const state = await this.getProjectState()  // ⚠️ Получает ВСЁ состояние
  if (state) {
    this.notifyStateChange(state)
  }
}
```

**Симптомы:**
- Каждая команда вызывает полную синхронизацию всего ProjectState
- Передаются большие объемы данных (timeline, media pool, effects, etc.)
- Лишняя нагрузка на IPC между frontend и Rust

### 🟡 Проблема #3: Отсутствие debounce для seek

**Местоположение:** `src/features/video-player/components/player-controls.tsx:120-125`

**Проблема:**
```typescript
const handleTimeChange = useCallback((value: number[]) => {
  const newTime = value[0]
  setLocalDisplayTime(newTime)
  seek(newTime)  // ❌ Вызывается при каждом движении слайдера
}, [seek])
```

**Симптомы:**
- При перетаскивании слайдера отправляются сотни команд в backend
- Перегрузка IPC канала
- Возможны задержки и рывки

### 🟡 Проблема #4: Race conditions при быстрых командах

**Проблема:**
```typescript
await play()
await seek(10)
await pause()
// Все три команды могут обработаться в неправильном порядке
```

**Симптомы:**
- Backend может обработать команды не в том порядке
- Состояние может рассинхронизироваться
- Непредсказуемое поведение плеера

---

## Идеальная архитектура синхронизации

### Принципы

1. **Разделение источников правды (Source of Truth)**
   - **Frontend (Video Element)** - источник правды для `currentTime` во время playback
   - **Backend (Rust)** - источник правды для состояния проекта
   - **Periodic Sync** - редкая синхронизация для консистентности

2. **Оптимистичные обновления**
   - UI обновляется мгновенно (локально)
   - Backend синхронизируется асинхронно
   - Rollback при ошибках

3. **Минимизация IPC**
   - Только критичные события отправляются в backend
   - Debounce для частых операций
   - Delta updates вместо полного состояния

### Архитектура синхронизации времени

```
┌─────────────────────────────────────────────────────────────┐
│                     Video Element (DOM)                      │
│                  Source of Truth для времени                 │
└─────────────────┬───────────────────────────────────────────┘
                  │ timeupdate events
                  │ (60fps)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              requestAnimationFrame Loop                      │
│         Обновление UI каждый кадр (~16ms)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│  Local State │    │ Periodic Sync    │
│  (React)     │    │ (Backend)        │
│  Instant UI  │    │ Every 1 second   │
└──────────────┘    └──────────────────┘
```

### Уровни синхронизации

| Уровень | Частота | Что синхронизируется | Куда |
|---------|---------|---------------------|------|
| **L1: UI** | ~60fps (rAF) | `currentDisplayTime` | Local React State |
| **L2: Periodic** | 1 sec | `currentTime` checkpoint | Backend (Rust) |
| **L3: Critical** | On event | Play/Pause/Seek/Stop | Backend (Rust) |
| **L4: Project** | On save | Full ProjectState | Persistent Storage |

### Потоки данных

```typescript
// Поток 1: Обновление UI (высокая частота, локально)
Video Element → rAF Loop → Local State → UI Components
(60fps)         (~16ms)    (instant)    (smooth)

// Поток 2: Периодическая синхронизация (низкая частота)
Local State → Debounce → Backend Command → Rust State
(1 sec)       (throttle)  (IPC)          (persistent)

// Поток 3: Критичные команды (по событию)
User Action → Optimistic Update → Backend Command → Confirmation
(instant)     (local state)       (IPC)           (rollback on error)
```

---

## План правок

### Фаза 1: Критичные исправления (Приоритет: Высокий)

#### 1.1. Добавить механизм обновления currentTime

**Файлы:**
- `src/features/video-player/contexts/player-provider.tsx`
- `src/features/video-player/hooks/use-playback-time-sync.ts` (новый)

**Изменения:**

1. Создать новый хук `usePlaybackTimeSync`:

```typescript
// src/features/video-player/hooks/use-playback-time-sync.ts
import { useEffect, useState, useRef } from 'react'

export interface PlaybackTimeSyncOptions {
  isPlaying: boolean
  videoSelector?: string
  syncInterval?: number // ms для синхронизации с backend
  onBackendSync?: (time: number) => void
}

export function usePlaybackTimeSync({
  isPlaying,
  videoSelector = 'video[data-player-video]',
  syncInterval = 1000,
  onBackendSync,
}: PlaybackTimeSyncOptions) {
  const [currentDisplayTime, setCurrentDisplayTime] = useState(0)
  const rafIdRef = useRef<number>()
  const lastBackendSyncRef = useRef(0)

  useEffect(() => {
    if (!isPlaying) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = undefined
      }
      return
    }

    const updatePlaybackTime = () => {
      const videoElement = document.querySelector(videoSelector) as HTMLVideoElement

      if (!videoElement || videoElement.paused) {
        rafIdRef.current = requestAnimationFrame(updatePlaybackTime)
        return
      }

      const currentTime = videoElement.currentTime

      // L1: Обновляем локальное состояние каждый кадр
      setCurrentDisplayTime(currentTime)

      // L2: Периодическая синхронизация с backend
      const now = performance.now()
      if (onBackendSync && (now - lastBackendSyncRef.current >= syncInterval)) {
        onBackendSync(currentTime)
        lastBackendSyncRef.current = now
      }

      rafIdRef.current = requestAnimationFrame(updatePlaybackTime)
    }

    rafIdRef.current = requestAnimationFrame(updatePlaybackTime)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isPlaying, videoSelector, syncInterval, onBackendSync])

  return currentDisplayTime
}
```

2. Интегрировать в `PlayerProvider`:

```typescript
// src/features/video-player/contexts/player-provider.tsx

export function PlayerProvider({ children }: PlayerProviderProps) {
  const backendSync = useBackendSync()
  const [backendState, setBackendState] = useState<ProjectState | null>(null)

  // Периодическая синхронизация времени с backend
  const handleBackendTimeSync = useCallback((time: number) => {
    // Отправляем checkpoint в backend (throttled)
    backendSync.executeCommand({
      type: "UpdatePlaybackTime",
      params: { time }
    }).catch(console.error)
  }, [backendSync])

  // Используем новый хук для обновления времени
  const currentDisplayTime = usePlaybackTimeSync({
    isPlaying: playbackState?.is_playing ?? false,
    syncInterval: 1000, // Синхронизация раз в секунду
    onBackendSync: handleBackendTimeSync,
  })

  const contextValue: PlayerContextType = {
    // Используем локальное время для UI
    currentTime: currentDisplayTime,
    // Backend состояние только для критичных параметров
    isPlaying: playbackState?.is_playing ?? false,
    playbackRate: playbackState?.playback_rate ?? 1,
    // ...
  }

  // ...
}
```

**Результат:**
- ✅ Плавное обновление прогресс-бара
- ✅ Минимизация IPC (1 запрос в секунду вместо 60fps)
- ✅ Мгновенная реакция UI

---

#### 1.2. Добавить debounce для seek

**Файлы:**
- `src/features/video-player/components/player-controls.tsx`
- `src/features/video-player/hooks/use-debounced-seek.ts` (новый)

**Изменения:**

1. Создать хук `useDebouncedSeek`:

```typescript
// src/features/video-player/hooks/use-debounced-seek.ts
import { useCallback, useRef } from 'react'

export interface DebouncedSeekOptions {
  delay?: number
  onSeekStart?: (time: number) => void
  onSeekEnd?: (time: number) => void
}

export function useDebouncedSeek(
  seek: (time: number) => Promise<void>,
  options: DebouncedSeekOptions = {}
) {
  const { delay = 100, onSeekStart, onSeekEnd } = options
  const timeoutRef = useRef<NodeJS.Timeout>()
  const pendingTimeRef = useRef<number>()

  const debouncedSeek = useCallback((time: number) => {
    // Сохраняем время для UI
    pendingTimeRef.current = time
    onSeekStart?.(time)

    // Отменяем предыдущий таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Устанавливаем новый таймер
    timeoutRef.current = setTimeout(async () => {
      if (pendingTimeRef.current !== undefined) {
        await seek(pendingTimeRef.current)
        onSeekEnd?.(pendingTimeRef.current)
        pendingTimeRef.current = undefined
      }
    }, delay)
  }, [seek, delay, onSeekStart, onSeekEnd])

  // Немедленный seek (для кнопок навигации)
  const immediateSeek = useCallback(async (time: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    pendingTimeRef.current = undefined
    await seek(time)
  }, [seek])

  return { debouncedSeek, immediateSeek }
}
```

2. Использовать в `PlayerControls`:

```typescript
// src/features/video-player/components/player-controls.tsx

export function PlayerControls({ currentTime, file }: PlayerControlsProps) {
  const { seek, isPlaying } = usePlayer()
  const [localDisplayTime, setLocalDisplayTime] = useState(currentTime)

  // Debounced seek для слайдера
  const { debouncedSeek, immediateSeek } = useDebouncedSeek(seek, {
    delay: 100,
    onSeekStart: (time) => setLocalDisplayTime(time), // Мгновенное обновление UI
  })

  // Обработчик изменения слайдера
  const handleTimeChange = useCallback((value: number[]) => {
    const newTime = value[0]
    debouncedSeek(newTime) // Debounced вызов backend
  }, [debouncedSeek])

  // Кнопки навигации (без debounce)
  const handleFrameForward = useCallback(() => {
    const newTime = Math.min(currentTime + (1 / 30), duration)
    immediateSeek(newTime)
  }, [currentTime, duration, immediateSeek])

  // ...
}
```

**Результат:**
- ✅ Плавное перетаскивание слайдера без лагов
- ✅ Снижение нагрузки на IPC в 10-100 раз
- ✅ Мгновенная реакция для кнопок навигации

---

#### 1.3. Добавить обработчики событий на video элемент

**Файлы:**
- `src/features/video-player/components/video-player.tsx`
- `src/features/video-player/hooks/use-video-events.ts` (новый)

**Изменения:**

1. Создать хук `useVideoEvents`:

```typescript
// src/features/video-player/hooks/use-video-events.ts
import { useEffect, RefObject } from 'react'

export interface VideoEventHandlers {
  onPlay?: () => void
  onPause?: () => void
  onSeeking?: () => void
  onSeeked?: () => void
  onEnded?: () => void
  onTimeUpdate?: (time: number) => void
  onDurationChange?: (duration: number) => void
  onError?: (error: Error) => void
}

export function useVideoEvents(
  videoRef: RefObject<HTMLVideoElement>,
  handlers: VideoEventHandlers
) {
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => handlers.onPlay?.()
    const handlePause = () => handlers.onPause?.()
    const handleSeeking = () => handlers.onSeeking?.()
    const handleSeeked = () => handlers.onSeeked?.()
    const handleEnded = () => handlers.onEnded?.()
    const handleTimeUpdate = () => handlers.onTimeUpdate?.(video.currentTime)
    const handleDurationChange = () => handlers.onDurationChange?.(video.duration)
    const handleError = () => handlers.onError?.(new Error(video.error?.message))

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('error', handleError)
    }
  }, [videoRef, handlers])
}
```

2. Интегрировать в `VideoPlayer`:

```typescript
// src/features/video-player/components/video-player.tsx

export function VideoPlayer() {
  const { currentVideo: video, backendSync } = usePlayer()
  const videoRef = useRef<HTMLVideoElement>(null)

  // Синхронизация критичных событий с backend
  useVideoEvents(videoRef, {
    onPlay: () => {
      // Backend уже знает (мы вызвали play()), но можем подтвердить
      console.log('Video started playing')
    },
    onPause: () => {
      console.log('Video paused')
    },
    onEnded: () => {
      // Уведомляем backend о завершении
      backendSync.executeCommand({ type: "PlaybackEnded" })
    },
    onError: (error) => {
      console.error('Video error:', error)
    },
  })

  return (
    <video
      ref={videoRef}
      data-player-video // Для поиска через querySelector
      src={convertVideoSrc(video.path)}
    />
  )
}
```

**Результат:**
- ✅ Синхронизация критичных событий (ended, error)
- ✅ Обработка ошибок воспроизведения
- ✅ Дополнительный source of truth для состояния

---

### Фаза 2: Оптимизации (Приоритет: Средний)

#### 2.1. Оптимизировать синхронизацию ProjectState

**Файлы:**
- `src/features/video-player/services/backend-sync.ts`
- `src-tauri/src/video_player.rs` (backend)

**Изменения:**

1. Добавить delta updates:

```typescript
// src/features/video-player/services/backend-sync.ts

interface StateDelta {
  type: 'player' | 'timeline' | 'media' | 'full'
  changes: Partial<ProjectState>
}

export class BackendSyncService {
  private lastFullSync = 0
  private readonly FULL_SYNC_INTERVAL = 5000 // 5 секунд

  private async fetchAndNotifyState(eventType?: string) {
    const now = performance.now()
    const needsFullSync = now - this.lastFullSync > this.FULL_SYNC_INTERVAL

    if (needsFullSync) {
      // Полная синхронизация раз в 5 секунд
      const state = await this.getProjectState()
      this.notifyStateChange(state)
      this.lastFullSync = now
    } else {
      // Частичная синхронизация только player state
      const delta = await this.getPlayerStateDelta()
      this.notifyDeltaChange(delta)
    }
  }

  private async getPlayerStateDelta(): Promise<StateDelta> {
    const playerState = await AppCommands.getPlayerState()
    return {
      type: 'player',
      changes: { playbackState: playerState }
    }
  }
}
```

**Результат:**
- ✅ Снижение объема передаваемых данных в 10+ раз
- ✅ Быстрее обновления UI
- ✅ Меньше нагрузка на IPC

---

#### 2.2. Добавить очередь команд

**Файлы:**
- `src/features/video-player/services/command-queue.ts` (новый)
- `src/features/video-player/services/backend-sync.ts`

**Изменения:**

1. Создать `CommandQueue`:

```typescript
// src/features/video-player/services/command-queue.ts

export class CommandQueue {
  private queue: Promise<any> = Promise.resolve()
  private isProcessing = false

  async execute<T>(
    command: () => Promise<T>,
    priority: 'high' | 'normal' = 'normal'
  ): Promise<T> {
    if (priority === 'high') {
      // Высокий приоритет - выполнить немедленно
      return command()
    }

    // Добавить в очередь
    const result = this.queue.then(async () => {
      this.isProcessing = true
      try {
        return await command()
      } finally {
        this.isProcessing = false
      }
    })

    // Обновить очередь (не блокировать при ошибках)
    this.queue = result.catch(() => {})

    return result
  }

  async flush(): Promise<void> {
    await this.queue
  }

  get isPending(): boolean {
    return this.isProcessing
  }
}
```

2. Интегрировать в `BackendSyncService`:

```typescript
// src/features/video-player/services/backend-sync.ts

export class BackendSyncService {
  private commandQueue = new CommandQueue()

  async executeCommand(command: PlayerCommand): Promise<void> {
    // Критичные команды - высокий приоритет
    const priority = ['Play', 'Pause', 'Stop'].includes(command.type)
      ? 'high'
      : 'normal'

    return this.commandQueue.execute(
      () => this.executeCommandInternal(command),
      priority
    )
  }
}
```

**Результат:**
- ✅ Гарантированный порядок выполнения команд
- ✅ Нет race conditions
- ✅ Приоритизация критичных команд

---

#### 2.3. Добавить error boundaries и retry logic

**Файлы:**
- `src/features/video-player/components/player-error-boundary.tsx` (новый)
- `src/features/video-player/services/backend-sync.ts`

**Изменения:**

1. Добавить retry logic в `BackendSyncService`:

```typescript
// src/features/video-player/services/backend-sync.ts

export class BackendSyncService {
  private async executeCommandWithRetry(
    command: PlayerCommand,
    maxRetries = 3
  ): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.executeCommandInternal(command)
        return // Успех
      } catch (error) {
        lastError = error as Error
        console.warn(`Command ${command.type} failed (attempt ${attempt + 1}/${maxRetries})`)

        // Exponential backoff
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)))
        }
      }
    }

    // Все попытки провалились
    throw new Error(`Command ${command.type} failed after ${maxRetries} attempts: ${lastError?.message}`)
  }
}
```

**Результат:**
- ✅ Устойчивость к временным сбоям
- ✅ Лучший UX при проблемах с backend
- ✅ Логирование ошибок

---

### Фаза 3: Мониторинг и тестирование (Приоритет: Низкий)

#### 3.1. Добавить performance metrics

**Файлы:**
- `src/features/video-player/services/performance-monitor.ts` (новый)

**Изменения:**

```typescript
// src/features/video-player/services/performance-monitor.ts

export interface PerformanceMetrics {
  avgSyncTime: number
  syncFrequency: number
  commandQueueSize: number
  failedCommands: number
  lastError: string | null
}

export class PerformanceMonitor {
  private metrics = {
    syncTimes: [] as number[],
    lastSync: 0,
    commandCount: 0,
    failureCount: 0,
    lastError: null as string | null,
  }

  recordSync(duration: number) {
    this.metrics.syncTimes.push(duration)
    if (this.metrics.syncTimes.length > 100) {
      this.metrics.syncTimes.shift()
    }
    this.metrics.lastSync = performance.now()
    this.metrics.commandCount++
  }

  recordFailure(error: Error) {
    this.metrics.failureCount++
    this.metrics.lastError = error.message
  }

  getMetrics(): PerformanceMetrics {
    const avgSyncTime = this.metrics.syncTimes.length > 0
      ? this.metrics.syncTimes.reduce((a, b) => a + b, 0) / this.metrics.syncTimes.length
      : 0

    return {
      avgSyncTime,
      syncFrequency: this.metrics.commandCount / ((performance.now() - this.metrics.lastSync) / 1000),
      commandQueueSize: this.metrics.syncTimes.length,
      failedCommands: this.metrics.failureCount,
      lastError: this.metrics.lastError,
    }
  }
}
```

**Результат:**
- ✅ Visibility в производительность синхронизации
- ✅ Обнаружение проблем в продакшене
- ✅ Данные для оптимизаций

---

#### 3.2. Добавить integration тесты

**Файлы:**
- `src/features/video-player/__tests__/playback-sync.integration.test.ts` (новый)

**Тесты:**

```typescript
describe('Playback Synchronization Integration', () => {
  it('должен обновлять currentTime во время воспроизведения', async () => {
    const { result } = renderHook(() => usePlayer())

    // Запускаем воспроизведение
    await act(() => result.current.play())

    const initialTime = result.current.currentTime

    // Ждем 1 секунду
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Время должно обновиться
    expect(result.current.currentTime).toBeGreaterThan(initialTime)
  })

  it('должен синхронизировать время с backend периодически', async () => {
    const mockBackendSync = vi.fn()

    const { result } = renderHook(() => usePlaybackTimeSync({
      isPlaying: true,
      syncInterval: 500,
      onBackendSync: mockBackendSync,
    }))

    // Ждем 1.5 секунды
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Должно быть минимум 2 синхронизации
    expect(mockBackendSync).toHaveBeenCalledTimes(expect.any(Number))
    expect(mockBackendSync.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('должен debounce seek команды', async () => {
    const mockSeek = vi.fn().mockResolvedValue(undefined)
    const { debouncedSeek } = useDebouncedSeek(mockSeek, { delay: 100 })

    // Быстрые seek
    debouncedSeek(1)
    debouncedSeek(2)
    debouncedSeek(3)

    // Сразу после вызовов - ничего не должно произойти
    expect(mockSeek).not.toHaveBeenCalled()

    // Через 150ms - должен вызваться только последний seek
    await new Promise(resolve => setTimeout(resolve, 150))
    expect(mockSeek).toHaveBeenCalledTimes(1)
    expect(mockSeek).toHaveBeenCalledWith(3)
  })
})
```

---

## Миграционный план

### Этап 1: Подготовка (1 день)
- [ ] Создать feature branch `feature/video-player-sync-improvements`
- [ ] Ревью существующего кода
- [ ] Подготовить моки для тестов

### Этап 2: Фаза 1 - Критичные исправления (2-3 дня)
- [ ] Реализовать `usePlaybackTimeSync`
- [ ] Реализовать `useDebouncedSeek`
- [ ] Добавить `useVideoEvents`
- [ ] Интегрировать в `PlayerProvider`
- [ ] Обновить `PlayerControls`
- [ ] Обновить `VideoPlayer`
- [ ] Тестирование базового функционала

### Этап 3: Фаза 2 - Оптимизации (2-3 дня)
- [ ] Реализовать delta updates
- [ ] Реализовать `CommandQueue`
- [ ] Добавить retry logic
- [ ] Тестирование оптимизаций

### Этап 4: Фаза 3 - Мониторинг (1-2 дня)
- [ ] Реализовать `PerformanceMonitor`
- [ ] Добавить integration тесты
- [ ] Добавить e2e тесты (Playwright)

### Этап 5: Финализация (1 день)
- [ ] Code review
- [ ] Документация
- [ ] Merge в main

**Общее время:** 7-10 дней

---

## Метрики успеха

### Performance
- ✅ UI обновляется с частотой 60fps во время playback
- ✅ Задержка UI < 16ms
- ✅ IPC calls снижены с ~60/sec до ~1/sec во время playback
- ✅ Seek debounce снижает команды в 10-100 раз

### Stability
- ✅ Нет race conditions
- ✅ Retry успешно обрабатывает 99% временных сбоев
- ✅ Error boundaries предотвращают крэши

### User Experience
- ✅ Плавный прогресс-бар без рывков
- ✅ Мгновенная реакция на seek
- ✅ Нет задержек при play/pause

---

## Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Рассинхронизация frontend/backend | Средняя | Высокое | Periodic sync + критичные события |
| Performance деградация | Низкая | Среднее | Performance monitoring + тесты |
| Breaking changes для существующего кода | Средняя | Среднее | Постепенная миграция + backward compatibility |
| Ошибки в edge cases | Средняя | Низкое | Extensive testing + error boundaries |

---

## Следующие шаги

1. **Ревью этого плана** с командой
2. **Создать задачи** в issue tracker
3. **Начать с Фазы 1** - критичные исправления
4. **Итеративная разработка** с частыми тестами

---

## Дополнительные материалы

### Ссылки
- [Web Video API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Tauri IPC Performance](https://tauri.app/v1/guides/features/command)

### Примеры из других проектов
- [Video.js](https://github.com/videojs/video.js) - механизм обновления времени
- [Plyr](https://github.com/sampotts/plyr) - event handling
- [React Player](https://github.com/cookpete/react-player) - синхронизация состояния
