# CLI App Workspace

This workspace package is the package-manager shell for the existing Timeline Studio CLI.

Runtime code still lives in `src/cli` during Phase F5. Scripts proxy to root commands so the current CLI entry points and behavior remain unchanged while the repo gains app-level workspace metadata.

Useful commands:

```bash
bun run --cwd apps/cli check:type
bun run --cwd apps/cli test
bun run --cwd apps/cli video:status
```
