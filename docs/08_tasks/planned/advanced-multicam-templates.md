# Продвинутая система многокамерных шаблонов

## Описание задачи

Модернизация существующей системы многокамерных шаблонов Timeline Studio для поддержки динамических макетов, анимированных переходов и профессиональных возможностей композитинга видео.

## Цели

1. **Динамические шаблоны** - автоматическая адаптация под количество активных видео
2. **Анимированные переходы** - плавное переключение между макетами
3. **Продвинутые эффекты** - 3D трансформации, маски, виньетки
4. **Визуальный редактор** - создание кастомных шаблонов без кода

## Текущее состояние

### Сильные стороны
- ✅ 78+ готовых шаблонов (2-25 камер)
- ✅ Гибкая конфигурационная система
- ✅ Интерактивное изменение размеров
- ✅ Визуальная кастомизация (границы, фоны, заголовки)
- ✅ Поддержка разных соотношений сторон

### Ограничения
- ❌ Статичные макеты без анимации переходов
- ❌ Нет динамической адаптации под количество видео
- ❌ Ограниченные визуальные эффекты
- ❌ Нет визуального редактора шаблонов
- ❌ Отсутствуют 3D трансформации
- ❌ Нет поддержки масок и сложных форм

## Архитектурные изменения

### 1. Расширенная модель шаблонов

```typescript
// Динамический многокамерный шаблон
interface AdvancedTemplate extends MediaTemplateConfig {
  // Базовые поля наследуются
  
  // Анимация макета
  animation?: {
    // Анимация при появлении
    entrance?: {
      type: 'fade' | 'slide' | 'scale' | 'rotate' | '3d-flip' | 'custom'
      duration: number
      delay?: number
      easing: EasingFunction
      stagger?: number // Задержка между элементами
    }
    
    // Анимация при изменении макета
    transition?: {
      type: 'morph' | 'crossfade' | 'slide' | 'zoom' | 'custom'
      duration: number
      easing: EasingFunction
    }
    
    // Анимация при удалении
    exit?: {
      type: 'fade' | 'slide' | 'scale' | 'collapse' | 'custom'
      duration: number
      easing: EasingFunction
    }
  }
  
  // Динамическое поведение
  dynamic?: {
    // Автоматическая перестройка макета
    autoLayout: boolean
    
    // Стратегия размещения
    layoutStrategy: 'grid' | 'focus' | 'carousel' | 'masonry' | 'custom'
    
    // Адаптация под количество видео
    breakpoints: {
      count: number
      layout: Partial<MediaTemplateConfig>
    }[]
    
    // Приоритеты видео
    priorityRules?: {
      type: 'size' | 'position' | 'content' | 'manual'
      weights: Record<string, number>
    }
  }
  
  // 3D трансформации
  transform3D?: {
    perspective: number
    rotateX?: number
    rotateY?: number
    rotateZ?: number
    translateZ?: number
    transformOrigin?: string
  }
  
  // Продвинутые эффекты
  effects?: {
    // Маски и формы
    mask?: {
      type: 'circle' | 'polygon' | 'path' | 'image'
      data: string | number[]
      feather?: number
      invert?: boolean
    }
    
    // Тени и свечение
    shadow?: {
      x: number
      y: number
      blur: number
      spread?: number
      color: string
      inset?: boolean
    }
    
    // Фильтры
    filters?: {
      blur?: number
      brightness?: number
      contrast?: number
      grayscale?: number
      hueRotate?: number
      saturate?: number
      sepia?: number
    }
    
    // Blend режимы
    blendMode?: BlendMode
    
    // Частицы и декорации
    decorations?: Decoration[]
  }
  
  // Интерактивность
  interactive?: {
    // Реакция на hover
    hover?: {
      scale?: number
      brightness?: number
      shadow?: ShadowConfig
      transition: TransitionConfig
    }
    
    // Реакция на клик
    click?: {
      action: 'focus' | 'swap' | 'maximize' | 'custom'
      animation?: AnimationConfig
    }
    
    // Drag & Drop
    draggable?: {
      enabled: boolean
      snapToGrid?: boolean
      bounds?: 'parent' | 'window' | Bounds
    }
  }
}

// Декорации для шаблона
interface Decoration {
  type: 'particles' | 'border' | 'overlay' | 'background'
  layer: 'behind' | 'front'
  config: {
    // Для particles
    particles?: {
      count: number
      size: [number, number]
      speed: number
      direction: number
      spread: number
      color: string[]
      shape: 'circle' | 'square' | 'star'
    }
    
    // Для border
    border?: {
      style: 'solid' | 'gradient' | 'animated' | 'neon'
      width: number
      color: string | string[]
      animation?: AnimationLoop
    }
    
    // Для overlay
    overlay?: {
      type: 'gradient' | 'pattern' | 'noise' | 'scanlines'
      opacity: number
      blendMode: BlendMode
    }
  }
}
```

### 2. Система анимаций

```typescript
// Движок анимаций для шаблонов
class TemplateAnimationEngine {
  // Регистрация кастомных анимаций
  registerAnimation(name: string, keyframes: Keyframe[]): void
  
  // Анимация перехода между шаблонами
  async animateTransition(
    from: TemplateState,
    to: TemplateState,
    options: TransitionOptions
  ): Promise<void>
  
  // Морфинг между состояниями
  async morphLayout(
    currentLayout: CellLayout[],
    targetLayout: CellLayout[],
    duration: number
  ): Promise<void>
  
  // GPU-ускоренные эффекты
  applyGPUEffect(
    element: HTMLElement,
    effect: GPUEffect
  ): void
}

// Предустановленные анимации
const templateAnimations = {
  // Появление
  entrance: {
    fadeIn: { opacity: [0, 1] },
    slideIn: { transform: ['translateX(-100%)', 'translateX(0)'] },
    scaleIn: { transform: ['scale(0)', 'scale(1)'] },
    rotateIn: { transform: ['rotate(-180deg)', 'rotate(0)'] },
    flipIn: { transform: ['rotateY(-180deg)', 'rotateY(0)'] },
    bounceIn: { 
      transform: [
        'scale(0)', 
        'scale(1.2)', 
        'scale(0.9)', 
        'scale(1.05)', 
        'scale(1)'
      ] 
    }
  },
  
  // Переходы
  transitions: {
    morph: { /* Плавное изменение формы */ },
    dissolve: { /* Растворение */ },
    wipe: { /* Вытеснение */ },
    iris: { /* Диафрагма */ },
    page: { /* Перелистывание */ }
  }
}
```

### 3. Визуальный редактор шаблонов

```typescript
// Компоненты редактора
interface TemplateDesigner {
  // Холст для дизайна
  canvas: {
    // Сетка и направляющие
    grid: {
      enabled: boolean
      size: number
      snap: boolean
      showRulers: boolean
    }
    
    // Рабочая область
    workspace: {
      width: number
      height: number
      aspectRatio: AspectRatio
      backgroundColor: string
      safeArea: boolean
    }
    
    // Слои
    layers: {
      items: DesignLayer[]
      activeLayer: string
      locked: string[]
      hidden: string[]
    }
  }
  
  // Панель инструментов
  tools: {
    // Основные инструменты
    selection: SelectionTool
    rectangle: ShapeTool
    ellipse: ShapeTool
    polygon: PolygonTool
    text: TextTool
    
    // Трансформация
    move: MoveTool
    resize: ResizeTool
    rotate: RotateTool
    skew: SkewTool
    
    // Выравнивание
    align: AlignTool
    distribute: DistributeTool
    
    // Продвинутые
    mask: MaskTool
    gradient: GradientTool
    effects: EffectsTool
  }
  
  // Панели свойств
  properties: {
    // Свойства элемента
    element: {
      position: PositionProps
      size: SizeProps
      rotation: RotationProps
      opacity: OpacityProps
    }
    
    // Стилизация
    style: {
      fill: FillProps
      stroke: StrokeProps
      shadow: ShadowProps
      filters: FilterProps
    }
    
    // Анимация
    animation: {
      timeline: Timeline
      keyframes: KeyframeEditor
      easings: EasingSelector
      preview: AnimationPreview
    }
  }
  
  // Библиотека ресурсов
  library: {
    // Готовые элементы
    presets: {
      layouts: LayoutPreset[]
      shapes: ShapePreset[]
      effects: EffectPreset[]
      animations: AnimationPreset[]
    }
    
    // Пользовательские
    custom: {
      saved: UserTemplate[]
      imported: ImportedTemplate[]
      shared: SharedTemplate[]
    }
  }
  
  // Экспорт и сохранение
  export: {
    format: 'json' | 'code' | 'package'
    optimize: boolean
    compatibility: 'latest' | 'legacy'
  }
}
```

### 4. GPU-ускоренные эффекты

```typescript
// WebGL/WebGPU эффекты для шаблонов
class TemplateEffectsEngine {
  private gl: WebGL2RenderingContext
  private shaders: Map<string, WebGLProgram>
  
  // Инициализация
  async initialize(canvas: HTMLCanvasElement): Promise<void>
  
  // 3D трансформации
  apply3DTransform(
    texture: WebGLTexture,
    transform: Matrix4,
    perspective: number
  ): WebGLTexture
  
  // Продвинутые маски
  applyMask(
    texture: WebGLTexture,
    mask: MaskDefinition
  ): WebGLTexture
  
  // Частицы и декорации
  renderParticles(
    particles: ParticleSystem,
    time: number
  ): WebGLTexture
  
  // Композитинг
  composite(
    layers: WebGLTexture[],
    blendModes: BlendMode[]
  ): WebGLTexture
}

// Примеры шейдеров
const templateShaders = {
  // 3D page flip effect
  pageFlip: `
    uniform float progress;
    uniform float perspective;
    
    vec2 deform(vec2 uv) {
      float angle = progress * PI;
      float cosAngle = cos(angle);
      float sinAngle = sin(angle);
      
      // Apply cylindrical deformation
      float radius = 0.5;
      float x = uv.x - 0.5;
      float z = radius * (1.0 - cosAngle);
      
      // Perspective projection
      float scale = perspective / (perspective + z);
      return vec2(
        (x * cosAngle + 0.5) * scale + (1.0 - scale) * 0.5,
        uv.y * scale + (1.0 - scale) * 0.5
      );
    }
  `,
  
  // Hexagonal mask
  hexagonMask: `
    float hexagon(vec2 p, float r) {
      const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
      p = abs(p);
      p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
      p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
      return length(p) * sign(p.y);
    }
  `
}
```

## Новые типы шаблонов

### 1. Focus Mode Templates
```typescript
{
  id: "dynamic-focus",
  name: "Динамический фокус",
  dynamic: {
    autoLayout: true,
    layoutStrategy: "focus",
    breakpoints: [
      { count: 2, layout: { split: "horizontal" } },
      { count: 3, layout: { 
        cells: [
          { size: "60%", position: "left" },
          { size: "20%", position: "top-right" },
          { size: "20%", position: "bottom-right" }
        ]
      }},
      { count: 4, layout: { split: "grid" } }
    ]
  },
  animation: {
    transition: {
      type: "morph",
      duration: 800,
      easing: "easeInOutCubic"
    }
  }
}
```

### 2. Carousel Templates
```typescript
{
  id: "carousel-3d",
  name: "3D Карусель",
  transform3D: {
    perspective: 1000,
    rotateY: "dynamic" // Вращается в зависимости от позиции
  },
  cells: generateCarouselCells(6),
  animation: {
    entrance: {
      type: "3d-flip",
      duration: 1000,
      stagger: 100
    }
  },
  interactive: {
    draggable: {
      enabled: true,
      axis: "x",
      onDrag: (delta) => rotateCarousel(delta)
    }
  }
}
```

### 3. Magazine Layout
```typescript
{
  id: "magazine-layout",
  name: "Журнальная верстка",
  dynamic: {
    layoutStrategy: "masonry",
    autoLayout: true
  },
  effects: {
    shadow: {
      x: 0,
      y: 10,
      blur: 20,
      color: "rgba(0,0,0,0.2)"
    }
  },
  animation: {
    entrance: {
      type: "custom",
      keyframes: [
        { opacity: 0, transform: "translateY(50px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      stagger: 50
    }
  }
}
```

### 4. Cinematic Templates
```typescript
{
  id: "cinematic-wide",
  name: "Кинематографический",
  aspectRatio: "2.35:1",
  effects: {
    mask: {
      type: "path",
      data: "letterbox",
      feather: 20
    },
    filters: {
      contrast: 1.1,
      saturate: 0.9
    },
    decorations: [
      {
        type: "overlay",
        layer: "front",
        config: {
          overlay: {
            type: "scanlines",
            opacity: 0.1,
            blendMode: "overlay"
          }
        }
      }
    ]
  }
}
```

## План реализации

### Фаза 1: Анимационная система (3-4 недели)

1. **Базовые анимации**
   - [ ] Fade, slide, scale анимации
   - [ ] Система переходов между макетами
   - [ ] Easing функции
   - [ ] Stagger эффекты

2. **Морфинг макетов**
   - [ ] Плавное изменение размеров
   - [ ] Анимация позиций
   - [ ] Сохранение пропорций
   - [ ] Обработка появления/исчезновения элементов

3. **GPU ускорение**
   - [ ] WebGL рендерер
   - [ ] Оптимизация производительности
   - [ ] Fallback на CSS анимации
   - [ ] Кеширование

### Фаза 2: Динамические шаблоны (3-4 недели)

1. **Адаптивные макеты**
   - [ ] Breakpoints система
   - [ ] Стратегии размещения
   - [ ] Автоматическая перестройка
   - [ ] Приоритеты элементов

2. **Интерактивность**
   - [ ] Hover эффекты
   - [ ] Click actions
   - [ ] Drag & Drop
   - [ ] Touch gestures

3. **3D трансформации**
   - [ ] Perspective настройки
   - [ ] 3D rotations
   - [ ] Depth эффекты
   - [ ] Parallax

### Фаза 3: Визуальный редактор (4-5 недель)

1. **Основной интерфейс**
   - [ ] Canvas с сеткой
   - [ ] Инструменты рисования
   - [ ] Панели свойств
   - [ ] Timeline для анимаций

2. **Расширенные инструменты**
   - [ ] Маски и формы
   - [ ] Градиенты
   - [ ] Эффекты и фильтры
   - [ ] Текстовые инструменты

3. **Библиотека и шаблоны**
   - [ ] Сохранение шаблонов
   - [ ] Импорт/экспорт
   - [ ] Версионирование
   - [ ] Публикация в библиотеку

### Фаза 4: Продвинутые эффекты (3-4 недели)

1. **GPU эффекты**
   - [ ] Частицы
   - [ ] Размытие и свечение
   - [ ] Искажения
   - [ ] Цветокоррекция

2. **Декорации**
   - [ ] Анимированные границы
   - [ ] Фоновые паттерны
   - [ ] Оверлеи
   - [ ] Световые эффекты

3. **Оптимизация**
   - [ ] LOD система
   - [ ] Прокси превью
   - [ ] Ленивая загрузка
   - [ ] Кеширование рендера

## Интеграция с Timeline Studio

1. **Использование в проектах**
   - Применение шаблонов к клипам на таймлайне
   - Keyframe анимация параметров
   - Сохранение в составе проекта

2. **Экспорт возможности**
   - Рендеринг через FFmpeg
   - Поддержка альфа-канала
   - Экспорт как эффект

3. **Совместимость**
   - С существующими эффектами
   - С цветокоррекцией
   - С переходами

## Метрики успеха

1. **Производительность**
   - 60 FPS для 9 видео @ 1080p
   - < 16ms рендеринг кадра
   - < 200MB RAM на шаблон

2. **Пользовательский опыт**
   - Создание шаблона < 5 минут
   - 100+ готовых пресетов
   - Интуитивный интерфейс

## Приоритет

Средний - улучшает существующую функциональность и открывает новые творческие возможности для профессиональных пользователей.