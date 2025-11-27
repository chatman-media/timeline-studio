# Frontend архитектура

[← Назад к разделу](README.md) | [← К оглавлению](../README.md)

## 📋 Содержание

- [Обзор технологий](#обзор-технологий)
- [Структура приложения](#структура-приложения)
- [Управление состоянием](#управление-состоянием)
- [Ports & Adapters](./ports-and-adapters.md) — Hexagonal Architecture для платформонезависимости
- [Компонентная архитектура](#компонентная-архитектура)
- [Маршрутизация](#маршрутизация)
- [Оптимизации производительности](#оптимизации-производительности)

## 🛠️ Обзор технологий

### Основной стек
- **React 19** - UI библиотека с поддержкой Concurrent Features
- **Next.js 15** - React фреймворк с App Router
- **TypeScript 5.3** - статическая типизация
- **Tailwind CSS v4** - utility-first CSS фреймворк

### Управление состоянием
- **XState v5** - конечные автоматы для сложной логики
- **React Context** - для простого глобального состояния
- **React Query** - кэширование серверных данных

### UI библиотеки
- **shadcn/ui** - компоненты на базе Radix UI
- **Framer Motion** - анимации
- **React DnD** - drag and drop

## 🏗️ Структура приложения

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Корневой layout
│   ├── page.tsx          # Главная страница
│   └── providers.tsx     # Глобальные провайдеры
│
├── features/              # Функциональные модули
│   ├── timeline/         # Основной редактор
│   ├── video-player/     # Видео плеер
│   └── ...              # Другие модули
│
├── components/           # Общие компоненты
│   └── ui/              # Базовые UI элементы
│
├── lib/                 # Утилиты
└── styles/             # Глобальные стили
```

## 🔄 Управление состоянием

### XState машины

Timeline Studio использует XState для управления сложными состояниями:

```typescript
// Пример: Timeline State Machine
const timelineMachine = setup({
  types: {} as {
    context: TimelineContext
    events: TimelineEvent
  },
  actions: {
    addClip: ({ context, event }) => {
      // Логика добавления клипа
    },
    removeClip: ({ context, event }) => {
      // Логика удаления клипа
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

### Context провайдеры

Иерархия провайдеров в приложении:

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

### Оптимизация ререндеров

```typescript
// Использование useMemo для тяжелых вычислений
const processedClips = useMemo(() => {
  return clips
    .filter(clip => clip.isVisible)
    .sort((a, b) => a.startTime - b.startTime)
    .map(clip => processClip(clip))
}, [clips])

// Использование React.memo для компонентов
const ClipComponent = React.memo(({ clip, onEdit }) => {
  return <div>...</div>
}, (prevProps, nextProps) => {
  return prevProps.clip.id === nextProps.clip.id &&
         prevProps.clip.version === nextProps.clip.version
})
```

## 🧩 Компонентная архитектура

### Принципы организации

1. **Feature-based структура** - компоненты группируются по функциональности
2. **Композиция** - сложные компоненты собираются из простых
3. **Single Responsibility** - каждый компонент отвечает за одну задачу
4. **Props Interface** - строгая типизация всех пропсов

### Пример компонента

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

## 🛣️ Маршрутизация

Timeline Studio использует Next.js App Router:

```
app/
├── layout.tsx              # Основной layout
├── page.tsx               # Главная страница (редактор)
├── projects/
│   ├── page.tsx          # Список проектов
│   └── [id]/
│       └── page.tsx      # Страница проекта
├── settings/
│   └── page.tsx          # Настройки
└── export/
    └── page.tsx          # Экспорт
```

## ⚡ Оптимизации производительности

### 1. Виртуализация списков

```typescript
// Использование react-window для больших списков
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

### 2. Ленивая загрузка

```typescript
// Динамический импорт тяжелых компонентов
const EffectsPanel = lazy(() => import('./effects-panel'))
const RecognitionPanel = lazy(() => import('./recognition-panel'))

// Использование с Suspense
<Suspense fallback={<LoadingSpinner />}>
  <EffectsPanel />
</Suspense>
```

### 3. Оптимизация рендеринга видео

```typescript
// Использование requestAnimationFrame для плавной анимации
const animatePlayhead = useCallback((timestamp: number) => {
  if (!isPlaying) return
  
  const elapsed = timestamp - lastTimestamp
  const newPosition = playheadPosition + (elapsed * playbackSpeed)
  
  setPlayheadPosition(newPosition)
  requestAnimationFrame(animatePlayhead)
}, [isPlaying, playheadPosition, playbackSpeed])
```

### 4. Web Workers для тяжелых вычислений

```typescript
// worker.ts
self.addEventListener('message', (e) => {
  const { clips, effects } = e.data
  const processed = processClipsWithEffects(clips, effects)
  self.postMessage({ processed })
})

// Использование в компоненте
const worker = useMemo(() => new Worker('./worker.ts'), [])

useEffect(() => {
  worker.postMessage({ clips, effects })
  worker.onmessage = (e) => {
    setProcessedClips(e.data.processed)
  }
}, [clips, effects])
```

## 📱 Адаптивность

### Breakpoints
```css
/* Tailwind CSS v4 breakpoints */
sm: 640px   /* Планшеты */
md: 768px   /* Маленькие ноутбуки */
lg: 1024px  /* Десктопы */
xl: 1280px  /* Большие экраны */
2xl: 1536px /* Очень большие экраны */
```

### Responsive компоненты
```tsx
<div className="
  grid 
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  gap-4 sm:gap-6 lg:gap-8
">
  {items.map(item => <ItemCard key={item.id} {...item} />)}
</div>
```

## 🔐 Безопасность Frontend

1. **Content Security Policy** - строгие правила загрузки контента
2. **XSS защита** - автоматическое экранирование в React
3. **CORS** - правильная настройка для Tauri IPC
4. **Валидация данных** - на уровне TypeScript и runtime

---

[← Назад к архитектуре](README.md) | [Далее: Backend архитектура →](backend.md)