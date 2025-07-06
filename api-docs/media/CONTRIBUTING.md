# Руководство по внесению вклада в проект

Спасибо за интерес к нашему проекту! Мы приветствуем вклад от сообщества и ценим ваше время и усилия. Это руководство поможет вам начать работу с проектом и объяснит процесс внесения изменений.

## Настройка окружения разработки

1. Убедитесь, что у вас установлены все необходимые зависимости:
   - [Node.js](https://nodejs.org/) (v18 или выше)
   - [Rust](https://www.rust-lang.org/tools/install) (последняя стабильная версия)
   - [bun](https://bun.sh/) (последняя стабильная версия)

2. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/your-username/timeline-studio.git
   cd timeline-studio
   ```

3. Установите зависимости:
   ```bash
   bun install
   ```

4. Запустите приложение в режиме разработки:
   ```bash
   bun tauri dev
   ```

## Процесс разработки

### Ветвление

Мы используем модель [GitHub Flow](https://guides.github.com/introduction/flow/):

1. Создайте ветку от `main` для вашей задачи:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   или
   ```bash
   git checkout -b fix/your-bugfix-name
   ```

2. Внесите изменения и сделайте коммиты:
   ```bash
   git add .
   git commit -m "feat: добавлена новая функция"
   ```

   Мы следуем [Conventional Commits](https://www.conventionalcommits.org/) для сообщений коммитов:
   - `feat:` для новых функций
   - `fix:` для исправления ошибок
   - `docs:` для изменений в документации
   - `style:` для форматирования кода
   - `refactor:` для рефакторинга кода
   - `test:` для добавления или исправления тестов
   - `chore:` для обновления зависимостей и других задач

3. Отправьте ветку в удаленный репозиторий:
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. Создайте Pull Request в GitHub.

### Стиль кода

#### JavaScript/TypeScript

Мы используем ESLint и Prettier для обеспечения единообразия кода:

```bash
# Проверка кода
bun lint

# Исправление ошибок
bun lint:fix

# Форматирование импортов
bun format:imports
```

#### CSS

Мы используем Stylelint для проверки CSS кода:

```bash
# Проверка CSS кода
bun lint:css

# Исправление ошибок в CSS
bun lint:css:fix
```

Основные правила для CSS:
- Используйте Tailwind CSS для стилизации компонентов
- Избегайте дублирования стилей
- Следуйте принципам компонентного подхода

#### Rust

Для Rust кода мы используем rustfmt и Clippy:

```bash
# Проверка Rust кода
bun lint:rust

# Форматирование Rust кода
bun format:rust
```

#### Проверка всего кода

Для проверки всего кода перед отправкой Pull Request:

```bash
# Проверка всего кода
bun check:all

# Исправление всех ошибок
bun fix:all
```

### Тестирование

Перед отправкой Pull Request убедитесь, что все тесты проходят:

```bash
bun test
```

Для новых функций добавляйте соответствующие тесты.

## Структура проекта

### Фронтенд (React/Next.js)

- `src/features/` - Функциональные модули приложения
  - `browser/` - Компоненты браузера файлов
  - `media-studio/` - Компоненты студии редактирования медиа
  - `modals/` - Модальные окна и диалоги
  - `project-settings/` - Настройки проекта
- `src/i18n/` - Интернационализация
- `src/types/` - TypeScript типы

### Бэкенд (Rust/Tauri)

- `src-tauri/src/` - Rust код
- `src-tauri/Cargo.toml` - Конфигурация Rust зависимостей

## Машины состояний (XState)

Мы используем XState для управления состоянием приложения. При создании новых машин состояний следуйте этим принципам:

1. Используйте метод `setup` для создания машин состояний
2. Определяйте типы для контекста и событий
3. Разделяйте сложную логику на отдельные акторы
4. Пишите тесты для машин состояний

Пример:

```typescript
import { setup } from "xstate"

export const myMachine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: "INCREMENT" } | { type: "DECREMENT" },
  },
  actions: {
    incrementCount: ({ context }) => context.count + 1,
    decrementCount: ({ context }) => context.count - 1,
  },
}).createMachine({
  context: {
    count: 0,
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        INCREMENT: {
          actions: "incrementCount",
        },
        DECREMENT: {
          actions: "decrementCount",
        },
      },
    },
  },
})
```

## Отчеты об ошибках

Если вы обнаружили ошибку, пожалуйста, создайте Issue в GitHub с подробным описанием:

1. Шаги для воспроизведения ошибки
2. Ожидаемое поведение
3. Фактическое поведение
4. Скриншоты (если применимо)
5. Информация о вашей системе (ОС, версия Node.js, версия Rust)

## Предложения по улучшению

Мы приветствуем предложения по улучшению проекта! Создайте Issue с меткой "enhancement" и опишите вашу идею.

## Лицензия

Внося вклад в проект, вы соглашаетесь с тем, что ваш код будет распространяться под лицензией MIT.

## Вопросы?

Если у вас есть вопросы, не стесняйтесь создавать Issue с меткой "question".

Спасибо за ваш вклад!
