# Timeline Studio Deployment Guide

## Prerequisites

- Node.js 18+ and Bun
- Rust 1.81.0+
- Platform-specific tools:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio 2022 with C++ tools
  - **Linux**: `build-essential`, `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`

## Development Setup

### 1. Install Dependencies
```bash
# Install frontend dependencies
bun install

# Install Tauri CLI
cargo install tauri-cli
```

### 2. Install System Dependencies

#### FFmpeg (required for video processing)
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libswscale-dev libswresample-dev pkg-config

# Windows
choco install ffmpeg
```

#### ONNX Runtime (for Recognition features)
```bash
# macOS
brew install onnxruntime

# Add to your shell profile:
# For bash/zsh (~/.zshrc or ~/.bashrc):
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib

# For fish (~/.config/fish/config.fish):
set -gx ORT_DYLIB_PATH /opt/homebrew/lib/libonnxruntime.dylib

# Ubuntu/Debian
ONNX_VERSION="1.19.2"
wget https://github.com/microsoft/onnxruntime/releases/download/v${ONNX_VERSION}/onnxruntime-linux-x64-${ONNX_VERSION}.tgz
sudo tar -xzf onnxruntime-linux-x64-${ONNX_VERSION}.tgz -C /opt/
sudo ln -sf /opt/onnxruntime-linux-x64-${ONNX_VERSION}/lib/libonnxruntime.so.${ONNX_VERSION} /usr/local/lib/libonnxruntime.so
sudo ldconfig

# Windows
# Download from https://github.com/microsoft/onnxruntime/releases
```

### 3. Development Mode
```bash
# Run in development
bun run tauri dev

# Run frontend only
bun run dev

# Run tests
bun run test
```

## Building for Production

### Universal Build Command
```bash
# Build for current platform
bun run tauri build
```

### Platform-Specific Builds

#### macOS
```bash
# Intel Mac
bun run tauri build --target x86_64-apple-darwin

# Apple Silicon
bun run tauri build --target aarch64-apple-darwin

# Universal Binary
bun run tauri build --target universal-apple-darwin
```

#### Windows
```bash
# 64-bit
bun run tauri build --target x86_64-pc-windows-msvc

# 32-bit
bun run tauri build --target i686-pc-windows-msvc
```

#### Linux
```bash
# AppImage (recommended)
bun run tauri build --target x86_64-unknown-linux-gnu

# Debian package
bun run tauri build --target x86_64-unknown-linux-gnu -- --bundles deb

# RPM package
bun run tauri build --target x86_64-unknown-linux-gnu -- --bundles rpm
```

## Code Signing

### macOS
1. Create a Developer ID certificate in Apple Developer account
2. Install certificate in Keychain
3. Configure in `tauri.conf.json`:
```json
{
  "tauri": {
    "bundle": {
      "macOS": {
        "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
        "providerShortName": "TEAM_ID"
      }
    }
  }
}
```

### Windows
1. Obtain a code signing certificate
2. Use signtool:
```bash
signtool sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /a "Timeline Studio.exe"
```

## Distribution

### macOS
1. **Notarization** (required for distribution outside App Store):
```bash
# Notarize the app
xcrun notarytool submit Timeline\ Studio.dmg --apple-id YOUR_APPLE_ID --password YOUR_APP_PASSWORD --team-id YOUR_TEAM_ID --wait

# Staple the ticket
xcrun stapler staple Timeline\ Studio.dmg
```

2. **Mac App Store** (optional):
- Configure App Store Connect
- Update bundle identifier
- Submit for review

### Windows
1. **Microsoft Store** (optional):
- Package as MSIX
- Submit through Partner Center

2. **Direct Distribution**:
- Use NSIS installer
- Sign the installer

### Linux
1. **Snap Store**:
```bash
snapcraft
snapcraft upload timeline-studio_*.snap
```

2. **Flatpak**:
- Create flatpak manifest
- Submit to Flathub

## Auto-Updates

### Configure Update Server
1. Set up update server (e.g., GitHub Releases)
2. Configure in `tauri.conf.json`:
```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/your-org/timeline-studio/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

### Generate Update Keys
```bash
# Generate keypair
cargo tauri signer generate -w ~/.tauri/timeline-studio.key

# Get public key
cargo tauri signer sign -k ~/.tauri/timeline-studio.key
```

## CI/CD with GitHub Actions

### Build Workflow
```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install dependencies
        run: |
          npm install -g bun
          bun install
      
      - name: Build
        run: bun run tauri build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
```

## Environment Variables

### Required for Production
```bash
# API Keys (if using AI features)
NEXT_PUBLIC_OPENAI_API_KEY=your_key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your_id

# Sentry (optional)
SENTRY_DSN=your_dsn
```

### Build-time Variables
```bash
# Version info
TAURI_PRIVATE_KEY=path/to/private.key
TAURI_KEY_PASSWORD=your_password
```

## Optimization Tips

### 1. Reduce Bundle Size
- Enable Rust optimizations in `Cargo.toml`:
```toml
[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
strip = true
```

### 2. Optimize Assets
- Compress images and videos
- Use WebP for images
- Minify JSON files

### 3. Performance
- Enable hardware acceleration
- Use production builds of dependencies
- Profile and optimize critical paths

## Troubleshooting

### Common Issues

1. **Missing dependencies**
   - Ensure all system libraries are installed
   - Check Rust toolchain version

2. **Code signing failures**
   - Verify certificate validity
   - Check keychain access (macOS)

3. **Build failures**
   - Clear cache: `rm -rf target/`
   - Reinstall dependencies

### Debug Builds
```bash
# Build with debug symbols
bun run tauri build --debug

# Verbose output
RUST_LOG=debug bun run tauri build
```

## Monitoring

### Crash Reporting
- Integrate Sentry for error tracking
- Configure in both frontend and backend

### Analytics
- User engagement metrics
- Performance monitoring
- Feature usage tracking

## Security Checklist

- [ ] Code signing configured
- [ ] Auto-updater uses HTTPS
- [ ] API keys not bundled
- [ ] Permissions minimized
- [ ] CSP headers configured
- [ ] Input validation implemented

---

*For platform-specific details, consult the [Tauri documentation](https://tauri.app/v2/guide/).*