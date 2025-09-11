# Coding Standards

[← Back to Developer Guide](README.md)

## 📋 Contents

- [General Principles](#general-principles)
- [TypeScript/JavaScript](#typescriptjavascript)
- [React Components](#react-components)
- [Rust Code](#rust-code)
- [CSS and Styles](#css-and-styles)
- [Testing](#testing)
- [Documentation](#documentation)
- [Git and Commits](#git-and-commits)

## 🎯 General Principles

### Code Philosophy

1. **Readability over brevity** - Code is read more often than written
2. **Explicit over implicit** - Avoid magic numbers and strings
3. **Composition over inheritance** - Use component composition
4. **Simplicity over complexity** - KISS (Keep It Simple, Stupid)
5. **DRY (Don't Repeat Yourself)** - But not at the expense of readability

### Naming

```typescript
// ✅ Good
const getUserById = (userId: string) => {}
const isVideoPlaying = true
const MAX_RETRY_COUNT = 3

// ❌ Bad
const getUser = (id: string) => {}  // Unclear which ID
const playing = true  // Unclear what is playing
const MAX = 3  // Unclear maximum of what
```

## 📘 TypeScript/JavaScript

### Basic Rules

1. **Use TypeScript strict mode**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

2. **Avoid `any` types**
   ```typescript
   // ❌ Bad
   const processData = (data: any) => {}
   
   // ✅ Good
   const processData = (data: MediaFile) => {}
   const processGenericData = <T>(data: T) => {}
   ```

3. **Import ordering**
   ```typescript
   // 1. Built-in Node.js modules
   import { readFile } from 'fs/promises'
   
   // 2. External dependencies
   import React, { useState } from 'react'
   import { motion } from 'framer-motion'
   
   // 3. Internal absolute imports
   import { useTimeline } from '@/features/timeline'
   import { Button } from '@/components/ui'
   
   // 4. Relative imports
   import { VideoPlayer } from './components/video-player'
   import type { MediaFile } from './types'
   
   // 5. CSS imports
   import './styles.css'
   ```

4. **File naming**
   - Components: `kebab-case` (e.g., `video-player.tsx`)
   - Hooks: `use-` prefix (e.g., `use-timeline.ts`)
   - Utilities: `kebab-case` (e.g., `media-utils.ts`)
   - Types: `kebab-case` (e.g., `timeline-types.ts`)
   - Constants: `kebab-case` (e.g., `app-constants.ts`)

5. **Exports**
   ```typescript
   // ✅ Prefer named exports
   export const VideoPlayer = () => {}
   export const useVideoPlayer = () => {}
   
   // ❌ Avoid default exports (except Next.js pages)
   export default VideoPlayer
   ```

### Functions and Methods

```typescript
// ✅ Good - clear names and types
interface ProcessVideoOptions {
  quality: 'low' | 'medium' | 'high'
  format: 'mp4' | 'webm'
}

export const processVideo = async (
  file: File,
  options: ProcessVideoOptions
): Promise<ProcessedVideo> => {
  // Input validation
  if (!file || file.size === 0) {
    throw new Error('Invalid file provided')
  }
  
  // Main logic
  const result = await processFile(file, options)
  
  return result
}

// ❌ Bad - unclear types and names
export const process = async (f: any, opts: any) => {
  return await doStuff(f, opts)
}
```

### Async/Await and Error Handling

```typescript
// ✅ Good
export const loadMediaFile = async (path: string): Promise<MediaFile> => {
  try {
    const metadata = await getFileMetadata(path)
    const thumbnail = await generateThumbnail(path)
    
    return {
      path,
      metadata,
      thumbnail
    }
  } catch (error) {
    console.error(`Failed to load media file: ${path}`, error)
    throw new MediaLoadError(`Cannot load file: ${path}`, { cause: error })
  }
}

// ❌ Bad
export const loadMedia = (path: string) => {
  return getFileMetadata(path)
    .then(metadata => generateThumbnail(path)
      .then(thumbnail => ({ path, metadata, thumbnail })))
    .catch(e => console.log(e))
}
```

## ⚛️ React Components

### Component Structure

```typescript
// ✅ Good - clear structure
import { FC, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'

import { useTimeline } from '@/features/timeline'
import { Button } from '@/components/ui'
import { formatTime } from '@/lib/utils'

import type { MediaFile } from './types'

interface VideoPlayerProps {
  file: MediaFile
  autoPlay?: boolean
  onTimeUpdate?: (time: number) => void
}

export const VideoPlayer: FC<VideoPlayerProps> = ({
  file,
  autoPlay = false,
  onTimeUpdate
}) => {
  // 1. Hooks
  const { isPlaying, currentTime } = useTimeline()
  const [volume, setVolume] = useState(1)
  
  // 2. Computed values
  const formattedTime = useMemo(
    () => formatTime(currentTime),
    [currentTime]
  )
  
  // 3. Handlers
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
  }, [])
  
  // 4. Effects
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime)
    }
  }, [currentTime, onTimeUpdate])
  
  // 5. Render
  return (
    <div className="video-player">
      <video
        src={file.path}
        autoPlay={autoPlay}
      />
      <div className="controls">
        <span>{formattedTime}</span>
        <Button onClick={handleVolumeChange}>
          Volume: {volume}
        </Button>
      </div>
    </div>
  )
}
```

### Hooks

```typescript
// ✅ Good - clear contract and types
interface UseMediaProcessorOptions {
  onProgress?: (progress: number) => void
  maxConcurrent?: number
}

interface UseMediaProcessorReturn {
  process: (files: File[]) => Promise<ProcessedFile[]>
  isProcessing: boolean
  progress: number
  error: Error | null
}

export const useMediaProcessor = (
  options: UseMediaProcessorOptions = {}
): UseMediaProcessorReturn => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  
  const process = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      // Processing logic
      return processedFiles
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [options])
  
  return {
    process,
    isProcessing,
    progress,
    error
  }
}
```

### Memoization

```typescript
// ✅ Use memoization for expensive computations
const MemoizedComponent = React.memo(ExpensiveComponent, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.id === nextProps.id && 
         prevProps.version === nextProps.version
})

// ✅ useMemo for expensive calculations
const expensiveValue = useMemo(
  () => calculateExpensiveValue(data),
  [data]
)

// ✅ useCallback for stable references
const handleClick = useCallback((id: string) => {
  dispatch({ type: 'SELECT', payload: id })
}, [dispatch])
```

## 🦀 Rust Code

### Basic Rules

1. **Follow Rust conventions**
   ```rust
   // Naming
   mod video_processor;  // snake_case for modules
   struct MediaFile;     // PascalCase for types
   const MAX_SIZE: u64;  // SCREAMING_SNAKE_CASE for constants
   fn process_video();   // snake_case for functions
   ```

2. **Error handling**
   ```rust
   use thiserror::Error;
   
   #[derive(Error, Debug)]
   pub enum VideoError {
       #[error("File not found: {0}")]
       FileNotFound(String),
       
       #[error("Invalid format: expected {expected}, got {actual}")]
       InvalidFormat { expected: String, actual: String },
       
       #[error("Processing failed")]
       ProcessingError(#[from] std::io::Error),
   }
   
   pub fn process_video(path: &str) -> Result<Video, VideoError> {
       let file = std::fs::read(path)
           .map_err(|_| VideoError::FileNotFound(path.to_string()))?;
       
       // Processing...
       Ok(video)
   }
   ```

3. **Documentation**
   ```rust
   /// Processes a video file with the given options.
   /// 
   /// # Arguments
   /// 
   /// * `path` - Path to the video file
   /// * `options` - Processing options
   /// 
   /// # Examples
   /// 
   /// ```
   /// let video = process_video("video.mp4", Default::default())?;
   /// ```
   /// 
   /// # Errors
   /// 
   /// Returns `VideoError` if:
   /// - File doesn't exist
   /// - Format is not supported
   /// - Processing fails
   pub fn process_video(path: &str, options: ProcessOptions) -> Result<Video, VideoError> {
       // Implementation
   }
   ```

4. **Safety and performance**
   ```rust
   // ✅ Use borrowing instead of cloning
   fn process_data(data: &[u8]) -> Result<(), Error> {
       // Work with borrowed data
   }
   
   // ✅ Avoid unwrap() in production code
   let value = some_option.ok_or_else(|| Error::MissingValue)?;
   
   // ✅ Use iterators
   let sum: i32 = numbers
       .iter()
       .filter(|&&x| x > 0)
       .map(|&x| x * 2)
       .sum();
   ```

## 🎨 CSS and Styles

### Tailwind CSS

```tsx
// ✅ Good - use cn() utility for conditional classes
import { cn } from '@/lib/utils'

<div className={cn(
  "flex items-center gap-2 p-4",
  "hover:bg-gray-100 dark:hover:bg-gray-800",
  "transition-colors duration-200",
  isActive && "bg-blue-100 dark:bg-blue-900",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />

// ❌ Bad - complex logic in className
<div className={`flex ${isActive ? 'bg-blue-100' : ''} ${isDisabled ? 'opacity-50' : ''}`} />
```

### CSS Variables

```css
/* ✅ Use CSS variables for theming */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 346.8 77.2% 49.8%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
}

/* Usage */
.button {
  background-color: hsl(var(--primary));
  border-radius: var(--radius);
}
```

### Component Styles

```typescript
// ✅ Use cva for component variants
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  // ...
}
```

## 🧪 Testing

### Test Structure

```typescript
// ✅ Good - descriptive tests
describe('VideoPlayer', () => {
  describe('playback controls', () => {
    it('should start playing when play button is clicked', () => {
      // Arrange
      const { getByRole } = render(<VideoPlayer file={mockFile} />)
      const playButton = getByRole('button', { name: /play/i })
      
      // Act
      fireEvent.click(playButton)
      
      // Assert
      expect(mockVideoElement.play).toHaveBeenCalled()
    })
    
    it('should pause when clicking on playing video', () => {
      // Test implementation
    })
  })
  
  describe('error handling', () => {
    it('should show error message when video fails to load', () => {
      // Test implementation
    })
  })
})
```

### Mocks and Test Data

```typescript
// __tests__/test-utils.ts
export const createMockMediaFile = (overrides?: Partial<MediaFile>): MediaFile => ({
  id: 'test-id',
  path: '/test/video.mp4',
  name: 'test-video.mp4',
  size: 1024 * 1024 * 10, // 10MB
  duration: 60, // 1 minute
  ...overrides
})

// Usage in tests
const mockFile = createMockMediaFile({ name: 'custom.mp4' })
```

## 📝 Documentation

### JSDoc Comments

```typescript
/**
 * Processes a video file with the given parameters
 * 
 * @param file - Video file to process
 * @param options - Processing options
 * @returns Promise with processed video
 * 
 * @example
 * ```ts
 * const processed = await processVideo(file, {
 *   quality: 'high',
 *   format: 'mp4'
 * })
 * ```
 * 
 * @throws {VideoProcessingError} If processing fails
 */
export async function processVideo(
  file: File,
  options: ProcessOptions
): Promise<ProcessedVideo> {
  // Implementation
}
```

### Module READMEs

```markdown
# Timeline Feature

Timeline management module for Timeline Studio.

## Structure

- `components/` - React components
- `hooks/` - Custom hooks
- `services/` - Business logic
- `types/` - TypeScript types

## Usage

\```typescript
import { useTimeline } from '@/features/timeline'

const MyComponent = () => {
  const { clips, addClip } = useTimeline()
  // ...
}
\```

## API

### useTimeline()
Main hook for timeline operations...
```

## 🔄 Git and Commits

### Commit Format

Following [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

<body>

<footer>

# Examples
feat(timeline): add multi-clip selection support
fix(export): fix crash when exporting 4K video
docs(api): update Timeline API documentation
style(ui): align component spacing
refactor(player): simplify playback logic
test(effects): add tests for new effects
chore(deps): update dependencies
```

### Commit Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code formatting
- `refactor` - Code refactoring without changing functionality
- `test` - Adding or changing tests
- `chore` - Dependency updates, configuration
- `perf` - Performance improvements

### Branch Rules

```bash
# Feature branches
feature/add-video-effects
feature/timeline-improvements

# Bugfix branches
fix/export-crash
fix/memory-leak

# Hotfix branches (for production)
hotfix/critical-security-issue
```

## 🔍 Code Review Checklist

### Before Submitting PR

- [ ] Code follows project standards
- [ ] Self-reviewed code
- [ ] Added comments in complex areas
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests for changes
- [ ] All tests pass locally

### During Code Review

- [ ] Logic is clear and correct
- [ ] No obvious performance issues
- [ ] Adequate error handling
- [ ] Tests cover main scenarios
- [ ] No code duplication
- [ ] TypeScript types are correct

## 📚 Additional Resources

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)

---

[← Back to Developer Guide](README.md) | [Next: Testing →](testing.md)