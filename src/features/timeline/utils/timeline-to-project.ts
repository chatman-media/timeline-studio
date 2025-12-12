/**
 * Преобразование Timeline в ProjectSchema для Video Compiler
 */

// Временные заглушки для отсутствующих типов

// Import actual types
import type { Transition, VideoFilter } from "@/domains/video-editing/types"
import type { StyleTemplate } from "@/features/style-templates/types"
import { SubtitleClip } from "@/features/subtitles"
import type { MediaTemplate } from "@/features/templates/lib/templates"
import type { TrackType } from "@/types/generated/tauri-bindings"
import {
  AlignX,
  AlignY,
  AnimationDirection,
  AnimationEasing,
  AnimationType,
  AspectRatio,
  type Clip as BackendClip,
  type StyleTemplate as BackendStyleTemplate,
  type Subtitle as BackendSubtitle,
  type SubtitleAnimation as BackendSubtitleAnimation,
  type SubtitlePosition as BackendSubtitlePosition,
  type SubtitleStyle as BackendSubtitleStyle,
  type Track as BackendTrack,
  // Effect as BackendEffect, // Not exported from video-compiler
  CompilerTemplateType,
  type ElementAnimation,
  FilterType,
  FitMode,
  FontWeight,
  ObjectFit,
  OutputFormat,
  type ProjectSchema,
  StyleElementType,
  StyleTemplateCategory,
  type StyleTemplateElement,
  StyleTemplateStyle,
  SubtitleAlignX,
  SubtitleAlignY,
  SubtitleAnimationType,
  SubtitleDirection,
  SubtitleEasing,
  SubtitleFontWeight,
  TemplateType,
  TextAlign,
  toRustEnumCase,
} from "../../../domains/video-editing/types"

// Aliases for compatibility
type BackendFilter = FilterType
type BackendTemplate = TemplateType
type TemplateCell = {
  index: number
  x: number
  y: number
  width: number
  height: number
  clip_id?: string
}

import {
  type AppliedEffect,
  type AppliedTransition,
  isSubtitleClip,
  type ProjectResources,
  type TimelineClip,
  type TimelineProject,
  type TimelineTrack,
} from "@/features/timeline/types"

/**
 * Преобразует проект Timeline в схему для Video Compiler
 */
export function timelineToProjectSchema(timeline: TimelineProject): ProjectSchema {
  const now = new Date().toISOString()

  // Собираем все AppliedEffect со всех клипов и треков для конвертации
  const appliedEffectsMap = new Map<string, { applied: AppliedEffect; baseEffect?: any }>()

  // Функция для сбора эффектов с клипа
  const collectClipEffects = (clip: TimelineClip) => {
    clip.effects?.forEach((appliedEffect) => {
      if (!appliedEffectsMap.has(appliedEffect.id)) {
        // Найти базовый эффект из ресурсов
        const baseEffect = timeline.resources?.effects?.find((e) => e.id === appliedEffect.effectId)
        appliedEffectsMap.set(appliedEffect.id, { applied: appliedEffect, baseEffect })
      }
    })
  }

  // Функция для сбора эффектов с трека
  const collectTrackEffects = (track: TimelineTrack) => {
    track.trackEffects?.forEach((appliedEffect) => {
      if (!appliedEffectsMap.has(appliedEffect.id)) {
        const baseEffect = timeline.resources?.effects?.find((e) => e.id === appliedEffect.effectId)
        appliedEffectsMap.set(appliedEffect.id, { applied: appliedEffect, baseEffect })
      }
    })
    track.clips.forEach(collectClipEffects)
  }

  // Собираем эффекты из всех треков
  timeline.sections?.forEach((section) => {
    section.tracks.forEach(collectTrackEffects)
  })
  timeline.globalTracks?.forEach(collectTrackEffects)

  // Собираем все треки из секций и глобальные треки
  const tracks: BackendTrack[] = []

  // Добавляем треки из секций
  timeline.sections?.forEach((section) => {
    section.tracks.forEach((track) => {
      tracks.push(convertTrack(track, timeline.resources))
    })
  })

  // Добавляем глобальные треки
  timeline.globalTracks?.forEach((track) => {
    tracks.push(convertTrack(track, timeline.resources))
  })

  // Преобразуем ресурсы проекта в формат backend
  // Конвертируем AppliedEffect с мерджем параметров базового эффекта и кастомных
  const allEffects = convertAppliedEffects(appliedEffectsMap, timeline.resources?.effects || [])
  const allFilters: BackendFilter[] = convertFilters(timeline.resources?.filters || [])
  // FIXME: Frontend и backend Transition типы не совместимы
  const allTransitions = [] as any[]
  const allTemplates: BackendTemplate[] = convertTemplates(timeline.resources?.templates || [])
  const allStyleTemplates: BackendStyleTemplate[] = convertStyleTemplates(timeline.resources?.styleTemplates || [])
  const allSubtitles = collectAllSubtitles(timeline)

  return {
    version: "1.0.0",
    metadata: {
      name: timeline.name || "Untitled Project",
      description: timeline.description || undefined,
      created_at: timeline.createdAt ? timeline.createdAt.toISOString() : now,
      modified_at: now,
      author: undefined,
    },
    timeline: {
      duration: calculateProjectDuration(timeline),
      fps: timeline.settings?.fps || 30,
      resolution: timeline.settings?.resolution
        ? [timeline.settings.resolution.width, timeline.settings.resolution.height]
        : [1920, 1080],
      sample_rate: timeline.settings?.sampleRate || 48000,
      aspect_ratio: getAspectRatio(
        timeline.settings?.resolution
          ? [timeline.settings.resolution.width, timeline.settings.resolution.height]
          : [1920, 1080],
      ),
    },
    tracks: tracks as any,
    effects: allEffects as any,
    transitions: allTransitions as any,
    filters: allFilters as any,
    templates: allTemplates as any,
    style_templates: allStyleTemplates,
    subtitles: allSubtitles,
    settings: {
      export: {
        format: OutputFormat.Mp4,
        quality: 85,
        video_bitrate: 8000,
        audio_bitrate: 192,
        hardware_acceleration: true,
        ffmpeg_args: [],
      },
      preview: {
        resolution: [1280, 720],
        fps: 30,
        quality: 75,
      },
      custom: {},
    },
  }
}

/**
 * Преобразует трек Timeline в трек Backend
 */
function convertTrack(track: TimelineTrack, _resources: ProjectResources): any {
  const trackType = getTrackType(track.type)

  return {
    id: track.id,
    track_type: trackType,
    name: track.name || `${track.type} Track`,
    enabled: !track.isMuted,
    locked: track.isLocked ?? false,
    volume: track.volume ?? 1.0,
    clips: track.clips.map((clip) => convertClip(clip)),
    // ИСПРАВЛЕНО: используем e.id для ссылки на AppliedEffect с кастомными параметрами
    effects: track.trackEffects?.map((e) => e.id) || [],
    filters: [], // TODO: implement track filters when added to TimelineTrack type
  }
}

/**
 * Преобразует клип Timeline в клип Backend
 */
function convertClip(clip: TimelineClip): BackendClip {
  return {
    id: clip.id,
    source_path: clip.mediaFile?.path || "",
    start_time: clip.startTime,
    end_time: clip.startTime + clip.duration,
    source_start: clip.mediaStartTime !== null && clip.mediaStartTime !== undefined ? clip.mediaStartTime : 0,
    source_end:
      clip.mediaEndTime !== null && clip.mediaEndTime !== undefined
        ? clip.mediaEndTime
        : (clip.mediaStartTime !== null && clip.mediaStartTime !== undefined ? clip.mediaStartTime : 0) + clip.duration,
    speed: clip.speed || 1.0,
    volume: clip.volume ?? 1.0,
    // ИСПРАВЛЕНО: используем e.id (ID применения), а не e.effectId (ID базового эффекта)
    // Это позволяет передать кастомные параметры для каждого применения эффекта
    effects: clip.effects?.map((e) => e.id) || [],
    filters: clip.filters?.map((f) => f.filterId) || [],
    // transitions не является свойством Clip в backend
    // Оставляем закомментированным для совместимости
    // transitions: convertClipTransitions(clip.transitions),
    template_id: clip.templateId,
    template_cell: clip.templateCell,
    style_template_id: clip.styleTemplate?.styleTemplateId,
  }
}

/**
 * Конвертирует переходы клипа
 */
function convertClipTransitions(transitions?: AppliedTransition[]): string[] {
  if (!transitions) return []

  return transitions.filter((t) => t.isEnabled).map((t) => t.transitionId)
}

/**
 * Преобразует эффекты в формат backend
 * Возвращает массив в формате, совместимом с ProjectSchema
 */
function convertEffects(effects: any[]): any[] {
  return effects.map((effect) => ({
    id: effect.id,
    effect_type: effect.category
      ? toRustEnumCase(effect.category)
      : effect.type
        ? toRustEnumCase(effect.type)
        : "Custom",
    name: typeof effect.name === "string" ? effect.name : effect.name?.ru || "Unnamed Effect",
    enabled: true,
    parameters: convertEffectParameters(effect),
    ffmpeg_command:
      effect.ffmpegCommand ||
      (effect.processors?.ffmpeg
        ? typeof effect.processors.ffmpeg.filter === "function"
          ? effect.processors.ffmpeg.filter(getDefaultParams(effect))
          : effect.processors.ffmpeg.filter
        : undefined),
  }))
}

/**
 * Преобразует AppliedEffect в формат backend с мерджем параметров
 * Это ГЛАВНАЯ функция для конвертации эффектов с кастомными параметрами
 */
function convertAppliedEffects(
  appliedEffectsMap: Map<string, { applied: AppliedEffect; baseEffect?: any }>,
  baseEffects: any[],
): any[] {
  const result: any[] = []

  // Сначала добавляем все базовые эффекты (для совместимости)
  baseEffects.forEach((effect) => {
    result.push({
      id: effect.id,
      effect_type: getEffectType(effect),
      name: typeof effect.name === "string" ? effect.name : effect.name?.ru || "Unnamed Effect",
      enabled: true,
      parameters: convertEffectParameters(effect),
      ffmpeg_command: getFFmpegCommand(effect, getDefaultParams(effect)),
    })
  })

  // Затем добавляем все AppliedEffect с кастомными параметрами
  appliedEffectsMap.forEach(({ applied, baseEffect }) => {
    // Мерджим базовые параметры с кастомными
    const baseParams = baseEffect ? convertEffectParameters(baseEffect) : {}
    const customParams = applied.parameters || {}
    const mergedParams = { ...baseParams, ...customParams }

    // Генерируем FFmpeg команду с мерджеными параметрами
    const ffmpegCommand = baseEffect
      ? getFFmpegCommand(baseEffect, mergedParams)
      : generateFFmpegFromParams(applied.effectId, mergedParams)

    result.push({
      id: applied.id, // Используем ID применения, не базового эффекта
      effect_type: baseEffect ? getEffectType(baseEffect) : mapEffectIdToType(applied.effectId),
      name: baseEffect
        ? typeof baseEffect.name === "string"
          ? baseEffect.name
          : baseEffect.name?.ru || "Effect"
        : "Applied Effect",
      enabled: applied.enabled,
      parameters: mergedParams,
      ffmpeg_command: ffmpegCommand,
    })
  })

  return result
}

/**
 * Получает тип эффекта для backend
 */
function getEffectType(effect: any): string {
  return effect.category ? toRustEnumCase(effect.category) : effect.type ? toRustEnumCase(effect.type) : "Custom"
}

/**
 * Получает FFmpeg команду для эффекта
 */
function getFFmpegCommand(effect: any, params: Record<string, any>): string | undefined {
  if (effect.ffmpegCommand) return effect.ffmpegCommand

  if (effect.processors?.ffmpeg) {
    const ffmpegProcessor = effect.processors.ffmpeg
    if (typeof ffmpegProcessor.filter === "function") {
      return ffmpegProcessor.filter(params)
    }
    return ffmpegProcessor.filter
  }

  return undefined
}

/**
 * Маппинг ID эффекта на тип backend
 * Используется когда базовый эффект не найден
 */
function mapEffectIdToType(effectId: string): string {
  const effectTypeMap: Record<string, string> = {
    // Color effects
    "brightness-contrast": "ColorCorrection",
    brightness: "ColorCorrection",
    contrast: "ColorCorrection",
    saturation: "ColorCorrection",
    "color-correction": "ColorCorrection",
    "color-grading": "ColorGrading",
    "color-balance": "ColorCorrection",
    temperature: "ColorCorrection",
    tint: "ColorCorrection",
    hue: "ColorCorrection",
    vibrance: "ColorCorrection",

    // Blur & Sharpen
    blur: "Blur",
    "gaussian-blur": "Blur",
    "motion-blur": "Blur",
    "radial-blur": "Blur",
    sharpen: "Sharpen",
    "unsharp-mask": "Sharpen",

    // Stylize
    vintage: "Custom",
    retro: "Custom",
    "film-grain": "Custom",
    vignette: "Vignette",
    sepia: "Custom",
    "black-white": "Custom",
    invert: "Custom",
    posterize: "Custom",

    // Distort
    "lens-distortion": "Custom",
    fisheye: "Custom",
    wave: "Custom",
    ripple: "Custom",
    glitch: "Custom",
    pixelate: "Custom",

    // Keying
    "chroma-key": "ChromaKey",
    "luma-key": "Custom",
    "color-key": "ChromaKey",

    // Audio
    "audio-fade": "AudioFade",
    "audio-compressor": "AudioCompressor",
    "audio-equalizer": "AudioEqualizer",
  }

  return effectTypeMap[effectId] || "Custom"
}

/**
 * Генерирует FFmpeg команду на основе типа эффекта и параметров
 */
function generateFFmpegFromParams(effectId: string, params: Record<string, any>): string | undefined {
  const ffmpegGenerators: Record<string, (p: Record<string, any>) => string> = {
    // Color Correction
    "brightness-contrast": (p) => `eq=brightness=${p.brightness || 0}:contrast=${p.contrast || 1}`,
    brightness: (p) => `eq=brightness=${p.value || p.brightness || 0}`,
    contrast: (p) => `eq=contrast=${p.value || p.contrast || 1}`,
    saturation: (p) => `eq=saturation=${p.value || p.saturation || 1}`,
    "color-correction": (p) =>
      `eq=brightness=${p.brightness || 0}:contrast=${p.contrast || 1}:saturation=${p.saturation || 1}:gamma=${p.gamma || 1}`,

    // Blur & Sharpen
    blur: (p) => `gblur=sigma=${p.sigma || p.blurRadius || p.value || 5}`,
    "gaussian-blur": (p) => `gblur=sigma=${p.sigma || p.value || 5}`,
    sharpen: (p) => `unsharp=5:5:${p.amount || p.value || 1}:5:5:0`,
    "unsharp-mask": (p) =>
      `unsharp=${p.lumaX || 5}:${p.lumaY || 5}:${p.amount || 1}:${p.chromaX || 5}:${p.chromaY || 5}:0`,

    // Stylize
    vignette: (p) => `vignette=PI/${4 - (p.intensity || p.value || 0.5) * 3}`,
    sepia: () => "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
    "black-white": () => "hue=s=0",
    invert: () => "negate",

    // Keying
    "chroma-key": (p) => {
      const color = p.color || p.keyColor || "0x00FF00"
      const similarity = p.similarity || p.tolerance || 0.1
      const blend = p.blend || p.softness || 0.1
      return `chromakey=${color}:${similarity}:${blend}`
    },

    // Audio
    "audio-fade": (p) => {
      const type = p.type || "in"
      const duration = p.duration || 1
      return `afade=t=${type}:d=${duration}`
    },
    "audio-compressor": (p) =>
      `acompressor=threshold=${p.threshold || 0.1}:ratio=${p.ratio || 4}:attack=${p.attack || 20}:release=${p.release || 250}`,
    "audio-equalizer": (p) => {
      const bands: string[] = []
      if (p.bass !== undefined) bands.push(`equalizer=f=100:width_type=o:width=2:g=${p.bass}`)
      if (p.mid !== undefined) bands.push(`equalizer=f=1000:width_type=o:width=2:g=${p.mid}`)
      if (p.treble !== undefined) bands.push(`equalizer=f=10000:width_type=o:width=2:g=${p.treble}`)
      return bands.length > 0 ? bands.join(",") : "equalizer=f=1000:width_type=o:width=2:g=0"
    },
  }

  const generator = ffmpegGenerators[effectId]
  return generator ? generator(params) : undefined
}

/**
 * Преобразует параметры эффекта
 */
function convertEffectParameters(effect: any): Record<string, any> {
  // Если это простой объект из теста с полем params
  if (effect.params && !effect.parameters) {
    const params = { ...effect.params }

    // Специальное преобразование для тестов: intensity -> value
    if ("intensity" in params && !("value" in params)) {
      params.value = params.intensity
      delete params.intensity
    }

    return params
  }

  const parameters: Record<string, any> = {}

  // Если есть массив parameters как в BaseEffect
  if (Array.isArray(effect.parameters)) {
    effect.parameters.forEach((param: any) => {
      const value = param.currentValue !== undefined ? param.currentValue : param.defaultValue
      if (value !== undefined) {
        parameters[param.id] = value
      }
    })
  }

  return parameters
}

/**
 * Получает дефолтные параметры эффекта
 */
function getDefaultParams(effect: any): Record<string, any> {
  // Если это простой объект из теста с полем params
  if (effect.params && !effect.parameters) {
    return effect.params
  }

  const params: Record<string, any> = {}

  if (Array.isArray(effect.parameters)) {
    effect.parameters.forEach((param: any) => {
      params[param.id] = param.currentValue !== undefined ? param.currentValue : param.defaultValue
    })
  }

  return params
}

/**
 * Преобразует фильтры в формат backend
 */
function convertFilters(filters: VideoFilter[]): any[] {
  return filters.map((filter) => {
    // Преобразуем параметры фильтра
    const parameters: Record<string, number> = {}
    if (filter.params) {
      Object.entries(filter.params).forEach(([key, value]) => {
        if (value !== undefined && typeof value === "number") {
          parameters[key] = value
        }
      })
    }

    // Определяем тип фильтра
    let filterType: any = "Custom"
    const typeMap: Record<string, string> = {
      brightness: "Brightness",
      contrast: "Contrast",
      saturation: "Saturation",
      gamma: "Gamma",
      temperature: "Temperature",
      tint: "Tint",
      hue: "Hue",
      vibrance: "Vibrance",
      shadows: "Shadows",
      highlights: "Highlights",
      blacks: "Blacks",
      whites: "Whites",
      clarity: "Clarity",
      dehaze: "Dehaze",
      vignette: "Vignette",
      grain: "Grain",
      blur: "Blur",
      sharpen: "Sharpen",
    }

    // Определяем тип по параметрам
    if (filter.params) {
      for (const [param, type] of Object.entries(typeMap)) {
        if ((filter.params as any)[param] !== undefined) {
          filterType = type
          break
        }
      }
    }

    return {
      id: filter.id,
      filter_type: filterType,
      name: filter.name,
      enabled: true,
      parameters,
      ffmpeg_command: undefined,
    }
  })
}

/**
 * Преобразует переходы в формат backend
 */
function convertTransitions(_transitions: Transition[]): Transition[] {
  // Поскольку типы Transition из frontend и backend не совпадают,
  // просто возвращаем пустой массив
  // TODO: Имплементировать корректную конвертацию переходов
  return []
}

/**
 * Конвертирует тип перехода в backend enum
 */
function convertTransitionType(type: string): string {
  // Маппинг типов переходов на backend enum
  const transitionMap: Record<string, string> = {
    // Базовые переходы
    fade: "Fade",
    crossfade: "CrossFade",
    "dip-to-black": "DipToBlack",
    dissolve: "Dissolve",

    // Движение
    "slide-left": "SlideLeft",
    "slide-right": "SlideRight",
    "slide-up": "SlideUp",
    "slide-down": "SlideDown",
    "push-left": "PushLeft",
    "push-right": "PushRight",
    "push-up": "PushUp",
    "push-down": "PushDown",

    // Вытеснение
    "wipe-left": "WipeLeft",
    "wipe-right": "WipeRight",
    "wipe-up": "WipeUp",
    "wipe-down": "WipeDown",
    "wipe-diagonal": "WipeDiagonal",

    // Масштабирование
    "zoom-in": "ZoomIn",
    "zoom-out": "ZoomOut",
    scale: "Scale",

    // Вращение
    rotate: "Rotate",
    spin: "Spin",
    swirl: "Swirl",

    // 3D эффекты
    cube: "Cube",
    flip: "Flip",
    "page-turn": "PageTurn",

    // Творческие
    ripple: "Ripple",
    wave: "Wave",
    glitch: "Glitch",
    pixelate: "Pixelate",
    blur: "Blur",
    burn: "Burn",
    shatter: "Shatter",

    // Геометрические
    iris: "Iris",
    blinds: "Blinds",
    radial: "Radial",
    spiral: "Spiral",
    kaleidoscope: "Kaleidoscope",
  }

  // Возвращаем маппинг или используем тип как есть с капитализацией
  return transitionMap[type] || toRustEnumCase(type)
}

/**
 * Конвертирует параметры перехода
 */
function convertTransitionParams(transition: Transition): Record<string, any> {
  const params: Record<string, any> = {}

  // Базовые параметры из определения перехода
  if (transition.parameters) {
    // Направление
    if (transition.parameters.direction) {
      params.direction = convertTransitionDirection(transition.parameters.direction)
    }

    // Смягчение (easing)
    if (transition.parameters.easing) {
      params.easing = convertTransitionEasing(transition.parameters.easing)
    }

    // Интенсивность
    if (transition.parameters.intensity !== undefined) {
      params.intensity = transition.parameters.intensity
    }

    // Масштаб
    if (transition.parameters.scale !== undefined) {
      params.scale = transition.parameters.scale
    }

    // Плавность
    if (transition.parameters.smoothness !== undefined) {
      params.smoothness = transition.parameters.smoothness
    }
  }

  // Дополнительные параметры в зависимости от типа
  switch (transition.type) {
    case "blur":
      params.blur_amount = params.intensity || 0.5
      break
    case "glitch":
      params.glitch_strength = params.intensity || 0.7
      params.glitch_frequency = 5
      break
    case "pixelate":
      params.pixel_size = Math.round((params.scale || 1) * 20)
      break
    case "burn":
      params.burn_intensity = params.intensity || 0.8
      params.burn_color = "#FF6600"
      break
    case "ripple":
      params.ripple_amplitude = params.scale || 1.0
      params.ripple_frequency = 3
      break
    default:
      // Для остальных типов переходов используем стандартные параметры
      break
  }

  return params
}

/**
 * Конвертирует направление перехода
 */
function convertTransitionDirection(direction: string): string {
  const directionMap: Record<string, string> = {
    left: "Left",
    right: "Right",
    up: "Up",
    down: "Down",
    center: "Center",
  }

  return directionMap[direction] || "Right"
}

/**
 * Конвертирует easing перехода
 */
function convertTransitionEasing(easing: string): string {
  const easingMap: Record<string, string> = {
    linear: "Linear",
    "ease-in": "EaseIn",
    "ease-out": "EaseOut",
    "ease-in-out": "EaseInOut",
    bounce: "Bounce",
  }

  return easingMap[easing] || "Linear"
}

/**
 * Преобразует шаблоны в формат backend
 */
function convertTemplates(templates: MediaTemplate[]): any[] {
  return templates.map((template) => {
    // Преобразуем ячейки шаблона
    const cells: TemplateCell[] = []

    // Создаем ячейки на основе типа шаблона
    if (template.split === "vertical") {
      // Вертикальное разделение
      for (let i = 0; i < template.screens; i++) {
        const width = 100 / template.screens
        cells.push({
          index: i,
          x: i * width,
          y: 0,
          width,
          height: 100,
          fit_mode: FitMode.Cover,
          align_x: AlignX.Center,
          align_y: AlignY.Center,
        } as any)
      }
    } else if (template.split === "horizontal") {
      // Горизонтальное разделение
      for (let i = 0; i < template.screens; i++) {
        const height = 100 / template.screens
        cells.push({
          index: i,
          x: 0,
          y: i * height,
          width: 100,
          height,
          fit_mode: FitMode.Cover,
          align_x: AlignX.Center,
          align_y: AlignY.Center,
        } as any)
      }
    } else if (template.split === "grid") {
      // Сетка
      const cols = Math.ceil(Math.sqrt(template.screens))
      const rows = Math.ceil(template.screens / cols)
      const cellWidth = 100 / cols
      const cellHeight = 100 / rows

      for (let i = 0; i < template.screens; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        cells.push({
          index: i,
          x: col * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
          fit_mode: FitMode.Cover,
          align_x: AlignX.Center,
          align_y: AlignY.Center,
        } as any)
      }
    }

    // Определяем тип шаблона
    const templateTypeMap: Record<string, CompilerTemplateType> = {
      vertical: CompilerTemplateType.Vertical,
      horizontal: CompilerTemplateType.Horizontal,
      diagonal: CompilerTemplateType.Diagonal,
      grid: CompilerTemplateType.Grid,
      custom: CompilerTemplateType.Custom,
    }

    return {
      id: template.id,
      template_type: templateTypeMap[template.split] || CompilerTemplateType.Custom,
      name: template.id, // Используем ID как имя
      screens: template.screens,
      cells,
    }
  })
}

/**
 * Преобразует стилестические шаблоны в формат backend
 */
function convertStyleTemplates(styleTemplates: StyleTemplate[]): BackendStyleTemplate[] {
  return styleTemplates.map((styleTemplate) => {
    // Преобразуем элементы шаблона
    const elements: StyleTemplateElement[] = styleTemplate.elements.map((element) => {
      // Преобразуем тип элемента
      const elementTypeMap: Record<string, StyleElementType> = {
        text: StyleElementType.Text,
        shape: StyleElementType.Shape,
        image: StyleElementType.Image,
        video: StyleElementType.Video,
        animation: StyleElementType.Animation,
        particle: StyleElementType.Particle,
      }

      // Преобразуем анимации
      const animations: ElementAnimation[] = (element.animations || []).map((anim) => {
        const animationTypeMap: Record<string, AnimationType> = {
          fadeIn: AnimationType.FadeIn,
          fadeOut: AnimationType.FadeOut,
          slideIn: AnimationType.SlideIn,
          slideOut: AnimationType.SlideOut,
          scaleIn: AnimationType.ScaleIn,
          scaleOut: AnimationType.ScaleOut,
          bounce: AnimationType.Bounce,
          shake: AnimationType.Shake,
        }

        const easingMap: Record<string, AnimationEasing> = {
          linear: AnimationEasing.Linear,
          ease: AnimationEasing.Ease,
          "ease-in": AnimationEasing.EaseIn,
          "ease-out": AnimationEasing.EaseOut,
          "ease-in-out": AnimationEasing.EaseInOut,
        }

        const directionMap: Record<string, AnimationDirection> = {
          left: AnimationDirection.Left,
          right: AnimationDirection.Right,
          up: AnimationDirection.Up,
          down: AnimationDirection.Down,
        }

        return {
          id: anim.id,
          animation_type: animationTypeMap[anim.type] || AnimationType.FadeIn,
          duration: anim.duration,
          delay: anim.delay,
          easing: anim.easing ? easingMap[anim.easing] : undefined,
          direction: anim.direction ? directionMap[anim.direction] : undefined,
          properties: anim.properties || {},
        }
      })

      // Преобразуем свойства элемента
      const textAlignMap: Record<string, TextAlign> = {
        left: TextAlign.Left,
        center: TextAlign.Center,
        right: TextAlign.Right,
      }

      const fontWeightMap: Record<string, FontWeight> = {
        normal: FontWeight.Normal,
        bold: FontWeight.Bold,
        light: FontWeight.Light,
      }

      const objectFitMap: Record<string, ObjectFit> = {
        contain: ObjectFit.Contain,
        cover: ObjectFit.Cover,
        fill: ObjectFit.Fill,
      }

      return {
        id: element.id,
        element_type: elementTypeMap[element.type] || StyleElementType.Text,
        name: element.name.en || element.name.ru,
        position: {
          x: element.position.x,
          y: element.position.y,
        },
        size: {
          width: element.size.width,
          height: element.size.height,
        },
        timing: {
          start: element.timing.start,
          end: element.timing.end,
        },
        properties: {
          opacity: element.properties.opacity,
          rotation: element.properties.rotation,
          scale: element.properties.scale,
          text: element.properties.text,
          font_size: element.properties.fontSize,
          font_family: element.properties.fontFamily,
          color: element.properties.color,
          text_align: element.properties.textAlign ? textAlignMap[element.properties.textAlign] : undefined,
          font_weight: element.properties.fontWeight ? fontWeightMap[element.properties.fontWeight] : undefined,
          background_color: element.properties.backgroundColor,
          border_color: element.properties.borderColor,
          border_width: element.properties.borderWidth,
          border_radius: element.properties.borderRadius,
          src: element.properties.src,
          object_fit: element.properties.objectFit ? objectFitMap[element.properties.objectFit] : undefined,
        },
        animations,
      }
    })

    // Преобразуем категорию и стиль
    const categoryMap: Record<string, StyleTemplateCategory> = {
      intro: StyleTemplateCategory.Intro,
      outro: StyleTemplateCategory.Outro,
      "lower-third": StyleTemplateCategory.LowerThird,
      title: StyleTemplateCategory.Title,
      transition: StyleTemplateCategory.Transition,
      overlay: StyleTemplateCategory.Overlay,
    }

    const styleMap: Record<string, StyleTemplateStyle> = {
      modern: StyleTemplateStyle.Modern,
      vintage: StyleTemplateStyle.Vintage,
      minimal: StyleTemplateStyle.Minimal,
      corporate: StyleTemplateStyle.Corporate,
      creative: StyleTemplateStyle.Creative,
      cinematic: StyleTemplateStyle.Cinematic,
    }

    return {
      id: styleTemplate.id,
      name: styleTemplate.name.en || styleTemplate.name.ru,
      category: categoryMap[styleTemplate.category] || StyleTemplateCategory.Title,
      style: styleMap[styleTemplate.style] || StyleTemplateStyle.Modern,
      duration: styleTemplate.duration,
      elements,
    }
  })
}

/**
 * Определяет тип трека
 */
function getTrackType(type: string): TrackType {
  switch (type.toLowerCase()) {
    case "video":
      return "Video"
    case "audio":
      return "Audio"
    case "subtitle":
    case "text":
      return "Title" // Subtitle tracks map to Title in tauri-bindings
    default:
      return "Video"
  }
}

/**
 * Вычисляет общую продолжительность проекта
 */
function calculateProjectDuration(timeline: TimelineProject): number {
  let maxEndTime = 0

  // Проверяем клипы в треках секций
  timeline.sections?.forEach((section) => {
    section.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const clipEndTime = clip.startTime + clip.duration
        if (clipEndTime > maxEndTime) {
          maxEndTime = clipEndTime
        }
      })
    })
  })

  // Проверяем клипы в глобальных треках
  timeline.globalTracks?.forEach((track) => {
    track.clips.forEach((clip) => {
      const clipEndTime = clip.startTime + clip.duration
      if (clipEndTime > maxEndTime) {
        maxEndTime = clipEndTime
      }
    })
  })

  return maxEndTime
}

/**
 * Определяет соотношение сторон по разрешению
 */
function getAspectRatio(resolution?: [number, number]): AspectRatio {
  if (!resolution) return AspectRatio.Ratio16x9

  const [width, height] = resolution
  const ratio = width / height

  if (Math.abs(ratio - 16 / 9) < 0.01) return AspectRatio.Ratio16x9
  if (Math.abs(ratio - 4 / 3) < 0.01) return AspectRatio.Ratio4x3
  if (Math.abs(ratio - 1) < 0.01) return AspectRatio.Ratio1x1
  if (Math.abs(ratio - 9 / 16) < 0.01) return AspectRatio.Ratio9x16

  return AspectRatio.Custom
}

/**
 * Собирает все субтитры из проекта
 */
function collectAllSubtitles(timeline: TimelineProject): BackendSubtitle[] {
  const subtitles: BackendSubtitle[] = []

  // Функция для обработки субтитров в треке
  const processTrackSubtitles = (track: TimelineTrack) => {
    // Если это трек субтитров, обрабатываем его клипы как субтитры
    if (track.type === "subtitle" || track.type === "title") {
      track.clips.forEach((clip) => {
        const subtitleClip = isSubtitleClip(clip) ? clip : null

        // Создаем субтитр из клипа
        const subtitle: BackendSubtitle = {
          id: clip.id,
          text: extractTextFromClip(clip), // Извлекаем текст из клипа
          start_time: clip.startTime,
          end_time: clip.startTime + clip.duration,
          position: subtitleClip?.subtitlePosition
            ? convertSubtitlePosition(subtitleClip.subtitlePosition)
            : createDefaultSubtitlePosition(),
          style: subtitleClip?.subtitleStyleId
            ? convertSubtitleStyle(
                timeline.resources.subtitleStyles?.find((s) => s.id === subtitleClip.subtitleStyleId),
              )
            : createDefaultSubtitleStyle(subtitleClip?.formatting),
          enabled: true,
          animations: subtitleClip
            ? convertSubtitleAnimations(subtitleClip.animationIn, subtitleClip.animationOut)
            : [],
        }

        subtitles.push(subtitle)
      })
    }
  }

  // Обрабатываем субтитры в треках секций
  timeline.sections?.forEach((section) => {
    section.tracks.forEach(processTrackSubtitles)
  })

  // Обрабатываем субтитры в глобальных треках
  timeline.globalTracks?.forEach(processTrackSubtitles)

  return subtitles
}

/**
 * Извлекает текст из клипа
 */
function extractTextFromClip(clip: TimelineClip): string {
  // Проверяем, является ли клип субтитром
  if (isSubtitleClip(clip)) {
    return clip.text
  }

  // Для других типов клипов возвращаем имя или дефолтный текст
  return clip.name || "Text"
}

/**
 * Создает позицию субтитра по умолчанию
 */
function createDefaultSubtitlePosition(): BackendSubtitlePosition {
  return {
    x: 50.0, // По центру
    y: 85.0, // Внизу экрана
    align_x: SubtitleAlignX.Center,
    align_y: SubtitleAlignY.Bottom,
    margin: {
      top: 20.0,
      right: 20.0,
      bottom: 20.0,
      left: 20.0,
    },
  }
}

/**
 * Конвертирует позицию субтитра из frontend в backend формат
 */
function convertSubtitlePosition(position: SubtitleClip["subtitlePosition"]): BackendSubtitlePosition {
  if (!position) {
    return createDefaultSubtitlePosition()
  }

  // Маппинг выравнивания
  const alignmentMap = {
    "top-left": { x: 0, y: 0, alignX: SubtitleAlignX.Left, alignY: SubtitleAlignY.Top },
    "top-center": { x: 50, y: 0, alignX: SubtitleAlignX.Center, alignY: SubtitleAlignY.Top },
    "top-right": { x: 100, y: 0, alignX: SubtitleAlignX.Right, alignY: SubtitleAlignY.Top },
    "middle-left": { x: 0, y: 50, alignX: SubtitleAlignX.Left, alignY: SubtitleAlignY.Center },
    "middle-center": { x: 50, y: 50, alignX: SubtitleAlignX.Center, alignY: SubtitleAlignY.Center },
    "middle-right": { x: 100, y: 50, alignX: SubtitleAlignX.Right, alignY: SubtitleAlignY.Center },
    "bottom-left": { x: 0, y: 100, alignX: SubtitleAlignX.Left, alignY: SubtitleAlignY.Bottom },
    "bottom-center": { x: 50, y: 100, alignX: SubtitleAlignX.Center, alignY: SubtitleAlignY.Bottom },
    "bottom-right": { x: 100, y: 100, alignX: SubtitleAlignX.Right, alignY: SubtitleAlignY.Bottom },
  }

  const mapped = alignmentMap[position.alignment] || alignmentMap["bottom-center"]

  return {
    x: mapped.x,
    y: mapped.y,
    align_x: mapped.alignX,
    align_y: mapped.alignY,
    margin: {
      left: position.marginX ?? 0,
      right: position.marginX ?? 0,
      top: position.marginY ?? 0,
      bottom: position.marginY ?? 0,
    },
  }
}

/**
 * Конвертирует стиль субтитра
 */
function convertSubtitleStyle(style: any): BackendSubtitleStyle {
  if (!style) {
    return createDefaultSubtitleStyle()
  }

  // Конвертируем CSS стили в формат backend
  const cssStyle = style.style || {}

  return {
    font_family: cssStyle.fontFamily || "Arial",
    font_size: cssStyle.fontSize || 24.0,
    font_weight: convertFontWeight(cssStyle.fontWeight),
    color: cssStyle.color || "#FFFFFF",
    stroke_color: extractStrokeColorFromTextShadow(cssStyle.textShadow) || "#000000",
    stroke_width: extractStrokeWidthFromTextShadow(cssStyle.textShadow) ?? 2.0,
    shadow_color: extractShadowColorFromTextShadow(cssStyle.textShadow) || "#000000",
    shadow_x: extractShadowXFromTextShadow(cssStyle.textShadow) ?? 2.0,
    shadow_y: extractShadowYFromTextShadow(cssStyle.textShadow) ?? 2.0,
    shadow_blur: extractShadowBlurFromTextShadow(cssStyle.textShadow) ?? 4.0,
    background_color: cssStyle.backgroundColor || cssStyle.background,
    background_opacity: cssStyle.opacity || 0.8,
    padding: parsePadding(cssStyle.padding),
    border_radius: Number.parseFloat(String(cssStyle.borderRadius || 4)),
    line_height: cssStyle.lineHeight || 1.2,
    letter_spacing: cssStyle.letterSpacing || 0.0,
    max_width: 80.0, // По умолчанию 80% ширины экрана
  }
}

/**
 * Конвертирует font weight в enum
 */
function convertFontWeight(weight?: string | number): SubtitleFontWeight {
  if (!weight) return SubtitleFontWeight.Normal

  const weightValue = typeof weight === "string" ? weight.toLowerCase() : String(weight)

  switch (weightValue) {
    case "thin":
    case "100":
    case "light":
    case "300":
      return SubtitleFontWeight.Light
    case "normal":
    case "400":
    case "medium":
    case "500":
      return SubtitleFontWeight.Normal
    case "bold":
    case "700":
    case "black":
    case "900":
      return SubtitleFontWeight.Bold
    default:
      return SubtitleFontWeight.Normal
  }
}

/**
 * Парсит padding из CSS строки или числа
 */
function parsePadding(padding?: string | number): { top: number; right: number; bottom: number; left: number } {
  if (!padding) {
    return { top: 8.0, right: 12.0, bottom: 8.0, left: 12.0 }
  }

  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding }
  }

  const parts = padding.split(" ").map((p) => Number.parseFloat(p.replace("px", "")))

  switch (parts.length) {
    case 1:
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] }
    case 2:
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] }
    case 3:
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] }
    case 4:
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }
    default:
      return { top: 8.0, right: 12.0, bottom: 8.0, left: 12.0 }
  }
}

/**
 * Извлекает параметры тени из CSS text-shadow
 */
function extractStrokeColorFromTextShadow(textShadow?: string): string | undefined {
  if (!textShadow) return undefined

  // Для text-shadow типа "2px 2px 4px #000000"
  // Если есть несколько теней (для обводки), берем первую
  const shadows = textShadow.split(",").map((s) => s.trim())
  const firstShadow = shadows[0]

  // Ищем цвет (hex, rgb, rgba, или named color)
  const colorMatch = /(#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]+\)|[a-zA-Z]+)/.exec(firstShadow)
  return colorMatch ? colorMatch[1] : undefined
}

function extractStrokeWidthFromTextShadow(textShadow?: string): number | undefined {
  if (!textShadow) return undefined

  // Если есть несколько теней для эмуляции обводки, считаем их
  const shadows = textShadow.split(",").map((s) => s.trim())

  // Эвристика: если больше 4 теней, вероятно это обводка
  if (shadows.length > 4) {
    return 2.0 // Стандартная обводка
  }

  return undefined
}

function extractShadowColorFromTextShadow(textShadow?: string): string | undefined {
  if (!textShadow) return undefined

  // Берем последнюю тень (обычно это настоящая тень, а не обводка)
  const shadows = textShadow.split(",").map((s) => s.trim())
  const lastShadow = shadows[shadows.length - 1]

  const colorMatch = /(#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]+\)|[a-zA-Z]+)/.exec(lastShadow)
  return colorMatch ? colorMatch[1] : undefined
}

function extractShadowXFromTextShadow(textShadow?: string): number | undefined {
  if (!textShadow) return undefined

  const shadows = textShadow.split(",").map((s) => s.trim())
  const lastShadow = shadows[shadows.length - 1]

  const parts = lastShadow.split(" ")
  return parts[0] ? Number.parseFloat(parts[0].replace("px", "")) : undefined
}

function extractShadowYFromTextShadow(textShadow?: string): number | undefined {
  if (!textShadow) return undefined

  const shadows = textShadow.split(",").map((s) => s.trim())
  const lastShadow = shadows[shadows.length - 1]

  const parts = lastShadow.split(" ")
  return parts[1] ? Number.parseFloat(parts[1].replace("px", "")) : undefined
}

function extractShadowBlurFromTextShadow(textShadow?: string): number | undefined {
  if (!textShadow) return undefined

  const shadows = textShadow.split(",").map((s) => s.trim())
  const lastShadow = shadows[shadows.length - 1]

  const parts = lastShadow.split(" ")
  return parts[2] ? Number.parseFloat(parts[2].replace("px", "")) : undefined
}

/**
 * Конвертирует анимации субтитра
 */
function convertSubtitleAnimations(
  animationIn?: SubtitleClip["animationIn"],
  animationOut?: SubtitleClip["animationOut"],
): BackendSubtitleAnimation[] {
  const animations: BackendSubtitleAnimation[] = []
  let animationId = 0

  if (animationIn) {
    animations.push({
      id: `anim_in_${animationId++}`,
      animation_type: convertSubtitleAnimationType(animationIn.type, "in"),
      duration: animationIn.duration,
      easing: convertSubtitleAnimationEasing(animationIn.easing),
      delay: 0,
      direction: SubtitleDirection.Right, // Default direction for slide animations
    })
  }

  if (animationOut) {
    animations.push({
      id: `anim_out_${animationId++}`,
      animation_type: convertSubtitleAnimationType(animationOut.type, "out"),
      duration: animationOut.duration,
      easing: convertSubtitleAnimationEasing(animationOut.easing),
      delay: 0,
      direction: SubtitleDirection.Left,
    })
  }

  return animations
}

/**
 * Конвертирует тип анимации субтитра
 */
function convertSubtitleAnimationType(type: string, direction: "in" | "out"): SubtitleAnimationType {
  const typeMap: Record<string, SubtitleAnimationType> = {
    fade: direction === "in" ? SubtitleAnimationType.FadeIn : SubtitleAnimationType.FadeOut,
    slide: direction === "in" ? SubtitleAnimationType.SlideIn : SubtitleAnimationType.SlideOut,
    typewriter: SubtitleAnimationType.TypeWriter,
    scale: SubtitleAnimationType.FadeIn, // Using fade as fallback for scale
    wave: SubtitleAnimationType.TypeWriter, // Using typewriter as fallback for wave
  }

  return typeMap[type] || SubtitleAnimationType.FadeIn
}

/**
 * Конвертирует easing анимации субтитра
 */
function convertSubtitleAnimationEasing(easing?: string): SubtitleEasing {
  const easingMap: Record<string, SubtitleEasing> = {
    linear: SubtitleEasing.Linear,
    ease: SubtitleEasing.Ease,
    "ease-in": SubtitleEasing.EaseIn,
    "ease-out": SubtitleEasing.EaseOut,
    "ease-in-out": SubtitleEasing.EaseInOut,
  }

  return easingMap[easing || "ease"] || SubtitleEasing.Ease
}

/**
 * Создает стиль субтитра по умолчанию
 */
function createDefaultSubtitleStyle(formatting?: SubtitleClip["formatting"]): BackendSubtitleStyle {
  return {
    font_family: "Arial",
    font_size: formatting?.fontSize || 24.0,
    font_weight: formatting?.fontWeight ? convertFontWeight(formatting.fontWeight) : SubtitleFontWeight.Normal,
    color: formatting?.color || "#FFFFFF",
    stroke_color: "#000000",
    stroke_width: 2.0,
    shadow_color: "#000000",
    shadow_x: 2.0,
    shadow_y: 2.0,
    shadow_blur: 4.0,
    background_color: undefined,
    background_opacity: 0.8,
    padding: {
      top: 8.0,
      right: 12.0,
      bottom: 8.0,
      left: 12.0,
    },
    border_radius: 4.0,
    line_height: 1.2,
    letter_spacing: 0.0,
    max_width: 80.0,
  }
}
