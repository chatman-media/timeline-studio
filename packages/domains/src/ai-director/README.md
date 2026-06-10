# AI Director Domain

Централизованная интеграция с AI Director для комплексного анализа видео и аудио контента в Timeline Studio.

## Quick Start

```typescript
import {
  aiDirectorService,
  useAIDirectorEvents,
  aiDirectorMachine
} from "@/domains/ai-director"

function MyComponent() {
  // Comprehensive анализ через singleton service
  const handleAnalyze = async () => {
    const result = await aiDirectorService.analyzeComprehensive(videoPath, {
      performance_mode: "balanced",
      enable_audio_analysis: true,
      enable_video_analysis: true
    })
    console.log("Analysis complete:", result)
  }

  // Подписка на события анализа
  const { lastProgress, errors } = useAIDirectorEvents({
    onAnalysisProgress: (progress) => {
      console.log(`${progress.stage}: ${progress.progress * 100}%`)
    },
    onAnalysisCompleted: (result) => {
      console.log("Completed:", result)
    }
  })

  return (
    <div>
      <button onClick={handleAnalyze}>Analyze Video</button>
      {lastProgress && <ProgressBar value={lastProgress.progress} />}
    </div>
  )
}
```

## Public API

### Services
| Service | Purpose |
|---------|---------|
| `aiDirectorService` | Singleton service для всех операций AI Director |

### Hooks
| Hook | Purpose |
|------|---------|
| `useAIDirectorEvents()` | Подписка на Tauri события AI Director |

### State Machines
| Machine | Purpose |
|---------|---------|
| `aiDirectorMachine` | XState машина для управления состоянием AI Director |

### Types
| Type | Description |
|------|-------------|
| `AIDirectorConfig` | Конфигурация анализа |
| `ComprehensiveAnalysisResult` | Результат comprehensive анализа |
| `SystemCapabilities` | Доступные возможности системы |
| `HealthCheckResult` | Статус здоровья сервисов |
| `AnalysisProgress` | Прогресс выполнения анализа |
| `AnalysisError` | Ошибка анализа |

## Key Features

- **Comprehensive Analysis** - Полный анализ видео через единый вызов
- **Audio Analysis** - Unified аудио анализ (FFmpeg + Montage + Transcription)
- **Video Analysis** - Детекция объектов, лиц, эмоций, композиция
- **Batch Processing** - Пакетный анализ нескольких файлов
- **Performance Modes** - Fast / Balanced / Quality режимы
- **Event-Driven** - Real-time события от Rust backend
- **Health Monitoring** - Проверка доступности сервисов
- **Configuration Validation** - Валидация конфигураций перед запуском

## AI Capabilities

| Capability | Backend | Description |
|------------|---------|-------------|
| Scene Detection | FFmpeg | Автоматическая сегментация на сцены |
| Object Detection | YOLO | Распознавание объектов в кадрах |
| Face Detection | RetinaFace | Детекция лиц с landmarks |
| Face Recognition | FaceNet | Идентификация персон |
| Audio Analysis | FFmpeg | Громкость, темп, тишина |
| Transcription | Whisper | Speech-to-text (опционально) |
| Quality Analysis | AI Director | Оценка качества видео/аудио |
| Emotion Analysis | AI Director | Анализ эмоций на лицах |
| Composition | AI Director | Анализ композиции кадра |

## Architecture Pattern

**Singleton Service Pattern** - В отличие от ai-services (Orchestrator), ai-director использует паттерн singleton service:

```typescript
// ✅ Правильно - singleton instance
const result = await aiDirectorService.analyzeComprehensive(videoPath)

// ❌ Неправильно - не создавайте new AIDirectorService()
const service = new AIDirectorService() // TypeScript ошибка!
```

### Почему Singleton?

1. **Прямая интеграция** - Напрямую вызывает Tauri команды без слоя оркестрации
2. **Простота** - Один точка входа для всех операций
3. **Stateless** - Не хранит состояние между вызовами
4. **XState Machine** - Состояние управляется через aiDirectorMachine

## Dependencies

**Internal:**
- `@/lib/tauri-logger` - Структурированное логирование
- `xstate` v5 - State machines

**External:**
- `@tauri-apps/api` - Tauri IPC bridge

**Rust Backend:**
- `ai-director` - Comprehensive анализ
- `ffmpeg` - Видео/аудио обработка
- `onnxruntime` - YOLO, RetinaFace, FaceNet
- `whisper` - Транскрипция (опционально)

## Testing

```bash
# Unit tests
bun run test src/domains/ai-director/__tests__/

# Integration tests (require Tauri)
bun run test:e2e:tauri
```

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Полное описание всех методов и типов |
| [Architecture](./docs/ARCHITECTURE.md) | Архитектура, диаграммы, design decisions |
| [Changelog](./docs/CHANGELOG.md) | История изменений домена |

## Related Domains

- **ai-services** - Orchestrator для координации AI Director + Montage Planner
- **media-management** - Медиа файлы и метаданные
- **shared/events** - Domain Event Bus

## Examples

### Quick Analysis

```typescript
import { aiDirectorService } from "@/domains/ai-director"

// Быстрый анализ (preset конфигурация)
const result = await aiDirectorService.analyzeQuick(videoPath)
console.log("Scenes:", result.scene_analysis?.scenes.length)
```

### Custom Configuration

```typescript
import { aiDirectorService } from "@/domains/ai-director"

// Получить default конфигурацию
const config = await aiDirectorService.getDefaultConfig("quality")

// Кастомизировать
config.enable_transcription = true
config.timeout_seconds = 300

// Валидировать
const validation = await aiDirectorService.validateConfig(config)
if (!validation.is_valid) {
  console.error("Invalid config:", validation.errors)
  return
}

// Запустить анализ
const result = await aiDirectorService.analyzeComprehensive(videoPath, config)
```

### Batch Analysis

```typescript
import { aiDirectorService } from "@/domains/ai-director"

const videoPaths = ["/path/to/video1.mp4", "/path/to/video2.mp4"]
const results = await aiDirectorService.analyzeBatch(videoPaths, {
  performance_mode: "fast",
  enable_audio_analysis: true,
  enable_video_analysis: false // только аудио
})

results.forEach((result, index) => {
  console.log(`Video ${index + 1}:`, result.audio_analysis)
})
```

### Audio-Only Analysis

```typescript
import { aiDirectorService } from "@/domains/ai-director"

const audioAnalysis = await aiDirectorService.analyzeAudioComprehensive(videoPath, {
  enableFFmpeg: true,
  enableMontage: true,
  enableTranscription: true,
  performanceMode: "balanced"
})

console.log("Duration:", audioAnalysis.duration)
console.log("Loudness:", audioAnalysis.loudness)
console.log("Transcription:", audioAnalysis.transcription)
```

### System Status

```typescript
import { aiDirectorService } from "@/domains/ai-director"

// Проверка доступности
const isAvailable = await aiDirectorService.checkAvailability()
if (!isAvailable) {
  console.error("AI Director not available")
  return
}

// Полный системный статус
const status = await aiDirectorService.getSystemStatus()
console.log("Capabilities:", status.capabilities)
console.log("Health:", status.health)
console.log("Audio Capabilities:", status.audioCapabilities)
```

### Event Monitoring

```typescript
import { useAIDirectorEvents } from "@/domains/ai-director"

function AnalysisMonitor() {
  const { lastProgress, lastError, errors, clearErrors } = useAIDirectorEvents({
    onAnalysisStarted: (event) => {
      console.log("Started:", event.analysisId)
    },
    onAnalysisProgress: (progress) => {
      console.log(`${progress.stage}: ${(progress.progress * 100).toFixed(1)}%`)
    },
    onAnalysisStageCompleted: (stage) => {
      console.log(`Stage ${stage.stage} completed in ${stage.duration_ms}ms`)
    },
    onAnalysisCompleted: (result) => {
      console.log("Analysis complete:", result)
    },
    onAnalysisError: (error) => {
      console.error(`Error in ${error.stage}:`, error.error)
    }
  })

  return (
    <div>
      {lastProgress && (
        <div>
          <p>Stage: {lastProgress.stage}</p>
          <ProgressBar value={lastProgress.progress * 100} />
          {lastProgress.estimatedTimeRemaining && (
            <p>ETA: {lastProgress.estimatedTimeRemaining}s</p>
          )}
        </div>
      )}
      {errors.length > 0 && (
        <div>
          <h3>Errors ({errors.length})</h3>
          <button onClick={clearErrors}>Clear</button>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error.stage}: {error.error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```
