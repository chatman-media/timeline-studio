# Миграция Resources на Event-Driven архитектуру

## Обзор

Resources Provider (effects, filters, transitions, templates, subtitles) успешно мигрирован на event-driven архитектуру, следуя паттерну Command-Event из Timeline.

## Выполненные изменения

### 1. Backend Event Handlers для Resources

**Файл**: `/src/features/resources/machines/backend-event-handlers.ts`

Создан новый модуль для обработки backend событий с инкрементальными обновлениями:

#### Обрабатываемые события:

**Media события:**
- `MediaAdded` - добавление медиа/музыки в пул
- `MediaRemoved` - удаление медиа из пула
- `MediaUpdated` - обновление метаданных медиа

**Effect события:**
- `EffectAdded` - добавление эффекта в пул
- `EffectRemoved` - удаление эффекта

**Filter события:**
- `FilterAdded` - добавление фильтра в пул
- `FilterRemoved` - удаление фильтра

**Transition события:**
- `TransitionAdded` - добавление перехода в пул
- `TransitionRemoved` - удаление перехода

**Template события:**
- `TemplateAdded` - добавление шаблона в пул
- `TemplateRemoved` - удаление шаблона

**Style Template события:**
- `StyleTemplateAdded` - добавление стилевого шаблона
- `StyleTemplateRemoved` - удаление стилевого шаблона

**Subtitle события:**
- `SubtitleAdded` - добавление субтитров в пул
- `SubtitleRemoved` - удаление субтитров

#### Ключевые функции:

```typescript
// Главный обработчик
export function handleBackendEvent(
  context: ResourcesContext,
  event: ProjectEvent,
): Partial<ResourcesContext>

// Типы для контекста
export interface ResourcesContext {
  mediaResources: MediaResource[]
  musicResources: MusicResource[]
  effectResources: EffectResource[]
  filterResources: FilterResource[]
  transitionResources: TransitionResource[]
  templateResources: TemplateResource[]
  styleTemplateResources: StyleTemplateResource[]
  subtitleResources: SubtitleResource[]
  isLoading: boolean
  error: string | null
}
```

#### Паттерн инкрементального обновления:

```typescript
function handleEffectAdded(
  context: ResourcesContext,
  event: Extract<ProjectEvent, { type: "EffectAdded" }>,
): Partial<ResourcesContext> {
  const { effect_id, name } = event.payload

  // Проверка на дубликаты
  const exists = context.effectResources.some((r) => r.resourceId === effect_id)
  if (exists) {
    return {} // Уже существует, пропускаем
  }

  // Создаем новый ресурс
  const effectResource: EffectResource = {
    id: `effect-${effect_id}-${Date.now()}`,
    type: "effect",
    name,
    resourceId: effect_id,
    addedAt: Date.now(),
    effect: { id: effect_id, name, parameters: [] } as any,
    params: {},
  }

  // Возвращаем только изменения
  return {
    effectResources: [...context.effectResources, effectResource],
  }
}
```

### 2. Обновление Resources Provider

**Файл**: `/src/features/resources/services/resources-provider.tsx`

#### Изменения архитектуры:

1. **Локальный state для инкрементальных обновлений:**
   ```typescript
   const [resourcesState, setResourcesState] = useState<ResourcesContext>({
     mediaResources: [],
     musicResources: [],
     effectResources: [],
     // ... все типы ресурсов
     isLoading: false,
     error: null,
   })
   ```

2. **Подписка на backend события:**
   ```typescript
   useEffect(() => {
     const handleEvent = (event: ProjectEvent) => {
       const resourceEventTypes = [
         "MediaAdded", "MediaRemoved", "MediaUpdated",
         "EffectAdded", "EffectRemoved",
         "FilterAdded", "FilterRemoved",
         // ... все события ресурсов
       ]

       if (resourceEventTypes.includes(event.type)) {
         // Применяем инкрементальное обновление
         setResourcesState((prev) => {
           const updates = handleBackendEvent(prev, event)
           return { ...prev, ...updates }
         })
       }
     }

     const unsubscribe = backendSync.onEvent(handleEvent)
     return unsubscribe
   }, [backendSync])
   ```

3. **Инициализация из backend state:**
   ```typescript
   useEffect(() => {
     if (!backendState?.project) {
       // Очищаем state если нет проекта
       setResourcesState({ /* пустой state */ })
       return
     }

     // Конвертируем backend pools в ресурсы
     const mediaResources = convertMediaPool(backendState.project.media_pool)
     const effectResources = convertEffectsPool(backendState.project.effects_pool)
     // ... для всех типов

     // Устанавливаем начальный state
     setResourcesState({
       mediaResources,
       musicResources,
       effectResources,
       // ... все ресурсы
     })
   }, [backendState])
   ```

4. **Использование state в контексте:**
   ```typescript
   const contextValue: ResourcesContextType = {
     resources: [...resourcesState.mediaResources, ...resourcesState.musicResources, ...],
     mediaResources: resourcesState.mediaResources,
     musicResources: resourcesState.musicResources,
     // ... все типы
   }
   ```

## Преимущества новой архитектуры

### 1. Инкрементальные обновления
- ❌ **Было**: Полная перезагрузка всех ресурсов при каждом событии
- ✅ **Стало**: Обновляется только изменившийся ресурс

### 2. Согласованность с backend
- Backend = Single Source of Truth
- События гарантируют синхронизацию
- Нет рассинхронизации между frontend и backend

### 3. Производительность
- Минимальные ре-рендеры React компонентов
- Только измененные ресурсы вызывают обновление
- Нет полного пересчета всех ресурсов

### 4. Отладка
- Все изменения логируются через события
- Легко отследить историю изменений
- Понятный flow: Command → Backend → Event → Update

## Поток данных

### Добавление эффекта:

```
1. User Action
   ↓
2. addEffect(effect)
   ↓
3. backendSync.executeCommand({
     type: "SaveResource",
     params: { resource_id, resource_type: "effect", data }
   })
   ↓
4. Backend обрабатывает команду
   ↓
5. Backend публикует событие EffectAdded
   ↓
6. ResourcesProvider получает событие
   ↓
7. handleBackendEvent → handleEffectAdded
   ↓
8. setResourcesState с новым эффектом
   ↓
9. React ре-рендерит только компоненты использующие effectResources
```

### Удаление перехода:

```
1. User Action
   ↓
2. removeResource(transition_id, "transition")
   ↓
3. backendSync.executeCommand({
     type: "DeleteResource",
     params: { resource_id, resource_type: "transition" }
   })
   ↓
4. Backend обрабатывает команду
   ↓
5. Backend публикует событие TransitionRemoved
   ↓
6. ResourcesProvider получает событие
   ↓
7. handleBackendEvent → handleTransitionRemoved
   ↓
8. setResourcesState с отфильтрованным массивом
   ↓
9. React ре-рендерит UI без удаленного перехода
```

## Соответствие документации

Реализация следует архитектуре из `/docs/03_architecture/ru/backend-sync-architecture.md`:

✅ Command-Event Pattern
✅ Backend = Single Source of Truth
✅ Инкрементальные обновления
✅ Запрет оптимистичных обновлений
✅ Event handlers для каждого типа события
✅ Логирование всех операций

## Типы ресурсов

Все типы ресурсов поддерживают event-driven подход:

1. **Media Resources** (Video/Image)
2. **Music Resources** (Audio)
3. **Effect Resources** (Видео эффекты)
4. **Filter Resources** (Фильтры)
5. **Transition Resources** (Переходы)
6. **Template Resources** (Шаблоны раскладки)
7. **Style Template Resources** (Стилевые шаблоны)
8. **Subtitle Resources** (Стили субтитров)

## События backend

Все события определены в `/src-tauri/src/state/events.rs`:

```rust
pub enum ProjectEvent {
  // Media pool events
  MediaAdded { media: MediaData },
  MediaRemoved { media_id: String },
  MediaUpdated { media_id: String, changes: MediaChanges },

  // Resource pool events
  EffectAdded { effect_id: String, name: String },
  EffectRemoved { effect_id: String },
  FilterAdded { filter_id: String, name: String },
  FilterRemoved { filter_id: String },
  TransitionAdded { transition_id: String, name: String },
  TransitionRemoved { transition_id: String },
  TemplateAdded { template_id: String, name: String },
  TemplateRemoved { template_id: String },
  StyleTemplateAdded { template_id: String, name: String },
  StyleTemplateRemoved { template_id: String },
  SubtitleAdded { subtitle_id: String, name: String },
  SubtitleRemoved { subtitle_id: String },
  // ...
}
```

## Антипаттерны (чего избегаем)

❌ **Оптимистичные обновления**
```typescript
// НЕ делаем так:
setResourcesState({ effectResources: [...prev, newEffect] })
await backend.saveEffect(newEffect)
```

✅ **Правильно**
```typescript
// Отправляем команду, ждем события
await backend.saveEffect(newEffect)
// UI обновится автоматически при получении EffectAdded
```

❌ **Полная перезагрузка state**
```typescript
// НЕ делаем так:
const fullState = await backend.getProjectState()
setResourcesState(fullState.resources) // Полная замена!
```

✅ **Правильно**
```typescript
// Обрабатываем только изменение
const updates = handleBackendEvent(currentState, event)
setResourcesState({ ...currentState, ...updates }) // Инкрементально
```

## Тестирование

Для тестирования event handlers:

```typescript
import { handleBackendEvent } from '@/features/resources/machines/backend-event-handlers'

test('handleEffectAdded adds effect to state', () => {
  const context: ResourcesContext = {
    effectResources: [],
    // ... другие ресурсы
  }

  const event: ProjectEvent = {
    type: 'EffectAdded',
    payload: { effect_id: 'blur-1', name: 'Blur' }
  }

  const updates = handleBackendEvent(context, event)

  expect(updates.effectResources).toHaveLength(1)
  expect(updates.effectResources[0].resourceId).toBe('blur-1')
})
```

## Файлы изменений

1. **Создан**: `/src/features/resources/machines/backend-event-handlers.ts`
   - Обработчики всех resource событий
   - ResourcesContext интерфейс
   - Инкрементальные обновления

2. **Обновлен**: `/src/features/resources/services/resources-provider.tsx`
   - Добавлен resourcesState для локального кэша
   - Подписка на backend события
   - Инициализация из backend state при загрузке проекта
   - Использование handleBackendEvent для обновлений

3. **Создан**: `/docs/05_development/ru/resources-event-driven-migration.md`
   - Полная документация миграции
   - Примеры использования
   - Архитектурные решения

## Следующие шаги

1. Добавить тесты для event handlers
2. Добавить обработку ошибок в handleBackendEvent
3. Рассмотреть версионирование событий для Undo/Redo
4. Оптимизировать производительность для больших пулов ресурсов

## Заключение

Resources Provider успешно мигрирован на event-driven архитектуру. Все типы ресурсов (effects, filters, transitions, templates, subtitles, media, music) теперь используют инкрементальные обновления через backend события, обеспечивая:

- Консистентность данных
- Высокую производительность
- Простоту отладки
- Масштабируемость системы
