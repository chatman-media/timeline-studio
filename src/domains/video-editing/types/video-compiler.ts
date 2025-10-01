/**
 * TypeScript типы для интеграции с Video Compiler (Rust backend)
 * Перенесено из src/shared/types/video-compiler.ts
 */

import type { BaseEffect } from "@/features/effects/types/unified-effects"
import {
  OutputFormat,
  type VideoRenderJob as RenderJob,
  type RenderProgress,
  RenderStatus,
} from "@/features/video-compiler/types/render"

// Импортируем новые типы эффектов

// Реэкспорт для обратной совместимости
export {
  OutputFormat,
  type RenderProgress,
  RenderStatus,
  type VideoRenderJob as RenderJob,
} from "@/features/video-compiler/types/render"

// ============ Основные типы проекта ============

export interface ProjectSchema {
  version: string
  metadata: ProjectMetadata
  timeline: CompilerTimeline
  tracks: CompilerTrack[]
  effects: BaseEffect[] // Используем новый тип
  transitions: Transition[]
  filters: CompilerFilter[]
  templates: CompilerTemplate[]
  style_templates: StyleTemplate[]
  subtitles: Subtitle[]
  settings: ExportProjectSettings
}

export interface ProjectMetadata {
  name: string
  description?: string
  created_at: string // ISO 8601
  modified_at: string // ISO 8601
  author?: string
}

export interface CompilerTimeline {
  duration: number // Общая продолжительность в секундах
  fps: number // Кадры в секунду (например, 30)
  resolution: [number, number] // [ширина, высота]
  sample_rate: number // Частота дискретизации аудио (например, 48000)
  aspect_ratio: AspectRatio
}

export enum AspectRatio {
  Ratio16x9 = "Ratio16x9",
  Ratio4x3 = "Ratio4x3",
  Ratio1x1 = "Ratio1x1",
  Ratio9x16 = "Ratio9x16",
  Custom = "Custom",
}

// ============ Треки и клипы ============

export interface CompilerTrack {
  id: string
  track_type: CompilerTrackType
  name: string
  enabled: boolean
  locked: boolean
  volume: number // 0.0 - 1.0
  clips: Clip[]
  effects: string[] // ID эффектов
  filters: string[] // ID фильтров
}

export enum CompilerTrackType {
  Video = "Video",
  Audio = "Audio",
  Subtitle = "Subtitle",
}

export interface Clip {
  id: string
  source_path: string // Путь к медиа файлу
  start_time: number // Время начала на timeline
  end_time: number // Время окончания на timeline
  source_start: number // Начало в исходном файле
  source_end: number // Конец в исходном файле
  speed: number // Скорость воспроизведения (1.0 = нормальная)
  volume: number // Громкость клипа (0.0 - 1.0)
  effects: string[] // ID эффектов клипа
  filters: string[] // ID фильтров клипа
  template_id?: string // ID шаблона для многокамерной раскладки
  template_cell?: number // Индекс ячейки в шаблоне (0-based)
  style_template_id?: string // ID стильного шаблона (интро, аутро, титры)
}

// ============ Переходы ============

export interface Transition {
  id: string
  transition_type: string // Гибкий строковый тип
  name: string
  labels?: Record<string, string> // Локализованные названия
  description?: Record<string, string> // Локализованные описания
  category?: TransitionCategory
  complexity?: TransitionComplexity
  tags: TransitionTag[]
  duration: TransitionDuration
  start_time: number // Время начала перехода на timeline
  from_clip_id: string // ID клипа "от"
  to_clip_id: string // ID клипа "к"
  parameters: Record<string, CompilerEffectParameter>
  ffmpeg_command?: string // FFmpeg команда (в виде шаблона)
  preview_path?: string // Путь к превью
}

export interface TransitionDuration {
  min: number // Минимальная длительность в секундах
  max: number // Максимальная длительность в секундах
  default: number // Длительность по умолчанию
  current: number // Текущая длительность
}

export enum TransitionCategory {
  Basic = "Basic",
  Advanced = "Advanced",
  Creative = "Creative",
  ThreeD = "ThreeD",
  Artistic = "Artistic",
  Cinematic = "Cinematic",
}

export enum TransitionComplexity {
  Basic = "Basic",
  Intermediate = "Intermediate",
  Advanced = "Advanced",
}

export type TransitionTag =
  | "Zoom"
  | "Scale"
  | "Smooth"
  | "Fade"
  | "Opacity"
  | "Classic"
  | "Slide"
  | "Movement"
  | "Direction"
  | "Size"
  | "Transform"
  | "Rotate"
  | "Spin"
  | "Flip"
  | "Mirror"
  | "Push"
  | "Displacement"
  | "Squeeze"
  | "Compress"
  | "Elastic"
  | "Diagonal"
  | "Angle"
  | "Spiral"
  | "Rotation"
  | "ThreeD"
  | "Complex"
  | "Fallback"

// ============ Параметры эффектов для Rust ============

export type CompilerEffectParameter =
  | { type: "Float"; value: number }
  | { type: "Int"; value: number }
  | { type: "String"; value: string }
  | { type: "Bool"; value: boolean }
  | { type: "Color"; value: number } // RGBA как u32
  | { type: "FloatArray"; value: number[] }
  | { type: "FilePath"; value: string }

// ============ Фильтры ============

export interface CompilerFilter {
  id: string
  filter_type: CompilerFilterType
  name: string
  enabled: boolean
  parameters: Record<string, number>
  ffmpeg_command?: string
}

export enum CompilerFilterType {
  Brightness = "Brightness",
  Contrast = "Contrast",
  Saturation = "Saturation",
  Gamma = "Gamma",
  Temperature = "Temperature",
  Tint = "Tint",
  Hue = "Hue",
  Vibrance = "Vibrance",
  Shadows = "Shadows",
  Highlights = "Highlights",
  Blacks = "Blacks",
  Whites = "Whites",
  Clarity = "Clarity",
  Dehaze = "Dehaze",
  Vignette = "Vignette",
  Grain = "Grain",
  Blur = "Blur",
  Sharpen = "Sharpen",
  Custom = "Custom",
}

// ============ Шаблоны многокамерных раскладок ============

export interface CompilerTemplate {
  id: string
  template_type: CompilerTemplateType
  name: string
  screens: number // Количество видео в шаблоне
  cells: CompilerTemplateCell[]
}

export enum CompilerTemplateType {
  Vertical = "Vertical",
  Horizontal = "Horizontal",
  Diagonal = "Diagonal",
  Grid = "Grid",
  Custom = "Custom",
}

export interface CompilerTemplateCell {
  index: number // Индекс ячейки (0-based)
  x: number // Позиция X в процентах (0-100)
  y: number // Позиция Y в процентах (0-100)
  width: number // Ширина в процентах (0-100)
  height: number // Высота в процентах (0-100)
  fit_mode: FitMode // Режим масштабирования видео
  align_x: AlignX // Горизонтальное выравнивание
  align_y: AlignY // Вертикальное выравнивание
  scale?: number // Дополнительное масштабирование (1.0 = 100%)
}

export enum FitMode {
  Contain = "Contain", // Вписать полностью с черными полосами
  Cover = "Cover", // Заполнить с обрезкой
  Fill = "Fill", // Растянуть на всю ячейку
}

export enum AlignX {
  Left = "Left",
  Center = "Center",
  Right = "Right",
}

export enum AlignY {
  Top = "Top",
  Center = "Center",
  Bottom = "Bottom",
}

// ============ Стилестические шаблоны (интро, аутро, титры) ============

export interface StyleTemplate {
  id: string
  name: string
  category: StyleTemplateCategory
  style: StyleTemplateStyle
  duration: number // Длительность в секундах
  elements: StyleTemplateElement[]
}

export enum StyleTemplateCategory {
  Intro = "Intro",
  Outro = "Outro",
  LowerThird = "LowerThird",
  Title = "Title",
  Transition = "Transition",
  Overlay = "Overlay",
}

export enum StyleTemplateStyle {
  Modern = "Modern",
  Vintage = "Vintage",
  Minimal = "Minimal",
  Corporate = "Corporate",
  Creative = "Creative",
  Cinematic = "Cinematic",
}

export interface StyleTemplateElement {
  id: string
  element_type: StyleElementType
  name: string
  position: Position2D
  size: Size2D
  timing: ElementTiming
  properties: StyleElementProperties
  animations: ElementAnimation[]
}

export enum StyleElementType {
  Text = "Text",
  Shape = "Shape",
  Image = "Image",
  Video = "Video",
  Animation = "Animation",
  Particle = "Particle",
}

export interface Position2D {
  x: number // Позиция X в процентах (0-100)
  y: number // Позиция Y в процентах (0-100)
}

export interface Size2D {
  width: number // Ширина в процентах (0-100)
  height: number // Высота в процентах (0-100)
}

export interface ElementTiming {
  start: number // Время начала в секундах
  end: number // Время окончания в секундах
}

export interface StyleElementProperties {
  // Общие свойства
  opacity?: number
  rotation?: number
  scale?: number

  // Текстовые свойства
  text?: string
  font_size?: number
  font_family?: string
  color?: string
  text_align?: TextAlign
  font_weight?: FontWeight

  // Свойства фигур
  background_color?: string
  border_color?: string
  border_width?: number
  border_radius?: number

  // Свойства изображений/видео
  src?: string
  object_fit?: ObjectFit
}

export enum TextAlign {
  Left = "Left",
  Center = "Center",
  Right = "Right",
}

export enum FontWeight {
  Normal = "Normal",
  Bold = "Bold",
  Light = "Light",
}

export enum ObjectFit {
  Contain = "Contain",
  Cover = "Cover",
  Fill = "Fill",
}

export interface ElementAnimation {
  id: string
  animation_type: AnimationType
  duration: number // Длительность анимации в секундах
  delay?: number // Задержка перед началом
  easing?: AnimationEasing
  direction?: AnimationDirection
  properties?: Record<string, any>
}

export enum AnimationType {
  FadeIn = "FadeIn",
  FadeOut = "FadeOut",
  SlideIn = "SlideIn",
  SlideOut = "SlideOut",
  ScaleIn = "ScaleIn",
  ScaleOut = "ScaleOut",
  Bounce = "Bounce",
  Shake = "Shake",
}

export enum AnimationEasing {
  Linear = "Linear",
  Ease = "Ease",
  EaseIn = "EaseIn",
  EaseOut = "EaseOut",
  EaseInOut = "EaseInOut",
}

export enum AnimationDirection {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

// ============ Субтитры ============

export interface Subtitle {
  id: string
  text: string
  start_time: number // Время начала в секундах
  end_time: number // Время окончания в секундах
  position: SubtitlePosition
  style: SubtitleStyle
  enabled: boolean
  animations?: SubtitleAnimation[]
}

export interface SubtitlePosition {
  x: number // Позиция X в процентах (0-100)
  y: number // Позиция Y в процентах (0-100)
  align_x: SubtitleAlignX
  align_y: SubtitleAlignY
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export enum SubtitleAlignX {
  Left = "Left",
  Center = "Center",
  Right = "Right",
}

export enum SubtitleAlignY {
  Top = "Top",
  Center = "Center",
  Bottom = "Bottom",
}

export interface SubtitleStyle {
  font_family: string
  font_size: number
  font_weight: SubtitleFontWeight
  color: string
  stroke_color?: string
  stroke_width?: number
  shadow_color?: string
  shadow_x?: number
  shadow_y?: number
  shadow_blur?: number
  background_color?: string
  background_opacity?: number
  padding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  border_radius?: number
  line_height?: number
  letter_spacing?: number
  max_width?: number // Максимальная ширина в процентах
}

export enum SubtitleFontWeight {
  Normal = "Normal",
  Bold = "Bold",
  Light = "Light",
}

export interface SubtitleAnimation {
  id: string
  animation_type: SubtitleAnimationType
  duration: number
  delay?: number
  easing?: SubtitleEasing
  direction?: SubtitleDirection
  properties?: Record<string, any>
}

export enum SubtitleAnimationType {
  FadeIn = "FadeIn",
  FadeOut = "FadeOut",
  SlideIn = "SlideIn",
  SlideOut = "SlideOut",
  TypeWriter = "TypeWriter",
  Bounce = "Bounce",
}

export enum SubtitleEasing {
  Linear = "Linear",
  Ease = "Ease",
  EaseIn = "EaseIn",
  EaseOut = "EaseOut",
  EaseInOut = "EaseInOut",
}

export enum SubtitleDirection {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

// ============ Настройки проекта ============

export interface ExportProjectSettings {
  export: ExportSettings
  preview: PreviewSettings
  custom: Record<string, any>
}

export interface ExportSettings {
  format: OutputFormat
  quality: number // 1-100
  video_bitrate: number // kbps
  audio_bitrate: number // kbps
  hardware_acceleration: boolean
  preferred_gpu_encoder?: string // "nvenc" | "quicksync" | "vaapi" | "videotoolbox" | "amf"
  ffmpeg_args: string[] // Дополнительные параметры FFmpeg
}

// OutputFormat перенесен в /src/features/video-compiler/types/render.ts
// Используйте OutputFormat оттуда

export interface PreviewSettings {
  resolution: [number, number]
  fps: number
  quality: number
}

// ============ Прогресс рендеринга ============

// Типы для рендеринга перенесены в /src/features/video-compiler/types/render.ts
// Используйте VideoRenderJob, RenderProgress, RenderStatus оттуда

// ============ GPU ускорение ============

export enum GpuEncoder {
  None = "None",
  Nvenc = "Nvenc",
  QuickSync = "QuickSync",
  Vaapi = "Vaapi",
  VideoToolbox = "VideoToolbox",
  AMF = "AMF",
}

export interface GpuInfo {
  name: string
  driver_version?: string
  memory_total?: number
  memory_used?: number
  utilization?: number
  encoder_type: GpuEncoder
  supported_codecs: string[]
}

export interface GpuCapabilities {
  available_encoders: GpuEncoder[]
  recommended_encoder?: GpuEncoder
  current_gpu?: GpuInfo
  hardware_acceleration_supported: boolean
}

export interface CompilerSettings {
  hardware_acceleration: boolean
  max_concurrent_jobs: number
  temp_directory: string
  cache_size_mb: number
}

export interface SystemInfo {
  os: {
    type: string
    version: string
    architecture: string
  }
  cpu: {
    cores: number
    arch: string
  }
  memory: {
    total_bytes: number
    total_mb: number
    total_gb: number
  }
  runtime: {
    rust_version: string
    tauri_version: string
  }
}

export interface FfmpegCapabilities {
  version: string
  available_codecs: string[]
  hardware_encoders: string[]
  path: string
}

// ============ Tauri команды ============

export interface TauriCommands {
  // Компиляция видео
  compile_video(project: ProjectSchema, output_path: string): Promise<string> // Возвращает job_id

  // Управление рендерингом
  get_render_progress(job_id: string): Promise<RenderProgress | null>
  cancel_render(job_id: string): Promise<boolean>
  get_active_jobs(): Promise<RenderJob[]>

  // Генерация превью
  generate_preview(project: ProjectSchema, timestamp: number, quality?: number): Promise<Uint8Array> // JPEG данные

  // GPU команды
  get_gpu_capabilities_full(): Promise<GpuCapabilities>
  get_current_gpu_info(): Promise<GpuInfo | null>
  check_hardware_acceleration(): Promise<boolean>

  // Кэширование
  get_cache_stats(): Promise<CacheStats>
  clear_cache(): Promise<void>
  clear_preview_cache(): Promise<void>

  // Настройки
  get_compiler_settings(): Promise<CompilerSettings>
  update_compiler_settings(settings: CompilerSettings): Promise<void>
  set_ffmpeg_path(path: string): Promise<boolean>

  // Диагностика
  get_system_info(): Promise<SystemInfo>
  check_ffmpeg_capabilities(): Promise<FfmpegCapabilities>
}

// ============ Кэширование ============

export interface CacheStats {
  total_size_bytes: number
  total_files: number
  preview_cache_size: number
  preview_cache_files: number
  temp_files_size: number
  temp_files_count: number
  last_cleanup: string
  cache_hit_rate: number
}

// ============ Вспомогательные функции преобразования ============

/**
 * Преобразование kebab-case в PascalCase для Rust enum
 */
export function toRustEnumCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
}

/**
 * Преобразование параметра в формат Backend
 */
export function toBackendParameter(value: any): CompilerEffectParameter {
  if (typeof value === "number") {
    return Number.isInteger(value) ? { type: "Int", value } : { type: "Float", value }
  }
  if (typeof value === "string") {
    return { type: "String", value }
  }
  if (typeof value === "boolean") {
    return { type: "Bool", value }
  }
  if (Array.isArray(value)) {
    return { type: "FloatArray", value }
  }
  // По умолчанию
  return { type: "String", value: String(value) }
}

/**
 * Создание пустого проекта
 */
export function createEmptyProject(name = "Untitled Project"): ProjectSchema {
  const now = new Date().toISOString()

  return {
    version: "1.0.0",
    metadata: {
      name,
      created_at: now,
      modified_at: now,
    },
    timeline: {
      duration: 0,
      fps: 30,
      resolution: [1920, 1080],
      sample_rate: 48000,
      aspect_ratio: AspectRatio.Ratio16x9,
    },
    tracks: [],
    effects: [], // Теперь это BaseEffect[]
    transitions: [],
    filters: [],
    templates: [],
    style_templates: [],
    subtitles: [],
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
 * Пример вызова Tauri команды
 */
export async function renderProject(project: ProjectSchema, outputPath: string): Promise<string> {
  const { invoke } = await import("@tauri-apps/api/core")

  try {
    const jobId = await invoke<string>("compile_video", {
      projectSchema: project,
      outputPath,
    })

    return jobId
  } catch (error) {
    console.error("Failed to start video compilation:", error)
    throw error
  }
}

/**
 * Отслеживание прогресса рендеринга
 */
export async function trackRenderProgress(
  jobId: string,
  onProgress: (progress: RenderProgress) => void,
): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core")

  const checkProgress = async () => {
    try {
      const progress = await invoke<RenderProgress | null>("get_render_progress", { jobId })

      if (progress) {
        onProgress(progress)

        // Если рендеринг еще идет, проверяем снова через 500ms
        if (progress.status === RenderStatus.Processing) {
          setTimeout(checkProgress, 500)
        }
      }
    } catch (error) {
      console.error("Failed to get render progress:", error)
    }
  }

  // Начинаем отслеживание
  void checkProgress()
}
