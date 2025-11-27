/**
 * Batch command execution utilities for project management
 *
 * Provides utilities for efficient batch execution of multiple commands
 * with better performance and atomic operations.
 */

import React from "react"

import type { ProjectCommand } from "@/types/generated/tauri-bindings"
import { executeBatchCommands as executeBatchCommandsTauri } from "../tauri/project-commands"

// Local type definitions until Specta export is updated
export interface BatchCommandRequest {
  commands: ProjectCommand[]
  stop_on_error: boolean
  transaction_name?: string
}

export interface CommandResult {
  success: boolean
  message: string
  data?: any
}

export interface BatchCommandResult {
  results: CommandResult[]
  success_count: number
  error_count: number
  execution_time_ms: number
  success: boolean
  error_message?: string
}

/**
 * Builder for batch command requests
 */
export class BatchCommandBuilder {
  private commands: ProjectCommand[] = []
  private stopOnError = true
  private transactionName?: string

  /**
   * Add a command to the batch
   */
  add(command: ProjectCommand): this {
    this.commands.push(command)
    return this
  }

  /**
   * Add multiple commands to the batch
   */
  addAll(commands: ProjectCommand[]): this {
    this.commands.push(...commands)
    return this
  }

  /**
   * Set whether to stop on first error (default: true)
   */
  setContinueOnError(continueOnError = true): this {
    this.stopOnError = !continueOnError
    return this
  }

  /**
   * Set transaction name for debugging
   */
  setName(name: string): this {
    this.transactionName = name
    return this
  }

  /**
   * Execute the batch
   */
  async execute(): Promise<BatchCommandResult> {
    if (this.commands.length === 0) {
      throw new Error("Cannot execute empty batch")
    }

    const request: BatchCommandRequest = {
      commands: this.commands,
      stop_on_error: this.stopOnError,
      transaction_name: this.transactionName,
    }

    const result = await executeBatchCommandsTauri(request)

    if (typeof result !== "object" || result === null) {
      throw new Error("Invalid batch command result")
    }

    return result as BatchCommandResult
  }

  /**
   * Get the number of commands in the batch
   */
  get length(): number {
    return this.commands.length
  }

  /**
   * Clear all commands
   */
  clear(): this {
    this.commands = []
    return this
  }
}

/**
 * Create a new batch command builder
 */
export function createBatch(name?: string): BatchCommandBuilder {
  const builder = new BatchCommandBuilder()
  if (name) {
    builder.setName(name)
  }
  return builder
}

/**
 * Execute multiple commands in a batch
 */
export async function executeBatch(
  commands: ProjectCommand[],
  options: {
    stopOnError?: boolean
    transactionName?: string
  } = {},
): Promise<BatchCommandResult> {
  return createBatch(options.transactionName).addAll(commands).setContinueOnError(!options.stopOnError).execute()
}

/**
 * Common batch operations for Timeline Studio
 */
export const batchOperations = {
  /**
   * Create a new project with media files
   */
  createProjectWithMedia: async (projectName: string, mediaPaths: string[]): Promise<BatchCommandResult> => {
    return createBatch("Create Project with Media")
      .add({
        type: "CreateProject",
        params: {
          name: projectName,
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      })
      .addAll(
        mediaPaths.map(
          (path): ProjectCommand => ({
            type: "AddMedia",
            params: { path, media_type: "Video" },
          }),
        ),
      )
      .execute()
  },

  /**
   * Add multiple clips to timeline at once
   */
  addMultipleClips: async (
    clips: Array<{
      trackId: string
      mediaId: string
      time: number
    }>,
  ): Promise<BatchCommandResult> => {
    return createBatch("Add Multiple Clips")
      .addAll(
        clips.map((clip) => ({
          type: "AddClip" as const,
          params: {
            track_id: clip.trackId,
            media_id: clip.mediaId,
            time: clip.time,
          },
        })),
      )
      .execute()
  },

  /**
   * Delete multiple clips at once
   */
  deleteMultipleClips: async (clipIds: string[]): Promise<BatchCommandResult> => {
    return createBatch("Delete Multiple Clips")
      .addAll(
        clipIds.map((clipId) => ({
          type: "DeleteClip" as const,
          params: { clip_id: clipId },
        })),
      )
      .execute()
  },

  /**
   * Apply effect to multiple clips
   */
  applyEffectToClips: async (clipIds: string[], _effectId: string, _effectParams: any): Promise<BatchCommandResult> => {
    return createBatch("Apply Effect to Multiple Clips")
      .addAll(
        clipIds.map((clipId) => ({
          type: "UpdateClip" as const,
          params: {
            clip_id: clipId,
            updates: {
              name: null,
              playback_rate: null,
              volume: null,
              enabled: null,
            },
          },
        })),
      )
      .execute()
  },

  /**
   * Create multiple tracks
   */
  createMultipleTracks: async (
    tracks: Array<{
      name: string
      trackType: "Video" | "Audio"
      index?: number
    }>,
  ): Promise<BatchCommandResult> => {
    return createBatch("Create Multiple Tracks")
      .addAll(
        tracks.map((track) => ({
          type: "AddTrack" as const,
          params: {
            name: track.name,
            track_type: track.trackType,
            index: track.index || null,
          },
        })),
      )
      .execute()
  },

  /**
   * Bulk timeline operations (add tracks, add media, add clips)
   */
  setupTimelineWithContent: async (config: {
    tracks: Array<{ name: string; type: "Video" | "Audio" }>
    media: Array<{ path: string; type: "Video" | "Audio" | "Image" }>
    clips: Array<{ trackIndex: number; mediaIndex: number; time: number }>
  }): Promise<BatchCommandResult> => {
    const batch = createBatch("Setup Timeline with Content")

    type MediaType = "Video" | "Audio" | "Image"

    // Add tracks first
    config.tracks.forEach((track, index) => {
      batch.add({
        type: "AddTrack",
        params: {
          name: track.name,
          track_type: track.type,
          index,
        },
      })
    })

    // Add media files
    config.media.forEach((media) => {
      batch.add({
        type: "AddMedia",
        params: {
          path: media.path,
          media_type: media.type as MediaType,
        },
      })
    })

    // Note: Clips would need track_id and media_id from the results
    // This is a limitation of batch operations - they can't reference results from previous commands
    // For now, clips should be added in a separate batch after getting IDs

    return batch.execute()
  },
}

/**
 * Utilities for handling batch results
 */
export const batchUtils = {
  /**
   * Check if batch was fully successful
   */
  isFullySuccessful: (result: BatchCommandResult): boolean => {
    return result.success && result.error_count === 0
  },

  /**
   * Get all error messages from batch result
   */
  getErrorMessages: (result: BatchCommandResult): string[] => {
    const errors: string[] = []

    if (result.error_message) {
      errors.push(result.error_message)
    }

    result.results.forEach((commandResult, index) => {
      if (!commandResult.success) {
        errors.push(`Command ${index + 1}: ${commandResult.message}`)
      }
    })

    return errors
  },

  /**
   * Get success rate as percentage
   */
  getSuccessRate: (result: BatchCommandResult): number => {
    const total = result.success_count + result.error_count
    return total === 0 ? 0 : (result.success_count / total) * 100
  },

  /**
   * Format batch result for logging
   */
  formatResult: (result: BatchCommandResult): string => {
    const rate = batchUtils.getSuccessRate(result)
    return `Batch execution: ${result.success_count}/${result.success_count + result.error_count} success (${rate.toFixed(1)}%), ${result.execution_time_ms}ms`
  },

  /**
   * Throw error if batch failed
   */
  throwIfFailed: (result: BatchCommandResult): void => {
    if (!result.success) {
      const errors = batchUtils.getErrorMessages(result)
      throw new Error(`Batch execution failed: ${errors.join("; ")}`)
    }
  },
}

/**
 * Hook for using batch operations in React components
 */
export function useBatchCommands() {
  const [isExecuting, setIsExecuting] = React.useState(false)
  const [lastResult, setLastResult] = React.useState<BatchCommandResult | null>(null)

  const executeBatchWithState = async (
    commands: ProjectCommand[],
    options?: { stopOnError?: boolean; transactionName?: string },
  ): Promise<BatchCommandResult> => {
    setIsExecuting(true)
    try {
      const result = await executeBatch(commands, options)
      setLastResult(result)
      return result
    } finally {
      setIsExecuting(false)
    }
  }

  const executeBuilderWithState = async (builder: BatchCommandBuilder): Promise<BatchCommandResult> => {
    setIsExecuting(true)
    try {
      const result = await builder.execute()
      setLastResult(result)
      return result
    } finally {
      setIsExecuting(false)
    }
  }

  return {
    isExecuting,
    lastResult,
    executeBatch: executeBatchWithState,
    executeBuilder: executeBuilderWithState,
    createBatch,
    operations: batchOperations,
    utils: batchUtils,
  }
}
