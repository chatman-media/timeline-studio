# Чек-лист: Расширение Resources Panel

**Дата создания:** 2025-01-11
**Статус:** В работе
**Цель:** Полная интеграция всех типов ресурсов (Effects, Filters, Transitions, Templates, Style Templates, Subtitles) с backend хранилищем

---

## 📋 Обзор задач

### Текущее состояние
- ✅ Media (Video/Image) - полностью интегрировано через MediaPool
- ✅ Music (Audio) - полностью интегрировано через MediaPool
- ❌ Effects - команды есть, хранилище отсутствует
- ❌ Filters - команды есть, хранилище отсутствует
- ❌ Transitions - команды есть, хранилище отсутствует
- ❌ Templates - команды есть, хранилище отсутствует
- ❌ Style Templates - команды есть, хранилище отсутствует
- ❌ Subtitles - команды есть, хранилище отсутствует

---

## 🎯 Фаза 1: Backend - Расширение ProjectState

### 1.1. Добавить типы ресурсов в Rust
**Файл:** `src-tauri/src/state/project_state.rs`

- [ ] Создать `EffectResource` struct
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize, Type)]
  pub struct EffectResource {
      pub id: String,
      pub name: String,
      pub effect_id: String,
      pub parameters: serde_json::Value,
      pub added_at: i64,
  }
  ```

- [ ] Создать `FilterResource` struct
- [ ] Создать `TransitionResource` struct
- [ ] Создать `TemplateResource` struct
- [ ] Создать `StyleTemplateResource` struct
- [ ] Создать `SubtitleResource` struct

### 1.2. Добавить пулы ресурсов в Project
**Файл:** `src-tauri/src/state/project_state.rs`

- [ ] Добавить в `Project` struct:
  ```rust
  pub struct Project {
      // ...существующие поля
      pub effects_pool: HashMap<String, EffectResource>,
      pub filters_pool: HashMap<String, FilterResource>,
      pub transitions_pool: HashMap<String, TransitionResource>,
      pub templates_pool: HashMap<String, TemplateResource>,
      pub style_templates_pool: HashMap<String, StyleTemplateResource>,
      pub subtitles_pool: HashMap<String, SubtitleResource>,
  }
  ```

- [ ] Обновить `Project::new()` для инициализации пустых HashMap
- [ ] Обновить сериализацию/десериализацию проекта

---

## 🎯 Фаза 2: Backend - Команды для ресурсов

### 2.1. Создать ResourceCommands модуль
**Файл:** `src-tauri/src/state/commands/resources.rs`

- [ ] Создать `ResourceCommands` struct с методами:
  - [ ] `add_effect(effect_id, name, parameters)` → `CommandResult`
  - [ ] `remove_effect(effect_id)` → `CommandResult`
  - [ ] `update_effect(effect_id, parameters)` → `CommandResult`

- [ ] Аналогичные методы для:
  - [ ] Filters
  - [ ] Transitions
  - [ ] Templates
  - [ ] Style Templates
  - [ ] Subtitles

### 2.2. Добавить Events для ресурсов
**Файл:** `src-tauri/src/state/events.rs`

- [ ] Добавить события:
  ```rust
  pub enum ProjectEvent {
      // ...существующие
      EffectAdded { effect_id: String, name: String },
      EffectRemoved { effect_id: String },
      EffectUpdated { effect_id: String, changes: EffectChanges },
      // Аналогично для остальных типов
  }
  ```

### 2.3. Интегрировать в CommandHandler
**Файл:** `src-tauri/src/state/commands/handler.rs`

- [ ] Добавить обработку команд `SaveResource/DeleteResource` для каждого типа
- [ ] Добавить маршрутизацию по `resource_type` параметру
- [ ] Обеспечить публикацию событий через EventBus

---

## 🎯 Фаза 3: Backend - Валидация

### 3.1. Добавить валидацию данных
**Файл:** `src-tauri/src/state/commands/resources.rs`

- [ ] Валидация существования эффектов/фильтров перед добавлением
- [ ] Проверка корректности JSON параметров
- [ ] Дедупликация по `resource_id`
- [ ] Валидация обязательных полей (id, name)

### 3.2. Обработка ошибок
- [ ] Добавить специфичные коды ошибок для ресурсов
- [ ] Обработка отсутствующих ресурсов
- [ ] Обработка некорректных параметров

---

## 🎯 Фаза 4: Frontend - Обновление типов

### 4.1. Регенерация Tauri bindings
**Команда:** `bun run tauri build --features generate-types`

- [ ] Запустить генерацию типов
- [ ] Проверить появление новых типов в `tauri-bindings.ts`:
  - [ ] `EffectResource`
  - [ ] `FilterResource`
  - [ ] `TransitionResource`
  - [ ] `TemplateResource`
  - [ ] `StyleTemplateResource`
  - [ ] `SubtitleResource`

### 4.2. Обновить frontend типы
**Файл:** `src/features/resources/types.ts`

- [ ] Убедиться что frontend типы совпадают с backend
- [ ] Добавить утилиты конвертации если нужны
- [ ] Обновить factory функции (`createEffectResource`, etc.)

---

## 🎯 Фаза 5: Frontend - ResourcesProvider

### 5.1. Извлечение из backend state
**Файл:** `src/features/resources/services/resources-provider.tsx`

- [ ] Заменить пустые массивы на извлечение из `backendState.project`:
  ```typescript
  const effectResources: EffectResource[] = backendState?.project?.effects_pool
    ? Object.values(backendState.project.effects_pool).map(convertToEffectResource)
    : []
  ```

- [ ] Реализовать конвертацию для каждого типа:
  - [ ] Effects
  - [ ] Filters
  - [ ] Transitions
  - [ ] Templates
  - [ ] Style Templates
  - [ ] Subtitles

### 5.2. Обновить методы добавления
- [ ] `addEffect()` - отправка `SaveResource` с правильными параметрами
- [ ] `addFilter()` - отправка `SaveResource`
- [ ] `addTransition()` - отправка `SaveResource`
- [ ] `addTemplate()` - отправка `SaveResource`
- [ ] `addStyleTemplate()` - отправка `SaveResource`
- [ ] `addSubtitle()` - отправка `SaveResource`

### 5.3. Обновить методы удаления
- [ ] `removeResource()` - корректная отправка `DeleteResource` для всех типов
- [ ] Определение `resource_type` по id или явно из параметра

### 5.4. Подписка на события
- [ ] Добавить обработку событий для новых типов ресурсов:
  ```typescript
  const resourceEventTypes = [
    "EffectAdded", "EffectRemoved", "EffectUpdated",
    "FilterAdded", "FilterRemoved", "FilterUpdated",
    // и т.д.
  ]
  ```

---

## 🎯 Фаза 6: Тестирование

### 6.1. Unit тесты (Backend)
**Файл:** `src-tauri/src/state/commands/resources.rs`

- [ ] Тест добавления эффекта
- [ ] Тест удаления эффекта
- [ ] Тест обновления параметров
- [ ] Тест дедупликации
- [ ] Тест валидации
- [ ] Повторить для остальных типов

### 6.2. Unit тесты (Frontend)
**Файл:** `src/features/resources/__tests__/resources-provider.test.tsx`

- [ ] Тест извлечения ресурсов из backend state
- [ ] Тест добавления каждого типа ресурса
- [ ] Тест удаления ресурсов
- [ ] Тест event-driven обновления
- [ ] Тест дедупликации на frontend

### 6.3. Integration тесты
- [ ] Добавить эффект из Browser → проверить появление в Resources Panel
- [ ] Перетащить фильтр на таймлайн → проверить создание клипа
- [ ] Сохранить проект → загрузить → проверить сохранность ресурсов
- [ ] Закрыть приложение → открыть → проверить персистентность

### 6.4. E2E тесты
**Файл:** `e2e/resources-panel.spec.ts`

- [ ] Полный цикл работы с эффектами
- [ ] Полный цикл работы с фильтрами
- [ ] Полный цикл работы с переходами
- [ ] Полный цикл работы с шаблонами
- [ ] Проверка Drag & Drop для всех типов

---

## 🎯 Фаза 7: Оптимизация и полировка

### 7.1. Производительность
- [ ] Проверить время загрузки проекта с 100+ ресурсами
- [ ] Оптимизировать конвертацию типов при необходимости
- [ ] Добавить индексирование в HashMap если требуется

### 7.2. UX улучшения
- [ ] Добавить loading состояния при добавлении ресурсов
- [ ] Улучшить feedback при ошибках
- [ ] Добавить визуальную индикацию дубликатов
- [ ] Оптимизировать превью для больших коллекций

### 7.3. Документация
- [ ] Обновить Architecture документацию
- [ ] Добавить примеры использования API
- [ ] Обновить схему взаимодействия компонентов
- [ ] Документировать формат хранения в проекте

---

## 🎯 Фаза 8: Миграция существующих проектов

### 8.1. Создать migration скрипт
**Файл:** `src-tauri/src/migrations/add_resource_pools.rs`

- [ ] Проверка версии проекта
- [ ] Добавление пустых пулов в существующие проекты
- [ ] Миграция данных если они хранились в другом формате
- [ ] Тестирование на реальных проектах

### 8.2. Обратная совместимость
- [ ] Обеспечить открытие старых проектов
- [ ] Graceful degradation если пулы отсутствуют
- [ ] Версионирование формата проекта

---

## ✅ Критерии завершения

### Must Have (Обязательно)
- ✅ Все 6 типов ресурсов хранятся в ProjectState
- ✅ Backend команды работают для всех типов
- ✅ Frontend отображает ресурсы из backend
- ✅ Drag & Drop работает для всех типов
- ✅ Ресурсы сохраняются в файл проекта
- ✅ Ресурсы загружаются при открытии проекта
- ✅ Unit тесты покрывают основные сценарии

### Should Have (Желательно)
- ✅ Валидация данных на backend
- ✅ Дедупликация на backend
- ✅ Event-driven обновление UI
- ✅ E2E тесты
- ✅ Миграция существующих проектов

### Nice to Have (Опционально)
- ⚪ Оптимизация для больших коллекций
- ⚪ Расширенная валидация параметров
- ⚪ Версионирование ресурсов
- ⚪ Undo/Redo для операций с ресурсами

---

## 📊 Метрики успеха

1. **Функциональность**: 100% типов ресурсов интегрированы
2. **Покрытие тестами**: >80% для критичных путей
3. **Производительность**: Загрузка <500ms для проекта со 100 ресурсами
4. **Стабильность**: 0 критических багов в течение 1 недели тестирования

---

## 🚀 План выполнения

### Неделя 1: Backend Foundation
- Фаза 1: Расширение ProjectState
- Фаза 2: Команды для ресурсов
- Фаза 3: Валидация

### Неделя 2: Frontend Integration
- Фаза 4: Обновление типов
- Фаза 5: ResourcesProvider
- Фаза 6: Тестирование (начало)

### Неделя 3: Testing & Polish
- Фаза 6: Тестирование (завершение)
- Фаза 7: Оптимизация
- Фаза 8: Миграция

---

## 📝 Примечания

- Каждая задача должна быть протестирована перед переходом к следующей
- Коммиты делать по завершению логических блоков
- Регулярно синхронизировать типы между frontend и backend
- Отслеживать breaking changes в API
