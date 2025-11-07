# Tauri API Mocks

Этот каталог содержит моки для основных API функций Tauri, предоставляющих информацию о приложении и системе.

## Структура

### `app.ts`
Мок для API приложения, предоставляющий информацию о версии и метаданных Timeline Studio.

**Экспортируемые функции:**

- `getVersion()` - возвращает версию приложения
  - По умолчанию: `'1.0.0'`
  - Используется для отображения версии в UI и проверки обновлений

- `getName()` - возвращает имя приложения
  - По умолчанию: `'Timeline Studio'`
  - Используется в заголовках и метаданных

- `getTauriVersion()` - возвращает версию Tauri runtime
  - По умолчанию: `'2.0.0'`
  - Используется для диагностики и совместимости

**Использование в тестах:**
```typescript
import { getVersion, getName } from '@tauri-apps/api/app';

test('should display app version', async () => {
  const version = await getVersion();
  expect(version).toBe('1.0.0');
});
```

**Кастомизация для специфических тестов:**
```typescript
import { getVersion } from '@tauri-apps/api/app';
import { vi } from 'vitest';
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

// Изменение версии для теста обновлений
vi.mocked(getVersion).mockResolvedValueOnce('0.9.0');
```

## Расширение API моков

При добавлении новых API функций:

1. Создайте новый файл в этой директории (например, `window.ts`)
2. Реализуйте функции с реалистичными значениями по умолчанию
3. Экспортируйте функции с правильной типизацией
4. Добавьте импорт в родительский `index.ts`
5. Обновите эту документацию

## Примеры расширения

### Добавление window API:
```typescript
// window.ts
export async function getCurrent() {
  return {
    label: 'main',
    setTitle: vi.fn(),
    center: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn()
  };
}

export async function getAll() {
  return [await getCurrent()];
}
```

### Добавление process API:
```typescript
// process.ts
export async function exit(code: number = 0) {
  logger.debugSync(`Mock: Exiting with code ${code}`);
}

export async function relaunch() {
  logger.debugSync('Mock: Relaunching application');
}
```

## Тестирование с API моками

### Проверка вызовов
```typescript
test('should get app metadata', async () => {
  const name = await getName();
  const version = await getVersion();
  
  expect(name).toBe('Timeline Studio');
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});
```

### Эмуляция разных версий
```typescript
test('should handle version mismatch', async () => {
  vi.mocked(getTauriVersion).mockResolvedValueOnce('1.0.0');
  
  // Тест обработки старой версии Tauri
});
```

## Связанные файлы

- `/src-tauri/src/main.rs` - реальная реализация API
- `/src/test/mocks/tauri/index.ts` - главный экспорт Tauri моков
- `/src/lib/tauri/app.ts` - обертки для app API