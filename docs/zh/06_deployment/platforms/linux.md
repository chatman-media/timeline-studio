# Timeline Studio Linux Build Guide

This guide provides detailed instructions for building Timeline Studio on Linux distributions.

## Supported Distributions

- Ubuntu 20.04+ / Debian 11+
- Fedora 35+
- Arch Linux
- openSUSE Tumbleweed

## Requirements

### 1. System Dependencies

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

### 2. Node.js and Bun

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### 3. Rust
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add to PATH
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
# Download ONNX Runtime
ONNX_VERSION="1.19.2"
wget https://github.com/microsoft/onnxruntime/releases/download/v${ONNX_VERSION}/onnxruntime-linux-x64-${ONNX_VERSION}.tgz

# Extract to system directory
sudo tar -xzf onnxruntime-linux-x64-${ONNX_VERSION}.tgz -C /usr/local

# Add to library path
echo 'export LD_LIBRARY_PATH=/usr/local/onnxruntime-linux-x64-${ONNX_VERSION}/lib:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

## Build Process

### 1. Clone and Setup
```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio

# Install dependencies
bun install
```

### 2. Development Build
```bash
# Run in development mode
bun run tauri dev
```

### 3. Production Build
```bash
# Build for current architecture
bun run tauri build

# Build specific format
bun run tauri build -- --bundles appimage  # AppImage only
bun run tauri build -- --bundles deb       # Debian package only
bun run tauri build -- --bundles rpm       # RPM package only
```

## Package Formats

### 1. AppImage
Universal format that runs on most Linux distributions:
- **Output**: `target/release/bundle/appimage/Timeline_Studio_*.AppImage`
- **Features**: 
  - Portable (single file)
  - No installation required
  - Desktop integration via appimaged

```bash
# Make executable and run
chmod +x Timeline_Studio_*.AppImage
./Timeline_Studio_*.AppImage
```

### 2. Debian Package (.deb)
For Debian-based distributions:
- **Output**: `target/release/bundle/deb/timeline-studio_*.deb`
- **Installation**:
```bash
sudo dpkg -i timeline-studio_*.deb
# Fix dependencies if needed
sudo apt-get install -f
```

### 3. RPM Package
For Red Hat-based distributions:
- **Output**: `target/release/bundle/rpm/timeline-studio-*.rpm`
- **Installation**:
```bash
# Fedora
sudo dnf install timeline-studio-*.rpm

# openSUSE
sudo zypper install timeline-studio-*.rpm
```

## Desktop Integration

### 1. Desktop Entry
Automatically created during installation:
```ini
[Desktop Entry]
Type=Application
Name=Timeline Studio
Comment=Professional AI-Powered Video Editor
Icon=timeline-studio
Exec=timeline-studio %F
Categories=AudioVideo;Video;AudioVideoEditing;
MimeType=video/mp4;video/quicktime;video/x-msvideo;
```

### 2. File Associations
The application registers for common video formats:
- MP4, MOV, AVI, MKV
- WebM, OGV
- ProRes, DNxHD

## GPU Acceleration

### 1. NVIDIA (NVENC)
```bash
# Check NVIDIA driver
nvidia-smi

# Install CUDA toolkit (optional, for advanced features)
# Ubuntu
sudo apt install nvidia-cuda-toolkit

# Fedora
sudo dnf install cuda
```

### 2. AMD (AMF/VAAPI)
```bash
# Install VAAPI drivers
# Ubuntu/Debian
sudo apt install mesa-va-drivers vainfo

# Fedora
sudo dnf install mesa-va-drivers libva-utils

# Verify VAAPI support
vainfo
```

### 3. Intel (QuickSync)
```bash
# Install Intel Media SDK
# Ubuntu/Debian
sudo apt install intel-media-va-driver-non-free

# Verify support
vainfo
```

## Troubleshooting

### Common Issues

#### 1. "error while loading shared libraries"
```bash
# Check missing libraries
ldd Timeline_Studio

# Install missing dependencies
sudo apt-get install -f  # Debian/Ubuntu
sudo dnf install -y      # Fedora
```

#### 2. FFmpeg not found
```bash
# Check FFmpeg installation
ffmpeg -version

# Check pkg-config
pkg-config --libs libavformat

# Set PKG_CONFIG_PATH if needed
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH
```

#### 3. GPU acceleration not working
```bash
# Check GPU drivers
# NVIDIA
nvidia-smi

# AMD
glxinfo | grep "OpenGL renderer"

# Intel
vainfo
```

#### 4. AppImage not running
```bash
# Check FUSE installation
fusermount --version

# Install FUSE if missing
sudo apt install fuse libfuse2  # Ubuntu/Debian
sudo dnf install fuse fuse-libs # Fedora
```

#### 5. Permission issues
```bash
# Fix permissions
chmod +x Timeline_Studio_*.AppImage

# If needed, extract AppImage
./Timeline_Studio_*.AppImage --appimage-extract
./squashfs-root/AppRun
```

## Performance Optimization

### 1. Build Optimizations
```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
strip = true
```

### 2. System Optimizations
```bash
# Increase file watchers limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Set CPU governor to performance
sudo cpupower frequency-set -g performance
```

### 3. Memory Settings
```bash
# Increase memory limits if needed
ulimit -n 4096  # File descriptors
ulimit -s unlimited  # Stack size
```

## Distribution via Package Managers

### 1. Snap (Future)
```yaml
# snapcraft.yaml
name: timeline-studio
version: '0.53.0'
summary: Professional AI-Powered Video Editor
description: |
  Timeline Studio is a modern video editing application
  with AI-powered features and GPU acceleration.

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

### 2. Flatpak (Future)
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
PKGBUILD for Arch User Repository:
```bash
pkgname=timeline-studio
pkgver=0.53.0
pkgrel=1
pkgdesc="Professional AI-Powered Video Editor"
arch=('x86_64')
url="https://timeline.studio"
license=('custom')
depends=('webkit2gtk-4.1' 'gtk3' 'ffmpeg')
source=("$pkgname-$pkgver.tar.gz::https://github.com/chatman-media/timeline-studio/releases/download/v$pkgver/$pkgname-$pkgver.tar.gz")
```

## Security Considerations

### 1. Sandboxing
- AppImage runs in user space
- Flatpak/Snap provide additional sandboxing
- SELinux/AppArmor profiles recommended

### 2. Permissions
The application requires:
- File system access (for media files)
- Network access (for updates and AI features)
- GPU access (for acceleration)
- Audio device access (for recording)

---

[← Back to Deployment](../README.md)