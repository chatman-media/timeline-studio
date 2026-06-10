# Effects Services

Сервисы для управления эффектами в домене video-editing.

## Структура

```
effects/
├── user-presets-service.ts  # Управление пользовательскими пресетами
├── user-effects-service.ts  # Управление эффектами и backend команды
└── index.ts                 # Экспорт всех сервисов
```

## Сервисы

### User Presets Service

Управление пользовательскими пресетами эффектов:
- Сохранение/загрузка пресетов в localStorage
- Импорт/экспорт пресетов в файлы
- Управление избранными пресетами

**Основные функции:**
```typescript
// Создание пресета
await saveUserPreset(effectId, name, params, options)

// Загрузка пресета
const preset = await loadUserPreset(presetId)

// Получение всех пресетов для эффекта
const presets = await loadPresetsForEffect(effectId)

// Импорт/экспорт
const count = await importPresets(filePath)
await exportPresets(presetIds, filePath)
```

**Backend команды:**
- `save_file` - сохранение пресетов в файл
- `load_file` - загрузка пресетов из файла

### User Effects Service

Управление пользовательскими эффектами и backend операции:
- CRUD операции с пользовательскими эффектами
- Работа с коллекциями эффектов
- Применение эффектов к клипам через backend

**Основные функции:**
```typescript
// CRUD эффектов
const filePath = await saveUserEffect(effect, fileName)
const effect = await loadUserEffect(filePath)
const files = await getUserEffectsList()
await deleteUserEffect(filePath)

// Коллекции
const path = await saveEffectsCollection(collection, fileName)
const collection = await loadEffectsCollection(filePath)

// Применение к клипам
const schema = await addEffectToClip(projectSchema, clipId, effectId)
const schema = await addFilterToClip(projectSchema, clipId, filterId)

// Создание эффектов
const effect = await createEffect(effectType, parameters)
const filter = await createFilter(filterType, parameters)
```

**Backend команды:**
- `save_user_effect` - сохранение эффекта
- `load_user_effect` - загрузка эффекта
- `get_user_effects_list` - список эффектов
- `delete_user_effect` - удаление эффекта
- `save_effects_collection` - сохранение коллекции
- `load_effects_collection` - загрузка коллекции
- `add_effect_to_clip` - применить эффект к клипу
- `add_filter_to_clip` - применить фильтр к клипу
- `remove_effect_from_clip` - удалить эффект
- `remove_filter_from_clip` - удалить фильтр
- `create_effect` - создать эффект
- `create_filter` - создать фильтр

## Использование

### Из features/effects

Сервисы реэкспортируются через `features/effects/index.ts` для обратной совместимости:

```typescript
import {
  saveUserPreset,
  addEffectToClip,
  createEffect
} from '@/features/effects'
```

### Из других доменов

Можно использовать напрямую:

```typescript
import {
  saveUserPreset,
  addEffectToClip,
  createEffect
} from '@/domains/video-editing/services/effects'
```

## Миграция

Бизнес-логика была перенесена из `features/effects`:
- `features/effects/services/user-presets-service.ts` → `domains/video-editing/services/effects/user-presets-service.ts`
- Функции с `invoke` из `features/effects/utils/user-effects.ts` → `domains/video-editing/services/effects/user-effects-service.ts`

Утилиты без backend вызовов остались в `features/effects/utils/user-effects.ts`.

## Связанные модули

- `@/features/effects` - UI компоненты и презентационная логика эффектов
- `@/domains/video-editing/types/effects.ts` - типы для эффектов и переходов
