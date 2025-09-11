# CI/CD Setup for Timeline Studio

This document provides instructions for setting up continuous integration and deployment for Timeline Studio.

*Updated: August 3, 2025 for alpha release v0.60.0*

## 🚀 Alpha Release Changes

- **Migration to Biome** - replaced ESLint for linting and formatting
- **TypeScript checking disabled** - ~1860 errors, will be fixed before Beta
- **Windows build optimization** - pre-built FFmpeg libraries instead of vcpkg
- **New workflow** - `alpha-release.yml` for automated alpha builds

## CI/CD Setup for Windows

### GitHub Actions Configuration

To build for Windows in GitHub Actions, add the following setup steps before building:

```yaml
- name: Install FFmpeg and dependencies (Windows)
  if: runner.os == 'Windows'
  run: |
    # Install vcpkg
    git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
    C:\vcpkg\bootstrap-vcpkg.bat
    C:\vcpkg\vcpkg.exe integrate install
    
    # Install FFmpeg
    C:\vcpkg\vcpkg.exe install ffmpeg:x64-windows
    
    # Install pkg-config
    choco install pkgconfiglite
    
    # Set environment variables
    echo "VCPKG_ROOT=C:\vcpkg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append

- name: Build Tauri application
  env:
    VCPKG_ROOT: C:\vcpkg
  run: |
    bun run tauri build
```

### Alternative: Pre-built Dependencies

If vcpkg installation is too slow, you can use pre-built FFmpeg:

```yaml
- name: Setup FFmpeg (Windows - Fast)
  if: runner.os == 'Windows'
  run: |
    # Download pre-built FFmpeg
    Invoke-WebRequest -Uri "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl-shared.zip" -OutFile "ffmpeg.zip"
    Expand-Archive -Path "ffmpeg.zip" -DestinationPath "C:\"
    Rename-Item "C:\ffmpeg-master-latest-win64-gpl-shared" "C:\ffmpeg"
    
    # Download pkg-config
    Invoke-WebRequest -Uri "https://download.gnome.org/binaries/win64/dependencies/pkg-config_0.26-1_win64.zip" -OutFile "pkg-config.zip"
    Expand-Archive -Path "pkg-config.zip" -DestinationPath "C:\pkg-config"
    
    # Set environment variables
    echo "FFMPEG_DIR=C:\ffmpeg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
    echo "PKG_CONFIG_PATH=C:\ffmpeg\lib\pkgconfig" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
    echo "C:\ffmpeg\bin" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append
    echo "C:\pkg-config\bin" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append
```

## CI/CD Setup for macOS

```yaml
- name: Install FFmpeg (macOS)
  if: runner.os == 'macOS'
  run: |
    brew install ffmpeg pkg-config
```

## CI/CD Setup for Linux

```yaml
- name: Install FFmpeg (Linux)
  if: runner.os == 'Linux'
  run: |
    sudo apt-get update
    sudo apt-get install -y \
      ffmpeg \
      libavcodec-dev \
      libavformat-dev \
      libavutil-dev \
      libavfilter-dev \
      libavdevice-dev \
      libswscale-dev \
      libswresample-dev \
      pkg-config \
      libgtk-3-dev \
      libwebkit2gtk-4.1-dev \
      build-essential \
      libssl-dev \
      libayatana-appindicator3-dev \
      librsvg2-dev

# IMPORTANT: For ffmpeg-sys-next to work correctly, environment variables must be set
- name: Setup Rust with FFmpeg (Linux)
  if: runner.os == 'Linux'
  env:
    PKG_CONFIG_PATH: /usr/lib/x86_64-linux-gnu/pkgconfig:/usr/lib/pkgconfig:/usr/share/pkgconfig
    PKG_CONFIG_ALLOW_SYSTEM_LIBS: 1
    PKG_CONFIG_ALLOW_SYSTEM_CFLAGS: 1
  run: |
    cargo build
```

### pkg-config Issue on Linux

When building on Linux, you often encounter this error:
```
The system library `libavutil` required by crate `ffmpeg-sys-next` was not found.
```

This happens because pkg-config cannot find the `.pc` files for FFmpeg libraries. Solution:

1. **Set all environment variables for each Rust command:**
   ```yaml
   env:
     PKG_CONFIG_PATH: /usr/lib/x86_64-linux-gnu/pkgconfig:/usr/lib/pkgconfig:/usr/share/pkgconfig
     PKG_CONFIG_ALLOW_SYSTEM_LIBS: 1
     PKG_CONFIG_ALLOW_SYSTEM_CFLAGS: 1
   ```

2. **Verify FFmpeg installation:**
   ```bash
   # Find .pc files
   find /usr -name "libavutil.pc" 2>/dev/null
   
   # Check pkg-config operation
   PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig pkg-config --libs --cflags libavutil
   ```

## Complete GitHub Actions Workflow Example

```yaml
name: Build and Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Setup Bun
      uses: oven-sh/setup-bun@v1

    - name: Setup Rust
      uses: dtolnay/rust-toolchain@stable

    - name: Install FFmpeg (Linux)
      if: runner.os == 'Linux'
      run: |
        sudo apt-get update
        sudo apt-get install -y \
          ffmpeg \
          libavcodec-dev \
          libavformat-dev \
          libavutil-dev \
          libavfilter-dev \
          libavdevice-dev \
          libswscale-dev \
          libswresample-dev \
          pkg-config \
          libgtk-3-dev \
          libwebkit2gtk-4.1-dev \
          build-essential \
          libssl-dev \
          libayatana-appindicator3-dev \
          librsvg2-dev

    - name: Install FFmpeg (macOS)
      if: runner.os == 'macOS'
      run: |
        brew install ffmpeg pkg-config

    - name: Install FFmpeg (Windows)
      if: runner.os == 'Windows'
      run: |
        # Using vcpkg for reliable build
        git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
        C:\vcpkg\bootstrap-vcpkg.bat
        C:\vcpkg\vcpkg.exe integrate install
        C:\vcpkg\vcpkg.exe install ffmpeg:x64-windows
        choco install pkgconfiglite
        echo "VCPKG_ROOT=C:\vcpkg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append

    - name: Install dependencies
      run: bun install

    - name: Run tests
      run: bun run test

    - name: Run Rust tests (Linux)
      if: runner.os == 'Linux'
      working-directory: src-tauri
      env:
        PKG_CONFIG_PATH: /usr/lib/x86_64-linux-gnu/pkgconfig:/usr/lib/pkgconfig:/usr/share/pkgconfig
        PKG_CONFIG_ALLOW_SYSTEM_LIBS: 1
        PKG_CONFIG_ALLOW_SYSTEM_CFLAGS: 1
      run: cargo test

    - name: Run Rust tests (non-Linux)
      if: runner.os != 'Linux'
      working-directory: src-tauri
      run: cargo test

    - name: Build application
      env:
        VCPKG_ROOT: ${{ runner.os == 'Windows' && 'C:\vcpkg' || '' }}
        PKG_CONFIG_PATH: ${{ runner.os == 'Linux' && '/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/lib/pkgconfig:/usr/share/pkgconfig' || '' }}
        PKG_CONFIG_ALLOW_SYSTEM_LIBS: ${{ runner.os == 'Linux' && '1' || '' }}
        PKG_CONFIG_ALLOW_SYSTEM_CFLAGS: ${{ runner.os == 'Linux' && '1' || '' }}
      run: bun run tauri build
```

## Alternative with Docker

For more consistent builds, consider using Docker:

```dockerfile
# Windows Server Core with FFmpeg
FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Install dependencies
RUN powershell -Command \
    Set-ExecutionPolicy Bypass -Scope Process -Force; \
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; \
    iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

RUN choco install -y nodejs rust ffmpeg pkgconfiglite

# Set working directory
WORKDIR C:\timeline-studio

# Copy source code
COPY . .

# Build
RUN bun install && bun run tauri build
```

## Troubleshooting CI Issues

### 1. "ffmpeg-sys-next build failed" on Linux
- **Problem**: pkg-config cannot find `.pc` files for FFmpeg
- **Solution**: Set environment variables for all Rust commands:
  ```yaml
  env:
    PKG_CONFIG_PATH: /usr/lib/x86_64-linux-gnu/pkgconfig:/usr/lib/pkgconfig:/usr/share/pkgconfig
    PKG_CONFIG_ALLOW_SYSTEM_LIBS: 1
    PKG_CONFIG_ALLOW_SYSTEM_CFLAGS: 1
  ```
- **Verification**: Run `pkg-config --libs --cflags libavutil` for diagnostics

### 2. "ffmpeg-sys-next build failed" on Windows
- Ensure vcpkg is properly integrated
- Verify environment variables are set correctly
- Make sure pkg-config is in PATH

### 3. "Could not find Vcpkg tree"
- Set the VCPKG_ROOT environment variable
- Run vcpkg integrate install
- Restart the build

### 4. "pkg-config command could not be found"
- Install pkgconfiglite on Windows
- Add pkg-config to PATH
- Set PKG_CONFIG_PATH for FFmpeg libraries

### 5. Build Timeout
- Consider using pre-built FFmpeg instead of vcpkg
- Cache vcpkg installation between builds
- Use matrix strategy for parallel builds