# Testing Guide

## Overview

This document describes the testing strategy, test organization, and best practices for Timeline Studio backend.

## Development Setup

### Prerequisites

- Rust 1.70+ with cargo
- FFmpeg installed and available in PATH
- Node.js 18+ (for frontend integration)
- Tauri CLI: `cargo install tauri-cli`

### Running in Development Mode

```bash
# Run tests
cargo test

# Run with coverage
cargo tarpaulin --workspace

# Run specific test
cargo test test_name

# Run Tauri in development mode
cargo tauri dev
```

## Testing Strategy

### Unit Tests

Each module should have comprehensive unit tests covering:

1. **Success scenarios** - Normal expected behavior
2. **Edge cases** - Boundary conditions, empty inputs
3. **Error handling** - Invalid inputs, system failures
4. **Serialization** - JSON serialization/deserialization
5. **State management** - Concurrent access, mutations

### Test Organization

Tests are organized in two ways:

1. **Inline tests** - Small modules have tests at the bottom of the file
   ```rust
   #[cfg(test)]
   mod tests {
       use super::*;
       // tests here
   }
   ```

2. **Separate test files** - Large modules use `tests.rs` in the same directory
   ```
   src/
   ├── media/
   │   ├── metadata.rs
   │   └── metadata/
   │       └── tests.rs
   ```

### Mocking Guidelines

- Use conditional compilation for platform-specific tests
- Mock external dependencies (FFmpeg, filesystem)
- Create test fixtures using `tempfile` crate
- Avoid hardcoded paths - use temporary directories

## Code Coverage

### Current Status

As of last measurement:
- Total coverage: 42.62%
- Target coverage: 90%
- Total lines covered: 1464/3435

### Module Coverage

| Module | Coverage | Lines Covered | Priority |
|--------|----------|---------------|----------|
| filesystem.rs | 90.74% | 49/54 | Complete |
| language.rs | 90.91% | 20/22 | Complete |
| media/metadata.rs | 69.66% | 62/89 | High |
| media/ffmpeg.rs | 80.00% | 4/5 | Low |
| media/files.rs | 100.00% | 11/11 | Complete |
| video_compiler/commands.rs | 20.34% | 72/354 | Critical |
| video_compiler/cache.rs | 95.31% | 122/128 | Complete |
| video_compiler/error.rs | 98.52% | 133/135 | Complete |
| video_compiler/ffmpeg_builder.rs | 21.71% | 208/958 | Critical |
| video_compiler/frame_extraction.rs | 45.32% | 92/203 | Medium |
| video_compiler/gpu.rs | 40.96% | 77/188 | Medium |
| video_compiler/pipeline.rs | 32.10% | 147/458 | High |
| video_compiler/preview.rs | 40.77% | 95/233 | Medium |
| video_compiler/progress.rs | 74.49% | 146/196 | Low |
| video_compiler/renderer.rs | 82.86% | 58/70 | Low |
| video_compiler/schema.rs | 71.43% | 95/133 | Low |
| video_server/server.rs | 68.92% | 51/74 | Low |
| lib.rs | 4.60% | 4/87 | Critical |
| main.rs | 0.00% | 0/2 | N/A |

### Improving Coverage

1. **Identify untested code**
   ```bash
   cargo tarpaulin --workspace --ignore-tests
   ```

2. **Generate HTML report**
   ```bash
   cargo tarpaulin --workspace --html
   ```

3. **Focus areas**
   - Command handlers
   - Error paths
   - Async operations
   - Cache operations

## Test Examples

### Testing Async Functions

```rust
#[tokio::test]
async fn test_async_operation() {
    let service = MyService::new();
    let result = service.async_method().await;
    assert!(result.is_ok());
}
```

### Testing with Temporary Files

```rust
use tempfile::tempdir;

#[test]
fn test_file_operations() {
    let temp_dir = tempdir().unwrap();
    let file_path = temp_dir.path().join("test.txt");
    
    // Perform file operations
    write_file(&file_path, "content").unwrap();
    
    // Verify
    assert!(file_path.exists());
}
```

### Testing Error Handling

```rust
#[test]
fn test_error_handling() {
    let result = risky_operation();
    
    assert!(matches!(
        result,
        Err(VideoCompilerError::InvalidInput(_))
    ));
}
```

## Integration Tests

### Structure
```
tests/
├── integration/
│   ├── render_test.rs
│   ├── preview_test.rs
│   └── common/
│       └── mod.rs
```

### Integration Test Example
```rust
// tests/integration/render_test.rs
use timeline_studio::*;

#[tokio::test]
async fn test_full_render_pipeline() {
    let project = create_test_project();
    let result = render_project(&project).await;
    assert!(result.is_ok());
}
```

## CI/CD Checks

### Pre-commit Checks

1. `cargo fmt -- --check` - Format checking
2. `cargo clippy -- -D warnings` - Linting
3. `cargo test` - Run all tests
4. `cargo tarpaulin --fail-under 80` - Coverage check

## Best Practices

1. **Test naming** - Use descriptive names
2. **Isolation** - Each test should be independent
3. **Determinism** - Tests should produce consistent results
4. **Speed** - Keep unit tests fast
5. **Documentation** - Comment complex test scenarios