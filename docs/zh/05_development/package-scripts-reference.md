# package.json Scripts Reference

Complete reference for all available npm/bun scripts in Timeline Studio with up-to-date descriptions.

## 📊 Command Statistics

**Total commands**: 54  
**Main**: 8  
**Linting**: 12  
**Testing**: 20  
**Other**: 14  

## 🚀 Main Development Commands

### Application Launch
| Command | Description | When to use |
|---------|-------------|-------------|
| `bun run dev` | Launch Next.js with turbopack | Frontend-only development |
| `bun run tauri dev` | Launch full Tauri application | Full development with backend |
| `bun run start` | Launch production Next.js server | Test production build |

### Building
| Command | Description | When to use |
|---------|-------------|-------------|
| `bun run build` | Build Next.js without linting | Quick frontend build |
| `bun run build:analyze` | Build with bundle analysis | Bundle size analysis for CI |
| `bun run tauri build` | Full Tauri application build | Create release version |

### Utilities
| Command | Description | When to use |
|---------|-------------|-------------|
| `bun run tauri` | Direct Tauri CLI call | Tauri-specific commands |

## 🧹 Linting and Formatting (12 commands)

### JavaScript/TypeScript
| Command | Description | Auto-fix |
|---------|-------------|---------|
| `bun run lint` | ESLint check TS/JS | ❌ |
| `bun run lint:fix` | ESLint with auto-fix | ✅ |
| `bun run lint:windows` | ESLint for Windows | ❌ |
| `bun run lint:fix:windows` | ESLint auto-fix for Windows | ✅ |
| `bun run format:imports` | Format imports | ✅ |
| `bun run format:imports:windows` | Format imports for Windows | ✅ |

### CSS
| Command | Description | Auto-fix |
|---------|-------------|---------|
| `bun run lint:css` | Stylelint check CSS | ❌ |
| `bun run lint:css:fix` | Stylelint with auto-fix | ✅ |

### Rust
| Command | Description | Auto-fix |
|---------|-------------|---------|
| `bun run lint:rust` | Clippy check Rust code | ❌ |
| `bun run lint:rust:fix` | Clippy with auto-fix | ✅ |
| `bun run format:rust` | rustfmt formatting | ✅ |
| `bun run format:rust:check` | Check formatting (CI) | ❌ |

### Comprehensive Commands
| Command | Description | What's included |
|---------|-------------|----------------|
| `bun run check:all` | All checks + tests | lint + lint:css + format:imports + check:rust + test + test:rust |
| `bun run check:rust` | All Rust checks | lint:rust + format:rust:check |
| `bun run fix:all` | All auto-fixes | lint:css:fix + format:imports + fix:rust |
| `bun run fix:rust` | All Rust auto-fixes | format:rust + lint:rust:fix |

## 🧪 Testing (20 commands)

### Frontend Tests (Vitest)
| Command | Description | Scope |
|---------|-------------|-------|
| `bun run test` | All frontend tests | All *.test.ts files |
| `bun run test:app` | App tests only | src/features only |
| `bun run test:watch` | Tests in watch mode | Code changes |
| `bun run test:ui` | Tests with UI interface | Vitest UI |
| `bun run test:coverage` | Tests with coverage | Coverage report |
| `bun run test:coverage:codecov` | Coverage for codecov | With CODECOV_TOKEN |
| `bun run test:coverage:report` | Generate + upload | test:coverage + upload |
| `bun run test:coverage:upload` | Upload only | scripts/upload-coverage.sh |

### Backend Tests (Rust)
| Command | Description | Scope |
|---------|-------------|-------|
| `bun run test:rust` | All Rust tests | cargo test |
| `bun run test:rust:watch` | Rust tests in watch | cargo watch -x test |
| `bun run test:coverage:rust` | Rust coverage | cargo llvm-cov |
| `bun run test:coverage:rust:report` | Rust coverage + upload | llvm-cov + upload |

### E2E Tests (Playwright)
| Command | Description | Scope |
|---------|-------------|-------|
| `bun run playwright:install` | Install browsers | Playwright browsers |
| `bun run test:e2e` | All E2E tests | All *.spec.ts in e2e/ |
| `bun run test:e2e:ui` | E2E with UI | Playwright UI |
| `bun run test:e2e:basic` | Basic import test | media-import-basic.spec.ts |
| `bun run test:e2e:real` | Tests with real files | media-import-real-files.spec.ts |
| `bun run test:e2e:integration` | Integration tests | INTEGRATION_TEST=true |
| `bun run test:e2e:video-compilation` | Video compilation tests | video-compilation-workflow.spec.ts |
| `bun run test:e2e:gpu` | GPU acceleration tests | gpu-acceleration.spec.ts |
| `bun run test:e2e:caching` | Caching tests | caching-workflow.spec.ts |
| `bun run test:e2e:video-all` | All video tests | Comprehensive video test suite |

## 🔧 Biome (alternative linter, 5 commands)

| Command | Description | What it does |
|---------|-------------|--------------|
| `bun run biome:check` | Check with Biome | Linting + formatting |
| `bun run biome:check:apply` | Auto-fix | --write flag |
| `bun run biome:format` | Formatting only | Code formatting |
| `bun run biome:lint` | Linting only | Rules checking |
| `bun run biome:lint:fix` | Auto-fix linting | --write for linting |

## 📚 Documentation (2 commands)

| Command | Description | Output |
|---------|-------------|--------|
| `bun run docs` | Generate TypeDoc | ./docs/ directory |
| `bun run docs:watch` | Documentation in watch | Auto-update on changes |

## 🎨 Promo Page (3 commands)

| Command | Description | Where to run |
|---------|-------------|--------------|
| `bun run promo:dev` | Promo development | cd promo && bun run dev |
| `bun run promo:build` | Promo build | cd promo && bun run build |
| `bun run promo:preview` | Promo preview | cd promo && bun run preview |

## 📋 Command Usage by Task

### 🔥 Daily Development
```bash
# Start development
bun run tauri dev

# Check before commit
bun run check:all

# Quick error fixes
bun run fix:all
```

### 🧪 Testing
```bash
# All tests
bun run test && bun run test:rust

# New tests only
bun run test:watch

# Coverage for upload
bun run test:coverage:report && bun run test:coverage:rust:report

# Specialized E2E tests
bun run test:e2e:video-all  # All video features
bun run test:e2e:gpu        # GPU acceleration
bun run test:e2e:caching    # Caching system
```

### 🚀 Release Preparation
```bash
# Full check
bun run check:all

# Build with analysis
bun run build:analyze

# Final build
bun run tauri build
```

### 🔍 Problem Debugging
```bash
# Linting only (no tests)
bun run lint && bun run lint:css && bun run lint:rust

# Formatting only
bun run format:imports && bun run format:rust

# Specific module
bun run test src/features/timeline
```

## 🎯 Commands by Usage Frequency

### Very Often (daily)
- `bun run tauri dev`
- `bun run test`
- `bun run lint:fix`

### Often (weekly)
- `bun run check:all`
- `bun run test:rust`
- `bun run fix:all`

### Medium (before release)
- `bun run build:analyze`
- `bun run test:e2e`
- `bun run docs`

### Rarely (setup/CI)
- `bun run playwright:install`
- `bun run biome:*`
- `bun run promo:*`

## ⚠️ Important Notes

### Windows Users
- Use commands with `:windows` suffix if regular ones don't work
- `format:imports:windows` and `lint:fix:windows` commands work around path issues

### CI/CD
- `build:analyze` requires `CODECOV_TOKEN` variable
- `test:e2e:integration` requires `INTEGRATION_TEST=true`
- `test:coverage:codecov` uses codecov token

### Performance
- Biome commands work significantly faster than ESLint
- `test:watch` is more efficient for iterative development
- `check:rust` is faster than separate `lint:rust` + `format:rust:check`