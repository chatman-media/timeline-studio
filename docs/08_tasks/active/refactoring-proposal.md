# Предложение по рефакторингу модулей Timeline, Effects и Preview

## Цели рефакторинга

1. **Устранить дублирование кода** между модулями
2. **Разорвать циклические зависимости**
3. **Установить четкие границы ответственности**
4. **Создать единую систему рендеринга эффектов**
5. **Упростить тестирование и поддержку**

## Предлагаемая архитектура

```
src/
├── core/                              # Общие интерфейсы и типы
│   ├── types/
│   │   ├── effects.ts                # Единые типы эффектов
│   │   ├── timeline.ts               # Базовые типы timeline
│   │   └── preview.ts                # Типы для preview
│   ├── interfaces/
│   │   ├── effect-provider.ts        # Интерфейс провайдера эффектов
│   │   ├── effect-renderer.ts        # Интерфейс рендерера
│   │   └── preview-renderer.ts       # Интерфейс preview
│   └── services/
│       ├── event-bus.ts              # Event-driven коммуникация
│       └── dependency-container.ts    # DI контейнер
│
├── features/
│   ├── effects-core/                  # Только определения эффектов
│   │   ├── data/                     # JSON файлы с эффектами
│   │   ├── types/                    # Специфичные типы
│   │   └── services/
│   │       ├── effect-registry.ts    # Реестр эффектов
│   │       └── effect-validator.ts   # Валидация эффектов
│   │
│   ├── effects-renderer/              # WebGL рендеринг
│   │   ├── services/
│   │   │   ├── webgl2-renderer.ts    # Единый WebGL рендерер
│   │   │   ├── shader-manager.ts     # Управление шейдерами
│   │   │   └── texture-cache.ts      # Кеширование текстур
│   │   └── shaders/                  # GLSL шейдеры
│   │
│   ├── timeline-core/                 # Чистая timeline логика
│   │   ├── types/
│   │   ├── services/
│   │   │   ├── timeline-state.ts     # Состояние timeline
│   │   │   └── clip-manager.ts       # Управление клипами
│   │   └── hooks/
│   │
│   ├── timeline-effects/              # Интеграция эффектов с timeline
│   │   ├── services/
│   │   │   └── effect-applier.ts     # Применение эффектов к клипам
│   │   └── hooks/
│   │       └── use-clip-effects.ts   # Единый хук для эффектов
│   │
│   └── preview-system/                # Унифицированный preview
│       ├── services/
│       │   ├── preview-manager.ts     # Управление preview
│       │   └── frame-processor.ts     # Обработка кадров
│       └── hooks/
│           └── use-preview.ts         # Единый preview хук
```

## Пошаговый план рефакторинга

### Шаг 1: Создание единых типов (День 1)

#### 1.1 Создать базовые типы эффектов

```typescript
// src/core/types/effects.ts
export interface BaseEffect {
  id: string
  name: LocalizedString
  category: EffectCategory
  parameters: EffectParameter[]
  processors: {
    webgl?: WebGLProcessor
    css?: CSSProcessor
    ffmpeg?: FFmpegProcessor
  }
}

export interface AppliedEffect {
  id: string
  effectId: string
  targetId: string
  targetType: 'clip' | 'track' | 'sequence'
  enabled: boolean
  parameters: Record<string, any>
  keyframes?: Record<string, Keyframe[]>
  startTime?: number
  duration?: number
}

export interface EffectParameter {
  id: string
  name: LocalizedString
  type: ParameterType
  defaultValue: any
  constraints?: ParameterConstraints
}
```

#### 1.2 Миграция существующих типов

```bash
# План миграции:
1. Заменить все импорты AppliedEffect на core/types/effects
2. Обновить использование в компонентах
3. Удалить дублирующиеся определения
```

### Шаг 2: Создание единого рендерера (День 2-3)

#### 2.1 Объединить WebGL реализации

```typescript
// src/features/effects-renderer/services/webgl2-renderer.ts
export class WebGL2Renderer implements IEffectRenderer {
  private gl: WebGL2RenderingContext
  private shaderManager: ShaderManager
  private textureCache: TextureCache
  
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.gl = canvas.getContext('webgl2', {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    })
    
    if (!this.gl) {
      throw new Error('WebGL2 not supported')
    }
    
    this.shaderManager = new ShaderManager(this.gl)
    this.textureCache = new TextureCache(this.gl)
  }
  
  async renderEffect(
    source: TexImageSource,
    effect: BaseEffect,
    parameters: Record<string, any>
  ): Promise<ImageBitmap> {
    // Унифицированная логика рендеринга
  }
  
  async renderEffectStack(
    source: TexImageSource,
    effects: AppliedEffect[],
    effectRegistry: Map<string, BaseEffect>
  ): Promise<ImageBitmap> {
    // Последовательное применение эффектов
  }
}
```

#### 2.2 Удалить дублирующиеся рендереры

- Удалить `EffectsPreviewService`
- Заменить использование на новый `WebGL2Renderer`
- Обновить тесты

### Шаг 3: Разделение Timeline (День 4-5)

#### 3.1 Выделить timeline-core

```typescript
// src/features/timeline-core/services/timeline-state.ts
export class TimelineState {
  private project: TimelineProject
  
  // Только базовые операции с timeline
  addClip(trackId: string, clip: TimelineClip): void
  removeClip(clipId: string): void
  moveClip(clipId: string, newStartTime: number): void
  
  // БЕЗ эффектов, preview и других зависимостей
}
```

#### 3.2 Создать timeline-effects

```typescript
// src/features/timeline-effects/services/effect-applier.ts
export class EffectApplier {
  constructor(
    private timelineState: TimelineState,
    private effectRegistry: IEffectRegistry,
    private eventBus: EventBus
  ) {}
  
  applyEffect(clipId: string, effectId: string, parameters?: Record<string, any>): void {
    const clip = this.timelineState.getClip(clipId)
    const effect = this.effectRegistry.getEffect(effectId)
    
    // Применяем эффект
    const appliedEffect: AppliedEffect = {
      id: generateId(),
      effectId,
      targetId: clipId,
      targetType: 'clip',
      enabled: true,
      parameters: parameters || {},
    }
    
    // Уведомляем через события
    this.eventBus.emit('effect:applied', { clipId, effect: appliedEffect })
  }
}
```

### Шаг 4: Event-driven коммуникация (День 6)

#### 4.1 Создать EventBus

```typescript
// src/core/services/event-bus.ts
export class EventBus {
  private listeners = new Map<string, Set<Function>>()
  
  on(event: string, handler: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(handler)
    
    // Возвращаем функцию отписки
    return () => this.off(event, handler)
  }
  
  emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }
  
  off(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler)
  }
}
```

#### 4.2 Использовать события вместо прямых вызовов

```typescript
// Вместо:
timelineEffects.applyEffect(clipId, effectId)

// Использовать:
eventBus.emit('timeline:effect:apply', { clipId, effectId })
```

### Шаг 5: Dependency Injection (День 7)

#### 5.1 Создать DI контейнер

```typescript
// src/core/services/dependency-container.ts
export class DependencyContainer {
  private services = new Map<string, any>()
  
  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory())
  }
  
  get<T>(token: string): T {
    if (!this.services.has(token)) {
      throw new Error(`Service ${token} not registered`)
    }
    return this.services.get(token)
  }
}

// Регистрация сервисов
const container = new DependencyContainer()

container.register('EffectRenderer', () => new WebGL2Renderer())
container.register('EffectRegistry', () => new EffectRegistry())
container.register('EventBus', () => new EventBus())
```

#### 5.2 Использовать DI в компонентах

```typescript
// src/features/timeline-effects/hooks/use-clip-effects.ts
export function useClipEffects(clipId: string) {
  const container = useDependencyContainer()
  const effectApplier = container.get<EffectApplier>('EffectApplier')
  const eventBus = container.get<EventBus>('EventBus')
  
  const applyEffect = useCallback((effectId: string, params?: Record<string, any>) => {
    effectApplier.applyEffect(clipId, effectId, params)
  }, [clipId, effectApplier])
  
  // Подписка на события
  useEffect(() => {
    const unsubscribe = eventBus.on('effect:applied', (data) => {
      if (data.clipId === clipId) {
        // Обновить локальное состояние
      }
    })
    
    return unsubscribe
  }, [clipId, eventBus])
  
  return { applyEffect }
}
```

### Шаг 6: Миграция компонентов (День 8-9)

#### 6.1 Обновить ClipEffectsPanel

```typescript
// src/features/timeline/components/clip-effects-panel.tsx
export function ClipEffectsPanel({ clip }: Props) {
  // Использовать новый унифицированный хук
  const { applyEffect, removeEffect, effects } = useClipEffects(clip.id)
  
  // Убрать прямые импорты из effects модуля
  // Использовать только интерфейсы
}
```

#### 6.2 Обновить preview компоненты

```typescript
// src/features/preview-system/hooks/use-preview.ts
export function usePreview() {
  const container = useDependencyContainer()
  const renderer = container.get<IEffectRenderer>('EffectRenderer')
  const eventBus = container.get<EventBus>('EventBus')
  
  // Подписка на изменения эффектов
  useEffect(() => {
    const unsubscribe = eventBus.on('effect:changed', () => {
      // Перерендерить preview
    })
    
    return unsubscribe
  }, [eventBus])
}
```

### Шаг 7: Тестирование (День 10-11)

#### 7.1 Создать моки для интерфейсов

```typescript
// src/test/mocks/effect-renderer.mock.ts
export class MockEffectRenderer implements IEffectRenderer {
  async renderEffect(): Promise<ImageBitmap> {
    return createMockImageBitmap()
  }
}
```

#### 7.2 Обновить существующие тесты

```typescript
// Использовать DI для тестов
beforeEach(() => {
  const container = new DependencyContainer()
  container.register('EffectRenderer', () => new MockEffectRenderer())
})
```

## Преимущества предлагаемой архитектуры

1. **Модульность** - каждый модуль имеет четкую ответственность
2. **Тестируемость** - легко мокать зависимости через интерфейсы
3. **Расширяемость** - новые эффекты добавляются без изменения core
4. **Производительность** - единый оптимизированный рендерер
5. **Поддерживаемость** - четкие границы и отсутствие дублирования

## Риски и митигация

### Риск 1: Большой объем изменений
**Митигация**: Пошаговая миграция с сохранением обратной совместимости

### Риск 2: Регрессии в функциональности
**Митигация**: Покрытие тестами перед рефакторингом

### Риск 3: Производительность
**Митигация**: Профилирование и оптимизация после каждого шага

## Метрики успеха

1. **Уменьшение количества строк кода** на 30-40%
2. **Устранение циклических зависимостей** - 0 циклов
3. **Увеличение покрытия тестами** до 80%+
4. **Уменьшение времени сборки** на 20%
5. **Упрощение добавления новых эффектов** - 1 файл вместо 5

## Заключение

Предлагаемый рефакторинг позволит создать чистую, модульную архитектуру с четким разделением ответственности. Это упростит дальнейшую разработку, тестирование и поддержку проекта.