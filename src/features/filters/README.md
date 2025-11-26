# Filters

**English** | [Русский](./README.ru.md)

## Overview

CSS-based video filters system with real-time preview and hardware acceleration. Provides color correction, technical, cinematic, artistic, creative, and vintage filters. Supports multiple simultaneous filters, user presets, and FFmpeg export integration.

## Status

- ✅ **Components**: 3 components (FilterList, FilterGroup, FilterPreview)
- ✅ **Hooks**: 1 main hook (useFilters)
- ✅ **Utilities**: 2 utility modules (filter-processor, css-filters)
- ✅ **Tests**: Comprehensive component and hook testing
- ✅ **Status**: Production ready

## Structure

```
filters/
├── components/
│   ├── filter-list.tsx
│   ├── filter-group.tsx
│   └── filter-preview.tsx
├── hooks/
│   └── use-filters.ts
├── utils/
│   ├── filter-processor.ts
│   └── css-filters.ts
├── data/
│   └── filters.ts
├── types/
│   └── filters.ts
└── __tests__/
    ├── filter-list.test.tsx
    └── filter-preview.test.tsx
```

## Features

### ✅ Implemented

**CSS-based Filters**
- [x] Brightness - Adjust image brightness (0-200%)
- [x] Contrast - Control contrast levels (0-200%)
- [x] Saturation - Modify color saturation (0-200%)
- [x] Hue Rotate - Shift color hues (0-360°)
- [x] Blur - Apply Gaussian blur (0-20px)
- [x] Sepia - Add vintage sepia tone (0-100%)
- [x] Grayscale - Convert to grayscale (0-100%)
- [x] Invert - Invert colors (0-100%)
- [x] Opacity - Control transparency (0-100%)

**Core Features**
- [x] Real-time preview with instant visual feedback
- [x] Multiple filters - apply multiple filters simultaneously
- [x] User presets - save and load custom filter combinations
- [x] Hardware acceleration - CSS filters leveraging GPU
- [x] Type-safe - Full TypeScript support
- [x] Performance optimized - Hardware-accelerated rendering

**Integration**
- [x] Timeline integration - apply filters to timeline clips
- [x] Video Player integration - real-time filter rendering
- [x] Effects System integration - combine with effects

### ❌ Not Implemented

- [ ] Advanced filter curves and color grading
- [ ] Custom LUT (Look-Up Table) import
- [ ] Filter keyframe animation

## Usage

### Basic Filter Usage

```typescript
import { useFilters } from '@/features/filters/hooks/use-filters'

function MyComponent() {
  const { filters, applyFilter, removeFilter } = useFilters()

  // Apply a filter
  applyFilter('brightness', { value: 120 })

  // Remove a filter
  removeFilter('brightness')

  return (
    <div>
      {/* Your component */}
    </div>
  )
}
```

### Filter List Component

```typescript
import { FilterList } from '@/features/filters/components/filter-list'

function MyFilterPanel() {
  return <FilterList />
}
```

### CSS Filter String Generation

```typescript
import { generateCSSFilter } from '@/features/filters/utils/css-filters'

const filters = [
  { type: 'brightness', value: 120 },
  { type: 'contrast', value: 110 },
  { type: 'saturation', value: 130 }
]

const cssFilter = generateCSSFilter(filters)
// Returns: "brightness(120%) contrast(110%) saturate(130%)"
```

## Integration

- **Depends on**: None (pure frontend implementation)
- **Used by**: `@/features/timeline`, `@/features/video-player`

## Testing

- **Unit tests**: Comprehensive component and hook testing
- **Coverage**: High test coverage for core functionality
- **Test utilities**: Mocked data and helpers
- **Run tests**: `bun test src/features/filters`

## Performance

**Hardware Acceleration**
- CSS filters leverage GPU for real-time processing
- Minimal CPU overhead for filter application
- Instant visual feedback with no lag

**Optimizations**
- Efficient CSS filter string generation
- Memoized filter calculations
- Optimized re-renders with React hooks

## Design Principles

1. **Performance First**: Leverage CSS filters for hardware acceleration
2. **User Experience**: Intuitive controls with instant visual feedback
3. **Composability**: Stack multiple filters for complex effects
4. **Type Safety**: Full TypeScript coverage for reliability
5. **Testability**: Comprehensive test coverage for stability

## TODO / Roadmap

- [ ] Advanced color grading with curves
- [ ] Custom LUT (Look-Up Table) import and application
- [ ] Filter keyframe animation for timeline
- [ ] Filter templates and presets library
- [ ] Advanced filter blending modes
- [ ] E2E tests - comprehensive test suite (see E2E Tests section in old README)

## Documentation

- **README.md** - This file (EN)
- **README.ru.md** - Russian version
- **DEV.md** - Developer guide and implementation details
