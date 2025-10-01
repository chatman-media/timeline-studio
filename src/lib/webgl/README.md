# WebGL2 Library - Unified WebGL2 Library

Unified WebGL2 library for Timeline Studio, providing high-performance GPU-accelerated video rendering with effects.

**🌐 Languages:** [English](./README_EN.md) | [Русский](./README.md)

## 🚀 Features

- **WebGL2**: Full support for modern WebGL2 API
- **GPU Tier Detection**: Automatic GPU performance detection (low/medium/high)
- **Context Manager**: Centralized WebGL2 context management
- **Shader Pool**: Caching and reuse of compiled shaders
- **VAO Manager**: Efficient Vertex Array Objects management
- **Event-driven**: Event-based architecture
- **Type-safe**: Full TypeScript typing

## 📁 Structure

```
src/lib/webgl/
├── context-manager.ts     # Central WebGL2 context manager
├── shader-pool.ts         # Shader pool for optimization
├── vao-manager.ts         # Vertex Array Objects manager
├── base-renderer.ts       # Base class for all renderers
├── utils.ts              # WebGL2 utilities
├── types.ts              # TypeScript types
├── index.ts              # Main export
└── __tests__/            # Module tests
```

## 🏗️ Architecture

### ContextManager
Singleton for managing WebGL2 contexts with automatic GPU capabilities detection:

```typescript
import { contextManager } from '@/lib/webgl'

// Initialize context
const success = contextManager.initialize({ canvas })

// Get GPU capabilities
const capabilities = contextManager.getCapabilities()
console.log(capabilities.tier) // "low" | "medium" | "high"

// Resize canvas
contextManager.resize(1920, 1080)

// Events
contextManager.on('contextLost', () => console.log('Context lost'))
contextManager.on('contextRestored', () => console.log('Context restored'))
```

### ShaderPool
Efficient shader caching and management:

```typescript
import { shaderPool } from '@/lib/webgl'

// Get built-in shader
const copyProgram = shaderPool.getProgram("copy")

// Create custom shader
const customProgram = shaderPool.getProgram("myShader", {
  vertex: vertexShaderSource,
  fragment: fragmentShaderSource
})

// Get uniform/attribute locations
const uTexture = shaderPool.getUniformLocation(program, "u_texture")
const aPosition = shaderPool.getAttributeLocation(program, "a_position")

// Release resources
shaderPool.releaseProgram("myShader")
```

### VAOManager
Vertex Array Objects management for rendering optimization:

```typescript
import { vaoManager } from '@/lib/webgl'

// Create VAO for fullscreen quad
const quadVAO = vaoManager.createQuadVAO(program)

// Use VAO
vaoManager.bindVAO(quadVAO)
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
vaoManager.unbindVAO()

// Release resources
vaoManager.releaseVAO(quadVAO)
```

### BaseRenderer
Base class for creating renderers:

```typescript
import { BaseRenderer } from '@/lib/webgl'

class MyRenderer extends BaseRenderer {
  protected async onInitialize(): Promise<void> {
    // Renderer-specific initialization
    const program = shaderPool.getProgram("myShader")
    this.quadVAO = vaoManager.createQuadVAO(program)
  }

  public render(deltaTime: number): void {
    if (!this.gl) return
    
    // Rendering logic
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    // ...
  }
}
```

## 🚀 Quick Start

1. **Initialize context:**
```typescript
import { contextManager } from '@/lib/webgl'

const canvas = document.createElement('canvas')
const success = contextManager.initialize({ canvas })

if (success) {
  console.log('WebGL2 initialized successfully')
}
```

2. **Create simple renderer:**
```typescript
import { BaseRenderer, shaderPool, vaoManager } from '@/lib/webgl'

class SimpleRenderer extends BaseRenderer {
  private quadVAO: WebGLVertexArrayObject | null = null

  protected async onInitialize(): Promise<void> {
    const program = shaderPool.getProgram("copy")
    if (program) {
      this.quadVAO = vaoManager.createQuadVAO(program)
    }
  }

  public render(): void {
    if (!this.gl || !this.quadVAO) return
    
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    vaoManager.bindVAO(this.quadVAO)
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
    vaoManager.unbindVAO()
  }
}

// Usage
const renderer = new SimpleRenderer({ name: 'simple', canvas })
await renderer.initialize()
renderer.render()
```

## 🎨 Built-in Shaders

The library includes a set of optimized shaders for common tasks:

- **copy**: Simple texture copy
- **blend**: Blend two textures
- **colorCorrection**: Color correction (HSL, RGB)
- **gaussianBlur**: Gaussian blur

```typescript
// Using built-in shaders
const copyProgram = shaderPool.getProgram("copy")
const blurProgram = shaderPool.getProgram("gaussianBlur")
```

## 🔧 GPU Tier Detection

Automatic GPU performance detection for quality optimization:

```typescript
const capabilities = contextManager.getCapabilities()

switch (capabilities.tier) {
  case "high":
    // Maximum quality
    quality = { resolution: 1.0, effects: "all", antialiasing: true }
    break
  case "medium":
    // Balanced quality
    quality = { resolution: 0.75, effects: "all", antialiasing: true }
    break
  case "low":
    // Performance priority
    quality = { resolution: 0.5, effects: "basic", antialiasing: false }
    break
}
```

## 📊 Events

The library supports events for responding to context changes:

```typescript
contextManager.on('contextLost', () => {
  console.log('WebGL context lost - pausing rendering')
})

contextManager.on('contextRestored', () => {
  console.log('WebGL context restored - resuming rendering')
  // Reload resources
})

contextManager.on('resize', ({ width, height, dpr }) => {
  console.log(`Canvas resized: ${width}x${height} (DPR: ${dpr})`)
})
```

## 🧪 Testing

Run tests:
```bash
bun run test src/lib/webgl/__tests__/
```

Tests cover:
- ✅ ContextManager initialization
- ✅ GPU capabilities detection
- ✅ Shader compilation and caching
- ✅ VAO management
- ✅ Context loss handling
- ✅ Resource cleanup

## 🔄 Migration from WebGL1

If you're migrating from WebGL1, see the [migration guide](../../../docs/05_development/webgl-migration-guide.md).

## 📚 API Reference

### ContextManager
- `initialize(options)` - Initialize WebGL2 context
- `getContext()` - Get current context
- `getCapabilities()` - Get GPU capabilities
- `resize(width, height)` - Resize canvas
- `dispose()` - Cleanup resources

### ShaderPool
- `getProgram(name, source?)` - Get shader program
- `releaseProgram(name)` - Release program
- `getUniformLocation(program, name)` - Get uniform location
- `getAttributeLocation(program, name)` - Get attribute location
- `clear()` - Clear all programs

### VAOManager
- `createQuadVAO(program)` - Create quad VAO
- `createVAO(program, attributes)` - Create custom VAO
- `bindVAO(vao)` - Bind VAO
- `unbindVAO()` - Unbind VAO
- `releaseVAO(vao)` - Release VAO

## 🤝 Contributing

When adding new features:
1. Follow existing architecture patterns
2. Add TypeScript types
3. Cover code with tests
4. Update documentation

## 📄 License

Part of Timeline Studio - see root project license.