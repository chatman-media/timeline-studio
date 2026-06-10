/**
 * User Effects Service
 * Управление пользовательскими эффектами через backend команды.
 */

import { invoke } from "@tauri-apps/api/core"
import type { BaseEffect } from "@timeline-studio/core/types"
import type { ProjectSchema } from "@timeline-studio/core/types/video-editing"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("CoreUserEffectsService")

export interface UserEffect extends BaseEffect {
  createdAt: string
  updatedAt: string
  author?: string
  isCustom: true
}

export interface UserEffectsCollection {
  version: string
  name: string
  description?: string
  effects: UserEffect[]
  createdAt: string
  updatedAt: string
}

export async function saveUserEffect(effect: BaseEffect, fileName: string): Promise<string> {
  try {
    const userEffect: UserEffect = {
      ...effect,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
    }

    const filePath = await invoke<string>("save_user_effect", {
      fileName,
      effect: JSON.stringify(userEffect),
    })

    void logger.info("User effect saved", { fileName, filePath })
    return filePath
  } catch (error) {
    void logger.error("Error saving user effect", { error })
    throw error
  }
}

export async function loadUserEffect(filePath: string): Promise<UserEffect> {
  try {
    const effectData = await invoke<string>("load_user_effect", { filePath })
    const effect = JSON.parse(effectData) as UserEffect

    void logger.info("User effect loaded", { filePath })
    return effect
  } catch (error) {
    void logger.error("Error loading user effect", { error })
    throw error
  }
}

export async function loadEffectsCollection(filePath: string): Promise<UserEffectsCollection> {
  try {
    const collectionData = await invoke<string>("load_effects_collection", { filePath })
    const collection = JSON.parse(collectionData) as UserEffectsCollection

    void logger.info("Effects collection loaded", { filePath })
    return collection
  } catch (error) {
    void logger.error("Error loading effects collection", { error })
    throw error
  }
}

export async function addEffectToClip(
  projectSchema: ProjectSchema,
  clipId: string,
  effectId: string,
): Promise<ProjectSchema> {
  try {
    const updatedSchema = await invoke<ProjectSchema>("add_effect_to_clip", { clipId, effectId, projectSchema })

    void logger.info("Effect added to clip", { clipId, effectId })
    return updatedSchema
  } catch (error) {
    void logger.error("Failed to add effect to clip", { error })
    throw error
  }
}

export async function addFilterToClip(
  projectSchema: ProjectSchema,
  clipId: string,
  filterId: string,
): Promise<ProjectSchema> {
  try {
    const updatedSchema = await invoke<ProjectSchema>("add_filter_to_clip", { clipId, filterId, projectSchema })

    void logger.info("Filter added to clip", { clipId, filterId })
    return updatedSchema
  } catch (error) {
    void logger.error("Failed to add filter to clip", { error })
    throw error
  }
}

export async function removeEffectFromClip(
  projectSchema: ProjectSchema,
  clipId: string,
  effectId: string,
): Promise<ProjectSchema> {
  try {
    const updatedSchema = await invoke<ProjectSchema>("remove_effect_from_clip", { clipId, effectId, projectSchema })

    void logger.info("Effect removed from clip", { clipId, effectId })
    return updatedSchema
  } catch (error) {
    void logger.error("Failed to remove effect from clip", { error })
    throw error
  }
}

export async function removeFilterFromClip(
  projectSchema: ProjectSchema,
  clipId: string,
  filterId: string,
): Promise<ProjectSchema> {
  try {
    const updatedSchema = await invoke<ProjectSchema>("remove_filter_from_clip", { clipId, filterId, projectSchema })

    void logger.info("Filter removed from clip", { clipId, filterId })
    return updatedSchema
  } catch (error) {
    void logger.error("Failed to remove filter from clip", { error })
    throw error
  }
}
