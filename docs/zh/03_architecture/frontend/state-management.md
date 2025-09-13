# State Management in Timeline Studio

## 📋 Contents

- [Overview](#overview)
- [XState State Machines](#xstate-state-machines)
- [React Providers](#react-providers)
- [Usage Patterns](#usage-patterns)

## 🎯 Overview

Timeline Studio uses a combination of XState v5 for managing complex states and React Context API for providing access to these states to components.

## 🤖 XState State Machines

### 1. **AI Chat Machine**
📍 [`src/features/ai-chat/services/chat-machine.ts`](../../../src/features/ai-chat/services/chat-machine.ts)

Manages AI chat state: messages, models, context, loading.

### 2. **App Settings Machine**
📍 [`src/features/app-state/services/app-settings-machine.ts`](../../../src/features/app-state/services/app-settings-machine.ts)

Global application settings: language, theme, paths, configuration.

### 3. **Browser State Machine**
📍 [`src/features/browser/services/browser-state-machine.ts`](../../../src/features/browser/services/browser-state-machine.ts)

File browser state: tabs, selected files, navigation.

### 4. **Modal Machine**
📍 [`src/features/modals/services/modal-machine.ts`](../../../src/features/modals/services/modal-machine.ts)

Modal window management: opening, closing, modal stack.

### 5. **Project Settings Machine**
📍 [`src/features/project-settings/services/project-settings-machine.ts`](../../../src/features/project-settings/services/project-settings-machine.ts)

Current project settings: resolution, FPS, audio parameters.

### 6. **Resources Machine**
📍 [`src/features/resources/services/resources-machine.ts`](../../../src/features/resources/services/resources-machine.ts)

Resource management: effects, filters, transitions, templates.

### 7. **Timeline Machine**
📍 [`src/features/timeline/services/timeline-machine.ts`](../../../src/features/timeline/services/timeline-machine.ts)

Central editing machine: tracks, clips, selection, history.

### 8. **User Settings Machine**
📍 [`src/features/user-settings/services/user-settings-machine.ts`](../../../src/features/user-settings/services/user-settings-machine.ts)

User settings: personalization, API keys, performance.

### 9. **Player Machine**
📍 [`src/features/video-player/services/player-machine.ts`](../../../src/features/video-player/services/player-machine.ts)

Video player state: playback, position, volume, fullscreen mode.

## 🔌 React Providers

### Core Feature Providers

#### 1. **AI Chat Provider**
📍 [`src/features/ai-chat/services/chat-provider.tsx`](../../../src/features/ai-chat/services/chat-provider.tsx)

Provides access to chat-machine and chat management methods.

#### 2. **App Settings Provider**
📍 [`src/features/app-state/services/app-settings-provider.tsx`](../../../src/features/app-state/services/app-settings-provider.tsx)

Context for global application settings.

#### 3. **Browser State Provider**
📍 [`src/features/browser/services/browser-state-provider.tsx`](../../../src/features/browser/services/browser-state-provider.tsx)

File browser state context.

#### 4. **Modal Provider**
📍 [`src/features/modals/services/modal-provider.tsx`](../../../src/features/modals/services/modal-provider.tsx)

Modal window management through context.

#### 5. **Project Settings Provider**
📍 [`src/features/project-settings/services/project-settings-provider.tsx`](../../../src/features/project-settings/services/project-settings-provider.tsx)

Current project settings context.

#### 6. **Resources Provider**
📍 [`src/features/resources/services/resources-provider.tsx`](../../../src/features/resources/services/resources-provider.tsx)

Access to project resources (effects, filters, etc.).

#### 7. **Timeline Provider**
📍 [`src/features/timeline/services/timeline-provider.tsx`](../../../src/features/timeline/services/timeline-provider.tsx)

Central provider for timeline functionality.

#### 8. **User Settings Provider**
📍 [`src/features/user-settings/services/user-settings-provider.tsx`](../../../src/features/user-settings/services/user-settings-provider.tsx)

User settings context.

#### 9. **Player Provider**
📍 [`src/features/video-player/services/player-provider.tsx`](../../../src/features/video-player/services/player-provider.tsx)

Video player state management.

### Additional Providers

#### 10. **Keyboard Shortcuts Provider**
📍 [`src/features/keyboard-shortcuts/services/shortcuts-provider.tsx`](../../../src/features/keyboard-shortcuts/services/shortcuts-provider.tsx)

Registration and management of hotkeys (without XState machine).

#### 11. **Drag-Drop Provider**
📍 [`src/features/timeline/components/drag-drop-provider.tsx`](../../../src/features/timeline/components/drag-drop-provider.tsx)

Specialized provider for drag-and-drop in timeline.

#### 12. **I18n Provider**
📍 [`src/i18n/services/i18n-provider.tsx`](../../../src/i18n/services/i18n-provider.tsx)

Application internationalization and localization.

### Provider Aggregators

#### 13. **Media Studio Providers**
📍 [`src/features/media-studio/services/providers.tsx`](../../../src/features/media-studio/services/providers.tsx)

Combines all necessary providers for Media Studio.

#### 14. **Tauri Mock Provider**
📍 [`src/features/media-studio/services/tauri-mock-provider.tsx`](../../../src/features/media-studio/services/tauri-mock-provider.tsx)

Mock provider for testing without Tauri.

## 📐 Usage Patterns

### Creating an XState Machine

```typescript
// timeline-machine.ts
import { setup, assign } from 'xstate'

export const timelineMachine = setup({
  types: {} as {
    context: TimelineContext
    events: TimelineEvents
  },
  actions: {
    // Define actions
  },
  guards: {
    // Define guards
  }
}).createMachine({
  id: 'timeline',
  initial: 'idle',
  context: {
    // Initial context
  },
  states: {
    // Machine states
  }
})
```

### Creating a Provider

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

### Using in Components

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

## 🔗 Machine Interactions

Some machines interact with each other:

- **Timeline Machine** ↔ **Player Machine**: Playback position synchronization
- **Browser Machine** → **Timeline Machine**: Adding media files
- **Project Settings** → **Timeline Machine**: Updating project parameters
- **Modal Machine** ← **All machines**: Opening modals from anywhere

## 📚 Additional Resources

- [XState v5 Documentation](https://stately.ai/docs)
- [Testing XState Machines](../../05_DEVELOPMENT/TESTING.md#testing-xstate)
- [Frontend Architecture](OVERVIEW.md)

---

*For more details, see the [Frontend Overview](OVERVIEW.md) and [Component Communication](../COMMUNICATION.md) documentation.*