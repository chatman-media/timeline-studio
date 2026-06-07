# GitHub Actions Workflows

## Overview

Timeline Studio использует набор оптимизированных CI/CD workflows для автоматизации тестирования, сборки и деплоя. Все workflows настроены для работы с FFmpeg и другими медиа-библиотеками.

## Активные Workflows

### Core Workflows

#### `lint-js.yml` - Линтинг JavaScript/TypeScript
**Назначение**: Проверка кода с помощью Biome
**Триггеры**: Push в main, Pull Requests
**Платформы**: Ubuntu, Windows
**Ключевые особенности**:
- Использует Biome вместо ESLint для скорости
- Кросс-платформенная проверка
- Кэширование зависимостей

#### `lint-rs.yml` - Линтинг Rust
**Назначение**: Проверка Rust кода с clippy
**Триггеры**: Push в main, Pull Requests для src-tauri/**
**Платформы**: Ubuntu, Windows, macOS
**Ключевые особенности**:
- Проверка форматирования с rustfmt
- Clippy с уровнем предупреждений
- Кэширование Cargo зависимостей

#### `lint-css.yml` - Линтинг CSS
**Назначение**: Проверка стилей с Stylelint
**Триггеры**: Push в main, Pull Requests
**Платформы**: Ubuntu
**Ключевые особенности**:
- Проверка CSS и PostCSS файлов
- Быстрая валидация

#### `check-all.yml` - Полная проверка
**Назначение**: Комплексная проверка всего проекта
**Триггеры**: Push в main/develop, Pull Requests
**Платформы**: Ubuntu, Windows, macOS  
**Ключевые особенности**:
- Запускает все линтеры и тесты
- Проверка типов TypeScript
- Тесты фронтенда и бэкенда

### Build Workflows

#### `build.yml` - Основная сборка
**Назначение**: Сборка приложения для всех платформ
**Триггеры**: Push в main, теги версий
**Платформы**: Ubuntu, Windows, macOS
**Ключевые особенности**:
- Сборка Tauri приложения
- Создание установщиков
- Загрузка артефактов

#### `build-release.yml` - Release сборка
**Назначение**: Создание официальных релизов
**Триггеры**: Теги версий (v*)
**Платформы**: Ubuntu, Windows, macOS
**Ключевые особенности**:
- Подписание кода
- Создание changelog
- Публикация в GitHub Releases
- Нотариация для macOS

#### `macos-build.yml` - Специализированная macOS сборка
**Назначение**: Сборка и нотариация для macOS
**Триггеры**: Push в main, manual dispatch
**Платформы**: macOS (различные версии)
**Ключевые особенности**:
- Универсальные бинарники (Intel + Apple Silicon)
- Нотариация через Apple
- Code signing

### Testing Workflows

#### `test-coverage.yml` - Покрытие тестами
**Назначение**: Генерация отчетов покрытия
**Триггеры**: Push в main, Pull Requests
**Платформы**: Ubuntu
**Ключевые особенности**:
- Покрытие для JavaScript и Rust
- Загрузка в Codecov
- HTML отчеты как артефакты

### Deployment Workflows

#### `deploy-promo.yml` - Деплой промо-сайта
**Назначение**: Деплой лендинга на GitHub Pages
**Триггеры**: Push в main (изменения в promo/**)
**Платформы**: Ubuntu
**Ключевые особенности**:
- Сборка React приложения
- Автоматический деплой

#### `sync-changelog.yml` - Синхронизация CHANGELOG
**Назначение**: Обновление changelog на сайте
**Триггеры**: Push в main (CHANGELOG.md)
**Платформы**: Ubuntu

### Utility Workflows

#### `version-bump.yml` - Обновление версии
**Назначение**: Автоматическое обновление версии
**Триггеры**: Manual dispatch
**Параметры**: major, minor, patch
**Ключевые особенности**:
- Обновляет package.json, Cargo.toml, tauri.conf.json
- Создает commit и тег

#### `bundle-analysis.yml` - Анализ бандла
**Назначение**: Анализ размера JavaScript бандла
**Триггеры**: Pull Requests
**Платформы**: Ubuntu
**Ключевые особенности**:
- Сравнение размеров с main веткой
- Детальный отчет в PR

#### `docs.yml` - Генерация документации
**Назначение**: Создание API документации
**Триггеры**: Push в main
**Платформы**: Ubuntu
**Ключевые особенности**:
- TypeDoc для TypeScript
- Cargo doc для Rust

#### `release.yml` - Semantic Release
**Назначение**: Автоматический релиз через semantic-release
**Триггеры**: Push в main
**Платформы**: Ubuntu
**Ключевые особенности**:
- Анализ коммитов
- Автоматическая версионность
- Генерация changelog

## Настройка окружения

### FFmpeg на Windows

Workflows используют предсобранные FFmpeg библиотеки:

```powershell
FFMPEG_DIR=C:\ffmpeg
FFMPEG_INCLUDE_DIR=C:\ffmpeg\include
FFMPEG_LIB_DIR=C:\ffmpeg\lib
PKG_CONFIG_PATH=C:\ffmpeg\lib\pkgconfig
```

### ONNX Runtime

Для функций распознавания:

```bash
# macOS
ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib

# Linux
ORT_LIB_PATH=/usr/lib/x86_64-linux-gnu
```

## Секреты и переменные

Необходимые секреты в репозитории:

- `APPLE_CERTIFICATE` - Сертификат для подписи macOS
- `APPLE_CERTIFICATE_PASSWORD` - Пароль сертификата
- `APPLE_SIGNING_IDENTITY` - Identity для подписи
- `APPLE_ID` - Apple ID для нотариации
- `APPLE_PASSWORD` - App-specific пароль
- `CODECOV_TOKEN` - Токен для Codecov
- `TAURI_PRIVATE_KEY` - Приватный ключ для обновлений
- `TAURI_KEY_PASSWORD` - Пароль ключа

## Кэширование

Стратегия кэширования для ускорения сборок:

1. **Node зависимости**: По хэшу package-lock.json
2. **Rust зависимости**: По хэшу Cargo.lock
3. **FFmpeg (Windows)**: Отдельный кэш для библиотек
4. **Bun кэш**: По хэшу `bun.lock`, `package-lock.json` и workspace `package.json`

## Метрики производительности

| Workflow | Типичное время | Платформа |
|----------|---------------|-----------|
| lint-js | 2-3 минуты | Ubuntu/Windows |
| lint-rs | 5-8 минут | Все платформы |
| check-all | 10-15 минут | Все платформы |
| build | 20-30 минут | Все платформы |
| test-coverage | 8-12 минут | Ubuntu |

## Отладка проблем

### Проблема: Mutex lock failed в Rust тестах
**Решение**: Используется скрипт `src-tauri/run-tests.sh` с single-thread режимом

### Проблема: FFmpeg не найден на Windows
**Решение**: Проверьте установку через "FFmpeg Installation Verification" шаг

### Проблема: Biome форматирование
**Решение**: Запустите локально `npm run lint:fix`

## Добавление новых зависимостей

При добавлении системных зависимостей:

1. **Linux**: Добавьте в `apt-get install` список
2. **macOS**: Добавьте в `brew install` список
3. **Windows**: Добавьте в секцию установки Windows зависимостей

Всегда тестируйте изменения в Pull Request перед мержем в main.

## Связанные скрипты

Вспомогательные скрипты находятся в `scripts/ci/`:
- `setup-ffmpeg-windows.ps1` - Установка FFmpeg на Windows
- `setup-ffmpeg-macos.sh` - Установка FFmpeg на macOS
- `sync-version.js` - Синхронизация версий
- `sync-changelog.js` - Синхронизация changelog
