# Backend Dependency Status

*Last updated: January 2025*

## Core Dependencies

### Runtime and Framework
| Dependency | Current Version | Latest Version | Status | Notes |
|------------|----------------|----------------|--------|-------|
| Rust | 1.81.0+ | 1.81.0 | ✅ Up to date | Stable version |
| Tauri | 2.6 | 2.6.2 | ✅ Updated | Updated to 2.6 |
| tauri-build | 2.0 | 2.0.0 | ✅ Updated | Stable version |

### Tauri Plugins
| Plugin | Version | Status |
|--------|---------|--------|
| tauri-plugin-log | 2 | ✅ |
| tauri-plugin-notification | 2 | ✅ |
| tauri-plugin-fs | 2 | ✅ |
| tauri-plugin-dialog | 2 | ✅ |
| tauri-plugin-websocket | 2 | ✅ |
| tauri-plugin-opener | 2.2.7 | ✅ |
| tauri-plugin-store | 2 | ✅ |
| tauri-plugin-global-shortcut | 2 | ✅ |

### Media Processing
| Dependency | Version | Status | Notes |
|------------|---------|--------|-------|
| ffmpeg-next | 7.0 | ✅ | Latest version, requires FFmpeg 7.0+ |
| image | 0.24 | ⚠️ | Version 0.25 available with performance improvements |

### Async and Concurrency
| Dependency | Version | Status |
|------------|---------|--------|
| tokio | 1.0 (full) | ✅ |
| futures | 0.3 | ✅ |
| async-trait | 0.1 | ✅ |
| parking_lot | 0.12 | ✅ |

### HTTP and Networking
| Dependency | Version | Status |
|------------|---------|--------|
| axum | 0.7 | ✅ |
| reqwest | 0.11 | ✅ |
| tower | 0.4 | ✅ |
| tower-http | 0.5 | ✅ |
| hyper | 0.14 | ✅ |

### Security
| Dependency | Version | Status |
|------------|---------|--------|
| aes-gcm | 0.10 | ✅ |
| argon2 | 0.5 | ✅ |
| keyring | 2.3 | ✅ |
| rand | 0.8 | ✅ |
| sha2 | 0.10 | ✅ |

### Serialization
| Dependency | Version | Status |
|------------|---------|--------|
| serde | 1.0 | ✅ |
| serde_json | 1.0 | ✅ |
| base64 | 0.22.1 | ✅ |

### Machine Learning
| Dependency | Version | Status | Notes |
|------------|---------|--------|-------|
| ort | 2.0.0-rc.10 | ✅ | ONNX Runtime 1.22.0 |
| ndarray | 0.15 | ✅ | |

### Monitoring and Telemetry
| Dependency | Version | Status |
|------------|---------|--------|
| opentelemetry | 0.27 | ✅ |
| opentelemetry_sdk | 0.27 | ✅ |
| opentelemetry-otlp | 0.27 | ✅ |
| prometheus | 0.14.0 | ✅ |
| tracing | 0.1 | ✅ |

### WebAssembly
| Dependency | Version | Status |
|------------|---------|--------|
| wasmtime | 28.0 | ✅ |
| wasmtime-wasi | 28.0 | ✅ |
| wasm-bindgen | 0.2 | ✅ |

### Utilities
| Dependency | Version | Status |
|------------|---------|--------|
| uuid | 1.0 | ✅ |
| chrono | 0.4 | ✅ |
| regex | 1.0 | ✅ |
| dashmap | 5.0 | ✅ |
| once_cell | 1.19 | ✅ |
| anyhow | 1.0.98 | ✅ |
| dirs | 5.0 | ✅ |
| md5 | 0.7 | ✅ |
| sys-locale | 0.3.1 | ✅ |
| log | 0.4 | ✅ |

### Type Generation
| Dependency | Version | Status |
|------------|---------|--------|
| specta | 2.0.0-rc.21 | ✅ |
| specta-typescript | 0.0.9 | ✅ |
| tauri-specta | 2.0.0-rc.21 | ✅ |

### Dev Dependencies
| Dependency | Version | Status |
|------------|---------|--------|
| ctor | 0.2 | ✅ |
| env_logger | 0.10 | ✅ |
| tempfile | 3.8 | ✅ |
| urlencoding | 2.0 | ✅ |
| criterion | 0.5 | ✅ |
| httpmock | 0.7 | ✅ |

## 📊 Summary

- **Total dependencies**: 50+
- **Up to date**: 48 (96%)
- **Need updates**: 1 (image)
- **Critical vulnerabilities**: 0

## ✅ Completed Updates (January 2025)

1. **Tauri 2.5 → 2.6**
   - Performance improvements
   - Security fixes
   - New APIs for mobile platforms

2. **tauri-build 2.0.0-rc.13 → 2.0**
   - Migration to stable version
   - Full compatibility with Tauri 2.6

## 🔄 Update Recommendations

### High Priority
1. **image 0.24 → 0.25**
   - Improved decoding performance (~20% faster)
   - Support for new formats (AVIF, JXL)
   - Better memory handling
   ```bash
   cargo update -p image
   ```

### Medium Priority
- Monitor security updates for cryptographic libraries
- Track new FFmpeg bindings versions when FFmpeg 8.0 is released

### Low Priority
- Consider migration from `once_cell` to `std::sync::OnceLock` (Rust 1.70+)
- Track Tauri 3.0 development (planned for 2025)

## 🔒 Security

### Automated Checks
```bash
# Check vulnerabilities
cargo audit

# Check outdated dependencies
cargo outdated

# Update to latest compatible versions
cargo update

# Check licenses
cargo license
```

### Critical Dependencies to Monitor
- **aes-gcm** - API key encryption
- **argon2** - password hashing
- **keyring** - system keystore access
- **reqwest** - TLS/SSL connections

## 📈 Dependency Metrics

### Dependency Size
```bash
# Analyze dependency size
cargo bloat --release --crates

# Top 10 largest dependencies:
1. ffmpeg-next (~15MB)
2. wasmtime (~10MB)
3. ort (~8MB)
4. opentelemetry (~5MB)
5. axum (~3MB)
```

### Build Times
- Clean build: ~5-7 minutes
- Incremental: ~30-60 seconds
- Release build: ~10-15 minutes

## 🚀 Optimizations

### Cargo.toml Optimizations
```toml
[profile.release]
lto = "fat"          # Link-time optimization
codegen-units = 1    # Better optimization
strip = true         # Remove debug symbols
opt-level = 3        # Maximum optimization
```

### Parallel Compilation
```bash
# Use all cores
export CARGO_BUILD_JOBS=$(nproc)

# Or in .cargo/config.toml
[build]
jobs = 8
```

## 📝 Notes

1. **Tauri Versioning**: All plugins must match Tauri major version
2. **FFmpeg Compatibility**: ffmpeg-next 7.0 requires system FFmpeg 7.0+ library
3. **ONNX Runtime**: Version tied to specific YOLO models
4. **Parking lot**: Don't update beyond 0.12 without testing (destructor issues)
5. **WebAssembly**: wasmtime updates frequently but requires plugin testing

## 🔗 Useful Links

- [Cargo Security Advisories](https://rustsec.org/)
- [Tauri Security](https://github.com/tauri-apps/tauri/security)
- [Rust Release Notes](https://github.com/rust-lang/rust/releases)
- [Dependency Dashboard](https://deps.rs/repo/github/chatman-media/timeline-studio)

---
*Automatic status updates via GitHub Actions weekly*