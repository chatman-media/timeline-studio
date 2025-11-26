# Motion Graphics Tests

Comprehensive test suite for the Motion Graphics feature.

## Test Coverage

This test suite covers all major functionality of the motion-graphics feature:

### Service Tests (Priority: Highest)

#### 1. **keyframe-manager.test.ts**
Tests for keyframe CRUD operations and management:
- Creating keyframes with various interpolation types
- Adding/removing/updating keyframes in properties
- Selecting and deselecting keyframes
- Moving, scaling, and transforming keyframes
- Copying and reversing keyframes
- Auto-generating keyframes for transitions
- Snapping to grid and frame boundaries
- Finding keyframes at specific times
- Merging overlapping keyframes
- Validating keyframe data integrity

**Coverage:** Core keyframe operations, animation curve creation, easing functions

#### 2. **interpolation.test.ts**
Tests for keyframe interpolation algorithms:
- Linear interpolation for numbers and vectors
- Hold (step) interpolation
- Easing functions (ease, ease-in, ease-out, ease-in-out)
- Advanced easing (bounce, elastic, expo, back)
- Bezier curve interpolation with control points
- Temporal easing in bezier mode
- Color interpolation (hex colors)
- Boolean value interpolation
- Value calculation at any time
- Velocity calculation
- Frame snapping
- Smooth transition generation

**Coverage:** All interpolation types, value types (number, vector, color, boolean), easing algorithms

#### 3. **expression-engine.test.ts**
Tests for JavaScript expression evaluation:
- Basic math expressions
- Built-in variables (time, frame, fps, value, velocity)
- Math functions (sin, cos, abs, sqrt, pow)
- Interpolation functions (linear, easeIn, easeOut)
- Noise and wave functions (sawtooth, triangle, square)
- Utility functions (clamp, map, smoothstep)
- Vector operations (vec2, vec3, vec4, length, normalize, dot)
- Color functions (rgb, hsl)
- Animation helpers (wiggle, loopIn, loopOut)
- Expression validation and syntax checking
- Auto-complete suggestions
- Pre-built expression presets (wiggle, bounce, sine, pulse, etc.)
- Error handling and fallback to current value

**Coverage:** Expression evaluation, built-in functions, expression presets, validation

#### 4. **animation-layers.test.ts**
Tests for layer management and composition:
- Creating animation layers and tracks
- Adding/removing/updating layers in tracks
- Reordering layers
- Evaluating layers at specific times
- Applying layer timing adjustments (offset, time scale)
- Blending layers with various blend modes (normal, add, multiply, screen, overlay)
- Layer opacity and visibility
- Solo and lock functionality
- Parent-child layer relationships
- Layer hierarchy management
- Duplicating and merging layers
- Animation state management
- Import/export layer data

**Coverage:** Layer composition, blend modes, timing controls, hierarchy

#### 5. **preset-manager.test.ts**
Tests for motion preset management:
- Loading preset categories and presets
- Searching presets by name, description, and tags
- Getting presets by ID or category
- Applying presets to create animation layers
- Scaling preset duration
- Customizing preset properties
- Creating custom presets from layers
- Combining multiple presets (sequential or overlay)
- Generating preset thumbnails
- Import/export presets as JSON
- Preset collections (essentials, advanced, text, transitions)
- Validating preset data structure

**Coverage:** Preset library, search, application, customization, collections

#### 6. **timeline-integration.test.ts**
Tests for integration with Timeline Studio:
- Adding motion graphics to timeline clips
- Applying presets to clips
- Evaluating motion at timeline time
- Getting keyframes for timeline display
- Updating motion properties
- Removing motion graphics from clips
- Copying motion graphics between clips
- Scaling motion duration
- Offsetting motion timing
- Import/export motion graphics data
- Motion graphics summary statistics
- Creating motion context for expressions

**Coverage:** Timeline integration, clip management, import/export

### Main Module Tests

#### 7. **index.test.ts**
Tests for module exports and helper functions:
- Version constant
- Default settings configuration
- Motion capabilities (limits, supported types, interpolation types, blend modes)
- Helper functions:
  - `createFadeAnimation()` - Create fade in/out animations
  - `createScaleAnimation()` - Create scale animations with bounce
  - `createSlideAnimation()` - Create position slide animations
  - `quickApplyPreset()` - Quick preset application
- Module exports verification (all services, components, types)

**Coverage:** Public API, helper functions, module structure

### Component Tests (Priority: Medium)

#### 8. **curve-editor.test.tsx**
Tests for visual keyframe editing component:
- Rendering curve editor UI
- Playback controls (play, pause, stop, skip)
- Canvas rendering
- Time slider interaction
- Displaying time information
- Interpolation type selector
- Curve list display
- Curve selection and highlighting
- Grid snapping
- Custom height
- Multiple curves rendering
- Empty state handling
- Mouse wheel zoom
- Zoom and pan reset

**Coverage:** UI rendering, user interactions, visual feedback

#### 9. **motion-graphics-panel.test.tsx**
Tests for main motion graphics panel:
- Panel rendering
- Playback controls
- Time slider
- Tab navigation (Presets, Layers, Properties)
- Search and filter functionality
- Grid/list view toggle
- Preset cards and application
- Layer list and selection
- Property display
- Empty states
- Toolbar buttons

**Coverage:** Main UI panel, navigation, preset browsing

## Running Tests

### Run all motion-graphics tests
```bash
bun run test src/features/motion-graphics
```

### Run specific test file
```bash
bun run test src/features/motion-graphics/__tests__/services/keyframe-manager.test.ts
```

### Run tests in watch mode
```bash
bun run test:watch src/features/motion-graphics
```

### Generate coverage report
```bash
bun run test:coverage src/features/motion-graphics
```

## Test Patterns

### Service Tests
- Use pure functions for easy testing
- Mock external dependencies (file system, Tauri API)
- Test edge cases and error handling
- Verify return types and data structures

### Component Tests
- Use Testing Library for React components
- Test user interactions and events
- Verify UI rendering and accessibility
- Mock child components when needed

### Test Data
- Create mock data using factory functions
- Use realistic values for keyframes and properties
- Test with empty, single, and multiple items

## Coverage Goals

Current target: **>90% coverage** for all services

- **Services**: >95% coverage (high priority)
- **Components**: >80% coverage (medium priority)
- **Types**: 100% (type checking only)

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should clearly describe what is being tested
3. **Completeness**: Cover success cases, edge cases, and error cases
4. **Maintainability**: Use helper functions and factories for common setup
5. **Performance**: Keep tests fast by avoiding unnecessary delays

## Related Documentation

- [Testing Strategy](../../../../docs/05_development/ru/testing-strategy.md)
- [Motion Graphics Overview](../README.md)
- [Keyframe Types](../types/keyframe.ts)
