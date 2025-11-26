# Motion Graphics

**English** | [Русский](./README.ru.md)

## Overview

Professional keyframe-based animation system for Timeline Studio enabling complex animations for object properties over time, similar to After Effects or other professional motion design tools.

## Status

- ✅ **Components**: Motion Graphics Panel, Curve Editor
- ✅ **Services**: Keyframe management, interpolation algorithms, expression engine
- ✅ **Integration**: Timeline clip integration with animation data
- ⚠️ **Tests**: 0 test files (manual and integration testing only)

## Structure

```
motion-graphics/
├── components/
│   ├── motion-graphics-panel.tsx  # Main control panel
│   └── curve-editor.tsx          # Visual curve editor
├── services/
│   ├── keyframe-manager.ts       # Keyframe CRUD operations
│   ├── interpolation.ts          # Interpolation algorithms
│   ├── expression-engine.ts      # JavaScript expression evaluator
│   ├── animation-layers.ts       # Layer management system
│   ├── preset-manager.ts         # Preset loading and management
│   └── timeline-integration.ts   # Timeline clip integration
├── types/
│   └── keyframe.ts              # TypeScript definitions
├── data/
│   └── motion-presets.json      # Built-in animation presets
└── hooks/
    └── use-motion-graphics.ts   # React hook for components
```

## Features

### ✅ Implemented

- [x] Keyframe-based animation system (create, edit, delete)
- [x] Multiple interpolation types (Linear, Bezier, Ease, Bounce, Elastic, Back, Expo, Hold)
- [x] JavaScript expression engine for procedural animation
- [x] Built-in expression functions (math, easing, noise, waves, vectors, colors)
- [x] Animation layer system with blending modes
- [x] Visual curve editor for precise control
- [x] Motion presets (text animations, transitions, transforms, effects, behaviors)
- [x] Timeline integration (apply animations to clips)
- [x] Real-time preview and playback
- [x] Copy/paste animations between clips
- [x] Import/export animation data

### ❌ Not Implemented

- [ ] Motion blur simulation
- [ ] Advanced easing curve editor UI
- [ ] Expression autocomplete
- [ ] Animation templates marketplace
- [ ] GPU acceleration for complex animations
- [ ] Motion capture data import

## Usage

### Basic Animation

```typescript
import { createKeyframe, addKeyframeToProperty } from '@/features/motion-graphics/services/keyframe-manager'

// Create opacity animation
const property: AnimatedProperty = {
  id: 'opacity',
  name: 'Opacity',
  path: 'opacity',
  type: 'number',
  keyframes: [],
  enabled: true
}

// Add keyframes
property = addKeyframeToProperty(property, createKeyframe(0, 0, 'ease-out'))
property = addKeyframeToProperty(property, createKeyframe(1, 1, 'linear'))
```

### Expression Engine

```typescript
import { ExpressionEvaluator } from '@/features/motion-graphics/services/expression-engine'

const evaluator = new ExpressionEvaluator()
const result = evaluator.evaluate(
  'value + sin(time * 2 * Math.PI) * 50',
  { time: 1.5, frame: 45, fps: 30, value: 100 }
)
```

### Timeline Integration

```typescript
import { applyMotionToClip } from '@/features/motion-graphics/services/timeline-integration'

// Add animation to clip
const animatedClip = applyMotionToClip(clip, animationTrack)

// Evaluate animation at specific time
const values = evaluateClipMotionAtTime(animatedClip, 1.5)
// Returns: { opacity: 0.75, position: [100, 200], ... }
```

## Interpolation Types

- **Linear** - Constant speed between keyframes
- **Bezier** - Smooth curves with customizable handles
- **Hold** - No interpolation (instant change)
- **Ease** - Smooth acceleration/deceleration
- **Ease In** - Start slow, end fast
- **Ease Out** - Start fast, end slow
- **Ease In Out** - Slow at both ends
- **Bounce** - Bouncing ball physics
- **Elastic** - Spring-like overshoot
- **Back** - Anticipation and overshoot
- **Expo** - Exponential acceleration

## Integration

- **Depends on**: React 19+, Canvas API (curve editor)
- **Used by**: Timeline clips requiring animations
- **Frontend-only**: No Tauri backend commands

## Testing

- **Total tests**: 0 test files
- **Testing approach**: Manual testing in Timeline Studio UI, integration testing with Timeline module, visual testing of animation output

Future test coverage should include:
- Keyframe interpolation algorithms
- Expression engine evaluation
- Preset application and customization
- Timeline integration

Run tests:
```bash
# No dedicated tests currently
bun run test src/features/motion-graphics
```

## Performance

- Expressions are compiled and cached
- Optimized interpolation algorithms
- Efficient layer compositing
- Only visible properties are evaluated
- Smart caching of computed values

## TODO / Roadmap

- [ ] Add comprehensive unit tests for interpolation algorithms
- [ ] Implement motion blur simulation
- [ ] Create advanced easing curve editor UI
- [ ] Add expression autocomplete and syntax highlighting
- [ ] Build animation templates marketplace
- [ ] Implement GPU acceleration for complex animations
- [ ] Add motion capture data import support
- [ ] Create visual regression tests for animations
