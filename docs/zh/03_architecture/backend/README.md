# Backend Architecture

## Overview

The Tauri backend is built with Rust and provides native desktop capabilities for the Timeline Studio application.

## Core Architectural Components

### Modular Structure

1. **Core Infrastructure** (`src/core/`)
   - `di/` - Dependency Injection container
   - `events/` - Event system and EventBus
   - `performance/` - Memory and performance management
   - `plugins/` - Plugin system
   - `telemetry/` - Metrics and monitoring

2. **Security Module** (`src/security/`)
   - `secure_storage.rs` - Secure API key storage with encryption
   - `api_validator.rs` - Third-party API key validation
   - `api_validator_service.rs` - Service for asynchronous validation
   - `oauth_handler.rs` - OAuth handling for social networks
   - `env_importer.rs` - Import keys from .env files
   - `commands.rs` - Tauri commands for security operations
   - `registry.rs` - Security command registration

3. **Filesystem Module** (`src/filesystem.rs`)
   - File operations: read, write, search
   - Directory management
   - File metadata retrieval
   - Cross-platform path handling

4. **Media Module** (`src/media/`)
   - `metadata.rs` - FFmpeg-based media file analysis
   - `ffmpeg.rs` - FFmpeg integration and validation
   - `types.rs` - Media data structures
   - `preview_manager.rs` - Media file preview management
   - `processor.rs` - Media file processing

5. **Video Compiler** (`src/video_compiler/`)
   - `core/` - Compiler core (GPU, pipeline, codecs)
   - `services/` - Service layer with metrics
   - `commands/` - Tauri command handlers
   - `cache/` - LRU cache for previews and metadata
   - `ffmpeg_builder/` - FFmpeg command construction
   - `progress/` - Render progress tracking
   - `schema/` - Project schema definitions

6. **Recognition Module** (`src/recognition/`)
   - `yolo_processor.rs` - YOLO model processing
   - `model_manager.rs` - Machine learning model management
   - `frame_processor.rs` - Frame processing for recognition
   - `result_aggregator.rs` - Recognition result aggregation
   - `recognition_service.rs` - Recognition service
   - `commands/` - Recognition command handlers

7. **Video Server** (`src/video_server/`)
   - HTTP server for video streaming
   - Range request support
   - CORS configuration
   - Video file registration

8. **Plugins** (`src/plugins/`)
   - `examples/` - Example plugins (BlurEffect, YouTubeUploader)
   - Integration with core plugin system

## State Management

### Principles
- Use `Arc<RwLock<T>>` for shared mutable state
- Implement `Default` for state types
- Keep state minimal and focused

### State Structure Example
```rust
#[derive(Default)]
pub struct AppState {
    video_cache: Arc<RwLock<VideoCache>>,
    render_queue: Arc<RwLock<RenderQueue>>,
    server_state: Arc<RwLock<ServerState>>,
}
```

## Security and Capabilities

### Security Module

The security module (`src/security/`) ensures protection of sensitive data:

1. **Secure Key Storage**
   - API key encryption using AES-GCM
   - System keystore integration (Keychain on macOS, Credential Manager on Windows)
   - Automatic master key generation and management

2. **API Validation**
   - OpenAI, Anthropic, Google Gemini key verification
   - Asynchronous validation with timeouts
   - Validation result caching

3. **OAuth Integration**
   - OAuth support for YouTube, Instagram, TikTok
   - Secure access token storage
   - Automatic token refresh

4. **Environment Import**
   - Search and import keys from .env files
   - Secure migration of existing keys
   - Support for various variable formats

### Tauri Capability System

The application uses Tauri's capability system for security:

1. **Filesystem Access**
   - Read/write to user-selected directories
   - Project file management
   - Media file import

2. **Shell Commands**
   - FFmpeg execution for video processing
   - System information queries

3. **HTTP Client**
   - API communications
   - Update checking
   - External API validation

4. **Window Management**
   - Multi-window support
   - Custom window controls

5. **System Integration**
   - Keychain/Credential Manager access
   - System notification management
   - Global hotkeys

## Command Structure

Tauri commands follow this pattern:

```rust
#[tauri::command]
pub async fn command_name(
    state: State<'_, AppState>,
    param1: String,
    param2: Option<i32>
) -> Result<ReturnType, String> {
    // Implementation
}
```

## Service Layer

### Design Principles
1. **Separation of Concerns** - Each service handles one domain
2. **Dependency Injection** - Services receive dependencies via constructor
3. **Async/Await** - All I/O operations are asynchronous
4. **Error Handling** - Use Result<T, VideoCompilerError>

### Core Services
- **RenderService** - Video rendering
- **PreviewService** - Preview generation
- **CacheService** - Cache management
- **MediaService** - Media file operations
- **ProjectService** - Project management

## Frontend Integration

### Communication
- Tauri commands for backend functionality invocation
- Events for frontend notifications
- Serialization via Serde JSON

### Progress Handling
```rust
window.emit("render-progress", ProgressUpdate {
    percent: 0.75,
    message: Some("Encoding video...".to_string()),
})?;
```

## Plugin System

### Plugin Architecture
The plugin system allows extending Timeline Studio functionality:

1. **Plugin Types**
   - Effects and filters
   - Exporters and importers
   - External service integrations
   - Analysis tools

2. **Plugin Lifecycle**
   - Registration in PluginRegistry
   - Initialization with context
   - Command processing
   - Resource cleanup

3. **Plugin Security**
   - Isolated execution
   - Permission system
   - Dependency validation
   - API versioning

### Example Plugins
- **BlurEffectPlugin** - Video blur effect
- **YouTubeUploaderPlugin** - YouTube video upload

## Core Infrastructure

### Dependency Injection
DI container provides dependency management:

```rust
let container = ServiceContainer::new();
container.register::<dyn VideoService>(VideoServiceImpl::new());
let service = container.resolve::<dyn VideoService>()?;
```

### Event System
EventBus enables asynchronous component communication:

```rust
event_bus.emit(AppEvent::RenderComplete { job_id });
event_bus.subscribe(|event| match event {
    AppEvent::RenderComplete { job_id } => handle_complete(job_id),
    _ => {}
});
```

### Telemetry and Monitoring
- OpenTelemetry integration
- Prometheus metrics
- Structured logging
- Health checks

## Performance

### Optimization Strategies
1. **Caching** - LRU caches for frequently used data
2. **Lazy Loading** - Load data on demand
3. **Streaming** - Process large files in chunks
4. **Parallelism** - Use tokio for async operations
5. **Zero-copy** - Minimize memory data copying
6. **GPU Acceleration** - Use hardware encoders

### Monitoring
- Performance metrics via telemetry system
- Memory and CPU usage tracking
- Slow operation logging
- Critical path profiling