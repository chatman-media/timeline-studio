# Development Checklist for New Features

## Adding New Tauri Command

- [ ] Create function with `#[tauri::command]` attribute
- [ ] Use async for I/O operations
- [ ] Add proper error handling (Result<T, String>)
- [ ] Register command in `app_builder.rs`
- [ ] Write unit tests for command
- [ ] Add integration tests if needed
- [ ] Update TypeScript types (run in debug mode)
- [ ] Document command in module README
- [ ] Check command with `cargo fmt` and `cargo clippy`
- [ ] Add metrics for monitoring if applicable

## Creating New Module

### File Structure
- [ ] Create directory in `src/`
- [ ] Create `mod.rs` with public exports
- [ ] Create `types.rs` for data structures
- [ ] Create `commands.rs` for Tauri commands
- [ ] Create `errors.rs` for custom errors (if needed)
- [ ] Create `tests/` directory with tests
- [ ] Create `README.md` with module documentation

### Integration
- [ ] Add `mod module_name;` to `lib.rs`
- [ ] Register commands in `app_builder.rs`
- [ ] Add module state to `lib.rs::run()` if needed
- [ ] Configure DI for module services
- [ ] Integrate with Event Bus if events needed
- [ ] Add metrics through Telemetry module

### Testing
- [ ] Unit tests for all public functions
- [ ] Integration tests for commands
- [ ] Mock objects for external dependencies
- [ ] Check code coverage (target: >80%)
- [ ] Performance tests for critical operations

## External Service Integration

- [ ] Create service in module
- [ ] Implement trait for DI
- [ ] Add service configuration
- [ ] Implement retry logic
- [ ] Add timeout for operations
- [ ] Log all external calls
- [ ] Add metrics for monitoring
- [ ] Create mock for tests
- [ ] Document API endpoints

## Working with Media Files

- [ ] Use existing Media module
- [ ] Check format support
- [ ] Cache metadata
- [ ] Generate thumbnails asynchronously
- [ ] Handle FFmpeg errors
- [ ] Add progress events
- [ ] Test with different formats

## Security

- [ ] Validate all input data
- [ ] Use SecureStorage for keys
- [ ] Don't log sensitive data
- [ ] Check file paths (path traversal)
- [ ] Use sanitization for shell commands
- [ ] Limit uploaded file sizes

## Performance

- [ ] Use caching where possible
- [ ] Apply lazy loading
- [ ] Use streaming for large files
- [ ] Add parallel processing
- [ ] Measure performance
- [ ] Optimize critical paths

## Documentation

- [ ] Document public APIs
- [ ] Add usage examples
- [ ] Update main README
- [ ] Add comments to complex code
- [ ] Create migration guide if needed
- [ ] Update CHANGELOG

## Code Review Checklist

### Before submitting for review
- [ ] `cargo fmt --all`
- [ ] `cargo clippy -- -D warnings`
- [ ] `cargo test`
- [ ] `cargo build --release`
- [ ] Check for TODO comments
- [ ] Check for debug print! statements

### Review Criteria
- [ ] Code follows architectural principles
- [ ] No code duplication
- [ ] Proper error handling
- [ ] Sufficient test coverage
- [ ] Documentation is current
- [ ] No security issues
- [ ] Performance is acceptable

## Deployment

- [ ] Check all platforms (Windows, macOS, Linux)
- [ ] Check backward compatibility
- [ ] Update version in Cargo.toml
- [ ] Create release notes
- [ ] Check binary size
- [ ] Run e2e tests

## Post-deployment Monitoring

- [ ] Check performance metrics
- [ ] Monitor error rate
- [ ] Check memory usage
- [ ] Monitor logs
- [ ] Be ready for rollback