/**
 * User Effects Service
 * Управление пользовательскими эффектами через backend команды.
 */

import { invoke } from "@tauri-apps/api/core"
import type { BaseEffect } from "@/core/types"
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
