# План Рефакторинга: Консолидация Montage Planner

**Статус:** Запланировано
**Приоритет:** Высокий 🔴
**Сложность:** Средняя
**Время:** 4-6 дней
**Дата создания:** 2025-12-07

---

## Проблема

Архитектура Montage Planner страдает от **критического дублирования типов и логики** между тремя модулями:

1. **`src/features/ai-director/`** (59 файлов) - Исходный модуль с montage функциональностью
2. **`src/features/montage-planner/`** (40 файлов) - Новый специализированный модуль
3. **`src/domains/ai-services/`** (117 файлов) - Доменный слой

### Критичные дублирования:

- ❌ **4 разных определения `MontagePlan`** - несовместимы между собой
- ❌ **3 разных определения `Fragment`/`MontageClip`**
- ❌ **3 разных определения `MontageStyle`**
- ❌ **Дублирование логики применения к timeline**
- ❌ **Отсутствие связи между ai-director и montage-planner**

---

## Решение

Создать **унифицированные типы в `domains/ai-services/types/`** и мигрировать все модули на эти типы через конверторы.

---

## ФАЗА 1: Унификация типов (1-2 дня)

### Задача 1.1: Создать unified MontagePlan

**Создать:** `/src/domains/ai-services/types/unified-montage-plan.ts`

```typescript
export interface UnifiedMontagePlan {
  // Core fields
  id: string
  name: string

  // Sequences (advanced montage planner feature)
  sequences: Sequence[]

  // Legacy clips support (for AI Director compatibility)
  clips?: MontageClip[]

  // Durations
  totalDuration: number
  targetDuration?: number

  // Style (support both string and object)
  style: string | MontageStyle

  // Optional features
  transitions: TransitionPlan[]
  music?: MontageMusicSettings
  texts?: MontageTextSettings[]

  // Metadata
  metadata: PlanMetadata

  // Scoring
  qualityScore: number
  engagementScore: number
  coherenceScore?: number

  // Pacing
  pacing?: PacingProfile

  // Timestamps
  createdAt: Date
  updatedAt?: Date

  // Version control
  version: number

  // Instructions (from AI Director)
  instructions?: string
  description?: string
}
```

**Файлы для объединения:**
- [ ] `src/features/ai-director/types/montage-plan.ts` → extractить поля
- [ ] `src/domains/ai-services/types/montage-planner.ts` → extractить поля
- [ ] `src/features/montage-planner/types/index.ts` → взять как основу (наиболее полный)
- [ ] `src/types/montage-planner-rust.ts` → учесть Rust типы

---

### Задача 1.2: Создать unified Fragment

**Создать:** `/src/domains/ai-services/types/unified-fragment.ts`

```typescript
export interface UnifiedFragment {
  // Core
  id: string
  videoId: string
  sourceFile?: MediaFile

  // Timing
  startTime: number
  endTime: number
  duration: number

  // Visual
  screenshotPath?: string

  // Analysis
  objects: string[]
  people: Person[]
  score: MomentScore  // Detailed scoring
  tags: string[]
  description?: string

  // Effects
  transitionId?: string
  transition?: Transition
  effectId?: string
  effect?: VideoEffect

  // Legacy support for AI Director
  filePath?: string  // alias for sourceFile?.path
  reason?: string    // alias for description
  qualityScore?: number  // alias for score.totalScore
}
```

**Файлы для объединения:**
- [ ] `src/features/ai-director/types/montage-plan.ts` → `MontageClip`
- [ ] `src/domains/ai-services/types/montage-planner.ts` → `Fragment`
- [ ] `src/features/montage-planner/types/index.ts` → `Fragment` (взять как основу)

---

### Задача 1.3: Создать unified MontageStyle

**Создать:** `/src/domains/ai-services/types/unified-montage-style.ts`

```typescript
export type MontageStyleId =
  | "dynamic-action"
  | "cinematic-drama"
  | "music-video"
  | "documentary"
  | "social-media"
  | "corporate"
  | "travel"
  | "wedding"

export interface MontageStyle {
  id: MontageStyleId
  name: string
  description: string

  // Cutting parameters
  cutting: {
    averageShotLength: number
    variability: number
    rhythmComplexity: number
  }

  // Transitions
  transitions: {
    preferredTypes: TransitionType[]
    frequency: number
    complexity: number
  }

  // Emotional arc
  emotionalArc: EmotionalCurve

  // Visual/Style parameters
  visual?: VisualParameters
  params?: StyleParameters
}

// Allow string for backward compatibility
export type MontageStyleOrString = MontageStyle | string
```

**Файлы для объединения:**
- [ ] `src/features/ai-director/types/montage-plan.ts` → union type
- [ ] `src/types/montage-planner-rust.ts` → enum
- [ ] `src/features/montage-planner/types/index.ts` → объект (взять как основу)

---

### Задача 1.4: Создать конверторы

**Создать:** `/src/domains/ai-services/converters/montage-plan-converters.ts`

```typescript
/**
 * Convert AI Director MontagePlan to Unified MontagePlan
 */
export function fromAIDirectorPlan(plan: AIDirectorMontagePlan): UnifiedMontagePlan

/**
 * Convert Rust MontagePlan to Unified MontagePlan
 */
export function fromRustPlan(plan: RustMontagePlan): UnifiedMontagePlan

/**
 * Convert Unified to AI Director format
 */
export function toAIDirectorPlan(plan: UnifiedMontagePlan): AIDirectorMontagePlan

/**
 * Convert Unified to Rust format
 */
export function toRustPlan(plan: UnifiedMontagePlan): RustMontagePlan

/**
 * Convert MontageClip to Fragment
 */
export function clipToFragment(clip: MontageClip, videoId: string): UnifiedFragment

/**
 * Convert Fragment to MontageClip
 */
export function fragmentToClip(fragment: UnifiedFragment): MontageClip
```

**Тесты:**
- [ ] Создать тесты для всех конверторов
- [ ] Проверить двустороннюю конвертацию (roundtrip)
- [ ] Тесты на edge cases (missing fields, undefined)

---

### Задача 1.5: Обновить State Machine

**Файл:** `/src/domains/ai-services/machines/montage-planner-machine.ts`

**Изменения:**
- [ ] Обновить context на использование `UnifiedMontagePlan`
- [ ] Обновить context на использование `UnifiedFragment[]`
- [ ] Добавить конверторы при вызове Tauri команд
- [ ] Обновить типы событий (events)
- [ ] Обновить типы guards и actions

**Тесты:**
- [ ] Проверить все состояния работают
- [ ] Проверить конверсия при вызове backend
- [ ] Проверить совместимость с существующими компонентами

---

## ФАЗА 2: Миграция модулей (2-3 дня)

### Задача 2.1: Мигрировать domains/ai-services

**Файлы для обновления:**

**Services:**
- [ ] `services/montage-planning/content-analyzer.ts` → использовать `UnifiedFragment`
- [ ] `services/montage-planning/moment-detector.ts` → использовать `UnifiedFragment`
- [ ] `services/montage-planning/plan-generator.ts` → использовать `UnifiedMontagePlan`
- [ ] `services/montage-planning/rhythm-calculator.ts` → использовать unified типы
- [ ] `services/montage-planning/montage-planner-ai-integration.ts` → использовать unified типы
- [ ] `services/montage-planning/timeline-integration-service.ts` → использовать unified типы

**Types:**
- [ ] Удалить старый `types/montage-planner.ts`
- [ ] Обновить `types/index.ts` на re-export из unified типов

**Tauri:**
- [ ] `tauri/montage-planner-commands.ts` → добавить конверторы Rust ↔ Unified
- [ ] `tauri/workflow-automation-commands.ts` → добавить конверторы

---

### Задача 2.2: Мигрировать features/montage-planner

**Types:**
- [ ] Обновить `types/index.ts` на re-export из `domains/ai-services/types/`
- [ ] Оставить только feature-specific типы: `Sequence`, `PacingProfile`, `AnalysisTask`

**Hooks:**
- [ ] `hooks/use-montage-planner.ts` → использовать unified типы
- [ ] `hooks/use-content-analysis.ts` → использовать unified типы
- [ ] `hooks/use-plan-generator.ts` → использовать unified типы
- [ ] `hooks/use-integrated-analysis.ts` → использовать unified типы
- [ ] `hooks/use-montage-backend.ts` → добавить конверторы
- [ ] `hooks/use-timeline-integration.ts` → использовать unified service
- [ ] `hooks/use-analysis-tasks.ts` → обновить типы

**Components:**
- [ ] Обновить все компоненты на unified типы
- [ ] Проверить что UI корректно отображает данные

**Services:**
- [ ] `services/montage-planner-provider.tsx` → обновить context типы
- [ ] `services/analysis-task-bridge.ts` → добавить конверторы

---

### Задача 2.3: Мигрировать features/ai-director

**Стратегия:** Добавить конверторы, сохранить старые типы для совместимости

**Types:**
- [ ] Оставить `types/montage-plan.ts` для legacy support
- [ ] Добавить `@deprecated` комментарии
- [ ] Оставить `types/montage-templates.ts` (unique для AI Director)

**Hooks:**
- [ ] `hooks/use-montage-applicator.ts` → использовать unified timeline integration
- [ ] `hooks/use-montage-plan-history.ts` → добавить конверторы при save/load
- [ ] `hooks/use-montage-template.ts` → сохранить как есть

**Utils:**
- [ ] `utils/montage-plan-parser.ts` → возвращать `UnifiedMontagePlan`
- [ ] `utils/montage-plan-io.ts` → добавить конверторы при load/save

**Components:**
- [ ] `components/montage-plan-editor.tsx` → работать с unified типами
- [ ] `components/montage-plan-preview.tsx` → работать с unified типами
- [ ] `components/montage-template-selector.tsx` → сохранить как есть

---

### Задача 2.4: Консолидировать Timeline Integration

**Создать:** `/src/domains/ai-services/services/montage-planning/unified-timeline-integration.ts`

**Объединить логику из:**
- [ ] `features/ai-director/hooks/use-montage-applicator.ts` → императивный подход
- [ ] `domains/ai-services/services/montage-planning/timeline-integration-service.ts` → domain подход

**Функциональность:**
```typescript
export class UnifiedTimelineIntegrationService {
  // Apply plan to timeline
  async applyPlanToTimeline(plan: UnifiedMontagePlan, options): Promise<void>

  // Support both clips and sequences
  private async applySequences(sequences: Sequence[]): Promise<void>
  private async applyClips(clips: MontageClip[]): Promise<void>

  // Generate preview without applying
  async generatePreview(plan: UnifiedMontagePlan): Promise<PreviewData>

  // Validate plan before applying
  async validatePlan(plan: UnifiedMontagePlan): Promise<ValidationResult>

  // Apply transitions
  private async applyTransitions(transitions: TransitionPlan[]): Promise<void>

  // Apply music
  private async applyMusic(music: MontageMusicSettings): Promise<void>

  // Create markers from sequences
  private async createMarkers(sequences: Sequence[]): Promise<void>
}
```

**Обновить hooks:**
- [ ] `features/ai-director/hooks/use-montage-applicator.ts` → использовать `UnifiedTimelineIntegrationService`
- [ ] `features/montage-planner/hooks/use-timeline-integration.ts` → использовать `UnifiedTimelineIntegrationService`

---

## ФАЗА 3: Очистка и оптимизация (1 день)

### Задача 3.1: Удалить дублирующие определения

**Файлы для удаления:**
- [ ] `src/features/ai-director/types/montage-plan.ts` → оставить только legacy support с `@deprecated`
- [ ] `src/domains/ai-services/types/montage-planner.ts` → удалить полностью
- [ ] Старые импорты из `features/montage-planner/types/index.ts` (оставить только unique)

**Файлы для обновления:**
- [ ] Обновить все `index.ts` на корректные re-exports
- [ ] Удалить circular dependencies

---

### Задача 3.2: Консолидировать шаблоны (опционально)

**Создать:** `/src/domains/ai-services/types/montage-templates.ts`

**Объединить:**
- [ ] AI Director: `BUILT_IN_TEMPLATES` (6 шаблонов)
- [ ] Montage Planner: `MONTAGE_STYLES` (6 стилей)

**Структура:**
```typescript
export interface MontageTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: TemplateCategory
  tags: string[]

  // Link to montage style
  styleId: string
  style: MontageStyle

  // Template-specific parameters
  parameters: TemplateParameters
  clipRules: ClipSelectionRules
  transitionRules: TransitionRules
  musicSettings?: MusicSettings

  isBuiltIn: boolean
  createdAt: Date
}

export const UNIFIED_TEMPLATES: Record<string, MontageTemplate>
```

---

### Задача 3.3: Обновить документацию

**Создать:**
- [ ] `/docs/03_architecture/montage-planner-architecture.md` - описание новой архитектуры
- [ ] `/docs/05_development/montage-planner-guide.md` - гайд для разработчиков

**Обновить:**
- [ ] `CLAUDE.md` - добавить информацию о unified типах
- [ ] Комментарии в коде - добавить JSDoc для всех unified типов

---

### Задача 3.4: Тестирование

**Integration Tests:**
- [ ] Тест: AI Director → создание плана → применение к timeline
- [ ] Тест: Montage Planner → анализ → генерация → применение к timeline
- [ ] Тест: Конверсия между AI Director и Montage Planner форматами
- [ ] Тест: Сохранение и загрузка планов (backward compatibility)
- [ ] Тест: Применение Rust планов к timeline

**Unit Tests:**
- [ ] Все конверторы (roundtrip tests)
- [ ] State machine с unified типами
- [ ] Timeline integration service

**E2E Tests:**
- [ ] Полный workflow AI Director
- [ ] Полный workflow Montage Planner
- [ ] Совместное использование обоих модулей

---

## Финальная структура

```
src/
├── domains/ai-services/
│   ├── types/
│   │   ├── unified-montage-plan.ts      # ✅ ЕДИНЫЙ MontagePlan
│   │   ├── unified-fragment.ts          # ✅ ЕДИНЫЙ Fragment
│   │   ├── unified-montage-style.ts     # ✅ ЕДИНЫЙ MontageStyle
│   │   ├── montage-templates.ts         # ✅ ЕДИНЫЕ шаблоны
│   │   ├── analysis.ts                  # VideoAnalysis, AudioAnalysis
│   │   ├── moment-score.ts              # MomentScore
│   │   └── sequences.ts                 # Sequence, PacingProfile
│   ├── converters/
│   │   ├── montage-plan-converters.ts   # 🔄 Конверторы типов
│   │   └── rust-converters.ts           # 🔄 Rust ↔ TS
│   ├── services/montage-planning/
│   │   ├── content-analyzer.ts
│   │   ├── moment-detector.ts
│   │   ├── plan-generator.ts
│   │   ├── rhythm-calculator.ts
│   │   ├── ai-integration.ts
│   │   └── unified-timeline-integration.ts  # 🎯 ЕДИНЫЙ сервис
│   └── machines/
│       └── montage-planner-machine.ts
│
├── features/montage-planner/
│   ├── types/
│   │   ├── index.ts                     # ⚡ Re-export from domains
│   │   ├── sequences.ts                 # Feature-specific
│   │   ├── pacing.ts                    # Feature-specific
│   │   └── analysis-task.ts             # Feature-specific
│   ├── hooks/
│   │   ├── use-montage-planner.ts
│   │   └── ...
│   └── components/
│
└── features/ai-director/
    ├── types/
    │   ├── montage-plan.ts              # @deprecated (legacy support)
    │   └── montage-templates.ts         # ✅ Unique для AI Director
    ├── hooks/
    │   ├── use-montage-template.ts
    │   ├── use-montage-plan-history.ts
    │   └── use-ai-montage-chat.ts
    └── utils/
        ├── montage-plan-parser.ts
        └── montage-plan-io.ts
```

---

## Метрики успеха

После завершения рефакторинга должны быть достигнуты:

- [ ] ✅ **1 единое определение `MontagePlan`** (вместо 4)
- [ ] ✅ **1 единое определение `Fragment`** (вместо 3)
- [ ] ✅ **1 единое определение `MontageStyle`** (вместо 3)
- [ ] ✅ **0 дублирующихся типов** между модулями
- [ ] ✅ **Единый сервис timeline integration**
- [ ] ✅ **Все тесты проходят** (unit, integration, e2e)
- [ ] ✅ **0 TypeScript ошибок**
- [ ] ✅ **Backward compatibility** с существующими планами
- [ ] ✅ **Документация обновлена**

---

## Риски

### Высокие риски:

1. **Breaking changes** в существующих планах
   - **Митигация:** Конверторы для старых форматов, версионирование

2. **Регрессия функциональности**
   - **Митигация:** Comprehensive testing, feature flags

3. **Долгая миграция** (больше 6 дней)
   - **Митигация:** Поэтапная миграция, можно остановиться после любой фазы

### Средние риски:

4. **Проблемы совместимости** Rust ↔ TypeScript
   - **Митигация:** Детальные конверторы, тесты на roundtrip

5. **Circular dependencies** при re-exports
   - **Митигация:** Четкая иерархия импортов, избегать re-exports где возможно

---

## Следующие шаги

1. ✅ Получить approval на план рефакторинга
2. ⏳ Создать feature branch `refactor/montage-planner-consolidation`
3. ⏳ Начать с Фазы 1: Унификация типов
4. ⏳ Постепенная миграция модулей
5. ⏳ Comprehensive testing
6. ⏳ Code review и merge

---

**Автор:** Claude Sonnet 4.5
**Дата:** 2025-12-07
