# Development Environment Setup

[← Back to Developer Guide](README.md)

## 📋 Contents

- [System Requirements](#system-requirements)
- [Installing Dependencies](#installing-dependencies)
- [IDE Setup](#ide-setup)
- [Environment Variables](#environment-variables)
- [First Run](#first-run)
- [Troubleshooting](#troubleshooting)

## 🖥️ System Requirements

### Minimum Requirements

- **Operating System**: Windows 10+, macOS 12+, Ubuntu 20.04+
- **Processor**: 4-core CPU
- **Memory**: 8 GB RAM
- **Disk**: 10 GB free space
- **GPU**: OpenGL 3.3 support

### Recommended Requirements

- **Processor**: 8-core CPU
- **Memory**: 16 GB RAM
- **GPU**: Discrete graphics card with NVENC/AMF/QuickSync support
- **Disk**: SSD with 20 GB free space

## 🔧 Installing Dependencies

### 1. Node.js and Bun

```bash
# Install Node.js 18+
# macOS
brew install node@18

# Windows (via Chocolatey)
choco install nodejs

# Linux
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### 2. Rust and Cargo

```bash
# Install Rust (all platforms)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Update to latest version
rustup update

# Install required targets
rustup target add wasm32-unknown-unknown
```

### 3. System Dependencies

#### macOS

```bash
# Xcode Command Line Tools
xcode-select --install

# FFmpeg and ONNX Runtime
brew install ffmpeg onnxruntime

# Export environment variables
echo 'export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib' >> ~/.zshrc
source ~/.zshrc
```

#### Windows

```powershell
# Visual Studio 2022 with C++ tools
# Download and install from https://visualstudio.microsoft.com/

# FFmpeg (option 1 - via vcpkg)
git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg
.\bootstrap-vcpkg.bat
.\vcpkg integrate install
.\vcpkg install ffmpeg:x64-windows

# FFmpeg (option 2 - prebuilt libraries)
# Download from https://www.gyan.dev/ffmpeg/builds/
# Extract to C:\ffmpeg
[System.Environment]::SetEnvironmentVariable('FFMPEG_DIR', 'C:\ffmpeg', 'User')
[System.Environment]::SetEnvironmentVariable('PKG_CONFIG_PATH', 'C:\ffmpeg\lib\pkgconfig', 'User')

# pkg-config
choco install pkgconfiglite
```

#### Linux (Ubuntu/Debian)

```bash
# Core build tools
sudo apt update
sudo apt install -y \
  build-essential \
  pkg-config \
  libssl-dev

# GTK and WebKit for Tauri
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
# Download from https://github.com/microsoft/onnxruntime/releases
# Install to /usr/local/lib
```

### 4. Cloning the Repository

```bash
# Clone
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio

# Install dependencies
bun install

# Install Rust dependencies
cd src-tauri
cargo fetch
cd ..
```

## 💻 IDE Setup

### Visual Studio Code

1. Install recommended extensions:

```bash
# Automatic installation
cat .vscode/extensions.json | jq -r '.recommendations[]' | xargs -L 1 code --install-extension
```

Or manually:
- `rust-lang.rust-analyzer` - Rust support
- `tauri-apps.tauri-vscode` - Tauri integration
- `bradlc.vscode-tailwindcss` - Tailwind CSS IntelliSense
- `dbaeumer.vscode-eslint` - ESLint
- `esbenp.prettier-vscode` - Prettier

2. Project settings (already included in `.vscode/settings.json`):

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

1. Install plugins:
   - Rust
   - Tailwind CSS
   - Prettier

2. Configure formatting:
   - Settings → Editor → Code Style → TypeScript
   - Enable "Use semicolons" and "Use single quotes"

## 🔐 Environment Variables

### 1. Create `.env.local` file

```bash
cp .env.example .env.local
```

### 2. Required Variables

```env
# API keys (optional, for AI features)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# FFmpeg paths (for macOS/Linux)
FFMPEG_DIR=/usr/local/bin
PKG_CONFIG_PATH=/usr/local/lib/pkgconfig

# ONNX Runtime (for macOS)
ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

### 3. Platform-specific Settings

#### macOS
```bash
# Variables are loaded automatically from .env.local
# Or use:
source .env.macos
```

#### Windows
```powershell
# Run before building
.\scripts\setup-rust-env-windows.ps1
```

## 🚀 First Run

### 1. Verify Installation

```bash
# Check versions
node --version    # >= 18.0.0
bun --version     # >= 1.0.0
rustc --version   # >= 1.81.0
cargo --version   # >= 1.81.0

# Check Tauri CLI
bunx tauri --version
```

### 2. Run in Development Mode

```bash
# Preparation (first time only)
bun run prepare

# Run application
bun run tauri dev

# Or frontend only
bun run dev
```

### 3. Verify Functionality

After launch:
1. Application window will open
2. Check console for errors
3. Try importing a test video
4. Open DevTools (Cmd/Ctrl + Shift + I)

## 🔧 Troubleshooting

### "Module not found" Errors

```bash
# Clear cache
rm -rf node_modules bun.lockb
bun install --force
```

### Rust Compilation Errors

```bash
# Clean and rebuild
cd src-tauri
cargo clean
cargo build
cd ..
```

### FFmpeg Not Found

```bash
# macOS/Linux
which ffmpeg  # Should show path

# Windows
where ffmpeg  # Should show path

# If not found, check environment variables
echo $FFMPEG_DIR
echo $PKG_CONFIG_PATH
```

### ONNX Runtime Errors

```bash
# macOS
# Ensure path is correct
ls -la $ORT_DYLIB_PATH

# Reinstall
brew reinstall onnxruntime
```

### Tauri Commands Not Working

1. Check registration in `src-tauri/src/main.rs`
2. Ensure command name is in snake_case
3. Verify argument types

### Slow Build

```bash
# Use sccache for Rust caching
cargo install sccache
export RUSTC_WRAPPER=sccache

# Parallel build
export CARGO_BUILD_JOBS=8
```

## 📚 Additional Resources

- [Tauri Prerequisites](https://tauri.app/v2/guides/prerequisites)
- [Rust Getting Started](https://www.rust-lang.org/learn/get-started)
- [Bun Documentation](https://bun.sh/docs)
- [FFmpeg Compilation Guide](https://trac.ffmpeg.org/wiki/CompilationGuide)

---

[← Back to Developer Guide](README.md) | [Next: Coding Standards →](coding-standards.md)