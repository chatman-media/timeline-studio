# FEOD Global Layer Implementation

**Дата:** 2025-12-05
**Статус:** Внедрено

## Обзор

Внедрение уровня Global из архитектурного подхода FEOD (Fractal Entity Oriental Design) для Timeline Studio.

## Что такое Global Layer

Global Layer - это самый нижний уровень в иерархии FEOD:
- Содержит код, доступный везде БЕЗ прямого импорта
- Работает через side-effects (побочные эффекты)
- НИКОГДА не экспортирует функции или компоненты для импорта
- Включает: type declarations, CSS переменные, polyfills

## Структура `/src/global/`

```
/src/global/
├── README.md                # Документация уровня
├── index.ts                 # Пустой файл (без экспортов!)
├── types/                   # Глобальные type declarations
│   ├── window.d.ts         # Расширения Window, глобальные переменные
│   └── vitest.d.ts         # Расширения для тестов
├── styles/                  # Глобальные CSS
│   └── variables.css       # CSS переменные
└── setup/                   # Инициализация
    └── polyfills.ts        # Polyfills и shims
```

## Подключение компонентов

### 1. Type Declarations (автоматически)

Типы подключаются через `tsconfig.json`:
```json
{
  "include": [
    "**/*.ts",
    "**/*.tsx"
  ]
}
```

Все `.d.ts` файлы в `/src/global/types/` автоматически доступны во всём проекте:

```ts
// ✅ Используем БЕЗ импорта - типы доступны глобально
if (window.__TAURI_INTERNALS__) {
  // TypeScript знает о __TAURI_INTERNALS__ автоматически
}

const env = APP_ENV.openaiApiKey // Типы известны
```

### 2. CSS Variables (через layout)

CSS переменные подключаются один раз в `src/app/layout.tsx`:
```tsx
import "@/global/styles/variables.css"
import "@/styles/globals.css"
```

Теперь доступны везде:
```css
.my-component {
  /* ✅ Используем БЕЗ импорта */
  transition: all var(--transition-duration) var(--transition-timing);
  backdrop-filter: blur(var(--effects-blur-max));
}
```

### 3. Polyfills (опционально, при необходимости)

Если требуются polyfills, подключите в layout:
```tsx
import "@/global/setup/polyfills"
```

## Что было перемещено

### Из `/src/types/` → `/src/global/types/`
- ✅ `vitest.d.ts` - глобальные расширения для тестов
- ✅ `tauri.d.ts` → объединено в `window.d.ts` - расширения Window

### Из `/src/global/` → `/src/test/providers/`
- ✅ `tauri-mock-provider.tsx` - это НЕ Global (импортируется!)

### Новые файлы
- ✅ `window.d.ts` - глобальные type declarations
- ✅ `variables.css` - базовые CSS переменные
- ✅ `polyfills.ts` - примеры polyfills
- ✅ `README.md` - документация уровня

## Критические правила

### ❌ НЕ делайте этого:

```ts
// ❌ НЕПРАВИЛЬНО - экспорты из Global
export const isTauri = () => !!window.__TAURI__
export const config = { ... }
export function helper() { ... }
export const MyComponent = () => <div />
```

### ✅ Делайте это вместо:

```ts
// ✅ ПРАВИЛЬНО - глобальные типы
declare global {
  interface Window {
    __TAURI__?: any
  }
}

export {} // делает файл модулем
```

Если нужен экспорт - это НЕ Global:
- Утилиты → `/src/lib/` (Common layer)
- Компоненты → `/src/components/` (Common layer)
- Хуки → `/src/hooks/` (Common layer)

## Преимущества

1. **Чёткая архитектура** - понятно что глобальное, а что нет
2. **Нет циклических зависимостей** - Global никого не импортирует
3. **Улучшенный DX** - типы доступны автоматически
4. **Лучший tree-shaking** - меньше лишних импортов
5. **Соответствие FEOD** - следование индустриальным практикам

## Миграция существующего кода

При обнаружении кода в `/src/global/` который экспортируется:

1. **Проверьте** - это действительно глобальное?
   - Глобальный тип → `/src/global/types/`
   - Утилита → `/src/lib/`
   - Компонент → `/src/components/`
   - Хук → `/src/hooks/`

2. **Переместите** файл в правильное место

3. **Обновите импорты** в остальном коде

## Дополнительные материалы

- [Статья о FEOD](https://habr.com/ru/companies/sportmaster_lab/articles/972410/)
- `/src/global/README.md` - подробная документация
- `/docs/03_architecture/overview.md` - общая архитектура

## Проверка внедрения

```bash
# 1. Проверить структуру
ls -R src/global/

# 2. Проверить что нет импортов из global (кроме CSS в layout)
grep -r "from.*@/global" src/ --include="*.ts" --include="*.tsx"

# 3. Запустить тесты
bun run test

# 4. Собрать проект
bun run build
```

Все проверки должны пройти успешно.

## Следующие шаги

По концепции FEOD следующие уровни для внедрения:
1. ✅ **Global** - реализовано
2. **Common** - переиспользуемые компоненты без бизнес-логики
3. **Modules** - изоляция бизнес-логики через публичные API
4. **Pages** - композиция из модулей
5. **App** - конфигурация приложения

См. задачу в `/docs/08_tasks/` для планирования следующих уровней.
