# AI Director Dashboard Integration Guide

**Version**: 1.0
**Status**: In Progress
**Created**: November 3, 2025

## Overview

This document describes the integration of the new **AI Director** backend with the existing **Analysis Dashboard** UI.

---

## Current Status

### ✅ Completed

#### Backend (Rust)
- [x] AI Director service with 4 engines (8,600+ lines of code)
- [x] 30 Tauri commands for analysis
- [x] Unified Audio Analyzer
- [x] Scene Engine (scene detection)
- [x] Moment Engine (key moments)
- [x] Content Engine (content classification)
- [x] Vision Service (object/face recognition)
- [x] Graceful degradation (partial results on errors)
- [x] 35+ unit tests
- [x] TypeScript bindings via Specta

#### Frontend Hooks
- [x] `useAIDirector()` - main hook for direct command calls
- [x] `useAIDirectorAnalysis()` - hook with real-time events
- [x] `AIDirectorProgress` - progress component
- [x] TypeScript types (76 KB of auto-generated bindings)

#### Documentation
- [x] API documentation (EN + RU, 1540+ lines)
- [x] Migration guide for old TypeScript services
- [x] Architecture documentation
- [x] Best practices and troubleshooting

### 🚧 In Progress

#### Analysis Dashboard Integration
- [ ] Update `use-analysis.ts` to use AI Director API
- [ ] Create mapping between old and new data types
- [ ] Add `/analysis` routing to the application
- [ ] Integrate dashboard with main navigation

---

## Architectural Differences

### Old Architecture (Project-based)

**File**: `/src/features/analysis-dashboard/hooks/use-analysis.ts`

```typescript
// Project-centric API
const {
  createProject,
  startAnalysis,
  getProject,
  getProjectScenes,
  getProjectMoments
} = useAnalysis()

// Workflow
1. createProject(name, config, files) → project_id
2. startAnalysis(project_id)
3. Poll getProgress(project_id) every 2 seconds
4. After completion: getProjectScenes(), getProjectMoments()
```

**Types**:
- `AnalysisProject` - project container
- `AnalysisConfig` - 20+ configuration parameters
- `AnalysisProgress` - project status
- `AnalysisScene` - detailed scene (30+ fields)
- `KeyMoment` - key moment (25+ fields)

**Tauri commands** (old, NOT implemented):
```rust
"create_analysis_project"
"get_analysis_project"
"start_project_analysis"
"get_analysis_project_progress"
"get_project_scenes"
"get_project_key_moments"
"get_project_statistics"
"search_project_data"
```

---

### New Architecture (AI Director)

**Files**:
- `/src/features/ai-director/hooks/use-ai-director.ts` - direct commands
- `/src/features/ai-director/hooks/use-ai-director-analysis.ts` - event-based

```typescript
// File-centric API with real-time events
const {
  analyzeComprehensive,
  analyzeQuick,
  analyzeBatch,
  state
} = useAIDirector()

// Workflow
1. analyzeComprehensive(videoPath, config) → ComprehensiveAnalysisResult
2. Real-time events via Tauri:
   - "analysis-started"
   - "analysis-progress" (automatic)
   - "analysis-stage-completed"
   - "analysis-completed"
   - "analysis-error"
```

**Types** (from TypeScript bindings):
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

**Tauri commands** (✅ implemented in Rust):
```rust
"ai_director_analyze_comprehensive"   // Full analysis
"ai_director_analyze_quick"           // Quick analysis (~30s)
"ai_director_analyze_batch"           // Batch analysis
"ai_director_get_default_config"      // Preset configurations
"ai_director_validate_config"         // Validation
"ai_director_get_capabilities"        // System capabilities
"ai_director_health_check"            // Health check
```

---

## Integration Strategy

### Option 1: Adapter (Recommended)

Create an adapter that transforms AI Director API into project-based interface.

**Advantages**:
- Minimal changes to UI components
- Backward compatibility
- Gradual migration

**File**: `/src/features/analysis-dashboard/hooks/use-analysis-adapter.ts`

```typescript
/**
 * Adapter between AI Director API and old project-based interface
 */
export function useAnalysisAdapter(): UseAnalysisReturn {
  const { analyzeComprehensive, state } = useAIDirector()

  // Emulate project storage via localStorage/indexedDB
  const [projects, setProjects] = useState<AnalysisProject[]>([])

  const createProject = async (name, description, config, files) => {
    const projectId = crypto.randomUUID()
    const project: AnalysisProject = {
      id: projectId,
      name,
      description,
      status: AnalysisStatus.Created,
      config: mapConfigToAIDirector(config),
      files,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setProjects(prev => [...prev, project])
    return projectId
  }

  const startAnalysis = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return false

    // Analyze each file via AI Director
    for (const file of project.files) {
      const result = await analyzeComprehensive(
        file.file_path,
        mapConfigToAIDirector(project.config)
      )

      // Save results to project storage
      await saveAnalysisResults(projectId, file.id, result)
    }

    return true
  }

  const getProjectScenes = async (projectId: string) => {
    const results = await loadAnalysisResults(projectId)

    // Transform SceneAnalysisResult → AnalysisScene[]
    return results.flatMap(result =>
      mapScenesToDashboardFormat(result.scene_analysis)
    )
  }

  const getProjectMoments = async (projectId: string) => {
    const results = await loadAnalysisResults(projectId)

    // Transform MomentAnalysisResult → KeyMoment[]
    return results.flatMap(result =>
      mapMomentsToDashboardFormat(result.moment_analysis)
    )
  }

  // ... other methods

  return {
    dashboardData,
    loading: state.isAnalyzing,
    error: state.error,
    createProject,
    startAnalysis,
    getProjectScenes,
    getProjectMoments,
    // ... other methods
  }
}

// Helper functions
function mapConfigToAIDirector(config: AnalysisConfig): AIDirectorConfig {
  return {
    performance_mode: config.quality_mode === QualityMode.Fast ? "Fast"
                    : config.quality_mode === QualityMode.Detailed ? "Quality"
                    : "Balanced",
    enable_audio_analysis: config.enable_audio_analysis,
    enable_scene_detection: config.enable_scene_detection,
    enable_vision_analysis: config.enable_object_detection || config.enable_person_recognition,
    enable_face_detection: config.enable_person_recognition,
    enable_object_detection: config.enable_object_detection,
    enable_moment_detection: true, // Always enabled
    enable_content_classification: true, // Always enabled
    enable_emotion_analysis: config.enable_emotion_analysis,
    max_processing_time: config.max_processing_time,
    quality_threshold: 0.5,
    enable_caching: true,
    generate_editing_recommendations: true,
    enable_mcp_agents: false,
  }
}

function mapScenesToDashboardFormat(sceneResult?: SceneAnalysisResult): AnalysisScene[] {
  if (!sceneResult?.scenes) return []

  return sceneResult.scenes.map(scene => ({
    id: scene.id,
    project_id: scene.file_id, // Use file_id as project_id
    file_id: scene.file_id,
    start_time: scene.start_time,
    end_time: scene.end_time,
    duration: scene.duration,
    scene_type: mapSceneType(scene.scene_type),
    confidence: scene.confidence,

    // Visual characteristics
    dominant_colors: scene.visual?.dominant_colors || [],
    brightness: scene.visual?.brightness || 0,
    contrast: scene.visual?.contrast || 0,
    saturation: scene.visual?.saturation || 0,
    motion_level: scene.visual?.motion_intensity || 0,
    composition_score: scene.visual?.composition_score || 0,
    rule_of_thirds_compliance: 0, // Not in AI Director
    visual_balance: 0, // Not in AI Director

    // Quality metrics
    quality_score: scene.visual?.quality_score || 0,
    sharpness: scene.visual?.sharpness || 0,
    noise_level: scene.visual?.noise_level || 0,
    stability: scene.visual?.stability || 0,

    // Objects & persons
    persons_present: scene.persons,
    objects_detected: scene.objects,
    has_text: false, // Not in AI Director
    has_faces: scene.persons.length > 0,

    // Audio characteristics
    emotional_tone: mapEmotionalTone(scene.audio?.dominant_emotions),
    energy_level: scene.audio?.energy || 0,

    // Metadata
    auto_description: scene.description,
    tags: [...scene.objects, ...scene.persons],
    representative_frame: scene.key_frames[0] || 0,
    keyframes: scene.key_frames,
    created_at: new Date().toISOString(),
  }))
}

function mapMomentsToDashboardFormat(momentResult?: MomentAnalysisResult): KeyMoment[] {
  if (!momentResult?.moments) return []

  return momentResult.moments.map(moment => ({
    id: crypto.randomUUID(),
    project_id: moment.file_id,
    file_id: moment.file_id,
    scene_id: moment.scene_id,
    timestamp: moment.timestamp,
    duration: moment.duration,
    moment_type: mapMomentType(moment.moment_type),
    importance_score: moment.importance_score,

    scoring_factors: {
      emotion_intensity: moment.scoring_factors.emotion_intensity,
      emotion_variety: moment.scoring_factors.emotion_variety,
      emotional_change: moment.scoring_factors.emotional_change,
      visual_quality: moment.scoring_factors.visual_quality,
      composition_quality: moment.scoring_factors.composition_quality,
      color_vibrancy: moment.scoring_factors.color_vibrancy,
      motion_interest: moment.scoring_factors.motion_interest,
      audio_clarity: moment.scoring_factors.audio_clarity,
      audio_dynamics: moment.scoring_factors.audio_dynamics,
      speech_quality: moment.scoring_factors.speech_quality,
      music_sync: moment.scoring_factors.music_sync,
      person_prominence: moment.scoring_factors.person_prominence,
      object_interest: moment.scoring_factors.object_interest,
      scene_uniqueness: moment.scoring_factors.scene_uniqueness,
      narrative_importance: moment.scoring_factors.narrative_importance,
      overall_quality: moment.scoring_factors.overall_quality,
      stability: moment.scoring_factors.stability,
      focus_quality: moment.scoring_factors.focus_quality,
      lighting_quality: moment.scoring_factors.lighting_quality,
      weighted_score: moment.scoring_factors.weighted_score,
      confidence: moment.scoring_factors.confidence,
      ranking_position: moment.scoring_factors.ranking_position,
    },

    description: moment.description,
    auto_description: moment.auto_description,
    involved_persons: moment.involved_persons,
    involved_objects: moment.involved_objects,
    associated_emotions: moment.associated_emotions,
    content_tags: moment.content_tags,
    mood_tags: moment.mood_tags,
    technical_tags: moment.technical_tags,
    is_bookmarked: moment.is_bookmarked,
    is_hidden: false,
    thumbnail_frame: moment.thumbnail_frame,
    preview_start: moment.preview_start,
    preview_end: moment.preview_end,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}

function mapSceneType(sceneType: string): SceneType {
  const mapping: Record<string, SceneType> = {
    "Intro": SceneType.Static,
    "Action": SceneType.Dynamic,
    "Dialog": SceneType.Medium,
    "Transition": SceneType.Static,
    "Ending": SceneType.Static,
  }
  return mapping[sceneType] || SceneType.Static
}

function mapMomentType(momentType: string): MomentType {
  const mapping: Record<string, MomentType> = {
    "HighEnergy": MomentType.ActionClimax,
    "EmotionalPeak": MomentType.EmotionalPeak,
    "DialogueHighlight": MomentType.DialogueHighlight,
    "VisuallyStunning": MomentType.VisualStunning,
    "AudioPeak": MomentType.AudioPeak,
    "QualityPeak": MomentType.QualityPeak,
  }
  return mapping[momentType] || MomentType.UserDefined
}

function mapEmotionalTone(emotions?: string[]): EmotionalTone | undefined {
  if (!emotions || emotions.length === 0) return undefined

  return {
    primary_emotion: emotions[0],
    intensity: 0.7, // Default
    confidence: 0.8, // Default
    secondary_emotions: emotions.slice(1).map(emotion => ({
      emotion,
      intensity: 0.5,
    })),
  }
}

// Storage helpers (can use IndexedDB or Tauri Store)
async function saveAnalysisResults(projectId: string, fileId: string, result: ComprehensiveAnalysisResult) {
  const key = `analysis_${projectId}_${fileId}`
  localStorage.setItem(key, JSON.stringify(result))
}

async function loadAnalysisResults(projectId: string): Promise<ComprehensiveAnalysisResult[]> {
  const results: ComprehensiveAnalysisResult[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(`analysis_${projectId}_`)) {
      const data = localStorage.getItem(key)
      if (data) {
        results.push(JSON.parse(data))
      }
    }
  }

  return results
}
```

---

### Option 2: Direct Migration (More Radical)

Completely rewrite Dashboard components to work directly with AI Director API.

**Advantages**:
- Clean architecture without legacy code
- Direct use of new features
- Fewer intermediate layers

**Disadvantages**:
- Requires rewriting all components
- Risk of breaking existing functionality
- More time for migration

---

## Implementation Plan (Option 1)

### Stage 1: Create Adapter ✅ NEXT

**Tasks**:
1. [ ] Create `use-analysis-adapter.ts`
2. [ ] Implement type mapping
3. [ ] Implement project storage (localStorage/IndexedDB)
4. [ ] Cover with tests

**Files**:
- `/src/features/analysis-dashboard/hooks/use-analysis-adapter.ts` - new
- `/src/features/analysis-dashboard/utils/type-mappers.ts` - new
- `/src/features/analysis-dashboard/utils/storage.ts` - new

### Stage 2: Update Dashboard Components

**Tasks**:
1. [ ] Update `analysis-dashboard.tsx` to use adapter
2. [ ] Update imports in other components
3. [ ] Test UI workflow

**Files to modify**:
- `/src/features/analysis-dashboard/components/analysis-dashboard.tsx`
- `/src/features/analysis-dashboard/components/create-project-dialog.tsx`
- `/src/features/analysis-dashboard/components/project-card.tsx`
- `/src/features/analysis-dashboard/components/scene-browser.tsx`
- `/src/features/analysis-dashboard/components/moment-browser.tsx`

### Stage 3: Add Routing

**Tasks**:
1. [ ] Create `/src/app/(app)/analysis/page.tsx`
2. [ ] Add to main navigation
3. [ ] Add breadcrumbs

**Files**:
- `/src/app/(app)/analysis/page.tsx` - new
- `/src/components/layout/main-nav.tsx` - update
- Navigation menu - update

### Stage 4: Testing and Documentation

**Tasks**:
1. [ ] E2E tests for workflow
2. [ ] Update User Guide
3. [ ] Update Screenshots

---

## Data Mapping

### Configuration

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `quality_mode` | `performance_mode` | Fast/Balanced/Quality |
| `enable_scene_detection` | `enable_scene_detection` | 1:1 |
| `enable_person_recognition` | `enable_face_detection` | Renamed |
| `enable_object_detection` | `enable_object_detection` | 1:1 |
| `enable_emotion_analysis` | `enable_emotion_analysis` | 1:1 |
| `enable_audio_analysis` | `enable_audio_analysis` | 1:1 |
| `enable_quality_analysis` | _(always enabled)_ | Removed |
| `enable_text_recognition` | _(not supported)_ | Future feature |
| `frame_skip` | _(internal logic)_ | Automatic |
| `resolution_scale` | _(internal logic)_ | Automatic |
| `use_gpu` | _(auto-detect)_ | Automatic |

### Scenes

| Old Field | New Field | Source |
|-----------|-----------|--------|
| `scene_type` | `scene_type` | SceneAnalysis |
| `confidence` | `confidence` | SceneAnalysis |
| `dominant_colors` | `dominant_colors` | SceneAnalysis.visual |
| `brightness` | `brightness` | SceneAnalysis.visual |
| `contrast` | `contrast` | SceneAnalysis.visual |
| `saturation` | `saturation` | SceneAnalysis.visual |
| `motion_level` | `motion_intensity` | SceneAnalysis.visual |
| `composition_score` | `composition_score` | SceneAnalysis.visual |
| `quality_score` | `quality_score` | SceneAnalysis.visual |
| `persons_present` | `persons` | SceneAnalysis |
| `objects_detected` | `objects` | SceneAnalysis |
| `emotional_tone` | `dominant_emotions` | SceneAnalysis.audio |
| `energy_level` | `energy` | SceneAnalysis.audio |
| `keyframes` | `key_frames` | SceneAnalysis |

**Missing fields in AI Director**:
- `rule_of_thirds_compliance` - may be added later
- `visual_balance` - may be added later
- `has_text` - Text Recognition (planned)
- `user_rating`, `user_description` - UI-only, store locally

### Moments

| Old Field | New Field | Source |
|-----------|-----------|--------|
| `moment_type` | `moment_type` | MomentAnalysis |
| `importance_score` | `importance_score` | MomentAnalysis |
| `scoring_factors.*` | `scoring_factors.*` | MomentAnalysis (1:1 mapping) |
| `description` | `description` | MomentAnalysis |
| `involved_persons` | `involved_persons` | MomentAnalysis |
| `involved_objects` | `involved_objects` | MomentAnalysis |
| `associated_emotions` | `associated_emotions` | MomentAnalysis |
| `content_tags` | `content_tags` | MomentAnalysis |
| `mood_tags` | `mood_tags` | MomentAnalysis |
| `technical_tags` | `technical_tags` | MomentAnalysis |

**Missing fields in AI Director**:
- `user_notes`, `user_rating` - UI-only, store locally
- `is_hidden` - UI-only

---

## Real-time Events

AI Director supports real-time events via Tauri:

```typescript
// In Dashboard component
const { isAnalyzing, currentProgress, errors } = useAIDirectorAnalysis()

// Events automatically update UI:
// - "analysis-started" → isAnalyzing = true
// - "analysis-progress" → currentProgress updates
// - "analysis-stage-completed" → show completed stage
// - "analysis-completed" → isAnalyzing = false, result ready
// - "analysis-error" → add to errors[]
```

**Progress by stages**:
1. **Initialization** (0-5%)
2. **Audio Analysis** (5-25%) - UnifiedAudioAnalyzer
3. **Scene Detection** (25-45%) - SceneEngine
4. **Vision Analysis** (45-65%) - VisionService
5. **Moment Detection** (65-85%) - MomentEngine
6. **Content Classification** (85-95%) - ContentEngine
7. **Integration** (95-100%) - Results aggregation

---

## Feature Differences

### ✅ New AI Director Features

1. **Graceful Degradation**
   - If one engine fails, others continue working
   - Returns `PartiallyCompleted` with available results
   - `success_rate` field shows % of successful engines

2. **Preset Configurations**
   - Fast (~30s) - audio only
   - Balanced (~2min) - audio + scenes + vision + moments
   - Quality (~10min) - all engines

3. **Batch Analysis**
   - `analyzeBatch([path1, path2, path3])` - parallel analysis

4. **Health Check**
   - Check availability of all engines
   - GPU acceleration status
   - System capabilities

5. **Extended Metrics**
   - Performance timing for each engine
   - Detailed scoring factors (20+ parameters)
   - Confidence scores for all detections

### ❌ Old API Features (Not Implemented in AI Director)

1. **Project Management**
   - No built-in project storage
   - No multi-file projects as single entity
   - Solution: Adapter with localStorage/IndexedDB

2. **User Annotations**
   - No `user_rating`, `user_notes`, `user_description`
   - Solution: Store locally in browser

3. **Text Recognition**
   - `enable_text_recognition` not implemented
   - Planned for future versions

4. **Search API**
   - `search_project_data()` not implemented
   - Solution: Client-side search over loaded data

---

## Usage Examples

### Create Project and Analyze

```typescript
import { useAnalysisAdapter } from "@/features/analysis-dashboard/hooks/use-analysis-adapter"

function CreateProjectDialog() {
  const { createProject, startAnalysis, getProjectScenes } = useAnalysisAdapter()

  const handleCreateAndAnalyze = async () => {
    // 1. Create project
    const projectId = await createProject(
      "My Video Analysis",
      "Test project",
      {
        enable_scene_detection: true,
        enable_person_recognition: true,
        enable_audio_analysis: true,
        quality_mode: QualityMode.Balanced,
        // ... other parameters
      },
      [
        { file_path: "/path/to/video1.mp4", /* ... */ },
        { file_path: "/path/to/video2.mp4", /* ... */ }
      ]
    )

    // 2. Start analysis (automatically calls AI Director for each file)
    await startAnalysis(projectId)

    // 3. Get results
    const scenes = await getProjectScenes(projectId)
    console.log("Found scenes:", scenes)
  }
}
```

### Display Progress

```typescript
import { AIDirectorProgress } from "@/features/ai-director/components/ai-director-progress"

function AnalysisDashboard() {
  return (
    <div>
      <AIDirectorProgress showOnlyWhenActive />
      {/* ... rest of UI */}
    </div>
  )
}
```

---

## Next Steps

1. ✅ **Create adapter** - `use-analysis-adapter.ts`
2. **Implement storage** - Project + Results storage
3. **Update Dashboard** - Use adapter
4. **Add routing** - `/analysis` route
5. **E2E tests** - Full workflow
6. **Documentation** - User guide with screenshots

---

## Questions and Solutions

### Q: Why do we need an adapter if there's a new AI Director API?

**A**: Analysis Dashboard already has complex UI with many components (ProjectCard, SceneBrowser, MomentBrowser, Statistics, etc.). The adapter allows using all this UI without rewriting, just swapping the data source.

### Q: Where to store projects?

**A**: Three options:
1. **localStorage** - simple solution for MVP
2. **IndexedDB** - for large data volumes
3. **Tauri Store** - for native persistent storage

Recommendation: Start with localStorage, migrate to Tauri Store.

### Q: How does real-time progress work?

**A**: AI Director emits Tauri events during analysis:
- Backend (Rust) → `emit("analysis-progress", {...})`
- Frontend → `listen("analysis-progress", callback)`
- Hook `useAIDirectorAnalysis` automatically subscribes to these events

### Q: What to do with missing features (text recognition, search)?

**A**:
- **Text Recognition**: Add to roadmap, disabled for now
- **Search**: Implement client-side search over loaded results

---

**Author**: AI Director Migration Team
**Document Version**: 1.0
**Last Updated**: November 3, 2025
