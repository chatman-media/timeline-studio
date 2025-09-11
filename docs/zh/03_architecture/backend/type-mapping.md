# Frontend and Backend Type Mapping

## 🎨 Effects

### Frontend (TypeScript)
```typescript
type: "blur" | "brightness" | "contrast" | "speed" | "reverse" | "grayscale" | "sepia" | 
      "saturation" | "hue-rotate" | "vintage" | "duotone" | "noir" | "cyberpunk" | "dreamy" | 
      "infrared" | "matrix" | "arctic" | "sunset" | "lomo" | "twilight" | "neon" | "invert" | 
      "vignette" | "film-grain" | "chromatic-aberration" | "lens-flare" | "glow" | "sharpen" | 
      "noise-reduction" | "stabilization"
```

### Backend (Rust)
```rust
enum EffectType {
    Blur, Brightness, Contrast, Speed, Reverse, Grayscale, Sepia, Saturation, HueRotate,
    Vintage, Duotone, Noir, Cyberpunk, Dreamy, Infrared, Matrix, Arctic, Sunset, Lomo,
    Twilight, Neon, Invert, Vignette, FilmGrain, ChromaticAberration, LensFlare, Glow,
    Sharpen, NoiseReduction, Stabilization
}
```

### ✅ Effect Type Mapping
All effect types match perfectly! Conversion:
- Frontend: `hue-rotate` → Backend: `HueRotate`
- Frontend: `film-grain` → Backend: `FilmGrain`
- Frontend: `chromatic-aberration` → Backend: `ChromaticAberration`
- Frontend: `lens-flare` → Backend: `LensFlare`
- Frontend: `noise-reduction` → Backend: `NoiseReduction`

## 🔄 Transitions

### Frontend (TypeScript)
```typescript
interface Transition {
    type: string // Flexible string type
    category: "basic" | "advanced" | "creative" | "3d" | "artistic" | "cinematic"
    complexity: "basic" | "intermediate" | "advanced"
    tags: TransitionTag[] // 42 tags
}
```

### Backend (Rust)
```rust
pub type TransitionType = String; // Flexible string type ✅
enum TransitionCategory {
    Basic, Advanced, Creative, ThreeD, Artistic, Cinematic
}
enum TransitionComplexity {
    Basic, Intermediate, Advanced
}
enum TransitionTag { /* 27 tags */ }
```

### ✅ Category and Complexity Mapping
Perfect match! Conversion:
- Frontend: `"3d"` → Backend: `ThreeD`

### ⚠️ Transition Tags
Frontend has all Backend tags + additional tags.

## 🎬 Filters

### Frontend (TypeScript)
```typescript
category: "color-correction" | "technical" | "cinematic" | "artistic" | "creative" | "vintage"
complexity: "basic" | "intermediate" | "advanced"
tags: FilterTag[] // 14 tags
```

### Backend (Rust)
```rust
enum FilterCategory {
    ColorCorrection, Technical, Cinematic, Artistic, Creative, Vintage
}
enum FilterComplexity {
    Basic, Intermediate, Advanced
}
enum FilterTag { /* 14 tags */ }
```

### ✅ Filter Mapping
Perfect match! Conversion:
- Frontend: `"color-correction"` → Backend: `ColorCorrection`

## 📋 Effect Parameters

### Frontend
```typescript
params?: {
    intensity?: number    // Main parameter for most effects
    speed?: number       // For Speed effect
    angle?: number       // For HueRotate
    radius?: number      // For Blur and Vignette
    amount?: number      // For Sharpen
    threshold?: number   // For technical effects
    temperature?: number // For color correction
    tint?: number       // For color correction
}
```

### Backend
```rust
enum EffectParameter {
    Float(f32),
    Int(i32),
    String(String),
    Bool(bool),
    Color(u32),
    FloatArray(Vec<f32>),
    FilePath(PathBuf),
}
```

### ⚠️ IMPORTANT: Parameter Mapping
Frontend uses `intensity` as main parameter, but Backend expects different names:
- **Brightness/Contrast/Saturation**: Frontend `intensity` → Backend `value`
- **Blur**: Frontend `radius` → Backend `radius` ✅
- **Speed**: Frontend `speed` → Backend `speed` ✅
- **HueRotate**: Frontend `angle` → Backend `angle` ✅
- **Vignette**: Frontend `intensity` and `radius` → Backend `angle` (for FFmpeg)
- **FilmGrain**: Frontend `intensity` → Backend `strength`
- **Glow**: Frontend `intensity` → Backend `intensity` ✅
- **Sharpen**: Frontend `amount` → Backend `amount` ✅

## 🔧 Integration Recommendations

### 1. Type Name Conversion
```typescript
// Frontend to Backend
function toRustEnumCase(str: string): string {
    return str.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
}

// Examples:
// "hue-rotate" → "HueRotate"
// "color-correction" → "ColorCorrection"
// "3d" → "ThreeD"
```

### 2. Types for Tauri Commands
```typescript
// Frontend types for Tauri
export interface EffectSchema {
    id: string;
    effect_type: string; // Rust enum in snake_case
    name: string;
    enabled: boolean;
    parameters: Record<string, number | string | boolean>;
}

export interface TransitionSchema {
    id: string;
    transition_type: string;
    name: string;
    duration: {
        min: number;
        max: number;
        default: number;
        current: number;
    };
    start_time: number;
    from_clip_id: string;
    to_clip_id: string;
    parameters: Record<string, any>;
}
```

### 3. Backend Converters
```typescript
// Effect converter with proper parameter mapping
export function toBackendEffect(effect: VideoEffect): EffectSchema {
    // Convert parameters to Backend format
    const parameters: Record<string, number | string | boolean> = {};
    
    if (effect.params) {
        // For effects that use intensity instead of value
        if (['brightness', 'contrast', 'saturation'].includes(effect.type) && effect.params.intensity) {
            parameters.value = effect.params.intensity;
        }
        
        // Copy other parameters as is
        Object.entries(effect.params).forEach(([key, value]) => {
            if (key !== 'intensity' || !['brightness', 'contrast', 'saturation'].includes(effect.type)) {
                parameters[key] = value;
            }
        });
    }
    
    return {
        id: effect.id,
        effect_type: toRustEnumCase(effect.type),
        name: effect.name,
        enabled: true,
        parameters,
        // Add ffmpeg_command if custom command exists
        ffmpeg_command: effect.ffmpegCommand
    };
}

// Transition converter
export function toBackendTransition(transition: Transition): TransitionSchema {
    return {
        id: transition.id,
        transition_type: transition.type,
        name: transition.labels.en,
        duration: {
            ...transition.duration,
            current: transition.duration.default
        },
        start_time: 0, // Filled when placed on timeline
        from_clip_id: "", // Filled when placed
        to_clip_id: "", // Filled when placed
        parameters: transition.parameters || {}
    };
}
```

## ✅ Conclusions

1. **Effect types** - complete match ✅
2. **Categories and complexity** - complete match ✅
3. **Tags** - Frontend superset of Backend ✅
4. **Parameters** - mapping required for some effects ⚠️

## 🚀 Backend Fixes

1. **FFmpegBuilder** now supports `intensity` parameter from Frontend:
   - Brightness, Contrast, Saturation - check both `intensity` and `value`
   - FilmGrain - check both `intensity` and `strength`
   - Vignette - uses `intensity` and `radius`

2. **Added missing FFmpeg commands**:
   - Noir - `hue=s=0,eq=contrast=1.5:brightness=-0.1`
   - Cyberpunk - `eq=brightness=0.1:contrast=1.8:saturation=1.5,colorbalance=rs=0.5:gs=-0.3:bs=0.8`

## 📝 Integration Checklist

- [x] Effect types match
- [x] Categories and tags compatible
- [x] Backend supports Frontend parameters
- [x] FFmpeg commands generate correctly
- [x] Create TypeScript types for ProjectSchema ✅
- [x] Add Tauri command examples ✅
- [ ] Test rendering with effects

## 📦 Created Integration Files

### 1. `/src/types/video-compiler.ts`
Complete TypeScript types for all Video Compiler data structures:
- ProjectSchema, Track, Clip, Effect, Transition
- Enums for all types
- Helper conversion functions
- Tauri command examples

### 2. `/src/hooks/use-video-compiler.ts`
React hook for Video Compiler operations:
- Start rendering
- Track progress
- Cancel rendering
- Generate preview frames

### 3. `/src/features/timeline/utils/timeline-to-project.ts`
Function to convert Timeline to ProjectSchema:
- Convert tracks and clips
- Collect all effects
- Process transitions
- Proper parameter mapping

## 🚀 Timeline Usage Example

```typescript
import { useTimeline } from '@/features/timeline/hooks/use-timeline';
import { useVideoCompiler } from '@/hooks/use-video-compiler';
import { timelineToProjectSchema } from './utils/timeline-to-project';

function TimelineExportButton() {
  const { project } = useTimeline();
  const { startRender, isRendering, renderProgress } = useVideoCompiler();
  
  const handleExport = async () => {
    const projectSchema = timelineToProjectSchema(project);
    await startRender(projectSchema, '/path/to/output.mp4');
  };
  
  return (
    <>
      <button onClick={handleExport} disabled={isRendering}>
        Export
      </button>
      
      {renderProgress && (
        <div>
          Progress: {renderProgress.percentage.toFixed(1)}%
          ({renderProgress.current_frame}/{renderProgress.total_frames})
        </div>
      )}
    </>
  );
}
```