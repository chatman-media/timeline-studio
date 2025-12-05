# Global Layer (FEOD Architecture)

**Уровень Global** содержит код, который доступен везде БЕЗ прямого импорта.

## 🚫 Критическое правило

**НИЧЕГО из этой папки НЕ импортируется напрямую!**

```ts
// ❌ НЕПРАВИЛЬНО - нельзя импортировать из global
import { something } from '@/global'
import { SomeComponent } from '@/global/components'

// ✅ ПРАВИЛЬНО - global работает через side-effects
// Типы доступны автоматически через tsconfig
// CSS подключается один раз в root layout
// Polyfills выполняются при инициализации
```

## 📁 Структура

```
/src/global/
├── README.md           # Эта документация
├── types/              # Глобальные type declarations (.d.ts)
│   ├── window.d.ts     # Расширения Window, global scope
│   ├── vitest.d.ts     # Расширения для тестов
│   └── tauri.d.ts      # Типы Tauri API
├── styles/             # Глобальные CSS (подключаются в layout)
│   └── variables.css   # CSS переменные
└── setup/              # Инициализация и polyfills
    └── polyfills.ts    # Polyfills и shims
```

## 🎯 Что здесь должно быть

### Types (`/types/`)
- Расширения глобальных интерфейсов (`Window`, `Navigator`, и т.д.)
- Type declarations для библиотек без типов
- Расширения для тестовых утилит
- Подключаются через `tsconfig.json`

### Styles (`/styles/`)
- CSS переменные (theme tokens)
- CSS reset/normalize
- Глобальные @font-face
- Подключаются ОДИН раз в root layout

### Setup (`/setup/`)
- Polyfills для старых браузеров
- Shims для отсутствующих API
- Environment initialization
- Выполняются при старте приложения

## ❌ Что НЕ должно быть здесь

- **React компоненты** → переместите в `/src/components/ui/` (Common)
- **Утилиты с экспортами** → переместите в `/src/lib/` (Common)
- **Бизнес-логика** → переместите в `/src/features/` (Modules)
- **Хуки** → переместите в `/src/hooks/` (Common)

## 🔧 Как подключить

### Типы (автоматически через tsconfig)
```json
// tsconfig.json
{
  "include": [
    "src/global/types/**/*.d.ts"
  ]
}
```

### Стили (один раз в root layout)
```tsx
// src/app/layout.tsx
import '@/global/styles/variables.css'
```

### Setup/Polyfills (при инициализации)
```tsx
// src/app/layout.tsx или _app.tsx
import '@/global/setup/polyfills'
```

## 📚 Примеры

### ✅ Правильное использование

**Global type declaration:**
```ts
// src/global/types/window.d.ts
declare global {
  interface Window {
    __TAURI__?: TauriAPI
  }
}

export {} // делает файл модулем
```

**Использование в коде (без импорта):**
```ts
// src/features/timeline/components/player.tsx
// Типы доступны автоматически!
if (window.__TAURI__) {
  // TypeScript знает о __TAURI__ без импорта
}
```

### ❌ Неправильное использование

```ts
// ❌ НЕ создавайте экспорты в global
export const isTauri = () => !!window.__TAURI__
export const config = { ... }
export function helper() { ... }

// ✅ Переместите в Common
// src/lib/environment.ts
export const isTauri = () => !!window.__TAURI__
```

## 🔄 Миграция существующего кода

Если вы нашли код в `/src/global/` который импортируется:

1. **Проверьте** - это действительно глобальное?
   - Глобальный тип? → Оставьте в `/global/types/`
   - Утилита? → Переместите в `/src/lib/`
   - Компонент? → Переместите в `/src/components/`
   - Хук? → Переместите в `/src/hooks/`

2. **Удалите экспорты** из `/src/global/index.ts`

3. **Обновите импорты** в остальном коде

## 📖 Дополнительно

По концепции FEOD (Fractal Entity Oriental Design):
- Global - самый нижний уровень
- Не импортируется никем
- Работает через побочные эффекты
- Делает код доступным глобально без явных зависимостей

См. статью: https://habr.com/ru/companies/sportmaster_lab/articles/972410/
