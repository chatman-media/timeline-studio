# Widget-Based Workspace System

Современная виджетная система для Timeline Studio на базе **@dnd-kit** и **XState v5**.

## Особенности

- ✅ **Drag & Drop** - перетаскивание виджетов с помощью @dnd-kit
- ✅ **4 готовых preset лейаута** - Default, Vertical, Options, Browser
- ✅ **XState v5 для управления состоянием** - надежное управление виджетами
- ✅ **TypeScript** - полная типизация
- ✅ **Кастомизация** - сохранение пользовательских layout
- ✅ **Логирование** - интегрированный Tauri Logger

## Доступные виджеты

- `timeline` - Timeline редактор
- `player` - Video Player
- `browser` - Media Browser
- `options` - Clip Options/Properties

## Быстрый старт

### 1. Оберните приложение в Provider

```tsx
import { WorkspaceLayoutProvider } from "@/features/workspace"

function App() {
  return (
    <WorkspaceLayoutProvider>
      <YourApp />
    </WorkspaceLayoutProvider>
  )
}
```

### 2. Используйте компоненты

```tsx
import {
  WidgetWorkspace,
  LayoutPresetSelector,
  useWorkspaceLayout
} from "@/features/workspace"

function MediaStudio() {
  const { currentPresetId, switchPreset } = useWorkspaceLayout()

  // Определите рендереры для виджетов
  const widgetRenderers = {
    timeline: (widget) => <Timeline />,
    player: (widget) => <VideoPlayer />,
    browser: (widget) => <Browser />,
    options: (widget) => <Options />,
  }

  return (
    <div>
      {/* Селектор лейаутов */}
      <LayoutPresetSelector
        currentPresetId={currentPresetId}
        onPresetChange={switchPreset}
      />

      {/* Workspace с виджетами */}
      <WidgetWorkspace widgetRenderers={widgetRenderers} />
    </div>
  )
}
```

## Preset лейауты

### 1. Default Layout
Классический layout для видеомонтажа:
- Browser (50% слева)
- Player (50% справа)
- Timeline (100% снизу)

### 2. Vertical Layout
Вертикальная раскладка для ultrawide мониторов:
- Player (100% сверху)
- Browser + Options (50/50 по центру)
- Timeline (100% снизу)

### 3. Options Layout
Фокус на свойствах клипа:
- Player (50% слева)
- Options (50% справа, увеличен)
- Timeline (100% снизу)

### 4. Browser Layout
Акцент на медиа браузере:
- Browser (60% слева, увеличен)
- Player (40% справа)
- Timeline (100% снизу)

## API

### useWorkspaceLayout Hook

```tsx
const {
  // State
  currentPresetId,
  activeWidgets,
  selectedWidgetId,
  isDragging,
  customLayouts,

  // Actions
  switchPreset,
  addWidget,
  removeWidget,
  updateWidgetBounds,
  minimizeWidget,
  maximizeWidget,
  saveCustomLayout,
  deleteCustomLayout,
  resetToPreset,
} = useWorkspaceLayout()
```

### Создание кастомного виджета

```tsx
import { useWorkspaceLayout } from "@/features/workspace"

function MyComponent() {
  const { addWidget } = useWorkspaceLayout()

  const handleAddCustomWidget = () => {
    addWidget({
      id: 'custom-widget-1',
      type: 'browser',
      bounds: { x: 10, y: 10, width: 40, height: 40 },
      isVisible: true,
      isMinimized: false,
      zIndex: 1,
    })
  }

  return <button onClick={handleAddCustomWidget}>Add Widget</button>
}
```

### Сохранение кастомного layout

```tsx
const { saveCustomLayout } = useWorkspaceLayout()

saveCustomLayout("My Custom Layout", "Description here")
```

## Структура проекта

```
src/features/workspace/
├── types/
│   └── widget.ts              # TypeScript типы
├── config/
│   └── layout-presets.ts      # 4 preset лейаута
├── services/
│   ├── workspace-layout-machine.ts    # XState machine
│   └── workspace-layout-provider.tsx  # React provider
├── components/
│   ├── widget-container.tsx           # Обертка для виджета
│   ├── widget-workspace.tsx           # Главный workspace
│   └── layout-preset-selector.tsx     # Селектор лейаутов
├── examples/
│   └── media-studio-integration.tsx   # Пример интеграции
├── index.ts                   # Exports
└── README.md                  # Документация
```

## Технологии

- **@dnd-kit/core** - drag & drop функциональность
- **@dnd-kit/sortable** - сортировка
- **@dnd-kit/utilities** - утилиты
- **XState v5** - state management
- **React 19** - UI framework
- **TypeScript** - типизация
- **Tauri Logger** - логирование

## Расширение

### Добавление нового типа виджета

1. Обновите `WidgetType` в `types/widget.ts`:
```ts
export type WidgetType = "timeline" | "player" | "browser" | "options" | "mynew"
```

2. Добавьте рендерер в `widgetRenderers`:
```tsx
const widgetRenderers = {
  // ...
  mynew: (widget) => <MyNewComponent />,
}
```

3. Используйте в preset или добавляйте динамически

### Создание нового preset

Отредактируйте `config/layout-presets.ts`:

```ts
const myCustomLayout: LayoutPreset = {
  id: "custom",
  name: "Custom",
  description: "My custom layout",
  icon: "layout-grid",
  widgets: [
    createWidget("player-1", "player", 0, 0, 100, 50),
    createWidget("timeline-1", "timeline", 0, 50, 100, 50),
  ],
}

export const LAYOUT_PRESETS = [..., myCustomLayout]
```

## Логирование

Все действия логируются через Tauri Logger:

```ts
const logger = createLogger("WorkspaceLayoutMachine")

logger.debugSync("Switching to preset", { presetId })
logger.warnSync("Preset not found", { presetId })
```

## Пример полной интеграции

См. `examples/media-studio-integration.tsx` для полного примера интеграции виджетной системы в MediaStudio.

## TODO / Будущие улучшения

- [ ] Resize виджетов (сейчас только drag)
- [ ] Snap to grid при перетаскивании
- [ ] Keyboard shortcuts для переключения лейаутов
- [ ] Анимации при смене лейаута
- [ ] Сохранение позиций в localStorage/backend
- [ ] Undo/Redo для layout изменений
- [ ] Минимизированные виджеты в dock
- [ ] Полноэкранный режим для виджета

## Лицензия

Часть Timeline Studio проекта.
