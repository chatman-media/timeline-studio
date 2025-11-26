# Smart Montage Planner

**English** | [Русский](./README.ru.md)

## Overview

AI-powered intelligent montage planning system that analyzes video/audio content, detects key moments, and generates optimized montage plans using YOLO object detection, FFmpeg analysis, and genetic algorithms.

## Status

- ✅ **Components**: Complete dashboard with analysis, editing, and preview
- ✅ **Hooks**: Full React integration with backend services
- ✅ **Backend Integration**: YOLO, FFmpeg, genetic algorithm optimization
- ✅ **Tests**: 1 test file with comprehensive backend command coverage

## Structure

```
montage-planner/
├── components/
│   ├── planner-dashboard/     # Main control panel
│   ├── analysis/              # Content analysis components
│   ├── editor/                # Plan editing components
│   └── montage-planner.tsx    # Main component
├── hooks/
│   ├── use-montage-planner.ts     # Main hook
│   ├── use-content-analysis.ts    # Content analysis
│   ├── use-montage-backend.ts     # Backend communication
│   └── use-timeline-integration.ts # Timeline integration
├── services/
│   ├── montage-planner-machine.ts # XState machine
│   ├── content-analyzer.ts        # Analysis service
│   ├── moment-detector.ts         # Key moment detection
│   └── plan-generator.ts          # Plan generation
└── types/
    └── index.ts                   # TypeScript definitions
```

## Features

### ✅ Implemented

- [x] Automated video/audio content analysis (YOLO + FFmpeg)
- [x] Key moment detection with quality scoring
- [x] Montage plan generation with genetic algorithm
- [x] Multiple pre-configured styles (Dynamic Action, Cinematic, Music Video, etc.)
- [x] Custom style creation support
- [x] Timeline integration (apply plans, create markers)
- [x] Real-time preview with quality metrics
- [x] Rhythm and pacing calculation
- [x] Emotional arc profiling
- [x] Face and object detection integration

### ❌ Not Implemented

- [ ] Caching system for analysis results
- [ ] Export/import UI for plans (backend ready)
- [ ] Extended tempo detection algorithms
- [ ] Advanced beat synchronization for music videos

## Usage

### Basic Setup

```typescript
import { MontagePlannerProvider } from '@/features/montage-planner'

function App() {
  return (
    <MontagePlannerProvider>
      <YourComponent />
    </MontagePlannerProvider>
  )
}
```

### Analyze and Generate

```typescript
import { useMontagePlanner } from '@/features/montage-planner/hooks'

function PlannerComponent() {
  const {
    analyzeProject,
    generatePlan,
    applyToTimeline
  } = useMontagePlanner()

  const handleGenerate = async () => {
    await analyzeProject()
    const plan = await generatePlan({
      style: 'cinematic-drama',
      targetDuration: 300,
      quality: 'high'
    })
    await applyToTimeline(plan)
  }
}
```

### Available Styles

- **Dynamic Action** - Fast rhythm, many transitions
- **Cinematic Drama** - Slow tempo, emotional pauses
- **Music Video** - Beat synchronization
- **Documentary** - Natural rhythm, informative
- **Social Media** - Fast-paced, attention grabbing
- **Corporate** - Professional, measured pace

## Integration

- **Depends on**: `@/features/recognition` (YOLO), `@/features/timeline`, `@tauri-apps/api`, FFmpeg, YOLO models
- **Used by**: Media editing workflow, AI Director for automated video creation
- **Backend**: 6 Tauri commands (analyze_video_composition, detect_key_moments, generate_montage_plan, analyze_video_quality, analyze_frame_quality, analyze_audio_content)

## Testing

- **Total tests**: 1 test file (use-montage-backend.test.ts)
- **Coverage**: All 6 backend commands, error handling, state management
- Backend commands tested:
  - ✓ analyzeVideoComposition - Video analysis with YOLO
  - ✓ detectKeyMoments - Key moment detection
  - ✓ generateMontagePlan - Genetic algorithm optimization
  - ✓ analyzeVideoQuality - FFmpeg quality analysis
  - ✓ analyzeFrameQuality - Frame-specific metrics
  - ✓ analyzeAudioContent - Audio feature extraction

Run tests:
```bash
bun run test src/features/montage-planner
```

## Performance

- **Analysis Speed**: <5 minutes for 1 hour of material
- **Plan Generation**: <30 seconds
- **Real-time Preview**: Instant updates
- **Parallel Processing**: Optimized backend processing
- **Caching**: Smart caching recommended for repeated operations

## TODO / Roadmap

- [ ] Implement caching layer for analysis results
- [ ] Add export/import UI for montage plans
- [ ] Enhance tempo detection with ML-based algorithms
- [ ] Add advanced beat synchronization for music videos
- [ ] Create preset marketplace for custom montage styles
- [ ] Implement collaborative montage planning
- [ ] Add A/B testing for different montage variations
