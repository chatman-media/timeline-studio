# 12. Testing

Timeline Studio testing documentation.

## 📋 Contents

- [test-summary.md](test-summary.md) - Real media files testing implementation summary

## 🎯 Testing Types

1. **Unit Tests** - Testing individual components
2. **Integration Tests** - Testing module interactions
3. **E2E Tests** - End-to-end user scenario testing
4. **Performance Tests** - Performance testing
5. **Media Tests** - Testing with real media files

## 🚀 Quick Start

```bash
# Frontend tests
bun run test

# Backend tests  
cd src-tauri && cargo test

# E2E tests
bun run test:e2e

# Code coverage
bun run test:coverage
```

---

[← To Development](../05_development/README.md) | [To CI/CD →](../13_ci_cd/README.md)