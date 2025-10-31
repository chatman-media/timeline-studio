# План исправления ошибок TypeScript в Timeline модулях

## Общая статистика
- Всего файлов с ошибками: 45
- Общее количество ошибок: ~340

## Категории файлов для исправления

### 1. Компоненты тестов (высокий приоритет)
- [ ] edit-mode-selector.test.tsx (3 ошибки)
- [ ] subtitle-editor-modal.test.tsx (1 ошибка)
- [ ] ai-marker-controls.test.tsx (12 ошибок)
- [ ] collapsed-group.test.tsx (1 ошибка)
- [ ] jl-cut-drag-handle.test.tsx (1 ошибка)
- [ ] jl-cut-indicator.test.tsx (1 ошибка)
- [ ] jl-cut-tool.test.tsx (1 ошибка)
- [ ] persons-panel.test.tsx (5 ошибок)

### 2. AI и анализ компоненты (высокий приоритет)
- [ ] timeline-ai-overlay.tsx (2 ошибки)
- [ ] enhanced-ai-panel.tsx (18 ошибок)
- [ ] use-timeline-ai-analysis.ts (11 ошибок)

### 3. Компоненты переходов (средний приоритет)
- [ ] transition-collision-indicator.tsx (1 ошибка)
- [ ] transition-control-panel.tsx (10 ошибок)
- [ ] transition-curve-editor.tsx (25 ошибок)
- [ ] transition-curve-visualizer.tsx (1 ошибка)
- [ ] transition-drop-zone.tsx (1 ошибка)
- [ ] transition-handles.tsx (2 ошибки)
- [ ] timeline-transition.tsx (1 ошибка)
- [ ] transition-drop-zone.tsx (1 ошибка)

### 4. Hooks и утилиты (высокий приоритет)
- [ ] use-clip-editing.ts (7 ошибок)
- [ ] use-clip-resources.ts (10 ошибок)
- [ ] use-clips.ts (17 ошибок)
- [ ] use-drag-drop-timeline.ts (10 ошибок)
- [ ] use-jl-cuts.ts (10 ошибок)
- [ ] use-linked-clips.ts (9 ошибок)
- [ ] use-slip-slide.ts (9 ошибок)
- [ ] use-speed-ramping.ts (14 ошибок)
- [ ] use-split-edit.ts (10 ошибок)
- [ ] use-tracks.ts (11 ошибок)

### 5. Сервисы (средний приоритет)
- [ ] effects-player-integration.ts (9 ошибок)
- [ ] resource-manager.ts (1 ошибка)
- [ ] timeline-ui-machine.ts (1 ошибка)
- [ ] transition-manager.ts (7 ошибок)
- [ ] timeline-to-project.ts (10 ошибок)

### 6. Остальные компоненты (низкий приоритет)
- [ ] audio-mixer.tsx (2 ошибки)
- [ ] clip-effects-panel.tsx (1 ошибка)
- [ ] group-context-menu.tsx (4 ошибки)
- [ ] group-manager-panel.tsx (2 ошибки)
- [ ] optimized-clip.tsx (2 ошибки)
- [ ] subtitle-clip.tsx (2 ошибки)
- [ ] keyframe-button.tsx (1 ошибка)
- [ ] linked-clips-connector.tsx (2 ошибки)
- [ ] timeline-markers-layer.tsx (1 ошибка)
- [ ] timeline-preview.tsx (6 ошибок)
- [ ] resource-browser.tsx (13 ошибок)
- [ ] subtitle-editor-modal.tsx (2 ошибки)
- [ ] subtitle-editor.tsx (2 ошибки)
- [ ] track-content.tsx (3 ошибки)
- [ ] virtualized-track-content.tsx (3 ошибки)
- [ ] undo-redo-buttons.tsx (8 ошибок)
- [ ] undo-redo-hotkeys.tsx (1 ошибка)
- [ ] undo-redo-panel.tsx (9 ошибок)
- [ ] virtualized-timeline-content.tsx (1 ошибка)

## Порядок исправления

### Фаза 1: Критические hooks и утилиты
1. use-clips.ts - основная логика клипов
2. use-tracks.ts - основная логика треков
3. use-speed-ramping.ts - система скорости
4. use-split-edit.ts - операции разделения

### Фаза 2: AI и анализ
1. use-timeline-ai-analysis.ts
2. enhanced-ai-panel.tsx
3. timeline-ai-overlay.tsx

### Фаза 3: Drag & Drop и взаимодействие
1. use-drag-drop-timeline.ts
2. use-clip-editing.ts
3. use-clip-resources.ts

### Фаза 4: Переходы и эффекты
1. transition-curve-editor.tsx
2. transition-control-panel.tsx
3. effects-player-integration.ts

### Фаза 5: Тесты и остальное
1. Все тестовые файлы
2. Остальные компоненты

## Общие проблемы которые нужно исправить

1. **Типы Domain объектов** - несоответствие между domain и feature типами
2. **XState типизация** - проблемы с машинами состояний
3. **Event handlers** - типизация событий
4. **Generic типы** - проблемы с обобщенными типами
5. **Enum и константы** - использование устаревших типов
6. **Hooks типизация** - возвращаемые типы и параметры

## Стратегия исправления

1. **Анализ зависимостей** - начинать с базовых типов и hooks
2. **Пошаговое исправление** - не более 5-10 файлов за раз
3. **Тестирование** - проверка работоспособности после каждой группы
4. **Документирование** - обновление этого плана по мере прогресса

## Прогресс

- [x] Фаза 1: 4/4 файлов ✅ ЗАВЕРШЕНА
  - [x] use-clips.ts ✅ (17 ошибок исправлено)
  - [x] use-tracks.ts ✅ (11 ошибок исправлено)
  - [x] use-speed-ramping.ts ✅ (14 ошибок исправлено)
  - [x] use-split-edit.ts ✅ (10 ошибок исправлено)
- [x] Фаза 2: 3/3 файлов ✅ ЗАВЕРШЕНА
  - [x] use-timeline-ai-analysis.ts ✅ (11 ошибок исправлено)
  - [x] enhanced-ai-panel.tsx ✅ (18 ошибок исправлено)
  - [x] timeline-ai-overlay.tsx ✅ (2 ошибки исправлено)  
- [x] Фаза 3: 3/3 файлов ✅ ЗАВЕРШЕНА
  - [x] use-drag-drop-timeline.ts ✅ (10 ошибок исправлено)
  - [x] use-clip-editing.ts ✅ (7 ошибок исправлено)
  - [x] use-clip-resources.ts ✅ (10 ошибок исправлено)
- [x] Фаза 4: 3/3 файлов ✅ ЗАВЕРШЕНА
  - [x] transition-curve-editor.tsx ✅ (25 ошибок исправлено)
  - [x] transition-control-panel.tsx ✅ (10 ошибок исправлено)
  - [x] effects-player-integration.ts ✅ (9 ошибок исправлено)
- [ ] Фаза 5: 0/остальных файлов

---

*Документ создан: 2024*
*Последнее обновление: 2024*