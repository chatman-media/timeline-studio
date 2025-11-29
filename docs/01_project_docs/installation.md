# Установка зависимостей

[← Назад к разделу](README.md) | [← К оглавлению](../README.md)

## 📋 Содержание

- [Системные требования](#системные-требования)
- [Установка по платформам](#установка-по-платформам)
  - [macOS](#macos)
  - [Windows](#windows)
  - [Linux](#linux)
- [Проверка установки](#проверка-установки)
- [Решение проблем](#решение-проблем)

## 📊 Системные требования

### Минимальные требования
- **ОС**: macOS 10.15+, Windows 10+, Linux (Ubuntu 20.04+)
- **Процессор**: 4 ядра, 2.0 GHz
- **Память**: 8 GB RAM
- **Диск**: 2 GB свободного места
- **GPU**: Поддержка OpenGL 3.3

### Рекомендуемые требования
- **Процессор**: 8+ ядер, 3.0+ GHz
- **Память**: 16+ GB RAM
- **GPU**: Дискретная видеокарта с 4+ GB VRAM
- **Диск**: SSD с 10+ GB свободного места

## 🛠️ Необходимые инструменты

### 1. Node.js и Bun
- **Node.js** версии 18 или выше
- **Bun** - быстрый JavaScript runtime и пакетный менеджер

### 2. Rust
- **Rust** версии 1.81.0 или выше
- Cargo (устанавливается вместе с Rust)

### 3. FFmpeg
- **FFmpeg** с библиотеками разработки
- Требуется для обработки видео

### 4. ONNX Runtime (опционально)
- Необходим для функций распознавания объектов
- Можно пропустить для базовой функциональности

### 5. Дополнительные инструменты

#### Для разработки
- **Git** - система контроля версий
- **pkg-config** - для поиска библиотек при компиляции

#### Для Windows
- **Visual Studio 2022** - с рабочей нагрузкой C++
- **Windows SDK** - для нативной разработки
- **pkg-config** - через chocolatey или vcpkg

#### Для Linux
- **build-essential** - базовые инструменты сборки
- **libssl-dev** - для криптографии
- **GTK3 и WebKit2GTK** - для UI Tauri

## 🍎 macOS

### Автоматическая установка (рекомендуется)

```bash
# Установка Homebrew (если еще не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установка всех зависимостей
brew install node rust ffmpeg onnxruntime

# Установка Bun
curl -fsSL https://bun.sh/install | bash

# Настройка переменных окружения для разных оболочек

## Для Zsh (по умолчанию в macOS)
echo 'export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib' >> ~/.zshrc
source ~/.zshrc

## Для Bash
echo 'export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib' >> ~/.bashrc
source ~/.bashrc

## Для Fish
echo 'set -gx ORT_DYLIB_PATH /opt/homebrew/lib/libonnxruntime.dylib' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish

# Настройка FFmpeg для разработки (опционально)
# Нужно только если возникают проблемы при сборке

## Для Apple Silicon (M1/M2/M3)
export FFMPEG_DIR=/opt/homebrew/opt/ffmpeg
export PKG_CONFIG_PATH=/opt/homebrew/opt/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH

## Для Intel Mac
export FFMPEG_DIR=/usr/local/opt/ffmpeg
export PKG_CONFIG_PATH=/usr/local/opt/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH
```

### Ручная установка

1. **Node.js**: Скачайте с [nodejs.org](https://nodejs.org/)
2. **Rust**: 
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. **FFmpeg**:
   ```bash
   brew install ffmpeg
   ```
4. **ONNX Runtime**:
   ```bash
   brew install onnxruntime
   ```

## 🪟 Windows

### Предварительные требования
- Visual Studio 2022 с рабочей нагрузкой "Разработка классических приложений на C++"
- Windows SDK

### Установка через Chocolatey

```powershell
# Установка Chocolatey (запустить PowerShell от администратора)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Установка зависимостей
choco install nodejs rust ffmpeg git pkgconfiglite

# Установка Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# Установка vcpkg для управления C++ библиотеками
git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg
.\bootstrap-vcpkg.bat
.\vcpkg integrate install
```

### Ручная установка

1. **Visual Studio 2022**: [visualstudio.microsoft.com](https://visualstudio.microsoft.com/)
2. **Node.js**: [nodejs.org](https://nodejs.org/)
3. **Rust**: [rustup.rs](https://rustup.rs/)
4. **FFmpeg**: 
   - Скачайте с [ffmpeg.org](https://ffmpeg.org/download.html)
   - Распакуйте в `C:\ffmpeg`
   - Добавьте `C:\ffmpeg\bin` в PATH

### Настройка ONNX Runtime (Windows)

```powershell
# Скачайте ONNX Runtime с официального сайта
# Распакуйте в C:\onnxruntime
# Добавьте в переменные окружения:
[Environment]::SetEnvironmentVariable("ORT_DYLIB_PATH", "C:\onnxruntime\lib\onnxruntime.dll", "User")
```

## 🐧 Linux

### Ubuntu/Debian

```bash
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Установка базовых инструментов
sudo apt install -y curl build-essential pkg-config libssl-dev

# Node.js через NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# FFmpeg и необходимые библиотеки
sudo apt install -y ffmpeg libavcodec-dev libavformat-dev \
  libavutil-dev libavfilter-dev libavdevice-dev \
  libswscale-dev libswresample-dev

# Дополнительные зависимости для Tauri
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev librsvg2-dev

# Bun
curl -fsSL https://bun.sh/install | bash

# ONNX Runtime (опционально)
sudo apt install -y libonnxruntime-dev

# Настройка переменных окружения
## Для Bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

## Для Zsh
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

## Для Fish
echo 'set -gx PATH "$HOME/.bun/bin" $PATH' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

### Fedora

```bash
# Установка инструментов разработки
sudo dnf groupinstall -y "Development Tools" "C Development Tools and Libraries"

# Node.js
sudo dnf install -y nodejs

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# FFmpeg
sudo dnf install -y ffmpeg ffmpeg-devel

# Зависимости Tauri
sudo dnf install -y gtk3-devel webkit2gtk4.1-devel \
  libappindicator-gtk3-devel librsvg2-devel
```

### Arch Linux

```bash
# Установка всех зависимостей
sudo pacman -S --needed base-devel nodejs npm rust ffmpeg \
  gtk3 webkit2gtk-4.1 libayatana-appindicator librsvg

# Bun через AUR
yay -S bun-bin
```

## ✅ Проверка установки

Выполните следующие команды для проверки:

```bash
# Node.js
node --version  # Должно быть 18.0.0 или выше
npm --version   # Проверка npm

# Bun
bun --version   # Любая последняя версия

# Rust
rustc --version # Должно быть 1.81.0 или выше
cargo --version # Проверка Cargo

# FFmpeg
ffmpeg -version # Должна отобразиться информация о версии

# Git
git --version   # Система контроля версий

# pkg-config
pkg-config --version # Для поиска библиотек

# ONNX Runtime (опционально)
# macOS/Linux
echo $ORT_DYLIB_PATH
# Windows
echo %ORT_DYLIB_PATH%

# Проверка Tauri CLI (после установки проекта)
cargo tauri --version
```

## 🚨 Решение проблем

### macOS: "xcrun: error: invalid active developer path"
```bash
xcode-select --install
```

### Windows: "cargo not found"
- Перезапустите терминал после установки Rust
- Убедитесь, что `%USERPROFILE%\.cargo\bin` добавлен в PATH

### Linux: "error while loading shared libraries"
```bash
# Обновите кэш динамических библиотек
sudo ldconfig
```

### FFmpeg не найден
- Убедитесь, что путь к FFmpeg добавлен в переменную PATH
- Перезапустите терминал

### ONNX Runtime ошибки
- Это опциональная зависимость, можно продолжить без неё
- Для полной функциональности следуйте инструкциям для вашей ОС

### Bun: "command not found"
```bash
# Перезапустите терминал или выполните:
# Bash/Zsh
source ~/.bashrc  # или ~/.zshrc
# Fish
source ~/.config/fish/config.fish
```

### Windows: Ошибки компиляции FFmpeg
- Убедитесь, что установлен Visual Studio 2022 с C++ tools
- Проверьте переменные окружения FFMPEG_DIR и PKG_CONFIG_PATH
- Используйте vcpkg для установки FFmpeg: `vcpkg install ffmpeg:x64-windows`

### Linux: Ошибка "webkit2gtk-4.1 not found"
```bash
# Ubuntu 22.04+
sudo apt install libwebkit2gtk-4.1-dev
# Для старых версий используйте webkit2gtk-4.0
sudo apt install libwebkit2gtk-4.0-dev
```

### macOS: Проблемы с Apple Silicon
- Убедитесь, что все инструменты установлены для архитектуры arm64
- Используйте Homebrew для arm64: `/opt/homebrew` вместо `/usr/local`

## 📌 Следующие шаги

После успешной установки всех зависимостей:

1. [Клонируйте репозиторий и настройте проект](first-project.md)
2. [Изучите структуру проекта](project-structure.md)
3. [Запустите приложение в режиме разработки](../05-development/setup.md)

---

[← Назад к разделу](README.md) | [Далее: Первый проект →](first-project.md)

---

*Создано: 2024-07-31*
*Обновлено: 2025-11-29*