# Installation Guide

[← Back to section](README.md) | [← To contents](../README.md)

## 📋 Contents

- [System Requirements](#system-requirements)
- [Installation by Platform](#installation-by-platform)
  - [macOS](#macos)
  - [Windows](#windows)
  - [Linux](#linux)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## 📊 System Requirements

### Minimum Requirements
- **OS**: macOS 10.15+, Windows 10+, Linux (Ubuntu 20.04+)
- **Processor**: 4 cores, 2.0 GHz
- **Memory**: 8 GB RAM
- **Storage**: 2 GB free space
- **GPU**: OpenGL 3.3 support

### Recommended Requirements
- **Processor**: 8+ cores, 3.0+ GHz
- **Memory**: 16+ GB RAM
- **GPU**: Discrete graphics card with 4+ GB VRAM
- **Storage**: SSD with 10+ GB free space

## 🛠️ Required Tools

### 1. Node.js and Bun
- **Node.js** version 18 or higher
- **Bun** - fast JavaScript runtime and package manager

### 2. Rust
- **Rust** version 1.81.0 or higher
- Cargo (installed with Rust)

### 3. FFmpeg
- **FFmpeg** with development libraries
- Required for video processing

### 4. ONNX Runtime (optional)
- Required for object recognition features
- Can be skipped for basic functionality

### 5. Additional Tools

#### For Development
- **Git** - version control system
- **pkg-config** - for finding libraries during compilation

#### For Windows
- **Visual Studio 2022** - with C++ workload
- **Windows SDK** - for native development
- **pkg-config** - via chocolatey or vcpkg

#### For Linux
- **build-essential** - basic build tools
- **libssl-dev** - for cryptography
- **GTK3 and WebKit2GTK** - for Tauri UI

## 🍎 macOS

### Automatic Installation (recommended)

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install all dependencies
brew install node rust ffmpeg onnxruntime

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Set up environment variables for different shells

## For Zsh (default on macOS)
echo 'export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib' >> ~/.zshrc
source ~/.zshrc

## For Bash
echo 'export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib' >> ~/.bashrc
source ~/.bashrc

## For Fish
echo 'set -gx ORT_DYLIB_PATH /opt/homebrew/lib/libonnxruntime.dylib' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish

# FFmpeg development setup (optional)
# Only needed if you encounter build issues

## For Apple Silicon (M1/M2/M3)
export FFMPEG_DIR=/opt/homebrew/opt/ffmpeg
export PKG_CONFIG_PATH=/opt/homebrew/opt/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH

## For Intel Mac
export FFMPEG_DIR=/usr/local/opt/ffmpeg
export PKG_CONFIG_PATH=/usr/local/opt/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH
```

### Manual Installation

1. **Node.js**: Download from [nodejs.org](https://nodejs.org/)
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

### Prerequisites
- Visual Studio 2022 with "Desktop development with C++" workload
- Windows SDK

### Installation via Chocolatey

```powershell
# Install Chocolatey (run PowerShell as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies
choco install nodejs rust ffmpeg git pkgconfiglite

# Install Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# Install vcpkg for C++ library management
git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg
.\bootstrap-vcpkg.bat
.\vcpkg integrate install
```

### Manual Installation

1. **Visual Studio 2022**: [visualstudio.microsoft.com](https://visualstudio.microsoft.com/)
2. **Node.js**: [nodejs.org](https://nodejs.org/)
3. **Rust**: [rustup.rs](https://rustup.rs/)
4. **FFmpeg**: 
   - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Extract to `C:\ffmpeg`
   - Add `C:\ffmpeg\bin` to PATH

### ONNX Runtime Setup (Windows)

```powershell
# Download ONNX Runtime from official website
# Extract to C:\onnxruntime
# Add to environment variables:
[Environment]::SetEnvironmentVariable("ORT_DYLIB_PATH", "C:\onnxruntime\lib\onnxruntime.dll", "User")
```

## 🐧 Linux

### Ubuntu/Debian

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install basic tools
sudo apt install -y curl build-essential pkg-config libssl-dev

# Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# FFmpeg and required libraries
sudo apt install -y ffmpeg libavcodec-dev libavformat-dev \
  libavutil-dev libavfilter-dev libavdevice-dev \
  libswscale-dev libswresample-dev

# Additional dependencies for Tauri
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev librsvg2-dev

# Bun
curl -fsSL https://bun.sh/install | bash

# ONNX Runtime (optional)
sudo apt install -y libonnxruntime-dev

# Set up environment variables
## For Bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

## For Zsh
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

## For Fish
echo 'set -gx PATH "$HOME/.bun/bin" $PATH' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

### Fedora

```bash
# Install development tools
sudo dnf groupinstall -y "Development Tools" "C Development Tools and Libraries"

# Node.js
sudo dnf install -y nodejs

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# FFmpeg
sudo dnf install -y ffmpeg ffmpeg-devel

# Tauri dependencies
sudo dnf install -y gtk3-devel webkit2gtk4.1-devel \
  libappindicator-gtk3-devel librsvg2-devel
```

### Arch Linux

```bash
# Install all dependencies
sudo pacman -S --needed base-devel nodejs npm rust ffmpeg \
  gtk3 webkit2gtk-4.1 libayatana-appindicator librsvg

# Bun via AUR
yay -S bun-bin
```

## ✅ Verification

Run the following commands to verify installation:

```bash
# Node.js
node --version  # Should be 18.0.0 or higher
npm --version   # Check npm

# Bun
bun --version   # Any latest version

# Rust
rustc --version # Should be 1.81.0 or higher
cargo --version # Check Cargo

# FFmpeg
ffmpeg -version # Should display version info

# Git
git --version   # Version control system

# pkg-config
pkg-config --version # For finding libraries

# ONNX Runtime (optional)
# macOS/Linux
echo $ORT_DYLIB_PATH
# Windows
echo %ORT_DYLIB_PATH%

# Check Tauri CLI (after project installation)
cargo tauri --version
```

## 🚨 Troubleshooting

### macOS: "xcrun: error: invalid active developer path"
```bash
xcode-select --install
```

### Windows: "cargo not found"
- Restart terminal after installing Rust
- Ensure `%USERPROFILE%\.cargo\bin` is added to PATH

### Linux: "error while loading shared libraries"
```bash
# Update dynamic library cache
sudo ldconfig
```

### FFmpeg not found
- Ensure FFmpeg path is added to PATH variable
- Restart terminal

### ONNX Runtime errors
- This is an optional dependency, you can continue without it
- For full functionality, follow instructions for your OS

### Bun: "command not found"
```bash
# Restart terminal or run:
# Bash/Zsh
source ~/.bashrc  # or ~/.zshrc
# Fish
source ~/.config/fish/config.fish
```

### Windows: FFmpeg compilation errors
- Ensure Visual Studio 2022 with C++ tools is installed
- Check FFMPEG_DIR and PKG_CONFIG_PATH environment variables
- Use vcpkg to install FFmpeg: `vcpkg install ffmpeg:x64-windows`

### Linux: Error "webkit2gtk-4.1 not found"
```bash
# Ubuntu 22.04+
sudo apt install libwebkit2gtk-4.1-dev
# For older versions use webkit2gtk-4.0
sudo apt install libwebkit2gtk-4.0-dev
```

### macOS: Apple Silicon issues
- Ensure all tools are installed for arm64 architecture
- Use Homebrew for arm64: `/opt/homebrew` instead of `/usr/local`

## 📌 Next Steps

After successful installation of all dependencies:

1. [Clone repository and set up project](quick-start.md)
2. [Learn project structure](project-structure.md)
3. [Run application in development mode](../05_development/setup.md)

---

[← Back to section](README.md) | [Next: Quick Start →](quick-start.md)