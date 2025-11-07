# Library Mocks

Этот каталог содержит моки для внешних библиотек, используемых в Timeline Studio. Моки необходимы для изоляции тестов от внешних зависимостей и обеспечения стабильного тестового окружения.

## Структура

### `index.ts`
Главный файл экспорта всех библиотечных моков. Обеспечивает централизованный доступ к мокам библиотек.

### `i18n.ts`
Мок для системы интернационализации (i18next):
- `useTranslation` - возвращает функцию перевода и язык
- `Trans` - компонент для рендеринга переводов с поддержкой вложенных элементов
- `initReactI18next` - мок инициализации
- `I18nextProvider` - провайдер контекста i18n

**Использование:**
```typescript
import { useTranslation } from '@/test/mocks/libraries';

// В тесте
const { t } = useTranslation();
expect(t('common.save')).toBe('common.save');
```

### `lucide-react.ts`
Мок для иконок Lucide React:
- Создает простые div-элементы вместо SVG иконок
- Поддерживает все стандартные пропсы (className, size, color и т.д.)
- Автоматически генерирует моки для всех иконок

**Использование:**
```typescript
import { Play, Pause } from 'lucide-react';
// Иконки будут отрендерены как <div> с соответствующими атрибутами
```

### `next-themes.ts`
Мок для системы тем Next.js:
- `useTheme` - управление темой приложения
- `ThemeProvider` - провайдер контекста темы
- Поддержка светлой/темной/системной темы

**Использование:**
```typescript
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
setTheme('dark');
```

### `radix-ui.ts`
Моки для компонентов Radix UI:
- Диалоги, выпадающие меню, переключатели и другие UI-примитивы
- Простые div-обертки для тестирования без сложной логики Radix
- Сохранение основных пропсов и children

**Использование:**
```typescript
import * as Dialog from '@radix-ui/react-dialog';
// Компоненты Dialog будут простыми div-элементами
```

### `react-hotkeys-hook.ts`
Мок для библиотеки горячих клавиш:
- `useHotkeys` - регистрация обработчиков клавиатурных сочетаний
- Простая реализация для тестирования без реальных событий клавиатуры

**Использование:**
```typescript
import { useHotkeys } from 'react-hotkeys-hook';

useHotkeys('ctrl+s', () => logger.debugSync('Save'));
```

### `resizable.ts`
Мок для изменяемых панелей (react-resizable-panels):
- `PanelGroup`, `Panel`, `PanelResizeHandle` - компоненты для создания изменяемых областей
- Простые div-обертки с сохранением структуры

**Использование:**
```typescript
import { PanelGroup, Panel } from 'react-resizable-panels';
// Панели будут отрендерены как обычные div без функциональности изменения размера
```

## Рекомендации по использованию

1. **Импортируйте моки из централизованного места:**
   ```typescript
   import { mockLibraries } from '@/test/mocks';
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
   ```

2. **Настройте моки в beforeEach:**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

3. **Используйте type-safe моки:**
   Все моки сохраняют типы оригинальных библиотек для корректной проверки типов в тестах.

4. **Расширяйте моки при необходимости:**
   Если требуется специфическое поведение, создайте локальный мок в тесте:
   ```typescript
   vi.mocked(useTranslation).mockReturnValue({
     t: (key: string) => `translated: ${key}`,
     i18n: { language: 'ru' }
   });
   ```

## Добавление новых моков

При добавлении моков для новых библиотек:

1. Создайте файл с именем библиотеки (например, `react-query.ts`)
2. Реализуйте основные функции/компоненты библиотеки
3. Экспортируйте мок в `index.ts`
4. Добавьте документацию в этот README

## Связанные файлы

- `/src/test/setup.ts` - глобальная настройка тестов
- `/src/test/mocks/index.ts` - централизованный экспорт всех моков
- `/src/test/utils/README.md` - утилиты для тестирования