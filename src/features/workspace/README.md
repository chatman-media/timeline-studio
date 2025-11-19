# Widget-Based Workspace System

Современная виджетная система для Timeline Studio на базе **@dnd-kit** и **XState v5**.

## Статус

**Текущая версия:** v1.1.0
**Готовность:** 100%
**Покрытие тестами:** 88 тестов (7 test files)

## Особенности

- ✅ **Drag & Drop** - перетаскивание виджетов с помощью @dnd-kit
- ✅ **Resize** - изменение размера виджетов (8 resize handles)
- ✅ **Widget Dock** - панель для минимизированных виджетов
- ✅ **Persistence** - сохранение состояния между сессиями (localStorage + backend sync)
- ✅ **4 готовых preset лейаута** - Default, Vertical, Options, Chat
- ✅ **XState v5 для управления состоянием** - надежное управление виджетами
- ✅ **TypeScript** - полная типизация
- ✅ **Кастомизация** - сохранение пользовательских layout
- ✅ **Логирование** - интегрированный Tauri Logger

## Доступные виджеты

- `timeline` - Timeline редактор
- `player` - Video Player
- `browser` - Media Browser
- `options` - Clip Options/Properties
- `ai-chat` - AI Chat Assistant
- `ai-suggestions` - AI Suggestions Panel

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
    "ai-chat": (widget) => <AiChat />,
    "ai-suggestions": (widget) => <AISuggestionsPanel />,
  }

  return (
    <div>
      {/* Селектор лейаутов */}
      <LayoutPresetSelector
        currentPresetId={currentPresetId}
        onPresetChange={switchPreset}
      />

      {/* Workspace с виджетами - машина передается через контекст */}
      <WidgetWorkspace widgetRenderers={widgetRenderers} />
    </div>
  )
}
```

**ВАЖНО:** `WidgetWorkspace` получает доступ к XState машине через `useWorkspaceLayout` hook. Не передавайте `machine` как prop!

## Preset лейауты

### 1. Default Layout
Классический layout для видеомонтажа:
- Верх (80% высоты): Browser (50%) + Player (50%) - горизонтально
- Низ (20% высоты): Timeline (100%)

### 2. Vertical Layout
Вертикальная раскладка для ultrawide мониторов:
- Левая панель (67% ширины):
  - Browser (30% высоты)
  - Options (50% высоты)
  - Timeline (20% высоты)
- Правая панель (33% ширины): Player (100% высоты)

### 3. Options Layout
Фокус на свойствах клипа справа:
- Левая панель (70% ширины):
  - Верх (50% высоты): Browser (30%) + Player (70%) - горизонтально
  - Низ (50% высоты): Timeline (100%)
- Правая панель (30% ширины): Options (100% высоты)

### 4. Chat Layout
AI помощник для редактирования:
- Левая панель (70% ширины):
  - Верх (50% высоты): Browser (25%) + Player (50%) + Options (25%) - горизонтально
  - Низ (50% высоты): Timeline (100%)
- Правая панель (30% ширины): AI Chat (100% высоты)

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

## Known Issues

### Мелкие улучшения
- ⚠️ **Нет snap to grid** - При перетаскивании виджеты не привязываются к сетке
- ⚠️ **Нет анимаций** - Переключение между preset происходит мгновенно
- ⚠️ **Нет undo/redo** - Невозможно отменить изменения layout
- ⚠️ **Нет keyboard shortcuts** - Отсутствуют горячие клавиши для управления

## Roadmap

### v1.1 ✅ (Выпущена)
**Цель:** Production-ready функциональность

- ✅ **Сохранение состояния** - Интеграция с localStorage и backend sync
  - Сохранение текущего preset и custom layouts
  - Сохранение позиций виджетов
  - Восстановление состояния при запуске
  - Debounced save для оптимизации
- ✅ **Widget Dock** - Панель для минимизированных виджетов
  - Dock внизу workspace
  - Restore widget функция
  - Отображение только минимизированных виджетов
- ✅ **Resize функциональность** - Изменение размера виджетов
  - 8 resize handles (4 угла + 4 стороны)
  - Валидация границ (min/max размеры)
  - Интеграция с persistence

### v1.2 (Следующий релиз)
**Цель:** Улучшенный пользовательский опыт

- [ ] **Snap to Grid** - Привязка к сетке при drag/resize
  - Настраиваемый размер сетки
  - Visual grid overlay (опционально)
  - Smart snap к другим виджетам
- [ ] **Анимации** - Плавные переходы
  - Анимация переключения preset
  - Анимация minimize/maximize
  - Анимация drag & drop
- [ ] **Keyboard Shortcuts** - Горячие клавиши
  - Ctrl+1/2/3/4 для переключения preset
  - Ctrl+M для minimize активного виджета
  - Ctrl+F для fullscreen виджета

### v1.3 (Расширенные возможности)
**Цель:** Power user функции

- [ ] **Undo/Redo** - История изменений layout
  - Command pattern для действий
  - Сохранение истории в XState
  - Ctrl+Z / Ctrl+Shift+Z shortcuts
- [ ] **Fullscreen Mode** - Полноэкранный режим для виджета
  - Double-click на header для fullscreen
  - ESC для выхода
  - Сохранение позиции перед fullscreen
- [ ] **Widget Tabs** - Табы внутри виджетов
  - Несколько виджетов одного типа в табах
  - Drag & drop для реорганизации табов
  - Close tab функция
- [ ] **Layout Templates** - Экспорт/импорт layout
  - Сохранение в JSON файл
  - Импорт из файла
  - Sharing с другими пользователями

### v2.0 (Future Vision)
**Цель:** Профессиональные возможности

- [ ] **Multi-Monitor Support** - Поддержка нескольких мониторов
  - Виджеты на разных экранах
  - Per-monitor layout настройки
- [ ] **Floating Windows** - Отдельные окна для виджетов
  - Отрыв виджета в отдельное окно
  - Dock обратно в workspace
- [ ] **Collaborative Layouts** - Совместная работа
  - Синхронизация layout между пользователями
  - Real-time updates
  - Permissions для layout изменений

## Тестирование

Фича имеет **полное покрытие тестами** - **88 тестов** в 7 файлах:

### Services (3 test files)
- `workspace-layout-machine.test.ts` - 27 тестов (включая resize и restore state)
- `workspace-layout-provider.test.tsx` - 12 тестов
- `workspace-persistence.test.ts` - 10 тестов (новое)

### Components (4 test files)
- `widget-workspace.test.tsx` - 9 тестов
- `widget-container.test.tsx` - 15 тестов
- `widget-dock.test.tsx` - 5 тестов (новое)
- `layout-preset-selector.test.tsx` - 10 тестов

### Запуск тестов

```bash
# Все тесты workspace фичи
bun run test src/features/workspace

# Конкретный файл
bun run test src/features/workspace/__tests__/services/workspace-layout-machine.test.ts

# Watch mode
bun run test:watch src/features/workspace
```

## Лицензия

Часть Timeline Studio проекта.
