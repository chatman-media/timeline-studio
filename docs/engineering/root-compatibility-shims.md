# Root Compatibility Shims

**Status:** Completed Phase G shim migration path for closed [#285](https://github.com/chatman-media/timeline-studio/issues/285)
**Related:** [External And Headless Integration Contracts](external-headless-contracts.md), [Package Boundaries](package-boundaries.md)

Phase F moved core workspace ownership into `packages/*` and `apps/*`, but the repository still has root paths that are intentionally kept for compatibility. This document records the owner, migration path, and removal condition for each group. Removing a shim before its replacement path is documented is out of scope.

## Policy

- Keep root compatibility paths only when current desktop, Next, Tauri, test, or legacy import flows still require them.
- Do not expose root paths as supported external/headless integration points.
- Prefer package exports, core ports, or CLI contracts for new consumers.
- Remove a shim only after import consumers are migrated and the replacement is documented.

## Inventory

| Path | Owner | Current role | Migration path | Removal condition |
| --- | --- | --- | --- | --- |
| `src/app` | `@timeline-studio/desktop` | Root Next app router entrypoint | Move app router ownership into `apps/desktop` when Next/Tauri root discovery is replaced or wrapped | Next/Tauri build/dev no longer discovers app router from root |
| `src/config` | `@timeline-studio/desktop` | Desktop app composition providers and service config | Move desktop composition into `apps/desktop` or expose app-owned wrappers | Root app router no longer imports these providers |
| `next.config.ts` | `@timeline-studio/desktop` | Root Next/Tauri static export config | Move/bridge through `apps/desktop` once build scripts run from the desktop app workspace | Root `next` commands no longer load this file directly |
| `src-tauri` | `@timeline-studio/desktop` and Rust CLI crates | Native Tauri shell and Rust workspace integration | Keep Tauri shell internal; expose headless capabilities through Rust `timeline` CLI and Node adapters | Tauri CLI can run from app-owned workspace or explicit wrapper |
| `src/features` | `@timeline-studio/desktop` / feature owners | Desktop feature UI and app-level feature implementations | Move only package-safe reusable surfaces into `packages/ui`; keep domain-backed app features in desktop app shell | No root feature import remains outside desktop/app-shell compatibility |
| `src/components/ui` | `@timeline-studio/ui` | Root compatibility for shared UI primitives | Prefer `@timeline-studio/ui/components/*` imports for new package-safe consumers | Existing root UI imports are migrated or wrapped |
| `src/lib` | Shared app utilities, owner by consumer | Logging, env, Tauri utility and general helpers still imported by app/features/packages | Move platform-neutral helpers into `packages/core` and app-specific helpers into `apps/desktop` | No package/core/adapters import requires root helper aliases |
| `src/types/contracts` | Contract owners / shared-types | Legacy `ProjectSchema` and agent-facing contract imports | Prefer `@timeline/shared-types/schema` for external consumers; keep legacy types until internal adapters migrate | Internal imports no longer depend on root contract files |
| `src/types/generated` | Desktop/Tauri generated bindings | Tauri generated TypeScript bindings for app/runtime internals | Keep as desktop/internal implementation detail; do not expose to headless consumers | Generated bindings are produced into an app-owned package or explicit internal export |
| `src/test` | Test infrastructure | Root Vitest setup, shared mocks, and test utilities | Split domain/package setup into workspace-local helpers under G5 | Workspace tests no longer require root global setup for package-specific services |
| `src/hooks`, `src/i18n`, `src/global`, `src/styles`, `src/components/error-boundary.tsx` | Desktop/app-shell owners | Root app UI utilities and global app support | Move or wrap under `apps/desktop` when desktop root compatibility is reduced | Desktop root entrypoints no longer import these paths directly |

## Retired Shim Groups

| Retired path | Replacement | Evidence | Guardrail |
| --- | --- | --- | --- |
| `src/cli/index.ts` | `apps/cli/src/index.ts` | H3 migrated production systemd units to the workspace CLI entrypoint. The root CLI path has no filesystem owner and must not be used by production/headless docs or config. | `bun run check:shims:retired` |

## External Contract Rule

The supported external/headless path is not a root shim path. External consumers should use:

- `@timeline/shared-types/schema` for `ProjectSchema`;
- Rust `timeline` for render/publish/schema emission where Rust owns production work;
- `render-job`, `bot-workflow`, `bot-worker`, and `bot-cleanup` for Node orchestration.

Run the external contract guardrail locally:

```bash
bun run check:boundaries:external
```

This check scans documented external/headless code examples and fails if they recommend root aliases, `src-tauri` internals, or package-private source paths.

Run the root shim retirement guardrail locally:

```bash
bun run check:shims:retired
```

This check fails if production/headless docs or config reintroduce retired root CLI references.
