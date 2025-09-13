# 13. CI/CD

Timeline Studio continuous integration and deployment documentation.

## 📋 Contents

- [ci-cd-setup.md](ci-cd-setup.md) - CI/CD pipeline setup
- [semantic-release.md](semantic-release.md) - Automated versioning and releases
- [codecov-components.md](codecov-components.md) - Code coverage setup

## 🔄 CI/CD Processes

### Continuous Integration
- Automated tests on every commit
- Code quality checks via **Biome** (linting and formatting)
- Cross-platform builds
- Security dependency scanning
- ~1860 TypeScript errors (type checking temporarily disabled)

### Continuous Deployment
- Automated release builds
- Distribution packages for Windows, macOS, Linux
- GitHub Releases publishing
- Documentation updates
- **Alpha Release Workflow** - automated alpha version builds

## 🚀 GitHub Actions Workflows

### Main Workflows
- **ci.yml** - Main CI pipeline
- **quick-check.yml** - Quick validation
- **windows-build.yml** - Specialized Windows build with optimized FFmpeg

### Release Workflows
- **release.yml** - Release creation
- **alpha-release.yml** - Alpha builds on `v*-alpha` tags ✨ NEW
- **nightly.yml** - Nightly builds for testing

### Platform-specific
- **lint-js.yml** - JavaScript/TypeScript checking via Biome
- **lint-rust.yml** - Rust code checking
- **lint-js-windows-bun.yml** - Windows-specific checking with Bun

## 🛠️ Setup

### Local check before push
```bash
# Code checking via Biome
bun run lint

# Fix auto-fixable issues
bun run lint:fix

# Full check (lint + tests)
bun run check:all

# Run tests locally
bun run test:ci
```

### Type checking (temporarily disabled in CI)
```bash
# Local TypeScript check
bun run check:type

# ~1860 errors known, planned fix before Beta
```

## 📦 Alpha Release CI/CD

### Automated alpha builds
1. Create tag: `git tag -a v0.60.0-alpha -m "Alpha Release"`
2. Push tag: `git push origin v0.60.0-alpha`
3. GitHub Actions automatically:
   - Builds for all platforms
   - Creates release marked as "pre-release"
   - Attaches build artifacts

### Tools Used
- **Biome** - unified linting and formatting tool (replaced ESLint)
- **Bun** - fast JavaScript runtime and package manager
- **Tauri v2** - desktop application framework
- **FFmpeg** - video processing (pre-built libraries for Windows)

## 🔧 GitHub Secrets

Required secrets for CI/CD:
- `TAURI_SIGNING_PRIVATE_KEY` - private signing key
- `TAURI_SIGNING_PUBLIC_KEY` - public signing key
- `GITHUB_TOKEN` - automatically provided by GitHub

## 📊 Current Status

| Metric | Value |
|--------|-------|
| **CI Status** | ✅ Working |
| **Test Coverage** | 80%+ |
| **TypeScript Errors** | ~1860 (disabled in CI) |
| **Build Time** | ~15-20 minutes |
| **Platforms** | Windows, macOS, Linux |

## 🚨 Known Issues

1. **TypeScript checking disabled** - ~1860 errors, will be fixed before Beta
2. **Windows FFmpeg** - uses pre-built libraries instead of vcpkg (faster)
3. **Caching** - needs optimization for faster builds

---

*Updated: August 3, 2025 for alpha release v0.60.0*

[← To Testing](../12_testing/README.md) | [To QA →](../14_quality_assurance/README.md)