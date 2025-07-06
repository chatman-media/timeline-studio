# Настройка Codecov

## Обзор

Этот проект использует Codecov для отчетности покрытия кода со следующей настройкой:
- **Frontend**: Покрытие JavaScript/TypeScript с использованием Vitest
- **Backend**: Покрытие Rust с использованием cargo-llvm-cov  
- **Интеграция**: Codecov Vite плагин для анализа бандлов

## Конфигурация

### 1. Конфигурация Vite Plugin

Плагин Codecov Vite настроен в `vitest.config.ts`:

```typescript
import { codecovVitePlugin } from "@codecov/vite-plugin"

export default defineConfig({
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "timeline-studio",
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  // ... rest of config
})
```

### 2. Настройки покрытия

Покрытие настроено в `vitest.config.ts`:

```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "json", "html", "lcov"],
  exclude: [
    "node_modules/**",
    "src/test/**",
    "dist/**",
    "**/*.d.ts",
    "**/*.config.{js,ts}",
    "**/vite-env.d.ts",
    "**/*.test.{ts,tsx}",
    "**/__mocks__/**",
    "**/mocks/**",
    "src/components/ui/**", // UI components excluded
  ],
  include: ["src/**/*.{ts,tsx}"],
  reportsDirectory: "./coverage",
}
```

## Запуск покрытия локально

### Покрытие Frontend
```bash
# Запуск тестов с покрытием
npm run test:coverage

# Генерация и загрузка отчета покрытия
npm run test:coverage:report
```

### Backend Coverage
```bash
# Run Rust tests with coverage
npm run test:coverage:rust

# Generate and upload Rust coverage report
npm run test:coverage:rust:report
```

### Manual Upload
```bash
# Upload existing coverage files
./scripts/upload-coverage.sh
```

## GitHub Actions Integration

The `.github/workflows/test-coverage.yml` workflow automatically:
1. Runs tests with coverage on every push to main and PR
2. Uploads coverage using the Vite plugin (with CODECOV_TOKEN)
3. Falls back to standard Codecov action if needed
4. Handles both frontend and backend coverage

## Environment Variables

- `CODECOV_TOKEN`: Required for uploading coverage reports
  - Set in GitHub repository secrets
  - Available in CI environment
  - Used by both Vite plugin and upload scripts

## Bundle Analysis (Анализ бандлов)

### Возможности
При наличии `CODECOV_TOKEN`, плагин Vite предоставляет расширенный анализ бандлов:
- **Отслеживание размера бандлов**: Мониторинг изменений размера во времени
- **Анализ зависимостей**: Какие зависимости влияют на размер бандла
- **Code Splitting**: Анализ размеров чанков и оптимизации
- **Метрики производительности**: Прогноз времени загрузки на основе размера
- **Tree Shaking**: Выявление неиспользуемого кода
- **Анализ сжатия**: Размеры после gzip сжатия

### Запуск анализа

#### Локальный анализ
```bash
# Сборка с анализом бандлов
npm run build:analyze

# С указанием токена
CODECOV_TOKEN=your_token_here npm run build:analyze
```

#### Автоматический анализ
Анализ бандлов запускается автоматически через GitHub Actions:
- При каждом push в main ветку
- На всех pull request'ах
- Через workflow `bundle-analysis.yml`

### Просмотр результатов

1. Перейдите в [Codecov Dashboard](https://app.codecov.io/gh/chatman-media/timeline-studio)
2. Откройте вкладку "Bundle Analysis"
3. Изучите метрики:
   - Тренды размера бандлов
   - Состав модулей
   - Дублирующиеся зависимости
   - Инсайты производительности

### Конфигурация

Анализ бандлов настроен в:
- `vitest.config.ts` - Codecov Vite плагин с `enableBundleAnalysis`
- `vite.config.ts` - Конфигурация production сборки
- `next.config.ts` - Генерация webpack статистики

### Разделение на чанки

Наш бандл разделен на оптимизированные чанки:
- `react`: React и ReactDOM
- `state`: XState и управление состоянием
- `ui`: Компоненты Radix UI
- `tauri`: Модули Tauri API
- `utils`: Утилитарные библиотеки
- `media`: Библиотеки обработки медиа

### Оптимизация на основе анализа

Рекомендации по оптимизации:
1. **Lazy Loading**: Разделяйте большие фичи на отдельные чанки
2. **Tree Shaking**: Используйте правильные ES модули
3. **Аудит зависимостей**: Заменяйте тяжелые зависимости
4. **Code Splitting**: Используйте динамические импорты

## Badges

Coverage badges in README.md:
```markdown
[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=for-the-badge&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=for-the-badge&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
```

## Troubleshooting

### Coverage Not Showing
1. Ensure repository is activated in Codecov dashboard
2. Check that `CODECOV_TOKEN` is set in GitHub secrets
3. Verify coverage files are generated (`./coverage/lcov.info`)

### Vite Plugin Issues
- The plugin requires `CODECOV_TOKEN` to be set
- Bundle analysis only works when token is available
- Check console output for plugin initialization messages

### Manual Testing
Test the plugin locally:
```bash
CODECOV_TOKEN=your_token_here npm run test:coverage
```