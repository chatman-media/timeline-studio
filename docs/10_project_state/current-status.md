# Текущий статус Timeline Studio

*Последнее обновление: 11 июня 2026*

## Сводка

Timeline Studio завершил ключевой цикл архитектурного разбиения:

- Rust backend вынесен в layered workspace `crates/*`.
- TypeScript runtime вынесен в workspaces `packages/*` и `apps/*`.
- Bot-first/headless workflow доведен до production-oriented контракта.
- External/headless integration boundaries закреплены для внешних потребителей.

Последний закрытый этап: [Phase G - External/headless integration contract hardening](https://github.com/chatman-media/timeline-studio/issues/282). PR [#290](https://github.com/chatman-media/timeline-studio/pull/290) смержен в `main`, связанные задачи [#282](https://github.com/chatman-media/timeline-studio/issues/282)-[#289](https://github.com/chatman-media/timeline-studio/issues/289) закрыты и переведены в `Done`.

На момент обновления GitHub Project `Timeline Studio AI` не содержит открытого backlog по текущему bot/headless треку. Поэтому следующий roadmap нужен отдельно: больше не стоит продолжать как "еще один рефакторинг перед всем"; следующий трек должен быть production rollout и external integration readiness.

## Завершенные эпики

- [#91](https://github.com/chatman-media/timeline-studio/issues/91) - Rust modularization into layered `ts-*` crates.
- [#119](https://github.com/chatman-media/timeline-studio/issues/119) - agent-driven headless produce-to-publish pipeline.
- [#120](https://github.com/chatman-media/timeline-studio/issues/120) - agent contracts and `@timeline/shared-types`.
- [#171](https://github.com/chatman-media/timeline-studio/issues/171) - bot-first workflow foundation.
- [#225](https://github.com/chatman-media/timeline-studio/issues/225) - bot-first production readiness leftovers.
- [#226](https://github.com/chatman-media/timeline-studio/issues/226) - Telegram AI review editing workflow.
- [#238](https://github.com/chatman-media/timeline-studio/issues/238) - AI module stabilization and Node/Rust orchestration.
- [#150](https://github.com/chatman-media/timeline-studio/issues/150) - Phase F JS packages/workspaces.
- [#282](https://github.com/chatman-media/timeline-studio/issues/282) - Phase G external/headless integration contract hardening.

## Архитектура

### Rust backend

Rust workspace находится в `crates/`:

- `ts-schema` - `ProjectSchema` and schema emission.
- `ts-core-types` - errors, EventBus, progress and shared DTOs.
- `ts-render` - headless render pipeline.
- `ts-media`, `ts-recognition`, `ts-analysis`, `ts-montage`, `ts-subtitles` - domain engines.
- `ts-state` - headless project state and event sink.
- `ts-agent` - agent orchestration and video tools.
- `ts-platform`, `ts-publish`, `ts-cli` - platform optimization, publishing and the Rust `timeline` CLI.

`src-tauri` remains a desktop host/glue layer. External/headless consumers should not import `src-tauri` internals.

### TypeScript workspaces

Current workspace layout:

- `packages/core` - `@timeline-studio/core`, platform-neutral ports, services, hooks and shared runtime contracts.
- `packages/domains` - `@timeline-studio/domains`, domain modules and domain-owned machines/services.
- `packages/adapters` - `@timeline-studio/adapters`, Node/Tauri/HTTP/mock/React adapter families.
- `packages/ui` - `@timeline-studio/ui`, shared UI primitives and package-safe UI surfaces.
- `packages/shared-types` - `@timeline/shared-types`, TypeScript mirror for Rust contract types.
- `apps/cli` - `@timeline-studio/cli`, supported Node headless entrypoints.
- `apps/desktop` - `@timeline-studio/desktop`, desktop app ownership metadata and compatibility entrypoints.

Package boundary rules are documented in [Package Boundaries](../engineering/package-boundaries.md) and enforced by `config/package-boundaries.json`.

## Supported Headless Contract

Supported external/headless entrypoints are intentionally narrow:

- `ProjectSchema` from `@timeline/shared-types`.
- Rust `timeline` CLI from `crates/ts-cli`.
- Node CLI `render-job`.
- Node CLI `bot-workflow`.
- Node CLI `bot-worker`.
- Node CLI `bot-cleanup`.

The contract is documented in [External And Headless Integration Contracts](../engineering/external-headless-contracts.md). Production Telegram review state/retry/cleanup/publish behavior is documented in [Bot-First Production Contract](../engineering/bot-first-production-contract.md). External consumer examples and validation commands are documented in [Bot/Headless SDK Quickstart](../09_examples/bot-headless-sdk-quickstart.md).

Important boundary: external consumers such as `postim` should use the bot-first/headless layer and Rust CLI publish/render paths. They should not import root aliases, `src-tauri`, `packages/*/src`, or desktop internals.

## Current Gates

The main branch is green after PR [#290](https://github.com/chatman-media/timeline-studio/pull/290). Post-merge workflows for commit `5f28fea3` completed successfully:

- Bot AI Headless.
- Build.
- Bundle Analysis.
- CI - Tests and Checks.
- Lint Node.js.
- Lint CSS.
- Generate and Deploy API Docs.
- Release.

`Lint Rust` is skipped in that workflow configuration.

Local/PR validation for Phase G included:

```bash
bun run lint:ci
bun run check:type
bun run check:boundaries:strict
bun run check:boundaries:external
bun run test:bot-ai
bun run test
```

## Current Risks

No active project blocker is tracked in the GitHub project after Phase G. Remaining risks are product/production risks:

- Real Telegram sandbox validation still needs operator-owned credentials and media fixtures.
- Root compatibility shims are documented but not yet retired.
- Rust `llm-plan` is still first-cut oriented; edit-capable Rust `llm-edit` remains a future parity track.
- External consumer integration, especially `postim`, needs a concrete example contract and migration path.
- External consumers should start from [Bot/Headless SDK Quickstart](../09_examples/bot-headless-sdk-quickstart.md) and [examples/headless-postim](../../examples/headless-postim/README.md) instead of reading internal source.
- Streaming should stay separate from Phase G and depend on stable headless boundaries.

## Recommended Next Roadmap

Create a new Phase H epic focused on production rollout and external integration readiness, not another broad extraction phase.

Recommended Phase H scope:

1. Real Telegram AI review sandbox smoke with operator checklist, redacted logs and rollback notes.
2. `postim`/headless integration example using only supported entrypoints.
3. Root compatibility shim retirement plan with package/export replacements.
4. Rust/Node AI edit parity plan for `llm-edit` without blocking production bot usage.
5. Publish destination support matrix and validate-only coverage for every supported destination.
6. Operator observability for bot-worker sessions, revisions, preview renders and publish attempts.
7. Docs/SDK examples for `ProjectSchema`, `render-job`, `bot-workflow` and `bot-worker`.

Keep streaming as a separate future `ts-stream`/postim track that depends on Phase H contracts instead of being folded into Phase H.

## Источники правды

- [Roadmap](roadmap.md)
- [External And Headless Integration Contracts](../engineering/external-headless-contracts.md)
- [Bot/Headless SDK Quickstart](../09_examples/bot-headless-sdk-quickstart.md)
- [Bot-First Production Contract](../engineering/bot-first-production-contract.md)
- [Root Compatibility Shims](../engineering/root-compatibility-shims.md)
- [Package Boundaries](../engineering/package-boundaries.md)
- [Timeline Studio CLI](../../apps/cli/COMMANDS.md)
