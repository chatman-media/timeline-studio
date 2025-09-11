# Plugin Development Guide

Complete guide to creating plugins for Timeline Studio with code examples, best practices, and step-by-step instructions.

## 📋 Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Creating Your First Plugin](#creating-your-first-plugin)
3. [Plugin Architecture](#plugin-architecture)
4. [API Reference](#api-reference)
5. [Permission System](#permission-system)
6. [Testing Plugins](#testing-plugins)
7. [Performance Optimization](#performance-optimization)
8. [Publishing Plugins](#publishing-plugins)

## 🛠️ Development Environment Setup

### Installing Tools

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. Install wasm-pack
cargo install wasm-pack

# 3. Add WebAssembly target
rustup target add wasm32-unknown-unknown

# 4. Install additional tools
cargo install cargo-generate    # For templates
cargo install basic-http-server # For testing
```

### Plugin Project Structure

```
my-video-plugin/
├── Cargo.toml              # Rust configuration
├── plugin.json             # Plugin metadata
├── src/
│   ├── lib.rs              # Main logic
│   ├── video.rs            # Video processing
│   └── utils.rs            # Helper functions
├── schemas/                # JSON schemas
│   ├── input.json
│   └── output.json
├── examples/               # Usage examples
│   └── sample_usage.json
├── tests/                  # Tests
│   └── integration.rs
└── README.md
```

### Cargo.toml Configuration

```toml
[package]
name = "my-video-plugin"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
js-sys = "0.3"
web-sys = "0.3"

[dependencies.wasm-bindgen]
version = "0.2"
features = [
  "serde-serialize",
]

[package.metadata.wasm-pack.profile.release]
wee_alloc = false
```

## 🎯 Creating Your First Plugin

### 1. Basic Plugin Structure

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

// Main plugin structure
#[wasm_bindgen]
pub struct VideoBlurPlugin {
    initialized: bool,
}

#[wasm_bindgen]
impl VideoBlurPlugin {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        VideoBlurPlugin {
            initialized: false,
        }
    }

    pub fn initialize(&mut self, config: &str) -> Result<(), JsValue> {
        // Parse configuration
        let config: PluginConfig = serde_json::from_str(config)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
        self.initialized = true;
        Ok(())
    }

    pub fn process_frame(&self, frame_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        if !self.initialized {
            return Err(JsValue::from_str("Plugin not initialized"));
        }
        
        // Process video frame
        let processed = self.apply_blur(frame_data)?;
        Ok(processed)
    }
}

#[derive(Serialize, Deserialize)]
struct PluginConfig {
    blur_radius: f32,
    quality: String,
}
```

### 2. Plugin Metadata (plugin.json)

```json
{
  "id": "video-blur-plugin",
  "name": "Video Blur Effect",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Adds blur effect to videos",
  "category": "effects",
  "permissions": [
    "video_read",
    "video_write"
  ],
  "parameters": {
    "blur_radius": {
      "type": "number",
      "default": 10,
      "min": 0,
      "max": 100,
      "label": "Blur Radius"
    },
    "quality": {
      "type": "string",
      "default": "high",
      "options": ["low", "medium", "high"],
      "label": "Quality"
    }
  }
}
```

### 3. Building the Plugin

```bash
# Build for production
wasm-pack build --target web --out-dir dist

# Test locally
basic-http-server dist/
```

## 🏗️ Plugin Architecture

### Plugin Types

1. **Effect Plugins** - Modify video frames
2. **Filter Plugins** - Apply color corrections
3. **Transition Plugins** - Create transition effects
4. **Analysis Plugins** - Analyze video content
5. **Export Plugins** - Custom export formats

### Plugin Lifecycle

```rust
// 1. Loading
let plugin = VideoBlurPlugin::new();

// 2. Initialization
plugin.initialize(config_json)?;

// 3. Processing
for frame in video_frames {
    let processed = plugin.process_frame(&frame)?;
    output.push(processed);
}

// 4. Cleanup
plugin.cleanup();
```

## 📚 API Reference

### Core Interfaces

```rust
use timeline_studio_plugin::prelude::*;

// Video processing trait
pub trait VideoProcessor {
    fn process_frame(&self, frame: &Frame) -> Result<Frame>;
    fn get_parameters(&self) -> ParameterSet;
}

// Audio processing trait  
pub trait AudioProcessor {
    fn process_audio(&self, audio: &AudioBuffer) -> Result<AudioBuffer>;
}

// Timeline access
pub trait TimelineAccess {
    fn get_current_time(&self) -> f64;
    fn get_clip_at(&self, time: f64) -> Option<Clip>;
}
```

### Helper Functions

```rust
// Color manipulation
pub fn rgb_to_hsl(r: u8, g: u8, b: u8) -> (f32, f32, f32);
pub fn apply_lut(frame: &mut Frame, lut: &[u8]);

// Frame utilities
pub fn resize_frame(frame: &Frame, width: u32, height: u32) -> Frame;
pub fn blend_frames(a: &Frame, b: &Frame, alpha: f32) -> Frame;

// Performance helpers
pub fn parallel_process<F>(frame: &Frame, processor: F) -> Frame
where
    F: Fn(&[u8]) -> Vec<u8> + Send + Sync;
```

## 🔐 Permission System

### Permission Types

```rust
#[derive(Debug, Clone)]
pub enum Permission {
    VideoRead,      // Read video frames
    VideoWrite,     // Modify video frames
    AudioRead,      // Read audio data
    AudioWrite,     // Modify audio data
    FileSystem,     // Access file system
    Network,        // Network requests
    Timeline,       // Timeline modifications
}
```

### Permission Request

```rust
impl VideoBlurPlugin {
    pub fn required_permissions() -> Vec<Permission> {
        vec![
            Permission::VideoRead,
            Permission::VideoWrite,
        ]
    }
}
```

## 🧪 Testing Plugins

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blur_initialization() {
        let mut plugin = VideoBlurPlugin::new();
        let config = r#"{"blur_radius": 20, "quality": "high"}"#;
        
        assert!(plugin.initialize(config).is_ok());
        assert!(plugin.initialized);
    }

    #[test]
    fn test_frame_processing() {
        let plugin = create_test_plugin();
        let frame = create_test_frame(1920, 1080);
        
        let result = plugin.process_frame(&frame);
        assert!(result.is_ok());
        
        let processed = result.unwrap();
        assert_eq!(processed.len(), frame.len());
    }
}
```

### Integration Tests

```rust
// tests/integration.rs
use wasm_bindgen_test::*;

#[wasm_bindgen_test]
fn test_plugin_in_browser() {
    let plugin = VideoBlurPlugin::new();
    // Test in browser environment
}
```

### Test Utilities

```rust
// Helper functions for testing
pub fn create_test_frame(width: u32, height: u32) -> Vec<u8> {
    vec![0; (width * height * 4) as usize]
}

pub fn compare_frames(a: &[u8], b: &[u8], tolerance: f32) -> bool {
    // Compare frame similarity
}
```

## ⚡ Performance Optimization

### WebAssembly Optimization

```toml
# Cargo.toml optimizations
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

### Memory Management

```rust
// Use efficient memory allocation
use wee_alloc;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Reuse buffers
pub struct FrameProcessor {
    buffer: Vec<u8>,
}

impl FrameProcessor {
    pub fn process(&mut self, frame: &[u8]) -> &[u8] {
        self.buffer.clear();
        self.buffer.extend_from_slice(frame);
        // Process in place
        &self.buffer
    }
}
```

### Parallel Processing

```rust
use rayon::prelude::*;

pub fn parallel_blur(frame: &mut [u8], width: u32, height: u32) {
    let chunk_size = (width * 4) as usize;
    
    frame.par_chunks_mut(chunk_size)
        .for_each(|row| {
            apply_blur_to_row(row);
        });
}
```

## 📦 Publishing Plugins

### 1. Package Preparation

```bash
# Create distribution package
wasm-pack build --release
npm init -y
```

### 2. Package.json Configuration

```json
{
  "name": "@timeline-studio/video-blur",
  "version": "1.0.0",
  "description": "Video blur plugin for Timeline Studio",
  "main": "dist/index.js",
  "files": [
    "dist/",
    "plugin.json"
  ],
  "keywords": [
    "timeline-studio",
    "plugin",
    "video-effect"
  ]
}
```

### 3. Documentation

Create comprehensive documentation:

```markdown
# Video Blur Plugin

## Installation
```
npm install @timeline-studio/video-blur
```

## Usage
1. Import in Timeline Studio
2. Configure parameters
3. Apply to clips

## Parameters
- blur_radius: 0-100
- quality: low/medium/high
```

### 4. Publishing

```bash
# Login to npm
npm login

# Publish package
npm publish --access public

# Tag version
git tag v1.0.0
git push --tags
```

## 🎯 Best Practices

### 1. Error Handling
- Always validate input parameters
- Return meaningful error messages
- Handle edge cases gracefully

### 2. Performance
- Process frames in chunks
- Use SIMD operations when possible
- Implement frame caching

### 3. User Experience
- Provide real-time preview
- Include progress indicators
- Support parameter presets

### 4. Compatibility
- Test on different platforms
- Support multiple video formats
- Handle various resolutions

## 📖 Examples

### Complete Blur Effect Plugin

See `examples/blur-effect/` for a complete implementation including:
- Full source code
- Test suite
- Sample videos
- Performance benchmarks

### Advanced Plugins

1. **AI-Powered Object Removal**
   - Uses machine learning for object detection
   - Implements inpainting algorithms

2. **Custom Transition Effects**
   - Creates smooth transitions
   - Supports keyframe animation

3. **Real-time Filters**
   - Color grading
   - Film emulation
   - Artistic effects

## 🤝 Community

- **Plugin Repository**: [github.com/timeline-studio/plugins](https://github.com/timeline-studio/plugins)
- **Discord**: Join our developer community
- **Forum**: Discuss plugin development

## 📝 License

Plugins can use any license. We recommend:
- MIT for open source plugins
- Custom license for commercial plugins