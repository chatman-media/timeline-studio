# Subtitles Domain - Architecture

## Overview

Домен `subtitles` предоставляет централизованную работу с файлами субтитров и их синхронизацией с аудио. Использует Singleton Service паттерн для простого API и Tauri backend для производительных операций с файлами и FFmpeg.

## Directory Structure

```
src/domains/subtitles/
├── index.ts                    # Public API exports
├── README.md                   # Overview documentation
├── docs/
│   ├── API.md                  # Full API reference
│   ├── ARCHITECTURE.md         # This file
│   └── CHANGELOG.md            # History of changes
├── services/
│   ├── subtitle-service.ts     # Main singleton service (57 lines)
│   └── index.ts
├── tauri/
│   ├── subtitle-commands.ts    # Tauri backend commands (63 lines)
│   └── index.ts
└── types/
    └── index.ts                # Type definitions (22 lines)
```

**Total:** ~142 lines of code (excluding tests, docs, index files)

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│              React Components / Features                │
│   (video-editing, transcription, timeline-editor)       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 subtitleService                         │
│              (Singleton Instance)                       │
│                                                          │
│  • importSubtitleFile(path)                             │
│  • analyzeAudioForSync(audioPath, options?)             │
│  • getSupportedFormats()                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Tauri Commands Layer                       │
│                                                          │
│  readSubtitleFile(filePath)                             │
│  analyzeAudioPeaks(audioPath, options)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                Rust Backend (Tauri)                     │
│                                                          │
│  • File system operations (fast, native)                │
│  • FFmpeg integration (audio analysis)                  │
│  • Format detection and validation                      │
└─────────────────────────────────────────────────────────┘
```

---

## Subtitle Import Flow

```
User Request
    │
    ▼
subtitleService.importSubtitleFile("/path/to/subtitle.srt")
    │
    ├─> Logger: "Importing subtitle file"
    │
    ▼
readSubtitleFile(filePath) [Tauri Command]
    │
    ├─> invoke("read_subtitle_file", { file_path: filePath })
    │
    ▼
Rust Backend
    │
    ├─> Read file from disk
    ├─> Detect format (extension: .srt, .vtt, .ass, .ssa)
    ├─> Validate file structure
    │
    ▼
Return SubtitleImportResult
    │
    ├─> content: string (raw file content)
    ├─> format: string (detected format)
    ├─> file_name: string (filename without path)
    │
    ▼
Logger: "Subtitle file read successfully"
    │
    ▼
Return to caller
```

**Error Handling:**
- File not found → Rust returns error → TypeScript throws
- Invalid format → Rust validates → TypeScript logs error
- Permission denied → OS error → Propagated to UI

---

## Audio Sync Algorithm Flow

```
User Request
    │
    ▼
subtitleService.analyzeAudioForSync(videoPath, options)
    │
    ├─> Logger: "Analyzing audio for sync"
    │
    ▼
analyzeAudioPeaks(audioPath, options) [Tauri Command]
    │
    ├─> Default options applied:
    │   • windowSize: options.windowSize ?? 1024
    │   • hopSize: options.hopSize ?? 512
    │   • threshold: options.threshold ?? 0.5
    │
    ▼
invoke("analyze_audio_peaks", { audioPath, windowSize, hopSize, threshold })
    │
    ▼
Rust Backend + FFmpeg
    │
    ├─> Extract audio stream from video
    ├─> Apply FFT (Fast Fourier Transform)
    ├─> Analyze amplitude over time windows
    ├─> Detect peaks above threshold
    ├─> Calculate peak times and amplitudes
    │
    ▼
Return AudioPeaksResult
    │
    ├─> peaks: [{ time, amplitude }, ...]
    ├─> sample_rate: number (Hz)
    ├─> duration: number (seconds)
    │
    ▼
Logger: "Audio analysis completed"
    │
    ▼
Return to caller
```

**Algorithm Details:**

1. **Windowing:**
   - Audio is split into overlapping windows
   - Window size: controls frequency resolution
   - Hop size: controls time resolution

2. **FFT Analysis:**
   - Each window analyzed with Fast Fourier Transform
   - Converts time domain → frequency domain
   - Calculates amplitude spectrum

3. **Peak Detection:**
   - Compare amplitude to threshold
   - Local maxima detection (peaks, not plateaus)
   - Output: time and amplitude pairs

4. **Use Cases:**
   - Subtitle sync: align subtitle events with speech
   - Speech detection: find when people are talking
   - Music beat detection: align to rhythm

---

## Design Decisions

### 1. Singleton Service Pattern

**Decision:** Use Singleton instead of Context Provider

**Reasons:**
- Subtitles domain is lightweight (no complex state)
- No need for multiple instances
- Simple, direct API: `subtitleService.methodName()`
- No provider setup required in React tree
- Follows pattern from other simple domains

**Benefits:**
- Less boilerplate code
- Easier to use from anywhere in the app
- No dependency on React context
- Simpler testing (direct imports)

**Trade-offs:**
- Cannot have multiple configurations
- Global state (acceptable for this use case)

**Example:**
```typescript
// Simple usage - no providers needed
import { subtitleService } from "@/domains/subtitles"

const result = await subtitleService.importSubtitleFile(path)
```

---

### 2. Format Support Strategy

**Decision:** Support 4 common formats (SRT, VTT, ASS, SSA)

**Reasons:**
- **SRT:** Most common, universally supported
- **VTT:** Web standard, HTML5 native
- **ASS/SSA:** Advanced styling, anime/fansubs

**Not supported (yet):**
- TTML, SBV, SMI, SUB, TXT - less common
- Can be added later if needed

**Benefits:**
- Covers 95%+ of use cases
- Simpler implementation
- Easier to maintain

**Extensibility:**
- Rust backend handles parsing
- Easy to add new formats by updating Rust code
- TypeScript API remains unchanged

---

### 3. Audio Analysis Integration

**Decision:** Use FFmpeg through Tauri backend for audio analysis

**Reasons:**
- FFmpeg already integrated in Timeline Studio
- Native performance (Rust + FFmpeg)
- Cross-platform (Windows, macOS, Linux)
- No need for Web Audio API (limited in Electron/Tauri)

**Benefits:**
- Fast audio processing
- Handles all audio/video formats
- Consistent with other media operations
- Works with large files efficiently

**Alternative considered:**
- Web Audio API: Browser-based, but limited file size and formats
- Rejected because: Desktop app needs native performance

---

### 4. Tauri Command Layer

**Decision:** Separate Tauri commands into dedicated layer

**Reasons:**
- Single source of truth for IPC calls
- Easy to mock in tests
- Clear separation of concerns
- Follows Timeline Studio architecture pattern

**Structure:**
```
services/subtitle-service.ts → Business logic (high-level)
    ↓
tauri/subtitle-commands.ts → IPC bridge (low-level)
    ↓
Rust backend → Native operations
```

**Benefits:**
- Service layer doesn't know about Tauri details
- Can swap backend implementation if needed
- Logging at command layer (consistent with other domains)
- Type safety enforced at boundary

---

## Integration Points

### 1. Video Editing Domain

Subtitles are used in video editing workflow:

```typescript
import { subtitleService } from "@/domains/subtitles"
import { timelineService } from "@/domains/video-editing"

async function addSubtitlesToTimeline(videoId: string, subtitlePath: string) {
  // Import subtitles
  const subtitleData = await subtitleService.importSubtitleFile(subtitlePath)

  // Parse subtitle content
  const subtitles = parseSubtitles(subtitleData.content, subtitleData.format)

  // Add to timeline as subtitle track
  subtitles.forEach(subtitle => {
    timelineService.addSubtitle(videoId, {
      startTime: subtitle.start,
      endTime: subtitle.end,
      text: subtitle.text
    })
  })
}
```

---

### 2. Transcription Feature

Transcription can generate subtitles:

```typescript
import { subtitleService } from "@/domains/subtitles"
import { transcriptionService } from "@/features/transcription"

async function autoGenerateSubtitles(videoPath: string) {
  // 1. Transcribe audio to text
  const transcript = await transcriptionService.transcribe(videoPath)

  // 2. Analyze audio for timing
  const peaks = await subtitleService.analyzeAudioForSync(videoPath)

  // 3. Align transcript segments with audio peaks
  const alignedSubtitles = alignTranscriptToPeaks(transcript, peaks)

  // 4. Export as subtitle file
  const srtContent = convertToSRT(alignedSubtitles)

  return srtContent
}
```

---

### 3. Timeline Editor UI

Timeline editor displays and edits subtitles:

```typescript
import { subtitleService } from "@/domains/subtitles"
import { useTimeline } from "@/features/timeline"

function SubtitleEditor() {
  const { currentVideo } = useTimeline()
  const [subtitles, setSubtitles] = useState([])

  const handleImport = async () => {
    const path = await showOpenDialog({ filters: ["srt", "vtt", "ass", "ssa"] })
    const result = await subtitleService.importSubtitleFile(path)
    const parsed = parseSubtitles(result.content, result.format)
    setSubtitles(parsed)
  }

  const handleSync = async () => {
    const peaks = await subtitleService.analyzeAudioForSync(currentVideo.path)
    const synced = syncSubtitlesToPeaks(subtitles, peaks)
    setSubtitles(synced)
  }

  return (
    <div>
      <Button onClick={handleImport}>Import Subtitles</Button>
      <Button onClick={handleSync}>Auto Sync</Button>
      <SubtitleTimeline subtitles={subtitles} />
    </div>
  )
}
```

---

## Future Enhancements

### Potential Additions:

1. **Subtitle Editing:**
   - Edit subtitle text and timing
   - Save modified subtitles back to file
   - Commands: `updateSubtitle()`, `saveSubtitleFile()`

2. **Additional Formats:**
   - TTML (Timed Text Markup Language)
   - SBV (YouTube format)
   - SMI (SAMI format)

3. **Advanced Sync:**
   - Speech-to-text alignment
   - Automatic time stretching
   - Confidence scores for sync quality

4. **Subtitle Generation:**
   - Auto-generate from transcript
   - Split long lines intelligently
   - Format according to style guidelines

5. **Style Management:**
   - Parse ASS/SSA styling
   - Apply custom fonts and colors
   - Preview styled subtitles

---

## Testing Strategy

### Unit Tests (planned):

```typescript
describe("SubtitleService", () => {
  it("should import SRT file", async () => {
    const result = await subtitleService.importSubtitleFile("/test.srt")
    expect(result.format).toBe("srt")
  })

  it("should analyze audio peaks", async () => {
    const peaks = await subtitleService.analyzeAudioForSync("/test.mp4")
    expect(peaks.peaks.length).toBeGreaterThan(0)
  })

  it("should return supported formats", () => {
    const formats = subtitleService.getSupportedFormats()
    expect(formats).toEqual(["srt", "vtt", "ass", "ssa"])
  })
})
```

### Integration Tests:
- Import subtitle → Add to timeline → Export project
- Transcribe audio → Generate subtitles → Sync with video
- Load subtitle → Edit timing → Save changes

---

## Performance Considerations

### File Reading:
- Rust backend: fast native file I/O
- Large subtitle files (100KB+): handled efficiently
- No blocking of UI thread (async Tauri commands)

### Audio Analysis:
- FFmpeg in Rust: native performance
- Long videos (1 hour+): ~2-5 seconds analysis
- Configurable precision (windowSize/hopSize trade-off)
- Progress reporting (future enhancement)

### Memory:
- Subtitle content stored as string (lightweight)
- Audio peaks: array of {time, amplitude} pairs
- Typical memory: <1MB per subtitle file

---

## Error Handling

### Service Layer:
```typescript
try {
  const result = await subtitleService.importSubtitleFile(path)
} catch (error) {
  // Logs error with context
  // Throws to caller for handling
}
```

### Tauri Command Layer:
- Logs all operations (debug level)
- Logs errors with full context
- Re-throws errors to service layer

### Rust Backend:
- Returns Result<T, Error>
- Error messages propagated to TypeScript
- File I/O errors include path information

### UI Layer (typical usage):
```typescript
const handleImport = async () => {
  try {
    const result = await subtitleService.importSubtitleFile(path)
    showSuccess("Subtitles imported successfully")
  } catch (error) {
    showError(`Failed to import subtitles: ${error.message}`)
  }
}
```
