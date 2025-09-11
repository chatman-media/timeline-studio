# Testing with Real Media Files

## Overview

Timeline Studio uses real media files for testing to ensure correct operation with various formats and codecs encountered in real projects.

## Test Data

All test media files are located in the `public/test-data/` folder:

### Video Files

| File | Codec | Resolution | FPS | Audio | Features |
|------|-------|------------|-----|-------|----------|
| C0666.MP4 | HEVC | 4K (3840x2160) | 50 | PCM 48kHz 2ch | High bitrate ~200 Mbps |
| C0783.MP4 | HEVC | 4K (3840x2160) | 50 | PCM 48kHz 2ch | Uncompressed audio |
| Kate.mp4 | H.264 | 4K (3840x2160) | 50 | AAC 44.1kHz 2ch | Standard codec |
| water play3.mp4 | HEVC | 4K (3840x2160) | 50 | None | Video only |
| проводка после лобби.mp4 | HEVC | 4K (3840x2160) | 50 | None | Cyrillic filename |

### Audio Files

| File | Format | Duration | Sample Rate | Channels | Features |
|------|--------|----------|-------------|----------|----------|
| DJI_02_20250402_104352.WAV | WAV PCM 24-bit | 31 min | 48kHz | Mono | Long file, 256 MB |

### Images

| File | Format | Resolution | Features |
|------|--------|------------|----------|
| DSC07845.png | PNG | 4240x2832 | High resolution |

## E2E Tests (JavaScript/TypeScript)

### Structure

```
e2e/tests/
├── test-data.ts              # Test file references
├── media-metadata.json       # File metadata
├── media-import-basic.spec.ts    # Basic tests
├── media-import-real-files.spec.ts # Tests with real files
└── media-import-demo.spec.ts     # Demo tests
```

### Usage

```typescript
import { TEST_FILES } from "./test-data"

// Get a video file
const video = TEST_FILES.videos[0] // C0666.MP4

// Get file with Cyrillic name
const cyrillicFile = TEST_FILES.videos.find(v => 
  v.name.includes('проводка')
)

// Use in test
await selectFiles(page, [video.path])
```

### Running Tests

```bash
# Basic tests
bun run test:e2e:basic

# Tests with real files
bun run test:e2e:real

# Demo tests
bun run playwright test e2e/tests/media-import-demo.spec.ts
```

## Rust Tests

### Structure

```
src-tauri/src/media/
├── test_data.rs         # Auto-generated file data
├── real_data_tests.rs   # Tests with real files
└── test_plan.md         # Test plan
```

### Usage

```rust
use crate::media::test_data::test_data::*;

#[tokio::test]
async fn test_4k_video() {
    let video = get_test_video();
    let path = video.get_path();
    
    // Test metadata extraction
    let metadata = extract_metadata(&path).await.unwrap();
    
    // Verify properties
    assert_eq!(video.width, Some(3840));
    assert_eq!(video.height, Some(2160));
}
```

### Special Test Scenarios

1. **High Bitrate (200+ Mbps)**
   ```rust
   let high_bitrate = TEST_FILES.iter()
       .max_by_key(|f| f.bit_rate)
       .unwrap();
   ```

2. **Files with Cyrillic Names**
   ```rust
   let cyrillic = get_file_with_cyrillic().unwrap();
   ```

3. **Long Audio Files (31 min)**
   ```rust
   let long_audio = get_test_audio();
   assert!(long_audio.duration > 1800.0);
   ```

4. **Video Without Audio**
   ```rust
   let video_only = TEST_FILES.iter()
       .find(|f| f.has_video && !f.has_audio)
       .unwrap();
   ```

### Running Rust Tests

```bash
# All media module tests
cd src-tauri && cargo test media::

# Only real data tests
cd src-tauri && cargo test real_data_tests

# With debug output
cd src-tauri && cargo test real_data_tests -- --nocapture
```

## Test Data Generation

The script `scripts/analyze-test-media.js` analyzes media files and generates:
- `src-tauri/src/media/test_data.rs` - Rust module with metadata
- `e2e/tests/media-metadata.json` - JSON with metadata for JS tests

Running:
```bash
node scripts/analyze-test-media.js
```

## Best Practices

1. **Use real files** instead of mocks wherever possible
2. **Test edge cases**: large files, high bitrate, unusual codecs
3. **Check performance**: measure processing time
4. **Test parallel processing** of multiple files
5. **Test error handling** with corrupted files

## Adding New Test Files

1. Add file to `public/test-data/`
2. Run `node scripts/analyze-test-media.js`
3. Update tests to use the new file
4. Document file features

## CI/CD Integration

Test files must be available in CI environment:
- Store in Git LFS for large files
- Or download from external storage
- Use caching to speed up tests