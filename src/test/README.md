# Test Infrastructure

Инфраструктура тестирования Timeline Studio, обеспечивающая надежное и эффективное тестирование всех компонентов приложения.

## Архитектура тестовой системы

```
src/test/
├── mocks/              # Централизованная система моков
│   ├── browser/        # Моки браузерных API
│   ├── libraries/      # Моки внешних библиотек
│   └── tauri/          # Моки Tauri API
├── utils/              # Утилиты для тестирования
├── setup.ts            # Глобальная настройка тестов
├── test-utils.tsx      # Утилиты для рендеринга компонентов
└── README.md           # Эта документация
```

## Основные компоненты

### `setup.ts` - Глобальная конфигурация
Файл инициализации тестовой среды, который выполняется перед всеми тестами:

**Ключевые функции:**
- Настройка Jest DOM матчеров (`@testing-library/jest-dom`)
- Конфигурация глобальных моков
- Настройка cleanup между тестами
- Мокирование провайдеров (UserSettings, Modals, AppState)
- Конфигурация console методов для тестовой среды

**Автоматически мокируемые модули:**
- `@/features/user-settings/providers/user-settings-provider`
- `@/features/modals/providers/modal-provider`
- `@/features/app-state/app-state-provider`

### `test-utils.tsx` - Утилиты рендеринга
Кастомные функции рендеринга с предустановленными провайдерами:

```typescript
import { render } from '@/test/test-utils';

// Автоматически оборачивает компонент в необходимые провайдеры
const { getByText } = render(<MyComponent />);
```

**Включенные провайдеры:**
- `AppStateProvider` - глобальное состояние приложения
- `ThemeProvider` - управление темами
- `I18nextProvider` - интернационализация
- `ModalProvider` - система модальных окон
- `UserSettingsProvider` - пользовательские настройки

### `mocks/` - Система моков
Централизованное хранилище всех моков для изоляции тестов:

- **Browser API** - Canvas, DOM, Media, File/Blob
- **Libraries** - i18n, UI библиотеки, утилиты
- **Tauri API** - Файловая система, диалоги, события

[Подробнее в mocks/README.md](./mocks/README.md)

### `utils/` - Специализированные утилиты
Вспомогательные функции и утилиты для специфических тестовых сценариев:

- Утилиты для тестирования аудио компонентов
- Генераторы тестовых данных
- Хелперы для асинхронных операций
- Утилиты для тестирования Tauri интеграций

[Подробнее в utils/README.md](./utils/README.md)

## Использование

### Базовая настройка теста
```typescript
import { render, screen } from '@/test/test-utils';
import { setupEssentialMocks } from '@/test/mocks';

describe('MyComponent', () => {
  beforeEach(() => {
    setupEssentialMocks();
  });

  test('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Тестирование с кастомными провайдерами
```typescript
import { render } from '@/test/test-utils';

test('with custom theme', () => {
  render(<MyComponent />, {
    themeProps: { defaultTheme: 'dark' }
  });
});
```

### Тестирование асинхронных операций
```typescript
import { waitFor } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';

test('async data loading', async () => {
  vi.mocked(invoke).mockResolvedValue({ data: 'test' });
  
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

## Конфигурация

### Vitest Configuration
Проект использует Vitest для запуска тестов. Конфигурация находится в `/vitest.config.ts`:

```typescript
{
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
}
```

### TypeScript для тестов
Типы для тестовых утилит автоматически доступны через:
- `@testing-library/react`
- `@testing-library/jest-dom`
- `vitest`

## Лучшие практики

### 1. Изоляция тестов
```typescript
afterEach(() => {
  vi.clearAllMocks();
  cleanup(); // автоматически вызывается test-utils
});
```

### 2. Использование data-testid
```tsx
// В компоненте
<button data-testid="save-button">Save</button>

// В тесте
const button = screen.getByTestId('save-button');
```

### 3. Тестирование пользовательских сценариев
```typescript
import { userEvent } from '@testing-library/user-event';

test('user interaction', async () => {
  const user = userEvent.setup();
  render(<Form />);
  
  await user.type(screen.getByLabelText('Name'), 'John');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
});
```

### 4. Мокирование Tauri команд
```typescript
import { invoke } from '@tauri-apps/api/core';

beforeEach(() => {
  vi.mocked(invoke).mockImplementation(async (cmd) => {
    switch (cmd) {
      case 'get_user_data':
        return { name: 'Test User' };
      default:
        return null;
    }
  });
});
```

## Отладка тестов

### Debug вывод
```typescript
import { debug } from '@testing-library/react';

test('debug output', () => {
  const { container } = render(<MyComponent />);
  debug(container); // Выводит HTML в консоль
});
```

### Снимки состояния
```typescript
import { logRoles } from '@testing-library/react';
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

test('accessibility', () => {
  const { container } = render(<MyComponent />);
  logRoles(container); // Показывает ARIA роли
});
```

### Проверка моков
```typescript
logger.debugSync(vi.mocked(invoke).mock.calls);
logger.debugSync(vi.mocked(invoke).mock.results);
```

## Расширение тестовой инфраструктуры

### Добавление нового провайдера в test-utils
```typescript
// В test-utils.tsx
export function renderWithNewProvider(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  return render(
    <NewProvider>
      {ui}
    </NewProvider>,
    options
  );
}
```

### Создание кастомных матчеров
```typescript
// В setup.ts
expect.extend({
  toBeValidTimecode(received: string) {
    const pass = /^\d{2}:\d{2}:\d{2}:\d{2}$/.test(received);
    return {
      pass,
      message: () => `expected ${received} to be valid timecode`
    };
  }
});
```

### Добавление глобальных утилит
```typescript
// В setup.ts
global.createMockMediaFile = () => ({
  path: '/test/video.mp4',
  name: 'video.mp4',
  size: 1024 * 1024,
  duration: 60
});
```

## Команды для запуска тестов

```bash
# Запуск всех тестов
bun run test

# Запуск в режиме наблюдения
bun run test:watch

# Запуск с покрытием
bun run test:coverage

# Запуск конкретного файла
bun run test src/features/timeline/__tests__/use-timeline.test.ts

# Запуск тестов по паттерну
bun run test --grep "timeline"

# Запуск только измененных тестов
bun run test --changed
```

## Troubleshooting

### "Cannot find module" ошибки
Проверьте алиасы путей в `tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/test/*": ["./src/test/*"]
  }
}
```

### Тесты падают с "Not wrapped in act(...)"
Используйте `waitFor` для асинхронных обновлений:
```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Моки не сбрасываются между тестами
Убедитесь, что вызываете `vi.clearAllMocks()` в `afterEach`.

### Timeout в тестах
Увеличьте timeout для медленных операций:
```typescript
test('slow operation', async () => {
  // тест
}, 10000); // 10 секунд
```

## Связанные ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)

## Примеры тестов

Примеры хорошо написанных тестов можно найти в:
- `/src/features/timeline/__tests__/` - тесты Timeline функциональности
- `/src/features/smart-montage-planner/__tests__/` - тесты AI планировщика
- `/src/features/video-player/__tests__/` - тесты видео плеера