# Примеры миграции на WebGL2

Этот документ содержит практические примеры миграции со старых WebGL реализаций на новую унифицированную библиотеку WebGL2.

## Пример 1: Миграция Preview Renderer

### До (реализация WebGL1)

```typescript
// src/features/preview/services/preview-renderer.ts
import { createProgram, createShader } from "../utils/webgl-utils"

export class PreviewRenderer {
  private gl: WebGLRenderingContext
  
  constructor(config: PreviewConfig) {
    const gl = this.canvas.getContext("webgl")
    // Ручная компиляция шейдеров
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
    const program = createProgram(gl, vertexShader, fragmentShader)
  }
}
```

### После (WebGL2 с унифицированной библиотекой)

```typescript
// src/features/preview/services/webgl2-preview-renderer.ts
import { BaseRenderer, shaderPool, vaoManager } from "@/lib/webgl"

export class WebGL2PreviewRenderer extends BaseRenderer {
  protected async onInitialize(): Promise<void> {
    // Шейдеры управляются через shaderPool
    const program = shaderPool.getProgram("copy")
    
    // VAO для оптимальной производительности
    this.quadVAO = vaoManager.createQuadVAO(program)
  }
}
```

## Пример 2: Миграция Effects Processor

### До (Ручная настройка WebGL)

```typescript
// src/features/effects/services/unified-renderer.ts
export class UnifiedEffectsRenderer {
  private gl: WebGLRenderingContext | null = null
  
  private initializeWebGL(): void {
    this.canvas = document.createElement("canvas")
    this.gl = this.canvas.getContext("webgl")
    // Ручная настройка состояния
    this.gl.disable(this.gl.DEPTH_TEST)
    this.gl.enable(this.gl.BLEND)
  }
  
  private compileShaderProgram(effectId: string, processor: WebGLProcessor): WebGLProgram {
    // Ручная компиляция шейдеров
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource)
    // ... линковка и обработка ошибок
  }
}
```

### После (Использование библиотеки WebGL2)

```typescript
// src/features/effects/services/webgl2-effect-processor.ts
import { BaseRenderer, shaderPool } from "@/lib/webgl"

export class WebGL2EffectProcessor extends BaseRenderer {
  async compileEffect(effectId: string, shader: EffectShader): Promise<boolean> {
    // Автоматическая компиляция шейдеров с кэшированием
    const program = shaderPool.getProgram(effectId, {
      vertex: shader.vertexShader,
      fragment: shader.fragmentShader,
    })
    return program !== null
  }
}
```

## Пример 3: Использование нового хука

### До (Прямое использование WebGL1)

```typescript
// Компонент использующий старое превью
export function PreviewPanel() {
  const { canvasRef, isInitialized } = useRealtimePreview({
    cacheSize: 100,
  })
  
  // Ручной WebGL1 контекст
  const gl = canvas.getContext("webgl")
}
```

### После (WebGL2 хук)

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('WebglMigrationExamples')

// Компонент использующий новое WebGL2 превью
export function PreviewPanel() {
  const { canvasRef, isInitialized, gpuTier } = useWebGL2Preview({
    cacheSize: 100,
  })
  
  // Уровень GPU определяется автоматически
  logger.infoSync(`Работает на ${gpuTier} GPU`)
}
```

## Пример 4: Миграция шейдеров

### До (GLSL ES 1.0)

```glsl
// Вершинный шейдер
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}

// Фрагментный шейдер
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_texCoord);
}
```

### После (GLSL ES 3.0)

```glsl
// Вершинный шейдер
#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}

// Фрагментный шейдер
#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 fragColor;

void main() {
  fragColor = texture(u_texture, v_texCoord);
}
```

## Пример 5: Управление ресурсами

### До (Ручное управление)

```typescript
export class PreviewRenderer {
  private textures: WebGLTexture[] = []
  private frameBuffers: WebGLFramebuffer[] = []
  
  private createRenderTargets(): void {
    for (let i = 0; i < 3; i++) {
      const texture = createTexture(this.gl, width, height)
      this.textures.push(texture)
      
      const framebuffer = createFramebuffer(this.gl, texture)
      this.frameBuffers.push(framebuffer)
    }
  }
  
  dispose(): void {
    // Ручная очистка
    for (const texture of this.textures) {
      this.gl.deleteTexture(texture)
    }
  }
}
```

### После (Автоматическое управление)

```typescript
export class WebGL2PreviewRenderer extends BaseRenderer {
  protected async onInitialize(): Promise<void> {
    // Автоматическое управление ресурсами
    this.createFramebuffer("effect_ping", 1920, 1080)
    this.createFramebuffer("effect_pong", 1920, 1080)
  }
  
  // Очистка автоматическая в BaseRenderer
}
```

## Пример 6: Оптимизации производительности

### До (Без VAO)

```typescript
// Рисование без VAO
private renderFullscreenQuad(): void {
  const quadBuffer = this.gl.createBuffer()
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer)
  
  // Настройка атрибутов каждый кадр
  const positionLocation = this.gl.getAttribLocation(program, "a_position")
  this.gl.enableVertexAttribArray(positionLocation)
  this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0)
  
  const texCoordLocation = this.gl.getAttribLocation(program, "a_texCoord")
  this.gl.enableVertexAttribArray(texCoordLocation)
  this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8)
  
  this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
}
```

### После (С VAO)

```typescript
// Рисование с VAO
private renderWithVAO(): void {
  // Настройка VAO происходит один раз
  vaoManager.bindVAO(this.quadVAO)
  this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
  vaoManager.unbindVAO()
}
```

## Чек-лист миграции

- [ ] Заменить `WebGLRenderingContext` на `WebGL2RenderingContext`
- [ ] Обновить все шейдеры на GLSL ES 3.0
- [ ] Заменить ручную компиляцию шейдеров на `shaderPool`
- [ ] Использовать `BaseRenderer` для общей функциональности
- [ ] Реализовать VAO через `vaoManager`
- [ ] Обновить создание текстур/фреймбуферов на методы базового класса
- [ ] Удалить ручную очистку ресурсов (обрабатывается BaseRenderer)
- [ ] Протестировать на разных уровнях GPU (low/medium/high)

## Частые ошибки

1. **Забытая версия шейдера**: Всегда добавляйте `#version 300 es` в начало
2. **Старые функции текстур**: Замените `texture2D()` на `texture()`
3. **Отсутствующая выходная переменная**: Добавьте `out vec4 fragColor` в фрагментные шейдеры
4. **Обработка потери контекста**: BaseRenderer обрабатывает это автоматически
5. **Утечки ресурсов**: Используйте предоставленные методы управления ресурсами

## Преимущества производительности

После миграции вы должны увидеть:
- Снижение накладных расходов на вызовы отрисовки на 20-30% (VAO)
- Лучшее использование текстурной памяти (унифицированное управление)
- Более быстрая компиляция шейдеров (кэширование)
- Автоматическое определение уровня GPU и оптимизация
- Улучшенная стабильность с обработкой потери контекста