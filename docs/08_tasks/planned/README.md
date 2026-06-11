# Planned Tasks

Tasks planned for future development.

*Last updated: 2026-06-11*

## Current Recommendation

The bot/headless migration backlog is complete in GitHub Project `Timeline Studio AI`. The next roadmap should be a new Phase H epic:

**Phase H - Bot-first production rollout and external integration readiness**

Recommended scope:

- Real Telegram AI review sandbox smoke.
- `postim`/headless integration example through supported entrypoints only.
- Root compatibility shim retirement execution.
- Rust/Node AI edit parity plan for future `llm-edit`.
- Publish destination support matrix and validate-only coverage.
- Operator observability for bot-worker sessions, revisions, preview renders and publish attempts.
- Docs/SDK examples for `ProjectSchema`, `render-job`, `bot-workflow` and `bot-worker`.

Details live in [Roadmap](../../10_project_state/roadmap.md#далее-phase-h-proposal).

## Active Future Plans

### AI & Analysis

- [AI Analysis Integration Plan](ai-analysis-integration-plan.md)
- [Easy Mode AI Editor](easy-mode-ai-editor.md)
- [Montage Planner Integration](montage-planner-integration-concept.md)

### Video & Effects

- [Advanced Multicam Templates](advanced-multicam-templates.md)
- [Effects Library Extension](effects-library-extension.md)
- [Video Generation](video-generation.md)
- [Avatar Generation](avatar-generation.md)
- [Meme Machine](meme-machine.md)

### Cloud & Sync

- [Cloud Rendering](cloud-rendering.md)
- [Cloud Storage Sync](cloud-storage-sync.md)
- [Live Streaming](live-streaming.md)

### Mobile & Apps

- [Mobile Apps](mobile-apps.md)
- [Telegram Mini App](telegram-mini-app.md)

### Architecture

- [AI Features Architecture Refactoring](ai-features-architecture-refactoring.md)
- [Browser Architecture Refactoring](browser-architecture-refactoring.md)
- [Export Architecture Refactoring](export-architecture-refactoring.md)
- [Effects Architecture Refactoring](effects-architecture-refactoring.md)
- [Montage Planner Refactoring](montage-planner-refactoring.md)

### Platform & Infrastructure

- [Plugin System](plugin-system.md)
- [EventBus API Extensions](eventbus-api-extensions.md)
- [Performance Optimization](performance-optimization.md)
- [Performance Rerender Optimization](performance-rerender-optimization.md)
- [Stock Footage Integrations](stock-footage-integrations.md)
- [Comprehensive Resources Database](comprehensive-resources-database.md)

### User System

- [User Identity System](user-identity-system.md)
- [User Analytics System](user-analytics-system.md)
- [User Preferences Persistence](user-preferences-persistence.md)
- [User Preferences AI Automation](user-preferences-ai-automation.md)
- [Social Auth Integration](social-auth-integration.md)

## Completed Specs Kept For History

These documents remain in `planned/` because other docs link to their original paths, but their GitHub epics/issues are closed:

- [Bot-first workflow](bot-first-workflow.md) - [#171](https://github.com/chatman-media/timeline-studio/issues/171)
- [Telegram AI Review Editing Workflow](telegram-ai-review-workflow.md) - [#226](https://github.com/chatman-media/timeline-studio/issues/226)
- [AI Module Stabilization and Node/Rust Orchestration](ai-module-node-rust-orchestration.md) - [#238](https://github.com/chatman-media/timeline-studio/issues/238)
- [Monorepo Packages Migration](monorepo-packages-migration.md) - [#150](https://github.com/chatman-media/timeline-studio/issues/150)

New work should create new planned docs or GitHub issues instead of extending those completed specs.
