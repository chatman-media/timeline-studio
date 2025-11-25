# Keyboard Shortcuts Module

Модуль для управления клавиатурными сочетаниями в приложении Timeline Studio.

## 📁 Структура модуля

```
keyboard-shortcuts/
├── components/
│   ├── shortcut-handler.tsx      # Компонент для регистрации shortcuts
│   └── keyboard-shortcuts-modal.tsx # UI для управления shortcuts
├── constants/
│   └── default-shortcuts.ts      # Дефолтные клавиатурные сочетания
├── hooks/
│   └── use-panel-shortcuts.ts   # Хук для shortcuts панелей
├── presets/
│   ├── index.ts                 # Экспорт всех preset функций
│   ├── types.ts                 # TypeScript типы для presets
│   ├── timeline-preset.ts       # Предустановка Timeline Studio
│   ├── filmora-preset.ts        # Предустановка Wondershare Filmora
│   └── premiere-preset.ts       # Предустановка Adobe Premiere Pro (119 shortcuts)
├── services/
│   ├── shortcuts-registry.ts    # Централизованный реестр shortcuts
│   ├── shortcuts-provider.tsx   # React провайдер для shortcuts
│   └── tauri-global-shortcuts.ts # Сервис для глобальных shortcuts через Tauri
└── types/
    └── shortcuts.ts             # TypeScript типы
```

## 🏗️ Архитектура

### Централизованный реестр (ShortcutsRegistry)

Singleton класс для управления всеми клавиатурными сочетаниями:

```typescript
const registry = ShortcutsRegistry.getInstance()

// Регистрация shortcut
registry.register({
  id: "save-project",
  name: "Сохранить проект",
  category: "file",
  keys: ["⌘S", "cmd+s", "ctrl+s"],
  action: (event) => { /* ... */ }
})

// Получение shortcuts
const allShortcuts = registry.getAll()
const fileShortcuts = registry.getByCategory("file")
```

### ShortcutsProvider

React провайдер для интеграции с компонентами:

```tsx
<ShortcutsProvider>
  <App />
</ShortcutsProvider>
```

### useShortcuts хук

```typescript
const {
  shortcuts,           // Все зарегистрированные shortcuts
  isEnabled,          // Глобальное состояние активности
  toggleShortcuts,    // Включить/выключить shortcuts
  updateShortcutKeys, // Изменить клавиши для shortcut
  resetShortcut,      // Сбросить к дефолтным значениям
  resetAllShortcuts   // Сбросить все shortcuts
} = useShortcuts()
```

## 🎯 Основные возможности

### ✅ Реализовано

1. **Централизованная регистрация** - Все shortcuts в одном месте
2. **Множественные комбинации** - Поддержка разных вариантов для одного действия
3. **Категоризация** - Группировка по категориям (файл, вид, таймлайн и т.д.)
4. **UI для управления** - Модальное окно для просмотра и редактирования
5. **Предустановки** - Timeline Studio, Wondershare Filmora, Adobe Premiere Pro (119 shortcuts)
6. **Поиск** - По названию или комбинации клавиш
7. **Локализация** - Поддержка i18n
8. **Персистентность** - Сохранение в localStorage и Tauri Store
9. **Разрешение конфликтов** - Автоматическое обнаружение и предложение альтернатив
10. **Экспорт/Импорт** - Сохранение и загрузка настроек в JSON
11. **Визуальные индикаторы** - Отображение конфликтов в UI
12. **Cheat Sheet** - Генерация шпаргалки с возможностью печати
13. **Preset система** - Быстрое переключение между наборами shortcuts

### 🎯 Готово к использованию

Модуль достиг **100% готовности** и включает все основные функции:
- ✅ Персистентность настроек
- ✅ Разрешение конфликтов
- ✅ Экспорт/Импорт presets
- ✅ Визуальный редактор
- ✅ Cheat sheet генерация
- ✅ Контекстные shortcuts
- ✅ Покрытие тестами >85%

## 📝 Использование

### Регистрация нового shortcut

```typescript
// В constants/default-shortcuts.ts
export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  createMacShortcut(
    "my-action",
    "Мое действие",
    "category",
    "⌘K",
    "Описание действия"
  ),
  // ...
]

// В shortcuts-provider.tsx или отдельном хуке
case "my-action":
  return {
    ...shortcut,
    action: (event: KeyboardEvent) => {
      event.preventDefault()
      // Ваше действие
    },
  }
```

### Использование в компоненте

```tsx
function MyComponent() {
  const { shortcuts, updateShortcutKeys } = useShortcuts()
  
  const saveShortcut = shortcuts.find(s => s.id === "save-project")
  
  return (
    <div>
      <span>Сохранить: {saveShortcut?.keys[0]}</span>
      <button onClick={() => updateShortcutKeys("save-project", ["⌘S"])}>
        Изменить
      </button>
    </div>
  )
}
```

## 🔧 Категории shortcuts

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

## ⚙️ Настройки

### Опции для shortcuts

```typescript
{
  enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"], // Работает в полях ввода
  preventDefault: true,                               // Предотвращать дефолтное поведение
  enabled: true,                                      // Активность shortcut
}
```

### Форматы клавиш

- macOS символы: `⌘`, `⌥`, `⇧`, `⌃`
- Текстовые: `cmd`, `command`, `meta`, `alt`, `option`, `shift`, `ctrl`
- Модификатор `mod` - автоматически `cmd` на macOS, `ctrl` на Windows/Linux

## 🧪 Тестирование

```bash
# Запуск всех тестов модуля
bun test src/features/keyboard-shortcuts/

# Проверка Adobe Premiere preset
bun test src/features/keyboard-shortcuts/__tests__/presets/premiere-preset.test.ts

# Запуск тестов с покрытием
bun test:coverage src/features/keyboard-shortcuts/
```

### Покрытие тестами

- ✅ **Adobe Premiere Preset** - 17 тестов, полное покрытие всех 119 shortcuts
- ✅ **Shortcuts Conflicts** - 33 теста, полное покрытие системы конфликтов
- ✅ **Shortcuts Registry** - 26 тестов, включая контекстную систему
- ✅ **Shortcuts Persistence** - 50+ тестов, localStorage и Tauri Store
- ✅ **Shortcuts Provider** - полное покрытие React интеграции
- ✅ **Timeline Preset** - базовые тесты структуры
- ✅ **Filmora Preset** - базовые тесты структуры

**Общее покрытие: >85%**

## 🎉 Новые возможности v1.0

### Разрешение конфликтов
```typescript
import { detectConflicts, validateNewKeys } from "@/features/keyboard-shortcuts"

// Автоматическое обнаружение конфликтов
const conflicts = detectConflicts(shortcuts)

// Валидация новых клавиш
const validation = validateNewKeys(["Ctrl+K"], "shortcut-id", allShortcuts)
if (!validation.valid) {
  console.error(validation.error, validation.conflicts)
}
```

### Экспорт/Импорт настроек
```typescript
import { useShortcuts } from "@/features/keyboard-shortcuts"

function MyComponent() {
  const { exportSettings, importSettings } = useShortcuts()

  const handleExport = async () => {
    const json = await exportSettings()
    // Сохранить в файл
  }

  const handleImport = async (jsonString: string) => {
    await importSettings(jsonString)
  }
}
```

### Cheat Sheet
```typescript
import { ShortcutsCheatSheet } from "@/features/keyboard-shortcuts"

// Отображение всех shortcuts с возможностью печати
<ShortcutsCheatSheet />
```

### Визуальные индикаторы конфликтов
```typescript
import { ConflictIndicator } from "@/features/keyboard-shortcuts"

<ConflictIndicator
  conflicts={conflicts}
  shortcutId="my-shortcut"
/>
```

## 🔌 API (Backend Commands)

Модуль не использует прямые Tauri команды, но интегрируется с Tauri Store API для персистентности:
- Использует `@tauri-apps/plugin-store` для сохранения настроек
- Поддерживает fallback на localStorage для веб-версии

## 🧪 Behavior (from tests) / Поведение (из тестов)

### shortcuts-persistence.test.ts
- ✓ Должен возвращать singleton instance
- ✓ Должен сохранять настройки в localStorage в веб-режиме
- ✓ Должен сохранять настройки в Tauri Store в desktop-режиме
- ✓ Должен использовать fallback на localStorage при ошибке Tauri Store
- ✓ Должен загружать настройки из localStorage/Tauri Store
- ✓ Должен мигрировать настройки при несовпадении версии
- ✓ Должен применять сохраненные настройки к shortcuts
- ✓ Должен экспортировать/импортировать настройки в JSON
- ✓ Должен обрабатывать edge cases (пустые массивы, невалидный JSON)

### tauri-global-shortcuts.test.ts
- ✓ Должен регистрировать глобальные shortcuts через Tauri API
- ✓ Должен отменять регистрацию при отключении
- ✓ Должен конвертировать macOS символы в Tauri формат
- ✓ Должен конвертировать текстовые модификаторы (cmd, ctrl, alt, shift)
- ✓ Должен вызывать action при срабатывании shortcut
- ✓ Должен обновлять shortcuts при изменениях

### shortcuts-provider.test.tsx
- ✓ Должен инициализировать провайдер с DEFAULT_SHORTCUTS
- ✓ Должен подписываться на изменения shortcuts
- ✓ Должен загружать сохраненные настройки
- ✓ Должен включать/выключать shortcuts
- ✓ Должен обновлять клавиши shortcut
- ✓ Должен сбрасывать shortcuts к дефолтным значениям
- ✓ Должен автоматически сохранять настройки

### shortcuts-conflicts.test.ts
- ✓ Должен обнаруживать конфликты между shortcuts
- ✓ Должен предлагать альтернативные клавиши
- ✓ Должен валидировать новые клавиши перед применением

### shortcuts-registry.test.ts
- ✓ Должен регистрировать shortcuts в централизованном реестре
- ✓ Должен получать shortcuts по ID, категории, контексту
- ✓ Должен обновлять и удалять shortcuts
- ✓ Должен управлять контекстными shortcuts (global, timeline, browser)

## 🚀 Будущие улучшения

1. **Запись макросов** - последовательности действий на одну клавишу
2. **Облачная синхронизация** настроек между устройствами
3. **AI-подсказки** - умные рекомендации shortcuts на основе использования
4. **Видео туториалы** - встроенные обучающие видео для новых пользователей

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/keyboard-shortcuts/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Открытие модального окна клавиатурных сочетаний | ⏳ Planned | - | 🔴 High |
| Регистрация shortcut через ShortcutsRegistry | ⏳ Planned | - | 🔴 High |
| Выполнение действия по нажатию shortcut | ⏳ Planned | - | 🔴 High |
| Изменение клавиш для shortcut | ⏳ Planned | - | 🔴 High |
| Обнаружение конфликтов клавиш | ⏳ Planned | - | 🔴 High |
| Разрешение конфликтов (предложение альтернатив) | ⏳ Planned | - | 🟡 Medium |
| Сохранение настроек в Tauri Store | ⏳ Planned | - | 🔴 High |
| Загрузка настроек из Tauri Store | ⏳ Planned | - | 🔴 High |
| Переключение между preset (Timeline/Premiere/Filmora) | ⏳ Planned | - | 🟡 Medium |
| Экспорт настроек в JSON | ⏳ Planned | - | 🟡 Medium |
| Импорт настроек из JSON | ⏳ Planned | - | 🟡 Medium |
| Глобальные shortcuts через Tauri API | ⏳ Planned | - | 🔴 High |
| Регистрация глобального shortcut (register) | ⏳ Planned | - | 🔴 High |
| Отмена глобального shortcut (unregister) | ⏳ Planned | - | 🟡 Medium |
| Проверка занятости shortcut (isRegistered) | ⏳ Planned | - | 🟡 Medium |
| Поиск shortcuts по названию | ⏳ Planned | - | 🟢 Low |
| Поиск shortcuts по комбинации клавиш | ⏳ Planned | - | 🟢 Low |
| Генерация Cheat Sheet | ⏳ Planned | - | 🟢 Low |
| Сброс shortcuts к дефолтным значениям | ⏳ Planned | - | 🟡 Medium |
| Включение/выключение shortcuts глобально | ⏳ Planned | - | 🟡 Medium |
| Контекстные shortcuts (timeline/browser/global) | ⏳ Planned | - | 🟡 Medium |

### Приоритеты
- 🔴 High - критичный функционал, тестировать первым
- 🟡 Medium - важный функционал
- 🟢 Low - дополнительный функционал

### Tauri API используемый модулем
- `@tauri-apps/plugin-store` - сохранение настроек shortcuts
- `@tauri-apps/plugin-global-shortcut` - глобальные shortcuts (register, unregister, isRegistered)

### Примечания
- Модуль использует Tauri Store для персистентности (fallback на localStorage)
- Глобальные shortcuts работают только в desktop режиме
- Поддержка 3 preset: Timeline Studio, Adobe Premiere Pro (119 shortcuts), Wondershare Filmora