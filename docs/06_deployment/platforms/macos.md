# Руководство по сборке Timeline Studio для macOS

Это руководство содержит подробные инструкции по сборке Timeline Studio на macOS.

## Требования

### 1. Xcode Command Line Tools
```bash
xcode-select --install
```

### 2. Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. Node.js и Bun
```bash
# Установка Node.js
brew install node@18

# Установка Bun
curl -fsSL https://bun.sh/install | bash
```

### 4. Rust
```bash
# Установка Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Добавление в PATH
source $HOME/.cargo/env
```

### 5. FFmpeg и ONNX Runtime
```bash
# Установка FFmpeg
brew install ffmpeg

# Установка ONNX Runtime
brew install onnxruntime

# Добавить в профиль оболочки (~/.zshrc или ~/.bash_profile)
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

## Процесс сборки

### 1. Клонирование и настройка
```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio

# Установка зависимостей
bun install
```

### 2. Сборка для разработки
```bash
# Запуск в режиме разработки
bun run tauri dev
```

### 3. Production сборка
```bash
# Сборка для текущей архитектуры
bun run tauri build

# Сборка универсального бинарника (Intel + Apple Silicon)
bun run tauri build --target universal-apple-darwin
```

## Подписание кода и нотаризация

### 1. Сертификат разработчика
1. Зарегистрируйтесь в Apple Developer Program
2. Создайте сертификат Developer ID Application
3. Установите сертификат в Keychain

### 2. Настройка подписания
```json
// tauri.conf.json
{
  "bundle": {
    "macOS": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)",
      "providerShortName": "TEAM_ID"
    }
  }
}
```

### 3. Переменные окружения
```bash
# Apple ID для нотаризации
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

### 4. Процесс нотаризации
```bash
# Сборка и подписание
bun run tauri build

# Нотаризация (автоматически с Tauri)
# Процесс сборки автоматически выполнит нотаризацию, если учетные данные установлены
```

## Распространение

### 1. Создание DMG
Процесс сборки автоматически создает:
- `.app` бандл в `target/release/bundle/macos/`
- `.dmg` установщик в `target/release/bundle/dmg/`

### 2. Распространение через App Store (в будущем)
Требования:
- Учетная запись App Store Connect
- Сертификат распространения App Store
- Provisioning профили

## Устранение неполадок

### Распространенные проблемы

#### 1. Ошибка "Developer cannot be verified"
- Приложение должно быть нотаризовано
- Проверьте, что сертификат Apple Developer действителен
- Убедитесь, что учетные данные для нотаризации корректны

#### 2. Ошибки линковки FFmpeg
```bash
# Проверка установки FFmpeg
brew list ffmpeg

# Переустановка при необходимости
brew reinstall ffmpeg

# Проверка pkg-config
pkg-config --libs libavformat
```

#### 3. ONNX Runtime не найден
```bash
# Проверка установки
ls -la /opt/homebrew/lib/libonnxruntime.dylib

# Установка переменной окружения
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

#### 4. Проблемы с универсальным бинарником
```bash
# Проверка архитектур
lipo -info target/release/bundle/macos/Timeline\ Studio.app/Contents/MacOS/Timeline\ Studio

# Должно показать: x86_64 arm64
```

## Оптимизация производительности

### 1. Флаги сборки
```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
```

### 2. macOS-специфичные оптимизации
- Включите Metal для GPU ускорения
- Используйте VideoToolbox для аппаратного кодирования
- Оптимизируйте для Apple Silicon где возможно

### 3. Уменьшение размера бандла
- Удаление отладочных символов
- Сжатие ресурсов
- Использование asset catalogs для изображений

## Вопросы безопасности

### 1. Hardened Runtime
Включите в tauri.conf.json:
```json
{
  "bundle": {
    "macOS": {
      "hardenedRuntime": true,
      "entitlements": "entitlements.plist"
    }
  }
}
```

### 2. Entitlements
Создайте `entitlements.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
</dict>
</plist>
```

## Тестирование

### 1. Локальное тестирование
```bash
# Тестирование .app бандла
open target/release/bundle/macos/Timeline\ Studio.app

# Тестирование .dmg
open target/release/bundle/dmg/Timeline\ Studio_*.dmg
```

### 2. TestFlight (в будущем)
- Загрузка в App Store Connect
- Распространение бета-тестерам
- Сбор отчетов о сбоях и отзывов

---

[← Назад к развертыванию](../README.md)