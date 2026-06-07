# Настройка окружения разработки

[← Назад к руководству разработчика](README.md)

## 📋 Содержание

- [Системные требования](#системные-требования)
- [Установка зависимостей](#установка-зависимостей)
- [Настройка IDE](#настройка-ide)
- [Переменные окружения](#переменные-окружения)
- [Первый запуск](#первый-запуск)
- [Решение проблем](#решение-проблем)

## 🖥️ Системные требования

### Минимальные требования

- **Операционная система**: Windows 10+, macOS 12+, Ubuntu 20.04+
- **Процессор**: 4-ядерный CPU
- **Память**: 8 GB RAM
- **Диск**: 10 GB свободного места
- **GPU**: Поддержка OpenGL 3.3

### Рекомендуемые требования

- **Процессор**: 8-ядерный CPU
- **Память**: 16 GB RAM
- **GPU**: Дискретная видеокарта с поддержкой NVENC/AMF/QuickSync
- **Диск**: SSD с 20 GB свободного места

## 🔧 Установка зависимостей

### 1. Node.js и Bun

```bash
# Установка Node.js 24+
# macOS
brew install node@18

# Windows (через Chocolatey)
choco install nodejs

# Linux
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка Bun
curl -fsSL https://bun.sh/install | bash
```

### 2. Rust и Cargo

```bash
# Установка Rust (все платформы)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Обновление до последней версии
rustup update

# Установка необходимых таргетов
rustup target add wasm32-unknown-unknown
```

### 3. Системные зависимости

#### macOS

```bash
# Xcode Command Line Tools
xcode-select --install

# FFmpeg и ONNX Runtime
brew install ffmpeg onnxruntime

# Экспорт переменных окружения
echo 'export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib' >> ~/.zshrc
source ~/.zshrc
```

#### Windows

```powershell
# Visual Studio 2022 с C++ инструментами
# Скачайте и установите с https://visualstudio.microsoft.com/

# FFmpeg (вариант 1 - через vcpkg)
git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg
.\bootstrap-vcpkg.bat
.\vcpkg integrate install
.\vcpkg install ffmpeg:x64-windows

# FFmpeg (вариант 2 - предсобранные библиотеки)
# Скачайте с https://www.gyan.dev/ffmpeg/builds/
# Распакуйте в C:\ffmpeg
[System.Environment]::SetEnvironmentVariable('FFMPEG_DIR', 'C:\ffmpeg', 'User')
[System.Environment]::SetEnvironmentVariable('PKG_CONFIG_PATH', 'C:\ffmpeg\lib\pkgconfig', 'User')

# pkg-config
choco install pkgconfiglite
```

#### Linux (Ubuntu/Debian)

```bash
# Основные инструменты сборки
sudo apt update
sudo apt install -y \
  build-essential \
  pkg-config \
  libssl-dev

# GTK и WebKit для Tauri
sudo apt install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev

# FFmpeg
sudo apt install -y \
  ffmpeg \
  libavcodec-dev \
  libavformat-dev \
  libavutil-dev \
  libavfilter-dev \
  libavdevice-dev

# ONNX Runtime
# Скачайте с https://github.com/microsoft/onnxruntime/releases
# Установите в /usr/local/lib
```

### 4. Клонирование репозитория

```bash
# Клонирование
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio

# Установка зависимостей
bun install

# Установка Rust зависимостей
cd src-tauri
cargo fetch
cd ..
```

## 💻 Настройка IDE

### Visual Studio Code

1. Установите рекомендуемые расширения:

```bash
# Автоматическая установка
cat .vscode/extensions.json | jq -r '.recommendations[]' | xargs -L 1 code --install-extension
```

Или вручную:
- `rust-lang.rust-analyzer` - Rust поддержка
- `tauri-apps.tauri-vscode` - Tauri интеграция
- `bradlc.vscode-tailwindcss` - Tailwind CSS IntelliSense
- `dbaeumer.vscode-eslint` - ESLint
- `esbenp.prettier-vscode` - Prettier

2. Настройки проекта (уже включены в `.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "rust-analyzer.cargo.features": "all"
}
```

### WebStorm / IntelliJ IDEA

1. Установите плагины:
   - Rust
   - Tailwind CSS
   - Prettier

2. Настройте форматирование:
   - Settings → Editor → Code Style → TypeScript
   - Включите "Use semicolons" и "Use single quotes"

## 🔐 Переменные окружения

### 1. Создайте файл `.env.local`

```bash
cp .env.example .env.local
```

### 2. Обязательные переменные

```env
# API ключи (опционально, для AI функций)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# FFmpeg пути (для macOS/Linux)
FFMPEG_DIR=/usr/local/bin
PKG_CONFIG_PATH=/usr/local/lib/pkgconfig

# ONNX Runtime (для macOS)
ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

### 3. Платформо-специфичные настройки

#### macOS
```bash
# Переменные загружаются автоматически из .env.local
# Или используйте:
source .env.macos
```

#### Windows
```powershell
# Запустите перед сборкой
.\scripts\setup-rust-env-windows.ps1
```

## 🚀 Первый запуск

### 1. Проверка установки

```bash
# Проверка версий
node --version    # >= 18.0.0
bun --version     # >= 1.0.0
rustc --version   # >= 1.81.0
cargo --version   # >= 1.81.0

# Проверка Tauri CLI
bunx tauri --version
```

### 2. Запуск в режиме разработки

```bash
# Подготовка (только первый раз)
bun run prepare

# Запуск приложения
bun run tauri dev

# Или только фронтенд
bun run dev
```

### 3. Проверка работоспособности

После запуска:
1. Откроется окно приложения
2. Проверьте консоль на ошибки
3. Попробуйте импортировать тестовое видео
4. Откройте DevTools (Cmd/Ctrl + Shift + I)

## 🔧 Решение проблем

### "Module not found" ошибки

```bash
# Очистка кэша
rm -rf node_modules bun.lock
bun install --force
```

### Ошибки компиляции Rust

```bash
# Очистка и пересборка
cd src-tauri
cargo clean
cargo build
cd ..
```

### FFmpeg не найден

```bash
# macOS/Linux
which ffmpeg  # Должен показать путь

# Windows
where ffmpeg  # Должен показать путь

# Если не найден, проверьте переменные окружения
echo $FFMPEG_DIR
echo $PKG_CONFIG_PATH
```

### ONNX Runtime ошибки

```bash
# macOS
# Убедитесь, что путь правильный
ls -la $ORT_DYLIB_PATH

# Переустановка
brew reinstall onnxruntime
```

### Tauri команды не работают

1. Проверьте регистрацию в `src-tauri/src/main.rs`
2. Убедитесь, что имя команды в snake_case
3. Проверьте типы аргументов

### Медленная сборка

```bash
# Используйте sccache для кэширования Rust
cargo install sccache
export RUSTC_WRAPPER=sccache

# Параллельная сборка
export CARGO_BUILD_JOBS=8
```

## 📚 Дополнительные ресурсы

- [Tauri Prerequisites](https://tauri.app/v2/guides/prerequisites)
- [Rust Getting Started](https://www.rust-lang.org/learn/get-started)
- [Bun Documentation](https://bun.sh/docs)
- [FFmpeg Compilation Guide](https://trac.ffmpeg.org/wiki/CompilationGuide)

---

[← Назад к руководству разработчика](README.md) | [Далее: Стандарты кодирования →](coding-standards.md)
