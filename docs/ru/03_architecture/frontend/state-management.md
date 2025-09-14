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
📍 [`src/features/ai-chat/services/chat-machine.ts`](../../src/features/ai-chat/services/chat-machine.ts)

Управляет состоянием AI чата: сообщения, модели, контекст, загрузка.

### 2. **App Settings Machine**
📍 [`src/features/app-state/services/app-settings-machine.ts`](../../src/features/app-state/services/app-settings-machine.ts)

Глобальные настройки приложения: язык, тема, пути, конфигурация.

### 3. **Browser State Machine**
📍 [`src/features/browser/services/browser-state-machine.ts`](../../src/features/browser/services/browser-state-machine.ts)

Состояние файлового браузера: вкладки, выбранные файлы, навигация.

### 4. **Modal Machine**
📍 [`src/features/modals/services/modal-machine.ts`](../../src/features/modals/services/modal-machine.ts)

Управление модальными окнами: открытие, закрытие, стек модалок.

### 5. **Project Settings Machine**
📍 [`src/features/project-settings/services/project-settings-machine.ts`](../../src/features/project-settings/services/project-settings-machine.ts)

Настройки текущего проекта: разрешение, FPS, аудио параметры.

### 6. **Resources Machine**
📍 [`src/features/resources/services/resources-machine.ts`](../../src/features/resources/services/resources-machine.ts)

Управление ресурсами: эффекты, фильтры, переходы, шаблоны.

### 7. **Timeline Machine**
📍 [`src/features/timeline/services/timeline-machine.ts`](../../src/features/timeline/services/timeline-machine.ts)

Центральная машина для редактирования: треки, клипы, выделение, история.

### 8. **User Settings Machine**
📍 [`src/features/user-settings/services/user-settings-machine.ts`](../../src/features/user-settings/services/user-settings-machine.ts)

Пользовательские настройки: персонализация, API ключи, производительность.

### 9. **Player Machine**
📍 [`src/features/video-player/services/player-machine.ts`](../../src/features/video-player/services/player-machine.ts)

Состояние видео плеера: воспроизведение, позиция, громкость, полноэкранный режим.

### 10. **Montage Planner Machine**
📍 [`src/features/montage-planner/services/montage-planner-machine.ts`](../../src/features/montage-planner/services/montage-planner-machine.ts)

Управление Smart Montage Planner: анализ контента, планирование монтажа, автоматическая обработка.

### 11. **AI Intelligence Machine**
📍 [`src/features/ai-content-intelligence/shared/services/ai-intelligence-machine.ts`](../../src/features/ai-content-intelligence/shared/services/ai-intelligence-machine.ts)

Состояние AI анализа контента: 4 движка анализа, обработка через 257 AI инструмент, координация workflow.

## 🔌 React провайдеры

### Основные провайдеры функций

#### 1. **AI Chat Provider**
📍 [`src/features/ai-chat/services/chat-provider.tsx`](../../src/features/ai-chat/services/chat-provider.tsx)

Предоставляет доступ к chat-machine и методам управления чатом.

#### 2. **App Settings Provider**
📍 [`src/features/app-state/services/app-settings-provider.tsx`](../../src/features/app-state/services/app-settings-provider.tsx)

Контекст для глобальных настроек приложения.

#### 3. **Browser State Provider**
📍 [`src/features/browser/services/browser-state-provider.tsx`](../../src/features/browser/services/browser-state-provider.tsx)

Контекст состояния файлового браузера.

#### 4. **Modal Provider**
📍 [`src/features/modals/services/modal-provider.tsx`](../../src/features/modals/services/modal-provider.tsx)

Управление модальными окнами через контекст.

#### 5. **Project Settings Provider**
📍 [`src/features/project-settings/services/project-settings-provider.tsx`](../../src/features/project-settings/services/project-settings-provider.tsx)

Контекст настроек текущего проекта.

#### 6. **Resources Provider**
📍 [`src/features/resources/services/resources-provider.tsx`](../../src/features/resources/services/resources-provider.tsx)

Доступ к ресурсам проекта (эффекты, фильтры и т.д.).

#### 7. **Timeline Provider**
📍 [`src/features/timeline/services/timeline-provider.tsx`](../../src/features/timeline/services/timeline-provider.tsx)

Центральный провайдер для timeline функциональности.

#### 8. **User Settings Provider**
📍 [`src/features/user-settings/services/user-settings-provider.tsx`](../../src/features/user-settings/services/user-settings-provider.tsx)

Контекст пользовательских настроек.

#### 9. **Player Provider**
📍 [`src/features/video-player/services/player-provider.tsx`](../../src/features/video-player/services/player-provider.tsx)

Управление состоянием видео плеера.

#### 10. **Montage Planner Provider**
📍 [`src/features/montage-planner/services/montage-planner-provider.tsx`](../../src/features/montage-planner/services/montage-planner-provider.tsx)

Контекст для Smart Montage Planner с интеграцией Tauri событий.

#### 11. **AI Intelligence Provider**
📍 [`src/features/ai-content-intelligence/services/ai-intelligence-provider.tsx`](../../src/features/ai-content-intelligence/services/ai-intelligence-provider.tsx)

Управление состоянием AI анализа контента и 4 движков обработки.

### Дополнительные провайдеры

#### 12. **Keyboard Shortcuts Provider**
📍 [`src/features/keyboard-shortcuts/services/shortcuts-provider.tsx`](../../src/features/keyboard-shortcuts/services/shortcuts-provider.tsx)

Регистрация и управление горячими клавишами (без XState машины).

#### 13. **Drag-Drop Provider**
📍 [`src/features/timeline/components/drag-drop-provider.tsx`](../../src/features/timeline/components/drag-drop-provider.tsx)

Специализированный провайдер для drag-and-drop в timeline.

#### 14. **I18n Provider**
📍 [`src/i18n/services/i18n-provider.tsx`](../../src/i18n/services/i18n-provider.tsx)

Интернационализация и локализация приложения.

### Агрегаторы провайдеров

#### 15. **Media Studio Providers**
📍 [`src/features/media-studio/services/providers.tsx`](../../src/features/media-studio/services/providers.tsx)

Объединяет все необходимые провайдеры для Media Studio.

#### 16. **Tauri Mock Provider**
📍 [`src/features/media-studio/services/tauri-mock-provider.tsx`](../../src/features/media-studio/services/tauri-mock-provider.tsx)

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
- [Тестирование XState машин](../05-development/testing.md#тестирование-xstate)
- [Архитектура frontend](frontend.md)

---

[← Назад к архитектуре](README.md) | [Далее: Взаимодействие компонентов →](communication.md)