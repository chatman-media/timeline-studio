# Test Mocks System

Централизованная система моков для тестирования Timeline Studio. Эта директория содержит все необходимые моки для изоляции тестов от внешних зависимостей и обеспечения стабильной тестовой среды.

## Архитектура системы моков

```
src/test/mocks/
├── browser/          # Моки браузерных API
├── libraries/        # Моки внешних библиотек
├── tauri/           # Моки Tauri API
│   ├── api/         # Основные API функции
│   └── plugins/     # Tauri плагины
├── index.ts         # Главный экспорт и управление
├── dnd-kit.ts       # Drag and Drop моки
└── timeline-components.ts  # Моки компонентов Timeline
```

## Основные компоненты

### `index.ts` - Центр управления моками
Главный файл, объединяющий все моки и предоставляющий удобные функции для их использования:

```typescript
import { setupEssentialMocks, resetAllMocks } from '@/test/mocks';

// Инициализация всех необходимых моков
beforeEach(() => {
  setupEssentialMocks();
});

// Очистка после тестов
afterEach(() => {
  resetAllMocks();
});
```

**Ключевые функции:**
- `setupEssentialMocks()` - настройка базовых моков (Tauri, Browser API)
- `resetAllMocks()` - полная очистка состояния всех моков
- `mockTauri`, `mockBrowser`, `mockLibraries` - отдельные категории моков

### Browser Mocks (`browser/`)
Моки для Web API и браузерного окружения:
- **canvas.ts** - Canvas API для рендеринга графики
- **dom.ts** - DOM манипуляции и элементы
- **media.ts** - MediaRecorder, AudioContext, видео/аудио элементы
- **index.ts** - URL, Blob, File API и другие браузерные функции

[Подробнее в browser/README.md](./browser/README.md)

### Library Mocks (`libraries/`)
Моки для внешних npm-пакетов:
- **i18n.ts** - Интернационализация (i18next)
- **lucide-react.ts** - Иконки
- **next-themes.ts** - Управление темами
- **radix-ui.ts** - UI компоненты
- **react-hotkeys-hook.ts** - Горячие клавиши
- **resizable.ts** - Изменяемые панели

[Подробнее в libraries/README.md](./libraries/README.md)

### Tauri Mocks (`tauri/`)
Моки для десктопного API Tauri:
- **core.ts** - Основные функции (invoke, transformCallback)
- **dialog.ts** - Диалоговые окна
- **event.ts** - Система событий
- **fs.ts** - Файловая система
- **path.ts** - Работа с путями
- **store.ts** - Постоянное хранилище

[Подробнее в tauri/README.md](./tauri/README.md)

### Специализированные моки

#### `dnd-kit.ts`
Моки для drag-and-drop функциональности:
- `DndContext`, `DragOverlay` - контексты перетаскивания
- `useSensor`, `useSensors` - обработка жестов
- `useDraggable`, `useDroppable` - хуки для элементов
- `SortableContext`, `useSortable` - сортировка списков

#### `timeline-components.ts`
Моки для специфических компонентов Timeline:
- `TimelineClip` - элементы на таймлайне
- `TimelineSection` - секции таймлайна
- `ClipEditor` - редактор клипов
- `VideoPlayer` - проигрыватель видео

## Использование в тестах

### Базовая настройка
```typescript
import { render } from '@/test/test-utils';
import { setupEssentialMocks } from '@/test/mocks';

describe('MyComponent', () => {
  beforeEach(() => {
    setupEssentialMocks();
  });
  
  test('should work with mocks', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeInTheDocument();
  });
});
```

### Кастомизация моков
```typescript
import { invoke } from '@tauri-apps/api/core';
import { vi } from 'vitest';

test('should handle specific response', async () => {
  // Настройка специфического ответа
  vi.mocked(invoke).mockResolvedValueOnce({
    status: 'success',
    data: { clips: [] }
  });
  
  // Ваш тест
});
```

### Проверка вызовов
```typescript
import { open } from '@tauri-apps/plugin-dialog';

test('should open file dialog', async () => {
  await myFunction();
  
  expect(open).toHaveBeenCalledWith({
    multiple: false,
    filters: [{ name: 'Video', extensions: ['mp4', 'mov'] }]
  });
});
```

## Лучшие практики

### 1. Изоляция тестов
Каждый тест должен быть независимым:
```typescript
afterEach(() => {
  vi.clearAllMocks();
  resetAllMocks();
});
```

### 2. Реалистичные данные
Используйте моки с реалистичными значениями:
```typescript
// ✅ Хорошо
vi.mocked(readTextFile).mockResolvedValue('{"version": "1.0.0"}');

// ❌ Плохо
vi.mocked(readTextFile).mockResolvedValue('test');
```

### 3. Обработка ошибок
Тестируйте негативные сценарии:
```typescript
test('should handle file not found', async () => {
  vi.mocked(readFile).mockRejectedValue(new Error('File not found'));
  
  // Проверка обработки ошибки
});
```

### 4. Минимальная настройка
Настраивайте только необходимые моки:
```typescript
// Если тест использует только файловую систему
import { setupTauriMocks } from '@/test/mocks/tauri';
setupTauriMocks.fs();
```

## Расширение системы моков

### Добавление нового мока библиотеки
1. Создайте файл в `libraries/[library-name].ts`
2. Реализуйте основные функции библиотеки
3. Добавьте экспорт в `libraries/index.ts`
4. Обновите документацию

### Добавление нового Tauri API
1. Создайте файл в соответствующей поддиректории
2. Следуйте существующим паттернам типизации
3. Добавьте в экспорты
4. Добавьте тесты для нового мока

### Пример создания мока
```typescript
// libraries/new-library.ts
import { vi } from 'vitest';

export const useNewFeature = vi.fn(() => ({
  data: null,
  loading: false,
  error: null,
  refetch: vi.fn()
}));

export const NewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
```

## Отладка

### Проверка вызовов моков
```typescript
logger.debugSync(vi.mocked(invoke).mock.calls);
logger.debugSync(vi.mocked(open).mock.results);
```

### Сброс конкретного мока
```typescript
vi.mocked(invoke).mockReset();
vi.mocked(invoke).mockRestore();
```

### Проверка состояния моков
```typescript
import { getMockState } from '@/test/mocks';
logger.debugSync(getMockState());
```

## Связанные файлы

- `/src/test/setup.ts` - Глобальная конфигурация тестов
- `/src/test/test-utils.tsx` - Утилиты для рендеринга компонентов
- `/src/test/utils/` - Дополнительные тестовые утилиты
- `/vitest.config.ts` - Конфигурация Vitest
- `/src/test-setup.ts` - Инициализация тестовой среды

## Troubleshooting

### "Cannot find module" ошибки
Убедитесь, что путь импорта правильный:
```typescript
// ✅ Правильно
import { setupEssentialMocks } from '@/test/mocks';

// ❌ Неправильно
import { setupEssentialMocks } from '../test/mocks';
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
```

### Моки не работают
1. Проверьте, что мок настроен до использования
2. Убедитесь, что используете `vi.mocked()` для типизации
3. Проверьте, что мок экспортирован и импортирован правильно

### Конфликты моков
Если моки конфликтуют между тестами:
1. Используйте `mockReset()` вместо `mockClear()`
2. Изолируйте тесты в отдельные `describe` блоки
3. Используйте `mockImplementationOnce()` для одноразовых моков