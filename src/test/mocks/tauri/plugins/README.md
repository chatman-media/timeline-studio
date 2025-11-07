# Tauri Plugins Mocks

Этот каталог содержит моки для плагинов Tauri, расширяющих функциональность приложения через нативные возможности операционной системы.

## Структура

### `os.ts`
Мок для плагина операционной системы, предоставляющий информацию о платформе и окружении.

**Экспортируемые функции и константы:**

- `platform()` - возвращает текущую платформу
  - По умолчанию: `'darwin'` (macOS)
  - Возможные значения: `'darwin'`, `'windows'`, `'linux'`
  - Используется для платформо-зависимой логики

- `version()` - возвращает версию операционной системы
  - По умолчанию: `'14.0.0'`
  - Формат зависит от платформы

- `arch()` - возвращает архитектуру процессора
  - По умолчанию: `'aarch64'` (Apple Silicon)
  - Возможные значения: `'x86_64'`, `'aarch64'`, `'arm'`

- `type()` - возвращает тип операционной системы
  - По умолчанию: `'Darwin'`
  - Значения: `'Darwin'`, `'Windows_NT'`, `'Linux'`

- `hostname()` - возвращает имя хоста
  - По умолчанию: `'test-machine'`

- `locale()` - возвращает текущую локаль системы
  - По умолчанию: `'en-US'`
  - Используется для автоопределения языка

**Использование в тестах:**
```typescript
import { platform, arch, locale } from '@tauri-apps/plugin-os';

test('should detect platform', async () => {
  const currentPlatform = await platform();
  expect(['darwin', 'windows', 'linux']).toContain(currentPlatform);
});

test('should get system locale', async () => {
  const systemLocale = await locale();
  expect(systemLocale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
});
```

**Кастомизация для тестирования разных платформ:**
```typescript
import { platform } from '@tauri-apps/plugin-os';
import { vi } from 'vitest';

// Тестирование Windows-специфичной логики
vi.mocked(platform).mockResolvedValueOnce('windows');

// Тестирование Linux-специфичной логики
vi.mocked(platform).mockResolvedValueOnce('linux');
```

## Расширение плагинов

При добавлении новых плагинов:

1. Создайте новый файл в этой директории (например, `notification.ts`)
2. Реализуйте API плагина с моками
3. Добавьте экспорт в родительский файл
4. Обновите документацию

### Пример: Добавление плагина уведомлений
```typescript
// notification.ts
export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
}

export async function sendNotification(options: NotificationOptions) {
  logger.debugSync('Mock notification:', options);
  return { id: Math.random().toString() };
}

export async function requestPermission() {
  return 'granted';
}

export async function isPermissionGranted() {
  return true;
}
```

### Пример: Добавление плагина shell
```typescript
// shell.ts
export async function open(url: string) {
  logger.debugSync('Mock: Opening URL:', url);
  return true;
}

export async function execute(command: string, args?: string[]) {
  logger.debugSync('Mock: Executing command:', command, args);
  return {
    code: 0,
    stdout: 'Mock output',
    stderr: ''
  };
}
```

## Тестирование с плагинами

### Проверка платформо-зависимой логики
```typescript
import { platform, arch } from '@tauri-apps/plugin-os';

describe('Platform specific features', () => {
  test('should use Metal on macOS ARM', async () => {
    vi.mocked(platform).mockResolvedValue('darwin');
    vi.mocked(arch).mockResolvedValue('aarch64');
    
    // Тест функциональности Metal
  });
  
  test('should use DirectX on Windows', async () => {
    vi.mocked(platform).mockResolvedValue('windows');
    
    // Тест функциональности DirectX
  });
});
```

### Проверка локализации
```typescript
import { locale } from '@tauri-apps/plugin-os';
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

test('should auto-detect Russian locale', async () => {
  vi.mocked(locale).mockResolvedValue('ru-RU');
  
  // Проверка автоматического выбора русского языка
});
```

## Рекомендации

1. **Используйте реалистичные значения по умолчанию**
   - Моки возвращают типичные значения для macOS/Apple Silicon

2. **Тестируйте все платформы**
   - Настраивайте моки для проверки логики на разных ОС

3. **Учитывайте особенности платформ**
   - Windows: обратные слеши в путях
   - Linux: case-sensitive файловая система
   - macOS: специфичные медиа-кодеки

4. **Проверяйте edge cases**
   - Неизвестные платформы
   - Старые версии ОС
   - Необычные локали

## Связанные файлы

- `/src-tauri/Cargo.toml` - конфигурация Tauri плагинов
- `/src/lib/platform.ts` - утилиты для работы с платформами
- `/src/test/mocks/tauri/index.ts` - главный экспорт моков