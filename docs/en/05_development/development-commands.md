# Development Commands

Complete reference for all available commands for Timeline Studio development.

## 🚀 Main Development Commands

### Development Mode Launch
```bash
# Start Next.js development server
bun run dev

# Start full Tauri application in development mode  
bun run tauri dev

# Start regular Next.js server
bun run start
```

### Project Build
```bash
# Build Next.js frontend
bun run build

# Build with bundle analysis (for codecov)
bun run build:analyze

# Build full Tauri application
bun run tauri build
```

## 🧹 Linting and Formatting

### JavaScript/TypeScript
```bash
# Check JS/TS code with ESLint
bun run lint

# Auto-fix ESLint errors (includes linting + formatting)
bun run lint:fix

# Format code only
bun run format

# Check formatting without changes
bun run format:check
```

### CSS
```bash
# Check CSS with Stylelint
bun run lint:css

# Auto-fix Stylelint errors
bun run lint:css:fix
```

### Rust
```bash
# Check Rust code with Clippy
bun run lint:rust

# Auto-fix Clippy errors  
bun run lint:rust:fix

# Format Rust code
bun run format:rust

# Check formatting without changes
bun run format:rust:check

# Comprehensive Rust check
bun run check:rust
```

### Comprehensive Commands
```bash
# Run all checks and tests
bun run check:all

# Fix all auto-fixable errors
bun run fix:all

# Fix all Rust errors
bun run fix:rust
```

## 🧪 Testing

### Frontend Tests (Vitest)
```bash
# Run all tests
bun run test

# Run only app tests (src/features)
bun run test:app

# Run tests in watch mode
bun run test:watch

# Run tests with UI interface
bun run test:ui

# Run tests with coverage
bun run test:coverage

# Run tests with coverage for codecov
bun run test:coverage:codecov

# Generate and upload coverage report
bun run test:coverage:report

# Upload coverage report
bun run test:coverage:upload
```

### Backend Tests (Rust)
```bash
# Run Rust tests
bun run test:rust

# Run Rust tests in watch mode
bun run test:rust:watch

# Run Rust tests with coverage
bun run test:coverage:rust

# Generate and upload Rust coverage report
bun run test:coverage:rust:report
```

### E2E Tests (Playwright)
```bash
# Install Playwright browsers
bun run playwright:install

# Run all E2E tests
bun run test:e2e

# Run E2E tests with UI
bun run test:e2e:ui

# Run basic media import test
bun run test:e2e:basic

# Run tests with real media files
bun run test:e2e:real

# Run integration tests
bun run test:e2e:integration
```

### Running Specific Tests
```bash
# Test specific file
bun run test src/features/timeline/__tests__/use-timeline.test.ts

# Test specific function/component
bun run test src/features/effects

# Rust test specific module
cd src-tauri && cargo test recognition::
```

## 📚 Documentation

```bash
# Generate API documentation
bun run docs

# Generate documentation in watch mode
bun run docs:watch
```

## 🎨 Promo Page

```bash
# Develop promo page
bun run promo:dev

# Build promo page
bun run promo:build

# Preview promo page
bun run promo:preview
```

## 🔧 Additional Commands

```bash
# Direct Tauri CLI call
bun run tauri [command]

# Example: create icons
bun run tauri icon path/to/icon.png
```

## ⚡ Quick Commands for Developers

### Daily Development
```bash
# Quick development start
bun run tauri dev

# Check everything before commit
bun run check:all

# Quick fix all errors
bun run fix:all
```

### Code Quality Check
```bash
# Only linting without tests
bun run lint && bun run lint:css && bun run lint:rust

# Only formatting
bun run format && bun run format:rust

# Only tests
bun run test && bun run test:rust
```

### Working with Coverage
```bash
# Full coverage (frontend + backend)
bun run test:coverage && bun run test:coverage:rust

# Upload coverage to codecov
bun run test:coverage:report && bun run test:coverage:rust:report
```

## 📋 Environment Variables

### For Development
```bash
# For bundle analysis
ANALYZE=true bun run build

# For codecov
CODECOV_TOKEN=your_token bun run test:coverage:codecov

# For integration tests
INTEGRATION_TEST=true bun run test:e2e:integration
```

### For Rust
```bash
# For Rust coverage
RUSTFLAGS="-Cinstrument-coverage" cargo test
LLVM_PROFILE_FILE="timeline-studio-%p-%m.profraw" cargo test
```

## 🔍 Useful Aliases

Recommended aliases for `.bashrc` or `.zshrc`:

```bash
alias tdev="bun run tauri dev"
alias ttest="bun run test && bun run test:rust"  
alias tlint="bun run check:all"
alias tfix="bun run fix:all"
alias tbuild="bun run tauri build"
```