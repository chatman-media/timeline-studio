# Subtitles Domain - API Reference

## Table of Contents

- [SubtitleService](#subtitleservice)
- [Tauri Commands](#tauri-commands)
- [Types](#types)

---

## SubtitleService

Singleton сервис для работы с субтитрами. Все операции проходят через Tauri backend для максимальной производительности.

### Получение Instance

```typescript
import { subtitleService, SubtitleService } from "@/domains/subtitles"

// Использование singleton (рекомендуется)
const result = await subtitleService.importSubtitleFile(path)

// Или получение instance вручную
const service = SubtitleService.getInstance()
```

---

### importSubtitleFile()

Импорт файла субтитров с диска.

```typescript
async function importSubtitleFile(filePath: string): Promise<SubtitleImportResult>
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | Absolute path to subtitle file (SRT, VTT, ASS, SSA) |

**Returns:** `Promise<SubtitleImportResult>`
| Field | Type | Description |
|-------|------|-------------|
| `content` | `string` | Raw subtitle file content |
| `format` | `string` | Detected format (srt/vtt/ass/ssa) |
| `file_name` | `string` | File name without path |

**Example:**

```typescript
import { subtitleService } from "@/domains/subtitles"

async function loadSubtitles() {
  try {
    const result = await subtitleService.importSubtitleFile("/videos/movie.srt")

    console.log("File name:", result.file_name)    // "movie.srt"
    console.log("Format:", result.format)          // "srt"
    console.log("Content length:", result.content.length)

    // Parse subtitle content (using external parser)
    const subtitles = parseSRT(result.content)

  } catch (error) {
    console.error("Failed to import subtitles:", error)
  }
}
```

---

### analyzeAudioForSync()

Анализ аудио для синхронизации субтитров. Обнаруживает пики громкости, которые можно использовать для выравнивания тайминга субтитров.

```typescript
async function analyzeAudioForSync(
  audioPath: string,
  options?: AudioAnalysisOptions
): Promise<AudioPeaksResult>
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `audioPath` | `string` | Path to audio/video file |
| `options` | `AudioAnalysisOptions?` | Analysis configuration (optional) |

**AudioAnalysisOptions:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `windowSize` | `number?` | `1024` | FFT window size for analysis |
| `hopSize` | `number?` | `512` | Step size between analysis windows |
| `threshold` | `number?` | `0.5` | Amplitude threshold (0.0-1.0) |

**Returns:** `Promise<AudioPeaksResult>`
| Field | Type | Description |
|-------|------|-------------|
| `peaks` | `Array<{time: number, amplitude: number}>` | Detected audio peaks |
| `sample_rate` | `number` | Audio sample rate (Hz) |
| `duration` | `number` | Total audio duration (seconds) |

**Example:**

```typescript
import { subtitleService } from "@/domains/subtitles"

async function syncSubtitles(videoPath: string, subtitlePath: string) {
  // 1. Import subtitles
  const subtitles = await subtitleService.importSubtitleFile(subtitlePath)

  // 2. Analyze audio peaks
  const audioAnalysis = await subtitleService.analyzeAudioForSync(videoPath, {
    windowSize: 2048,  // Larger window = more precise low frequencies
    hopSize: 512,      // Smaller hop = more resolution
    threshold: 0.6     // Higher threshold = only strong peaks
  })

  console.log("Audio duration:", audioAnalysis.duration, "seconds")
  console.log("Sample rate:", audioAnalysis.sample_rate, "Hz")
  console.log("Peaks found:", audioAnalysis.peaks.length)

  // 3. Find alignment between subtitle timing and audio peaks
  const alignment = findBestAlignment(
    parsedSubtitles,
    audioAnalysis.peaks
  )

  // 4. Apply offset to subtitles
  const syncedSubtitles = applyTimingOffset(parsedSubtitles, alignment.offset)

  return syncedSubtitles
}

// Helper function to find best alignment
function findBestAlignment(subtitles, peaks) {
  // Algorithm:
  // 1. Extract subtitle timing events (start times)
  // 2. Compare with audio peak times
  // 3. Find offset that maximizes correlation
  // 4. Return best offset

  const subtitleTimes = subtitles.map(s => s.start)
  const peakTimes = peaks.map(p => p.time)

  let bestOffset = 0
  let bestScore = 0

  // Try different offsets
  for (let offset = -5; offset <= 5; offset += 0.1) {
    const score = calculateCorrelation(subtitleTimes, peakTimes, offset)
    if (score > bestScore) {
      bestScore = score
      bestOffset = offset
    }
  }

  return { offset: bestOffset, confidence: bestScore }
}
```

**Use Cases:**
- Automatic subtitle synchronization
- Detecting speech timing for subtitle generation
- Aligning subtitles after video editing
- Finding offset between subtitle file and video

---

### exportSubtitleFile()

Экспорт субтитров в файл на диск.

```typescript
async function exportSubtitleFile(options: SubtitleExportOptions): Promise<void>
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `SubtitleExportOptions` | Export configuration |

**SubtitleExportOptions:**
| Field | Type | Description |
|-------|------|-------------|
| `format` | `"srt" \| "vtt" \| "ass" \| "ssa"` | Output format |
| `content` | `string` | Subtitle content to save |
| `output_path` | `string` | Destination file path |

**Returns:** `Promise<void>`

**Example:**

```typescript
import { subtitleService } from "@/domains/subtitles"

async function saveSubtitles(subtitles: SubtitleClip[], filePath: string) {
  // Convert subtitles to SRT format
  const content = convertToSRT(subtitles)

  await subtitleService.exportSubtitleFile({
    format: "srt",
    content: content,
    output_path: filePath
  })

  console.log("Subtitles saved to:", filePath)
}
```

---

### updateTimelineSubtitles()

Обновление субтитров на треке таймлайна.

```typescript
async function updateTimelineSubtitles(trackId: string, subtitles: any[]): Promise<void>
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `trackId` | `string` | Timeline track ID |
| `subtitles` | `any[]` | Array of subtitle objects |

**Returns:** `Promise<void>`

**Example:**

```typescript
import { subtitleService } from "@/domains/subtitles"

async function addSubtitlesToTrack(trackId: string) {
  const subtitles = [
    { id: "sub-1", text: "Hello", startTime: 0, duration: 2 },
    { id: "sub-2", text: "World", startTime: 2, duration: 2 }
  ]

  await subtitleService.updateTimelineSubtitles(trackId, subtitles)
  console.log("Timeline updated with", subtitles.length, "subtitles")
}
```

---

### getSupportedFormats()

Получить список поддерживаемых форматов субтитров.

```typescript
function getSupportedFormats(): string[]
```

**Returns:** `string[]` - Array of supported formats

**Example:**

```typescript
import { subtitleService } from "@/domains/subtitles"

function validateSubtitleFile(filePath: string): boolean {
  const formats = subtitleService.getSupportedFormats()
  // ["srt", "vtt", "ass", "ssa"]

  const extension = filePath.split(".").pop()?.toLowerCase()

  if (!formats.includes(extension)) {
    console.error(`Unsupported format: ${extension}`)
    console.log(`Supported formats: ${formats.join(", ")}`)
    return false
  }

  return true
}
```

---

## Tauri Commands

Advanced: Direct access to Tauri backend commands. Обычно используйте `subtitleService` вместо прямых команд.

### readSubtitleFile()

Прямое чтение файла субтитров через Rust backend.

```typescript
import { readSubtitleFile } from "@/domains/subtitles"

const result = await readSubtitleFile("/path/to/subtitle.srt")
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | Path to subtitle file |

**Returns:** `Promise<SubtitleImportResult>`

**Rust Command:** `read_subtitle_file`

---

### analyzeAudioPeaks()

Прямой анализ аудио через FFmpeg в Rust backend.

```typescript
import { analyzeAudioPeaks } from "@/domains/subtitles"

const peaks = await analyzeAudioPeaks("/path/to/video.mp4", {
  windowSize: 1024,
  hopSize: 512,
  threshold: 0.5
})
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `audioPath` | `string` | Path to audio/video file |
| `options` | `AudioAnalysisOptions` | Analysis configuration |

**Returns:** `Promise<AudioPeaksResult>`

**Rust Command:** `analyze_audio_peaks`

---

### saveSubtitleFile()

Прямое сохранение файла субтитров через Rust backend.

```typescript
import { saveSubtitleFile } from "@/domains/subtitles"

await saveSubtitleFile({
  format: "srt",
  content: subtitleContent,
  output_path: "/path/to/output.srt"
})
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `SubtitleExportOptions` | Export configuration |

**Returns:** `Promise<void>`

**Rust Command:** `save_subtitle_file`

---

### updateTimelineSubtitles()

Прямое обновление субтитров таймлайна через Rust backend.

```typescript
import { updateTimelineSubtitles } from "@/domains/subtitles"

await updateTimelineSubtitles({
  trackId: "track-123",
  subtitles: [...]
})
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `params` | `UpdateTimelineSubtitlesParams` | Update parameters |

**Returns:** `Promise<void>`

**Rust Command:** `update_timeline_subtitles`

---

## Types

### SubtitleImportResult

Результат импорта файла субтитров.

```typescript
interface SubtitleImportResult {
  content: string     // Raw file content
  format: string      // Detected format (srt, vtt, ass, ssa)
  file_name: string   // File name without path
}
```

**Example:**
```typescript
{
  content: "1\n00:00:00,000 --> 00:00:02,000\nHello World\n\n2\n...",
  format: "srt",
  file_name: "movie.srt"
}
```

---

### AudioPeaksResult

Результат анализа аудио пиков.

```typescript
interface AudioPeaksResult {
  peaks: Array<{ time: number; amplitude: number }>  // Detected peaks
  sample_rate: number                                 // Audio sample rate (Hz)
  duration: number                                    // Total duration (seconds)
}
```

**Example:**
```typescript
{
  peaks: [
    { time: 0.5, amplitude: 0.8 },
    { time: 1.2, amplitude: 0.9 },
    { time: 2.3, amplitude: 0.7 }
  ],
  sample_rate: 48000,
  duration: 120.5
}
```

**Peak Object:**
| Field | Type | Description |
|-------|------|-------------|
| `time` | `number` | Time position in seconds |
| `amplitude` | `number` | Peak amplitude (0.0-1.0) |

---

### AudioAnalysisOptions

Опции для анализа аудио.

```typescript
interface AudioAnalysisOptions {
  windowSize?: number   // FFT window size (default: 1024)
  hopSize?: number      // Step size (default: 512)
  threshold?: number    // Amplitude threshold (default: 0.5)
}
```

**Field Descriptions:**

**windowSize:**
- FFT window size for frequency analysis
- Larger = more frequency precision, less time precision
- Common values: 512, 1024, 2048, 4096
- Default: 1024

**hopSize:**
- Step size between consecutive analysis windows
- Smaller = more time resolution, more computation
- Usually windowSize / 2 or windowSize / 4
- Default: 512

**threshold:**
- Minimum amplitude to consider as a peak
- Range: 0.0 (all) to 1.0 (only strongest)
- Higher values = fewer, stronger peaks
- Default: 0.5

**Example configurations:**

```typescript
// High precision (slow)
{
  windowSize: 4096,
  hopSize: 256,
  threshold: 0.3
}

// Balanced (default)
{
  windowSize: 1024,
  hopSize: 512,
  threshold: 0.5
}

// Fast (less precise)
{
  windowSize: 512,
  hopSize: 1024,
  threshold: 0.7
}
```

---

### SubtitleExportOptions

Опции для экспорта субтитров.

```typescript
interface SubtitleExportOptions {
  format: "srt" | "vtt" | "ass" | "ssa"
  content: string
  output_path: string
}
```

**Field Descriptions:**

**format:**
- Output subtitle format
- Supported: SRT, VTT, ASS, SSA
- Must match file extension

**content:**
- Subtitle content to save
- Already formatted in target format
- Raw text string

**output_path:**
- Absolute path to output file
- Directory must exist
- File will be overwritten if exists

**Example:**

```typescript
const options: SubtitleExportOptions = {
  format: "srt",
  content: "1\n00:00:00,000 --> 00:00:02,000\nHello World\n\n",
  output_path: "/videos/subtitles.srt"
}
```

---

### UpdateTimelineSubtitlesParams

Параметры для обновления субтитров на таймлайне.

```typescript
interface UpdateTimelineSubtitlesParams {
  trackId: string
  subtitles: any[]
}
```

**Field Descriptions:**

**trackId:**
- ID трека таймлайна
- Must be valid existing track
- Track type should be "subtitle"

**subtitles:**
- Array of subtitle objects
- Each contains: id, text, startTime, duration
- Will replace existing subtitles on track

**Example:**

```typescript
const params: UpdateTimelineSubtitlesParams = {
  trackId: "track-abc123",
  subtitles: [
    { id: "sub-1", text: "First subtitle", startTime: 0, duration: 2.5 },
    { id: "sub-2", text: "Second subtitle", startTime: 2.5, duration: 3.0 }
  ]
}
```
