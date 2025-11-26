# Modals

**English** | [Русский](./README.ru.md)

## Overview

Centralized modal window management system for Timeline Studio using XState state machine for unified dialog control across the application.

## Status

- ✅ **Components**: ModalContainer with smooth transitions
- ✅ **State Machine**: XState-based modal lifecycle management
- ✅ **Provider**: React Context for global modal access
- ✅ **Tests**: 4 test files covering provider, machine, container, and integration

## Structure

```
modals/
├── components/
│   ├── modal-container.tsx       # Main modal renderer
│   └── [20+ individual modals]   # Specific modal implementations
├── hooks/
│   └── use-modal.ts              # Modal control hook
├── services/
│   ├── modal-machine.ts          # XState state machine
│   └── modal-provider.tsx        # React Context provider
├── types/
│   └── modal.ts                  # TypeScript definitions
└── __tests__/                    # Test files
```

## Features

### ✅ Implemented

- [x] Single active modal with history tracking
- [x] Return-to modal navigation support
- [x] Type-safe modal data management
- [x] Custom dialog sizing with Tailwind classes
- [x] 20+ pre-built modal types (export, settings, capture, etc.)
- [x] Smooth transitions between modals
- [x] Dark mode support
- [x] Keyboard navigation (ESC to close)
- [x] Scrollable content areas

### Available Modal Types

**Media & Recording**: camera-capture, voice-recording, audio-effects
**Project Management**: export, project-settings, missing-files
**User Interface**: user-settings, keyboard-shortcuts, effect-detail, color-grading
**Content Editing**: subtitle-editor, subtitle-ai-tools, person-form, ai-marker-settings
**System**: cache-settings, cache-statistics
**MIDI**: midi-learn, midi-mapping, midi-configuration

## Usage

```typescript
import { useModal } from '@/features/modals'

function MyComponent() {
  const { openModal, closeModal } = useModal()

  // Open modal with data
  const handleExport = () => {
    openModal('export', {
      format: 'mp4',
      quality: 'high'
    })
  }

  // Open with return navigation
  const handleSettings = () => {
    openModal('cache-settings', {
      returnTo: 'user-settings'
    })
  }

  // Custom sizing
  openModal('modal-type', {
    dialogClass: 'max-w-4xl'
  })
}
```

## Integration

- **Depends on**: `@/components/ui/dialog`, `xstate`, individual modal implementations
- **Used by**: All features requiring modal dialogs (settings, export, capture, etc.)

## Testing

- **Total tests**: 4 test files
- **Coverage**: Provider context, state machine, container rendering, integration flows
- Unit tests: modal-provider.test.tsx (11 tests)
- Machine tests: modal-machine.test.ts (7 tests)
- Integration: modal-integration.test.tsx (3 tests)
- Component: modal-container.test.tsx (10 tests)

Run tests:
```bash
bun run test src/features/modals
```

## Best Practices

1. **Single Modal Rule** - Only one modal active at a time
2. **Data Validation** - Validate modal data before opening
3. **Cleanup** - Handle cleanup in modal unmount
4. **Accessibility** - All modals support keyboard navigation
5. **Error Handling** - Provide error states within modals

## TODO / Roadmap

- [ ] Add modal stacking support for complex workflows
- [ ] Implement modal animation customization API
- [ ] Add accessibility audit for all modal types
- [ ] Create modal composition utilities for reusable patterns
- [ ] Add telemetry for modal usage analytics
