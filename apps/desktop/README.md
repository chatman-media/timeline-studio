# Desktop App Workspace

This workspace package owns the current Next/Tauri desktop app.

Runtime entrypoints still live in root-owned compatibility paths because the current root `next dev/build` and Tauri static export flow resolve the Next project from the repository root. Ownership is recorded in [entrypoints.json](./entrypoints.json):

| Path | Owner | Reason |
|------|-------|--------|
| `src/app` | `@timeline-studio/desktop` | Next app-router entrypoint discovered by the root Next project |
| `src/config` | `@timeline-studio/desktop` | Desktop composition providers used by `src/app` |
| `next.config.ts` | `@timeline-studio/desktop` | Root Next config used by root scripts and Tauri export |
| `src-tauri` | `@timeline-studio/desktop` | Native Tauri shell and bundle config |

New desktop entrypoint work should either move into `apps/desktop` when the root Next/Tauri constraint is removed or update this manifest when a root compatibility path remains necessary.

Useful commands:

```bash
bun run --cwd apps/desktop dev
bun run --cwd apps/desktop build
bun run --cwd apps/desktop check:type
```
