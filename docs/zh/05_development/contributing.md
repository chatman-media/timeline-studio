# Contributing Guide

[← Back to Developer Guide](README.md)

## 📋 Contents

- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Creating Pull Requests](#creating-pull-requests)
- [Code Style](#code-style)
- [Writing Tests](#writing-tests)
- [Documentation](#documentation)
- [Community](#community)
- [License](#license)

## 🚀 Getting Started

### 1. Fork the Repository

1. Go to the [Timeline Studio GitHub page](https://github.com/chatman-media/timeline-studio)
2. Click the "Fork" button in the top right corner
3. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/timeline-studio.git
cd timeline-studio
git remote add upstream https://github.com/chatman-media/timeline-studio.git
```

### 2. Setup Environment

Follow the [setup guide](setup.md) to install all dependencies.

### 3. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create new branch for your work
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## 🔄 Development Process

### 1. Choosing a Task

#### For New Contributors

Look for issues with labels:
- `good first issue` - Simple tasks to get started
- `help wanted` - Tasks where help is needed
- `documentation` - Documentation improvements

#### Creating a New Issue

Before starting work on a new feature:
1. Check existing issues
2. Create a new issue with description
3. Wait for discussion and approval

### 2. Development

#### Commit Structure

Following [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Examples
feat(timeline): add multi-track selection
fix(export): resolve memory leak in video encoding
docs(api): update Timeline API documentation
test(effects): add tests for blur effect
```

#### Commit Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Build tasks, package manager updates, etc.

#### Frequent Commits

```bash
# Commit often with clear messages
git add src/features/timeline/components/timeline-ruler.tsx
git commit -m "feat(timeline): add time markers to ruler"

git add src/features/timeline/__tests__/components/timeline-ruler.test.tsx
git commit -m "test(timeline): add tests for timeline ruler markers"
```

### 3. Testing

#### Running Tests

```bash
# Frontend tests
bun run test

# Backend tests
bun run test:rust

# E2E tests
bun run test:e2e

# All tests
bun run test:all
```

#### Writing Tests

For new features, ensure:
1. Add unit tests
2. Update integration tests if needed
3. Add E2E test for critical scenarios

Test structure example:
```
src/features/your-feature/
├── __tests__/
│   ├── components/
│   │   └── your-component.test.tsx
│   ├── hooks/
│   │   └── use-your-hook.test.ts
│   └── services/
│       └── your-service.test.ts
└── __mocks__/
    └── your-mock.ts
```

### 4. Documentation

#### Required Documentation

1. **JSDoc for public APIs**:
   ```typescript
   /**
    * Processes a video file with given parameters
    * @param file - File to process
    * @param options - Processing options
    * @returns Processed video
    * @throws {ProcessingError} If processing fails
    */
   export async function processVideo(
     file: File,
     options: ProcessOptions
   ): Promise<ProcessedVideo> {
     // ...
   }
   ```

2. **README for new modules**:
   ```markdown
   # Feature Name

   Feature description...

   ## Usage

   \```typescript
   import { useFeature } from '@/features/feature-name'
   \```

   ## API

   ### useFeature()
   ...
   ```

3. **Update existing documentation**:
   - API reference for new public methods
   - User guides for new features
   - Usage examples

### 5. Code Review

Before creating a PR, ensure:

```bash
# Linting
bun run lint
bun run lint:fix  # Auto-fix

# Formatting
bun run format:imports

# Type checking
bun run type-check

# All checks
bun run check:all
```

## 📝 Creating Pull Requests

### 1. Preparation

```bash
# Update branch relative to main
git fetch upstream
git rebase upstream/main

# Ensure all tests pass
bun run test:all

# Check linting
bun run check:all
```

### 2. Create PR

1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open [GitHub](https://github.com/chatman-media/timeline-studio) and create a Pull Request

3. Fill out the PR template:

```markdown
## Description

Brief description of changes and their purpose.

## Type of Change

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update required

## How Has This Been Tested?

Describe the tests you ran.

## Checklist

- [ ] My code follows the project style
- [ ] I have performed a self-review
- [ ] I have commented complex areas
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests for my changes
- [ ] All tests pass locally
```

### 3. Code Review

#### What We Check

- **Functionality**: Code works as expected
- **Tests**: Adequate test coverage
- **Performance**: No obvious issues
- **Security**: No vulnerabilities
- **Style**: Follows project standards
- **Documentation**: Up-to-date and clear

#### How to Respond to Comments

1. Be polite and constructive
2. If you disagree, provide reasoning
3. Fix issues in separate commits
4. Mark as resolved when fixed

### 4. After Approval

Project maintainers will:
1. Do final review
2. May ask to squash commits
3. Merge PR into main branch

## 🎨 Code Style

### TypeScript/JavaScript

```typescript
// ✅ Good
export const processVideo = async (
  file: File,
  options: ProcessOptions
): Promise<ProcessedVideo> => {
  if (!file || file.size === 0) {
    throw new Error('Invalid file provided')
  }

  try {
    const metadata = await extractMetadata(file)
    const processed = await encode(file, options)
    
    return {
      ...processed,
      metadata
    }
  } catch (error) {
    logger.error('Video processing failed', { error, file: file.name })
    throw new ProcessingError('Failed to process video', { cause: error })
  }
}

// ❌ Bad
export const processVideo = async (f, opts) => {
  const result = await doStuff(f, opts)
  return result
}
```

### React Components

```typescript
// ✅ Good - clear structure
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
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])
  
  useEffect(() => {
    // Playback logic
  }, [isPlaying, file])
  
  return (
    <div className="video-player">
      {/* UI components */}
    </div>
  )
}
```

Full code style guide: [coding-standards.md](coding-standards.md)

## 🧪 Writing Tests

### Unit Tests

```typescript
describe('VideoProcessor', () => {
  it('should process video with default options', async () => {
    // Arrange
    const file = new File([''], 'test.mp4', { type: 'video/mp4' })
    const processor = new VideoProcessor()
    
    // Act
    const result = await processor.process(file)
    
    // Assert
    expect(result).toMatchObject({
      format: 'mp4',
      quality: 'high',
      duration: expect.any(Number)
    })
  })
  
  it('should handle processing errors gracefully', async () => {
    // Arrange
    const corruptFile = new File(['corrupt'], 'bad.mp4')
    const processor = new VideoProcessor()
    
    // Act & Assert
    await expect(processor.process(corruptFile))
      .rejects.toThrow('Invalid video format')
  })
})
```

### E2E Tests

```typescript
test('user can import and edit video', async ({ page }) => {
  // Navigate
  await page.goto('/')
  
  // Import video
  await page.getByRole('button', { name: 'Import Media' }).click()
  await page.setInputFiles('input[type="file"]', 'e2e/fixtures/sample.mp4')
  
  // Wait for processing
  await expect(page.getByText('Processing...')).toBeVisible()
  await expect(page.getByText('Processing...')).toBeHidden({ timeout: 30000 })
  
  // Verify result
  const videoClip = page.getByRole('button', { name: 'sample.mp4' })
  await expect(videoClip).toBeVisible()
})
```

Full testing guide: [testing.md](testing.md)

## 💬 Community

### Where to Get Help

1. **GitHub Discussions** - For questions and discussions
2. **Discord** - For quick help and chat
3. **Issue Tracker** - For bugs and feature requests

### Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/). 

Key principles:
- Respectful communication
- Constructive criticism
- Help newcomers
- Be open to different opinions

### Recognition

All contributors are automatically added to:
- [Contributors list](https://github.com/chatman-media/timeline-studio/graphs/contributors)
- Project README.md file
- Release notes

## 📜 License

By contributing to Timeline Studio, you agree that your contributions will be licensed under the same license as the project.

## 🎯 Priority Areas

### High Priority

1. **Performance Optimization**
   - Large project rendering
   - 4K/8K video handling
   - Memory usage reduction

2. **New Effects and Transitions**
   - Modern visual effects
   - GPU-accelerated filters
   - Custom shaders

3. **UX Improvements**
   - Keyboard shortcuts
   - Drag & Drop
   - Context menus

### Medium Priority

1. **Integrations**
   - New social networks
   - Cloud storage
   - Stock libraries

2. **AI Features**
   - Smart cropping
   - Auto subtitles
   - Scene detection

3. **Documentation**
   - Video tutorials
   - Example projects
   - API guides

## 📚 Useful Resources

### Understanding the Codebase

1. [Application Architecture](../03_architecture/README.md)
2. [API Reference](../04_api_reference/README.md)
3. [Code Examples](../09_examples/README.md)

### External Resources

- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Rust Book](https://doc.rust-lang.org/book/)

## ✅ Final Checklist

Before submitting a PR, ensure:

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linters show no errors
- [ ] Documentation is updated
- [ ] Commits follow conventional commits
- [ ] PR has clear description
- [ ] Related issues are referenced

---

Thank you for contributing to Timeline Studio! 🎉

[← Back to Developer Guide](README.md)