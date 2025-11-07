# 05. Developer Guide

[← Back to contents](../README.md)

## 📋 Contents

- [Environment Setup](setup.md)
- [Coding Standards](coding-standards.md)
- [Testing](testing.md)
- [Development Commands](development-commands.md) ⭐ **Complete command reference**
- [package.json Reference](package-scripts-reference.md) 📋 **All 48 commands with descriptions**
- [Linting and Formatting](linting-and-formatting.md) ⭐ **Code quality tools**
- [Version Management](version-management.md) 📦 **Centralized version management**
- [Contributing](contributing.md)

### 🎯 Quality Assurance

- [Module Finalization Checklist](../14_quality_assurance/module-finalization-checklist.md) ✅ **Module readiness criteria**
- [Module Finalization Progress](../14_quality_assurance/modules-finalization-progress.md) 📊 **Progress tracking**

## 🎯 Who This Guide Is For

This guide is designed for:
- Developers working on Timeline Studio
- Open-source community contributors
- Those who want to extend functionality

## 🚀 Developer Quick Start

### 1. Environment Setup

```bash
# Clone and setup
git clone https://github.com/your-org/timeline-studio.git
cd timeline-studio
bun install

# Setup pre-commit hooks
bun run prepare

# Run in dev mode
bun run tauri dev
```

### 2. Main Commands

```bash
# Development
bun run dev              # Frontend only (Next.js)
bun run tauri dev        # Full app (Tauri)
bun run build            # Build production
bun run tauri build      # Build Tauri app

# Testing (4,158 tests)
bun run test            # Frontend tests (3,604)
bun run test:rust       # Backend tests (554)
bun run test:e2e        # E2E tests (Playwright)
bun run test:coverage   # Coverage report

# Code quality
bun run lint            # ESLint + Stylelint + Clippy
bun run check:all       # All checks + tests  
bun run fix:all         # Auto-fix all issues
```

📋 **[All 48 commands →](package-scripts-reference.md)**

## 📁 Development Structure

### Frontend Development

```
src/
├── features/           # Feature modules
│   └── feature-name/
│       ├── components/ # React components
│       ├── hooks/      # Custom hooks
│       ├── services/   # Business logic
│       ├── types/      # TypeScript types
│       └── __tests__/  # Tests
│
├── components/ui/      # Common UI components
├── lib/               # Utilities
└── test/              # Test utilities
```

### Backend Development

```
src-tauri/
├── src/
│   ├── commands/      # Tauri commands
│   ├── media/         # Media processing
│   ├── video_compiler/# Video compilation
│   └── recognition/   # ML functions
│
├── Cargo.toml         # Rust dependencies
└── tauri.conf.json    # Configuration
```

## 🔧 Workflow

### 1. Creating New Feature

```bash
# Create branch
git checkout -b feature/new-feature

# Create module structure
mkdir -p src/features/new-feature/{components,hooks,services,types,__tests__}

# Add README
touch src/features/new-feature/README.md
```

### 2. Component Development

```typescript
// src/features/new-feature/components/my-component.tsx
import { FC } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  onAction: () => void
}

export const MyComponent: FC<MyComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <div className={cn("my-component")}>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  )
}
```

### 3. Writing Tests

```typescript
// src/features/new-feature/__tests__/my-component.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { MyComponent } from '../components/my-component'

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test" onAction={() => {}} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  it('calls onAction when clicked', () => {
    const onAction = vi.fn()
    render(<MyComponent title="Test" onAction={onAction} />)
    
    screen.getByRole('button').click()
    expect(onAction).toHaveBeenCalled()
  })
})
```

## 📊 Quality Metrics

### Code Requirements

- **TypeScript**: Strict mode, no `any`
- **Test Coverage**: Minimum 70%
- **Documentation**: README for each module
- **Performance**: < 16ms for renders

### Automated Checks

```yaml
# .github/workflows/ci.yml
- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests (Vitest)
- E2E tests (Playwright)
- Build verification
```

## 🛠️ Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "tauri-apps.tauri-vscode",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

### Debugging

#### Frontend Debugging
1. Open DevTools: `Cmd/Ctrl + Shift + I`
2. Use React DevTools
3. View XState visualization

#### Backend Debugging
1. Use `println!` for logs
2. Run with `RUST_LOG=debug`
3. Use `cargo test` for unit tests

## 🚨 Common Issues

### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install
```

### Rust compilation errors
```bash
# Update dependencies
cd src-tauri
cargo update
cargo clean
cargo build
```

### Tauri command not working
- Check command registration in `main.rs`
- Ensure correct argument types
- Check command name (snake_case in Rust, camelCase in JS)

## 📈 Best Practices

### 1. Component Composition
- Prefer composition over inheritance
- Use small, reusable components
- Follow single responsibility principle

### 2. State Management
- Local state for UI
- XState for complex logic
- Context for global state

### 3. Performance
- Use `React.memo` for heavy components
- Apply `useMemo` and `useCallback`
- Virtualize long lists

### 4. Typing
- Always define interfaces for props
- Use TypeScript utility types
- Avoid `any` and `unknown`

## 🔗 Additional Resources

### Internal
- [Creating New Module](creating-features.md)
- [Working with XState](xstate-patterns.md)
- [Performance Optimization](../07-guides/performance.md)

### External
- [Tauri Documentation](https://tauri.app/v2/guides/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Rust Book](https://doc.rust-lang.org/book/)

---

[← Functionality](../03-features/README.md) | [Next: Environment Setup →](setup.md)