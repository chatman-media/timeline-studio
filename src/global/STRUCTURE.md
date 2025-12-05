# Global Layer - Структура и использование

## 📁 Актуальная структура

```
src/global/
│
├── 📄 README.md              Полная документация
├── 📄 STRUCTURE.md           Эта структура (краткая справка)
├── 📄 index.ts               Пустой! Без экспортов
│
├── 📂 types/                 Глобальные type declarations
│   ├── window.d.ts          Window, APP_ENV, __TAURI__
│   └── vitest.d.ts          Testing Library matchers
│
├── 📂 styles/                Глобальные CSS
│   └── variables.css        Базовые CSS переменные
│
└── 📂 setup/                 Инициализация
    └── polyfills.ts         Polyfills и shims
```

## 🎯 Как работает

### Типы (автоматически через tsconfig)

```ts
// ❌ НЕ нужно импортировать!
// import { Window } from '@/global/types/window'

// ✅ Используй напрямую - доступно глобально
if (window.__TAURI_INTERNALS__) {
  // TypeScript знает о типах автоматически
}
```

### CSS переменные (подключены в layout.tsx)

```css
/* ❌ НЕ нужно импортировать! */
/* @import '@/global/styles/variables.css'; */

/* ✅ Используй напрямую - доступно глобально */
.my-class {
  transition: var(--transition-duration);
  z-index: var(--z-modal);
}
```

### Polyfills (выполняются при старте)

```ts
// ❌ НЕ нужно импортировать в компонентах!
// import '@/global/setup/polyfills'

// ✅ Уже выполнено при старте приложения
// Просто используй API:
requestIdleCallback(() => {
  // Polyfill сработает автоматически если нужно
})
```

## ⚠️ Критические правила

### НЕ добавляйте в Global:

```ts
// ❌ Утилиты
export const isTauri = () => !!window.__TAURI__
// → Переместите в /src/lib/environment.ts

// ❌ Хуки
export const useIsTauri = () => { ... }
// → Переместите в /src/hooks/use-is-tauri.ts

// ❌ Компоненты
export const TauriProvider = () => { ... }
// → Переместите в /src/components/ или /src/test/providers/

// ❌ Константы для импорта
export const CONFIG = { ... }
// → Переместите в /src/lib/config.ts
```

### Добавляйте в Global только:

```ts
// ✅ Глобальные типы
declare global {
  interface Window {
    myCustomAPI?: MyAPI
  }
}

// ✅ CSS переменные
:root {
  --my-variable: value;
}

// ✅ Polyfills
if (!window.someAPI) {
  window.someAPI = polyfillImplementation
}
```

## 🔍 Как добавить новое

### 1. Добавить глобальный тип

Файл: `src/global/types/window.d.ts`
```ts
declare global {
  interface Window {
    myNewAPI?: {
      doSomething(): void
    }
  }
}

export {}
```

Использование (без импорта):
```ts
window.myNewAPI?.doSomething()
```

### 2. Добавить CSS переменную

Файл: `src/global/styles/variables.css`
```css
:root {
  --my-new-color: #ff0000;
}
```

Использование (без импорта):
```css
.my-class {
  color: var(--my-new-color);
}
```

### 3. Добавить polyfill

Файл: `src/global/setup/polyfills.ts`
```ts
if (typeof window !== "undefined" && !window.myAPI) {
  window.myAPI = {
    // polyfill implementation
  }
}
```

## 📚 См. также

- `README.md` - полная документация
- `/docs/03_architecture/feod-global-layer.md` - архитектурное решение
- [FEOD статья](https://habr.com/ru/companies/sportmaster_lab/articles/972410/)
