# Примеры дублирования кода в модулях Timeline, Effects и Preview

## 1. Дублирование систем рендеринга эффектов

### 1.1 EffectsPreviewService (video-player)

```typescript
// src/features/video-player/services/effects-preview.ts
private loadEffectShaders(): void {
  // Brightness/Contrast
  this.effectShaders.set("brightness-contrast", {
    fragmentShader: `#version 300 es
      uniform float u_brightness;
      uniform float u_contrast;
      
      void main() {
        vec4 color = texture(u_texture, v_texCoord);
        color.rgb += u_brightness;
        color.rgb = ((color.rgb - 0.5) * u_contrast) + 0.5;
        fragColor = color;
      }
    `,
    uniforms: {
      u_brightness: { type: "float", value: 0.0 },
      u_contrast: { type: "float", value: 1.0 },
    },
  })
}

async applyEffect(
  video: HTMLVideoElement,
  effectId: string,
  parameters: Record<string, any>,
  outputCanvas: HTMLCanvasElement,
): Promise<boolean> {
  // 600+ строк WebGL кода
}
```

### 1.2 WebGL2UnifiedRenderer (effects)

```typescript
// src/features/effects/services/webgl2-unified-renderer.ts
// Практически идентичная функциональность, но другая реализация
async renderEffectStack(
  appliedEffects: AppliedEffect[],
  effectsMap: Map<string, BaseEffect>,
  context: RenderContext
): Promise<RenderResult> {
  // Другая реализация того же самого
}
```

**Проблема**: Две независимые системы делают одно и то же - рендерят эффекты через WebGL.

## 2. Дублирование маппинга эффектов

### 2.1 UnifiedEffectsBridge

```typescript
// src/features/preview/services/unified-effects-bridge.ts
function getPreviewTypeFromEffect(effect: BaseEffect): EffectType {
  if (effect.id.includes("blur")) return "blur"
  if (effect.id.includes("sharpen")) return "sharpen"
  if (effect.id.includes("glow")) return "glow"
  // ... еще 10+ условий
}

private convertParameters(type: EffectType, params: Record<string, any>): Record<string, any> {
  switch (type) {
    case "color_correction":
      return {
        brightness: params.brightness ?? params.luminance ?? 0,
        contrast: params.contrast ?? 1,
        // ... маппинг параметров
      }
    // ... еще 15+ case блоков
  }
}
```

### 2.2 EffectsPlayerIntegration

```typescript
// src/features/timeline/services/effects-player-integration.ts
// Похожий маппинг, но немного другой
getFFmpegCommands(clip: TimelineClip): string[] {
  for (const appliedEffect of activeEffects) {
    const params = {
      ...baseEffect.defaultParams,
      ...appliedEffect.parameters,
    }
    // Дублирование логики преобразования параметров
  }
}
```

**Проблема**: Каждый модуль имеет свою логику преобразования параметров эффектов.

## 3. Дублирование хуков для эффектов

### 3.1 useTimelineEffects

```typescript
// src/features/timeline/hooks/use-timeline-effects.ts
export function useTimelineEffects() {
  const applyEffect = useCallback(
    async (clipId: string, effectId: string, params?: Record<string, any>) => {
      await addEffectToClip(project, clipId, effectId)
      await saveProject()
    },
    [project, saveProject],
  )
  
  const getClipEffects = useCallback(
    (clipId: string) => {
      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))
      
      const clip = allClips.find((c) => c.id === clipId)
      return clip?.effects || []
    },
    [project],
  )
}
```

### 3.2 useEffectsPreview

```typescript
// src/features/timeline/hooks/use-effects-preview.ts
export function useEffectsPreview(options: UseEffectsPreviewOptions = {}) {
  const setClip = useCallback(
    (clip: TimelineClip | null) => {
      currentClipRef.current = clip
      integrationRef.current.setCurrentClip(clip)
      // Похожая логика работы с клипами
    },
    [isProcessing, autoStart],
  )
}
```

### 3.3 useUnifiedEffects

```typescript
// src/features/effects/hooks/use-unified-effects.ts
export function useUnifiedEffects(
  targetId: string,
  targetType: EffectScope,
  options: UseUnifiedEffectsOptions = {},
) {
  const applyEffect = useCallback(
    (effectId: string, options: {...} = {}): AppliedEffect => {
      const appliedEffect = effectManager.current.applyEffect(effectId, targetId, targetType, options)
      updateEffectsState()
      return appliedEffect
    },
    [targetId, targetType, updateEffectsState],
  )
}
```

**Проблема**: Три разных хука делают похожие вещи - управляют эффектами, но с разными интерфейсами.

## 4. Дублирование типов состояния

### 4.1 Timeline AppliedEffect

```typescript
// src/features/timeline/types/timeline.ts
export interface AppliedEffect {
  id: string
  effectId: string
  startTime?: number
  duration?: number
  customParams?: Record<string, any>
  enabled: boolean
  order: number
}
```

### 4.2 Effects AppliedEffect

```typescript
// src/features/effects/types/unified-effects.ts
export interface AppliedEffect {
  id: string
  effectId: string
  enabled: boolean
  order: number
  parameters: AppliedEffectParameter[]
  keyframes: Record<string, EffectKeyframe[]>
  startTime: number
  duration?: number
  targetId: string
  targetType: EffectScope
}
```

### 4.3 Preview Effect

```typescript
// src/features/preview/types.ts
export interface Effect {
  id: string
  type: EffectType
  enabled: boolean
  parameters: Record<string, any>
  intensity: number
  category?: string
  scope?: "clip" | "track" | "global"
  blendMode?: string
}
```

**Проблема**: Каждый модуль определяет свою версию "эффекта", что приводит к необходимости конвертации между ними.

## 5. Дублирование логики инициализации WebGL

### 5.1 EffectsPreviewService

```typescript
// src/features/video-player/services/effects-preview.ts
private initializeWebGL(): void {
  this.canvas = document.createElement("canvas")
  this.gl = this.canvas.getContext("webgl2", {
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  })
  
  if (!this.gl) {
    throw new Error("WebGL2 not supported")
  }
}
```

### 5.2 WebGL2UnifiedRenderer

```typescript
// src/features/effects/services/webgl2-unified-renderer.ts
async initialize(): Promise<void> {
  // Почти идентичный код инициализации
  const canvas = document.createElement("canvas")
  const gl = canvas.getContext("webgl2")
  // ...
}
```

### 5.3 WebGL2PreviewRenderer

```typescript
// src/features/preview/services/webgl2-preview-renderer.ts
private async initializeWebGL(): Promise<void> {
  // И снова тот же код
  this.gl = this.canvas.getContext("webgl2", {
    antialias: false,
    preserveDrawingBuffer: false,
  })
}
```

**Проблема**: Каждый модуль инициализирует WebGL по-своему, хотя логика практически идентична.

## 6. Дублирование обработки видео кадров

### 6.1 EffectsPlayerIntegration

```typescript
// src/features/timeline/services/effects-player-integration.ts
async processVideoFrame(videoElement: HTMLVideoElement, currentTime: number): Promise<HTMLCanvasElement | null> {
  const activeEffects = this.currentClip.effects.filter((e) => e.enabled)
  
  if (activeEffects.length === 0) {
    this.ctx.drawImage(videoElement, 0, 0)
    return this.targetCanvas
  }
  
  const result = await this.renderer.renderEffectStack(activeEffects, this.baseEffects, {
    source: videoElement,
    // ...
  })
}
```

### 6.2 useTimelineIntegration

```typescript
// src/features/preview/hooks/use-timeline-integration.ts
const updatePreview = useCallback(async () => {
  const video = document.createElement("video")
  video.src = currentMediaFile.path
  video.currentTime = currentTime
  
  await new Promise<void>((resolve, reject) => {
    // Похожая логика обработки видео
  })
  
  const renderedFrame = await renderer.renderFrame(video, activeEffects, currentTime)
})
```

**Проблема**: Похожая логика обработки видео кадров реализована в нескольких местах.

## Выводы

Основные паттерны дублирования:

1. **Множественные системы рендеринга** - каждый модуль имеет свою WebGL реализацию
2. **Несовместимые типы** - каждый модуль определяет свои типы для эффектов
3. **Дублирование бизнес-логики** - применение, удаление, обновление эффектов реализовано несколько раз
4. **Повторяющийся boilerplate** - инициализация WebGL, обработка видео, управление состоянием

Все это приводит к:
- Сложности в поддержке (нужно обновлять несколько мест)
- Потенциальным багам (разные реализации могут работать по-разному)
- Увеличенному размеру бандла
- Затрудненному тестированию