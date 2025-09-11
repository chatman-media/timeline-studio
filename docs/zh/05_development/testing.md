# Testing Guide

[← Back to Developer Guide](README.md)

## 📋 Contents

- [Testing Overview](#testing-overview)
- [Frontend Testing (Vitest)](#frontend-testing-vitest)
- [Backend Testing (Rust)](#backend-testing-rust)
- [E2E Testing (Playwright)](#e2e-testing-playwright)
- [Performance Testing](#performance-testing)
- [Code Coverage](#code-coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## 📊 Testing Overview

### Test Statistics

Timeline Studio has **4,158 tests**:
- **Frontend (Vitest)**: 3,604 tests
- **Backend (Rust)**: 554 tests
- **E2E (Playwright)**: 25+ scenarios

### Test Structure

```
src/
├── features/
│   └── feature-name/
│       ├── __tests__/          # Unit tests
│       │   ├── components/     # Component tests
│       │   ├── hooks/          # Hook tests
│       │   └── services/       # Service tests
│       └── __mocks__/          # Module mocks

src-tauri/
└── src/
    └── module_name/
        └── tests.rs            # Rust tests

e2e/
├── fixtures/                   # Test data
├── utils/                      # E2E utilities
└── specs/                      # E2E scenarios
```

## 🧪 Frontend Testing (Vitest)

### Environment Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts'
      ]
    }
  }
})
```

### Writing Tests

#### Component Testing

```typescript
// src/features/timeline/__tests__/components/timeline-clip.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { TimelineClip } from '../../components/timeline-clip'
import { createMockClip } from '../test-utils'

describe('TimelineClip', () => {
  const mockClip = createMockClip({
    name: 'Test Video.mp4',
    duration: 10000, // 10 seconds
    startTime: 5000  // starts at 5s
  })

  it('renders clip with correct name', () => {
    render(<TimelineClip clip={mockClip} />)
    
    expect(screen.getByText('Test Video.mp4')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(
      <TimelineClip 
        clip={mockClip} 
        onClick={handleClick}
      />
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledWith(mockClip.id)
  })

  it('shows duration in correct format', () => {
    render(<TimelineClip clip={mockClip} />)
    
    expect(screen.getByText('00:10')).toBeInTheDocument()
  })

  it('applies selected styles when selected', () => {
    const { rerender } = render(
      <TimelineClip clip={mockClip} isSelected={false} />
    )
    
    const clipElement = screen.getByRole('button')
    expect(clipElement).not.toHaveClass('ring-2')
    
    rerender(<TimelineClip clip={mockClip} isSelected={true} />)
    expect(clipElement).toHaveClass('ring-2', 'ring-primary')
  })
})
```

#### Hook Testing

```typescript
// src/features/media/__tests__/hooks/use-media-import.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMediaImport } from '../../hooks/use-media-import'
import { wrapper } from '@/test/test-utils'

// Mock Tauri commands
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}))

describe('useMediaImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('imports single file successfully', async () => {
    const mockFile = new File(['content'], 'video.mp4', {
      type: 'video/mp4'
    })
    
    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockResolvedValueOnce({
      id: 'file-123',
      path: '/path/to/video.mp4',
      metadata: {
        duration: 60,
        width: 1920,
        height: 1080
      }
    })

    const { result } = renderHook(() => useMediaImport(), { wrapper })

    await act(async () => {
      await result.current.importFiles([mockFile])
    })

    expect(result.current.importedFiles).toHaveLength(1)
    expect(result.current.importedFiles[0]).toMatchObject({
      id: 'file-123',
      path: '/path/to/video.mp4'
    })
    expect(result.current.isImporting).toBe(false)
  })

  it('handles import errors gracefully', async () => {
    const mockFile = new File(['content'], 'corrupt.mp4', {
      type: 'video/mp4'
    })
    
    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockRejectedValueOnce(
      new Error('Invalid video format')
    )

    const { result } = renderHook(() => useMediaImport(), { wrapper })

    await act(async () => {
      await result.current.importFiles([mockFile])
    })

    expect(result.current.error).toBe('Invalid video format')
    expect(result.current.importedFiles).toHaveLength(0)
  })

  it('tracks import progress', async () => {
    const { result } = renderHook(() => useMediaImport(), { wrapper })
    const progressValues: number[] = []

    // Subscribe to progress changes
    result.current.onProgress((progress) => {
      progressValues.push(progress)
    })

    await act(async () => {
      // Simulate import with progress
      await result.current.importFiles([mockFile])
    })

    expect(progressValues).toContain(0)
    expect(progressValues).toContain(100)
    expect(progressValues.length).toBeGreaterThan(2)
  })
})
```

#### Service and State Machine Testing

```typescript
// src/features/timeline/__tests__/services/timeline-machine.test.ts
import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { timelineMachine } from '../../services/timeline-machine'
import { createMockProject, createMockClip } from '../test-utils'

describe('timelineMachine', () => {
  it('initializes with empty project', () => {
    const actor = createActor(timelineMachine)
    actor.start()

    const snapshot = actor.getSnapshot()
    expect(snapshot.value).toBe('idle')
    expect(snapshot.context.project).toBeNull()
    expect(snapshot.context.selectedClipIds).toEqual([])
  })

  it('loads project and transitions to ready state', () => {
    const actor = createActor(timelineMachine)
    actor.start()

    const mockProject = createMockProject()
    actor.send({ type: 'LOAD_PROJECT', project: mockProject })

    const snapshot = actor.getSnapshot()
    expect(snapshot.value).toBe('ready')
    expect(snapshot.context.project).toEqual(mockProject)
  })

  it('handles clip selection', () => {
    const actor = createActor(timelineMachine)
    actor.start()

    const mockProject = createMockProject({
      clips: [
        createMockClip({ id: 'clip-1' }),
        createMockClip({ id: 'clip-2' })
      ]
    })

    actor.send({ type: 'LOAD_PROJECT', project: mockProject })
    actor.send({ type: 'SELECT_CLIP', clipId: 'clip-1' })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.selectedClipIds).toContain('clip-1')
  })

  it('handles undo/redo operations', () => {
    const actor = createActor(timelineMachine)
    actor.start()

    // Load project and make change
    actor.send({ type: 'LOAD_PROJECT', project: mockProject })
    actor.send({ type: 'ADD_CLIP', clip: newClip })

    // Verify clip was added
    let snapshot = actor.getSnapshot()
    expect(snapshot.context.project.clips).toContain(newClip)

    // Undo action
    actor.send({ type: 'UNDO' })
    snapshot = actor.getSnapshot()
    expect(snapshot.context.project.clips).not.toContain(newClip)

    // Redo action
    actor.send({ type: 'REDO' })
    snapshot = actor.getSnapshot()
    expect(snapshot.context.project.clips).toContain(newClip)
  })
})
```

### Test Utilities

```typescript
// src/test/test-utils.tsx
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/test-i18n'

// Test providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  )
}

// Custom render with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockMediaFile = (overrides?: Partial<MediaFile>): MediaFile => ({
  id: `file-${Math.random()}`,
  path: '/test/video.mp4',
  name: 'test-video.mp4',
  type: 'video',
  size: 1024 * 1024 * 10,
  duration: 60,
  metadata: {
    width: 1920,
    height: 1080,
    fps: 30,
    codec: 'h264'
  },
  ...overrides
})

export const createMockClip = (overrides?: Partial<Clip>): Clip => ({
  id: `clip-${Math.random()}`,
  mediaFileId: 'file-123',
  trackId: 'track-1',
  startTime: 0,
  endTime: 5000,
  trimStart: 0,
  trimEnd: 5000,
  effects: [],
  ...overrides
})
```

### Mocking External Dependencies

```typescript
// src/test/mocks/tauri.ts
import { vi } from 'vitest'

export const mockTauriAPI = () => {
  // Mock invoke
  vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn((cmd: string, args?: unknown) => {
      switch (cmd) {
        case 'get_media_metadata':
          return Promise.resolve({
            duration: 60,
            width: 1920,
            height: 1080
          })
        case 'process_video':
          return Promise.resolve({ success: true })
        default:
          return Promise.reject(new Error(`Unknown command: ${cmd}`))
      }
    })
  }))

  // Mock file operations
  vi.mock('@tauri-apps/plugin-fs', () => ({
    readFile: vi.fn(() => Promise.resolve(new Uint8Array())),
    writeFile: vi.fn(() => Promise.resolve()),
    exists: vi.fn(() => Promise.resolve(true))
  }))

  // Mock dialogs
  vi.mock('@tauri-apps/plugin-dialog', () => ({
    open: vi.fn(() => Promise.resolve('/path/to/file.mp4')),
    save: vi.fn(() => Promise.resolve('/path/to/save.mp4'))
  }))
}
```

## 🦀 Backend Testing (Rust)

### Test Structure

```rust
// src-tauri/src/media/processor.rs

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    // Test helper functions
    fn create_test_video() -> PathBuf {
        let temp_dir = TempDir::new().unwrap();
        let video_path = temp_dir.path().join("test.mp4");
        
        // Create test video file
        fs::write(&video_path, include_bytes!("../../../tests/fixtures/sample.mp4"))
            .unwrap();
        
        video_path
    }

    #[test]
    fn test_get_video_metadata() {
        let video_path = create_test_video();
        
        let metadata = get_video_metadata(&video_path).unwrap();
        
        assert_eq!(metadata.duration, 10.0);
        assert_eq!(metadata.width, 1920);
        assert_eq!(metadata.height, 1080);
        assert_eq!(metadata.fps, 30.0);
    }

    #[tokio::test]
    async fn test_process_video_async() {
        let video_path = create_test_video();
        let output_path = TempDir::new().unwrap().path().join("output.mp4");
        
        let options = ProcessOptions {
            quality: Quality::High,
            format: OutputFormat::Mp4,
            gpu_acceleration: true,
        };
        
        let result = process_video(&video_path, &output_path, options).await;
        
        assert!(result.is_ok());
        assert!(output_path.exists());
        
        // Verify output file is valid
        let output_metadata = get_video_metadata(&output_path).unwrap();
        assert!(output_metadata.duration > 0.0);
    }

    #[test]
    fn test_invalid_video_handling() {
        let invalid_path = PathBuf::from("/nonexistent/video.mp4");
        
        let result = get_video_metadata(&invalid_path);
        
        assert!(result.is_err());
        match result {
            Err(MediaError::FileNotFound(path)) => {
                assert_eq!(path, invalid_path.to_string_lossy());
            }
            _ => panic!("Expected FileNotFound error"),
        }
    }
}
```

### Integration Tests

```rust
// src-tauri/tests/integration_test.rs
use tauri::test::{mock_builder, MockRuntime};
use timeline_studio::commands;

#[test]
fn test_import_media_command() {
    let app = mock_builder::<MockRuntime>()
        .invoke_handler(tauri::generate_handler![
            commands::import_media_file
        ])
        .build(tauri::generate_context!())
        .expect("Failed to build app");

    let window = app.get_webview_window("main").unwrap();
    
    // Test command
    let result: serde_json::Value = tauri::test::get_ipc_response(
        &window,
        tauri::test::InvokeRequest {
            cmd: "import_media_file".into(),
            callback: tauri::ipc::CallbackFn(0),
            error: tauri::ipc::CallbackFn(1),
            body: serde_json::json!({
                "path": "/path/to/video.mp4"
            }),
            ..Default::default()
        },
    )
    .unwrap();

    assert!(result["success"].as_bool().unwrap());
    assert!(result["metadata"].is_object());
}

#[test]
fn test_concurrent_processing() {
    use std::sync::Arc;
    use tokio::sync::Semaphore;
    
    #[tokio::test]
    async fn process_multiple_videos() {
        let semaphore = Arc::new(Semaphore::new(3)); // Max 3 concurrent
        let mut handles = vec![];
        
        for i in 0..10 {
            let permit = semaphore.clone().acquire_owned().await.unwrap();
            let handle = tokio::spawn(async move {
                let _permit = permit;
                
                // Process video
                let result = process_video_async(i).await;
                assert!(result.is_ok());
            });
            
            handles.push(handle);
        }
        
        // Wait for all tasks to complete
        for handle in handles {
            handle.await.unwrap();
        }
    }
}
```

## 🎭 E2E Testing (Playwright)

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'bun run tauri dev',
    port: 1420,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
```

### E2E Scenarios

```typescript
// e2e/specs/video-import-workflow.spec.ts
import { test, expect } from '@playwright/test'
import { MediaImportPage } from '../pages/media-import.page'
import { TimelinePage } from '../pages/timeline.page'

test.describe('Video Import Workflow', () => {
  let mediaImportPage: MediaImportPage
  let timelinePage: TimelinePage

  test.beforeEach(async ({ page }) => {
    mediaImportPage = new MediaImportPage(page)
    timelinePage = new TimelinePage(page)
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('imports video and adds to timeline', async ({ page }) => {
    // Open import dialog
    await mediaImportPage.openImportDialog()
    
    // Load test video
    const videoPath = 'e2e/fixtures/sample-video.mp4'
    await mediaImportPage.selectFile(videoPath)
    
    // Wait for processing to complete
    await expect(mediaImportPage.processingIndicator).toBeVisible()
    await expect(mediaImportPage.processingIndicator).toBeHidden({
      timeout: 30000
    })
    
    // Verify video appears in browser
    const videoItem = mediaImportPage.getMediaItem('sample-video.mp4')
    await expect(videoItem).toBeVisible()
    
    // Drag to timeline
    await videoItem.dragTo(timelinePage.timeline)
    
    // Verify clip appears on timeline
    const clip = timelinePage.getClip('sample-video.mp4')
    await expect(clip).toBeVisible()
    
    // Check clip metadata
    await clip.click()
    await expect(timelinePage.clipDuration).toHaveText('00:10')
    await expect(timelinePage.clipResolution).toHaveText('1920x1080')
  })

  test('handles multiple file import', async ({ page }) => {
    const files = [
      'e2e/fixtures/video1.mp4',
      'e2e/fixtures/video2.mp4',
      'e2e/fixtures/audio.mp3'
    ]
    
    await mediaImportPage.openImportDialog()
    await mediaImportPage.selectMultipleFiles(files)
    
    // Check progress for each file
    for (const file of files) {
      const progressBar = mediaImportPage.getProgressBar(file)
      await expect(progressBar).toBeVisible()
      await expect(progressBar).toHaveAttribute('aria-valuenow', '100', {
        timeout: 60000
      })
    }
    
    // Verify all files imported
    expect(await mediaImportPage.getMediaCount()).toBe(3)
  })

  test('shows error for unsupported format', async ({ page }) => {
    await mediaImportPage.openImportDialog()
    await mediaImportPage.selectFile('e2e/fixtures/document.pdf')
    
    // Check error message
    await expect(mediaImportPage.errorToast).toBeVisible()
    await expect(mediaImportPage.errorToast).toContainText(
      'Unsupported file format'
    )
  })
})
```

### Page Objects

```typescript
// e2e/pages/media-import.page.ts
import { Page, Locator } from '@playwright/test'

export class MediaImportPage {
  readonly page: Page
  readonly importButton: Locator
  readonly processingIndicator: Locator
  readonly errorToast: Locator
  readonly mediaBrowser: Locator

  constructor(page: Page) {
    this.page = page
    this.importButton = page.getByRole('button', { name: 'Import Media' })
    this.processingIndicator = page.getByTestId('processing-indicator')
    this.errorToast = page.getByRole('alert')
    this.mediaBrowser = page.getByTestId('media-browser')
  }

  async openImportDialog() {
    await this.importButton.click()
  }

  async selectFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
  }

  async selectMultipleFiles(filePaths: string[]) {
    const fileInput = this.page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePaths)
  }

  getMediaItem(fileName: string): Locator {
    return this.mediaBrowser.getByRole('button', { name: fileName })
  }

  getProgressBar(fileName: string): Locator {
    return this.page.getByRole('progressbar', { name: `Importing ${fileName}` })
  }

  async getMediaCount(): Promise<number> {
    const items = await this.mediaBrowser.getByRole('button').all()
    return items.length
  }
}
```

## 🚀 Performance Testing

### Rust Benchmarks

```rust
// benches/video_processing.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use timeline_studio::media::processor::*;

fn benchmark_video_processing(c: &mut Criterion) {
    let video_path = "benches/fixtures/sample_4k.mp4";
    
    c.bench_function("process_4k_video", |b| {
        b.iter(|| {
            let options = ProcessOptions {
                quality: Quality::High,
                format: OutputFormat::Mp4,
                gpu_acceleration: true,
            };
            
            process_video(
                black_box(&video_path),
                black_box("/tmp/output.mp4"),
                black_box(options)
            )
        });
    });
    
    c.bench_function("extract_thumbnails", |b| {
        b.iter(|| {
            extract_thumbnails(
                black_box(&video_path),
                black_box(10), // 10 thumbnails
                black_box(320), // width
                black_box(180)  // height
            )
        });
    });
}

criterion_group!(benches, benchmark_video_processing);
criterion_main!(benches);
```

### Frontend Performance Profiling

```typescript
// src/test/performance/timeline-performance.test.ts
import { test, expect } from '@playwright/test'

test.describe('Timeline Performance', () => {
  test('renders 1000 clips without lag', async ({ page }) => {
    await page.goto('/')
    
    // Load large project
    await page.evaluate(() => {
      // Create 1000 clips programmatically
      const clips = Array.from({ length: 1000 }, (_, i) => ({
        id: `clip-${i}`,
        startTime: i * 1000,
        duration: 1000,
        // ...
      }))
      
      window.timelineService.loadProject({ clips })
    })
    
    // Measure scroll performance
    const metrics = await page.evaluate(async () => {
      const start = performance.now()
      
      // Scroll timeline
      const timeline = document.querySelector('.timeline-container')
      timeline.scrollTo({ left: 10000, behavior: 'smooth' })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const end = performance.now()
      return {
        scrollTime: end - start,
        fps: await measureFPS()
      }
    })
    
    // Check performance
    expect(metrics.scrollTime).toBeLessThan(100) // < 100ms
    expect(metrics.fps).toBeGreaterThan(30) // > 30 FPS
  })
})

// FPS measurement utility
async function measureFPS() {
  return new Promise((resolve) => {
    let frameCount = 0
    let lastTime = performance.now()
    
    function countFrames() {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        resolve(frameCount)
      } else {
        requestAnimationFrame(countFrames)
      }
    }
    
    requestAnimationFrame(countFrames)
  })
}
```

## 📊 Code Coverage

### Coverage Setup

```json
// package.json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:coverage:ui": "vitest --ui --coverage",
    "test:coverage:report": "vitest run --coverage && npx nyc report --reporter=text-lcov | coveralls"
  }
}
```

### Coverage Analysis

```bash
# Generate coverage report
bun run test:coverage

# Result
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   82.45 |    78.32 |   85.21 |   82.45 |
 features/timeline     |   89.12 |    84.56 |   91.23 |   89.12 |
  components           |   91.45 |    88.76 |   93.21 |   91.45 |
  hooks                |   87.65 |    82.34 |   89.45 |   87.65 |
  services             |   86.78 |    79.45 |   88.12 |   86.78 |
 features/media        |   78.45 |    72.34 |   80.12 |   78.45 |
-----------------------|---------|----------|---------|---------|

# Open HTML report
open coverage/index.html
```

### Improving Coverage

```typescript
// Add tests for uncovered branches
describe('EdgeCases', () => {
  it('handles network errors', async () => {
    // Mock network error
    server.use(
      rest.post('/api/upload', (req, res, ctx) => {
        return res.networkError('Failed to connect')
      })
    )
    
    const { result } = renderHook(() => useUpload())
    
    await act(async () => {
      await result.current.upload(file)
    })
    
    expect(result.current.error).toBe('Network error')
  })
  
  it('handles timeout', async () => {
    vi.useFakeTimers()
    
    const { result } = renderHook(() => useUpload({ timeout: 5000 }))
    
    act(() => {
      result.current.upload(largeFile)
    })
    
    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    
    expect(result.current.error).toBe('Upload timeout')
    
    vi.useRealTimers()
  })
})
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Run linting
        run: bun run lint
        
      - name: Run type checking
        run: bun run type-check
        
      - name: Run tests with coverage
        run: bun run test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        
      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
        
      - name: Run tests
        run: |
          cd src-tauri
          cargo test --all-features
          
      - name: Run clippy
        run: |
          cd src-tauri
          cargo clippy -- -D warnings
          
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup environment
        run: |
          bun install
          bunx playwright install
          
      - name: Build application
        run: bun run build
        
      - name: Run E2E tests
        run: bun run test:e2e
        
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 🎯 Best Practices

### 1. Test Isolation

```typescript
// ✅ Good - isolated test
describe('VideoPlayer', () => {
  let mockVideoElement: HTMLVideoElement
  
  beforeEach(() => {
    // Create clean mock for each test
    mockVideoElement = {
      play: vi.fn(),
      pause: vi.fn(),
      currentTime: 0,
      duration: 100
    } as any
    
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'video') return mockVideoElement
      return document.createElement(tag)
    })
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  it('plays video', () => {
    // Test is isolated from others
  })
})

// ❌ Bad - depends on global state
let globalPlayer

describe('VideoPlayer', () => {
  it('test 1', () => {
    globalPlayer = new VideoPlayer()
    // Modifies global state
  })
  
  it('test 2', () => {
    // Depends on previous test
    globalPlayer.play()
  })
})
```

### 2. Descriptive Names

```typescript
// ✅ Good
describe('MediaImporter', () => {
  describe('when importing video files', () => {
    it('should extract metadata including duration, resolution and codec', () => {})
    it('should generate thumbnail at 25% of video duration', () => {})
    it('should reject files larger than 4GB with descriptive error', () => {})
  })
})

// ❌ Bad
describe('MediaImporter', () => {
  it('test1', () => {})
  it('works', () => {})
  it('error', () => {})
})
```

### 3. Arrange-Act-Assert

```typescript
it('should calculate timeline duration from clips', () => {
  // Arrange - prepare data
  const clips = [
    createMockClip({ startTime: 0, endTime: 5000 }),
    createMockClip({ startTime: 3000, endTime: 8000 }),
    createMockClip({ startTime: 10000, endTime: 15000 })
  ]
  const timeline = new Timeline()
  
  // Act - perform action
  timeline.addClips(clips)
  const duration = timeline.calculateDuration()
  
  // Assert - verify result
  expect(duration).toBe(15000)
})
```

### 4. Edge Case Testing

```typescript
describe('ClipTrimmer', () => {
  it('handles minimum trim (1 frame)', () => {
    const clip = createClip({ duration: 10000, fps: 30 })
    const frameDuration = 1000 / 30 // ~33.33ms
    
    clip.trim(0, frameDuration)
    
    expect(clip.duration).toBeCloseTo(frameDuration, 2)
  })
  
  it('prevents negative trim values', () => {
    const clip = createClip({ duration: 5000 })
    
    expect(() => clip.trim(-100, 1000)).toThrow('Invalid trim range')
  })
  
  it('handles floating point precision', () => {
    const clip = createClip({ duration: 3333.333 })
    
    clip.trim(1111.111, 2222.222)
    
    expect(clip.trimStart).toBe(1111.111)
    expect(clip.trimEnd).toBe(2222.222)
    expect(clip.getDuration()).toBeCloseTo(1111.111, 3)
  })
})
```

### 5. Async Testing

```typescript
// ✅ Correct async handling
it('processes video with progress updates', async () => {
  const onProgress = vi.fn()
  
  const processPromise = processVideo(file, { onProgress })
  
  // Check initial progress
  await waitFor(() => {
    expect(onProgress).toHaveBeenCalledWith(0)
  })
  
  // Wait for intermediate updates
  await waitFor(() => {
    expect(onProgress).toHaveBeenCalledWith(50)
  })
  
  // Wait for completion
  const result = await processPromise
  expect(onProgress).toHaveBeenCalledWith(100)
  expect(result.success).toBe(true)
})

// ❌ Incorrect handling
it('processes video', () => {
  const result = processVideo(file) // Forgot await!
  expect(result.success).toBe(true) // Will always fail
})
```

## 📚 Additional Resources

### Testing Tool Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Rust Testing Guide](https://doc.rust-lang.org/book/ch11-00-testing.html)

### Test Examples in Project
- Frontend components: `src/features/*/\__tests__/components/`
- Frontend hooks: `src/features/*/\__tests__/hooks/`
- Backend: `src-tauri/src/*/tests.rs`
- E2E: `e2e/specs/`

---

[← Back to Developer Guide](README.md) | [Next: Contributing →](contributing.md)