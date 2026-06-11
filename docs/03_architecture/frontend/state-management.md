# Управление состоянием в Timeline Studio

[← Назад к архитектуре](README.md)

## 📋 Содержание

- [Обзор](#обзор)
- [XState машины состояний](#xstate-машины-состояний)
- [React провайдеры](#react-провайдеры)
- [Паттерны использования](#паттерны-использования)

## 🎯 Обзор

Timeline Studio использует комбинацию XState v5 для управления сложными состояниями и React Context API для предоставления доступа к этим состояниям компонентам.

## 🤖 XState машины состояний

### 1. **AI Chat Machine**
📍 [`packages/domains/src/ai-services/machines/chat-machine.ts`](../../../packages/domains/src/ai-services/machines/chat-machine.ts)

Управляет состоянием AI чата: сообщения, модели, контекст, загрузка.

### 2. **App Settings Machine**
📍 [`packages/domains/src/project-management/machines/app-machine.ts`](../../../packages/domains/src/project-management/machines/app-machine.ts)

Глобальные настройки приложения: язык, тема, пути, конфигурация.

### 3. **Browser State Machine**
📍 [`packages/domains/src/browser/machines/browser-machine.ts`](../../../packages/domains/src/browser/machines/browser-machine.ts)

Состояние файлового браузера: вкладки, выбранные файлы, навигация.

### 4. **Modal Machine**
📍 [`packages/domains/src/system-integration/machines/modal-machine.ts`](../../../packages/domains/src/system-integration/machines/modal-machine.ts)

Управление модальными окнами: открытие, закрытие, стек модалок.

### 5. **Project Settings Machine**
📍 Project settings currently uses provider/service state instead of a dedicated XState machine.

Настройки текущего проекта: разрешение, FPS, аудио параметры.

### 6. **Resources Machine**
📍 Resources state is exposed through timeline resource providers; a standalone resources machine is not present.

Управление ресурсами: эффекты, фильтры, переходы, шаблоны.

### 7. **Timeline Machine**
📍 [`packages/domains/src/video-editing/machines/timeline-machine.ts`](../../../packages/domains/src/video-editing/machines/timeline-machine.ts)

Центральная машина для редактирования: треки, клипы, выделение, история.

### 8. **User Settings Machine**
📍 [`packages/domains/src/project-management/machines/user-settings-machine.ts`](../../../packages/domains/src/project-management/machines/user-settings-machine.ts)

Пользовательские настройки: персонализация, API ключи, производительность.

### 9. **Player Machine**
📍 [`packages/domains/src/video-editing/machines/player-machine.ts`](../../../packages/domains/src/video-editing/machines/player-machine.ts)

Состояние видео плеера: воспроизведение, позиция, громкость, полноэкранный режим.

### 10. **Montage Planner Machine**
📍 [`packages/domains/src/ai-services/machines/montage-planner-machine.ts`](../../../packages/domains/src/ai-services/machines/montage-planner-machine.ts)

Управление Smart Montage Planner: анализ контента, планирование монтажа, автоматическая обработка.

### 11. **AI Intelligence Machine**
📍 [`packages/domains/src/ai-services/machines/ai-intelligence-machine.ts`](../../../packages/domains/src/ai-services/machines/ai-intelligence-machine.ts)

Состояние AI анализа контента: 4 движка анализа, обработка через 257 AI инструмент, координация workflow.

## 🔌 React провайдеры

### Основные провайдеры функций

#### 1. **AI Chat Provider**
📍 [`src/features/ai-chat/services/chat-provider.ts`](../../../src/features/ai-chat/services/chat-provider.ts)

Предоставляет доступ к chat-machine и методам управления чатом.

#### 2. **App Settings Provider**
📍 [`packages/domains/src/project-management/providers/app-provider.tsx`](../../../packages/domains/src/project-management/providers/app-provider.tsx)

Контекст для глобальных настроек приложения.

#### 3. **Browser State Provider**
📍 [`src/features/browser/services/browser-state-provider.tsx`](../../../src/features/browser/services/browser-state-provider.tsx)

Контекст состояния файлового браузера.

#### 4. **Modal Provider**
📍 [`src/features/modals/services/modal-provider.tsx`](../../../src/features/modals/services/modal-provider.tsx)

Управление модальными окнами через контекст.

#### 5. **Project Settings Provider**
📍 [`packages/domains/src/project-management/providers/project-settings-provider.tsx`](../../../packages/domains/src/project-management/providers/project-settings-provider.tsx)

Контекст настроек текущего проекта.

#### 6. **Resources Provider**
📍 [`src/features/timeline/providers/resources-provider.tsx`](../../../src/features/timeline/providers/resources-provider.tsx)

Доступ к ресурсам проекта (эффекты, фильтры и т.д.).

#### 7. **Timeline Provider**
📍 [`src/features/timeline/providers/timeline-providers.tsx`](../../../src/features/timeline/providers/timeline-providers.tsx)

Центральный провайдер для timeline функциональности.

#### 8. **User Settings Provider**
📍 [`src/features/user-settings/services/user-settings-provider.tsx`](../../../src/features/user-settings/services/user-settings-provider.tsx)

Контекст пользовательских настроек.

#### 9. **Player Provider**
📍 [`src/features/timeline/providers/player-provider.tsx`](../../../src/features/timeline/providers/player-provider.tsx)

Управление состоянием видео плеера.

#### 10. **Montage Planner Provider**
📍 [`src/features/montage-planner/services/montage-planner-provider.tsx`](../../../src/features/montage-planner/services/montage-planner-provider.tsx)

Контекст для Smart Montage Planner с интеграцией Tauri событий.

#### 11. **AI Intelligence Provider**
📍 AI intelligence state is owned by the AI services domain machine.

Управление состоянием AI анализа контента и 4 движков обработки.

### Дополнительные провайдеры

#### 12. **Keyboard Shortcuts Provider**
📍 [`src/features/keyboard-shortcuts/services/shortcuts-provider.tsx`](../../../src/features/keyboard-shortcuts/services/shortcuts-provider.tsx)

Регистрация и управление горячими клавишами (без XState машины).

#### 13. **Drag-Drop Provider**
📍 [`src/features/timeline/components/drag-drop-provider.tsx`](../../../src/features/timeline/components/drag-drop-provider.tsx)

Специализированный провайдер для drag-and-drop в timeline.

#### 14. **I18n Provider**
📍 [`src/i18n/services/i18n-provider.tsx`](../../../src/i18n/services/i18n-provider.tsx)

Интернационализация и локализация приложения.

### Агрегаторы провайдеров

#### 15. **Media Studio Providers**
📍 [`src/features/media-studio/services/providers.tsx`](../../../src/features/media-studio/services/providers.tsx)

Объединяет все необходимые провайдеры для Media Studio.

#### 16. **Tauri Mock Provider**
📍 [`src/test/providers/tauri-mock-provider.tsx`](../../../src/test/providers/tauri-mock-provider.tsx)

Mock провайдер для тестирования без Tauri.

## 📐 Паттерны использования

### Создание XState машины

```typescript
// timeline-machine.ts
import { setup, assign } from 'xstate'

export const timelineMachine = setup({
  types: {} as {
    context: TimelineContext
    events: TimelineEvents
  },
  actions: {
    // Определение actions
  },
  guards: {
    // Определение guards
  }
}).createMachine({
  id: 'timeline',
  initial: 'idle',
  context: {
    // Начальный контекст
  },
  states: {
    // Состояния машины
  }
})
```

### Создание провайдера

```typescript
// timeline-provider.tsx
import { createActorContext } from '@xstate/react'
import { timelineMachine } from './timeline-machine'

export const TimelineContext = createActorContext(timelineMachine)

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  return (
    <TimelineContext.Provider>
      {children}
    </TimelineContext.Provider>
  )
}
```

### Использование в компонентах

```typescript
// component.tsx
import { useTimeline } from '@/features/timeline/hooks/use-timeline'

export function MyComponent() {
  const { state, send } = useTimeline()
  
  return (
    <div>
      <p>Current state: {state.value}</p>
      <button onClick={() => send({ type: 'SOME_EVENT' })}>
        Trigger Event
      </button>
    </div>
  )
}
```

## 🔗 Связи между машинами

Некоторые машины взаимодействуют друг с другом:

- **Timeline Machine** ↔ **Player Machine**: Синхронизация позиции воспроизведения
- **Browser Machine** → **Timeline Machine**: Добавление медиа файлов
- **Project Settings** → **Timeline Machine**: Обновление параметров проекта
- **Modal Machine** ← **Все машины**: Открытие модальных окон из любого места
- **AI Intelligence Machine** → **Timeline Machine**: Автоматическое создание клипов на основе AI анализа
- **Montage Planner Machine** → **Timeline Machine**: Применение автоматических планов монтажа
- **AI Chat Machine** ↔ **AI Intelligence Machine**: Координация AI обработки и **257 AI инструмента**
- **Resources Machine** ↔ **AI Intelligence Machine**: Использование AI для рекомендаций ресурсов

## 📚 Дополнительные ресурсы

- [XState v5 документация](https://stately.ai/docs)
- [Тестирование XState машин](../../05_development/testing.md#тестирование-xstate)
- [Архитектура frontend](README.md)

---

[← Назад к архитектуре](README.md) | [Далее: Взаимодействие компонентов →](../communication.md)
