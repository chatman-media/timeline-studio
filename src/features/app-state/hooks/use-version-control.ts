/**
 * Version control hook for Timeline Studio
 * Provides convenient access to version control functionality
 */

import { useCallback, useEffect, useMemo, useState } from "react"

import type { VersionInfo } from "@/features/version-control/types"
import { useToast } from "@/hooks/use-toast"
import { createLogger } from "@/lib/tauri-logger"
import type { CommandResult, ProjectEvent } from "@/types/generated/tauri-bindings"
import { getBackendSync } from "../services/backend-sync"

const logger = createLogger({ module: "UseVersionControl" })

// This is a different interface for hook state, not the same as backend VersionControlState
export interface VersionControlHookState {
  currentVersionId: string
  branchName: string
  hasUncommittedChanges: boolean
  lastSnapshotTime: Date | null
  autoSaveEnabled: boolean
  autoSaveIntervalSeconds: number
  isLoading: boolean
  error: string | null
}

export interface VersionControlActions {
  createSnapshot: (message?: string) => Promise<boolean>
  restoreVersion: (versionId: string) => Promise<boolean>
  getVersionHistory: (limit?: number) => Promise<VersionInfo[] | null>
  compareVersions: (versionA: string, versionB: string) => Promise<any>
  createBranch: (branchName: string, fromVersion?: string) => Promise<boolean>
  mergeBranch: (sourceBranch: string, targetBranch: string) => Promise<boolean>
  switchBranch: (branchName: string) => Promise<boolean>
  setAutoSaveInterval: (seconds: number) => Promise<boolean>
  enableAutoSave: (enabled: boolean) => Promise<boolean>
}

export function useVersionControl(): VersionControlHookState & VersionControlActions {
  const [state, setState] = useState<VersionControlHookState>({
    currentVersionId: "initial",
    branchName: "main",
    hasUncommittedChanges: false,
    lastSnapshotTime: null,
    autoSaveEnabled: true,
    autoSaveIntervalSeconds: 30,
    isLoading: false,
    error: null,
  })

  const { toast } = useToast()
  const [backendSync] = useState(() => getBackendSync())

  // Update state from project state
  const updateFromProjectState = useCallback(async () => {
    try {
      const projectState = await backendSync.getProjectState()
      if (projectState?.version_info) {
        const versionInfo = projectState.version_info
        setState((prev) => ({
          ...prev,
          currentVersionId: versionInfo.current_version_id,
          branchName: versionInfo.branch_name,
          hasUncommittedChanges: versionInfo.has_uncommitted_changes,
          lastSnapshotTime: new Date(versionInfo.last_snapshot_time),
          autoSaveEnabled: versionInfo.auto_save_enabled,
          autoSaveIntervalSeconds: versionInfo.auto_save_interval_seconds,
          error: null,
        }))
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }))
    }
  }, [backendSync])

  // Handle version control events
  const handleVersionEvent = useCallback(
    (event: ProjectEvent) => {
      switch (event.type) {
        case "SnapshotCreated":
          if (event.type === "SnapshotCreated") {
            setState((prev) => ({
              ...prev,
              currentVersionId: event.payload.version_id,
              hasUncommittedChanges: false,
              lastSnapshotTime: new Date(),
            }))
            toast({
              title: "Snapshot Created",
              description: `Version ${event.payload.version_id} saved successfully`,
            })
          }
          break

        case "VersionRestored":
          if (event.type === "VersionRestored") {
            setState((prev) => ({
              ...prev,
              currentVersionId: event.payload.version_id,
            }))
            toast({
              title: "Version Restored",
              description: `Restored to version ${event.payload.version_id}`,
            })
          }
          break

        case "BranchSwitched":
          if (event.type === "BranchSwitched") {
            setState((prev) => ({
              ...prev,
              branchName: event.payload.to_branch,
            }))
            toast({
              title: "Branch Switched",
              description: `Switched to branch "${event.payload.to_branch}"`,
            })
          }
          break

        case "AutoSaveConfigChanged":
          if (event.type === "AutoSaveConfigChanged") {
            setState((prev) => ({
              ...prev,
              autoSaveEnabled: event.payload.enabled,
              autoSaveIntervalSeconds: event.payload.interval_seconds,
            }))
          }
          break

        case "AutoSaveTriggered":
          if (event.type === "AutoSaveTriggered") {
            setState((prev) => ({
              ...prev,
              currentVersionId: event.payload.snapshot_id,
              lastSnapshotTime: new Date(),
            }))
          }
          break

        default:
          logger.warn(`[useVersionControl] Unhandled event type: ${event.type}`)
          break
      }
    },
    [toast],
  )

  // Subscribe to events on mount
  useEffect(() => {
    void updateFromProjectState()
    const unsubscribe = backendSync.onEvent(handleVersionEvent)
    return unsubscribe
  }, [backendSync, handleVersionEvent, updateFromProjectState])

  // Helper function to handle command results
  const handleCommandResult = useCallback(
    (result: CommandResult, successMessage: string): boolean => {
      if (result.success) {
        toast({
          title: "Success",
          description: successMessage,
        })
        return true
      }
      const errorMessage = result.error || "Unknown error occurred"
      setState((prev) => ({ ...prev, error: errorMessage }))
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    },
    [toast],
  )

  // Version control actions
  const createSnapshot = useCallback(
    async (message?: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const result = await backendSync.createSnapshot(message)
        return handleCommandResult(result, "Snapshot created successfully")
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [backendSync, handleCommandResult],
  )

  const restoreVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const result = await backendSync.restoreVersion(versionId)
        return handleCommandResult(result, `Version ${versionId} restored successfully`)
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [backendSync, handleCommandResult],
  )

  const getVersionHistory = useCallback(
    async (limit?: number): Promise<VersionInfo[] | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const result = await backendSync.getVersionHistory(limit)
        if (result.success && result.data) {
          // Check if data has versions property and it's an array
          if (result.data && typeof result.data === "object" && "versions" in result.data) {
            return (result.data as any).versions as VersionInfo[]
          }
          // If data is directly the array of versions
          if (Array.isArray(result.data)) {
            return result.data as unknown as VersionInfo[]
          }
          return null
        }
        setState((prev) => ({ ...prev, error: result.error || "Failed to get version history" }))
        return null
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [backendSync],
  )

  const compareVersions = useCallback(
    async (versionA: string, versionB: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const result = await backendSync.compareVersions(versionA, versionB)
        if (result.success) {
          return result.data
        }
        setState((prev) => ({ ...prev, error: result.error || "Failed to compare versions" }))
        return null
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [backendSync],
  )

  const createBranch = useCallback(
    async (branchName: string, fromVersion?: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const result = await backendSync.createBranch(branchName, fromVersion)
        return handleCommandResult(result, `Branch "${branchName}" created successfully`)
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [backendSync, handleCommandResult],
  )

  const mergeBranch = useCallback(
    async (sourceBranch: string, targetBranch: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const result = await backendSync.mergeBranch(sourceBranch, targetBranch)
        return handleCommandResult(result, `Branch "${sourceBranch}" merged into "${targetBranch}" successfully`)
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [backendSync, handleCommandResult],
  )

  const switchBranch = useCallback(
    async (branchName: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const result = await backendSync.switchBranch(branchName)
        return handleCommandResult(result, `Switched to branch "${branchName}" successfully`)
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [backendSync, handleCommandResult],
  )

  const setAutoSaveInterval = useCallback(
    async (seconds: number): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const result = await backendSync.setAutoSaveInterval(seconds)
        return handleCommandResult(result, `Auto-save interval set to ${seconds} seconds`)
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [backendSync, handleCommandResult],
  )

  const enableAutoSave = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const result = await backendSync.enableAutoSave(enabled)
        return handleCommandResult(result, `Auto-save ${enabled ? "enabled" : "disabled"}`)
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [backendSync, handleCommandResult],
  )

  return useMemo(
    () => ({
      // State
      ...state,

      // Actions
      createSnapshot,
      restoreVersion,
      getVersionHistory,
      compareVersions,
      createBranch,
      mergeBranch,
      switchBranch,
      setAutoSaveInterval,
      enableAutoSave,
    }),
    [
      state,
      createSnapshot,
      restoreVersion,
      getVersionHistory,
      compareVersions,
      createBranch,
      mergeBranch,
      switchBranch,
      setAutoSaveInterval,
      enableAutoSave,
    ],
  )
}
