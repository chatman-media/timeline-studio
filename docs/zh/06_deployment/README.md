# Deployment

## 📋 Contents

This section contains documentation for building and deploying Timeline Studio.

### 🏗️ Building the Application
- [**build-guide.md**](build-guide.md) - Application build guide for all platforms

### 🔐 OAuth Setup
- [**oauth-setup.md**](oauth-setup.md) - OAuth authorization setup for social networks

### 💻 Platforms
- [**platforms/windows.md**](platforms/windows.md) - Windows build specifics

## 🚀 Deployment Process

### 1. Build Preparation

```bash
# Install dependencies
bun install

# Check configuration
bun run check:all

# Build frontend
bun run build
```

### 2. Platform Builds

#### macOS
```bash
bun run tauri build --target universal-apple-darwin
```

#### Windows
```bash
bun run tauri build --target x86_64-pc-windows-msvc
```

#### Linux
```bash
bun run tauri build --target x86_64-unknown-linux-gnu
```

### 3. Signing and Notarization

- **macOS**: Apple Developer certificate required
- **Windows**: Code signing certificate required
- **Linux**: AppImage automatically ready for distribution

## 📦 Distribution Formats

### macOS
- `.dmg` - Disk Image for installation
- `.app` - Application bundle

### Windows
- `.msi` - Windows Installer
- `.exe` - Portable version

### Linux
- `.AppImage` - Universal format
- `.deb` - For Debian/Ubuntu
- `.rpm` - For Fedora/RHEL

## 🔧 Configuration

### Environment Variables
```env
# Build
TAURI_PRIVATE_KEY=path/to/key
TAURI_KEY_PASSWORD=password

# Signing
APPLE_ID=your@email.com
APPLE_PASSWORD=app-specific-password
APPLE_TEAM_ID=XXXXXXXXXX

# Windows
WINDOWS_CERTIFICATE=path/to/cert.pfx
WINDOWS_CERTIFICATE_PASSWORD=password
```

## 🌐 Distribution

### Official Channels
- GitHub Releases
- Official website
- App stores (planned)

### Auto-update
- Built-in update mechanism
- Delta updates for traffic savings
- Rollback on error

## 🔗 Related Sections

- [CI/CD](../13_ci_cd/) - Continuous Integration and Delivery
- [Development](../05_development/) - Developer guide
- [Testing](../12_testing/) - Testing processes

---

*Last updated: July 31, 2025*