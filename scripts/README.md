# Scripts Directory

Эта директория содержит вспомогательные скрипты для разработки и сборки Timeline Studio.

## Структура

- `ci/` - Скрипты для CI/CD (версионирование, FFmpeg setup, changelog)
- Корневая папка - Утилиты для локальной разработки и специфических задач

## Активные скрипты

### Установка зависимостей

#### `install-onnxruntime.js`
**Назначение**: Установка ONNX Runtime для функций распознавания
**Использование**: Автоматически в CI/CD
```bash
node scripts/install-onnxruntime.js
```

#### `windows-npm-install.ps1`
**Назначение**: Специальная установка npm пакетов для Windows с обработкой ошибок
**Использование**: В Windows CI/CD workflows
```powershell
.\scripts\windows-npm-install.ps1
```

#### `install-windows-deps.ps1`
**Назначение**: Установка системных зависимостей для Windows
**Использование**: При первой настройке Windows окружения
```powershell
.\scripts\install-windows-deps.ps1
```

### Модели машинного обучения

#### `download-models.sh`
**Назначение**: Загрузка YOLO и других моделей для распознавания
**Использование**: После клонирования репозитория
```bash
./scripts/download-models.sh
```

### Очистка и оптимизация

#### `cleanup-test-binaries.sh` / `cleanup-test-binaries.ps1`
**Назначение**: Удаление тестовых бинарников перед релизной сборкой
**Что делает**:
- Удаляет `test_specta` и другие тестовые файлы
- Очищает кэш и временные файлы
- Предотвращает попадание dev-зависимостей в релиз

**Использование**:
```bash
# Unix/Linux/macOS
./scripts/cleanup-test-binaries.sh

# Windows PowerShell
.\scripts\cleanup-test-binaries.ps1
```

### Анализ кодовой базы

#### `analyze-command-usage.ts`
**Назначение**: Анализ использования Tauri команд в проекте
**Что делает**:
- Извлекает все зарегистрированные команды из `app_builder.rs`
- Находит все `invoke()` вызовы в `src/domains/`
- Показывает покрытие по доменам и модулям
- Выявляет незарегистрированные команды
- Находит неиспользуемый код

**Использование**:
```bash
bun run scripts/analyze-command-usage.ts
```

**Результаты**:
- Консольный вывод с детальной статистикой
- Автоматическое обновление `docs/03_architecture/command-usage-analysis.md`

**Когда запускать**:
- После добавления новых Tauri команд
- Перед релизами (проверка на незарегистрированные команды)
- При рефакторинге доменов
- Для выявления неиспользуемого кода

**Пример вывода**:
```
📊 СТАТИСТИКА:
   Зарегистрировано команд: 335
   Используется на фронтенде: 112
   Покрытие: 33.4%

⚠️ КОМАНДЫ ВЫЗЫВАЕМЫЕ, НО НЕ ЗАРЕГИСТРИРОВАННЫЕ: 109
🗑️ НЕИСПОЛЬЗУЕМЫЕ КОМАНДЫ: 223
```

### Тестирование и покрытие

#### `upload-coverage.sh`
**Назначение**: Загрузка отчетов покрытия в Codecov
**Использование**: В CI/CD после тестов
```bash
npm run test:coverage:upload
```

#### `rust-coverage.sh` / `rust-coverage-macos-v2.sh`
**Назначение**: Генерация отчетов покрытия для Rust кода
**Использование**: Локально или в CI/CD
```bash
./scripts/rust-coverage-macos-v2.sh
```

### Документация

#### `generate-docs.js`
**Назначение**: Генерация API документации
**Использование**:
```bash
npm run docs
```

### Разработка

#### `test-tauri-api.js`
**Назначение**: Тестирование Tauri API команд
**Использование**: Для отладки IPC коммуникации
```bash
node scripts/test-tauri-api.js
```

#### `fix-tauri-imports.cjs`
**Назначение**: Исправление импортов Tauri API после обновлений
**Использование**: При проблемах с импортами
```bash
node scripts/fix-tauri-imports.cjs
```

### Платформо-специфичные

#### `setup-ffmpeg-macos.fish`
**Назначение**: Установка FFmpeg для Fish shell на macOS
**Использование**: Для разработчиков с Fish shell
```fish
source scripts/setup-ffmpeg-macos.fish
```

#### `check-imports-windows.ps1`
**Назначение**: Проверка корректности импортов на Windows
**Использование**: При проблемах с путями импортов
```powershell
.\scripts\check-imports-windows.ps1
```

## CI/CD скрипты

Скрипты для CI/CD находятся в папке `ci/`:
- Версионирование (version-sync, update-version)
- FFmpeg setup для всех платформ
- Синхронизация changelog
- Настройка Rust окружения

Подробнее см. [ci/README.md](ci/README.md)

## Добавление новых скриптов

При добавлении нового скрипта:
1. Поместите CI/CD скрипты в папку `ci/`
2. Локальные утилиты оставьте в корне `scripts/`
3. Обновите этот README
4. Добавьте npm скрипт в package.json если нужно
5. Убедитесь в правах на выполнение (`chmod +x`)

## Устаревшие скрипты

Следующие скрипты могут быть удалены при следующей очистке:
- `rust-coverage.sh` - заменен на `rust-coverage-macos-v2.sh`
- Проверить актуальность `check-imports-windows.ps1`