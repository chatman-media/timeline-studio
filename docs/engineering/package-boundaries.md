# Package Boundaries

**Status:** Phase F workspace ownership for [#150](https://github.com/chatman-media/timeline-studio/issues/150)
**Updated:** 2026-06-11

This document defines the TypeScript package boundaries used during the modular architecture migration. After F9-F13, `core`, `domains`, `adapters`, reusable `ui`, and the CLI have real workspace-owned source trees. Desktop keeps a small set of root compatibility entrypoints while the root Next/Tauri build flow is still in place.

## Target Packages

| Package | Current owner path | Public alias | Responsibility |
|---------|--------------------|--------------|----------------|
| `@timeline-studio/core` | `packages/core/src` | `@timeline-studio/core`, `@timeline-studio/core/*` | Platform-neutral ports, DI container, shared runtime types |
| `@timeline-studio/domains` | `packages/domains/src` | `@timeline-studio/domains`, `@timeline-studio/domains/*` | Business domains and domain services |
| `@timeline-studio/adapters` | `packages/adapters/src` | `@timeline-studio/adapters`, `@timeline-studio/adapters/*` | Tauri, Node, HTTP and mock implementations for core ports |
| `@timeline-studio/ui` | `packages/ui/src` | `@timeline-studio/ui`, `@timeline-studio/ui/features/*`, `@timeline-studio/ui/components/*` | Reusable feature UI and shared UI components |
| `@timeline-studio/cli` | `apps/cli/src` | not published | Headless CLI commands and bot-worker entrypoints |
| `@timeline-studio/desktop` | `apps/desktop`, with owned root compatibility paths in `apps/desktop/entrypoints.json` | not published | Next/Tauri desktop composition |

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
- `ui -> domains` remains listed as a warning-class rule so regressions are visible if new coupling appears.

## Boundary Check

Run the report locally:

```bash
bun run check:boundaries
```

CI should enforce the strict gate once F14 is complete:

```bash
bun run check:boundaries:strict
```

The committed baseline is still useful as an audit trail and regression comparison:

```bash
bun run check:boundaries:baseline
```

Current expectation after F7/F13: both strict and baseline modes report zero violations.

## External Consumers

External/headless consumers should use the supported entrypoints documented in [External And Headless Integration Contracts](external-headless-contracts.md): `ProjectSchema`, the Rust `timeline` CLI, `render-job`, `bot-workflow`, `bot-worker`, and `bot-cleanup`.

External consumers should not import root aliases such as `@/core`, `@/domains`, `@/adapters`, `@/features`, package-private `packages/*/src/**` files, desktop React providers, or `src-tauri` internals. If a consumer needs a capability that is not exposed through a supported entrypoint, expose it through a core port, package export, or CLI contract first.

Root compatibility paths and their removal criteria are tracked in [Root Compatibility Shims](root-compatibility-shims.md).

## App Entrypoint Ownership

`apps/cli/src` owns the CLI entrypoint and commands directly.

`apps/desktop` owns the desktop app, but these root paths remain in place for compatibility with the current root Next/Tauri workflow:

- `src/app`
- `src/config`
- `next.config.ts`
- `src-tauri`

The authoritative owner manifest for those paths is `apps/desktop/entrypoints.json`. Any PR that changes one of those paths should treat `@timeline-studio/desktop` as the owner and update the manifest if the compatibility reason changes.

## PR Slices

1. **F1 boundaries baseline:** workspace globs, bridge aliases, boundary manifest, report-only checker, roadmap update.
2. **F2 core bridge:** move UI-facing service access behind core ports and start burning down `ui -> domains`.
3. **F3 adapter contracts:** keep adapter implementations behind core ports; remove direct `ui -> adapters` imports.
4. **F4 UI pilot package:** extract one feature vertical into the future `@timeline-studio/ui` shape.
5. **F5 workspace split:** create package/app `package.json` files, update build/test scripts, lockfiles and CI cache.
6. **F6 boundary error burn-down:** remove hard `domains -> ui/app-shell` violations.
7. **F7 warning burn-down:** reduce `ui -> domains` warnings to zero through small core ports and UI bridge slices.
8. **F8 zero baseline:** freeze the zero-violation boundary baseline before physical extraction.
9. **F9 core extraction:** move real core source into `packages/core/src`.
10. **F10 domains extraction:** move real domain source into `packages/domains/src`.
11. **F11 adapters extraction:** move real adapter source into `packages/adapters/src`.
12. **F12 UI extraction:** move package-safe UI primitives and reusable feature surfaces into `packages/ui/src`.
13. **F13 app entrypoints:** move CLI into `apps/cli/src` and record desktop root compatibility ownership.
14. **F14 CI/docs finalization:** make strict workspace/boundary checks the default expectation and keep docs aligned with physical ownership.
