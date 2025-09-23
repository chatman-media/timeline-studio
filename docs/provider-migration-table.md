# Provider Migration Table

This table enumerates React Providers found in the codebase and classifies them against the new backend-centric migration policy (canonical: `user-settings-provider` / `project-settings-provider`).

Columns:
- path — repository path to provider file
- provider — exported provider symbol
- indicators — quick static indicators (uses `getBackendSync`/`useApp`/orchestrator/getActor/useActor/local state)
- status — brief compatibility assessment
- recommended action — migration or verification step
- priority — migration priority (High / Medium / Low)


| path | provider | indicators | status | recommended action | priority |
|------|----------|------------|--------|--------------------|----------|
| src/features/app-state/services/app-provider.tsx | AppProvider / useApp | uses `appMachine`, `useMachine`; exposes `useApp()` and executeCommand | Backend-integrated (central) | Keep as the single source-of-truth; ensure other providers consume `useApp()` | High |
| src/features/project-settings/services/project-settings-provider.tsx | ProjectSettingsProvider | `getBackendSync()`, `backendSync.executeCommand`, `onStateChange` | Backend-integrated (reference) | Use as canonical example for provider shape & tests | High |
| src/features/app-state/testing/mock-backend-provider.tsx | MockBackendProvider | test harness w/ `executeCommand` mock & createTestScenarios | Testing harness | Use for all provider integration tests | High |
| src/features/user-settings/services/user-settings-provider.tsx | UserSettingsProvider / useUserSettings | uses `getProjectManagementOrchestrator()` (orchestrator) | Orchestrator-backed (verified) | ProjectManagementOrchestrator creates `appActor` and sends `EXECUTE_COMMAND` to it — provider is compliant. Add MockBackendProvider tests and keep as canonical example. | High |
| src/domains/project-management/providers/project-management-provider.tsx | ProjectManagementProvider | returns `getProjectManagementOrchestrator()` | Orchestrator wrapper (verified) | Uses ProjectManagementOrchestrator which creates `appActor` and routes commands via `EXECUTE_COMMAND` — provider is compliant. Add integration tests. | High |
| src/features/video-player/services/player-provider.tsx | PlayerProvider / usePlayer | uses `getBackendSync()`, calls `executeCommand`, subscribes to backend state | Backend-integrated | Add/complete tests via MockBackendProvider; ensure local state isn't authoritative | High |
| src/features/timeline/components/drag-drop-provider.tsx | DragDropProvider | DnD-kit sensors, local state | Local UI provider | Keep local, ensure it never becomes authoritative for project state | Low |
| src/features/ai-chat/services/chat-provider.tsx | ChatProvider / useChat | uses `getBackendSync()` + local UI state and AI service | Backend-integrated for persistence; local UI state present | Move persistent chat state to backend commands where possible; add MockBackendProvider tests | Medium-High |
| src/features/resources/services/resources-provider.tsx | ResourcesProvider / useResources | uses `getBackendSync()`, reads `projectState` | Backend-integrated (reads media_pool) | Finish backend command implementations, add tests | Medium |
| src/domains/media-management/providers/media-management-provider.tsx | MediaManagementProvider | uses `useActor(fileOperationsMachine, mediaImportMachine)` local XState machines | Local/XState-driven | Refactor to orchestrator or forward commands to `executeCommand`; add MockBackendProvider tests | Medium |
| src/domains/ai-services/providers/ai-services-domain-provider.tsx | AIServicesDomainProvider / useAIServicesDomain | uses `useActor` on domain machines (chat, ai-intel, montage-planner) | Local XState / domain machines | Prefer a domain orchestrator that wires to backend or adapt machines to subscribe to backend; add tests | Medium |
| src/domains/system-integration/providers/system-integration-provider.tsx | SystemIntegrationProvider | `getSystemIntegrationOrchestrator()` | Orchestrator (no backend) | SystemIntegrationOrchestrator manages local modal/update actors and does not call backendSync/appActor — acceptable for UI/system tasks. Add integration tests and ensure it doesn't hold authoritative project data. | Medium |
| src/features/modals/services/modal-provider.tsx | ModalProvider / useModal | `useMachine(modalMachine)` local UI machine | Local UI provider | OK to remain local; ensure no authoritative data kept here; add tests | Low |
| src/features/color-grading/services/color-grading-provider.tsx | ColorGradingProvider / useColorGrading | uses local hook `useColorGrading()` (local state) | Local | Keep local for preview UX; persist final grades via backend commands; tests | Low-Medium |
| src/features/keyboard-shortcuts/services/shortcuts-provider.tsx | ShortcutsProvider / useShortcuts | local state, integrates with tauri global shortcuts & shortcutsRegistry | Local | Keep local; persist settings via store/backend; add tests using MockBackendProvider when persistence needed | Low |
| src/domains/video-editing/providers/video-editing-provider.tsx | VideoEditingProvider | `getVideoEditingOrchestrator()` | Orchestrator-backed (verified) | VideoEditingOrchestrator subscribes to `backendSync.onStateChange` and uses `backendSync.executeCommand()` for project commands — provider is compliant. Add integration tests. | High |
| src/features/montage-planner/services/montage-planner-provider.tsx | MontagePlannerProvider | local domain provider/orchestrator | Local/Orchestrator | Align with domain orchestrator pattern; add tests | Medium |
| src/features/media-studio/services/providers.tsx | ProvidersV2 | Aggregates many providers for the app shell | Mixed (depends on children) | Ensure root composes AppProvider and only migrated providers; add composition tests | Medium |
| src/features/media-studio/services/tauri-mock-provider.tsx | TauriMockProvider | environment mock for browser dev | Dev/Test harness | Use for dev and E2E where appropriate | Low-Medium |
| src/i18n/services/i18n-provider.tsx | I18nProvider | `react-i18next` provider — local | Local | Keep local; low migration need | Low |
| src/domains/video-editing/providers/undo-redo-provider.tsx | UndoRedoProvider (re-export) | re-exports provider from video-editing domain | Depends (likely orchestrator-based) | Verify underlying provider uses orchestrator/backend; add tests | Medium |


Notes & legend
- "Backend-integrated" means provider already consumes backend-sync/AppProvider or uses backendSync directly (good).
- "Orchestrator-backed" means provider gets an orchestrator instance; such providers are acceptable if the orchestrator itself is wired to the app actor/backend (verify).
- "Local" means provider holds UI/local state or local XState machines and doesn't persist to backend — these require migration only if they currently hold authoritative project data.

Next steps
1. Review rows marked "Orchestrator-backed" and verify their orchestrators call/route commands to `appActor` or `backendSync` (e.g. ProjectManagementOrchestrator, VideoEditingOrchestrator). Mark as compliant when verified.
2. For Local providers that hold authoritative data, create small migration PRs that either:
   - Switch them to use `useApp()` and `executeCommand()` and subscribe to `projectState`, or
   - Replace internal machines with an orchestrator that routes to backend.
3. Add/extend tests for each migrated provider using `MockBackendProvider` and `renderWithAppState`.

If you want, I can now:
- verify orchestrator wiring for the orchestrator-backed items (read those orchestrator files and mark compliance), or
- start migrating one high-priority provider (pick `PlayerProvider` or `VideoEditingProvider`), or
- produce per-provider PR checklists and minimal test templates.

