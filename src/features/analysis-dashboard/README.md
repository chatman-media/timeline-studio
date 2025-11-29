# Analysis Dashboard

**English** | [Русский](./README.ru.md)

## Overview

Analysis Dashboard is a module for visualizing and managing the AI video analysis process in Timeline Studio. It provides an interface for launching analysis, monitoring real-time progress, and viewing results. The module is frontend-only and relies on the AI Director module for all backend communication.

## Status

**🎉 100% Complete** - All core functionality is fully implemented and tested.

- ✅ **Components**: AI Analysis Dashboard with detailed progress monitoring
- ✅ **Services**: Integration with AI Director
- ✅ **Architecture**: Clean, minimal dependencies, uses AI Director components

## Structure

```
analysis-dashboard/
├── components/
│   ├── ai-analysis-dashboard.tsx         # Main dashboard component
│   └── index.ts                          # Component exports
├── index.ts                              # Module exports
├── README.md                             # English documentation
└── README.ru.md                          # Russian documentation
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

### 🚀 Future Improvements

The core functionality is complete. The following features are optional enhancements for future iterations:

- [ ] CPU/GPU/Memory usage monitoring (requires `get_system_info` from `@/domains/system-integration`)
- [ ] Analysis results persistence between sessions
- [ ] Export analysis results to file
- [ ] Analysis comparison tools
- [ ] Analysis history

## Usage

### AIAnalysisDashboard

```typescript
import { AIAnalysisDashboard } from "@/features/analysis-dashboard"

function AnalysisPage() {
  return <AIAnalysisDashboard />
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

The Analysis Dashboard is a thin wrapper around AI Director components, so testing is primarily handled by the AI Director module. Integration testing is performed at the page level.

## TODO / Roadmap

### Future Enhancements
- [ ] Add analysis results persistence
- [ ] Add export functionality for analysis results
- [ ] Analysis comparison tools
- [ ] Analysis history tracking

## Known Limitations

1. **Persistence**: Analysis results are not saved between sessions
2. **Architecture Dependencies**: Currently depends on domains (will be refactored to use core layer)

## Documentation

- AI Director: `/src/features/ai-director/README.md`
- Domain Services: `/src/domains/ai-services/README.md`
