# Version Management

## Overview

Timeline Studio uses a centralized version management system where the application version is synchronized across multiple files:

- `package.json` - npm package version
- `src-tauri/Cargo.toml` - Rust application version
- `src-tauri/tauri.conf.json` - Tauri application version
- `src/test/mocks/tauri/api/app.ts` - version in test mocks

## Problem

Manual version updates require changing all these files, which is inconvenient and can lead to version desynchronization.

## Solution

### 1. Automatic Scripts

Two scripts have been created for version management:

#### `scripts/update-version.js`
Basic script for updating version in all files:

```bash
# Update version to 0.27.0
npm run update-version 0.27.0
```

#### `scripts/version-sync.mjs`
Advanced script with support for different strategies:

```bash
# Update version manually
npm run version:sync 0.27.0

# Take version from Cargo.toml as primary
npm run version:from-cargo

# Take version from package.json as primary
npm run version:from-package
```

### 2. Version Update Process

#### Local Development

1. Update version:
   ```bash
   npm run update-version 0.27.0
   ```

2. Check changes:
   ```bash
   git diff
   ```

3. Run tests:
   ```bash
   npm test
   npm run test:rust
   ```

4. Create commit:
   ```bash
   git add -A
   git commit -m "chore: bump version to 0.27.0"
   ```

5. Create tag:
   ```bash
   git tag v0.27.0
   ```

6. Push changes:
   ```bash
   git push origin main
   git push origin v0.27.0
   ```

#### CI/CD Automation

GitHub Action workflow `.github/workflows/version-bump.yml` has been created for process automation:

1. Go to Actions → Version Bump
2. Click "Run workflow"
3. Choose update type:
   - `patch` - 0.26.0 → 0.26.1
   - `minor` - 0.26.0 → 0.27.0
   - `major` - 0.26.0 → 1.0.0
   - `custom` - arbitrary version

The workflow will automatically create a Pull Request with updated versions.

### 3. Alternative Approaches

#### Automatic Tauri Version Detection

You can remove the `version` field from `tauri.conf.json`, and Tauri will automatically take the version from `Cargo.toml`:

```diff
// src-tauri/tauri.conf.json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Timeline Studio",
- "version": "0.26.0",
  "identifier": "com.chatman-media.timeline-studio",
```

#### Link to package.json

```json
// src-tauri/tauri.conf.json
{
  "version": "../package.json"
}
```

#### Workspace Versions for Rust

For large projects, you can use workspace versions:

```toml
# Root Cargo.toml
[workspace]
members = ["src-tauri"]

[workspace.package]
version = "0.26.0"

# src-tauri/Cargo.toml
[package]
version.workspace = true
```

## Release Integration

### Semantic Release

For complete automation, you can configure semantic-release:

```bash
npm install --save-dev semantic-release @semantic-release/git @semantic-release/changelog
```

Configuration `.releaserc.json`:
```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/exec",
      {
        "prepareCmd": "npm run update-version ${nextRelease.version}"
      }
    ],
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
```

### Conventional Commits

Use conventional commits for automatic version type determination:

- `fix:` - patch version
- `feat:` - minor version
- `BREAKING CHANGE:` - major version

## Version Verification

### Current Application Version

```typescript
import { getVersion } from '@tauri-apps/api/app';

const version = await getVersion();
console.log('App version:', version);
```

### In Rust Code

```rust
let version = env!("CARGO_PKG_VERSION");
println!("App version: {}", version);
```

## Troubleshooting

### Versions Not Synchronized

Run the sync script:
```bash
npm run version:sync $(node -p "require('./package.json').version")
```

### Update Error

Check file access permissions and JSON/TOML syntax validity.

### CI/CD Not Creating PR

Ensure GitHub Actions has permissions to create PRs in repository settings.

## Best Practices

1. **Always use scripts** for version updates
2. **Follow Semantic Versioning**: MAJOR.MINOR.PATCH
3. **Create tags** for each version
4. **Update CHANGELOG** when changing version
5. **Test** before release on all platforms

## Related Documents

- [CI/CD Setup](./ci-cd-setup.md) - automation setup
- [Build](../06-deployment/build.md) - build process
- [Development Commands](./development-commands.md) - development commands