# Руководство по сборке Timeline Studio для Linux

Это руководство содержит подробные инструкции по сборке Timeline Studio на Linux дистрибутивах.

## Поддерживаемые дистрибутивы

- Ubuntu 20.04+ / Debian 11+
- Fedora 35+
- Arch Linux
- openSUSE Tumbleweed

## Требования

### 1. Системные зависимости

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install -y \
  build-essential \
  pkg-config \
  libssl-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

#### Fedora
```bash
sudo dnf install -y \
  gcc \
  gcc-c++ \
  openssl-devel \
  gtk3-devel \
  webkit2gtk4.1-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  patchelf
```

#### Arch Linux
```bash
sudo pacman -S --needed \
  base-devel \
  openssl \
  gtk3 \
  webkit2gtk-4.1 \
  libappindicator-gtk3 \
  librsvg \
  patchelf
```

### 2. Node.js и Bun

```bash
# Установка Node.js 24+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка Bun
curl -fsSL https://bun.sh/install | bash
```

### 3. Rust
```bash
# Установка Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Добавление в PATH
source $HOME/.cargo/env
```

### 4. FFmpeg
```bash
# Ubuntu/Debian
sudo apt install -y \
  ffmpeg \
  libavcodec-dev \
  libavformat-dev \
  libavutil-dev \
  libavfilter-dev \
  libavdevice-dev \
  libswscale-dev \
  libswresample-dev

# Fedora
sudo dnf install -y \
  ffmpeg \
  ffmpeg-devel

# Arch
sudo pacman -S ffmpeg
```

### 5. ONNX Runtime
```bash
# Скачивание ONNX Runtime
ONNX_VERSION="1.19.2"
wget https://github.com/microsoft/onnxruntime/releases/download/v${ONNX_VERSION}/onnxruntime-linux-x64-${ONNX_VERSION}.tgz

# Извлечение в системную директорию
sudo tar -xzf onnxruntime-linux-x64-${ONNX_VERSION}.tgz -C /usr/local

# Добавление в путь библиотек
echo 'export LD_LIBRARY_PATH=/usr/local/onnxruntime-linux-x64-${ONNX_VERSION}/lib:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
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

# Сборка конкретного формата
bun run tauri build -- --bundles appimage  # Только AppImage
bun run tauri build -- --bundles deb       # Только Debian пакет
bun run tauri build -- --bundles rpm       # Только RPM пакет
```

## Форматы пакетов

### 1. AppImage
Универсальный формат, работающий на большинстве Linux дистрибутивов:
- **Вывод**: `target/release/bundle/appimage/Timeline_Studio_*.AppImage`
- **Особенности**: 
  - Портативный (один файл)
  - Не требует установки
  - Интеграция с рабочим столом через appimaged

```bash
# Сделать исполняемым и запустить
chmod +x Timeline_Studio_*.AppImage
./Timeline_Studio_*.AppImage
```

### 2. Debian пакет (.deb)
Для Debian-based дистрибутивов:
- **Вывод**: `target/release/bundle/deb/timeline-studio_*.deb`
- **Установка**:
```bash
sudo dpkg -i timeline-studio_*.deb
# Исправление зависимостей при необходимости
sudo apt-get install -f
```

### 3. RPM пакет
Для Red Hat-based дистрибутивов:
- **Вывод**: `target/release/bundle/rpm/timeline-studio-*.rpm`
- **Установка**:
```bash
# Fedora
sudo dnf install timeline-studio-*.rpm

# openSUSE
sudo zypper install timeline-studio-*.rpm
```

## Интеграция с рабочим столом

### 1. Desktop Entry
Автоматически создается при установке:
```ini
[Desktop Entry]
Type=Application
Name=Timeline Studio
Comment=Профессиональный видеоредактор с AI
Icon=timeline-studio
Exec=timeline-studio %F
Categories=AudioVideo;Video;AudioVideoEditing;
MimeType=video/mp4;video/quicktime;video/x-msvideo;
```

### 2. Ассоциации файлов
Приложение регистрируется для распространенных видеоформатов:
- MP4, MOV, AVI, MKV
- WebM, OGV
- ProRes, DNxHD

## GPU ускорение

### 1. NVIDIA (NVENC)
```bash
# Проверка драйвера NVIDIA
nvidia-smi

# Установка CUDA toolkit (опционально, для продвинутых функций)
# Ubuntu
sudo apt install nvidia-cuda-toolkit

# Fedora
sudo dnf install cuda
```

### 2. AMD (AMF/VAAPI)
```bash
# Установка VAAPI драйверов
# Ubuntu/Debian
sudo apt install mesa-va-drivers vainfo

# Fedora
sudo dnf install mesa-va-drivers libva-utils

# Проверка поддержки VAAPI
vainfo
```

### 3. Intel (QuickSync)
```bash
# Установка Intel Media SDK
# Ubuntu/Debian
sudo apt install intel-media-va-driver-non-free

# Проверка поддержки
vainfo
```

## Устранение неполадок

### Распространенные проблемы

#### 1. "error while loading shared libraries"
```bash
# Проверка отсутствующих библиотек
ldd Timeline_Studio

# Установка отсутствующих зависимостей
sudo apt-get install -f  # Debian/Ubuntu
sudo dnf install -y      # Fedora
```

#### 2. FFmpeg не найден
```bash
# Проверка установки FFmpeg
ffmpeg -version

# Проверка pkg-config
pkg-config --libs libavformat

# Установка PKG_CONFIG_PATH при необходимости
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH
```

#### 3. GPU ускорение не работает
```bash
# Проверка GPU драйверов
# NVIDIA
nvidia-smi

# AMD
glxinfo | grep "OpenGL renderer"

# Intel
vainfo
```

#### 4. AppImage не запускается
```bash
# Проверка установки FUSE
fusermount --version

# Установка FUSE если отсутствует
sudo apt install fuse libfuse2  # Ubuntu/Debian
sudo dnf install fuse fuse-libs # Fedora
```

#### 5. Проблемы с правами доступа
```bash
# Исправление прав
chmod +x Timeline_Studio_*.AppImage

# При необходимости, извлечение AppImage
./Timeline_Studio_*.AppImage --appimage-extract
./squashfs-root/AppRun
```

## Оптимизация производительности

### 1. Оптимизации сборки
```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
strip = true
```

### 2. Системные оптимизации
```bash
# Увеличение лимита file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Установка CPU governor в performance
sudo cpupower frequency-set -g performance
```

### 3. Настройки памяти
```bash
# Увеличение лимитов памяти при необходимости
ulimit -n 4096  # Файловые дескрипторы
ulimit -s unlimited  # Размер стека
```

## Распространение через менеджеры пакетов

### 1. Snap (в будущем)
```yaml
# snapcraft.yaml
name: timeline-studio
version: '0.53.0'
summary: Профессиональный видеоредактор с AI
description: |
  Timeline Studio - современное приложение для видеомонтажа
  с AI-функциями и GPU ускорением.

grade: stable
confinement: strict

apps:
  timeline-studio:
    command: timeline-studio
    plugs:
      - desktop
      - desktop-legacy
      - opengl
      - audio-playback
      - audio-record
```

### 2. Flatpak (в будущем)
```json
{
  "app-id": "app.timeline.studio",
  "runtime": "org.freedesktop.Platform",
  "runtime-version": "23.08",
  "sdk": "org.freedesktop.Sdk",
  "command": "timeline-studio"
}
```

### 3. AUR (Arch Linux)
PKGBUILD для Arch User Repository:
```bash
pkgname=timeline-studio
pkgver=0.53.0
pkgrel=1
pkgdesc="Профессиональный видеоредактор с AI"
arch=('x86_64')
url="https://timeline.studio"
license=('custom')
depends=('webkit2gtk-4.1' 'gtk3' 'ffmpeg')
source=("$pkgname-$pkgver.tar.gz::https://github.com/chatman-media/timeline-studio/releases/download/v$pkgver/$pkgname-$pkgver.tar.gz")
```

## Вопросы безопасности

### 1. Песочница
- AppImage работает в пользовательском пространстве
- Flatpak/Snap предоставляют дополнительную изоляцию
- Рекомендуются профили SELinux/AppArmor

### 2. Разрешения
Приложению требуются:
- Доступ к файловой системе (для медиафайлов)
- Сетевой доступ (для обновлений и AI функций)
- Доступ к GPU (для ускорения)
- Доступ к аудиоустройствам (для записи)

---

[← Назад к развертыванию](../README.md)