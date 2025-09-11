# Frontend Architecture

## 📋 Contents

- [Technology Overview](#technology-overview)
- [Application Structure](#application-structure)
- [State Management](#state-management)
- [Component Architecture](#component-architecture)
- [Routing](#routing)
- [Performance Optimizations](#performance-optimizations)

## 🛠️ Technology Overview

### Core Stack
- **React 19** - UI library with Concurrent Features support
- **Next.js 15** - React framework with App Router
- **TypeScript 5.3** - Static typing
- **Tailwind CSS v4** - Utility-first CSS framework

### State Management
- **XState v5** - State machines for complex logic
- **React Context** - Simple global state
- **React Query** - Server data caching

### UI Libraries
- **shadcn/ui** - Components based on Radix UI
- **Framer Motion** - Animations
- **React DnD** - Drag and drop

## 🏗️ Application Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Main page
│   └── providers.tsx     # Global providers
│
├── features/              # Feature modules
│   ├── timeline/         # Main editor
│   ├── video-player/     # Video player
│   └── ...              # Other modules
│
├── components/           # Shared components
│   └── ui/              # Base UI elements
│
├── lib/                 # Utilities
└── styles/             # Global styles
```

## 🔄 State Management

### XState Machines

Timeline Studio uses XState for complex state management:

```typescript
// Example: Timeline State Machine
const timelineMachine = setup({
  types: {} as {
    context: TimelineContext
    events: TimelineEvent
  },
  actions: {
    addClip: ({ context, event }) => {
      // Add clip logic
    },
    removeClip: ({ context, event }) => {
      // Remove clip logic
    }
  }
}).createMachine({
  id: 'timeline',
  initial: 'idle',
  context: {
    clips: [],
    selectedClip: null,
    playhead: 0
  },
  states: {
    idle: {
      on: {
        ADD_CLIP: {
          actions: 'addClip',
          target: 'editing'
        }
      }
    },
    editing: {
      on: {
        SAVE: 'saving',
        CANCEL: 'idle'
      }
    },
    saving: {
      invoke: {
        src: 'saveProject',
        onDone: 'idle',
        onError: 'error'
      }
    },
    error: {
      on: {
        RETRY: 'saving',
        CANCEL: 'idle'
      }
    }
  }
})
```

### Context Providers

Provider hierarchy in the application:

```tsx
<ThemeProvider>
  <I18nProvider>
    <AppSettingsProvider>
      <UserSettingsProvider>
        <ModalProvider>
          <ProjectSettingsProvider>
            <ResourcesProvider>
              <TimelineProvider>
                <App />
              </TimelineProvider>
            </ResourcesProvider>
          </ProjectSettingsProvider>
        </ModalProvider>
      </UserSettingsProvider>
    </AppSettingsProvider>
  </I18nProvider>
</ThemeProvider>
```

### Re-render Optimization

```typescript
// Using useMemo for heavy computations
const processedClips = useMemo(() => {
  return clips
    .filter(clip => clip.isVisible)
    .sort((a, b) => a.startTime - b.startTime)
    .map(clip => processClip(clip))
}, [clips])

// Using React.memo for components
const ClipComponent = React.memo(({ clip, onEdit }) => {
  return <div>...</div>
}, (prevProps, nextProps) => {
  return prevProps.clip.id === nextProps.clip.id &&
         prevProps.clip.version === nextProps.clip.version
})
```

## 🧩 Component Architecture

### Organization Principles

1. **Feature-based structure** - Components grouped by functionality
2. **Composition** - Complex components built from simple ones
3. **Single Responsibility** - Each component handles one task
4. **Props Interface** - Strict typing for all props

### Component Example

```typescript
// features/timeline/components/timeline-clip.tsx
interface TimelineClipProps {
  clip: Clip
  isSelected: boolean
  onSelect: (clipId: string) => void
  onEdit: (clipId: string) => void
  onDelete: (clipId: string) => void
}

export const TimelineClip: FC<TimelineClipProps> = ({
  clip,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  
  const handleDragStart = useCallback((e: DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('clipId', clip.id)
  }, [clip.id])

  return (
    <div
      className={cn(
        "timeline-clip",
        isSelected && "timeline-clip--selected",
        isDragging && "timeline-clip--dragging"
      )}
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(clip.id)}
    >
      <ClipThumbnail src={clip.thumbnail} />
      <ClipDuration duration={clip.duration} />
      <ClipActions 
        onEdit={() => onEdit(clip.id)}
        onDelete={() => onDelete(clip.id)}
      />
    </div>
  )
}
```

## 🛣️ Routing

Timeline Studio uses Next.js App Router:

```
app/
├── layout.tsx              # Main layout
├── page.tsx               # Home page (editor)
├── projects/
│   ├── page.tsx          # Projects list
│   └── [id]/
│       └── page.tsx      # Project page
├── settings/
│   └── page.tsx          # Settings
└── export/
    └── page.tsx          # Export
```

## ⚡ Performance Optimizations

### 1. List Virtualization

```typescript
// Using react-window for large lists
import { FixedSizeList } from 'react-window'

const MediaList = ({ files }) => (
  <FixedSizeList
    height={600}
    itemCount={files.length}
    itemSize={80}
    width="100%"
  >
    {({ index, style }) => (
      <MediaItem 
        key={files[index].id}
        file={files[index]} 
        style={style} 
      />
    )}
  </FixedSizeList>
)
```

### 2. Lazy Loading

```typescript
// Dynamic import of heavy components
const EffectsPanel = lazy(() => import('./effects-panel'))
const RecognitionPanel = lazy(() => import('./recognition-panel'))

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <EffectsPanel />
</Suspense>
```

### 3. Video Rendering Optimization

```typescript
// Using requestAnimationFrame for smooth animation
const animatePlayhead = useCallback((timestamp: number) => {
  if (!isPlaying) return
  
  const elapsed = timestamp - lastTimestamp
  const newPosition = playheadPosition + (elapsed * playbackSpeed)
  
  setPlayheadPosition(newPosition)
  requestAnimationFrame(animatePlayhead)
}, [isPlaying, playheadPosition, playbackSpeed])
```

### 4. Web Workers for Heavy Computations

```typescript
// worker.ts
self.addEventListener('message', (e) => {
  const { clips, effects } = e.data
  const processed = processClipsWithEffects(clips, effects)
  self.postMessage({ processed })
})

// Component usage
const worker = useMemo(() => new Worker('./worker.ts'), [])

useEffect(() => {
  worker.postMessage({ clips, effects })
  worker.onmessage = (e) => {
    setProcessedClips(e.data.processed)
  }
}, [clips, effects])
```

## 📱 Responsiveness

### Breakpoints
```css
/* Tailwind CSS v4 breakpoints */
sm: 640px   /* Tablets */
md: 768px   /* Small laptops */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large screens */
2xl: 1536px /* Very large screens */
```

### Responsive Components
```tsx
<div className="
  grid 
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  gap-4 sm:gap-6 lg:gap-8
">
  {items.map(item => <ItemCard key={item.id} {...item} />)}
</div>
```

## 🔐 Frontend Security

1. **Content Security Policy** - Strict content loading rules
2. **XSS Protection** - Automatic escaping in React
3. **CORS** - Proper configuration for Tauri IPC
4. **Data Validation** - TypeScript and runtime level

---

*For more details, see the [Backend Architecture](../backend/OVERVIEW.md) and [State Management](STATE_MANAGEMENT.md) documentation.*