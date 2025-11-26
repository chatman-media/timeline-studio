# Browser Domain - Changelog

## История изменений и аудитов

---

## [2025-11-26] Documentation Restructure

**Статус:** Completed

### Изменения
- Создана структура документации docs/
- Добавлен API.md с полным API reference
- Добавлен ARCHITECTURE.md с архитектурными диаграммами
- README.md сокращен до обзорного документа

---

## [2025-11-25] Event-Driven Architecture Migration

**Статус:** Completed

### Изменения
- Миграция на event-driven архитектуру
- Удален executeBrowserCommand - команды вызываются напрямую через tauri-bindings
- Удален refreshBrowserState - события обновляют состояние инкрементально
- Добавлены optimistic updates для лучшего UX

### Архитектурные решения
- Backend events через BackendSync.onEvent()
- XState машина для кэширования frontend состояния
- Инкрементальные обновления вместо полной перезагрузки

---

## Behavior (from tests)

### index.test.ts
- ✓ Экспортирует BrowserProvider
- ✓ Экспортирует useBrowser и useBrowserState hooks
- ✓ Экспортирует browserMachine и createBrowserActor
- ✓ Экспортирует handleBrowserBackendEvent
- ✓ Экспортирует типы (BrowserState, BrowserTab, TabSettings, ViewMode)
- ✓ Экспортирует константы (DEFAULT_TAB, BROWSER_TABS)

---

## Browser Tabs

Supported tabs:
- `media` - Медиафайлы (видео, аудио, изображения)
- `effects` - Видеоэффекты
- `filters` - Фильтры изображения
- `transitions` - Переходы между клипами
- `templates` - Шаблоны layouts (multi-camera)
- `style_templates` - Стилевые шаблоны (intro/outro)
- `music` - Музыкальные треки
- `subtitles` - Субтитры
- `projects` - Проекты
- `scenarios` - Сценарии

---

## Backend Events

| Event Type | Data | Description |
|------------|------|-------------|
| `TabSwitched` | `{ tab }` | Вкладка переключена |
| `SearchQueryChanged` | `{ tab, query }` | Поисковый запрос изменен |
| `FavoritesToggled` | `{ tab, show_favorites }` | Фильтр избранного изменен |
| `SortChanged` | `{ tab, sort_by, sort_order }` | Сортировка изменена |
| `GroupByChanged` | `{ tab, group_by }` | Группировка изменена |
| `FilterChanged` | `{ tab, filter_type }` | Фильтр типа изменен |
| `ViewModeChanged` | `{ tab, view_mode }` | Режим отображения изменен |
| `PreviewSizeChanged` | `{ tab, size_index }` | Размер превью изменен |
| `FileSelected` | `{ tab, file_id }` | Файл выбран |
| `FileDeselected` | `{ tab, file_id }` | Выбор с файла снят |
| `AllFilesSelected` | `{ tab, file_ids }` | Все файлы выбраны |
| `AllFilesDeselected` | `{ tab }` | Выбор снят со всех файлов |
