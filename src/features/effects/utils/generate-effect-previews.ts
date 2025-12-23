/**
 * Утилита для генерации превью видео для эффектов
 *
 * Использует систему пререндеринга для создания коротких демо-видео
 * с применённым эффектом для каждого эффекта в библиотеке
 */

import { prerenderSegment } from "@/domains/video-editing/services/compiler"
import { createLogger } from "@/lib/tauri-logger"
import type { BaseEffect } from "../types"

const logger = createLogger("EffectPreviewGenerator")

export interface EffectPreviewConfig {
  /** Исходное видео для применения эффекта */
  sourceVideoPath: string
  /** Длительность превью в секундах */
  duration: number
  /** Качество превью (0-100) */
  quality: number
  /** Директория для сохранения превью */
  outputDir: string
}

/**
 * Генерирует превью видео для одного эффекта
 */
export async function generateEffectPreview(effect: BaseEffect, config: EffectPreviewConfig): Promise<string | null> {
  try {
    void logger.info("Generating preview for effect", { effectId: effect.id })

    // Создаём минимальный проект с одним клипом и эффектом
    const projectSchema = {
      version: "1.0.0",
      metadata: {
        name: `effect-preview-${effect.id}`,
        description: null,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        author: null,
      },
      timeline: {
        fps: 30,
        resolution: [1920, 1080] as [number, number],
        duration: config.duration,
        zoom_level: 1.0,
        scroll_position: 0.0,
      },
      tracks: [
        {
          id: "preview-track",
          track_type: "video" as const,
          name: "Preview Track",
          enabled: true,
          volume: 1.0,
          locked: false,
          clips: [
            {
              id: "preview-clip",
              source: {
                File: config.sourceVideoPath,
              },
              start_time: 0,
              end_time: config.duration,
              source_start: 0,
              source_end: config.duration,
              speed: 1.0,
              opacity: 1.0,
              effects: [
                {
                  id: `${effect.id}-preview`,
                  effect_type: effect.processingType || "Custom",
                  name: effect.name,
                  category: effect.category || null,
                  complexity: effect.complexity || null,
                  tags: effect.tags || [],
                  description: effect.description || null,
                  labels: null,
                  enabled: true,
                  parameters:
                    effect.parameters?.reduce(
                      (acc, param) => {
                        acc[param.id] = param.defaultValue
                        return acc
                      },
                      {} as Record<string, any>,
                    ) || {},
                  start_time: null,
                  end_time: null,
                  ffmpeg_command:
                    effect.processors?.ffmpeg?.filter
                      ? effect.processors.ffmpeg.filter(
                          effect.parameters?.reduce(
                            (acc, param) => {
                              acc[param.id] = param.defaultValue
                              return acc
                            },
                            {} as Record<string, any>,
                          ) || {},
                        )
                      : null,
                  css_filter:
                    effect.processors?.css?.filter
                      ? effect.processors.css.filter(
                          effect.parameters?.reduce(
                            (acc, param) => {
                              acc[param.id] = param.defaultValue
                              return acc
                            },
                            {} as Record<string, any>,
                          ) || {},
                        )
                      : null,
                  preview_path: null,
                  presets: null,
                },
              ],
              filters: [],
              template_id: null,
              template_position: null,
              color_correction: null,
              crop: null,
              transform: null,
              audio_track_index: null,
              properties: {},
            },
          ],
          effects: [],
          filters: [],
        },
      ],
      effects: [],
      transitions: [],
      filters: [],
      templates: [],
      style_templates: [],
      subtitles: [],
      settings: {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        aspect_ratio: { width: 16, height: 9 },
        export: {
          format: "Mp4",
          quality: config.quality,
          video_bitrate: 8000,
          audio_bitrate: 192,
          hardware_acceleration: true,
          preferred_gpu_encoder: null,
          ffmpeg_args: [],
          encoding_profile: "main",
          rate_control_mode: "vbr",
          keyframe_interval: 60,
          b_frames: 2,
          multi_pass: 1,
          preset: "medium",
          max_bitrate: null,
          min_bitrate: null,
          crf: null,
          optimize_for_speed: false,
          optimize_for_network: false,
          normalize_audio: false,
          audio_target: -23.0,
          audio_peak: -1.0,
        },
        preview: {
          resolution: [640, 360],
          quality: 75,
          fps: 15,
          format: "Jpeg",
        },
        custom: {},
        output: {
          format: "Mp4",
          quality: config.quality,
          video_bitrate: null,
          audio_bitrate: 192,
          duration: config.duration,
        },
      },
    }

    const outputPath = `${config.outputDir}/effect_${effect.id}.mp4`

    // Рендерим превью
    const result = await prerenderSegment({
      projectSchema: projectSchema as any,
      startTime: 0,
      endTime: config.duration,
      outputPath, // Передаем путь к выходному файлу
      applyEffects: true,
      quality: config.quality,
    })

    if (result?.filePath) {
      void logger.info("Preview generated successfully", {
        effectId: effect.id,
        outputPath: result.filePath,
        renderTime: result.renderTimeMs,
      })
      return result.filePath
    }

    return null
  } catch (error) {
    void logger.error("Failed to generate preview", { effectId: effect.id, error })
    return null
  }
}

/**
 * Генерирует превью для всех эффектов
 */
export async function generateAllEffectPreviews(
  effects: BaseEffect[],
  config: EffectPreviewConfig,
  onProgress?: (current: number, total: number, effectId: string) => void,
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  void logger.info("Starting batch preview generation", { total: effects.length })

  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i]
    onProgress?.(i + 1, effects.length, effect.id)

    const previewPath = await generateEffectPreview(effect, config)
    if (previewPath) {
      results.set(effect.id, previewPath)
    }
  }

  void logger.info("Batch preview generation completed", {
    total: effects.length,
    successful: results.size,
    failed: effects.length - results.size,
  })

  return results
}

/**
 * Обновляет эффекты с путями к превью
 */
export function updateEffectsWithPreviews(effects: BaseEffect[], previewPaths: Map<string, string>): BaseEffect[] {
  return effects.map((effect) => {
    const previewPath = previewPaths.get(effect.id)
    if (previewPath) {
      return {
        ...effect,
        preview: previewPath,
      }
    }
    return effect
  })
}
