# AI Director

## Overview / Обзор

**EN:** AI Director is a comprehensive media analysis orchestrator that provides intelligent video analysis, scene detection, montage planning, and workflow automation. It serves as the central AI-powered analysis engine for Timeline Studio.

**RU:** AI Director - это комплексный оркестратор анализа медиа, предоставляющий интеллектуальный анализ видео, обнаружение сцен, планирование монтажа и автоматизацию рабочих процессов. Служит центральным движком AI-анализа для Timeline Studio.

## API (Backend Commands)

| Command | Parameters | Description |
|---------|------------|-------------|
| `ai_director_v2_analyze_comprehensive` | `{ videoPath: string, config?: AIDirectorConfig }` | Run comprehensive analysis of media file |
| `ai_director_v2_analyze_quick` | `{ videoPath: string }` | Run quick analysis of media file |
| `ai_director_v2_analyze_batch` | `{ filePaths: string[], config?: AIDirectorConfig }` | Run batch analysis of multiple files |
| `ai_director_get_capabilities` | - | Get system capabilities for AI Director |
| `ai_director_get_default_config` | `{ mode: 'fast' \| 'balanced' \| 'quality' \| 'custom' }` | Get default configuration for analysis mode |
| `ai_director_validate_config` | `{ config: AIDirectorConfig }` | Validate AI Director configuration |
| `ai_director_health_check` | - | Perform health check of the system |
| `unified_audio_analyze_comprehensive` | `{ videoPath: string, config?: object }` | Comprehensive audio analysis through unified system |
| `unified_audio_analyze_quick` | `{ videoPath: string }` | Quick audio analysis |
| `unified_audio_analyze_batch` | `{ filePaths: string[], config?: object }` | Batch audio analysis |
| `unified_audio_get_capabilities` | - | Get audio analysis capabilities |
| `analyze_video_comprehensive` | `{ videoPath: string, config?: object }` | Comprehensive video analysis (vision) |

## Behavior (from tests) / Поведение (из тестов)

### ai-workflow.test.tsx
**Full AI Director Analysis Workflow:**
- ✓ Should complete comprehensive analysis with all components
- ✓ Should handle quick analysis mode
- ✓ Should process batch analysis for multiple files

**Scene Detection and Classification:**
- ✓ Should detect multiple scenes with metadata
- ✓ Should validate scene boundaries and transitions

**Smart Montage Generation:**
- ✓ Should generate montage data from analysis results
- ✓ Should prioritize high-quality moments

**Auto-cut Suggestions:**
- ✓ Should generate cut points from scene analysis
- ✓ Should suggest cuts based on audio metrics

**Content-aware Trimming:**
- ✓ Should identify trimmable sections
- ✓ Should preserve important moments during trimming

**Audio Quality Analysis:**
- ✓ Should analyze comprehensive audio metrics
- ✓ Should detect audio quality issues

**Face Detection and Tracking:**
- ✓ Should detect and track faces across timeline
- ✓ Should handle multiple faces in same frame

**Object Recognition:**
- ✓ Should recognize and categorize objects

**Automated Color Grading:**
- ✓ Should analyze color composition

**AI-powered Subtitle Generation:**
- ✓ Should generate subtitles from transcription

**Timeline Integration:**
- ✓ Should provide data for timeline integration

**Performance:**
- ✓ Should handle analysis of long videos
- ✓ Should handle timeout scenarios

**System Capabilities:**
- ✓ Should retrieve system capabilities
- ✓ Should validate configuration

**Error Handling:**
- ✓ Should handle analysis errors gracefully
- ✓ Should clear errors on next successful analysis

### montage-planner-integration.test.tsx
**Analysis to Montage Flow:**
- ✓ Should convert AI Director analysis to Montage Planner format
- ✓ Should generate montage plan from analysis results

**Unified Audio Analysis Integration:**
- ✓ Should use unified audio data for montage planning
- ✓ Should detect silence for better cut points

**Template to Montage Plan Conversion:**
- ✓ Should convert workflow template to montage plan

**Quality-Based Clip Selection:**
- ✓ Should filter clips by quality threshold

**Scene Detection Integration:**
- ✓ Should use AI Director scene detection for montage boundaries

**Rhythm-Based Editing:**
- ✓ Should align cuts with beat timestamps

**Multi-File Montage:**
- ✓ Should create montage plan from multiple source files

**Error Handling:**
- ✓ Should handle missing analysis data gracefully
- ✓ Should validate montage plan before generation

### workflow-templates.test.tsx
**Built-in Templates:**
- ✓ Should have all required templates (TikTok, Highlight Reel, etc.)
- ✓ Should have valid parameters for all templates

**TikTok / Instagram Reel Template:**
- ✓ Should have correct parameters for short-form vertical video
- ✓ Should prefer dynamic style
- ✓ Should have fast-paced clip durations
- ✓ Should prioritize movement and action
- ✓ Should use fast transitions
- ✓ Should have upbeat music settings
- ✓ Should avoid repetition

**Highlight Reel Template:**
- ✓ Should be configured for best moments compilation
- ✓ Should have medium duration
- ✓ Should use highlights style
- ✓ Should have high quality threshold
- ✓ Should prioritize action and energy
- ✓ Should require movement and audio

## Structure / Структура

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
        ├── ai-workflow.test.tsx
        ├── montage-planner-integration.test.tsx
        └── workflow-templates.test.tsx
```

## Key Features / Ключевые возможности

### Analysis Modes
- **Fast Mode** (~30 seconds) - Quick audio quality check
- **Balanced Mode** (~2 minutes) - Optimal speed/quality ratio with scene detection, moment detection, mood analysis
- **Quality Mode** (~10 minutes) - Maximum detail analysis with all analyzers

### Analyzer Categories
- **Video Analyzers:** scene_detection, object_detection, face_detection, motion_analysis, composition_analysis
- **Audio Analyzers:** audio_quality, speech_recognition, music_detection, sound_events, silence_detection
- **Content Analyzers:** mood_analysis, content_classification, quality_assessment, moment_detection, vlm_analysis

### Montage Planning
- Template-based montage generation (TikTok, Highlight Reel, etc.)
- Quality-based clip selection
- Rhythm-based editing (beat-aligned cuts)
- Multi-file montage support
- Export/import montage plans

### Dashboard Features
- Real-time progress monitoring
- Detailed file and analyzer progress tracking
- AI agents visualization
- Workflow templates
- Quick actions
- Statistics and analytics

## Dependencies / Зависимости

### Internal Dependencies
- Depends on: `@/domains/ai-services`, `@/domains/media-management`, `@/features/app-state`, `@/features/timeline`
- Used by: `@/features/analysis-dashboard`, `@/features/ai-chat`

### External Dependencies
- `@tauri-apps/api` - Tauri backend integration
- `xstate` - State machine management
- UI components from `@/components/ui`

## Testing / Тестирование

**Total Tests:** 60+ integration tests
**Test Coverage:** Comprehensive workflow, integration, and template tests

```bash
# Run all AI Director tests
bun run test src/features/ai-director/

# Run specific test suites
bun run test src/features/ai-director/__tests__/integration/ai-workflow.test.tsx
bun run test src/features/ai-director/__tests__/integration/montage-planner-integration.test.tsx
```

## Usage Example / Пример использования

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

## 🎭 E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/ai-director/`

### Чеклист тестов

| Тест | Приоритет | Статус | Файл |
|------|-----------|--------|------|
| Tauri backend инициализация | 🔴 High | ✅ Ready | `backend-integration.spec.ts` |
| Проверка доступности Tauri API | 🔴 High | ✅ Ready | `backend-integration.spec.ts` |
| Команда `ai_director_get_capabilities` | 🔴 High | ✅ Ready | `backend-integration.spec.ts` |
| Команда `ai_director_get_default_config` | 🔴 High | ✅ Ready | `backend-integration.spec.ts` |
| Команда `ai_director_health_check` | 🟡 Medium | ✅ Ready | `backend-integration.spec.ts` |
| Настройка event listeners | 🔴 High | ✅ Ready | `backend-integration.spec.ts` |
| Навигация в AI Director UI | 🟡 Medium | ✅ Ready | `backend-integration.spec.ts` |
| Интеграция с media pool | 🟡 Medium | ✅ Ready | `backend-integration.spec.ts` |
| Проверка ошибок инициализации | 🟡 Medium | ✅ Ready | `backend-integration.spec.ts` |
| Сохранение состояния при навигации | 🟡 Medium | ✅ Ready | `backend-integration.spec.ts` |
| XState machine инициализация | 🔴 High | ✅ Ready | `backend-integration.spec.ts` |
| Comprehensive analysis workflow | 🔴 High | ⏳ Planned | - |
| Quick analysis workflow | 🔴 High | ⏳ Planned | - |
| Batch analysis для нескольких файлов | 🟡 Medium | ⏳ Planned | - |
| Real-time progress events | 🔴 High | ⏳ Planned | - |
| Scene detection интеграция | 🟡 Medium | ⏳ Planned | - |
| Audio quality analysis | 🟡 Medium | ⏳ Planned | - |
| Montage plan generation | 🟡 Medium | ⏳ Planned | - |
| Template-based montage | 🟡 Medium | ⏳ Planned | - |
| Export/import montage plans | 🟢 Low | ⏳ Planned | - |
| Error handling (файл не найден) | 🟡 Medium | ⏳ Planned | - |
| Отмена analysis job | 🟡 Medium | ⏳ Planned | - |

### Примечания
- ✅ **11 тестов уже реализованы** в `backend-integration.spec.ts`
- Тесты покрывают базовую инициализацию и проверку Tauri команд
- Требуется добавить тесты для полного workflow анализа
- Важно тестировать real-time события от backend

## License

Part of Timeline Studio project.
