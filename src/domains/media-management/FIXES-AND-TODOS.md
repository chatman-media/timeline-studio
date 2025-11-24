# Исправления и TODO для Media Management

## ✅ Исправлено

### 1. 🐛 Критическая проблема: Файлы не отображаются в Browser

**Проблема**: При добавлении видео через браузер, файлы добавлялись в mediaPool и в ресурсы, но **не отображались в Browser**.

**Причина**: В `useMediaAdapter.tsx` при преобразовании `MediaInfo` → `MediaFile` отсутствовало обязательное поле `id`.

**Что происходило**:
1. `mediaPool` это `Map<UUID, MediaInfo>` (UUID - ключ от backend)
2. `useMediaAdapter` использовал только `values()` - получал только MediaInfo
3. Не добавлял UUID как поле `id` в MediaFile
4. `UniversalList` использует `getItemKey={(item) => item.id}`
5. `item.id = undefined` → React не мог отследить элементы → файлы не рендерились

**Решение** (строки 51-85 в `use-media-adapter.tsx`):
```typescript
// ❌ Было:
const mediaItems = Array.from(mediaPool.values())
return mediaItems.map((mediaInfo) => {
  return {
    path: mediaInfo.path,
    name: mediaInfo.name,
    // ❌ Отсутствует id!
  }
})

// ✅ Исправлено:
const mediaItems = Array.from(mediaPool.entries()) // entries вместо values!
return mediaItems.map(([mediaId, mediaInfo]) => {   // Деструктурируем [id, info]
  return {
    id: mediaId,  // ✅ Добавляем UUID как id!
    path: mediaInfo.path,
    name: mediaInfo.name,
    // ...
  }
})
```

**Файл**: `/src/features/browser/adapters/use-media-adapter.tsx`

**Статус**: ✅ Исправлено и протестировано

---

## 📋 TODO и несостыковки

### Приоритет: ВЫСОКИЙ

#### 1. smart-organization.ts - Отсутствует работа с реальными датами

**Проблемы**:
- TODO (строка 186): Использовать реальные даты файлов вместо заглушек
- TODO (строка 335): Реализовать извлечение даты из метаданных
- TODO (строка 349): Реализовать получение timestamp
- TODO (строка 361): Реализовать извлечение EXIF данных

**Текущая реализация**:
```typescript
// Строка 185-187
const sortedFiles = [...files].sort((_a, _b) => {
  // TODO: Использовать реальные даты файлов
  return 0
})

// Строка 334-337
private extractFileDate(filePath: string): Date {
  // TODO: Реализовать извлечение даты из метаданных
  return new Date()
}
```

**Рекомендация**: Интегрировать с `media-metadata-service.ts` для получения реальных метаданных.

---

### Приоритет: СРЕДНИЙ

#### 2. camera-import.ts - Заглушки для импорта с камеры

**Все методы возвращают моки**:
- TODO (строка 101): Реализовать определение камер через Tauri
- TODO (строка 130): Реализовать чтение файлов с устройства
- TODO (строка 176): Реализовать фактический импорт
- TODO (строки 181-185): Копирование, проверка дубликатов, организация, метаданные, удаление
- TODO (строка 248): Реализовать безопасное извлечение через Tauri

**Текущая реализация**:
```typescript
async getAvailableDevices(): Promise<CameraDevice[]> {
  // TODO: Реализовать определение камер через Tauri
  // В текущей версии возвращаем пустой массив
  return []
}
```

**Рекомендация**: Требуется Tauri plugin для работы с USB-устройствами.

#### 3. error-tracker.ts - Отсутствуют стратегии восстановления

**Проблемы**:
- TODO (строка 105): Реализовать retry логику
- TODO (строка 117): Реализовать альтернативные методы
- TODO (строка 333): Нужна статистика успешных операций

**Текущая реализация**:
```typescript
private attemptRetry(error: TrackedError): boolean {
  // TODO: Реализовать retry логику
  return false
}

private attemptAlternativeMethod(error: TrackedError): boolean {
  // TODO: Реализовать альтернативные методы
  return false
}
```

**Рекомендация**: Добавить exponential backoff и fallback стратегии.

---

### Приоритет: НИЗКИЙ

#### 4. waveform-generator.ts - Отсутствует чтение PNG

**Проблема**:
- TODO (строка 120): В будущем можно добавить чтение файла для PNG формата

**Текущая реализация**:
```typescript
// Пока возвращаем mock данные для совместимости с интерфейсом
return "mock-waveform-data"
```

**Рекомендация**: Низкий приоритет, текущая реализация работает.

---

## 🔍 Обнаруженные несостыковки

### 1. Типы: MediaInfo vs MediaFile

**MediaInfo** (домен media-management):
```typescript
interface MediaInfo {
  path: string
  name: string
  type: MediaType
  metadata?: MediaMetadata
  size?: number
  duration?: number
  thumbnailPath?: string
  // ❌ НЕТ поля id
}
```

**MediaFile** (feature media):
```typescript
interface MediaFile {
  id: string        // ✅ ОБЯЗАТЕЛЬНОЕ
  name: string
  path: string
  type: MediaType
  duration?: number
  // ... и другие поля
}
```

**Решение**: В `useMediaAdapter` добавлено преобразование с UUID из mediaPool как id.

### 2. Формат duration

**Backend** (`MediaData`):
```rust
duration: f64 // Секунды как число
```

**Frontend** (`MediaFile`):
```typescript
duration?: number // НО в некоторых местах строка "HH:MM:SS"!
```

**Несостыковка**: В `use-media-adapter.tsx` есть преобразование number → "HH:MM:SS" строку:
```typescript
let durationStr = "0"
if (mediaInfo.duration) {
  const hours = Math.floor(mediaInfo.duration / 3600)
  const minutes = Math.floor((mediaInfo.duration % 3600) / 60)
  const seconds = Math.floor(mediaInfo.duration % 60)
  durationStr = `${hours.toString().padStart(2, "0")}:...`
}
```

**Рекомендация**: Стандартизировать формат - везде использовать number (секунды).

### 3. MediaPool: Map ключ

**Backend** генерирует UUID:
```rust
let media_id = Uuid::new_v4().to_string()
```

**Frontend** использует как ключ Map:
```typescript
mediaPool: Map<string, MediaInfo>
//            ^^^^^^ UUID от backend
```

**Несостыковка**: `MediaInfo` не содержит поле `id`, хотя UUID есть как ключ Map.

**Рекомендация**: Рассмотреть добавление `id` в `MediaInfo` для консистентности, или использовать entries() везде.

---

## 📊 Статистика TODO

### По приоритетам:
- 🔴 ВЫСОКИЙ: 4 TODO (smart-organization)
- 🟡 СРЕДНИЙ: 9 TODO (camera-import, error-tracker)
- 🟢 НИЗКИЙ: 1 TODO (waveform-generator)

### По файлам:
- `camera-import.ts`: 9 TODO
- `smart-organization.ts`: 4 TODO
- `error-tracker.ts`: 3 TODO
- `waveform-generator.ts`: 1 TODO

**Всего**: 17 TODO

---

## 🎯 Рекомендации по приоритизации

### Немедленно (сделано):
1. ✅ Исправить отображение файлов в Browser (добавить `id`)

### В ближайшее время:
1. Реализовать работу с реальными датами файлов (`smart-organization.ts`)
2. Стандартизировать формат duration (number везде)
3. Добавить retry логику в error-tracker

### Можно отложить:
1. Импорт с камеры (требует Tauri plugin)
2. PNG waveform (текущая реализация работает)

---

## 📝 Чек-лист для разработчиков

При работе с MediaPool и Browser:

- [x] Всегда используйте `mediaPool.entries()` для получения и id, и данных
- [x] Добавляйте поле `id` при преобразовании MediaInfo → MediaFile
- [ ] Используйте единый формат duration (number в секундах)
- [ ] Проверяйте, что ListItem имеет обязательное поле `id`
- [ ] Тестируйте отображение в Browser после изменений mediaPool

---

## 🔗 Связанные документы

- [MEDIAPOOL-ARCHITECTURE.md](./MEDIAPOOL-ARCHITECTURE.md) - Архитектура mediaPool
- [MEDIAPOOL-QUICK-GUIDE.md](./MEDIAPOOL-QUICK-GUIDE.md) - Быстрый старт
- [README.md](./README.md) - Уведомления при импорте

---

**Создано**: November 2024  
**Последнее обновление**: November 2024  
**Версия**: 1.0.0
