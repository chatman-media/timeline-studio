# Modals

[Русский](./README.ru.md) | **English**

Centralized modal window management system for Timeline Studio.

## Architecture

The modals feature provides a unified way to manage all modal dialogs in the application using XState state machine.

### Core Components

#### `ModalContainer`
Main container component that renders the currently active modal.
- Centralized modal rendering
- Smooth transitions between modals
- Return navigation support
- Custom dialog sizing

#### `ModalMachine`
XState state machine for modal state management.
- Single active modal at a time
- Modal history tracking
- Return-to modal support
- Type-safe modal data

#### `ModalProvider`
React Context provider for modal functionality.
- Global modal access
- Modal opening/closing methods
- State synchronization

## Available Modals

### Media & Recording
- `camera-capture` - Camera and screen capture
- `voice-recording` - Audio recording interface
- `audio-effects` - Audio effects editor

### Project Management
- `export` - Project export with multiple formats
- `project-settings` - Project configuration
- `missing-files` - Missing media file restoration

### User Interface
- `user-settings` - User preferences and API keys
- `keyboard-shortcuts` - Hotkey configuration
- `effect-detail` - Effect parameter editing
- `color-grading` - Color correction interface

### Content Editing
- `subtitle-editor` - Subtitle editing interface
- `subtitle-ai-tools` - AI-powered subtitle tools
- `person-form` - Person identification form
- `ai-marker-settings` - AI marker configuration

### System & Performance
- `cache-settings` - Cache configuration
- `cache-statistics` - Cache usage statistics

### MIDI Integration
- `midi-learn` - MIDI control learning
- `midi-mapping` - MIDI mapping editor
- `midi-configuration` - MIDI device setup

## Usage

```typescript
import { useModal } from '@/features/modals'

function MyComponent() {
  const { openModal, closeModal } = useModal()
  
  // Open a modal with data
  const handleExport = () => {
    openModal('export', {
      format: 'mp4',
      quality: 'high'
    })
  }
  
  // Open modal with return navigation
  const handleSettings = () => {
    openModal('cache-settings', {
      returnTo: 'user-settings'
    })
  }
}
```

## Modal Configuration

### Dialog Sizing
```typescript
openModal('modal-type', {
  dialogClass: 'max-w-4xl' // Tailwind classes for sizing
})
```

### Return Navigation
```typescript
// Opens settings, then cache settings
openModal('user-settings')
// Inside user settings:
openModal('cache-settings', { returnTo: 'user-settings' })
// Closing cache-settings returns to user-settings
```

## API (Backend Commands)

Modals module does not invoke Tauri commands directly. Individual modals may use:
- File dialogs (via `@tauri-apps/plugin-dialog`)
- Notifications (via `@tauri-apps/plugin-notification`)
- Store operations (via `@tauri-apps/plugin-store`)

See individual modal implementations for specific backend integrations.

## Behavior (from tests) / Поведение (из тестов)

### modal-provider.test.tsx
- ✓ Должен рендерить дочерние элементы
- ✓ Должен предоставлять начальный контекст
- ✓ Должен открывать модальное окно
- ✓ Должен открывать модальное окно с данными
- ✓ Должен закрывать модальное окно
- ✓ Должен отправлять данные модального окна
- ✓ Должен переключаться между разными типами модальных окон
- ✓ useModal hook должен выбрасывать ошибку если используется вне провайдера
- ✓ Должен сохранять состояние между ререндерами
- ✓ Должен работать с различными типами модальных окон
- ✓ Должен обрабатывать сложные данные модального окна

### modal-machine.test.ts
- ✓ Should validate modal machine states (closed, opened)
- ✓ Should validate modal machine context structure
- ✓ Should validate modal machine events (OPEN_MODAL, CLOSE_MODAL, SUBMIT_MODAL)
- ✓ Should handle modal type transitions
- ✓ Should handle modal data management
- ✓ Should handle modal navigation with returnTo
- ✓ Should validate modal types

### modal-integration.test.tsx
- ✓ Should validate modal provider structure
- ✓ Should handle modal state transitions
- ✓ Should validate modal context requirements

### modal-container.test.tsx
- ✓ Should not render dialog when closed
- ✓ Should render dialog when opened
- ✓ Should close modal on backdrop click
- ✓ Should handle subtitle editor with edit mode
- ✓ Should handle person form with edit mode
- ✓ Should apply custom dialog class from modalData
- ✓ Should render nothing for unknown modal type
- ✓ Should handle none modal type
- ✓ Should apply dark mode classes
- ✓ Should have scrollable content area

## Dependencies / Зависимости

**Used by:**
- All features that need modal dialogs
- User Settings, Export, Project Settings, etc.

**Depends on:**
- `@/components/ui/dialog` - shadcn/ui Dialog component
- `xstate` - State machine for modal management
- Individual modal implementations from various features

## Best Practices

1. **Single Modal Rule** - Only one modal can be active at a time
2. **Data Validation** - Validate modal data before opening
3. **Cleanup** - Handle cleanup in modal unmount
4. **Accessibility** - All modals support keyboard navigation
5. **Error Handling** - Provide error states within modals

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/modals/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Открытие модального окна (openModal) | ⏳ Planned | - | 🔴 High |
| Закрытие модального окна (closeModal) | ⏳ Planned | - | 🔴 High |
| Передача данных в модальное окно | ⏳ Planned | - | 🔴 High |
| Навигация с returnTo (возврат к предыдущему модалу) | ⏳ Planned | - | 🟡 Medium |
| Применение пользовательского размера (dialogClass) | ⏳ Planned | - | 🟢 Low |
| Модал Export - выбор формата экспорта | ⏳ Planned | - | 🔴 High |
| Модал User Settings - изменение настроек | ⏳ Planned | - | 🔴 High |
| Модал Camera Capture - запись с камеры | ⏳ Planned | - | 🟡 Medium |
| Модал Voice Recording - запись аудио | ⏳ Planned | - | 🟡 Medium |
| Модал Project Settings - настройки проекта | ⏳ Planned | - | 🔴 High |
| Модал Missing Files - восстановление файлов | ⏳ Planned | - | 🔴 High |
| Модал Keyboard Shortcuts - управление hotkeys | ⏳ Planned | - | 🟡 Medium |
| Модал Subtitle Editor - редактирование субтитров | ⏳ Planned | - | 🟡 Medium |
| Модал Cache Settings - настройки кэша | ⏳ Planned | - | 🟢 Low |
| Модал Cache Statistics - статистика кэша | ⏳ Planned | - | 🟢 Low |
| Модал MIDI Configuration - настройки MIDI | ⏳ Planned | - | 🟢 Low |
| XState машина состояний (OPEN_MODAL, CLOSE_MODAL) | ⏳ Planned | - | 🔴 High |
| Валидация типов модальных окон | ⏳ Planned | - | 🟡 Medium |
| Закрытие по клику на backdrop | ⏳ Planned | - | 🟡 Medium |
| Keyboard navigation (ESC для закрытия) | ⏳ Planned | - | 🟡 Medium |
| Dark mode поддержка | ⏳ Planned | - | 🟢 Low |
| Прокрутка контента внутри модала | ⏳ Planned | - | 🟡 Medium |

### Приоритеты
- 🔴 High - критичный функционал, тестировать первым
- 🟡 Medium - важный функционал
- 🟢 Low - дополнительный функционал

### Примечания
- Модуль не вызывает Tauri команды напрямую
- Отдельные модальные окна могут использовать:
  - `@tauri-apps/plugin-dialog` - файловые диалоги
  - `@tauri-apps/plugin-notification` - уведомления
  - `@tauri-apps/plugin-store` - сохранение настроек
- Использует XState v5 для управления состоянием
- Поддерживает 20+ различных типов модальных окон
- Тестирование фокусируется на навигации и управлении состоянием