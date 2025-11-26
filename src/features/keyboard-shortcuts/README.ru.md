# Клавиатурные сочетания

[English](./README.md) | **Русский**

## Обзор

Модуль управления клавиатурными сочетаниями для Timeline Studio. Обеспечивает централизованный реестр shortcuts, разрешение конфликтов, систему пресетов (Timeline Studio, Adobe Premiere Pro, Wondershare Filmora), экспорт/импорт настроек и интеграцию с глобальными shortcuts через Tauri.

## Статус

- ✅ **Компоненты**: ShortcutHandler, KeyboardShortcutsModal, ConflictIndicator, ShortcutsCheatSheet
- ✅ **Хуки**: useShortcuts, usePanelShortcuts
- ✅ **Сервисы**: ShortcutsRegistry (singleton), ShortcutsProvider, TauriGlobalShortcuts
- ✅ **Тесты**: 126+ тестов с покрытием >85%
- ✅ **Пресеты**: Timeline Studio, Adobe Premiere Pro (119 shortcuts), Wondershare Filmora

## Структура

```
keyboard-shortcuts/
├── components/
│   ├── shortcut-handler.tsx
│   ├── keyboard-shortcuts-modal.tsx
│   ├── conflict-indicator.tsx
│   └── shortcuts-cheat-sheet.tsx
├── constants/
│   └── default-shortcuts.ts
├── hooks/
│   └── use-panel-shortcuts.ts
├── presets/
│   ├── timeline-preset.ts
│   ├── premiere-preset.ts
│   └── filmora-preset.ts
├── services/
│   ├── shortcuts-registry.ts
│   ├── shortcuts-provider.tsx
│   └── tauri-global-shortcuts.ts
└── types/
    └── shortcuts.ts
```

## Возможности

### ✅ Реализовано

- [x] Централизованная регистрация и управление shortcuts
- [x] Поддержка множественных комбинаций клавиш (cmd/ctrl + key)
- [x] 13 категорий (настройки, файл, редактирование, инструменты, маркеры, аудио и др.)
- [x] Обнаружение и разрешение конфликтов с визуальными индикаторами
- [x] Система пресетов (переключение между Timeline/Premiere/Filmora)
- [x] Экспорт/импорт настроек в JSON
- [x] Персистентное хранилище (Tauri Store + fallback на localStorage)
- [x] Глобальные shortcuts через Tauri плагин
- [x] Генерация cheat sheet с поддержкой печати
- [x] Контекстные shortcuts (global, timeline, browser)
- [x] Поиск по названию или комбинации клавиш
- [x] Поддержка локализации i18n

### ❌ Не реализовано

- [ ] Запись макросов (последовательности действий на одну клавишу)
- [ ] Облачная синхронизация настроек
- [ ] AI-подсказки shortcuts на основе паттернов использования
- [ ] Видео туториалы для shortcuts

## Использование

### Регистрация Shortcuts

```typescript
import { ShortcutsRegistry } from '@/features/keyboard-shortcuts'

const registry = ShortcutsRegistry.getInstance()

registry.register({
  id: "save-project",
  name: "Сохранить проект",
  category: "file",
  keys: ["⌘S", "cmd+s", "ctrl+s"],
  action: (event) => {
    event.preventDefault()
    // Логика сохранения проекта
  }
})
```

### Использование в компонентах

```tsx
import { useShortcuts } from '@/features/keyboard-shortcuts'

function MyComponent() {
  const {
    shortcuts,
    isEnabled,
    toggleShortcuts,
    updateShortcutKeys,
    resetShortcut
  } = useShortcuts()

  return (
    <ShortcutsProvider>
      <App />
    </ShortcutsProvider>
  )
}
```

### Разрешение конфликтов

```typescript
import { detectConflicts, validateNewKeys } from '@/features/keyboard-shortcuts'

const conflicts = detectConflicts(shortcuts)
const validation = validateNewKeys(["Ctrl+K"], "shortcut-id", allShortcuts)

if (!validation.valid) {
  console.error(validation.error, validation.conflicts)
}
```

## Интеграция

- **Зависит от**:
  - `@tauri-apps/plugin-store` - Сохранение настроек
  - `@tauri-apps/plugin-global-shortcut` - Глобальные системные shortcuts
  - `@/i18n` - Интернационализация

- **Используется в**:
  - Всех компонентах Timeline Studio, требующих клавиатурные сочетания
  - Модальном окне User Settings для настройки shortcuts

## Тестирование

- **Всего тестов**: 126+ тестов
- **Покрытие**: >85% (инструкции, ветвления, функции)
- **Тестовые файлы**:
  - `shortcuts-registry.test.ts` (26 тестов)
  - `shortcuts-conflicts.test.ts` (33 теста)
  - `shortcuts-persistence.test.ts` (50+ тестов)
  - `premiere-preset.test.ts` (17 тестов)
  - `shortcuts-provider.test.tsx` (полная интеграция React)

```bash
# Запустить все тесты
bun test src/features/keyboard-shortcuts/

# С покрытием
bun test:coverage src/features/keyboard-shortcuts/

# Конкретный тестовый файл
bun test src/features/keyboard-shortcuts/__tests__/presets/premiere-preset.test.ts
```

## Категории Shortcuts

1. **preferences** - Настройки приложения
2. **file** - Файловые операции (создание, сохранение, импорт)
3. **edit** - Редактирование (отмена, копирование, вставка)
4. **tools** - Инструменты (разделение, группировка, поворот)
5. **markers** - Цветные маркеры (красный, оранжевый, желтый и т.д.)
6. **advanced-tools** - Продвинутые инструменты (трекинг, вставка, замена)
7. **audio** - Аудио функции (растяжение, избранное, составные клипы)
8. **subtitles** - Субтитры (разделение, объединение)
9. **playback** - Управление воспроизведением (воспроизведение, стоп, кадры)
10. **navigation** - Навигация (переход к маркерам, масштабирование)
11. **timeline** - Операции с таймлайном (прокрутка, направляющие)
12. **markers-multicam** - Маркеры и мультикамера (отметки, углы камер)
13. **miscellaneous** - Прочее (помощь, экспорт)

## Форматы клавиш

- **macOS символы**: `⌘`, `⌥`, `⇧`, `⌃`
- **Текстовые модификаторы**: `cmd`, `command`, `meta`, `alt`, `option`, `shift`, `ctrl`
- **Универсальный модификатор**: `mod` - автоматически `cmd` на macOS, `ctrl` на Windows/Linux

## TODO / Roadmap

- [ ] **Запись макросов** - Запись и воспроизведение последовательностей действий
- [ ] **Облачная синхронизация** - Синхронизация настроек между устройствами
- [ ] **AI рекомендации** - Умные рекомендации shortcuts на основе использования
- [ ] **Видео туториалы** - Встроенные обучающие видео для новых пользователей
- [ ] **Command Palette** - Поиск всех доступных shortcuts с нечеткким поиском
- [ ] **E2E тесты** - Полное E2E покрытие для интеграции с Tauri
  - Регистрация/отмена глобальных shortcuts
  - Персистентность в Tauri Store
  - UI поток обнаружения конфликтов
  - Переключение пресетов
