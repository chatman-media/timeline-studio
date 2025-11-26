# Analysis Dashboard

**English** | [Русский](./README.ru.md)

## Overview

Analysis Dashboard is a module for visualizing and managing the AI video analysis process in Timeline Studio. It provides an interface for launching analysis, monitoring real-time progress, and viewing results. The module is frontend-only and relies on the AI Director module for all backend communication.

## Status

- ✅ **Components**: Dashboard v1 (simple), Dashboard v2 (advanced with detailed progress)
- ✅ **Hooks**: Analysis management, performance monitoring, visual analytics
- ✅ **Services**: Integration with AI Director
- ✅ **Tests**: 27+ tests (use-performance-monitoring: 12, visual-analytics: 15)

## Structure

```
analysis-dashboard/
├── components/
│   ├── ai-analysis-dashboard.tsx         # Dashboard v1
│   ├── ai-analysis-dashboard-v2.tsx      # Dashboard v2 (recommended)
│   ├── performance-metrics.tsx           # Performance visualization
│   └── visual-analytics.tsx              # Analytics visualization
├── hooks/
│   ├── use-performance-monitoring.ts     # Performance metrics
│   └── use-analysis-metrics.ts          # Analysis-specific metrics
└── __tests__/
    ├── hooks/
    │   └── use-performance-monitoring.test.ts
    └── components/
        ├── visual-analytics.test.tsx
        └── performance-metrics.test.tsx
```

## Features

### ✅ Implemented

- [x] Real-time progress monitoring (files, analyzers, overall progress)
- [x] Performance metrics (execution time, analyzer statistics)
- [x] Visual analytics (scenes timeline, quality charts, moments distribution)
- [x] AI Director integration (events, state synchronization, workflow templates)
- [x] Analyzer presets (Quick, Full, Video Only, Audio Only, Content Only)
- [x] Analysis modes (Fast, Balanced, Quality)
- [x] Detailed file and analyzer progress tracking
- [x] AI agents visualization
- [x] AI Chat integration for results

### ❌ Not Implemented

- [ ] CPU/GPU/Memory usage monitoring (requires `get_system_info` from `@/domains/system-integration`)
- [ ] Analysis results persistence between sessions
- [ ] Export analysis results to file
- [ ] Analysis comparison tools
- [ ] Analysis history

## Usage

### AIAnalysisDashboard v2 (Recommended)

```typescript
import { AIAnalysisDashboardV2 } from "@/features/analysis-dashboard"

function AnalysisPage() {
  return <AIAnalysisDashboardV2 />
}
```

**Workflow**:
1. Select files in Media Browser (tab "media")
2. Choose analyzers: use presets or configure manually
3. Click "Start Analysis"
4. Monitor detailed progress by files and analyzers
5. Use AI Dashboard to view agents
6. Work with results via AI Chat

### Analysis Modes

- **Fast Mode** (~30 seconds): Only audio_quality analyzer
- **Balanced Mode** (~2 minutes): audio_quality, scene_detection, moment_detection, mood_analysis, vlm_analysis
- **Quality Mode** (~10 minutes): All available analyzers

### Analyzer Presets

- **Quick Analysis**: scene_detection, audio_quality, moment_detection
- **Full Analysis**: All analyzers
- **Video Only**: Video analyzers only
- **Audio Only**: Audio analyzers only
- **Content Only**: Content analyzers only

## Integration

- **Depends on**: `@/features/ai-director`, `@/features/app-state`, `@/domains/browser`, `@/domains/media-management`, `@/features/timeline`
- **Used by**: `@/features/media-studio`

## Testing

- **Total tests**: 27+ tests
- **Coverage**: Hooks and visualization components

### Test Suites

- `use-performance-monitoring.test.ts` (12 tests) - Performance metrics calculation, ETA, monitoring lifecycle
- `visual-analytics.test.tsx` (15 tests) - Scenes timeline, quality charts, moments distribution
- `performance-metrics.test.tsx` - Performance visualization components

### Running Tests

```bash
# Run all analysis-dashboard tests
bun run test src/features/analysis-dashboard

# Run with coverage
bun run test:coverage src/features/analysis-dashboard

# Run in watch mode
bun run test:watch src/features/analysis-dashboard
```

## TODO / Roadmap

### High Priority
- [ ] Write comprehensive tests for Dashboard components (>80% coverage target)
- [ ] Add analysis results persistence

### Medium Priority
- [ ] Integrate with `@/domains/system-integration` for system metrics (get_system_info)
- [ ] Improve error handling
- [ ] Add export functionality for analysis results

### Low Priority
- [ ] Analysis comparison tools
- [ ] Analysis history tracking
- [ ] Custom analyzer configuration UI

### System Integration (Separate Task)
- [ ] Implement Tauri command `get_system_info` in backend (Rust)
- [ ] Create service in `src/domains/system-integration/services/performance/`
- [ ] Uncomment invoke call in `use-performance-monitoring.ts`
- [ ] Connect PerformanceMetrics components in Dashboard v2

## Known Limitations

1. **System Metrics**: CPU/GPU/Memory usage not tracked (waiting for `get_system_info` implementation)
2. **Tests**: Missing unit and integration tests for Dashboard components (hooks and utils are covered)
3. **Persistence**: Analysis results are not saved between sessions

## Documentation

- AI Director: `/src/features/ai-director/README.md`
- Domain Services: `/src/domains/ai-services/README.md`
