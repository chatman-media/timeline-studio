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

## Best Practices

1. **Single Modal Rule** - Only one modal can be active at a time
2. **Data Validation** - Validate modal data before opening
3. **Cleanup** - Handle cleanup in modal unmount
4. **Accessibility** - All modals support keyboard navigation
5. **Error Handling** - Provide error states within modals