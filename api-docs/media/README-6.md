# 05. Руководство разработчика

[← Назад к оглавлению](../README.md)

## 📋 Содержание

- [Настройка окружения](setup.md)
- [Стандарты кодирования](coding-standards.md)
- [Тестирование](testing.md)
- [Команды разработки](development-commands.md) ⭐ **Полный справочник команд**
- [Справочник package.json](package-scripts-reference.md) 📋 **Все 48 команд с описанием**
- [Линтинг и форматирование](linting-and-formatting.md) ⭐ **Инструменты качества кода**
- [Внесение изменений](contributing.md)

## 🎯 Для кого это руководство

Это руководство предназначено для:
- Разработчиков, работающих над Timeline Studio
- Контрибьюторов open-source сообщества
- Тех, кто хочет расширить функциональность

## 🚀 Быстрый старт разработчика

### 1. Настройка окружения

```bash
# Клонирование и настройка
git clone https://github.com/your-org/timeline-studio.git
cd timeline-studio
bun install

# Настройка pre-commit hooks
bun run prepare

# Запуск в dev режиме
bun run tauri dev
```

### 2. Основные команды

```bash
# Разработка
bun run dev              # Frontend only (Next.js)
bun run tauri dev        # Full app (Tauri)
bun run build            # Build production
bun run tauri build      # Build Tauri app

# Тестирование (4,158 тестов)
bun run test            # Frontend tests (3,604)
bun run test:rust       # Backend tests (554)
bun run test:e2e        # E2E tests (Playwright)
bun run test:coverage   # Coverage report

# Качество кода
bun run lint            # ESLint + Stylelint + Clippy
bun run check:all       # All checks + tests  
bun run fix:all         # Auto-fix all issues
```

📋 **[Все 48 команд →](package-scripts-reference.md)**

## 📁 Структура разработки

### Frontend разработка

```
src/
├── features/           # Функциональные модули
│   └── feature-name/
│       ├── components/ # React компоненты
│       ├── hooks/      # Custom hooks
│       ├── services/   # Бизнес-логика
│       ├── types/      # TypeScript типы
│       └── __tests__/  # Тесты
│
├── components/ui/      # Общие UI компоненты
├── lib/               # Утилиты
└── test/              # Тестовые утилиты
```

### Backend разработка

```
src-tauri/
├── src/
│   ├── commands/      # Tauri команды
│   ├── media/         # Медиа обработка
│   ├── video_compiler/# Видео компиляция
│   └── recognition/   # ML функции
│
├── Cargo.toml         # Rust зависимости
└── tauri.conf.json    # Конфигурация
```

## 🔧 Рабочий процесс

### 1. Создание новой функции

```bash
# Создание ветки
git checkout -b feature/new-feature

# Создание структуры модуля
mkdir -p src/features/new-feature/{components,hooks,services,types,__tests__}

# Добавление README
touch src/features/new-feature/README.md
```

### 2. Разработка компонента

```typescript
// src/features/new-feature/components/my-component.tsx
import { FC } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  onAction: () => void
}

export const MyComponent: FC<MyComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <div className={cn("my-component")}>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  )
}
```

### 3. Написание тестов

```typescript
// src/features/new-feature/__tests__/my-component.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { MyComponent } from '../components/my-component'

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test" onAction={() => {}} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  it('calls onAction when clicked', () => {
    const onAction = vi.fn()
    render(<MyComponent title="Test" onAction={onAction} />)
    
    screen.getByRole('button').click()
    expect(onAction).toHaveBeenCalled()
  })
})
```

## 📊 Метрики качества

### Требования к коду

- **TypeScript**: Strict mode, no `any`
- **Покрытие тестами**: Минимум 70%
- **Документация**: README для каждого модуля
- **Производительность**: < 16ms для рендера

### Автоматические проверки

```yaml
# .github/workflows/ci.yml
- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests (Vitest)
- E2E tests (Playwright)
- Build verification
```

## 🛠️ Инструменты разработки

### Рекомендуемые расширения VS Code

```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "tauri-apps.tauri-vscode",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

### Отладка

#### Frontend отладка
1. Откройте DevTools: `Cmd/Ctrl + Shift + I`
2. Используйте React DevTools
3. Просматривайте XState визуализацию

#### Backend отладка
1. Используйте `println!` для логов
2. Запустите с `RUST_LOG=debug`
3. Используйте `cargo test` для юнит-тестов

## 🚨 Частые проблемы

### "Module not found" ошибки
```bash
# Очистка кэша и переустановка
rm -rf node_modules bun.lockb
bun install
```

### Rust compilation errors
```bash
# Обновление зависимостей
cd src-tauri
cargo update
cargo clean
cargo build
```

### Tauri command not working
- Проверьте регистрацию команды в `main.rs`
- Убедитесь в правильности типов аргументов
- Проверьте имя команды (snake_case в Rust, camelCase в JS)

## 📈 Лучшие практики

### 1. Композиция компонентов
- Предпочитайте композицию наследованию
- Используйте маленькие, переиспользуемые компоненты
- Следуйте принципу единственной ответственности

### 2. Управление состоянием
- Локальное состояние для UI
- XState для сложной логики
- Context для глобального состояния

### 3. Производительность
- Используйте `React.memo` для тяжелых компонентов
- Применяйте `useMemo` и `useCallback`
- Виртуализируйте длинные списки

### 4. Типизация
- Всегда определяйте интерфейсы для props
- Используйте utility types TypeScript
- Избегайте `any` и `unknown`

## 🔗 Дополнительные ресурсы

### Внутренние
- [Создание нового модуля](creating-features.md)
- [Работа с XState](xstate-patterns.md)
- [Оптимизация производительности](../07-guides/performance.md)

### Внешние
- [Tauri Documentation](https://tauri.app/v2/guides/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Rust Book](https://doc.rust-lang.org/book/)

---

[← Функциональность](../03-features/README.md) | [Далее: Настройка окружения →](setup.md)