# Desktop App Workspace

This workspace package is the package-manager shell for the current Next/Tauri desktop app.

Runtime code still lives in the root `src/app`, `src/config`, and `src-tauri` trees during Phase F5. Scripts proxy to the root commands so local desktop behavior stays unchanged while package metadata, dependency graph and CI cache keys become workspace-aware.

Useful commands:

```bash
bun run --cwd apps/desktop dev
bun run --cwd apps/desktop build
bun run --cwd apps/desktop check:type
```
