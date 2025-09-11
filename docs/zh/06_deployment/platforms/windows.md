# Timeline Studio Windows Build Guide

This guide provides detailed instructions for building Timeline Studio on Windows.

## Requirements

### 1. Visual Studio 2022
- Install Visual Studio 2022 with the following workloads:
  - Desktop development with C++
  - Windows SDK (latest version)
  - MSVC v143 - VS 2022 C++ x64/x86 build tools

### 2. Rust
```powershell
# Install Rust from https://rustup.rs/
# Make sure MSVC toolchain is installed
rustup default stable-msvc
```

### 3. Node.js and Bun
- Install Node.js 18+ from https://nodejs.org/
- Install Bun:
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

### 4. FFmpeg Setup (choose one option)

#### Option A: Using vcpkg (recommended for CI/CD)
```powershell
# Clone vcpkg
git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg

# Initialize vcpkg
.\bootstrap-vcpkg.bat

# Integrate with MSBuild/Visual Studio
.\vcpkg integrate install

# Install FFmpeg
.\vcpkg install ffmpeg:x64-windows

# Set environment variable
[System.Environment]::SetEnvironmentVariable("VCPKG_ROOT", "C:\vcpkg", "User")
```

#### Option B: Pre-built FFmpeg Libraries
1. Download FFmpeg shared libraries from https://www.gyan.dev/ffmpeg/builds/
   - Choose "release full-shared" build
2. Extract to `C:\ffmpeg`
3. Set environment variables:
```powershell
[System.Environment]::SetEnvironmentVariable("FFMPEG_DIR", "C:\ffmpeg", "User")
[System.Environment]::SetEnvironmentVariable("PKG_CONFIG_PATH", "C:\ffmpeg\lib\pkgconfig", "User")
[System.Environment]::SetEnvironmentVariable("PATH", "$env:PATH;C:\ffmpeg\bin", "User")
```

### 5. pkg-config for Windows
```powershell
# Using Chocolatey
choco install pkgconfiglite

# Or download from http://ftp.gnome.org/pub/gnome/binaries/win32/dependencies/
# Extract and add to PATH
```

### 6. ONNX Runtime (for recognition features)
```powershell
# Download ONNX Runtime from https://github.com/microsoft/onnxruntime/releases
# Extract to C:\onnxruntime
# Set environment variable
[System.Environment]::SetEnvironmentVariable("ORT_DYLIB_PATH", "C:\onnxruntime\lib\onnxruntime.dll", "User")
```

## Building Timeline Studio

### 1. Clone Repository
```powershell
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

### 2. Install Dependencies
```powershell
bun install
```

### 3. Build Application
```powershell
# Development build
bun run tauri dev

# Production build
bun run tauri build
```

## Troubleshooting

### FFmpeg Build Errors
If you encounter errors like "Could not find ffmpeg with vcpkg", ensure:
1. vcpkg is properly installed and integrated
2. Environment variables are set correctly
3. You've restarted terminal/PowerShell after setting environment variables

### pkg-config not found
Make sure pkg-config is in your PATH:
```powershell
where pkg-config
# Should return path to pkg-config.exe
```

### MSVC Toolchain Issues
Ensure you're using the correct Rust toolchain:
```powershell
rustup show
# Should show stable-x86_64-pc-windows-msvc as default
```

## CI/CD Configuration

For GitHub Actions or other CI systems, use these environment variables:
```yaml
env:
  VCPKG_ROOT: C:\vcpkg
  FFMPEG_DIR: C:\ffmpeg
  PKG_CONFIG_PATH: C:\ffmpeg\lib\pkgconfig
  ORT_DYLIB_PATH: C:\onnxruntime\lib\onnxruntime.dll
```

## Alternative: Using MSYS2
If the above methods don't work, you can try MSYS2:
```bash
# Install MSYS2 from https://www.msys2.org/
# In MSYS2 terminal:
pacman -S mingw-w64-x86_64-ffmpeg mingw-w64-x86_64-pkg-config
```

Then build with GNU toolchain:
```powershell
rustup default stable-gnu
```