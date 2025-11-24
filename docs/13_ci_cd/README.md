# 13. CI/CD

Документация по непрерывной интеграции и развертыванию Timeline Studio.

## 📋 Содержание

- [ci-cd-setup.md](ci-cd-setup.md) - Настройка CI/CD pipeline
- [semantic-release.md](semantic-release.md) - Автоматическое версионирование и релизы
- [codecov-components.md](codecov-components.md) - Настройка покрытия кода

## 🔄 CI/CD Процессы

### Continuous Integration
- Автоматические тесты при каждом коммите
- Проверка качества кода через **Biome** (линтинг и форматирование)
- Сборка на всех поддерживаемых платформах
- Проверка безопасности зависимостей
- ~1860 TypeScript ошибок (временно отключена проверка типов)

### Continuous Deployment
- Автоматическая сборка релизных версий
- Создание дистрибутивов для Windows, macOS, Linux
- Публикация в GitHub Releases
- Обновление документации
- **Alpha Release Workflow** - автоматическая сборка альфа-версий

## 🚀 GitHub Actions Workflows

### Main Workflows
- **ci.yml** - Основной CI pipeline
- **quick-check.yml** - Быстрая валидация
- **windows-build.yml** - Специализированная сборка Windows с оптимизированным FFmpeg

### Release Workflows
- **release.yml** - Создание релизов
- **alpha-release.yml** - Сборка альфа-версий при тегах `v*-alpha` ✨ NEW
- **nightly.yml** - Ночные сборки для тестирования

### Специфичные для платформ
- **lint-js.yml** - Проверка JavaScript/TypeScript через Biome
- **lint-rust.yml** - Проверка Rust кода
- **lint-js-windows-bun.yml** - Windows-специфичная проверка с Bun

## 🛠️ Настройка

### Локальная проверка перед push
```bash
# Проверка кода через Biome
bun run lint

# Исправление автоматически исправляемых проблем
bun run lint:fix

# Полная проверка (lint + тесты)
bun run check:all

# Запуск тестов локально
bun run test:ci
```

### Проверка типов (временно отключена в CI)
```bash
# Локальная проверка TypeScript
bun run check:type

# Известно ~1860 ошибок, планируется исправить до Beta
```

## 📦 Альфа-релиз CI/CD

### Автоматическая сборка альфа-версий
1. Создание тега: `git tag -a v0.60.0-alpha -m "Alpha Release"`
2. Push тега: `git push origin v0.60.0-alpha`
3. GitHub Actions автоматически:
   - Собирает для всех платформ
   - Создает релиз с пометкой "pre-release"
   - Прикрепляет артефакты сборки

### Используемые инструменты
- **Biome** - единый инструмент для линтинга и форматирования (заменил ESLint)
- **Bun** - быстрый JavaScript runtime и package manager
- **Tauri v2** - для сборки десктопного приложения
- **FFmpeg** - обработка видео (предсобранные библиотеки для Windows)

## 🔧 Секреты GitHub

Необходимые секреты для CI/CD:
- `TAURI_SIGNING_PRIVATE_KEY` - приватный ключ для подписи
- `TAURI_SIGNING_PUBLIC_KEY` - публичный ключ для подписи
- `GITHUB_TOKEN` - автоматически предоставляется GitHub

## 📊 Текущий статус

| Метрика | Значение |
|---------|----------|
| **Статус CI** | ✅ Работает |
| **Покрытие тестами** | 80%+ |
| **TypeScript ошибки** | ~1860 (отключено в CI) |
| **Время сборки** | ~15-20 минут |
| **Платформы** | Windows, macOS, Linux |

## 🚨 Известные проблемы

1. **TypeScript проверка отключена** - ~1860 ошибок, будет исправлено до Beta
2. **Windows FFmpeg** - использует предсобранные библиотеки вместо vcpkg (быстрее)
3. **Кэширование** - требует оптимизации для ускорения сборок

---

*Обновлено: 3 августа 2025 для альфа-релиза v0.60.0*

[← К тестированию](../12_testing/README.md) | [К QA →](../14_quality_assurance/README.md)