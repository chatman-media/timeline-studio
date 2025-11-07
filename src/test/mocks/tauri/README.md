# Tauri Mocks

Этот каталог содержит моки для Tauri API - основного интерфейса взаимодействия между фронтендом и нативными функциями операционной системы в Timeline Studio.

## Структура

### `index.ts`
Главный файл, экспортирующий все Tauri моки и предоставляющий функции для их настройки и сброса.

**Ключевые функции:**
- `setupTauriMocks()` - инициализация всех Tauri моков
- `resetTauriMocks()` - сброс состояния моков
- Экспорт всех подмодулей Tauri

### `core.ts`
Основные функции Tauri для вызова команд бэкенда:
- `invoke` - вызов Rust-команд с типизированными параметрами
- `transformCallback` - трансформация callback-функций
- `Channel` - класс для создания каналов связи с бэкендом

**Использование:**
```typescript
import { invoke } from '@tauri-apps/api/core';

// Мок автоматически вернет успешный результат
const result = await invoke('get_project_data', { id: '123' });
```

### `dialog.ts`
Моки для диалоговых окон:
- `open` - диалог выбора файлов/папок
- `save` - диалог сохранения файла
- `message` - показ сообщений пользователю
- `ask` - диалог с вопросом да/нет
- `confirm` - диалог подтверждения

**Использование:**
```typescript
import { open } from '@tauri-apps/plugin-dialog';

// Мок вернет предопределенный путь
const files = await open({
  multiple: true,
  filters: [{ name: 'Video', extensions: ['mp4', 'mov'] }]
});
```

### `event.ts`
Система событий Tauri:
- `emit` - отправка событий
- `listen` - подписка на события
- `once` - одноразовая подписка
- `TauriEvent` - перечисление системных событий

**Использование:**
```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('file-drop', (event) => {
  logger.debugSync('Files dropped:', event.payload);
});
```

### `fs.ts`
Файловая система:
- `readTextFile` - чтение текстовых файлов
- `readFile` - чтение бинарных файлов
- `writeTextFile` - запись текстовых файлов
- `writeFile` - запись бинарных файлов
- `exists` - проверка существования файла
- `createDir` - создание директории
- `readDir` - чтение содержимого директории
- `removeFile` - удаление файла
- `removeDir` - удаление директории
- `copyFile` - копирование файла
- `renameFile` - переименование/перемещение файла

**Использование:**
```typescript
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

const content = await readTextFile('config.json', {
  baseDir: BaseDirectory.AppConfig
});
```

### `path.ts`
Работа с путями:
- `join` - объединение путей
- `resolve` - разрешение относительных путей
- `basename` - получение имени файла
- `dirname` - получение директории
- `extname` - получение расширения
- Функции для получения системных директорий (appConfigDir, appDataDir и т.д.)

**Использование:**
```typescript
import { join, appDataDir } from '@tauri-apps/api/path';

const configPath = await join(await appDataDir(), 'settings.json');
```

### `store.ts`
Постоянное хранилище данных:
- `Store` - класс для работы с key-value хранилищем
- Методы: `get`, `set`, `delete`, `has`, `clear`, `save`
- Автоматическая синхронизация с диском

**Использование:**
```typescript
import { Store } from '@tauri-apps/plugin-store';

const store = new Store('settings.json');
await store.set('theme', 'dark');
const theme = await store.get('theme');
```

### Подкаталоги

#### `api/`
Дополнительные API функции:
- `app.ts` - информация о приложении (версия, имя)

#### `plugins/`
Моки для Tauri плагинов:
- `os.ts` - информация об операционной системе

## Настройка моков в тестах

### Базовая настройка
```typescript
import { setupTauriMocks, resetTauriMocks } from '@/test/mocks';

beforeEach(() => {
  setupTauriMocks();
});

afterEach(() => {
  resetTauriMocks();
});
```

### Кастомизация поведения
```typescript
import { invoke } from '@tauri-apps/api/core';
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

// Настройка специфического ответа
vi.mocked(invoke).mockImplementation(async (cmd, args) => {
  if (cmd === 'get_timeline_data') {
    return { clips: [], duration: 0 };
  }
  return null;
});
```

### Эмуляция ошибок
```typescript
vi.mocked(invoke).mockRejectedValueOnce(new Error('Backend error'));
```

## Рекомендации

1. **Используйте предопределенные значения:**
   Моки возвращают реалистичные значения по умолчанию (например, пути к файлам)

2. **Тестируйте обработку ошибок:**
   Настраивайте моки для возврата ошибок и проверяйте корректную обработку

3. **Изолируйте тесты:**
   Каждый тест должен настраивать только необходимые ему моки

4. **Проверяйте вызовы:**
   ```typescript
   expect(invoke).toHaveBeenCalledWith('save_project', {
     path: '/path/to/project.tlp'
   });
   ```

## Связанные файлы

- `/src-tauri/` - реальная реализация Tauri команд на Rust
- `/src/lib/tauri/` - обертки и утилиты для работы с Tauri
- `/src/test/setup.ts` - глобальная конфигурация тестов