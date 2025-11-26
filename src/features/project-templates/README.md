# Project Templates

**English** | [Русский](./README.ru.md)

## Overview

Project templates system for Timeline Studio. Provides predefined project configurations for different video content types (YouTube, Social Media, Podcasts). Includes template selection, validation, customization, and automatic project structure generation.

## Status

- ✅ **Components**: Template picker, customizer, preview, wizard
- ✅ **Hooks**: use-project-template (30 tests), use-template-picker
- ✅ **Services**: Template manager, applier, validator
- ✅ **Tests**: 52 tests passing

## Structure

```
project-templates/
├── components/          # UI components
│   ├── template-customizer.tsx
│   ├── template-picker.tsx
│   ├── template-preview.tsx
│   └── template-wizard.tsx
├── hooks/              # React hooks
│   ├── use-project-template.ts
│   └── use-template-picker.ts
├── lib/                # Template libraries
│   ├── podcast-templates.ts
│   ├── social-templates.ts
│   ├── templates.ts
│   └── youtube-templates.ts
├── services/           # Business logic
│   ├── project-template-manager.ts
│   ├── template-applier.ts
│   └── template-validator.ts
├── types/              # TypeScript types
│   └── project-template.ts
└── __tests__/          # Tests (52 tests)
```

## Features

### ✅ Implemented

- [x] Template categories (YouTube, Social Media, Podcasts, Commercial, Presentation)
- [x] Aspect ratio support (16:9, 9:16, 1:1, 4:3)
- [x] Template selection and preview
- [x] Filter by category, platform, aspect ratio, duration
- [x] Search by name and description
- [x] Sort by name, duration, category
- [x] Template validation and compatibility check
- [x] Apply template to project
- [x] Add/delete custom templates
- [x] Export/import templates as JSON
- [x] Project structure generation (sections, tracks, timings)
- [x] Placeholders (intro, outro, content, music, chapters)

### ❌ Not Implemented

- [ ] Template sharing and marketplace
- [ ] Cloud synchronization of custom templates
- [ ] Advanced template versioning
- [ ] Template preview video generation

## Usage

```typescript
import { useProjectTemplate } from '@/features/project-templates'

function ProjectWizard() {
  const {
    selectedTemplate,
    selectTemplate,
    applyTemplate,
    filteredTemplates,
    filterTemplates,
    searchTemplates,
  } = useProjectTemplate()

  return (
    <div>
      <input
        onChange={(e) => searchTemplates(e.target.value)}
        placeholder="Search templates..."
      />
      {filteredTemplates.map(template => (
        <button
          key={template.id}
          onClick={() => selectTemplate(template.id)}
        >
          {template.name}
        </button>
      ))}
      <button onClick={applyTemplate}>Apply Template</button>
    </div>
  )
}
```

## Integration

- **Depends on**:
  - `@/features/project-settings` - for project types
  - `@/lib/tauri-logger` - for logging
- **Used by**:
  - Project creation wizard
  - Project settings
  - AI Director (for automatic configuration)

## Testing

- **Total tests**: 52
- **Coverage**: Components, hooks, services
- **Test files**:
  - `project-template-manager.test.ts` - Template manager logic
  - `use-project-template.test.tsx` - Hook functionality

## TODO / Roadmap

- [ ] E2E tests for template workflow (15 tests planned)
- [ ] Template marketplace integration
- [ ] Cloud backup for custom templates
- [ ] Template preview video generation
- [ ] Advanced template customization UI
- [ ] Template versioning system
- [ ] Collaborative template editing
