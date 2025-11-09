# Рефакторинг Browser: Оптимизация производительности и упрощение архитектуры

**Дата создания:** 2024-11-09
**Статус:** 🔴 Активная
**Приоритет:** Высокий
**Ответственный:** Dev Team

## 📋 Описание проблемы

Browser компонент перегружен избыточной логикой, слишком сложными preview компонентами и имеет проблемы с производительностью при большом количестве файлов.

### Текущее состояние

```
features/browser/
├── components/ (96 файлов)
│   ├── preview/
│   │   ├── video-preview.tsx     ← 799 строк! 😱
│   │   ├── audio-preview.tsx     ← 384 строки, лишний AudioContext
│   │   └── image-preview.tsx     ← 268 строк
│   ├── browser-loading-indicator.tsx ← 150 строк, возможно лишний
│   └── universal-list.tsx        ← Нет виртуализации
├── providers/
│   └── browser-resources-provider.tsx ← 500+ строк, дублирует domains?
└── hooks/ + services/ + adapters/
```

### Ключевые проблемы

1. **VideoPreview (799 строк):**
   - 20+ вызовов logger.debugSync на каждом hover
   - Сложная система refs для множественных video элементов
   - Throttling с 30fps все равно вызывается на каждый mousemove
   - Рендерит ВСЕ video streams сразу, даже невидимые
   - Base64 poster images увеличивают DOM

2. **AudioPreview (384 строки):**
   - Создает AudioContext + MediaRecorder для КАЖДОГО preview
   - LiveAudioVisualizer рендерится для всех аудио файлов
   - 3 useEffect хука читают файл через readFile при монтировании

3. **BrowserLoadingIndicator (150 строк):**
   - Пользователь считает что панель не нужна
   - Занимает место в UI
   - Детальная статистика не используется

4. **Нет виртуализации:**
   - Все preview компоненты монтируются сразу
   - High memory usage при большом количестве файлов

5. **Дублирование провайдеров:**
   - `domains/browser/providers/browser-provider.tsx` (391 строка)
   - `features/browser/providers/browser-resources-provider.tsx` (500+ строк)

## 🎯 Цели рефакторинга

### Главная цель
Упростить компоненты и улучшить производительность без полного DDD рефакторинга, сохраняя BackendSync архитектуру.

### Метрики успеха
- VideoPreview: 799 → ~400 строк (-50%)
- AudioPreview: 384 → ~200 строк (-48%)
- Memory usage: -70% (через виртуализацию)
- CPU usage: -60% (убрать logging + лучший throttling)
- Только 10-20 preview в DOM вместо всех

## 📝 План действий

### Фаза 1: Оптимизация Preview компонентов (День 1-2)

#### 1.1 VideoPreview рефакторинг

**Задача:** Разбить video-preview.tsx (799 строк) на подкомпоненты

**Действия:**
```
src/features/browser/components/preview/video/
├── VideoPreview.tsx           ← Основной компонент (150 строк)
├── VideoStream.tsx            ← Рендер одного stream (100 строк)
├── VideoOverlay.tsx           ← Buttons/info overlay (80 строк)
├── VideoHover.tsx             ← Hover logic с throttling (100 строк)
├── useVideoPreview.ts         ← Логика в hook (150 строк)
└── types.ts                   ← Типы (20 строк)
```

**Оптимизации:**
- [ ] Удалить все `logger.debugSync` вызовы (production mode)
- [ ] Заменить `performance.now` throttling на `requestAnimationFrame`
- [ ] Lazy load video streams (render только visible stream)
- [ ] Использовать blob URLs вместо base64 для poster
- [ ] Добавить Intersection Observer для lazy initialization

**Файлы для изменения:**
- `src/features/browser/components/preview/video-preview.tsx`

**Результат:** 799 → ~400 строк, -50% re-renders

#### 1.2 AudioPreview оптимизация

**Задача:** Оптимизировать audio-preview.tsx (384 строки)

**Действия:**
- [ ] AudioContext создавать только при play/hover (не при mount)
- [ ] Убрать LiveAudioVisualizer по умолчанию (показывать только при hover)
- [ ] Lazy load audio files (не при монтировании)
- [ ] Использовать один AudioContext на всё приложение (singleton)

**Код изменений:**
```typescript
// БЫЛО:
useEffect(() => {
  audioContextRef.current = new AudioContext() // Для КАЖДОГО файла!
  const recorder = new MediaRecorder(destination.stream)
  setMediaRecorder(recorder)
}, [file.name])

// СТАЛО:
const handlePlay = useCallback(() => {
  // Создаем AudioContext только при play
  if (!audioContextRef.current) {
    audioContextRef.current = getSharedAudioContext()
  }
  // ...
}, [])
```

**Файлы для изменения:**
- `src/features/browser/components/preview/audio-preview.tsx`
- Создать `src/features/browser/services/audio-context-singleton.ts`

**Результат:** 384 → ~200 строк, -AudioContext instances

#### 1.3 BrowserLoadingIndicator - упрощение

**Задача:** Убрать или упростить browser-loading-indicator.tsx (150 строк)

**Варианты:**
1. **Удалить полностью** - использовать только `BrowserTabLoadingBadge` (уже есть)
2. **Упростить до простого badge:**
```typescript
// БЫЛО: 150 строк с детальной статистикой
<BrowserLoadingIndicator />

// СТАЛО: 3 строки
{isLoading && <div className="loading-badge">Загрузка...</div>}
```

**Рекомендация:** Вариант 2 (упростить)

**Файлы для изменения:**
- `src/features/browser/components/browser-loading-indicator.tsx`
- `src/features/browser/components/browser-content.tsx` (line 79)

**Результат:** 150 → 10 строк, упрощение UI

### Фаза 2: Виртуализация списков (День 2-3)

**Задача:** Добавить виртуализацию для рендеринга только видимых preview

**Библиотека:** `@tanstack/react-virtual` (современная, легкая)

**Установка:**
```bash
bun add @tanstack/react-virtual
```

**Реализация:**
```typescript
// src/features/browser/components/universal-list.tsx
import { useVirtualizer } from '@tanstack/react-virtual'

export function UniversalList({ items, renderItem }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Примерная высота preview
    overscan: 5, // Рендерить 5 дополнительных элементов вне viewport
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Файлы для изменения:**
- `src/features/browser/components/universal-list.tsx`

**Результат:** Только 10-20 preview в DOM вместо всех, -70% memory

### Фаза 3: Объединение провайдеров (День 3)

**Задача:** Объединить два Browser провайдера в один

**Текущее состояние:**
```
domains/browser/providers/browser-provider.tsx          ← BackendSync wrapper
features/browser/providers/browser-resources-provider.tsx ← Resources logic
```

**Целевое состояние:**
```
domains/browser/providers/browser-provider.tsx          ← Единый провайдер
```

**Действия:**
- [ ] Переместить resources logic из features → domains
- [ ] Объединить state management в одном провайдере
- [ ] Удалить `features/browser/providers/browser-resources-provider.tsx`
- [ ] Обновить импорты в компонентах

**Пример объединенного провайдера:**
```typescript
// domains/browser/providers/browser-provider.tsx
export function BrowserProvider({ children }: BrowserProviderProps) {
  const backendSync = getBackendSync()

  // Browser state (from BackendSync)
  const [browserState, setBrowserState] = useState<BrowserState | null>(null)

  // Resources state (from lazy loaders)
  const [resources, setResources] = useState<ResourcesState>({
    effects: [],
    filters: [],
    transitions: [],
  })

  // Lazy load resources в фоне
  useEffect(() => {
    const loadResources = async () => {
      const { effects, filters, transitions } = await loadAllResourcesLazy()
      setResources({ effects, filters, transitions })
    }
    loadResources()
  }, [])

  return (
    <BrowserContext.Provider value={{ browserState, resources }}>
      {children}
    </BrowserContext.Provider>
  )
}
```

**Файлы для изменения:**
- `src/domains/browser/providers/browser-provider.tsx`
- `src/features/browser/providers/browser-resources-provider.tsx` (удалить)
- Все компоненты, использующие `useEffectsProvider`

**Результат:** 1 провайдер вместо 2, чистая архитектура

### Фаза 4: Intersection Observer для lazy loading (День 4)

**Задача:** Загружать preview данные только когда они видимы

**Библиотека:** `react-intersection-observer`

**Установка:**
```bash
bun add react-intersection-observer
```

**Реализация:**
```typescript
// src/features/browser/components/preview/LazyPreview.tsx
import { useInView } from 'react-intersection-observer'

export function LazyPreview({ file, PreviewComponent }) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true, // Load только один раз
  })

  return (
    <div ref={ref} style={{ minHeight: '200px' }}>
      {inView ? (
        <PreviewComponent file={file} />
      ) : (
        <div className="preview-placeholder">
          {/* Простой placeholder */}
        </div>
      )}
    </div>
  )
}
```

**Использование:**
```typescript
// universal-list.tsx
{items.map((item, index) => (
  <LazyPreview
    key={item.id}
    file={item}
    PreviewComponent={adapter.PreviewComponent}
  />
))}
```

**Файлы для создания:**
- `src/features/browser/components/preview/LazyPreview.tsx`

**Файлы для изменения:**
- `src/features/browser/components/universal-list.tsx`
- `src/features/browser/components/content-group.tsx`

**Результат:** Не загружать невидимые preview, экономия CPU

## 🔧 Дополнительные улучшения (опционально)

### 5.1 useMemo для preview data
```typescript
const previewData = useMemo(
  () => getPreviewData(file),
  [file.id] // только id, не весь file object
)
```

### 5.2 Debounce вместо throttle для hover
```typescript
import { useDebouncedCallback } from 'use-debounce'

const debouncedHover = useDebouncedCallback(
  (time) => setHoverTime(time),
  16 // 60fps вместо 30fps
)
```

### 5.3 Blob URL cache
```typescript
const blobCache = new Map<string, string>()

const getBlobUrl = async (path: string) => {
  if (blobCache.has(path)) return blobCache.get(path)
  const url = await createBlobUrl(path)
  blobCache.set(path, url)
  return url
}
```

## 📊 Ожидаемые результаты

### До рефакторинга:
- VideoPreview: 799 строк
- AudioPreview: 384 строки
- BrowserLoadingIndicator: 150 строк
- Все preview монтируются сразу
- Memory: High
- CPU: High (logging + throttling)

### После рефакторинга:
- VideoPreview: ~400 строк (-50%)
- AudioPreview: ~200 строк (-48%)
- BrowserLoadingIndicator: ~10 строк (-93%)
- Только 10-20 preview в DOM (виртуализация)
- Memory: -70%
- CPU: -60%

## ✅ Чеклист выполнения

### Фаза 1: Preview компоненты
- [ ] Разбить VideoPreview на подкомпоненты
- [ ] Удалить logger.debugSync в production
- [ ] Заменить throttling на requestAnimationFrame
- [ ] Lazy load video streams
- [ ] Оптимизировать AudioPreview
- [ ] Создать audio-context-singleton
- [ ] Упростить BrowserLoadingIndicator

### Фаза 2: Виртуализация
- [ ] Установить @tanstack/react-virtual
- [ ] Добавить виртуализацию в UniversalList
- [ ] Тестировать с большим количеством файлов (100+)

### Фаза 3: Провайдеры
- [ ] Объединить browser-provider и browser-resources-provider
- [ ] Переместить resources logic в domains
- [ ] Обновить все импорты
- [ ] Удалить старый provider

### Фаза 4: Lazy loading
- [ ] Установить react-intersection-observer
- [ ] Создать LazyPreview wrapper
- [ ] Интегрировать с UniversalList

### Дополнительно
- [ ] Добавить useMemo для preview data
- [ ] Реализовать debounce для hover
- [ ] Создать blob URL cache

## 📝 Примечания

- Сохранить BackendSync архитектуру (НЕ полный DDD)
- Не трогать backend (src-tauri/src/state/browser.rs)
- Все изменения только во frontend
- Сохранить обратную совместимость API

## 🔗 Связанные документы

- `/docs/03_architecture/ru/backend-sync.md` - BackendSync архитектура
- `/docs/05_development/ru/component-patterns.md` - Паттерны компонентов
- `/src/features/browser/README.md` - Browser feature документация

## 📅 Timeline

- **День 1-2:** Фаза 1 (Preview компоненты)
- **День 2-3:** Фаза 2 (Виртуализация)
- **День 3:** Фаза 3 (Провайдеры)
- **День 4:** Фаза 4 (Lazy loading)
- **День 5:** Тестирование и доработки

**Общая длительность:** 5 рабочих дней
