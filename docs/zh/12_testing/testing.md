# Timeline Studio Testing Guide

## Overview

Timeline Studio uses a comprehensive testing strategy covering unit tests, integration tests, and end-to-end tests for both frontend and backend code.

## Testing Stack

- **Frontend**: Vitest + Testing Library
- **Backend**: Rust built-in testing + cargo-test
- **E2E**: Playwright (planned)
- **Coverage**: c8 for frontend, cargo-tarpaulin for backend

## Running Tests

### All Tests
```bash
# Run all tests (frontend + backend)
bun run test:all

# Run with coverage
bun run test:coverage
```

### Frontend Tests
```bash
# Run all frontend tests
bun run test

# Run in watch mode
bun run test:watch

# Run specific test file
bun run test src/features/timeline/__tests__/use-timeline.test.ts

# Run with coverage
bun run test:coverage
```

### Backend Tests
```bash
# Run all Rust tests
bun run test:rust

# Run specific module tests
cd src-tauri && cargo test recognition

# Run with verbose output
cd src-tauri && cargo test -- --nocapture
```

### E2E Tests (when implemented)
```bash
# Run Playwright tests
bun run test:e2e

# Run in headed mode
bun run test:e2e --headed
```

## Writing Tests

### Frontend Unit Tests

#### Component Testing
```typescript
import { render, screen } from '@/test/test-utils';
import { VideoPlayer } from '../components/video-player';

describe('VideoPlayer', () => {
  it('should render play button', () => {
    render(<VideoPlayer src="video.mp4" />);
    
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
});
```

#### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useTimeline } from '../hooks/use-timeline';

describe('useTimeline', () => {
  it('should add clip to timeline', () => {
    const { result } = renderHook(() => useTimeline());
    
    act(() => {
      result.current.addClip({
        id: '1',
        source: 'video.mp4',
        duration: 10
      });
    });
    
    expect(result.current.clips).toHaveLength(1);
  });
});
```

#### XState Machine Testing
```typescript
import { createActor } from 'xstate';
import { timelineMachine } from '../services/timeline-machine';

describe('timelineMachine', () => {
  it('should transition to playing state', async () => {
    const actor = createActor(timelineMachine);
    actor.start();
    
    actor.send({ type: 'PLAY' });
    
    expect(actor.getSnapshot().matches('playing')).toBe(true);
  });
});
```

### Backend Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_video_metadata_extraction() {
        let metadata = extract_metadata("test.mp4").unwrap();
        
        assert_eq!(metadata.duration, 120.0);
        assert_eq!(metadata.width, 1920);
        assert_eq!(metadata.height, 1080);
    }
    
    #[tokio::test]
    async fn test_async_operation() {
        let result = process_video("test.mp4").await;
        
        assert!(result.is_ok());
    }
}
```

## Test Organization

### Frontend Structure
```
feature/
├── __tests__/
│   ├── components/
│   │   └── component.test.tsx
│   ├── hooks/
│   │   └── use-hook.test.ts
│   ├── services/
│   │   └── service.test.ts
│   └── utils/
│       └── util.test.ts
└── __mocks__/
    └── service.mock.ts
```

### Backend Structure
```
module/
├── mod.rs
├── tests.rs          # Unit tests
└── tests/
    └── integration/  # Integration tests
```

## Mocking

### Frontend Mocks

#### Tauri API Mocking
```typescript
// __mocks__/@tauri-apps/api/tauri.ts
export const invoke = vi.fn().mockImplementation((cmd: string, args?: any) => {
  switch (cmd) {
    case 'get_media_metadata':
      return Promise.resolve({
        duration: 120,
        width: 1920,
        height: 1080
      });
    default:
      return Promise.resolve();
  }
});
```

#### Service Mocking
```typescript
// __mocks__/media-service.ts
export const MediaService = {
  loadMedia: vi.fn().mockResolvedValue({
    id: '1',
    path: 'video.mp4',
    type: 'video'
  }),
  
  getThumbnail: vi.fn().mockResolvedValue('data:image/png;base64,...')
};
```

### Backend Mocks

```rust
#[cfg(test)]
mod mock_ffmpeg {
    pub fn extract_frame(_: &str, _: f64) -> Result<Vec<u8>> {
        Ok(vec![0; 100]) // Mock image data
    }
}
```

## Test Utilities

### Custom Render Function
```typescript
// test/test-utils.tsx
import { render as rtlRender } from '@testing-library/react';
import { TimelineProvider } from '@/features/timeline/providers';

export function render(ui: React.ReactElement, options?: any) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <TimelineProvider>
        {children}
      </TimelineProvider>
    ),
    ...options
  });
}
```

### Test Data Builders
```typescript
// test/builders/timeline.builder.ts
export class TimelineBuilder {
  private timeline = {
    tracks: [],
    duration: 0
  };
  
  withTrack(track: Track) {
    this.timeline.tracks.push(track);
    return this;
  }
  
  build() {
    return this.timeline;
  }
}
```

## Coverage Requirements

### Target Coverage
- **Overall**: >80%
- **Critical modules**: >90%
  - Timeline
  - Video Compiler
  - Export
- **New code**: 100%

### Current Coverage Status
```
Module              Coverage    Target    Status
─────────────────────────────────────────────────
timeline            84.44%      90%       ⚠️
video-player        86.15%      80%       ✅
export              3.64%       90%       ❌
subtitles           8.41%       80%       ❌
templates           9.63%       80%       ❌
effects             84.61%      80%       ✅
filters             81.48%      80%       ✅
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup
        run: |
          npm install -g bun
          bun install
      
      - name: Lint
        run: bun run lint
      
      - name: Test
        run: bun run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### 1. Test Naming
```typescript
// Good
it('should display error message when video fails to load', () => {});

// Bad
it('test error', () => {});
```

### 2. Arrange-Act-Assert
```typescript
it('should update timeline when clip is moved', () => {
  // Arrange
  const timeline = createTimeline();
  const clip = createClip();
  
  // Act
  timeline.moveClip(clip.id, 10);
  
  // Assert
  expect(timeline.getClip(clip.id).position).toBe(10);
});
```

### 3. Test Isolation
- Each test should be independent
- Clean up after tests
- Don't rely on test order

### 4. Async Testing
```typescript
it('should load media file', async () => {
  const media = await MediaService.load('video.mp4');
  
  expect(media).toBeDefined();
  expect(media.type).toBe('video');
});
```

## Debugging Tests

### Frontend
```bash
# Run single test with debugging
bun run test:debug path/to/test.ts

# Use console.log in tests
DEBUG=* bun run test
```

### Backend
```bash
# Run with print output
cargo test -- --nocapture

# Run specific test
cargo test test_name -- --exact
```

## Performance Testing

### Benchmark Tests
```typescript
import { bench } from 'vitest';

bench('timeline render performance', () => {
  const timeline = createLargeTimeline(1000); // 1000 clips
  renderTimeline(timeline);
});
```

### Load Testing
```rust
#[bench]
fn bench_video_processing(b: &mut Bencher) {
    b.iter(|| {
        process_video("large_video.mp4")
    });
}
```

## Common Testing Patterns

### Testing Error States
```typescript
it('should handle network errors gracefully', async () => {
  mockInvoke.mockRejectedValueOnce(new Error('Network error'));
  
  const { result } = renderHook(() => useMediaLoader());
  
  await waitFor(() => {
    expect(result.current.error).toBe('Failed to load media');
  });
});
```

### Testing Loading States
```typescript
it('should show loading spinner while fetching', async () => {
  const { getByTestId, queryByTestId } = render(<MediaBrowser />);
  
  expect(getByTestId('loading-spinner')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});
```

### Testing User Interactions
```typescript
it('should delete clip when delete button clicked', async () => {
  const user = userEvent.setup();
  const onDelete = vi.fn();
  
  render(<Clip onDelete={onDelete} />);
  
  await user.click(screen.getByRole('button', { name: /delete/i }));
  
  expect(onDelete).toHaveBeenCalledOnce();
});
```

---

*For specific testing examples, see the test files in each feature directory.*