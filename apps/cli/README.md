# CLI App Workspace

This workspace package owns the Timeline Studio CLI entrypoint and commands.

Runtime code lives in `apps/cli/src`. Legacy root scripts for video and AI utilities remain available for developer compatibility, but new CLI command work should start in this workspace.

Useful commands:

```bash
bun run --cwd apps/cli cli -- --help
bun run --cwd apps/cli check:type
bun run --cwd apps/cli test
bun run --cwd apps/cli video:status
```

Command reference: [COMMANDS.md](./COMMANDS.md)
