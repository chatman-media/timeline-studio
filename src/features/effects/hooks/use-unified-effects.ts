/**
 * Unified Effects Hook - Хук для работы с единой системой эффектов
 * Интеграция с Timeline и Preview системами
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { logError, logInfo } from "@/lib/tauri-logger"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { usePlayer } from "@/features/video-player"

import { basicEffectsLibrary } from "../presets/basic-effects"
import { EffectManager } from "../services/effect-manager"
import { type RenderContext, type RenderResult, WebGL2UnifiedRenderer } from "../services/webgl2-unified-renderer"

import type {
  AppliedEffect,
  BaseEffect,
  EffectCategory,
  EffectEvent,
  EffectPreset,
  EffectScope,
  EffectStack,
} from "../types/unified-effects"

interface UseUnifiedEffectsOptions {
  // Автоматически загружать базовые эффекты
  loadBasicEffects?: boolean

  // Размер кеша для рендеринга
  cacheSize?: number

  // Качество превью
  quality?: "draft" | "preview" | "full"

  // Обновления в реальном времени
  realTimeUpdates?: boolean
}

interface EffectsState {
  // Базовые эффекты
  availableEffects: BaseEffect[]
  effectsById: Map<string, BaseEffect>

  // Применённые эффекты для текущего объекта
  appliedEffects: AppliedEffect[]
  currentStack: EffectStack | null

  // Состояние рендеринга
  isRendering: boolean
  lastRenderResult: RenderResult | null

  // Превью
  previewCanvas: HTMLCanvasElement | null
  previewBitmap: ImageBitmap | null
}

export function useUnifiedEffects(
  targetId: string, // ID клипа/трека/последовательности
  targetType: EffectScope,
  options: UseUnifiedEffectsOptions = {},
) {
  const { loadBasicEffects = true, cacheSize = 100, quality = "preview", realTimeUpdates = true } = options

  // Менеджеры
  const effectManager = useRef(new EffectManager())
  const renderer = useRef(new WebGL2UnifiedRenderer())

  // Timeline состояние
  const { currentTime } = useTimeline()
  const { currentVideo: mediaFile, isPlaying } = usePlayer()

  // Локальное состояние
  const [state, setState] = useState<EffectsState>({
    availableEffects: [],
    effectsById: new Map(),
    appliedEffects: [],
    currentStack: null,
    isRendering: false,
    lastRenderResult: null,
    previewCanvas: null,
    previewBitmap: null,
  })

  // ============================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ============================================================================

  useEffect(() => {
    logInfo("useUnifiedEffects", `Initializing unified effects for ${targetType} - ${targetId}`)

    if (loadBasicEffects) {
      // Регистрируем базовые эффекты
      effectManager.current.registerEffects(basicEffectsLibrary)

      // Обновляем состояние
      const effects = effectManager.current.getAllEffects()
      const effectsMap = new Map<string, BaseEffect>()
      effects.forEach((effect) => effectsMap.set(effect.id, effect))

      setState((prev) => ({
        ...prev,
        availableEffects: effects,
        effectsById: effectsMap,
      }))

      logInfo("useUnifiedEffects", `Loaded ${effects.length} basic effects`)
    }

    // Создаем стек эффектов для объекта
    const stack = effectManager.current.createEffectStack(targetId, `${targetType}_${targetId}`)
    setState((prev) => ({ ...prev, currentStack: stack }))

    // Подписываемся на события
    const handleEffectEvent = (_event: EffectEvent) => {
      // Обновляем состояние при изменениях
      updateEffectsState()
    }
    effectManager.current.addEventListener(handleEffectEvent)

    return () => {
      effectManager.current.removeEventListener(handleEffectEvent)
      renderer.current.dispose()
    }
  }, [targetId, targetType, loadBasicEffects])

  // Обновление состояния эффектов
  const updateEffectsState = useCallback(() => {
    const stack = effectManager.current.getEffectStack(targetId)
    if (stack) {
      setState((prev) => ({
        ...prev,
        currentStack: stack,
        appliedEffects: stack.effects,
      }))
    }
  }, [targetId])

  // ============================================================================
  // УПРАВЛЕНИЕ ЭФФЕКТАМИ
  // ============================================================================

  /**
   * Применить эффект к объекту
   */
  const applyEffect = useCallback(
    (
      effectId: string,
      options: {
        startTime?: number
        duration?: number
        parameters?: Record<string, any>
      } = {},
    ): AppliedEffect => {
      logInfo("useUnifiedEffects", `Applying effect ${effectId} to ${targetType}`)
      const appliedEffect = effectManager.current.applyEffect(effectId, targetId, targetType, options)
      updateEffectsState()
      return appliedEffect
    },
    [targetId, targetType, updateEffectsState],
  )

  /**
   * Удалить применённый эффект
   */
  const removeEffect = useCallback(
    (appliedEffectId: string) => {
      effectManager.current.removeAppliedEffect(appliedEffectId)
      updateEffectsState()
    },
    [updateEffectsState],
  )

  /**
   * Изменить параметр эффекта
   */
  const setEffectParameter = useCallback(
    (appliedEffectId: string, parameterId: string, value: any, addKeyframe = false, time?: number) => {
      effectManager.current.setEffectParameter(appliedEffectId, parameterId, value, addKeyframe, time)
      updateEffectsState()
    },
    [updateEffectsState],
  )

  /**
   * Переупорядочить эффекты
   */
  const reorderEffects = useCallback(
    (newOrder: string[]) => {
      effectManager.current.reorderEffects(targetId, newOrder)
      updateEffectsState()
    },
    [targetId, updateEffectsState],
  )

  /**
   * Применить пресет
   */
  const applyPreset = useCallback(
    (appliedEffectId: string, presetId: string) => {
      effectManager.current.applyPreset(appliedEffectId, presetId)
      updateEffectsState()
    },
    [updateEffectsState],
  )

  /**
   * Создать пользовательский пресет
   */
  const createPreset = useCallback(
    (
      appliedEffectId: string,
      name: { en: string; ru: string },
      description?: { en: string; ru: string },
    ): EffectPreset => {
      const preset = effectManager.current.createPreset(appliedEffectId, name, description)
      updateEffectsState()
      return preset
    },
    [updateEffectsState],
  )

  // ============================================================================
  // РЕНДЕРИНГ И ПРЕВЬЮ
  // ============================================================================

  /**
   * Рендерить эффекты для текущего времени
   */
  const renderEffects = useCallback(
    async (source?: HTMLVideoElement | HTMLCanvasElement | ImageBitmap, customTime?: number): Promise<RenderResult> => {
      logInfo("useUnifiedEffects", `Rendering effects at time ${customTime ?? currentTime}`)

      if (state.appliedEffects.length === 0) {
        return { success: true, output: source as any, processingTime: 0 }
      }

      setState((prev) => ({ ...prev, isRendering: true }))

      try {
        const context: RenderContext = {
          source: source || document.createElement("canvas"),
          width: 1920,
          height: 1080,
          currentTime: customTime !== undefined ? customTime : currentTime,
          quality,
        }

        const result = await renderer.current.renderEffectStack(state.appliedEffects, state.effectsById, context)

        setState((prev) => ({
          ...prev,
          lastRenderResult: result,
          isRendering: false,
          previewBitmap: result.output instanceof ImageBitmap ? result.output : null,
        }))

        logInfo("useUnifiedEffects", `Effects rendered successfully in ${result.processingTime}ms`)
        return result
      } catch (error) {
        logError("useUnifiedEffects", "Error rendering effects", error)

        const errorResult: RenderResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          processingTime: 0,
        }

        setState((prev) => ({
          ...prev,
          lastRenderResult: errorResult,
          isRendering: false,
        }))

        return errorResult
      }
    },
    [state.appliedEffects, state.effectsById, mediaFile, currentTime, quality],
  )

  // ============================================================================
  // ПОИСК И ФИЛЬТРАЦИЯ
  // ============================================================================

  /**
   * Поиск эффектов
   */
  const searchEffects = useCallback(
    (
      query: string,
      filters?: {
        category?: EffectCategory
        complexity?: string[]
        gpuAccelerated?: boolean
      },
    ): BaseEffect[] => {
      return effectManager.current.searchEffects(query, {
        ...filters,
        scope: targetType,
      })
    },
    [targetType],
  )

  /**
   * Получить эффекты по категории
   */
  const getEffectsByCategory = useCallback(
    (category: EffectCategory): BaseEffect[] => {
      return state.availableEffects.filter(
        (effect) => effect.category === category && effect.scope.includes(targetType),
      )
    },
    [state.availableEffects, targetType],
  )

  // ============================================================================
  // АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ПРЕВЬЮ
  // ============================================================================

  useEffect(() => {
    if (!realTimeUpdates || state.appliedEffects.length === 0 || state.isRendering) {
      return
    }

    // Рендерим с задержкой для избежания частых обновлений
    const timeoutId = setTimeout(() => {
      void renderEffects()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [currentTime, state.appliedEffects, realTimeUpdates, state.isRendering, renderEffects])

  // ============================================================================
  // ЭКСПОРТ/ИМПОРТ
  // ============================================================================

  /**
   * Экспортировать стек эффектов
   */
  const exportEffectStack = useCallback((): EffectStack | null => {
    return effectManager.current.exportEffectStack(targetId)
  }, [targetId])

  /**
   * Импортировать стек эффектов
   */
  const importEffectStack = useCallback(
    (stack: EffectStack) => {
      effectManager.current.importEffectStack(targetId, stack)
      updateEffectsState()
    },
    [targetId, updateEffectsState],
  )

  // ============================================================================
  // МЕМОИЗИРОВАННЫЕ ЗНАЧЕНИЯ
  // ============================================================================

  const effectsByCategory = useMemo(() => {
    const categories: Record<EffectCategory, BaseEffect[]> = {} as any

    state.availableEffects
      .filter((effect) => effect.scope.includes(targetType))
      .forEach((effect) => {
        if (!categories[effect.category]) {
          categories[effect.category] = []
        }
        categories[effect.category].push(effect)
      })

    return categories
  }, [state.availableEffects, targetType])

  const hasActiveEffects = useMemo(() => {
    return state.appliedEffects.some((effect) => effect.enabled)
  }, [state.appliedEffects])

  const canRender = useMemo(() => {
    return hasActiveEffects && !state.isRendering && mediaFile
  }, [hasActiveEffects, state.isRendering, mediaFile])

  // ============================================================================
  // ВОЗВРАЩАЕМЫЙ ОБЪЕКТ
  // ============================================================================

  return {
    // Состояние
    availableEffects: state.availableEffects,
    appliedEffects: state.appliedEffects,
    currentStack: state.currentStack,
    effectsByCategory,
    hasActiveEffects,
    canRender,
    isRendering: state.isRendering,

    // Превью
    previewCanvas: state.previewCanvas,
    previewBitmap: state.previewBitmap,
    lastRenderResult: state.lastRenderResult,

    // Управление эффектами
    applyEffect,
    removeEffect,
    setEffectParameter,
    reorderEffects,
    applyPreset,
    createPreset,

    // Рендеринг
    renderEffects,

    // Поиск
    searchEffects,
    getEffectsByCategory,

    // Импорт/экспорт
    exportEffectStack,
    importEffectStack,

    // Менеджеры (для расширенного использования)
    effectManager: effectManager.current,
    renderer: renderer.current,
  }
}
