# Timeline Studio macOS Build Guide

This guide provides detailed instructions for building Timeline Studio on macOS.

## Requirements

### 1. Xcode Command Line Tools
```bash
xcode-select --install
```

### 2. Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. Node.js and Bun
```bash
# Install Node.js
brew install node@18

# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### 4. Rust
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add to PATH
source $HOME/.cargo/env
```

### 5. FFmpeg and ONNX Runtime
```bash
# Install FFmpeg
brew install ffmpeg

# Install ONNX Runtime
brew install onnxruntime

# Add to shell profile (~/.zshrc or ~/.bash_profile)
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
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

# Build universal binary (Intel + Apple Silicon)
bun run tauri build --target universal-apple-darwin
```

## Code Signing and Notarization

### 1. Developer Certificate
1. Enroll in Apple Developer Program
2. Create Developer ID Application certificate
3. Install certificate in Keychain

### 2. Configure Signing
```json
// tauri.conf.json
{
  "bundle": {
    "macOS": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)",
      "providerShortName": "TEAM_ID"
    }
  }
}
```

### 3. Environment Variables
```bash
# Apple ID for notarization
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

### 4. Notarization Process
```bash
# Build and sign
bun run tauri build

# Notarize (automatic with Tauri)
# The build process will handle notarization if credentials are set
```

## Distribution

### 1. DMG Creation
The build process automatically creates:
- `.app` bundle in `target/release/bundle/macos/`
- `.dmg` installer in `target/release/bundle/dmg/`

### 2. App Store Distribution (Future)
Requirements:
- App Store Connect account
- App Store distribution certificate
- Provisioning profiles

## Troubleshooting

### Common Issues

#### 1. "Developer cannot be verified" error
- App needs to be notarized
- Check Apple Developer certificate is valid
- Ensure notarization credentials are correct

#### 2. FFmpeg linking errors
```bash
# Check FFmpeg installation
brew list ffmpeg

# Reinstall if needed
brew reinstall ffmpeg

# Check pkg-config
pkg-config --libs libavformat
```

#### 3. ONNX Runtime not found
```bash
# Check installation
ls -la /opt/homebrew/lib/libonnxruntime.dylib

# Set environment variable
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

#### 4. Universal binary issues
```bash
# Check architectures
lipo -info target/release/bundle/macos/Timeline\ Studio.app/Contents/MacOS/Timeline\ Studio

# Should show: x86_64 arm64
```

## Performance Optimization

### 1. Build Flags
```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
```

### 2. macOS Specific Optimizations
- Enable Metal for GPU acceleration
- Use VideoToolbox for hardware encoding
- Optimize for Apple Silicon when possible

### 3. Bundle Size Reduction
- Strip debug symbols
- Compress resources
- Use asset catalogs for images

## Security Considerations

### 1. Hardened Runtime
Enable in tauri.conf.json:
```json
{
  "bundle": {
    "macOS": {
      "hardenedRuntime": true,
      "entitlements": "entitlements.plist"
    }
  }
}
```

### 2. Entitlements
Create `entitlements.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
</dict>
</plist>
```

## Testing

### 1. Local Testing
```bash
# Test the .app bundle
open target/release/bundle/macos/Timeline\ Studio.app

# Test the .dmg
open target/release/bundle/dmg/Timeline\ Studio_*.dmg
```

### 2. TestFlight (Future)
- Upload to App Store Connect
- Distribute to beta testers
- Collect crash reports and feedback

---

[← Back to Deployment](../README.md)