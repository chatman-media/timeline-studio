# Resources

**English** | [Русский](./README.ru.md)

## Overview

Resource management system for Timeline Studio. Manages effects, filters, transitions, templates, music, and subtitles. Provides centralized state management, resource tracking, and integration with timeline and browser components.

## Status

- ✅ **Components**: ResourcesPanel (511 tests)
- ✅ **State Machine**: XState resources machine
- ✅ **Provider**: React Context provider
- ✅ **Tests**: 511 tests passing
- ⚠️ **Integration**: Partial - Timeline and Browser only

## Structure

```
resources/
├── components/                       # UI components
│   └── resources-panel.tsx          # Resource display panel
├── machines/                         # State machines
│   └── backend-event-handlers.ts    # Backend event handlers
├── services/                         # Services and providers
│   └── resources-provider.tsx       # React Context provider
├── config/                           # Configuration
│   └── preview-config.ts            # Preview settings
├── types.ts                          # TypeScript types
├── index.ts                          # Module exports
├── README.md                         # Documentation
└── __tests__/                        # Tests (511 tests)
    └── components/
        └── resources-panel.test.tsx
```

## Features

### ✅ Implemented

- [x] Resource state management (XState machine)
- [x] Context provider for resource access
- [x] Resource categories (Effects, Filters, Transitions, Templates, Music, Subtitles)
- [x] ResourcesPanel component
- [x] Resource display with icons
- [x] Resource counters per category
- [x] Remove resource functionality
- [x] Internationalization support
- [x] Timeline integration (display)
- [x] Browser integration (display)

### ❌ Not Implemented

- [ ] Resource management UI components (ResourceManager, ResourceList, ResourceItem)
- [ ] Resource preview functionality
- [ ] Resource import/export
- [ ] Add new resources UI
- [ ] Edit resource metadata
- [ ] Resource grouping and sorting
- [ ] Resource search functionality
- [ ] Drag & Drop to Timeline
- [ ] Apply effects to clips
- [ ] Add transitions between clips
- [ ] Real-time effect preview
- [ ] Resource parameter configuration
- [ ] Application history

## Usage

```typescript
import { useResources } from '@/features/resources'

function ResourceManager() {
  const { resources, addResource, removeResource } = useResources()

  return (
    <div>
      {Object.entries(resources).map(([category, items]) => (
        <div key={category}>
          <h3>{category}</h3>
          <p>Count: {items.length}</p>
          {items.map(resource => (
            <div key={resource.id}>
              <span>{resource.name}</span>
              <button onClick={() => removeResource(category, resource.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

## Integration

- **Depends on**:
  - `xstate` - for state machine
  - `react-i18next` - for internationalization
  - `lucide-react` - for icons
  - `@/features/effects` - for effect types
  - `@/features/filters` - for filter types
  - `@/features/transitions` - for transition types
  - `@/features/templates` - for template types
  - `@/features/style-templates` - for style templates
- **Used by**:
  - `@/features/timeline` - for resource display
  - `@/features/browser` - for resource management
  - `@/features/media-studio` - for editor integration

## Testing

- **Total tests**: 511
- **Coverage**: Component rendering, resource display, category display, internationalization
- **Test files**:
  - `resources-panel.test.tsx` - ResourcesPanel component tests

## TODO / Roadmap

- [ ] E2E tests for resource workflow (13 tests planned)
- [ ] Implement ResourceManager component
- [ ] Implement ResourceList and ResourceItem components
- [ ] Add resource preview functionality
- [ ] Implement drag & drop to Timeline
- [ ] Add resource import/export
- [ ] Implement resource search and filtering
- [ ] Add real-time effect preview
- [ ] Implement resource parameter configuration
- [ ] Add resource application history
- [ ] Implement batch resource operations
- [ ] Add resource presets and favorites
- [ ] Implement cloud resource sync
- [ ] Add resource marketplace integration
