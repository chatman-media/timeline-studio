/**
 * Version control feature exports
 */

export {
  BranchManager,
  VersionControlManager,
  VersionControlSettings,
} from "./components/version-control-manager"
export { VersionHistoryPanel } from "./components/version-history-panel"
export * from "./hooks"
export type { VersionControlActions, VersionControlHookState } from "./hooks/use-version-control"
export type { VersionControlState, VersionInfo } from "./types"
