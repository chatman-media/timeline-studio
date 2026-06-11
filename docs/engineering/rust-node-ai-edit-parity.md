# Rust/Node AI Edit Parity

**Status:** Phase H ownership decision for [#296](https://github.com/chatman-media/timeline-studio/issues/296)
**Related:** [Bot-First Production Contract](bot-first-production-contract.md), [External And Headless Integration Contracts](external-headless-contracts.md), [Timeline Studio CLI](../../apps/cli/COMMANDS.md)

This document defines the current production boundary for Telegram AI review editing and the parity path for a future Rust-backed `llm-edit` command. It does not require a broad rewrite before bot-first production rollout.

## Current Ownership

| Capability | Production owner now | Evidence | Decision |
| --- | --- | --- | --- |
| Telegram intake, review routing, sessions, retries, approval gate | Node `bot-worker` | `NodeTelegramBotWorker`, bot edit session store, `/approve`, `/versions`, retry/cancel handling | Keep in Node. It is orchestration, state and user messaging, not media execution. |
| Text, voice and video-note feedback normalization | Node adapters | `IBotFeedbackTranscriber`, Telegram file resolution and session routing | Keep in Node. It is provider glue and Telegram runtime handling. |
| Iterative AI project editing | Node `IAIProjectEditor` | `runAIProjectEdit`, `NodeAIProjectEditor`, validation/repair around `AIProjectEditorResult` | Node remains the supported production editor until Rust has an equivalent `llm-edit` contract and fixture parity. |
| Project mutation contract | Core `ProjectSchema` + `AIProjectEditorResult` | `ProjectSchema` validation and edit result validation in core services | Keep the contract language-neutral. Editors must return a full next `ProjectSchema`, not desktop state or partial UI mutations. |
| First-cut planning | Rust CLI through Node adapter | `NodeRustFirstCutPlanner` calls `timeline montage-plan` or `timeline llm-plan` | Rust owns production first-cut planning when configured. Node may fall back deterministically. |
| Preview/final rendering | Rust render through Node adapter where configured | `NodeRustRenderVideoService`, `render-job --rust-render`, `bot-worker --rust-render` | Rust owns production render where the Rust command is configured. |
| Final publish | Rust publish through Node adapter where supported | `NodeRustPublishService` calls `timeline publish ... --json` | Rust owns Telegram/YouTube-style publish. TypeScript must not become a second production publish backend for Rust-supported destinations. |

## Supported Short-Term Contract

The current production path is:

1. Node `bot-worker` stores the edit session and current `ProjectSchema`.
2. User text, voice or video-note feedback becomes one normalized instruction.
3. Node `IAIProjectEditor` receives `currentProject`, `userInstruction`, `sourceMedia`, optional revision history, target platform, constraints and metadata.
4. The editor returns `AIProjectEditorResult` with `nextProject`, summary, changed areas, edit commands, diagnostics and metadata.
5. Core validation rejects malformed requests/results before a revision is persisted.
6. Preview render and final publish use Rust-backed adapters when configured.

This means Node owns the AI edit provider glue today, but the persisted mutation contract is still `ProjectSchema`. External consumers should call the bot/headless entrypoints instead of importing the Node editor directly.

## Future Rust `llm-edit` Contract

Rust parity should be added as a new CLI/editor implementation, not as a replacement for bot-worker orchestration.

Candidate command shape:

```bash
timeline llm-edit \
  --current-project ./current.project.json \
  --instruction ./instruction.txt \
  --source-media ./source-media.json \
  --revision-history ./revisions.json \
  --target-platform youtube \
  --output ./next-edit-result.json \
  --json
```

Required input fields:

- `currentProject`: full `ProjectSchema`.
- `instruction`: normalized text feedback from the bot.
- `sourceMedia`: media paths, Telegram file metadata or URLs already accepted by policy.
- `revisionHistory`: compact prior revision summaries.
- `targetPlatform`, `constraints` and metadata where available.

Required output shape:

- `nextProject`: full next `ProjectSchema`.
- `summary`: user-facing edit summary.
- `changedAreas`: paths or conceptual areas changed.
- `commands`: machine-readable edit commands compatible with `AIProjectEditCommand`.
- `diagnostics`: info/warning/error diagnostics.
- `metadata`: redacted provider/model/prompt/attempt data.

Node should consume Rust `llm-edit` through a future `NodeRustAIProjectEditor` adapter that implements `IAIProjectEditor` and then runs the same `runAIProjectEdit` validation/repair gate. Bot-worker, sessions, `/status`, `/versions`, preview render and publish behavior should not need to change.

## Blockers Before Rust Can Own Iterative Edit

- Rust `timeline llm-plan` is first-cut oriented; it does not currently accept `currentProject + instruction + revisionHistory` and return `AIProjectEditorResult`.
- The edit command vocabulary must stay compatible with `AIProjectEditCommand` so Node status/revision diagnostics remain stable.
- Parity fixtures must prove that common review corrections return valid `ProjectSchema` and useful diagnostics.
- Provider secrets and raw prompts must stay redacted in both Rust command metadata and Node session state.

These blockers do not block current production bot usage because Node `IAIProjectEditor` is the supported short-term production editor.

## Follow-Up Work

Concrete parity tasks when Rust edit ownership becomes a priority:

1. Add `timeline llm-edit` with the input/output contract above and JSON fixture tests.
2. Add `NodeRustAIProjectEditor` behind an explicit `TIMELINE_BOT_AI_EDITOR_PROVIDER=rust-llm-edit` or equivalent CLI/env option.
3. Add parity fixtures for at least: shorten intro, remove clip, add caption/title, adapt to platform, and invalid provider output.
4. Keep publish destination behavior under the separate destination matrix task [#297](https://github.com/chatman-media/timeline-studio/issues/297).
5. Keep operator-facing session/revision diagnostics under the observability task [#298](https://github.com/chatman-media/timeline-studio/issues/298).

Do not start a broad Rust/Node rewrite under this parity track. The migration is complete only when the Rust editor passes fixture parity and can be selected without changing the bot-worker state machine.
