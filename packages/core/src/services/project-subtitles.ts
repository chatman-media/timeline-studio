import type { Subtitle, SubtitlePosition, SubtitleStyle } from "@/types/contracts/project-schema"

export type SubtitleSegmentTimeUnit = "seconds" | "milliseconds"
export type ProjectSubtitle = Subtitle

export interface ProjectSubtitleSegmentInput {
  id?: string | number
  text: string
  start_time?: number
  startTime?: number
  end_time?: number
  endTime?: number
  speaker?: string
  confidence?: number
  language?: string
  style?: Partial<SubtitleStyle> | string | null
}

export interface ProjectSubtitleCreateOptions {
  timeUnit?: SubtitleSegmentTimeUnit
  defaultFontFamily?: string
  defaultFontSize?: number
  defaultColor?: string
}

const DEFAULT_FONT_FAMILY = "Arial"
const DEFAULT_FONT_SIZE = 42
const DEFAULT_COLOR = "#FFFFFF"

export function createDefaultProjectSubtitleStyle(options: ProjectSubtitleCreateOptions = {}): SubtitleStyle {
  return {
    font_family: options.defaultFontFamily ?? DEFAULT_FONT_FAMILY,
    font_size: options.defaultFontSize ?? DEFAULT_FONT_SIZE,
    font_weight: "Normal",
    color: options.defaultColor ?? DEFAULT_COLOR,
    stroke_color: "#000000",
    stroke_width: 2,
    shadow_color: "#000000",
    shadow_x: 2,
    shadow_y: 2,
    shadow_blur: 4,
    background_color: null,
    background_opacity: 0,
    padding: {
      top: 8,
      right: 12,
      bottom: 8,
      left: 12,
    },
    border_radius: 4,
    line_height: 1.2,
    letter_spacing: 0,
    max_width: 82,
  }
}

export function createDefaultProjectSubtitlePosition(): SubtitlePosition {
  return {
    type: "Relative",
    align_x: "Center",
    align_y: "Bottom",
  }
}

export function createProjectSubtitleFromSegment(
  segment: ProjectSubtitleSegmentInput,
  index: number,
  options: ProjectSubtitleCreateOptions = {},
): Subtitle {
  const startTime = readTime(segment.start_time, segment.startTime, "start_time")
  const endTime = readTime(segment.end_time, segment.endTime, "end_time")
  const startSeconds = convertTime(startTime, options.timeUnit ?? "seconds")
  const endSeconds = convertTime(endTime, options.timeUnit ?? "seconds")
  const text = segment.text.trim()

  if (!text) {
    throw new Error(`Subtitle segment ${index + 1} text cannot be empty`)
  }
  if (endSeconds <= startSeconds) {
    throw new Error(`Subtitle segment ${index + 1} end_time must be greater than start_time`)
  }

  const style = mergeSubtitleStyle(segment.style, options)

  return {
    id: String(segment.id ?? `subtitle-${index + 1}`),
    text,
    start_time: startSeconds,
    end_time: endSeconds,
    position: createDefaultProjectSubtitlePosition(),
    style,
    enabled: true,
    animations: [],
    font_family: style.font_family,
    font_size: style.font_size,
    color: style.color,
    opacity: 1,
    font_weight: style.font_weight,
    shadow: Boolean(style.shadow_color),
    outline: style.stroke_width > 0,
    duration: endSeconds - startSeconds,
  }
}

export function createProjectSubtitlesFromSegments(
  segments: ProjectSubtitleSegmentInput[],
  options: ProjectSubtitleCreateOptions = {},
): Subtitle[] {
  return segments.map((segment, index) => createProjectSubtitleFromSegment(segment, index, options))
}

function mergeSubtitleStyle(
  style: ProjectSubtitleSegmentInput["style"],
  options: ProjectSubtitleCreateOptions,
): SubtitleStyle {
  const defaultStyle = createDefaultProjectSubtitleStyle(options)

  if (!style || typeof style === "string") {
    return defaultStyle
  }

  return {
    ...defaultStyle,
    ...style,
    padding: {
      ...defaultStyle.padding,
      ...style.padding,
    },
  }
}

function readTime(snakeCaseValue: number | undefined, camelCaseValue: number | undefined, field: string): number {
  const value = snakeCaseValue ?? camelCaseValue

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Subtitle segment ${field} must be a finite number`)
  }

  return value
}

function convertTime(value: number, unit: SubtitleSegmentTimeUnit): number {
  return unit === "milliseconds" ? value / 1000 : value
}
