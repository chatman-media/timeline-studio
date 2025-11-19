# Архитектура системы шаблонов Timeline Studio

## Обзор

Система шаблонов Timeline Studio состоит из трех взаимосвязанных модулей:
- **Templates** - базовые шаблоны (многокамерные + графические)
- **Project Templates** - шаблоны проектов
- **Scenarios** - сценарии монтажа

## 1. Unified Templates (Объединенная система шаблонов)

### Структура директорий

```
src/features/templates/
├── types/
│   ├── base.ts                      # Базовые типы для всех шаблонов
│   ├── multi-camera.ts              # Типы многокамерных шаблонов
│   └── graphics.ts                  # Типы графических шаблонов
│
├── lib/
│   ├── multi-camera/
│   │   ├── landscape-templates.ts
│   │   ├── portrait-templates.ts
│   │   └── square-templates.ts
│   │
│   ├── graphics/
│   │   ├── intro-templates.ts
│   │   ├── outro-templates.ts
│   │   ├── title-templates.ts
│   │   ├── lower-third-templates.ts
│   │   └── transition-templates.ts
│   │
│   ├── template-registry.ts         # Централизованный реестр шаблонов
│   └── template-utils.ts            # Общие утилиты
│
├── components/
│   ├── template-browser/
│   │   ├── template-browser.tsx     # Общий браузер шаблонов
│   │   ├── template-grid.tsx
│   │   ├── template-card.tsx
│   │   └── template-filters.tsx
│   │
│   ├── multi-camera/
│   │   ├── multi-camera-preview.tsx
│   │   └── cell-editor.tsx
│   │
│   ├── graphics/
│   │   ├── graphics-preview.tsx
│   │   ├── element-editor.tsx
│   │   └── animation-timeline.tsx
│   │
│   └── shared/
│       ├── template-preview.tsx     # Общий preview компонент
│       └── template-editor.tsx      # Общий редактор
│
├── services/
│   ├── template-manager.ts          # Управление шаблонами
│   ├── template-renderer.ts         # Рендеринг шаблонов
│   └── template-machine.ts          # XState машина
│
├── hooks/
│   ├── use-template.ts
│   ├── use-template-browser.ts
│   └── use-template-editor.ts
│
└── __tests__/
    ├── lib/
    ├── components/
    └── services/
```

## 2. Project Templates (Шаблоны проектов)

### Структура директорий

```
src/features/project-templates/
├── types/
│   └── project-template.ts          # Типы шаблонов проектов
│
├── lib/
│   ├── youtube-templates.ts
│   ├── social-templates.ts
│   ├── podcast-templates.ts
│   ├── tutorial-templates.ts
│   └── commercial-templates.ts
│
├── components/
│   ├── template-picker.tsx          # Выбор шаблона при создании
│   ├── template-wizard.tsx          # Пошаговый мастер
│   ├── template-customizer.tsx      # Кастомизация параметров
│   └── template-preview.tsx
│
├── services/
│   ├── project-template-manager.ts
│   ├── template-applier.ts          # Применение шаблона к проекту
│   └── template-validator.ts
│
├── hooks/
│   ├── use-project-template.ts
│   └── use-template-picker.ts
│
└── __tests__/
```

## 3. Scenarios (Сценарии монтажа)

### Структура директорий

```
src/features/scenarios/
├── types/
│   ├── scenario.ts                  # Базовые типы сценариев
│   └── scenario-step.ts             # Типы шагов сценария
│
├── lib/
│   ├── structure-scenarios.ts       # Сценарии структуры (intro/outro)
│   ├── automation-scenarios.ts      # Автоматизация (вырезки, синхронизация)
│   ├── effects-scenarios.ts         # Эффекты и переходы
│   └── scenario-registry.ts
│
├── components/
│   ├── scenario-browser.tsx
│   ├── scenario-wizard/
│   │   ├── wizard.tsx
│   │   ├── step-renderer.tsx
│   │   └── progress-indicator.tsx
│   │
│   ├── steps/
│   │   ├── select-clips-step.tsx
│   │   ├── select-template-step.tsx
│   │   ├── configure-cuts-step.tsx
│   │   └── preview-step.tsx
│   │
│   └── automation/
│       ├── ai-moment-selector.tsx
│       ├── beat-detection.tsx
│       └── auto-cuts-preview.tsx
│
├── services/
│   ├── scenario-executor.ts         # Выполнение сценария
│   ├── scenario-machine.ts          # XState машина
│   ├── automation/
│   │   ├── beat-detector.ts
│   │   ├── moment-analyzer.ts
│   │   └── auto-cutter.ts
│   │
│   └── validators/
│       └── scenario-validator.ts
│
├── hooks/
│   ├── use-scenario.ts
│   ├── use-scenario-executor.ts
│   └── use-automation.ts
│
└── __tests__/
```

## Архитектура типов

### Базовая иерархия типов

```typescript
// features/templates/types/base.ts

/**
 * Базовый интерфейс для всех типов шаблонов
 */
export interface BaseTemplate {
  id: string
  type: 'multi-camera' | 'graphics' | 'project' | 'scenario'
  name: {
    ru: string
    en: string
  }
  description?: {
    ru: string
    en: string
  }
  category: string
  tags?: {
    ru: string[]
    en: string[]
  }
  thumbnail?: string
  previewVideo?: string
  createdAt?: string
  updatedAt?: string
  author?: string
  version?: string
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | 'custom'
}

/**
 * Шаблон с временными параметрами
 */
export interface TimedTemplate extends BaseTemplate {
  duration: number // в секундах
  timing?: {
    start?: number
    end?: number
    fadein?: number
    fadeout?: number
  }
}

/**
 * Шаблон с анимацией
 */
export interface AnimatedTemplate extends TimedTemplate {
  hasAnimation: boolean
  animations?: Animation[]
}

/**
 * Общий интерфейс анимации
 */
export interface Animation {
  id: string
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'scaleIn' | 'scaleOut' | 'bounce' | 'shake' | 'custom'
  duration: number
  delay?: number
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | string
  direction?: 'left' | 'right' | 'up' | 'down'
  properties?: Record<string, unknown>
}

/**
 * Реестр всех типов шаблонов
 */
export type TemplateType =
  | MultiCameraTemplate
  | GraphicsTemplate
  | ProjectTemplate
  | Scenario
```

### Многокамерные шаблоны

```typescript
// features/templates/types/multi-camera.ts

import type { BaseTemplate } from './base'

export interface MultiCameraTemplate extends BaseTemplate {
  type: 'multi-camera'
  category: 'split-screen' | 'picture-in-picture' | 'grid' | 'custom'

  split: 'vertical' | 'horizontal' | 'diagonal' | 'custom' | 'grid'
  resizable?: boolean
  screens: number
  splitPoints?: SplitPoint[]
  splitPosition?: number

  cells?: CellConfiguration[]
  cellLayouts?: CellLayout[]
  dividers?: DividerConfig
  layout?: LayoutConfig
  gridConfig?: GridConfig

  render?: () => JSX.Element // Для обратной совместимости
}

export interface SplitPoint {
  x: number // 0-100
  y: number // 0-100
}

export interface CellConfiguration {
  fitMode?: 'contain' | 'cover' | 'fill'
  alignX?: 'left' | 'center' | 'right'
  alignY?: 'top' | 'center' | 'bottom'
  initialScale?: number
  initialPosition?: { x: number; y: number }

  title?: {
    show: boolean
    text?: string
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    style?: CSSProperties
  }

  background?: {
    color?: string
    gradient?: string
    image?: string
    opacity?: number
  }

  border?: {
    width?: string
    color?: string
    style?: 'solid' | 'dashed' | 'dotted'
    radius?: string
  }

  padding?: string
  margin?: string
}

export interface CellLayout {
  position?: 'absolute' | 'relative'
  top?: string
  left?: string
  right?: string
  bottom?: string
  width?: string
  height?: string
  flex?: string
  gridColumn?: string
  gridRow?: string
  zIndex?: number
}

export interface DividerConfig {
  show?: boolean
  width?: string
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
  dashArray?: string
  opacity?: number
  shadow?: boolean
  shadowColor?: string
  shadowBlur?: string
}

export interface LayoutConfig {
  gap?: string
  padding?: string
  backgroundColor?: string
  borderRadius?: string
  containerStyle?: CSSProperties
}

export interface GridConfig {
  columns: number
  rows: number
  columnGap?: string
  rowGap?: string
}
```

### Графические шаблоны

```typescript
// features/templates/types/graphics.ts

import type { AnimatedTemplate } from './base'

export interface GraphicsTemplate extends AnimatedTemplate {
  type: 'graphics'
  category: 'intro' | 'outro' | 'lower-third' | 'title' | 'transition' | 'overlay'
  style: 'modern' | 'vintage' | 'minimal' | 'corporate' | 'creative' | 'cinematic'

  hasText: boolean
  elements: TemplateElement[]
}

export interface TemplateElement {
  id: string
  type: 'text' | 'shape' | 'image' | 'video' | 'animation' | 'particle'
  name: {
    ru: string
    en: string
  }
  position: {
    x: number // 0-100
    y: number // 0-100
  }
  size: {
    width: number // 0-100
    height: number // 0-100
  }
  timing: {
    start: number
    end: number
  }
  properties: ElementProperties
  animations?: Animation[]
}

export interface ElementProperties {
  // Общие
  opacity?: number
  rotation?: number
  scale?: number

  // Текст
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold' | 'light'

  // Фигуры
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number

  // Изображения/видео
  src?: string
  objectFit?: 'contain' | 'cover' | 'fill'

  [key: string]: unknown
}
```

### Шаблоны проектов

```typescript
// features/project-templates/types/project-template.ts

import type { BaseTemplate } from '@/features/templates/types/base'

export interface ProjectTemplate extends BaseTemplate {
  type: 'project'
  category: 'youtube' | 'social' | 'podcast' | 'tutorial' | 'commercial' | 'presentation'

  targetPlatform?: 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'custom'
  estimatedDuration: number // в секундах

  structure: ProjectStructure
  placeholders: ProjectPlaceholders
  settings: ProjectSettings
}

export interface ProjectStructure {
  sections: Section[]
  tracks: TrackConfig[]

  // Ссылки на шаблоны
  multiCameraTemplates?: string[] // ID многокамерных шаблонов
  graphicsTemplates?: string[] // ID графических шаблонов
}

export interface Section {
  id: string
  type: 'intro' | 'content' | 'outro' | 'transition' | 'chapter'
  name: {
    ru: string
    en: string
  }
  duration: number
  templateId?: string // ID шаблона для этой секции
  position: number // позиция на таймлайне
  locked?: boolean // секция не может быть удалена
}

export interface TrackConfig {
  id: string
  type: 'video' | 'audio' | 'text' | 'graphics'
  name: string
  locked?: boolean
  visible?: boolean
  height?: number
}

export interface ProjectPlaceholders {
  intro?: {
    duration: number
    templateId: string
    required?: boolean
  }
  outro?: {
    duration: number
    templateId: string
    required?: boolean
  }
  mainContent?: {
    minDuration: number
    maxDuration?: number
  }
  cuts?: {
    type: 'manual' | 'auto' | 'beat-sync'
    positions?: number[]
  }
  music?: {
    required?: boolean
    loop?: boolean
  }
  chapters?: {
    auto?: boolean
    interval?: number
  }
}

export interface ProjectSettings {
  resolution: {
    width: number
    height: number
  }
  frameRate: number
  aspectRatio: string
  audioSampleRate?: number
  audioChannels?: number
}
```

### Сценарии монтажа

```typescript
// features/scenarios/types/scenario.ts

import type { BaseTemplate } from '@/features/templates/types/base'

export interface Scenario extends BaseTemplate {
  type: 'scenario'
  category: 'automation' | 'structure' | 'effects' | 'workflow'

  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // в минутах

  requirements: ScenarioRequirements
  steps: ScenarioStep[]
  settings: ScenarioSettings
}

export interface ScenarioRequirements {
  minClips?: number
  maxClips?: number
  requiresIntro?: boolean
  requiresOutro?: boolean
  requiresMusic?: boolean
  requiresCuts?: boolean
  requiresMultiCamera?: boolean
  aiAssisted?: boolean
}

export interface ScenarioStep {
  id: string
  type: ScenarioStepType
  name: {
    ru: string
    en: string
  }
  description?: {
    ru: string
    en: string
  }
  config: StepConfig
  automation?: AutomationConfig
  validation?: StepValidation
  optional?: boolean
}

export type ScenarioStepType =
  | 'select-clips'
  | 'add-template'
  | 'add-intro'
  | 'add-outro'
  | 'add-cuts'
  | 'add-music'
  | 'analyze-audio'
  | 'analyze-video'
  | 'apply-transitions'
  | 'apply-effects'
  | 'sync-beats'
  | 'auto-montage'
  | 'add-chapters'
  | 'preview'

export interface StepConfig {
  // Конфигурация зависит от типа шага
  [key: string]: unknown
}

export interface AutomationConfig {
  canAutomate: boolean
  aiAssisted?: boolean
  engine?: 'ai-director' | 'beat-detector' | 'moment-analyzer' | 'auto-cutter'
  params?: Record<string, unknown>
}

export interface StepValidation {
  required: boolean
  validator?: (data: unknown) => boolean | string
  errorMessage?: {
    ru: string
    en: string
  }
}

export interface ScenarioSettings {
  allowSkipSteps?: boolean
  showPreview?: boolean
  saveProgress?: boolean
  undoSupport?: boolean
}

/**
 * Результат выполнения сценария
 */
export interface ScenarioResult {
  scenarioId: string
  status: 'success' | 'partial' | 'failed' | 'cancelled'
  completedSteps: string[]
  skippedSteps?: string[]
  failedSteps?: string[]
  output?: {
    projectData?: unknown
    timeline?: unknown
    metadata?: Record<string, unknown>
  }
  errors?: Array<{
    stepId: string
    message: string
  }>
  executionTime: number // в секундах
}
```

## Интеграция с Browser

### Обновленная структура вкладок

```typescript
// features/browser/types/tab.ts

export type BrowserTab =
  | 'media'           // Медиафайлы
  | 'templates'       // Объединенные шаблоны (многокамерные + графические)
  | 'projects'        // Шаблоны проектов
  | 'scenarios'       // Сценарии монтажа
  | 'effects'
  | 'transitions'
  | 'filters'
  | 'audio'
```

### Адаптеры для новых вкладок

```typescript
// features/browser/components/tab-adapters/templates-adapter-content.tsx
// Объединяет multi-camera и graphics

// features/browser/components/tab-adapters/projects-adapter-content.tsx
// Новый адаптер для project templates

// features/browser/components/tab-adapters/scenarios-adapter-content.tsx
// Новый адаптер для scenarios
```

## Централизованный реестр

```typescript
// features/templates/lib/template-registry.ts

import type { BaseTemplate } from '../types/base'
import type { MultiCameraTemplate } from '../types/multi-camera'
import type { GraphicsTemplate } from '../types/graphics'
import type { ProjectTemplate } from '@/features/project-templates/types/project-template'
import type { Scenario } from '@/features/scenarios/types/scenario'

class TemplateRegistry {
  private templates: Map<string, BaseTemplate> = new Map()

  register(template: BaseTemplate): void {
    this.templates.set(template.id, template)
  }

  get<T extends BaseTemplate>(id: string): T | undefined {
    return this.templates.get(id) as T | undefined
  }

  getByType<T extends BaseTemplate>(type: BaseTemplate['type']): T[] {
    return Array.from(this.templates.values())
      .filter(t => t.type === type) as T[]
  }

  getByCategory<T extends BaseTemplate>(
    type: BaseTemplate['type'],
    category: string
  ): T[] {
    return this.getByType<T>(type)
      .filter(t => t.category === category)
  }

  search(query: string, options?: SearchOptions): BaseTemplate[] {
    // Поиск по имени, описанию, тегам
  }

  filter(predicate: (template: BaseTemplate) => boolean): BaseTemplate[] {
    return Array.from(this.templates.values()).filter(predicate)
  }
}

export const templateRegistry = new TemplateRegistry()
```

## План миграции

### Этап 1: Объединение шаблонов
1. ✅ Создать новую структуру типов
2. ✅ Переместить существующие шаблоны
3. ✅ Обновить импорты
4. ✅ Обновить тесты

### Этап 2: Project Templates
1. ✅ Создать структуру feature
2. ✅ Реализовать базовые шаблоны
3. ✅ Интеграция с Browser
4. ✅ Добавить в workflow создания проекта

### Этап 3: Scenarios
1. ✅ Создать структуру feature
2. ✅ Реализовать базовые сценарии
3. ✅ Интеграция с AI Director
4. ✅ Добавить автоматизацию

## Примеры использования

### Использование многокамерного шаблона

```typescript
import { templateRegistry } from '@/features/templates/lib/template-registry'
import type { MultiCameraTemplate } from '@/features/templates/types/multi-camera'

const template = templateRegistry.get<MultiCameraTemplate>('split-vertical-2')
```

### Использование шаблона проекта

```typescript
import { useProjectTemplate } from '@/features/project-templates/hooks/use-project-template'

function CreateProjectModal() {
  const { applyTemplate } = useProjectTemplate()

  const handleSelectTemplate = async (templateId: string) => {
    await applyTemplate(templateId, {
      intro: { templateId: 'modern-intro-1' },
      outro: { templateId: 'modern-outro-1' }
    })
  }
}
```

### Выполнение сценария

```typescript
import { useScenario } from '@/features/scenarios/hooks/use-scenario'

function ScenarioWizard({ scenarioId }: Props) {
  const { executeScenario, currentStep, progress } = useScenario(scenarioId)

  const handleExecute = async () => {
    const result = await executeScenario({
      clips: selectedClips,
      intro: selectedIntro,
      outro: selectedOutro
    })
  }
}
```

## XState машины

### Template Machine

```typescript
// features/templates/services/template-machine.ts
export const templateMachine = setup({
  types: {} as {
    context: {
      selectedTemplate: BaseTemplate | null
      filter: TemplateFilter
      searchQuery: string
    }
    events:
      | { type: 'SELECT'; template: BaseTemplate }
      | { type: 'FILTER'; filter: TemplateFilter }
      | { type: 'SEARCH'; query: string }
  }
}).createMachine({
  id: 'template',
  initial: 'browsing',
  states: {
    browsing: {},
    previewing: {},
    editing: {},
    applying: {}
  }
})
```

### Scenario Machine

```typescript
// features/scenarios/services/scenario-machine.ts
export const scenarioMachine = setup({
  types: {} as {
    context: {
      scenario: Scenario
      currentStep: number
      stepData: Record<string, unknown>
      result: ScenarioResult | null
    }
    events:
      | { type: 'NEXT_STEP' }
      | { type: 'PREV_STEP' }
      | { type: 'SKIP_STEP' }
      | { type: 'EXECUTE_AUTOMATION' }
      | { type: 'CANCEL' }
  }
}).createMachine({
  id: 'scenario',
  initial: 'idle',
  states: {
    idle: {},
    executing: {
      initial: 'step',
      states: {
        step: {},
        automation: {},
        validation: {}
      }
    },
    completed: {},
    failed: {}
  }
})
```
