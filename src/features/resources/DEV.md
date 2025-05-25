# Resources - Техническая документация

## 📁 Структура файлов

### ✅ Существующие файлы

```
src/features/resources/
├── resources-machine.ts ✅
├── resources-provider.tsx ✅
├── resources-machine.test.ts ✅
├── resources-provider.test.tsx ✅
└── index.ts ✅
```

### ❌ Требуется создать

```
src/features/resources/
├── components/
│   ├── resource-manager.tsx
│   ├── resource-list.tsx
│   ├── resource-item.tsx
│   ├── resource-preview.tsx
│   ├── resource-import.tsx
│   └── index.ts
├── hooks/
│   ├── use-resources.ts
│   ├── use-resource-import.ts
│   ├── use-resource-preview.ts
│   └── index.ts
└── types/
    ├── resource.ts
    └── index.ts
```

## 🔧 Машина состояний

### ResourcesMachine

**Файл**: `resources-machine.ts`
**Статус**: ✅ Полностью реализован

**Контекст**:

```typescript
interface ResourcesContext {
  effectResources: TimelineResource[];
  filterResources: TimelineResource[];
  transitionResources: TimelineResource[];
  templateResources: TimelineResource[];
  musicResources: TimelineResource[];
  subtitleResources: TimelineResource[];
  isLoading: boolean;
  error: string | null;
}
```

**События**:

```typescript
type ResourcesEvents =
  | { type: "LOAD_RESOURCES" }
  | { type: "ADD_RESOURCE"; resource: TimelineResource }
  | { type: "REMOVE_RESOURCE"; resourceId: string; category: string }
  | {
      type: "UPDATE_RESOURCE";
      resourceId: string;
      updates: Partial<TimelineResource>;
    }
  | { type: "CLEAR_RESOURCES"; category?: string }
  | { type: "IMPORT_RESOURCES"; files: File[]; category: string };
```

**Состояния**:

- `idle` - начальное состояние
- `loading` - загрузка ресурсов
- `ready` - ресурсы готовы
- `importing` - импорт новых ресурсов
- `error` - ошибка

### ResourcesProvider

**Файл**: `resources-provider.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:

- React Context для состояния ресурсов
- Интеграция с ResourcesMachine
- Предоставление хука useResources

## 🎣 Хуки

### useResources (существующий)

**Статус**: ✅ Реализован в провайдере

**Возвращает**:

```typescript
interface UseResourcesReturn {
  // Ресурсы по категориям
  effectResources: TimelineResource[];
  filterResources: TimelineResource[];
  transitionResources: TimelineResource[];
  templateResources: TimelineResource[];
  musicResources: TimelineResource[];
  subtitleResources: TimelineResource[];

  // Состояние
  isLoading: boolean;
  error: string | null;

  // Действия
  loadResources: () => void;
  addResource: (resource: TimelineResource) => void;
  removeResource: (resourceId: string, category: string) => void;
  updateResource: (
    resourceId: string,
    updates: Partial<TimelineResource>,
  ) => void;
  clearResources: (category?: string) => void;
  importResources: (files: File[], category: string) => void;
}
```

### useResourceImport (требует создания)

**Файл**: `hooks/use-resource-import.ts` ❌

```typescript
interface UseResourceImportReturn {
  importResource: (file: File, category: string) => Promise<void>;
  importProgress: number;
  isImporting: boolean;
  error: string | null;
  validateFile: (file: File, category: string) => boolean;
  getSupportedFormats: (category: string) => string[];
}
```

### useResourcePreview (требует создания)

**Файл**: `hooks/use-resource-preview.ts` ❌

```typescript
interface UseResourcePreviewReturn {
  previewResource: (resource: TimelineResource) => void;
  applyResource: (resource: TimelineResource, target: string) => void;
  previewData: any;
  isPreviewLoading: boolean;
  previewError: string | null;
}
```

## 🏗️ Компоненты (требуют создания)

### ResourceManager

**Файл**: `components/resource-manager.tsx` ❌

**Функционал**:

- Основной компонент управления ресурсами
- Табы для категорий ресурсов
- Поиск и фильтрация
- Импорт новых ресурсов

### ResourceList

**Файл**: `components/resource-list.tsx` ❌

**Функционал**:

- Отображение списка ресурсов
- Виртуализация для больших списков
- Сортировка и группировка
- Drag & drop поддержка

### ResourceItem

**Файл**: `components/resource-item.tsx` ❌

**Функционал**:

- Отображение отдельного ресурса
- Превью изображение/иконка
- Метаданные и действия
- Drag & drop источник

### ResourcePreview

**Файл**: `components/resource-preview.tsx` ❌

**Функционал**:

- Модальное окно предпросмотра
- Настройка параметров ресурса
- Применение к выбранным элементам
- Сохранение пресетов

### ResourceImport

**Файл**: `components/resource-import.tsx` ❌

**Функционал**:

- Drag & drop зона для файлов
- Выбор категории ресурса
- Прогресс импорта
- Валидация файлов

## 🔗 Интеграция с Timeline

### Текущая интеграция

**Файл**: `src/features/timeline/components/timeline-resources.tsx`

```typescript
const {
  effectResources,
  filterResources,
  transitionResources,
  templateResources,
  musicResources,
  subtitleResources,
} = useResources();
```

**Функционал**:

- Отображение ресурсов по категориям
- Счетчики количества ресурсов
- Иконки для каждого типа
- Прокрутка и группировка

### Требуемые улучшения

- [ ] Drag & drop из ресурсов на треки
- [ ] Контекстные меню для ресурсов
- [ ] Быстрое применение эффектов
- [ ] Предпросмотр при наведении

## 📦 Типы данных

### TimelineResource (основной тип)

```typescript
interface TimelineResource {
  id: string;
  name: string;
  type: "effect" | "filter" | "transition" | "template" | "music" | "subtitle";
  category?: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}
```

### ResourceCategory (требует создания)

```typescript
interface ResourceCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  supportedFormats: string[];
  maxFileSize: number;
  description: string;
}
```

### ResourceImportOptions (требует создания)

```typescript
interface ResourceImportOptions {
  category: string;
  generateThumbnail: boolean;
  extractMetadata: boolean;
  validateFormat: boolean;
  overwriteExisting: boolean;
}
```

## 🧪 Тестирование

### ✅ Существующие тесты

- [x] ResourcesMachine - переходы состояний, события
- [x] ResourcesProvider - интеграция с контекстом
- [x] Логика управления ресурсами

### ❌ Требуют создания

- [ ] Тесты компонентов
- [ ] Тесты хуков импорта и предпросмотра
- [ ] Интеграционные тесты с Timeline
- [ ] E2E тесты drag & drop

### Стратегия тестирования

```typescript
// Тест импорта ресурса
it("should import resource successfully", async () => {
  const file = new File([""], "effect.json", { type: "application/json" });
  await act(async () => {
    importResources([file], "effects");
  });
  expect(effectResources).toHaveLength(1);
});

// Тест применения ресурса
it("should apply resource to timeline element", () => {
  const resource = { id: "1", name: "Blur", type: "effect" };
  const target = "clip-123";
  applyResource(resource, target);
  expect(mockTimelineService.applyEffect).toHaveBeenCalledWith(
    resource,
    target,
  );
});
```

## 🚀 Производительность

### Оптимизации (требуют реализации)

- [ ] Виртуализация списков ресурсов
- [ ] Ленивая загрузка превью
- [ ] Кэширование метаданных
- [ ] Дебаунсинг поиска

### Метрики производительности

```typescript
const PERFORMANCE_TARGETS = {
  resourceLoadTime: 500, // ms
  searchResponseTime: 100, // ms
  previewLoadTime: 200, // ms
  dragDropLatency: 16, // ms (60 FPS)
};
```

## 🔧 Конфигурация

### Категории ресурсов

```typescript
const RESOURCE_CATEGORIES = {
  effects: {
    name: "Effects",
    icon: Package,
    formats: [".json", ".js"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  filters: {
    name: "Filters",
    icon: Palette,
    formats: [".json", ".lut"],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  transitions: {
    name: "Transitions",
    icon: Scissors,
    formats: [".json", ".mp4"],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  // ... другие категории
};
```

### Настройки импорта

```typescript
const IMPORT_SETTINGS = {
  generateThumbnails: true,
  extractMetadata: true,
  validateFormats: true,
  maxConcurrentImports: 5,
  thumbnailSize: { width: 150, height: 100 },
};
```

## 📈 План реализации

### Этап 1: Базовые компоненты

1. Создать ResourceManager компонент
2. Реализовать ResourceList с базовым отображением
3. Добавить ResourceItem для отдельных элементов

### Этап 2: Импорт и управление

1. Создать ResourceImport компонент
2. Реализовать useResourceImport хук
3. Добавить валидацию и обработку файлов

### Этап 3: Предпросмотр и применение

1. Создать ResourcePreview компонент
2. Реализовать useResourcePreview хук
3. Интегрировать с Timeline для применения

### Этап 4: Drag & Drop

1. Добавить drag & drop поддержку
2. Интегрировать с Timeline компонентами
3. Реализовать визуальную обратную связь

## 🎯 Приоритеты

### Критический приоритет

1. Создание базовых компонентов
2. Импорт ресурсов
3. Интеграция с Timeline

### Высокий приоритет

1. Drag & drop функционал
2. Предпросмотр ресурсов
3. Поиск и фильтрация

### Средний приоритет

1. Продвинутые настройки
2. Пресеты и конфигурации
3. Оптимизация производительности
