# 安装指南

[← 返回章节](README.md) | [← 返回目录](../README.md)

## 📋 目录

- [系统要求](#系统要求)
- [按平台安装](#按平台安装)
  - [macOS](#macos)
  - [Windows](#windows)
  - [Linux](#linux)
- [验证](#验证)
- [故障排除](#故障排除)

## 📊 系统要求

### 最低要求
- **操作系统**: macOS 10.15+, Windows 10+, Linux (Ubuntu 20.04+)
- **处理器**: 4 核心, 2.0 GHz
- **内存**: 8 GB RAM
- **存储**: 2 GB 可用空间
- **GPU**: OpenGL 3.3 支持

### 推荐要求
- **处理器**: 8+ 核心, 3.0+ GHz
- **内存**: 16+ GB RAM
- **GPU**: 独立显卡，4+ GB 显存
- **存储**: SSD，10+ GB 可用空间

## 🛠️ 所需工具

### 1. Node.js 和 Bun
- **Node.js** 版本 18 或更高
- **Bun** - 快速的 JavaScript 运行时和包管理器

### 2. Rust
- **Rust** 版本 1.81.0 或更高
- Cargo（随 Rust 一起安装）

### 3. FFmpeg
- **FFmpeg** 及其开发库
- 视频处理所需

### 4. ONNX Runtime（可选）
- 物体识别功能所需
- 基本功能可跳过

### 5. 附加工具

#### 开发用
- **Git** - 版本控制系统
- **pkg-config** - 编译时查找库

#### Windows 用
- **Visual Studio 2022** - 带 C++ 工作负载
- **Windows SDK** - 原生开发
- **pkg-config** - 通过 chocolatey 或 vcpkg

#### Linux 用
- **build-essential** - 基本构建工具
- **libssl-dev** - 加密功能
- **GTK3 和 WebKit2GTK** - Tauri UI

## 🍎 macOS

### 自动安装（推荐）

```bash
# 安装 Homebrew（如果尚未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装所有依赖
brew install node rust ffmpeg onnxruntime

# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 为不同 shell 设置环境变量

## Zsh（macOS 默认）
echo 'export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib' >> ~/.zshrc
source ~/.zshrc

## Bash
echo 'export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib' >> ~/.bashrc
source ~/.bashrc

## Fish
echo 'set -gx ORT_DYLIB_PATH /opt/homebrew/lib/libonnxruntime.dylib' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish

# FFmpeg 开发设置（可选）
# 仅在遇到构建问题时需要

## Apple Silicon（M1/M2/M3）
export FFMPEG_DIR=/opt/homebrew/opt/ffmpeg
export PKG_CONFIG_PATH=/opt/homebrew/opt/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH

## Intel Mac
export FFMPEG_DIR=/usr/local/opt/ffmpeg
export PKG_CONFIG_PATH=/usr/local/opt/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH
```

### 手动安装

1. **Node.js**: 从 [nodejs.org](https://nodejs.org/) 下载
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

### 前置条件
- Visual Studio 2022 带"使用 C++ 的桌面开发"工作负载
- Windows SDK

### 通过 Chocolatey 安装

```powershell
# 安装 Chocolatey（以管理员身份运行 PowerShell）
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装依赖
choco install nodejs rust ffmpeg git pkgconfiglite

# 安装 Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# 安装 vcpkg 用于 C++ 库管理
git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg
.\bootstrap-vcpkg.bat
.\vcpkg integrate install
```

### 手动安装

1. **Visual Studio 2022**: [visualstudio.microsoft.com](https://visualstudio.microsoft.com/)
2. **Node.js**: [nodejs.org](https://nodejs.org/)
3. **Rust**: [rustup.rs](https://rustup.rs/)
4. **FFmpeg**: 
   - 从 [ffmpeg.org](https://ffmpeg.org/download.html) 下载
   - 解压到 `C:\ffmpeg`
   - 将 `C:\ffmpeg\bin` 添加到 PATH

### ONNX Runtime 设置（Windows）

```powershell
# 从官方网站下载 ONNX Runtime
# 解压到 C:\onnxruntime
# 添加到环境变量：
[Environment]::SetEnvironmentVariable("ORT_DYLIB_PATH", "C:\onnxruntime\lib\onnxruntime.dll", "User")
```

## 🐧 Linux

### Ubuntu/Debian

```bash
# 更新包
sudo apt update && sudo apt upgrade -y

# 安装基本工具
sudo apt install -y curl build-essential pkg-config libssl-dev

# 通过 NodeSource 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# FFmpeg 和所需库
sudo apt install -y ffmpeg libavcodec-dev libavformat-dev \
  libavutil-dev libavfilter-dev libavdevice-dev \
  libswscale-dev libswresample-dev

# Tauri 的附加依赖
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev librsvg2-dev

# Bun
curl -fsSL https://bun.sh/install | bash

# ONNX Runtime（可选）
sudo apt install -y libonnxruntime-dev

# 设置环境变量
## Bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

## Zsh
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

## Fish
echo 'set -gx PATH "$HOME/.bun/bin" $PATH' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

### Fedora

```bash
# 安装开发工具
sudo dnf groupinstall -y "Development Tools" "C Development Tools and Libraries"

# Node.js
sudo dnf install -y nodejs

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# FFmpeg
sudo dnf install -y ffmpeg ffmpeg-devel

# Tauri 依赖
sudo dnf install -y gtk3-devel webkit2gtk4.1-devel \
  libappindicator-gtk3-devel librsvg2-devel
```

### Arch Linux

```bash
# 安装所有依赖
sudo pacman -S --needed base-devel nodejs npm rust ffmpeg \
  gtk3 webkit2gtk-4.1 libayatana-appindicator librsvg

# 通过 AUR 安装 Bun
yay -S bun-bin
```

## ✅ 验证

运行以下命令验证安装：

```bash
# Node.js
node --version  # 应该是 18.0.0 或更高版本
npm --version   # 检查 npm

# Bun
bun --version   # 任何最新版本

# Rust
rustc --version # 应该是 1.81.0 或更高版本
cargo --version # 检查 Cargo

# FFmpeg
ffmpeg -version # 应该显示版本信息

# Git
git --version   # 版本控制系统

# pkg-config
pkg-config --version # 用于查找库

# ONNX Runtime（可选）
# macOS/Linux
echo $ORT_DYLIB_PATH
# Windows
echo %ORT_DYLIB_PATH%

# 检查 Tauri CLI（项目安装后）
cargo tauri --version
```

## 🚨 故障排除

### macOS: "xcrun: error: invalid active developer path"
```bash
xcode-select --install
```

### Windows: "找不到 cargo"
- 安装 Rust 后重启终端
- 确保 `%USERPROFILE%\.cargo\bin` 已添加到 PATH

### Linux: "加载共享库时出错"
```bash
# 更新动态库缓存
sudo ldconfig
```

### 找不到 FFmpeg
- 确保 FFmpeg 路径已添加到 PATH 变量
- 重启终端

### ONNX Runtime 错误
- 这是可选依赖，您可以在没有它的情况下继续
- 要获得完整功能，请按照您操作系统的说明操作

### Bun: "找不到命令"
```bash
# 重启终端或运行：
# Bash/Zsh
source ~/.bashrc  # 或 ~/.zshrc
# Fish
source ~/.config/fish/config.fish
```

### Windows: FFmpeg 编译错误
- 确保安装了带有 C++ 工具的 Visual Studio 2022
- 检查 FFMPEG_DIR 和 PKG_CONFIG_PATH 环境变量
- 使用 vcpkg 安装 FFmpeg: `vcpkg install ffmpeg:x64-windows`

### Linux: 错误 "找不到 webkit2gtk-4.1"
```bash
# Ubuntu 22.04+
sudo apt install libwebkit2gtk-4.1-dev
# 对于旧版本使用 webkit2gtk-4.0
sudo apt install libwebkit2gtk-4.0-dev
```

### macOS: Apple Silicon 问题
- 确保所有工具都为 arm64 架构安装
- 为 arm64 使用 Homebrew: `/opt/homebrew` 而不是 `/usr/local`

## 📌 下一步

成功安装所有依赖后：

1. [克隆仓库并设置项目](quick-start.md)
2. [了解项目结构](project-structure.md)
3. [在开发模式下运行应用](../05_development/setup.md)

---

[← 返回章节](README.md) | [下一步：快速开始 →](quick-start.md)