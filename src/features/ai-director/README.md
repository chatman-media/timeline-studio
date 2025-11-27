# AI Director

**English** | [Русский](./README.ru.md)

## Overview

AI Director is a comprehensive media analysis orchestrator that provides intelligent video analysis, scene detection, montage planning, and workflow automation. It serves as the central AI-powered analysis engine for Timeline Studio.

## Status

**🎉 100% Complete - All core functionality is fully implemented and tested**

- ✅ **Components**: Dashboard, montage planner, progress tracking, template selector
- ✅ **Hooks**: Analysis management, presets, montage application
- ✅ **Services**: XState machine, service layer with backend integration
- ✅ **Tests**: 60+ integration tests covering full workflow

## Structure

```
ai-director/
├── components/        # UI components
│   ├── ai-director-chat.tsx
│   ├── ai-director-dashboard.tsx
│   ├── ai-director-modal.tsx
│   ├── analyzer-checkbox-group.tsx
│   ├── analyzer-preset-selector.tsx
│   ├── analyzer-progress-item.tsx
│   ├── file-analysis-progress.tsx
│   ├── montage-plan-editor.tsx
│   ├── montage-plan-preview.tsx
│   ├── montage-template-selector.tsx
│   └── v3/           # V3 dashboard components
├── hooks/            # React hooks
│   ├── use-ai-director.tsx
│   ├── use-ai-director-analysis.tsx
│   ├── use-analyzer-presets.tsx
│   ├── use-montage-applicator.tsx
│   └── use-montage-template.tsx
├── services/         # Business logic and state machines
│   ├── ai-director-machine.ts
│   └── ai-director-service.ts
├── types/           # TypeScript types
│   ├── ai-director.ts
│   ├── analysis-progress.ts
│   ├── analyzer-presets.ts
│   ├── dashboard.ts
│   ├── montage-plan.ts
│   └── montage-templates.ts
├── utils/           # Utility functions
│   ├── montage-plan-io.ts
│   └── montage-plan-parser.ts
└── __tests__/       # Test files
    └── integration/
```

## Features

### ✅ Implemented

- [x] **Analysis Modes**: Fast (~30s), Balanced (~2min), Quality (~10min)
- [x] **Video Analyzers**: scene_detection, object_detection, face_detection, motion_analysis, composition_analysis
- [x] **Audio Analyzers**: audio_quality, speech_recognition, music_detection, sound_events, silence_detection
- [x] **Content Analyzers**: mood_analysis, content_classification, quality_assessment, moment_detection, vlm_analysis
- [x] **Montage Planning**: Template-based generation (TikTok, Highlight Reel, etc.)
- [x] **Dashboard Features**: Real-time progress monitoring, AI agents visualization, workflow templates
- [x] **Quality-based Clip Selection**: Automatic filtering by quality threshold
- [x] **Rhythm-based Editing**: Beat-aligned cuts
- [x] **Multi-file Montage**: Support for multiple source files
- [x] **Export/Import**: Montage plans serialization

### 🚀 Future Improvements

The following features are optional enhancements planned for future releases. All core functionality is complete and working.

- [ ] Real-time preview during analysis
- [ ] GPU acceleration indicators
- [ ] Custom analyzer plugins

## Usage

```typescript
import { AIDirectorService } from '@/features/ai-director'

// Comprehensive analysis
const service = AIDirectorService.getInstance()
const result = await service.analyzeComprehensive('/path/to/video.mp4', {
  mode: 'balanced'
})

// Quick analysis
const quickResult = await service.analyzeQuick('/path/to/video.mp4')

// Batch analysis
const batchResults = await service.analyzeBatch([
  '/path/to/video1.mp4',
  '/path/to/video2.mp4'
])

// Get system capabilities
const capabilities = await service.getCapabilities()

// Health check
const health = await service.healthCheck()
```

## Integration

- **Depends on**: `@/domains/ai-services`, `@/domains/media-management`, `@/features/app-state`, `@/features/timeline`
- **Used by**: `@/features/analysis-dashboard`, `@/features/ai-chat`

## Testing

- **Total tests**: 60+ integration tests
- **Coverage**: Comprehensive workflow, integration, and template tests

### Test Suites

- `ai-workflow.test.tsx` - Full analysis workflow (30+ tests)
- `montage-planner-integration.test.tsx` - Montage planning integration (15+ tests)
- `workflow-templates.test.tsx` - Built-in templates validation (15+ tests)

### Running Tests

```bash
# Run all AI Director tests
bun run test src/features/ai-director/

# Run specific test suites
bun run test src/features/ai-director/__tests__/integration/ai-workflow.test.tsx
bun run test src/features/ai-director/__tests__/integration/montage-planner-integration.test.tsx
```

## TODO / Roadmap

### High Priority
- [ ] Real-time preview generation during analysis
- [ ] Performance optimization for batch processing
- [ ] Enhanced error recovery mechanisms

### Medium Priority
- [ ] Custom analyzer plugin system
- [ ] GPU acceleration indicators in UI
- [ ] Advanced montage plan editing tools
- [ ] Analysis result caching

### Low Priority
- [ ] Analysis history and comparison
- [ ] Export analysis reports (PDF, JSON)
- [ ] Integration with external analysis services

## E2E Tests

**Location**: `e2e/tauri/features/ai-director/`

**Status**: 11 tests implemented in `backend-integration.spec.ts` covering:
- Tauri backend initialization
- Commands: `ai_director_get_capabilities`, `ai_director_get_default_config`, `ai_director_health_check`
- Event listeners setup
- UI navigation and integration

**Planned**: Analysis workflows, batch processing, real-time progress events, montage plan generation
