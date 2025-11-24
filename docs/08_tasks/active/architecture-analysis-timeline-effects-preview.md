# Анализ архитектуры модулей Timeline, Effects и Preview

## Обзор

Проведен детальный анализ архитектуры трех ключевых модулей Timeline Studio:
- **Timeline** - управление временной шкалой и клипами
- **Effects** - система визуальных эффектов
- **Preview** - система предпросмотра в реальном времени

## Выявленные проблемы

### 1. Дублирование кода и функциональности

#### 1.1 Множественные системы рендеринга эффектов

**Проблема**: Существует несколько независимых систем для рендеринга эффектов:

1. **EffectsPreviewService** (`video-player/services/effects-preview.ts`)
   - Собственная WebGL реализация
   - Дублирует шейдеры и логику рендеринга
   - 815 строк кода с полным стеком WebGL

2. **WebGL2UnifiedRenderer** (`effects/services/webgl2-unified-renderer.ts`)
   - Более современная унифицированная система
   - Должна быть единственной системой рендеринга

3. **EffectsPlayerIntegration** (`timeline/services/effects-player-integration.ts`)
   - Промежуточный слой между timeline и effects
   - Частично дублирует функциональность

**Решение**: Использовать только WebGL2UnifiedRenderer как единую систему рендеринга.

#### 1.2 Дублирование типов эффектов

**Проблема**: Несколько несовместимых систем типизации:

```typescript
// timeline/types/timeline.ts
export interface AppliedEffect {
  id: string
  effectId: string
  customParams?: Record<string, any>
  enabled: boolean
  order: number
}

// effects/types/unified-effects.ts
export interface AppliedEffect {
  id: string
  effectId: string
  enabled: boolean
  order: number
  parameters: EffectParameter[] // другая структура!
  keyframes: Record<string, EffectKeyframe[]>
}

// preview/types.ts
export interface Effect {
  id: string
  type: EffectType // специфичный для preview
  enabled: boolean
  parameters: Record<string, any>
  intensity: number
}
```

**Решение**: Унифицировать типы, использовать единую систему из `unified-effects.ts`.

### 2. Циклические зависимости

#### 2.1 Timeline ↔ Effects

**Проблема**: Модули зависят друг от друга:

```typescript
// timeline/hooks/use-timeline-effects.ts
import { addEffectToClip } from "@/features/effects/utils/user-effects"

// effects/hooks/use-unified-effects.ts
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
```

**Решение**: Ввести слой абстракции через интерфейсы или использовать event-driven архитектуру.

#### 2.2 Preview ↔ Effects ↔ Timeline

**Проблема**: Тройная циклическая зависимость:

```typescript
// preview/services/unified-effects-bridge.ts
import { EffectManager } from "@/features/effects/services/effect-manager"

// preview/hooks/use-timeline-integration.ts
import { useTimeline } from "@/features/timeline/hooks/use-timeline"

// timeline/hooks/use-effects-preview.ts
import { useEffects } from "@/features/effects/hooks/use-effects"
```

**Решение**: Preview должен быть потребителем, а не провайдером данных.

### 3. Нарушения принципа единственной ответственности

#### 3.1 Timeline модуль

**Проблема**: Timeline отвечает за слишком много:
- Управление клипами и треками
- Применение эффектов
- Рендеринг preview
- Управление переходами
- Speed ramping
- Маркеры
- И многое другое

**Решение**: Выделить отдельные модули:
- `timeline-core` - только временная шкала
- `clip-effects` - управление эффектами клипов
- `timeline-preview` - интеграция с preview

#### 3.2 Effects модуль

**Проблема**: Смешивает несколько обязанностей:
- Определение эффектов
- Рендеринг (WebGL)
- Управление состоянием
- Node-based редактор
- Shader компиляция

**Решение**: Разделить на:
- `effects-core` - определения и типы
- `effects-renderer` - WebGL рендеринг
- `effects-editor` - UI для редактирования

### 4. Неоптимальные связи между модулями

#### 4.1 Прямые импорты вместо инверсии зависимостей

**Проблема**: Модули напрямую импортируют друг друга:

```typescript
// Плохо - прямая зависимость
import { EffectsPreviewService } from "@/features/video-player/services/effects-preview"

// Хорошо - через интерфейс
import type { IEffectsRenderer } from "@/core/interfaces/effects-renderer"
```

#### 4.2 Отсутствие четких контрактов

**Проблема**: Нет явных интерфейсов между модулями, что приводит к тесной связанности.

**Решение**: Определить интерфейсы:
```typescript
// core/interfaces/effects-provider.ts
export interface IEffectsProvider {
  getAvailableEffects(): BaseEffect[]
  applyEffect(clipId: string, effectId: string): void
}

// core/interfaces/preview-renderer.ts
export interface IPreviewRenderer {
  renderFrame(source: HTMLVideoElement, effects: Effect[]): Promise<ImageBitmap>
}
```

### 5. Потенциальные точки для рефакторинга

#### 5.1 Унификация систем эффектов

**Текущее состояние**:
- 3 разных системы рендеринга
- 2 системы типов эффектов
- Несколько способов применения эффектов

**Предлагаемая архитектура**:
```
core/
  interfaces/
    - effects.ts          # Базовые интерфейсы
    - renderer.ts         # Интерфейс рендерера
    - preview.ts          # Интерфейс preview

features/
  effects-core/           # Только определения эффектов
    types/
    data/
    
  effects-renderer/       # WebGL рендеринг
    services/
      - webgl2-renderer.ts
    
  timeline-core/          # Только timeline логика
    types/
    services/
    
  timeline-effects/       # Интеграция эффектов с timeline
    hooks/
    services/
    
  preview-system/         # Унифицированный preview
    services/
    hooks/
```

#### 5.2 Event-driven архитектура

**Проблема**: Прямые вызовы между модулями создают жесткие связи.

**Решение**: Использовать события:
```typescript
// Вместо прямого вызова
effectsService.applyEffect(clipId, effectId)

// Использовать события
eventBus.emit('effect:apply', { clipId, effectId })
```

#### 5.3 Композиция вместо наследования

**Текущее**: Монолитные сервисы с большим количеством методов.

**Предлагаемое**: Небольшие композируемые сервисы:
```typescript
// Вместо одного большого EffectsService
class EffectRegistry { }      // Только регистрация
class EffectApplier { }       // Только применение
class EffectRenderer { }      // Только рендеринг
class EffectSerializer { }    // Только сериализация
```

## Рекомендации по рефакторингу

### Фаза 1: Унификация типов (1-2 дня)
1. Создать единую систему типов в `core/types/effects.ts`
2. Обновить все модули для использования единых типов
3. Удалить дублирующиеся определения

### Фаза 2: Разделение ответственности (3-5 дней)
1. Выделить `timeline-core` без эффектов
2. Создать `effects-core` только с определениями
3. Вынести рендеринг в отдельный модуль

### Фаза 3: Устранение циклических зависимостей (2-3 дня)
1. Ввести интерфейсы в `core/interfaces`
2. Использовать dependency injection
3. Применить event-driven подход где необходимо

### Фаза 4: Оптимизация рендеринга (2-3 дня)
1. Унифицировать все системы рендеринга в одну
2. Реализовать эффективное кеширование
3. Оптимизировать WebGL pipeline

### Фаза 5: Тестирование и документация (2-3 дня)
1. Обновить тесты под новую архитектуру
2. Написать интеграционные тесты
3. Обновить документацию

## Выводы

Текущая архитектура имеет серьезные проблемы с дублированием кода, циклическими зависимостями и нарушением принципов SOLID. Предлагаемый рефакторинг позволит:

1. **Уменьшить связанность** между модулями
2. **Устранить дублирование** кода и типов
3. **Улучшить производительность** за счет единой системы рендеринга
4. **Упростить поддержку** благодаря четкому разделению ответственности
5. **Облегчить тестирование** через dependency injection

Рекомендуется начать с унификации типов, так как это наименее рискованный шаг, который сразу принесет пользу.