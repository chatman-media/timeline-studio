# Performance: Оптимизация избыточных ререндеров

## Статус: Planned
## Приоритет: High
## Дата создания: 2025-11-28

---

## Краткое описание проблемы

Анализ логов (22,960 строк) выявил серьёзные проблемы с избыточными ререндерами и инициализациями компонентов при старте приложения.

---

## Выявленные проблемы

### 1. Избыточные инициализации хуков

| Хук | Количество инициализаций | Ожидаемое |
|-----|--------------------------|-----------|
| useUserSettings | 15+ | 1 |
| useResourcesAIIntegration | 12 | 1 |
| useTimelineAIIntegration | 10 | 1 |
| useRenderQueue | 9 | 1 |
| UseMulticamShortcuts | 8 | 1 |
| useBrowserAIIntegration | 6 | 1 |

**Причина:** Нестабильные зависимости в useEffect, отсутствие мемоизации контекстных значений.

### 2. Циклы "очищен → установлен" в AI интеграциях

```
[Info] [App] [useTimelineAIIntegration] Доступ к timeline очищен
[Info] [App] [useTimelineAIIntegration] Доступ к timeline установлен
[Info] [App] [useTimelineAIIntegration] Доступ к timeline очищен
[Info] [App] [useTimelineAIIntegration] Доступ к timeline установлен
... (повторяется 10+ раз)
```

**Всего cleanup/setup циклов:** 39
**Причина:** useEffect с нестабильными зависимостями вызывает cleanup → setup при каждом ререндере родителя.

### 3. MediaManagementProvider - множественные маунты

```
[Log] 🔵 [MediaManagementProvider] COMPONENT MOUNTING (x8)
```

**Причина:** Компонент размонтируется и монтируется заново при изменениях в родительском дереве.

### 4. BrowserEventHandlers - дублирование

**128 вызовов** обработчиков событий браузера.
Каждое событие обрабатывается многократно из-за повторных подписок.

### 5. Polling с избыточными вызовами

| Функция | Вызовов |
|---------|---------|
| refreshCapabilities | 13 |
| refreshJobs | 4 |
| refreshTasks | 3 |
| refreshQueue | 2 |

---

## План рефакторинга

### Фаза 1: Стабилизация контекстов (Critical)

#### 1.1 Мемоизация значений контекста

**Файлы:**
- `src/domains/media-management/providers/media-management-provider.tsx`
- `src/features/ai-chat/hooks/use-timeline-ai-integration.ts`
- `src/features/ai-chat/hooks/use-resources-ai-integration.ts`
- `src/features/ai-chat/hooks/use-browser-ai-integration.ts`

**Изменения:**
```tsx
// ДО:
const value = {
  mediaPool,
  actions,
  // ... другие поля
}

// ПОСЛЕ:
const value = useMemo(() => ({
  mediaPool,
  actions,
  // ... другие поля
}), [mediaPool, actions])
```

#### 1.2 Стабилизация useEffect зависимостей

**Паттерн проблемы:**
```tsx
// ДО - нестабильная функция в зависимостях:
useEffect(() => {
  registerAccess(accessObject)
  return () => clearAccess()
}, [accessObject]) // accessObject создаётся каждый рендер
```

**Исправление:**
```tsx
// ПОСЛЕ - стабильная ссылка через useCallback:
const stableAccess = useCallback(() => accessObject, [/* реальные зависимости */])
useEffect(() => {
  registerAccess(stableAccess())
  return () => clearAccess()
}, [stableAccess])
```

### Фаза 2: Оптимизация подписок (High)

#### 2.1 Единая подписка на события

**Файл:** `src/domains/browser/handlers/browser-event-handlers.ts`

Заменить множественные подписки на единую с фильтрацией:
```tsx
// Использовать EventEmitter паттерн вместо множественных useEffect
```

#### 2.2 Предотвращение дублирования обработчиков

Добавить проверку на существующую подписку перед созданием новой.

### Фаза 3: Оптимизация polling (Medium)

#### 3.1 Условный polling

**Файлы:**
- `src/features/video-compiler/hooks/use-gpu-capabilities.ts`
- `src/features/video-compiler/hooks/use-render-jobs.ts`
- `src/features/montage-planner/hooks/use-analysis-tasks.ts`

**Изменения:**
- Polling только когда компонент видим (IntersectionObserver)
- Увеличить интервалы для неактивных состояний
- Использовать visibility API для паузы при сворачивании

#### 3.2 Debounce для refresh функций

```tsx
const debouncedRefresh = useDebouncedCallback(refreshCapabilities, 1000)
```

### Фаза 4: Оптимизация Provider tree (Medium)

#### 4.1 Разделение часто и редко меняющихся данных

```tsx
// Разделить на два контекста:
<StaticConfigContext.Provider value={staticConfig}>
  <DynamicStateContext.Provider value={dynamicState}>
    {children}
  </DynamicStateContext.Provider>
</StaticConfigContext.Provider>
```

#### 4.2 Использование React.memo для дочерних компонентов

Обернуть компоненты, которые не должны ререндериться при изменении родителя.

---

## Метрики успеха

| Метрика | Текущее | Цель |
|---------|---------|------|
| Инициализаций useUserSettings | 15+ | 1 |
| Инициализаций AI интеграций | 30+ | 3 |
| Cleanup/setup циклов | 39 | 0 |
| MediaManagementProvider маунтов | 8 | 1 |
| BrowserEventHandlers вызовов | 128 | ~20 |
| renderWithHooks вызовов | 71+ | <30 |

---

## Приоритетность исправлений

1. **Critical** - Фаза 1 (контексты) - наибольшее влияние на производительность
2. **High** - Фаза 2 (подписки) - устранение дублирования
3. **Medium** - Фазы 3, 4 (polling, tree) - дальнейшая оптимизация

---

## Файлы для анализа

### Контексты и провайдеры:
- [ ] `src/domains/media-management/providers/media-management-provider.tsx`
- [ ] `src/features/user-settings/providers/user-settings-provider.tsx`
- [ ] `src/domains/browser/providers/browser-provider.tsx`
- [ ] `src/features/export/providers/render-queue-provider.tsx`

### AI интеграции:
- [ ] `src/features/ai-chat/hooks/use-timeline-ai-integration.ts`
- [ ] `src/features/ai-chat/hooks/use-resources-ai-integration.ts`
- [ ] `src/features/ai-chat/hooks/use-browser-ai-integration.ts`

### Polling хуки:
- [ ] `src/features/video-compiler/hooks/use-gpu-capabilities.ts`
- [ ] `src/features/video-compiler/hooks/use-render-jobs.ts`
- [ ] `src/features/montage-planner/hooks/use-analysis-tasks.ts`
- [ ] `src/features/export/hooks/use-render-queue.ts`

### Event handlers:
- [ ] `src/domains/browser/handlers/browser-event-handlers.ts`

---

## Связанные задачи

- Ports & Adapters refactoring (completed) - может влиять на стабильность зависимостей
- Test fixes (completed) - тесты должны проверять отсутствие лишних ререндеров

---

## Чеклист выполнения

- [ ] Фаза 1.1: Мемоизация контекстных значений
- [ ] Фаза 1.2: Стабилизация useEffect зависимостей
- [ ] Фаза 2.1: Единая подписка на события
- [ ] Фаза 2.2: Предотвращение дублирования обработчиков
- [ ] Фаза 3.1: Условный polling
- [ ] Фаза 3.2: Debounce для refresh функций
- [ ] Фаза 4.1: Разделение контекстов
- [ ] Фаза 4.2: React.memo для компонентов
- [ ] Верификация: повторный анализ логов
- [ ] Документация обновлена
