# Node.js Adapters Implementation

**Статус:** 📋 Запланировано
**Приоритет:** 🟡 Средний
**Дата создания:** 2025-11-29

## Описание

Создать Node.js реализации всех портов для использования Timeline Studio логики вне Tauri:
- CLI инструменты
- Electron приложение
- Серверный рендеринг
- Headless автоматизация

## Структура

```
src/adapters/node/
├── ai.ts            # NodeAIService
├── backend.ts       # NodeBackendService
├── event.ts         # NodeEventService
├── media.ts         # NodeMediaService
├── platform.ts      # NodePlatformService
├── storage.ts       # NodeStorageService
├── video.ts         # NodeVideoService
├── __tests__/       # Тесты
└── index.ts         # initNodeApp()
```

## Фазы реализации

### Фаза 1: Базовая инфраструктура

- [ ] Создать `src/adapters/node/index.ts` с `initNodeApp()`
- [ ] Настроить package.json для Node.js зависимостей
- [ ] Добавить условный экспорт в `@/adapters`

**Зависимости:**
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2",
    "sharp": "^0.33.0",
    "lowdb": "^7.0.0",
    "onnxruntime-node": "^1.16.0",
    "openai": "^4.0.0",
    "node-notifier": "^10.0.0"
  }
}
```

### Фаза 2: Простые сервисы

#### NodeStorageService
```typescript
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

export class NodeStorageService implements IStorageService {
  private db: Low<Record<string, unknown>>

  async get<T>(key: string): Promise<T | null> {
    await this.db.read()
    return this.db.data[key] as T ?? null
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.db.data[key] = value
    await this.db.write()
  }
}
```

#### NodeEventService
```typescript
import { EventEmitter } from 'events'

export class NodeEventService implements IEventService {
  private emitter = new EventEmitter()

  async listen<T>(event: string, callback: (payload: T) => void): Promise<() => void> {
    this.emitter.on(event, callback)
    return () => this.emitter.off(event, callback)
  }

  async emit(event: string, payload: unknown): Promise<void> {
    this.emitter.emit(event, payload)
  }
}
```

#### NodePlatformService
```typescript
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import notifier from 'node-notifier'

export class NodePlatformService implements IPlatformService {
  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8')
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8')
  }

  async showNotification(title: string, body: string): Promise<void> {
    notifier.notify({ title, message: body })
  }

  // Диалоги - для CLI можно использовать inquirer или readline
  async showOpenDialog(options: OpenDialogOptions): Promise<string[] | null> {
    // В headless режиме возвращаем null или используем args
    return null
  }
}
```

### Фаза 3: Media сервисы

#### NodeMediaService
```typescript
import ffmpeg from 'fluent-ffmpeg'
import sharp from 'sharp'

export class NodeMediaService implements IMediaService {
  async getMetadata(filePath: string): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err)
        else resolve(this.convertMetadata(metadata))
      })
    })
  }

  async generateThumbnail(filePath: string, options: ThumbnailOptions): Promise<string> {
    const outputPath = options.outputPath || `/tmp/thumb_${Date.now()}.jpg`

    await new Promise<void>((resolve, reject) => {
      ffmpeg(filePath)
        .screenshots({
          timestamps: [options.timestamp || 0],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: `${options.width}x${options.height}`
        })
        .on('end', resolve)
        .on('error', reject)
    })

    return outputPath
  }
}
```

#### NodeVideoService
```typescript
import ffmpeg from 'fluent-ffmpeg'

export class NodeVideoService implements IVideoService {
  private activeJobs = new Map<string, ffmpeg.FfmpegCommand>()

  async renderProject(projectSchema: unknown, outputPath: string): Promise<string> {
    const jobId = crypto.randomUUID()
    // Генерация FFmpeg команды из projectSchema
    // ...
    return jobId
  }

  async cancelRender(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (job) {
      job.kill('SIGTERM')
      this.activeJobs.delete(jobId)
      return true
    }
    return false
  }

  async getGpuCapabilities(): Promise<GpuCapabilities> {
    // Проверка доступных GPU encoders через ffmpeg -encoders
    return { /* ... */ }
  }
}
```

### Фаза 4: AI сервисы

#### NodeAIService
```typescript
import OpenAI from 'openai'
import * as ort from 'onnxruntime-node'

export class NodeAIService implements IAIService {
  private openai: OpenAI | null = null
  private yoloSession: ort.InferenceSession | null = null

  // === API Keys ===
  async saveApiKey(provider: string, apiKey: string): Promise<void> {
    // Сохранение в .env или encrypted storage
  }

  // === Whisper OpenAI ===
  async whisperTranscribeOpenAI(audioPath: string, options?: WhisperOptions): Promise<TranscriptionResult> {
    if (!this.openai) throw new Error('OpenAI not configured')

    const file = await fs.readFile(audioPath)
    const response = await this.openai.audio.transcriptions.create({
      file: new File([file], path.basename(audioPath)),
      model: options?.model || 'whisper-1',
      language: options?.language,
    })

    return {
      text: response.text,
      segments: [], // OpenAI API не возвращает segments в базовом режиме
      language: options?.language || 'auto',
      processingTime: 0,
    }
  }

  // === YOLO Detection ===
  async initYOLOProcessor(modelPath?: string): Promise<string> {
    const processorId = crypto.randomUUID()
    this.yoloSession = await ort.InferenceSession.create(modelPath || './models/yolov8n.onnx')
    return processorId
  }

  async detectObjectsInImage(processorId: string, imagePath: string): Promise<YOLODetectionResult> {
    // Загрузка изображения через sharp, inference через onnxruntime
    // ...
  }
}
```

### Фаза 5: Backend сервис

#### NodeBackendService
```typescript
export class NodeBackendService implements IBackendService {
  private projectState: ProjectState | null = null

  async connect(): Promise<void> {
    // Инициализация (проверка FFmpeg, создание temp директорий)
    await this.checkDependencies()
  }

  async disconnect(): Promise<void> {
    // Cleanup
  }

  async executeCommand(command: ProjectCommand): Promise<CommandResult> {
    // Обработка команд проекта
    switch (command.type) {
      case 'save':
        return this.saveProject(command.payload)
      case 'load':
        return this.loadProject(command.payload)
      // ...
    }
  }

  async getProjectState(): Promise<ProjectState | null> {
    return this.projectState
  }

  private async checkDependencies(): Promise<void> {
    // Проверка ffmpeg, ffprobe
    await execAsync('ffmpeg -version')
    await execAsync('ffprobe -version')
  }
}
```

### Фаза 6: CLI приложение

```typescript
// src/cli/index.ts
import { initNodeApp } from '@/adapters/node'
import { getMedia, getVideo, getAI } from '@/core/container'
import { Command } from 'commander'

const program = new Command()

program
  .name('timeline-studio')
  .description('Timeline Studio CLI')
  .version('1.0.0')

program
  .command('info <file>')
  .description('Get media file info')
  .action(async (file) => {
    await initNodeApp()
    const metadata = await getMedia().getMetadata(file)
    console.log(JSON.stringify(metadata, null, 2))
  })

program
  .command('transcribe <file>')
  .description('Transcribe audio/video')
  .option('-m, --model <model>', 'Whisper model', 'base')
  .option('-l, --language <lang>', 'Language code')
  .action(async (file, options) => {
    await initNodeApp()
    const result = await getAI().whisperTranscribeLocal(file, {
      model: options.model,
      language: options.language,
    })
    console.log(result.text)
  })

program
  .command('render <project> <output>')
  .description('Render project to video')
  .action(async (project, output) => {
    await initNodeApp()
    const schema = JSON.parse(await fs.readFile(project, 'utf-8'))
    const jobId = await getVideo().renderProject(schema, output)
    console.log(`Render started: ${jobId}`)
  })

program.parse()
```

## Тестирование

```typescript
// src/adapters/node/__tests__/media.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { NodeMediaService } from '../media'

describe('NodeMediaService', () => {
  let service: NodeMediaService

  beforeAll(() => {
    service = new NodeMediaService()
  })

  it('should get video metadata', async () => {
    const metadata = await service.getMetadata('./test-fixtures/sample.mp4')
    expect(metadata.duration).toBeGreaterThan(0)
    expect(metadata.width).toBeGreaterThan(0)
  })

  it('should generate thumbnail', async () => {
    const path = await service.generateThumbnail('./test-fixtures/sample.mp4', {
      timestamp: 1,
      width: 320,
      height: 180,
    })
    expect(path).toMatch(/\.jpg$/)
  })
})
```

## Критерии успеха

- [ ] Все 7 портов реализованы для Node.js
- [ ] `initNodeApp()` инициализирует все сервисы
- [ ] CLI работает: info, transcribe, render
- [ ] Тесты проходят
- [ ] Документация обновлена

## Use Cases

### 1. CLI инструмент
```bash
npx timeline-studio info video.mp4
npx timeline-studio transcribe video.mp4 -l ru
npx timeline-studio render project.json output.mp4
```

### 2. Серверный рендеринг
```typescript
import { initNodeApp } from '@/adapters/node'
import { getVideo } from '@/core/container'

app.post('/render', async (req, res) => {
  await initNodeApp()
  const jobId = await getVideo().renderProject(req.body.schema, '/tmp/output.mp4')
  res.json({ jobId })
})
```

### 3. Batch processing
```typescript
import { initNodeApp } from '@/adapters/node'
import { getAI } from '@/core/container'

await initNodeApp()

for (const file of videoFiles) {
  const result = await getAI().aiDirectorAnalyzeComprehensive(file)
  await saveAnalysis(file, result)
}
```

## Зависимости от других задач

- ✅ Ports & Adapters архитектура (завершено)
- ✅ IVideoService и IAIService порты (завершено)

---

*Создано: 2025-11-29*
