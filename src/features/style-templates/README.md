# Style Templates

**English** | [Русский](./README.ru.md)

## Overview

Stylistic templates system for Timeline Studio providing animated intro, outro, lower-third, title, transition, and overlay elements. Features CSS-based animations, drag & drop integration, and custom template creation with localStorage persistence.

## Status

- ✅ **Components**: 4 components fully integrated with browser toolbar
- ✅ **Hooks**: 3 hooks for loading, filtering, and exporting
- ✅ **Utilities**: Complete set of helper functions and storage system
- ✅ **Tests**: 142 tests passing, 100% module coverage

## Structure

```
style-templates/
├── components/
│   ├── style-template-list.tsx      # Template list
│   ├── style-template-preview.tsx   # Template preview
│   ├── style-template-filters.tsx   # Filters
│   └── index.ts
├── hooks/
│   ├── use-style-templates.ts       # Main hook
│   ├── use-style-template-export.ts # Export functionality
│   └── index.ts
├── types/
│   ├── style-template.ts            # Type definitions
│   └── index.ts
├── utils/
│   ├── style-template-utils.ts      # Helper functions
│   └── custom-templates-storage.ts  # Storage management
├── data/
│   └── style-templates.json         # Template data
└── __tests__/                       # 142 tests
```

## Features

### ✅ Implemented

- [x] **Template Types**: Intro, Outro, Lower-third, Title, Transition, Overlay
- [x] **Template Styles**: Modern, Vintage, Minimal, Corporate, Creative, Cinematic
- [x] **Template Elements**: Text, shapes, images, video with animations
- [x] **Animations**: fadeIn, slideIn, scaleIn and more CSS animations
- [x] **Drag & Drop**: Integration with Timeline for applying templates
- [x] **Export/Import**: Save and load templates in JSON format
- [x] **Custom Templates**: User-created templates with localStorage persistence
- [x] **Search & Filter**: By category, style, aspect ratio
- [x] **Preview**: Template preview with demo content

### ❌ Not Implemented

- [ ] Visual template editor
- [ ] Real-time animated previews
- [ ] Cloud template storage
- [ ] Template marketplace

## Usage

```typescript
import { useStyleTemplates } from '@/features/style-templates'

function TemplatesTab() {
  const {
    templates,
    filteredTemplates,
    setFilter,
    getTemplateById
  } = useStyleTemplates()

  // Filter by category
  const filterByIntro = () => {
    setFilter({ category: "intro" })
  }

  // Get specific template
  const template = getTemplateById("modern-intro-1")

  return (
    <div>
      <button onClick={filterByIntro}>Show Intros</button>
      {filteredTemplates.map(template => (
        <div key={template.id}>{template.name}</div>
      ))}
    </div>
  )
}
```

### Export Templates

```typescript
import { useStyleTemplateExport } from '@/features/style-templates'

function ExportButton({ template }) {
  const { exportTemplate, isExporting } = useStyleTemplateExport()

  const handleExport = async () => {
    await exportTemplate(template)
  }

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? 'Exporting...' : 'Export'}
    </button>
  )
}
```

### Custom Templates

```typescript
import {
  addCustomTemplate,
  loadCustomTemplates,
  isCustomTemplate
} from '@/features/style-templates'

function CustomTemplatesManager() {
  const handleSave = (template) => {
    try {
      addCustomTemplate(template)
      console.log('Template saved!')
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const customTemplates = loadCustomTemplates()

  return (
    <div>
      {customTemplates.map(template => (
        <div key={template.id}>
          {template.name.ru}
          {isCustomTemplate(template.id) && ' (Custom)'}
        </div>
      ))}
    </div>
  )
}
```

## Integration

- **Depends on**: @/domains/resources, @/features/browser
- **Used by**: Timeline, Media Studio, Browser
- **Resources**: Integrated with ResourcesProvider for project management

## Testing

- **Total tests**: 142 tests
- **Test files**: 10 test files covering components, hooks, and utilities
- **Coverage**: 100% of all modules

```bash
# Run all style templates tests
bun run test src/features/style-templates/

# Run specific test category
bun run test src/features/style-templates/__tests__/components/
bun run test src/features/style-templates/__tests__/hooks/
bun run test src/features/style-templates/__tests__/utils/

# With coverage
bun run test src/features/style-templates/ --coverage
```

## TODO / Roadmap

- [ ] Implement visual template editor for custom creation
- [ ] Add real-time animated previews
- [ ] Implement cloud template storage and sync
- [ ] Create template marketplace for sharing
- [ ] Add template versioning and history
- [ ] Optimize preview rendering with lazy loading
