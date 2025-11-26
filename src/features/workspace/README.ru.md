# Workspace

[English](./README.md) | **Русский**

## Обзор
Современная виджетная система для Timeline Studio на базе @dnd-kit и XState v5, предоставляющая drag-and-drop, изменяемые виджеты и настраиваемые макеты.

## Статус
- ✅ **Версия**: v1.1.0
- ✅ **Готовность**: 100%
- ✅ **Компоненты**: Полностью реализованы
- ✅ **Сервисы**: XState машина и провайдер готовы
- ✅ **Тесты**: 88 тестов проходят (7 файлов)

## Структура
```
workspace/
├── types/
│   └── widget.ts
├── config/
│   └── layout-presets.ts
├── services/
│   ├── workspace-layout-machine.ts
│   └── workspace-layout-provider.tsx
├── components/
│   ├── widget-container.tsx
│   ├── widget-workspace.tsx
│   └── layout-preset-selector.tsx
├── examples/
│   └── media-studio-integration.tsx
└── __tests__/
```

## Функции
### ✅ Реализовано
- [x] Drag & Drop с @dnd-kit
- [x] Изменение размера виджетов (8 resize handles)
- [x] Widget Dock для минимизированных виджетов
- [x] Сохранение состояния (localStorage + backend sync)
- [x] 4 пресет макета (Default, Vertical, Options, Chat)
- [x] Управление состоянием XState v5
- [x] Сохранение кастомных макетов
- [x] Полная типизация TypeScript
- [x] Интеграция Tauri Logger

### ❌ Не реализовано
- [ ] Привязка к сетке (Snap to Grid)
- [ ] Анимации макетов
- [ ] Undo/Redo
- [ ] Горячие клавиши
- [ ] Полноэкранный режим для виджетов
- [ ] Табы виджетов
- [ ] Экспорт/импорт шаблонов макетов
- [ ] Поддержка нескольких мониторов

## Использование
```typescript
import {
  WorkspaceLayoutProvider,
  WidgetWorkspace,
  useWorkspaceLayout
} from '@/features/workspace'

function App() {
  return (
    <WorkspaceLayoutProvider>
      <MediaStudio />
    </WorkspaceLayoutProvider>
  )
}

function MediaStudio() {
  const { currentPresetId, switchPreset } = useWorkspaceLayout()

  const widgetRenderers = {
    timeline: (widget) => <Timeline />,
    player: (widget) => <VideoPlayer />,
    browser: (widget) => <Browser />,
    options: (widget) => <Options />,
    "ai-chat": (widget) => <AiChat />
  }

  return <WidgetWorkspace widgetRenderers={widgetRenderers} />
}
```

## Интеграция
- **Зависит от**: @dnd-kit, XState v5, @/lib/tauri-logger
- **Используется в**: @/features/media-studio

## Тестирование
- **Всего тестов**: 88 тестов (все проходят)
- **Тесты сервисов**: 49 тестов (3 файла)
- **Тесты компонентов**: 39 тестов (4 файла)

```bash
bun run test src/features/workspace
```

## TODO / Roadmap

### v1.2 (Следующий релиз)
- [ ] Snap to Grid с настраиваемым размером сетки
- [ ] Визуальный оверлей сетки (опционально)
- [ ] Умная привязка к другим виджетам
- [ ] Плавные переходы и анимации
- [ ] Горячие клавиши (Ctrl+1/2/3/4 для пресетов)

### v1.3 (Расширенные возможности)
- [ ] Undo/Redo с паттерном команд
- [ ] Полноэкранный режим для виджетов
- [ ] Поддержка табов виджетов
- [ ] Экспорт/импорт шаблонов макетов

### v2.0 (Future Vision)
- [ ] Поддержка нескольких мониторов
- [ ] Плавающие окна для виджетов
- [ ] Совместные макеты с синхронизацией в реальном времени
- [ ] E2E тесты (запланированы в `e2e/tauri/features/workspace/`)
