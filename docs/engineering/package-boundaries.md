# Package Boundaries

**Status:** Phase F baseline for [#150](https://github.com/chatman-media/timeline-studio/issues/150)
**Updated:** 2026-06-08

This document defines the TypeScript package boundaries used during the modular architecture migration. Phase F6 removes hard `domains -> ui/app-shell` errors from the report; runtime code still lives under `src/*` and is reached through bridge wrappers so every migration PR can be verified before large file moves.

## Target Packages

| Package | Current path | Bridge alias | Responsibility |
|---------|--------------|--------------|----------------|
| `@timeline-studio/core` | `packages/core` -> `src/core` | `@timeline-studio/core`, `@timeline-studio/core/*` | Platform-neutral ports, DI container, shared runtime types |
| `@timeline-studio/domains` | `packages/domains` -> `src/domains` | `@timeline-studio/domains`, `@timeline-studio/domains/*` | Business domains and domain services |
| `@timeline-studio/adapters` | `packages/adapters` -> `src/adapters` | `@timeline-studio/adapters`, `@timeline-studio/adapters/*` | Tauri, Node, HTTP and mock implementations for core ports |
| `@timeline-studio/ui` | `packages/ui` -> `src/features`, `src/components/ui` | `@timeline-studio/ui`, `@timeline-studio/ui/features/*`, `@timeline-studio/ui/components/*` | Reusable feature UI and shared UI components |
| `apps/*` | `apps/desktop`, `apps/cli` -> `src/app`, `src/cli`, `src/config` | not published | App shells that wire UI, domains and adapters |

## Dependency Rules

```text
app-shell -> ui + domains + adapters
ui -> core
domains -> core
adapters -> core
```

Rules enforced by `config/package-boundaries.json`:

- `core` must not import `domains`, `adapters`, `ui` or `app-shell`.
- `domains` must not import `adapters`, `ui` or `app-shell`.
- `adapters` must not import `ui` or `app-shell`.
- `ui` must not import `adapters` directly.
- `ui -> domains` is currently reported as a warning because it is existing coupling that will be burned down through Phase F ports and bridge APIs.

## Boundary Check

Run the report locally:

```bash
bun run check:boundaries
```

The default mode is report-only and exits `0` while the Phase F baseline is being reduced. Use strict mode only after the remaining violations have dedicated migration PRs:

```bash
bun run check:boundaries:strict
```

CI uses the committed baseline gate until strict mode is realistic:

```bash
bun run check:boundaries:baseline
```

This gate fails if total violations, severity counts or edge counts increase above `config/package-boundaries-baseline.json`. Each Phase F PR should reduce or avoid increasing the report. A PR may introduce a temporary violation only when the issue body names the follow-up slice that removes it and updates the baseline intentionally.

## PR Slices

1. **F1 boundaries baseline:** workspace globs, bridge aliases, boundary manifest, report-only checker, roadmap update.
2. **F2 core bridge:** move UI-facing service access behind `src/core/ports` and `src/core/container`; stop `core -> domains` and start burning down `ui -> domains`.
3. **F3 adapter contracts:** keep adapter implementations behind core ports; remove direct `ui -> adapters` imports.
4. **F4 UI pilot package:** extract one feature vertical into the future `@timeline-studio/ui` shape without moving the whole app.
5. **F5 workspace split:** create package/app `package.json` files, update build/test scripts, lockfiles and CI cache.
6. **F6 boundary error burn-down:** remove hard `domains -> ui/app-shell` violations and keep the remaining `ui -> domains` coupling as warning-only follow-up work.
7. **F7 warning burn-down:** reduce `ui -> domains` warnings through small core ports and UI bridge slices.
8. **F8 options type bridge:** move `features/options` off type-only media-management imports through core-facing media types.
9. **F9 keyboard shortcuts modal bridge:** move `features/keyboard-shortcuts` off direct system-integration modal imports through the existing modals compatibility layer.
