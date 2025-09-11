# Code Linting and Formatting

Comprehensive guide to setting up and using code quality tools in Timeline Studio.

## 🎯 Tools Overview

Timeline Studio uses several tools to ensure code quality:

- **ESLint** - JavaScript/TypeScript linting
- **Stylelint** - CSS linting
- **Clippy** - Rust code linting  
- **rustfmt** - Rust code formatting
- **Biome** - Alternative fast linter/formatter
- **Prettier** - Built into ESLint configuration

## 📁 Configuration Files

### ESLint
- **File**: `eslint.config.mjs`
- **Based on**: ESLint 9 with flat config
- **Plugins**: TypeScript, React, Import ordering
- **Features**:
  - TypeScript strict mode support
  - Automatic import sorting
  - React hooks rules
  - Next.js specific rules

### Stylelint  
- **File**: `.stylelintrc.json`
- **Configuration**: Standard + Tailwind CSS
- **Features**:
  - Tailwind CSS directives support (@apply, @layer, etc.)
  - Ignore duplicate selectors for Tailwind
  - Auto-fix on save (in VS Code)

### Clippy (Rust)
- **File**: `src-tauri/Cargo.toml` + CLI flags
- **Level**: `-D warnings` (warnings as errors)
- **Features**:
  - Strict code quality rules
  - Auto-fixes where possible
  - Unused code detection

### Biome
- **File**: `biome.json`
- **Alternative to**: ESLint + Prettier
- **Advantages**: Significantly faster than ESLint

## 🚀 Linting Commands

### JavaScript/TypeScript (ESLint)

```bash
# Check all TS/JS files
bun run lint

# Auto-fix errors
bun run lint:fix

# Format imports only
bun run format:imports

# Windows versions (work around path issues)
bun run lint:windows
bun run lint:fix:windows
bun run format:imports:windows
```

**What's checked:**
- TypeScript syntax errors
- Unused variables and imports
- React hooks rules
- Import order (builtin → external → internal → sibling)
- Code style and formatting

### CSS (Stylelint)

```bash
# Check all CSS files
bun run lint:css

# Auto-fix errors
bun run lint:css:fix
```

**What's checked:**
- CSS syntax and validity
- Tailwind CSS compatibility
- Property order
- Duplicate rules (except Tailwind)

### Rust (Clippy + rustfmt)

```bash
# Linting only
bun run lint:rust

# Auto-fix errors
bun run lint:rust:fix

# Formatting only
bun run format:rust

# Check formatting (CI)
bun run format:rust:check

# Comprehensive check
bun run check:rust
```

**What's checked:**
- Potential bugs and unsafe code
- Performance and Rust idioms
- Unused code and imports
- Coding style
- Formatting (indentation, spaces, etc.)

### Biome (alternative)

```bash
# Check (linting + formatting)
bun run biome:check

# Auto-fix
bun run biome:check:apply

# Formatting only
bun run biome:format

# Linting only
bun run biome:lint

# Auto-fix linting
bun run biome:lint:fix
```

## 🔄 Comprehensive Commands

### Check Entire Project
```bash
# Full check (linting + tests)
bun run check:all

# Only linting all languages
bun run lint && bun run lint:css && bun run lint:rust
```

### Auto-fix Everything
```bash
# Fix all auto-fixable errors
bun run fix:all

# Rust fixes only
bun run fix:rust
```

## ⚙️ IDE Setup

### VS Code

Recommended extensions:
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss", 
    "stylelint.vscode-stylelint",
    "rust-lang.rust-analyzer",
    "biomejs.biome"
  ]
}
```

Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  },
  "rust-analyzer.checkOnSave.command": "clippy",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### JetBrains IDEs

1. Install plugins:
   - ESLint
   - Stylelint  
   - Rust
   - Tailwind CSS

2. Enable auto-fix on save:
   - File → Settings → Tools → Actions on Save
   - ✅ Reformat code
   - ✅ Run eslint --fix
   - ✅ Run code cleanup

## 🤖 CI/CD Integration

### GitHub Actions

Workflow files:
- `lint-js.yml` - JS/TS checking (runs on JS/TS file changes)
- `lint-css.yml` - CSS checking (runs on CSS file changes)  
- `lint-rs.yml` - Rust checking (runs on Rust file changes)
- `check-all.yml` - full check (always runs)

### Pre-commit Hooks

Can be set up with `husky`:

```bash
# Install husky
bun add -D husky

# Setup pre-commit hook
echo "bun run check:all" > .husky/pre-commit
chmod +x .husky/pre-commit
```

## 🚨 Troubleshooting

### Common ESLint Errors

**Issue**: `import/order` errors
```bash
# Solution: auto-fix imports
bun run format:imports
```

**Issue**: TypeScript type errors  
```bash
# Solution: check tsconfig.json and types
bun run lint --ext .ts,.tsx --no-fix
```

### Common Stylelint Errors

**Issue**: Tailwind directives not recognized
```json
// .stylelintrc.json - check configuration
{
  "extends": ["stylelint-config-tailwindcss"],
  "rules": {
    "at-rule-no-unknown": [true, {
      "ignoreAtRules": ["tailwind", "apply", "variants", "responsive", "screen"]
    }]
  }
}
```

### Common Clippy Errors

**Issue**: `clippy::assertions_on_constants`
```rust
// Bad
assert!(true);

// Good - remove or replace with meaningful check
// If test reaches end of function - it's successful
```

**Issue**: `clippy::unused_variables`
```rust
// Bad
let unused_var = 42;

// Good - add _ prefix
let _unused_var = 42;
// or use the variable
```

## 📊 Quality Metrics

### Project Goals
- **ESLint**: 0 errors, 0 warnings
- **Stylelint**: 0 errors
- **Clippy**: 0 errors (warnings as errors)
- **rustfmt**: all files formatted

### Monitoring
- CI/CD status badges in README
- Automatic PR checks
- Code coverage in codecov

## 🔧 Custom Rules

### Disabling ESLint Rules
```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      // Disable specific rule
      '@typescript-eslint/no-unused-vars': 'off',
      
      // Change level
      'import/order': 'warn'
    }
  }
];
```

### Disabling Clippy Rules
```rust
// For entire file
#![allow(clippy::too_many_arguments)]

// For function
#[allow(clippy::redundant_closure)]
fn example() {}

// For code block
#[allow(clippy::needless_return)]
{
    return value;
}
```

### Ignoring Files

**ESLint** (`.eslintignore`):
```
dist/
node_modules/
*.generated.ts
```

**Stylelint** (`.stylelintignore`):
```
dist/
node_modules/
*.min.css
```

**rustfmt** (`src-tauri/.rustfmt.toml`):
```toml
ignore = [
    "src/generated/",
]
```