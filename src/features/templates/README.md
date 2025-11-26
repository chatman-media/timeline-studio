# Templates

**English** | [Русский](./README.ru.md)

## Overview

Multi-camera template system supporting split-screen layouts with 2-25 video streams. Features configuration-based architecture with animations, customization, and resizable templates for professional video editing.

## Status

- ✅ **Components**: 6 components for rendering and customization
- ✅ **Hooks**: 2 hooks for template management and import
- ✅ **Templates**: 159 templates (78 base + 26 PiP + 20 professional + 30 additional + 5 variants)
- ✅ **Tests**: 227 tests passing with >85% coverage

## Structure

```
templates/
├── components/
│   ├── animated-cell.tsx            # Animated cells
│   ├── resizable-template.tsx       # Interactive template
│   ├── template-customizer.tsx      # Customization UI
│   ├── template-preview.tsx         # Template thumbnails
│   ├── template-renderer.tsx        # Universal renderer
│   └── video-panel-component.tsx    # Video panels
├── hooks/
│   ├── use-templates.ts             # Template resolution
│   └── use-templates-import.ts      # Template loading
├── lib/
│   ├── all-template-configs.tsx     # All 159 configurations
│   ├── additional-templates.tsx     # 30 additional templates
│   ├── pip-templates.tsx            # 26 PiP templates
│   ├── professional-layouts.tsx     # 20 professional templates
│   ├── template-config.ts           # Configuration interfaces
│   ├── template-labels.ts           # Localization helpers
│   └── templates.tsx                # Legacy template system
├── services/
│   ├── custom-template-storage.ts   # Custom template storage
│   └── template-service.ts          # Video positioning logic
└── __tests__/                       # 227 tests >85% coverage
```

## Features

### ✅ Implemented

- [x] **Template Types**: Vertical, Horizontal, Diagonal, Grid, Custom layouts
- [x] **Screen Counts**: 2-25 video panels with various configurations
- [x] **Animations**: Fade, slide, zoom, flip transitions
- [x] **Customization**: Colors, borders, backgrounds, animations
- [x] **Resizable**: Interactive resize for supported templates
- [x] **Custom Templates**: User-created templates with localStorage
- [x] **Export/Import**: Template sharing via JSON
- [x] **Aspect Ratios**: Landscape (16:9), Portrait (9:16), Square (1:1)
- [x] **Configuration System**: Unified renderer for all template types

### ❌ Not Implemented

- [ ] Visual template editor
- [ ] Template marketplace
- [ ] Cloud template storage

## Usage

### Basic Template Usage

```typescript
import { ResizableTemplate } from '@/features/templates'

function VideoEditor() {
  const appliedTemplate = {
    template: getTemplateById('split-vertical-landscape'),
    videos: videoFiles
  }

  return (
    <ResizableTemplate
      appliedTemplate={appliedTemplate}
      videos={videoFiles}
      activeVideoId={activeId}
      videoRefs={videoRefs}
    />
  )
}
```

### Template Selection

```typescript
import { TemplateList, useTemplates } from '@/features/templates'

function TemplatePicker() {
  const { templates, getTemplateById } = useTemplates()

  return (
    <TemplateList
      aspectRatio="landscape"
      resolution="1920x1080"
      onTemplateSelect={(template) => applyTemplate(template)}
    />
  )
}
```

### Custom Template Configuration

```typescript
import { getAllTemplateConfig } from '@/features/templates'

// Get template configuration for rendering
const config = getAllTemplateConfig('split-diagonal-landscape')

// Render with custom cell renderer
<TemplateRenderer
  config={config}
  renderCell={(index, cellConfig) => (
    <VideoPanel video={videos[index]} config={cellConfig} />
  )}
/>
```

### Template Customization

```typescript
import { TemplateCustomizer } from '@/features/templates'

<TemplateCustomizer
  template={currentTemplate}
  onUpdate={handleTemplateUpdate}
  onSave={handleSaveCustomTemplate}
/>
```

## Integration

- **Depends on**: @/lib/tauri-logger
- **Used by**: Media Studio, Timeline, Browser
- **Storage**: Custom templates saved in localStorage

## Testing

- **Total tests**: 227 tests
- **Coverage**: >85% overall
- **Categories**:
  - Components: Full UI component coverage
  - Hooks: Template management and import
  - Services: Business logic validation
  - Configurations: All 159 template configs validated

```bash
# Run all template tests
bun run test src/features/templates/

# Run specific test file
bun run test src/features/templates/__tests__/lib/all-template-configs.test.ts

# Watch mode
bun run test:watch src/features/templates/
```

## TODO / Roadmap

- [ ] Add visual template editor for custom layouts
- [ ] Implement template marketplace for sharing
- [ ] Add cloud storage and synchronization
- [ ] Optimize rendering for very large grids (20+ panels)
- [ ] Add template versioning and history
- [ ] Implement template preview animations
