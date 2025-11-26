# Preview Module - WebGL2 Preview System

Высокопроизводительная система превью Timeline Studio на основе WebGL2, обеспечивающая реалтайм рендеринг видео с эффектами.

**🌐 Languages:** [English](./README.md) | [Русский](./README.ru.md)

## 🚀 Особенности

- **WebGL2 Rendering**: Ускоренный рендеринг с использованием GPU
- **Real-time Effects**: Применение эффектов в реальном времени
- **Smart Caching**: Интеллектуальное кэширование кадров
- **Quality Scaling**: Автоматическая адаптация качества под GPU
- **Frame Extraction**: Извлечение кадров из видео
- **Timeline Integration**: Тесная интеграция с системой таймлайна

## API (Backend Commands)

Этот модуль работает полностью на фронтенде и не использует команды Tauri backend. Вся обработка видео и применение эффектов выполняются на стороне клиента с использованием WebGL2 для GPU-ускоренного рендеринга.

## 📁 Структура

```
src/features/preview/
├── hooks/
│   ├── use-webgl2-preview.ts     # Основной хук для WebGL2 превью
│   └── use-preview-cache.ts      # Хук для управления кэшем
├── services/
│   ├── webgl2-preview-renderer.ts # WebGL2 рендерер превью
│   ├── preview-cache.ts          # Система кэширования кадров
│   └── frame-extractor.ts        # Извлечение кадров из видео
├── components/
│   ├── preview-canvas.tsx        # Canvas компонент для превью
│   ├── preview-controls.tsx      # Элементы управления превью
│   └── quality-settings.tsx      # Настройки качества
├── types/
│   └── preview.ts               # TypeScript типы
└── utils/
    └── preview-utils.ts         # Утилиты превью
```

## 🏗️ Архитектура

### WebGL2PreviewRenderer

Основной рендерер, построенный на базе унифицированной WebGL2 библиотеки:

```typescript
import { WebGL2PreviewRenderer } from '@/features/preview/services'

const renderer = new WebGL2PreviewRenderer({
  name: 'timeline-preview',
  canvas: canvasElement,
  antialias: true
})

// Инициализация
await renderer.initialize()

// Установка видео источника
renderer.setVideoSource(videoElement)

// Установка сегментов таймлайна
renderer.setSegments(timelineSegments)

// Рендеринг кадра
renderer.setCurrentTime(5.5)
renderer.render(deltaTime)

// Захват кадра
const frame = await renderer.captureFrame()
```

### useWebGL2Preview Hook

React хук для интеграции WebGL2 превью в компоненты:

```typescript
import { useWebGL2Preview } from '@/features/preview/hooks'

function PreviewComponent() {
  const {
    canvasRef,
    videoRef,
    previewFrame,
    isInitialized,
    gpuTier,
    quality,
    setQuality,
    cacheStats
  } = useWebGL2Preview({
    cacheSize: 100, // MB
    prefetchRange: 2, // seconds
    updateInterval: 33 // ~30fps
  })

  return (
    <div>
      <canvas ref={canvasRef} />
      <video ref={videoRef} style={{ display: 'none' }} />
      
      {isInitialized && (
        <div>
          GPU Tier: {gpuTier}
          Cache: {cacheStats?.entries} entries ({cacheStats?.sizeMB}MB)
        </div>
      )}
    </div>
  )
}
```

### PreviewCache

Интеллектуальная система кэширования кадров:

```typescript
import { PreviewCache } from '@/features/preview/services'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('PreviewCache')
const cache = new PreviewCache(100) // 100MB limit

// Получение или вычисление кадра
const frame = await cache.getOrCompute(
  currentTime,
  activeEffects,
  async () => {
    // Функция рендеринга кадра
    return await renderFrame(currentTime, activeEffects)
  }
)

// Предзагрузка кадров
await cache.prefetch(
  currentTime,
  prefetchRange,
  fps,
  effects,
  renderFunction
)

// Статистика кэша
const stats = cache.getStats()
logger.debugSync('Cache statistics', { entries: stats.entries, sizeMB: stats.sizeMB })
```

## 🚀 Быстрый старт

### 1. Базовая настройка

```typescript
import { useWebGL2Preview } from '@/features/preview/hooks'
import { useTimeline } from '@/features/timeline/hooks'
import { usePlayer } from '@/features/video-player'

function VideoPreview() {
  const timeline = useTimeline()
  const player = usePlayer()
  
  const {
    canvasRef,
    videoRef,
    previewFrame,
    isInitialized,
    quality,
    setQuality
  } = useWebGL2Preview()

  // Автоматическая синхронизация с плеером
  useEffect(() => {
    if (player.currentVideo && videoRef.current) {
      videoRef.current.src = player.currentVideo.path
    }
  }, [player.currentVideo, videoRef])

  return (
    <div className="preview-container">
      <canvas 
        ref={canvasRef}
        width={1920}
        height={1080}
        style={{ width: '100%', height: 'auto' }}
      />
      
      <video 
        ref={videoRef}
        muted
        style={{ display: 'none' }}
      />
      
      {!isInitialized && <div>Initializing WebGL2...</div>}
    </div>
  )
}
```

### 2. Настройка качества

```typescript
// Автоматическая адаптация под GPU
const { gpuTier, quality, setQuality } = useWebGL2Preview()

useEffect(() => {
  // Кастомные настройки качества
  if (gpuTier === 'high') {
    setQuality({
      resolution: 1.0,
      effects: 'all',
      fps: 30,
      antialiasing: true
    })
  } else if (gpuTier === 'low') {
    setQuality({
      resolution: 0.5,
      effects: 'basic',
      fps: 15,
      antialiasing: false
    })
  }
}, [gpuTier, setQuality])
```

### 3. Интеграция эффектов

```typescript
import { useUnifiedEffects } from '@/features/effects/hooks'

function EffectsPreview() {
  const { activeEffects } = useUnifiedEffects()
  const { previewFrame, isInitialized } = useWebGL2Preview()

  // Эффекты автоматически применяются через timeline integration
  return (
    <div>
      <canvas ref={canvasRef} />
      
      <div className="effects-info">
        Active Effects: {activeEffects.length}
        {activeEffects.map(effect => (
          <div key={effect.id}>{effect.name}</div>
        ))}
      </div>
    </div>
  )
}
```

## 🎛️ Настройки качества

Система автоматически адаптирует качество на основе производительности GPU:

### GPU Tiers

- **High**: Modern gaming GPUs (GTX 1060+, RTX series, M1 Pro+)
  ```typescript
  {
    resolution: 1.0,     // Full resolution
    effects: "all",      // All effects enabled
    fps: 30,            // 30 FPS target
    antialiasing: true   // MSAA enabled
  }
  ```

- **Medium**: Mid-range GPUs (GTX 750+, integrated high-end)
  ```typescript
  {
    resolution: 0.75,    // 75% resolution
    effects: "all",      // All effects enabled
    fps: 24,            // 24 FPS target
    antialiasing: true   // MSAA enabled
  }
  ```

- **Low**: Older or low-end GPUs
  ```typescript
  {
    resolution: 0.5,     // 50% resolution
    effects: "basic",    // Only basic effects
    fps: 15,            // 15 FPS target
    antialiasing: false  // No antialiasing
  }
  ```

### Кастомные настройки

```typescript
const customQuality = {
  resolution: 0.8,        // 80% разрешения
  effects: "essential",   // Только важные эффекты
  fps: 25,               // 25 FPS
  antialiasing: true,    // Включить сглаживание
  maxTextures: 8,        // Лимит текстур
  shaderComplexity: "medium" // Сложность шейдеров
}

setQuality(customQuality)
```

## 📊 Мониторинг производительности

### Cache Statistics

```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('CacheStats')
const { cacheStats } = useWebGL2Preview()

logger.debugSync('Cache Stats:', {
  entries: cacheStats.entries,        // Количество кэшированных кадров
  sizeMB: cacheStats.sizeMB,         // Размер кэша в MB
  hitRate: cacheStats.hitRate,       // Коэффициент попаданий
  averageRenderTime: cacheStats.avgRenderTime // Среднее время рендеринга
})
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@/features/preview/utils'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

const monitor = new PerformanceMonitor()

monitor.on('frameRendered', (stats) => {
  logger.debugSync(`Frame rendered in ${stats.renderTime}ms`)
  
  if (stats.renderTime > 33) { // Больше 33ms = менее 30 FPS
    logger.warnSync('Frame drop detected, consider reducing quality')
  }
})
```

## 🔄 Интеграция с Timeline

Preview модуль тесно интегрирован с системой таймлайна:

```typescript
// Автоматическая синхронизация с timeline
const timeline = useTimeline()
const player = usePlayer()

const {
  canvasRef,
  previewFrame
} = useWebGL2Preview()

// Превью автоматически обновляется при:
// - Изменении текущего времени
// - Добавлении/удалении эффектов
// - Изменении сегментов таймлайна
// - Переключении медиа файлов
```

## 🎨 Поддерживаемые эффекты

Preview система поддерживает все эффекты из unified effects system:

- **Color Correction**: Brightness, Contrast, Saturation, Hue
- **Color Grading**: Lift/Gamma/Gain, Color Wheels
- **Blur & Sharpen**: Gaussian Blur, Motion Blur, Unsharp Mask
- **Stylize**: Vintage, Film Emulation, Cartoon
- **Transform**: Scale, Rotate, Position, Crop
- **Temporal**: Stabilization, Speed Ramping

```typescript
// Применение эффектов происходит через timeline
const effectChain = [
  { type: 'colorCorrection', params: { brightness: 1.2 } },
  { type: 'gaussianBlur', params: { radius: 2.0 } },
  { type: 'vintage', params: { intensity: 0.8 } }
]

// Эффекты автоматически применяются в превью
```

## 🧪 Тестирование

Запуск тестов:
```bash
bun run test src/features/preview/__tests__/
```

Тесты покрывают:
- ✅ WebGL2PreviewRenderer functionality
- ✅ useWebGL2Preview hook behavior
- ✅ PreviewCache operations
- ✅ Quality adaptation logic
- ✅ Timeline integration
- ✅ Effect application

## 🔧 Troubleshooting

### Общие проблемы

**WebGL2 не поддерживается:**
```typescript
if (!isInitialized) {
  return <div>Your browser doesn't support WebGL2</div>
}
```

**Низкая производительность:**
```typescript
// Принудительно снизить качество
setQuality({
  resolution: 0.5,
  effects: 'none',
  fps: 15,
  antialiasing: false
})
```

**Проблемы с видео:**
```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('VideoCheck')

// Проверить поддержку формата
const video = videoRef.current
if (video.readyState < 2) {
  logger.warnSync('Video not ready for processing')
}
```

## 📚 API Reference

### useWebGL2Preview Options
```typescript
interface UseWebGL2PreviewOptions {
  cacheSize?: number        // Размер кэша в MB (default: 100)
  prefetchRange?: number    // Диапазон предзагрузки в секундах (default: 2)
  updateInterval?: number   // Интервал обновления в ms (default: 33)
}
```

### PreviewQuality
```typescript
interface PreviewQuality {
  resolution: number        // 0.1 - 1.0
  effects: 'none' | 'basic' | 'all'
  fps: number              // Target FPS
  antialiasing: boolean    // Enable MSAA
}
```

### PreviewFrame
```typescript
interface PreviewFrame {
  bitmap: ImageBitmap      // Rendered frame
  width: number           // Frame width
  height: number          // Frame height
  timestamp: number       // Time in seconds
}
```

## 🔄 Миграция

Если вы обновляете с старой preview системы, см. [руководство по миграции WebGL](../../docs/05_development/webgl-migration-guide.md).

## 🤝 Вклад в развитие

При добавлении новых возможностей:
1. Следуйте архитектуре WebGL2 библиотеки
2. Обеспечьте совместимость с timeline
3. Добавляйте тесты для новых функций
4. Обновляйте документацию

## 📄 Лицензия

Часть Timeline Studio - см. корневую лицензию проекта.