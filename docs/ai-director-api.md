# AI Director API Documentation

**Version**: 5.0-unified-rust
**Status**: Production Ready
**Last Updated**: November 3, 2025

## Overview

Timeline Studio's AI functionality has been migrated to a **unified Rust backend** (AI Director) with TypeScript bindings for frontend integration.

**⚠️ MIGRATION NOTICE**: Old TypeScript-based AI services (`domains/ai-services`) are deprecated. Use the new AI Director API instead.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (TypeScript)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   React Hooks (use-ai-director.ts)                   │  │
│  │   - Full type safety via Specta bindings             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                         Tauri IPC
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Rust)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AI Director Service                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  analyze_media_comprehensive()                  │  │  │
│  │  │                                                  │  │  │
│  │  │  1. Audio Analysis    (UnifiedAudioAnalyzer)   │  │  │
│  │  │  2. Scene Detection   (SceneEngine)            │  │  │
│  │  │  3. Vision Analysis   (VisionService)          │  │  │
│  │  │  4. Moment Detection  (MomentEngine)           │  │  │
│  │  │  5. Content Analysis  (ContentEngine)          │  │  │
│  │  │  6. Integration & Insights                      │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Backend (Rust)

```rust
use crate::analysis::services::ai_director::{AIDirector, AIDirectorConfig};

// Create AI Director instance
let director = AIDirector::new();

// Get default config for balanced mode
let config = AIDirectorConfig::balanced();

// Run comprehensive analysis
let result = director
    .analyze_media_comprehensive(&video_path, Some(config))
    .await?;

println!("Analysis complete! Found {} scenes", result.scene_analysis.total_scenes);
```

### Frontend (TypeScript/React)

```typescript
import { useAIDirector } from "@/features/ai-director"

function VideoAnalyzer() {
  const {
    state,
    analyzeComprehensive,
    getDefaultConfig
  } = useAIDirector()

  const handleAnalyze = async (videoPath: string) => {
    // Get balanced config
    const config = await getDefaultConfig("balanced")

    // Run analysis
    const result = await analyzeComprehensive(videoPath, config)

    console.log("Analysis complete:", result)
  }

  return (
    <div>
      <button onClick={() => handleAnalyze("/path/to/video.mp4")}>
        Analyze Video
      </button>

      {state.isAnalyzing && (
        <p>Progress: {state.analysisProgress}%</p>
      )}

      {state.currentResult && (
        <pre>{JSON.stringify(state.currentResult, null, 2)}</pre>
      )}
    </div>
  )
}
```

---

## API Reference

### Tauri Commands (7)

All commands are available through TypeScript bindings:

#### 1. `ai_director_analyze_comprehensive`

**Full comprehensive analysis with all engines.**

```typescript
import { commands } from "@/types/generated/tauri-bindings"

const result = await commands.aiDirectorAnalyzeComprehensive(
  "/path/to/video.mp4",
  {
    performance_mode: "Balanced",
    enable_audio_analysis: true,
    enable_scene_detection: true,
    enable_vision_analysis: true,
    enable_moment_detection: true,
    enable_content_classification: true,
    // ... other config options
  }
)
```

**Returns**: `ComprehensiveAnalysisResult`
- `analysis_status`: "Completed" | "PartiallyCompleted" | "Failed"
- `scene_analysis`: Scene detection results
- `vision_analysis`: Object/face detection results
- `moment_analysis`: Key moments
- `audio_analysis`: Audio metrics
- `content_analysis`: Content classification, mood, quality
- `performance`: Timing metrics
- `errors`: Array of error messages

---

#### 2. `ai_director_analyze_quick`

**Fast analysis (audio only, ~30 seconds).**

```typescript
const result = await commands.aiDirectorAnalyzeQuick("/path/to/video.mp4")
```

Equivalent to `analyze_comprehensive` with `Fast` preset mode.

---

#### 3. `ai_director_analyze_batch`

**Batch analysis of multiple files.**

```typescript
const results = await commands.aiDirectorAnalyzeBatch(
  ["/video1.mp4", "/video2.mp4", "/video3.mp4"],
  config // optional
)

// Returns array of ComprehensiveAnalysisResult
```

---

#### 4. `ai_director_get_default_config`

**Get preset configuration.**

```typescript
const fastConfig = await commands.aiDirectorGetDefaultConfig("fast")
const balancedConfig = await commands.aiDirectorGetDefaultConfig("balanced")
const qualityConfig = await commands.aiDirectorGetDefaultConfig("quality")
```

**Modes**:
- `"fast"`: Audio only (~30s)
- `"balanced"`: Audio + Scene + Vision + Moment (~2min)
- `"quality"`: All engines (~10min)
- `"custom"`: Default with all engines enabled

---

#### 5. `ai_director_validate_config`

**Validate configuration before analysis.**

```typescript
const validation = await commands.aiDirectorValidateConfig(config)

if (!validation.is_valid) {
  console.error("Config errors:", validation.errors)
  console.warn("Config warnings:", validation.warnings)
} else {
  console.log("Estimated time:", validation.estimated_time, "ms")
  console.log("Estimated memory:", validation.estimated_memory, "bytes")
}
```

---

#### 6. `ai_director_get_capabilities`

**Check system capabilities.**

```typescript
const capabilities = await commands.aiDirectorGetCapabilities()

console.log("Audio analysis:", capabilities.audio_analysis)
console.log("Scene detection:", capabilities.scene_detection)
console.log("GPU acceleration:", capabilities.gpu_acceleration)
```

---

#### 7. `ai_director_health_check`

**Health check for all engines.**

```typescript
const health = await commands.aiDirectorHealthCheck()

console.log("Overall status:", health.overall_status) // "healthy" | "warning" | "error"
console.log("Services:", health.services)
```

---

## React Hooks

### `useAIDirector()`

**Main hook for AI Director integration.**

```typescript
import { useAIDirector } from "@/features/ai-director"

const {
  // State
  state: {
    isAnalyzing: boolean,
    analysisProgress: number,
    currentResult: ComprehensiveAnalysisResult | null,
    error: string | null,
    lastAnalyzedPath: string | null
  },

  // Analysis methods
  analyzeComprehensive: (path: string, config?: AIDirectorConfig) => Promise<Result>,
  analyzeQuick: (path: string) => Promise<Result>,
  analyzeBatch: (paths: string[], config?) => Promise<Result[]>,

  // Configuration
  getDefaultConfig: (mode: "fast" | "balanced" | "quality") => Promise<Config>,
  validateConfig: (config: Config) => Promise<ValidationResult>,

  // System
  getCapabilities: () => Promise<Capabilities>,
  healthCheck: () => Promise<Health>,

  // State management
  clearAnalysis: () => void
} = useAIDirector()
```

---

## Configuration

### AIDirectorConfig

```typescript
interface AIDirectorConfig {
  // Performance mode
  performance_mode: "Fast" | "Balanced" | "Quality"

  // Engine toggles
  enable_audio_analysis: boolean
  enable_scene_detection: boolean
  enable_vision_analysis: boolean
  enable_face_detection: boolean
  enable_object_detection: boolean
  enable_moment_detection: boolean
  enable_content_classification: boolean
  enable_composition_analysis: boolean
  enable_mood_analysis: boolean
  enable_quality_analysis: boolean
  enable_emotion_analysis: boolean

  // Limits
  max_processing_time?: number // milliseconds
  quality_threshold: number // 0.0 - 1.0
  max_key_moments?: number

  // Features
  enable_caching: boolean
  generate_editing_recommendations: boolean
  enable_mcp_agents: boolean
}
```

### Preset Modes

| Mode | Time | Engines | Use Case |
|------|------|---------|----------|
| **Fast** | ~30s | Audio only | Quick preview |
| **Balanced** | ~2min | Audio + Scene + Vision + Moment + Content | Normal workflow |
| **Quality** | ~10min | All engines | Final export |

---

## Result Types

### ComprehensiveAnalysisResult

```typescript
interface ComprehensiveAnalysisResult {
  file_path: string
  duration: number
  analysis_status: "Completed" | "PartiallyCompleted" | "Failed"

  // Engine results
  scene_analysis?: SceneAnalysisResult
  vision_analysis?: VisionAnalysisResult
  moment_analysis?: MomentAnalysisResult
  audio_analysis?: AudioAnalysisResult
  content_analysis?: ContentAnalysisResult

  // Metadata
  performance?: PerformanceMetrics
  errors: string[]
  success_rate: number
}
```

### SceneAnalysisResult

```typescript
interface SceneAnalysisResult {
  scenes: SceneAnalysis[]
  total_scenes: number
  avg_scene_duration: number
  scene_types_distribution: Record<string, number>
}

interface SceneAnalysis {
  id: string
  file_id: string
  start_time: number
  end_time: number
  duration: number
  scene_type: "Intro" | "Action" | "Dialog" | "Transition" | "Ending"
  confidence: number
  key_frames: number[]
  description?: string
  visual?: VisualCharacteristics
  audio?: AudioCharacteristics
  objects: string[]
  persons: string[]
  transition?: SceneTransition
}
```

---

## Migration Guide

### From Old TypeScript Services

**Before (Deprecated):**
```typescript
// ❌ Old approach
import { SceneAnalysisEngine } from "@/domains/ai-services/services/engines/scene-analysis"
import { AIIntelligenceOrchestrator } from "@/domains/ai-services/services"

const engine = SceneAnalysisEngine.getInstance()
const result = await engine.analyzeScenes(mediaFile, options)
```

**After (New Rust Backend):**
```typescript
// ✅ New approach
import { useAIDirector } from "@/features/ai-director"

const { analyzeComprehensive } = useAIDirector()
const result = await analyzeComprehensive(videoPath)
```

### Migration Checklist

- [ ] Replace `SceneAnalysisEngine` → `useAIDirector().analyzeComprehensive()`
- [ ] Replace `ContentClassificationEngine` → AI Director content analysis
- [ ] Replace `MomentDetector` → AI Director moment analysis
- [ ] Update type imports from `@/types/generated/tauri-bindings`
- [ ] Remove old service imports from `@/domains/ai-services`
- [ ] Update tests to mock Tauri commands

---

## Best Practices

### 1. Use React Hooks

Always use the `useAIDirector` hook for consistency:

```typescript
// ✅ Correct
const { analyzeComprehensive } = useAIDirector()

// ❌ Avoid direct Tauri command calls
import { commands } from "@/types/generated/tauri-bindings"
```

### 2. Handle Errors

AI Director uses graceful degradation:

```typescript
const result = await analyzeComprehensive(videoPath)

if (result.analysis_status === "PartiallyCompleted") {
  console.warn("Some engines failed:", result.errors)
  // Still have partial results
}

if (result.success_rate < 0.5) {
  console.error("More than 50% of engines failed")
}
```

### 3. Use Appropriate Mode

Choose the right mode for your use case:

```typescript
// Quick preview
const fastResult = await analyzeQuick(videoPath)

// Normal editing
const config = await getDefaultConfig("balanced")
const result = await analyzeComprehensive(videoPath, config)

// Final export
const qualityConfig = await getDefaultConfig("quality")
const finalResult = await analyzeComprehensive(videoPath, qualityConfig)
```

### 4. Batch Processing

For multiple files, use batch analysis:

```typescript
const results = await analyzeBatch([
  "/video1.mp4",
  "/video2.mp4",
  "/video3.mp4"
], config)

// Process each result
results.forEach((result, index) => {
  console.log(`Video ${index + 1}: ${result.analysis_status}`)
})
```

---

## Performance

### Timing Benchmarks

| Mode | Video Length | Processing Time | Engines |
|------|--------------|-----------------|---------|
| Fast | 5 min | ~30s | Audio only |
| Balanced | 5 min | ~2min | 5 engines |
| Quality | 5 min | ~10min | All engines |

### Optimization Tips

1. **Use Caching**: Enable `enable_caching: true` in config
2. **Progressive Enhancement**: Start with Fast, upgrade to Balanced/Quality as needed
3. **Batch Processing**: Analyze multiple files in parallel
4. **Appropriate Thresholds**: Adjust `quality_threshold` based on needs

---

## Troubleshooting

### Common Issues

**Issue**: `ComprehensiveAnalysisResult` has `PartiallyCompleted` status

**Solution**: Check `errors` array for specific engine failures. Partial results are still usable.

---

**Issue**: Analysis taking too long

**Solution**: Use `Fast` mode or set `max_processing_time` limit:
```typescript
const config = {
  ...balancedConfig,
  max_processing_time: 120000 // 2 minutes
}
```

---

**Issue**: TypeScript type errors

**Solution**: Regenerate bindings:
```bash
cd src-tauri && cargo run --bin export_types
```

---

## Further Reading

- **Migration Guide**: `/docs/ru/05_development/ai-director-unified-migration-guide.md`
- **Architecture**: `/docs/ru/03_architecture/ai-director-architecture.md`
- **Usage Examples**: `/docs/ru/09_examples/ai-director-usage.md`
- **Legacy API**: `/docs/99_archive/ai-domains-api-legacy.md`

---

**Version**: 5.0-unified-rust
**Last Updated**: November 3, 2025
**Status**: Production Ready
