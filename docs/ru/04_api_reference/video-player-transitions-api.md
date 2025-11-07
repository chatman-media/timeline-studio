# API предпросмотра переходов в VideoPlayer

## Обзор

Система предпросмотра переходов в VideoPlayer обеспечивает реалтайм рендеринг переходов между клипами с использованием WebGL2.

## Основные компоненты

### VideoPlayerWithTransitions

Расширенный VideoPlayer с поддержкой предпросмотра переходов.

```typescript
interface VideoPlayerWithTransitionsProps {
  className?: string
  showTransitionOverlay?: boolean      // Показывать подробную информацию
  showMiniIndicator?: boolean          // Показывать мини-индикатор
  enableTransitionPreview?: boolean    // Включить предпросмотр
}

<VideoPlayerWithTransitions
  enableTransitionPreview={true}
  showTransitionOverlay={true}
  showMiniIndicator={true}
/>
```

### useTransitionPreview Hook

Хук для управления предпросмотром переходов.

```typescript
const {
  state,              // Текущее состояние перехода
  renderTransition,   // Функция рендеринга
  isTransitionActive, // Проверка активности
  startPreview,       // Запуск предпросмотра
  stopPreview,        // Остановка предпросмотра
  seekToTime,         // Перемотка к времени
} = useTransitionPreview({
  enablePreview: true,
  autoPlay: false,
  loop: false,
})
```

### TransitionPreviewState

```typescript
interface TransitionPreviewState {
  activeTransition: TimelineTransition | null  // Активный переход
  progress: number                             // Прогресс (0-1)
  isPlaying: boolean                          // Воспроизводится ли
  startTime: number                           // Время начала
  endTime: number                             // Время окончания
}
```

## Компоненты UI

### TransitionPlayerOverlay

Подробная информация о переходе поверх видео.

```typescript
<TransitionPlayerOverlay
  transition={activeTransition}
  progress={0.5}
  onClose={() => setShowOverlay(false)}
  compact={false}  // false = полная информация, true = компактно
/>
```

### TransitionMiniIndicator

Компактный индикатор активного перехода.

```typescript
<TransitionMiniIndicator
  transition={activeTransition}
  progress={0.3}
/>
```

### TransitionPreviewSettings

Панель настроек предпросмотра.

```typescript
<TransitionPreviewSettings
  isEnabled={true}
  onEnabledChange={setEnabled}
  showOverlay={true}
  onShowOverlayChange={setShowOverlay}
  showMiniIndicator={true}
  onShowMiniIndicatorChange={setShowMiniIndicator}
  quality={100}
  onQualityChange={setQuality}
/>
```

## Интеграция с TransitionsPreviewService

### WebGL2 Rendering

Система использует существующий `TransitionsPreviewService` для рендеринга:

```typescript
// Автоматически используется внутри компонентов
const transitionService = getTransitionsPreviewService()

// Рендеринг перехода
const success = transitionService.applyTransition(
  videoElementA,      // Исходное видео
  videoElementB,      // Целевое видео  
  'fade',            // Тип перехода
  {
    duration: 2.0,
    progress: 0.5,
    easingFunction: 'easeInOut',
    direction: 'forward',
    customParams: { intensity: 1.0 }
  },
  outputCanvas       // Canvas для результата
)
```

### Поддерживаемые переходы

- **Fade**: Плавное затухание
- **Dissolve**: Растворение с шумом
- **Wipe Left/Right/Up/Down**: Вытеснение по направлениям
- **Slide**: Скольжение
- **Zoom In/Out**: Масштабирование
- **Rotate**: Поворот
- **Circle Wipe**: Круговое вытеснение
- **Pixelate**: Пикселизация

## Алгоритм работы

### 1. Обнаружение активных переходов

```typescript
// useTransitionPreview автоматически отслеживает timeline
const activeTransition = getTransitionAtTime(currentTime)

if (activeTransition) {
  const progress = (currentTime - transition.position) / transition.duration
  // Применяем переход
}
```

### 2. Рендеринг в реальном времени

```typescript
useEffect(() => {
  if (activeTransition && videoA && videoB && canvas) {
    // Синхронизируем видео с текущим временем
    videoA.currentTime = getClipTimeAtPosition(currentTime)
    videoB.currentTime = getNextClipTimeAtPosition(currentTime)
    
    // Рендерим переход
    renderTransition(videoA, videoB, canvas)
  }
}, [currentTime, activeTransition])
```

### 3. Переключение видимости

- **Без перехода**: Показывается основное видео
- **С переходом**: Показывается canvas с рендером перехода
- **Плавное переключение** между режимами

## Производительность

### Оптимизации

1. **Ленивая инициализация** WebGL контекста
2. **Кэширование** скомпилированных шейдеров
3. **Переиспользование** текстур и буферов
4. **Настройка качества** рендеринга (25%, 50%, 75%, 100%)

### Системные требования

- **WebGL2** поддержка
- **Современный GPU** для плавного рендеринга
- **Достаточная память** для текстур видео

## Примеры использования

### Базовый предпросмотр

```typescript
function VideoPlayerExample() {
  return (
    <VideoPlayerWithTransitions
      enableTransitionPreview={true}
      showMiniIndicator={true}
    />
  )
}
```

### С настройками

```typescript
function AdvancedVideoPlayer() {
  const [showSettings, setShowSettings] = useState(false)
  const [previewEnabled, setPreviewEnabled] = useState(true)
  
  return (
    <div className="relative">
      <VideoPlayerWithTransitions
        enableTransitionPreview={previewEnabled}
        showTransitionOverlay={showSettings}
      />
      
      <div className="absolute top-4 right-4">
        <TransitionPreviewSettings
          isEnabled={previewEnabled}
          onEnabledChange={setPreviewEnabled}
          // ... другие настройки
        />
      </div>
    </div>
  )
}
```

### Интеграция с timeline

```typescript
function TimelineIntegratedPlayer() {
  const { currentTime } = useTimeline()
  const activeTransition = useActiveTransition()
  
  return (
    <div>
      <VideoPlayerWithTransitions
        enableTransitionPreview={!!activeTransition}
        showMiniIndicator={true}
      />
      
      {activeTransition && (
        <TransitionPreviewStatus
          isEnabled={true}
          hasActiveTransition={true}
          transitionName={activeTransition.transition.transitionId}
        />
      )}
    </div>
  )
}
```

## События и callbacks

### Управление состоянием

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TransitionPreview')

const transitionPreview = useTransitionPreview({
  enablePreview: true,
  onTransitionStart: (transition) => {
    logger.infoSync('Transition started', { transitionId: transition.id })
  },
  onTransitionEnd: (transition) => {
    logger.infoSync('Transition completed', { transitionId: transition.id })
  }
})

// Программное управление
transitionPreview.startPreview()    // Запуск анимации
transitionPreview.stopPreview()     // Остановка
transitionPreview.seekToTime(5.0)   // Перемотка
```

## Отладка и мониторинг

### Информация о производительности

```typescript
// В режиме разработки
const debugInfo = {
  webglSupported: !!gl,
  activeShaders: transitionService.getLoadedShaders(),
  renderTime: performance.now() - startTime,
  memoryUsage: gl.getParameter(gl.RENDERER)
}
```

### Консольные команды

```javascript
// В DevTools консоли
window.transitionDebug = {
  service: getTransitionsPreviewService(),
  enableLogging: true,
  showFPS: true
}
```

## Ограничения

1. **WebGL2** требуется для работы
2. **Один активный переход** в момент времени
3. **Синхронизация** с video элементами может иметь задержки
4. **Качество** зависит от производительности GPU

## Будущие улучшения

1. **Кэширование** рендеров переходов
2. **Предзагрузка** соседних кадров
3. **Множественные переходы** одновременно
4. **Кастомные шейдеры** пользователя
5. **Export preview** в видеофайл