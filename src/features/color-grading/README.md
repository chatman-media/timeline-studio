# Color Grading

**English** | [Русский](./README.ru.md)

## Overview

Professional color correction system integrated into Timeline Studio's Options panel. Provides DaVinci Resolve-level color correction capabilities including Color Wheels, RGB curves, HSL adjustments, LUT support, and professional scopes.

## Status

- ✅ **Components**: Complete UI with color wheels, curves, HSL, LUT, and scopes
- ✅ **Hooks**: Centralized state management with useColorGrading hook
- ✅ **Services**: Frontend-only, CSS filters and canvas processing
- ✅ **Tests**: Unit tests for hooks and state management

## Structure

```
color-grading/
├── components/
│   ├── color-settings.tsx              # Main panel in Options
│   ├── color-wheels/
│   │   ├── color-wheel.tsx             # Interactive SVG color wheel
│   │   └── color-wheels-section.tsx    # Lift/Gamma/Gain/Offset section
│   ├── curves/
│   │   ├── curve-editor.tsx            # SVG curve editor with Bézier
│   │   └── curves-section.tsx          # RGB and tonal curves
│   ├── hsl/
│   │   └── hsl-section.tsx             # Temperature, Tint, Contrast, etc.
│   ├── lut/
│   │   └── lut-section.tsx             # LUT management and preview
│   ├── scopes/
│   │   ├── waveform-scope.tsx          # Luminance analysis
│   │   ├── vectorscope-scope.tsx       # Color distribution
│   │   ├── histogram-scope.tsx         # RGB channel distribution
│   │   ├── scope-viewer.tsx            # Scope container
│   │   └── scopes-section.tsx
│   └── controls/
│       ├── parameter-slider.tsx        # Reusable slider
│       └── color-grading-controls.tsx
├── hooks/
│   └── use-color-grading.ts            # Main state management hook
└── __tests__/                          # Test files
```

## Features

### ✅ Implemented

- [x] **Color Wheels**: Interactive Lift/Gamma/Gain/Offset with drag & drop
- [x] **RGB Curves**: Master and RGB channel curves with Bézier interpolation
- [x] **HSL Adjustments**: Temperature, Tint, Contrast, Saturation, Hue, Luminance
- [x] **LUT Support**: Import .cube files, built-in presets (Film, Creative, Technical)
- [x] **Professional Scopes**: Waveform, Vectorscope, Histogram with configurable refresh rates
- [x] **Real-time Preview**: Live preview integration with video player
- [x] **Localization**: Support for English and Russian

### ❌ Not Implemented

- [ ] Apply color grading to timeline clips
- [ ] Save/load custom presets
- [ ] Keyframe animation support
- [ ] A/B comparison mode
- [ ] GPU acceleration via WebGL shaders
- [ ] HSL secondary curves
- [ ] Qualifier/mask system
- [ ] Power windows
- [ ] HDR support
- [ ] Export grade as LUT

## Usage

### Integration with Options Panel

```typescript
import { ColorSettings } from "@/features/color-grading/components/color-settings"

// In options.tsx
{activeTab === "color" && <ColorSettings />}
```

### Using the Hook

```typescript
import { useColorGrading } from "@/features/color-grading/hooks/use-color-grading"

function MyComponent() {
  const {
    state,
    updateColorWheel,
    updateBasicParameter,
    updateCurve,
    loadLUT,
    resetAll,
    hasChanges
  } = useColorGrading()

  // Update color wheel
  updateColorWheel("lift", { r: 10, g: 20, b: 30 })

  // Update temperature
  updateBasicParameter("temperature", 50)

  // Load LUT
  loadLUT("film-kodak-2383")
}
```

### Dispatch Pattern

```typescript
dispatch({
  type: "UPDATE_CURVE",
  curve: "master",
  points: curvePoints
})

dispatch({
  type: "TOGGLE_SCOPE",
  scopeType: "waveform",
  enabled: true
})
```

## Integration

- **Depends on**:
  - `@/features/options` - Options panel integration
  - `@/i18n` - Localization
  - `@tauri-apps/api` - File dialog for LUT import
  - Canvas API - Scopes rendering
  - SVG - Interactive graphics

- **Used by**:
  - `@/features/media-studio` - Main interface
  - `@/features/video-player` - Preview integration

## Testing

Run tests:
```bash
bun run test src/features/color-grading/__tests__/hooks/use-color-grading.test.ts
```

### Test Coverage
- ✓ State initialization
- ✓ Color wheel updates
- ✓ Basic parameter changes
- ✓ Curve manipulation
- ✓ LUT operations
- ✓ Scope controls
- ✓ Reset functionality
- ✓ Dispatch action handling

## Performance Considerations

### Scopes Optimization
- Canvas rendering uses requestAnimationFrame
- Configurable refresh rates (15/30/60 FPS)
- Video frame sampling at reduced resolution (0.5x scale)
- Efficient pixel data processing with typed arrays

### LUT Processing
- Trilinear interpolation for real-time color transformation
- Cached LUT data structures
- Intensity blending for performance

### State Updates
- Memoized calculations with useMemo
- Batched state updates via dispatch
- Debounced slider inputs

## E2E Tests

**Location**: `e2e/tauri/features/color-grading/`

**Status**: ⏳ Planned (0 tests implemented)

### Planned
- ⏳ Initialize Color Grading in Options panel
- ⏳ Color Wheels interactive control
- ⏳ RGB Curves editor with add/remove points
- ⏳ HSL parameters control
- ⏳ Import .cube LUT files via Tauri dialog
- ⏳ Built-in LUT presets selection
- ⏳ LUT intensity control
- ⏳ Waveform/Vectorscope/Histogram display
- ⏳ Scopes refresh rate settings
- ⏳ Apply to selected clip
- ⏳ Save/load presets
- ⏳ Real-time preview updates

## TODO / Roadmap

- [ ] Implement timeline clip integration
- [ ] Add custom preset save/load functionality
- [ ] Implement keyframe animation for color grading
- [ ] Add A/B comparison mode
- [ ] GPU acceleration via WebGL shaders
- [ ] Add HSL secondary curves
- [ ] Implement qualifier/mask system
- [ ] Add power windows
- [ ] HDR support
- [ ] Export grade as LUT file
- [ ] Complete E2E tests
- [ ] Add more built-in LUT presets
- [ ] Implement color match feature
- [ ] Add split-screen before/after view

## Technical Details

### Color Wheels
- Interactive SVG-based wheels
- Drag & drop functionality with visual feedback
- Real-time value updates
- Reset functionality per wheel

### Curves Editor
- Master and RGB channel curves
- Interactive point manipulation
- Bézier curve interpolation for smooth gradients
- Add/remove points with click/double-click
- Grid overlay for precision

### LUT System
- Import .cube files via Tauri dialog
- Built-in LUT presets in three categories:
  - Film emulation (Kodak, Fuji, etc.)
  - Creative looks (Orange & Teal, Vintage, etc.)
  - Technical (S-Log to Rec.709, etc.)
- Intensity control (0-100%)
- Trilinear interpolation for smooth application

### Professional Scopes
- **Waveform**: ITU-R BT.709 luminance calculation with RGB parade
- **Vectorscope**: YUV color space visualization with skin tone line
- **Histogram**: RGB channel distribution with transparency layers
- Canvas-based rendering for performance
- Configurable refresh rates (15/30/60 FPS)
- Full-screen viewing mode

## License

Part of Timeline Studio - see root project license.
