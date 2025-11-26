/**
 * Workspace Persistence Service
 *
 * @deprecated Use imports from @/domains/system-integration instead
 * This file is kept for backward compatibility and re-exports from the new location
 */

export type { WorkspaceState } from "@/domains/system-integration"
export {
  clearWorkspaceStateLocal,
  debouncedSave,
  isValidWorkspaceState,
  loadWorkspaceState,
  loadWorkspaceStateBackend,
  loadWorkspaceStateLocal,
  saveWorkspaceStateBackend,
  saveWorkspaceStateLocal,
} from "@/domains/system-integration"
