# Transcription

**English** | [Русский](./README.ru.md)

## Overview

The Transcription module provides high-speed speech recognition capabilities for Timeline Studio using advanced AI technologies including OpenAI Whisper, local Whisper, and Faster Whisper implementations.

## Status

- ✅ **Components**: 4 components for transcription UI
- ✅ **Hooks**: 2 hooks for transcription and model management
- ✅ **Services**: Unified service for all providers (in `/src/domains/ai-services/`)
- ✅ **Tests**: Complete unit test coverage
- ✅ **Providers**: OpenAI Whisper, Local Whisper, Faster Whisper

## Structure

```
transcription/
├── components/                      # React components
│   ├── transcription-panel.tsx     # Main transcription panel
│   ├── transcription-editor.tsx    # Results editor
│   ├── model-selector.tsx          # Model selection and download
│   └── language-selector.tsx       # Language selection
├── hooks/                          # React hooks
│   ├── use-transcription.ts        # Main transcription hook
│   └── use-enhanced-subtitle-automation.ts  # Enhanced subtitle automation
├── __tests__/                      # Test files
│   ├── hooks/                      # Hook tests
│   └── components/                 # Component tests
├── __mocks__/                      # Test mocks
│   └── transcription-service.ts    # Mock TranscriptionService
└── types.ts                        # TypeScript types (re-exported from domains)
```

## Features

### ✅ Implemented

**Multiple Providers:**
- [x] OpenAI Whisper API (cloud)
- [x] Local Whisper (whisper.cpp)
- [x] Faster Whisper (up to 4x faster)
- [x] Automatic provider selection

**Models and Languages:**
- [x] 6 model sizes (tiny → large-v3)
- [x] 20+ languages with auto-detection
- [x] Word-level timestamps
- [x] VAD (Voice Activity Detection)

**UI/UX:**
- [x] Intuitive transcription panel
- [x] Real-time progress tracking
- [x] Editor with timestamps
- [x] Model management

**Export:**
- [x] SRT (SubRip) format
- [x] VTT (WebVTT) format
- [x] ASS (Advanced SubStation) format
- [x] Direct timeline integration

### ❌ Not Implemented

**Speaker Identification (In Development):**
- [ ] Backend speaker diarization
- [ ] Speaker labels in transcription results
- [ ] Person identification integration

**Advanced Features:**
- [ ] Streaming processing for large files
- [ ] Result caching
- [ ] Batch processing
- [ ] Background tasks

## Usage

```typescript
import { TranscriptionPanel } from '@/features/transcription';
import { useTranscription } from '@/features/transcription';

function MyComponent() {
  const { transcribe, isTranscribing, result, progress } = useTranscription();

  const handleTranscribe = async () => {
    const result = await transcribe('/path/to/media.mp4', {
      modelSize: 'base',
      language: 'auto',
      task: 'transcribe',
      wordTimestamps: true,
      vadFilter: true
    });

    if (result) {
      console.log(`Transcribed: ${result.segments.length} segments`);
    }
  };

  return (
    <div>
      <button onClick={handleTranscribe} disabled={isTranscribing}>
        {isTranscribing ? `Processing... ${progress.progress}%` : 'Transcribe'}
      </button>
    </div>
  );
}
```

## Integration

- **Depends on**: `@/domains/ai-services` (TranscriptionService)
- **Used by**: `@/features/subtitles`, `@/features/timeline`, `@/features/ai-chat`
- **Integration**: Automatic subtitle creation, timeline addition, AI context

## Testing

- **Hook Tests**: `use-transcription`, `use-enhanced-subtitle-automation`
- **Component Tests**: Language selector, model selector, model size selector

```bash
# Run all transcription tests
bun run test src/features/transcription

# Run in watch mode
bun run test:watch src/features/transcription

# Run with coverage
bun run test:coverage src/features/transcription
```

## TODO / Roadmap

### High Priority
- [ ] E2E tests for transcription operations
- [ ] Speaker diarization backend implementation
- [ ] Person identification integration

### Medium Priority
- [ ] Streaming processing for large files
- [ ] Result caching system
- [ ] Batch processing for multiple files

### Low Priority
- [ ] Custom model training
- [ ] Advanced audio preprocessing
- [ ] Extended language support (30+ languages)

## Performance

### Provider Comparison

| Provider | Speed | Memory | Accuracy | Requirements |
|----------|-------|--------|----------|--------------|
| OpenAI API | Medium | - | High | API key, internet |
| Local Whisper | 1x | High | High | CPU/GPU |
| Faster Whisper | 4x | Low | High | CPU/GPU, Python |

### Model Recommendations

- **tiny** (39MB) - Short recordings, fast processing
- **base** (74MB) - Optimal balance of speed and quality
- **small** (244MB) - Improved quality for general tasks
- **medium** (769MB) - High quality for important projects
- **large-v3** (1.5GB) - Maximum accuracy for professional tasks

---

**Version:** 0.68.1
**Last Updated:** 2025-11-26
