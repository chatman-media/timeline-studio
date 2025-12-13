/**
 * @vitest-environment jsdom
 *
 * Тесты для преобразования Timeline в ProjectSchema
 */

import { describe, expect, it } from "vitest"
import { MediaType } from "@/domains/media-management"
import {
  AlignX,
  AlignY,
  AnimationDirection,
  AnimationEasing,
  AnimationType,
  AspectRatio,
  CompilerTemplateType,
  FitMode,
  FontWeight,
  OutputFormat,
  StyleElementType,
  StyleTemplateCategory,
  StyleTemplateStyle,
  SubtitleAlignX,
  SubtitleAlignY,
  SubtitleAnimationType,
  SubtitleDirection,
  SubtitleEasing,
  SubtitleFontWeight,
  TextAlign,
} from "@/domains/video-editing/types"

import type { TimelineClip, TimelineProject, TimelineTrack } from "@/features/timeline/types"
import { timelineToProjectSchema } from "../../utils/timeline-to-project"

describe("timelineToProjectSchema", () => {
  const createMockProject = (overrides = {}): TimelineProject => ({
    id: "project-1",
    name: "Test Project",
    description: "Test Description",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    sections: [],
    globalTracks: [],
    settings: {
      fps: 30,
      resolution: { width: 1920, height: 1080 },
      sampleRate: 48000,
      aspectRatio: "",
      channels: 0,
      bitDepth: 0,
      timeFormat: "timecode",
      snapToGrid: false,
      gridSize: 0,
      autoSave: false,
      autoSaveInterval: 0,
    },
    resources: {
      effects: [],
      filters: [],
      transitions: [],
      templates: [],
      styleTemplates: [],
      subtitleStyles: [],
      timelineTransitions: [],
      music: [],
      media: [],
    },
    duration: 0,
    fps: 0,
    sampleRate: 0,
    version: "",
    ...overrides,
  })

  const createMockTrack = (overrides = {}): TimelineTrack => ({
    id: "track-1",
    type: "video",
    name: "Video Track 1",
    order: 0,
    clips: [],
    isMuted: false,
    isLocked: false,
    volume: 1.0,
    transitions: [],
    isHidden: false,
    isSolo: false,
    pan: 0,
    height: 0,
    trackEffects: [],
    trackFilters: [],
    ...overrides,
  })

  const createMockClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
    id: "clip-1",
    name: "Test Clip",
    startTime: 0,
    duration: 10,
    mediaFile: {
      id: "",
      name: "test.mp4",
      path: "/path/to/test.mp4",
      type: MediaType.Video,
      duration: 10,
    },
    volume: 1.0,
    speed: 1.0,
    mediaId: "",
    trackId: "",
    mediaStartTime: 0,
    mediaEndTime: 0,
    offset: 0,
    isReversed: false,
    opacity: 0,
    isSelected: false,
    ...overrides,
    effects: overrides.effects || [],
    filters: overrides.filters || [],
    transitions: overrides.transitions || [],
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  it("преобразует базовый проект без треков", () => {
    const project = createMockProject()
    const result = timelineToProjectSchema(project)

    expect(result.version).toBe("1.0.0")
    expect(result.metadata.name).toBe("Test Project")
    expect(result.metadata.description).toBe("Test Description")
    expect(result.metadata.created_at).toBe("2024-01-01T00:00:00.000Z")
    expect(result.timeline.fps).toBe(30)
    expect(result.timeline.resolution).toEqual([1920, 1080])
    expect(result.timeline.sample_rate).toBe(48000)
    expect(result.timeline.aspect_ratio).toBe(AspectRatio.Ratio16x9)
    expect(result.tracks).toEqual([])
  })

  it("определяет различные соотношения сторон", () => {
    const testCases = [
      { resolution: { width: 1920, height: 1080 }, expected: AspectRatio.Ratio16x9 },
      { resolution: { width: 1280, height: 960 }, expected: AspectRatio.Ratio4x3 },
      { resolution: { width: 1080, height: 1080 }, expected: AspectRatio.Ratio1x1 },
      { resolution: { width: 1080, height: 1920 }, expected: AspectRatio.Ratio9x16 },
      { resolution: { width: 2048, height: 1080 }, expected: AspectRatio.Custom },
    ]

    testCases.forEach(({ resolution, expected }) => {
      const project = createMockProject({ settings: { resolution } })
      const result = timelineToProjectSchema(project)
      expect(result.timeline.aspect_ratio).toBe(expected)
    })
  })

  it("вычисляет общую продолжительность проекта", () => {
    const track = createMockTrack({
      clips: [
        createMockClip({ startTime: 0, duration: 10 }),
        createMockClip({ startTime: 15, duration: 20 }),
        createMockClip({ startTime: 40, duration: 5 }),
      ],
    })

    const project = createMockProject({
      sections: [
        {
          id: "section-1",
          name: "Section 1",
          startTime: 0,
          duration: 50,
          endTime: 50,
          tracks: [track],
        },
      ],
    })

    const result = timelineToProjectSchema(project)
    expect(result.timeline.duration).toBe(45) // 40 + 5
  })

  it("преобразует треки из секций и глобальные треки", () => {
    const sectionTrack = createMockTrack({ id: "section-track", name: "Section Track" })
    const globalTrack = createMockTrack({ id: "global-track", name: "Global Track" })

    const project = createMockProject({
      sections: [
        {
          id: "section-1",
          name: "Section 1",
          startTime: 0,
          duration: 30,
          endTime: 30,
          tracks: [sectionTrack],
        },
      ],
      globalTracks: [globalTrack],
    })

    const result = timelineToProjectSchema(project)
    expect(result.tracks).toHaveLength(2)
    expect(result.tracks[0].id).toBe("section-track")
    expect(result.tracks[1].id).toBe("global-track")
  })

  it("преобразует различные типы треков", () => {
    const testCases = [
      { type: "video", expected: "Video" },
      { type: "audio", expected: "Audio" },
      { type: "subtitle", expected: "Subtitle" },
      { type: "text", expected: "Subtitle" },
      { type: "unknown", expected: "Video" },
    ]

    testCases.forEach(({ type, expected }) => {
      const track = createMockTrack({ type })
      const project = createMockProject({ globalTracks: [track] })
      const result = timelineToProjectSchema(project)
      expect(result.tracks[0].track_type).toBe(expected)
    })
  })

  it("преобразует настройки трека", () => {
    const track = createMockTrack({
      isMuted: true,
      isLocked: true,
      volume: 0.5,
      // ОБНОВЛЕНО: добавлены id для AppliedEffect (теперь используем e.id вместо e.effectId)
      trackEffects: [
        { id: "applied-effect-1", effectId: "effect-1", enabled: true, order: 0 },
        { id: "applied-effect-2", effectId: "effect-2", enabled: true, order: 1 },
      ],
    })

    const project = createMockProject({ globalTracks: [track] })
    const result = timelineToProjectSchema(project)
    const convertedTrack = result.tracks[0]

    expect(convertedTrack.enabled).toBe(false) // !isMuted
    expect(convertedTrack.locked).toBe(true)
    expect(convertedTrack.volume).toBe(0.5)
    // Теперь используем ID применения (applied.id), а не ID базового эффекта
    expect(convertedTrack.effects).toEqual(["applied-effect-1", "applied-effect-2"])
  })

  it("преобразует клипы", () => {
    const clip = createMockClip({
      mediaStartTime: 5,
      mediaEndTime: 15,
      speed: 2.0,
      volume: 0.8,
      effects: [
        {
          id: "effect-1",
          effectId: "effect-1",
          enabled: true,
          order: 0,
          startTime: 0,
          parameters: {},
          keyframes: {},
          masks: [],
          blendMode: "normal",
          opacity: 100,
          effectVersion: "1.0.0",
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ],
      filters: [{ id: "filter-1", filterId: "filter-1", isEnabled: true, order: 0 }],
      templateId: "template-1",
      templateCell: 2,
    })

    const track = createMockTrack({ clips: [clip] })
    const project = createMockProject({ globalTracks: [track] })
    const result = timelineToProjectSchema(project)
    const convertedClip = result.tracks[0].clips[0]

    expect(convertedClip.source_path).toBe("/path/to/test.mp4")
    expect(convertedClip.start_time).toBe(0)
    expect(convertedClip.end_time).toBe(10)
    expect(convertedClip.source_start).toBe(5)
    expect(convertedClip.source_end).toBe(15)
    expect(convertedClip.speed).toBe(2.0)
    expect(convertedClip.volume).toBe(0.8)
    expect(convertedClip.effects).toEqual(["effect-1"])
    expect(convertedClip.filters).toEqual(["filter-1"])
    expect(convertedClip.template_id).toBe("template-1")
    expect(convertedClip.template_cell).toBe(2)
  })

  it("использует значения по умолчанию для клипов", () => {
    const clip = createMockClip({
      mediaFile: undefined,
      mediaStartTime: undefined,
      mediaEndTime: undefined,
      speed: undefined,
      volume: undefined,
    })

    const track = createMockTrack({ clips: [clip] })
    const project = createMockProject({ globalTracks: [track] })
    const result = timelineToProjectSchema(project)
    const convertedClip = result.tracks[0].clips[0]

    expect(convertedClip.source_path).toBe("")
    expect(convertedClip.source_start).toBe(0)
    expect(convertedClip.source_end).toBe(10) // duration
    expect(convertedClip.speed).toBe(1.0)
    expect(convertedClip.volume).toBe(1.0)
  })

  it("преобразует эффекты", () => {
    const project = createMockProject({
      resources: {
        effects: [
          {
            id: "effect-1",
            type: "brightness",
            name: "Brightness Effect",
            params: { intensity: 0.5 },
            ffmpegCommand: "some command",
          },
          {
            id: "effect-2",
            type: "custom",
            name: "Custom Effect",
            params: { foo: "bar", baz: 42 },
          },
        ],
      },
    })

    const result = timelineToProjectSchema(project)
    expect(result.effects).toHaveLength(2)

    const brightnessEffect = result.effects[0]
    expect(brightnessEffect.id).toBe("effect-1")
    expect(brightnessEffect.name).toBe("Brightness Effect")

    const customEffect = result.effects[1]
    expect(customEffect.id).toBe("effect-2")
  })

  it("преобразует фильтры", () => {
    const project = createMockProject({
      resources: {
        filters: [
          {
            id: "filter-1",
            name: "Brightness Filter",
            category: "color",
            params: { brightness: 0.7 },
          },
          {
            id: "filter-2",
            name: "Contrast Filter",
            category: "color",
            params: { contrast: 1.2, someOther: undefined },
          },
        ],
      },
    })

    const result = timelineToProjectSchema(project)
    expect(result.filters).toHaveLength(2)

    const brightnessFilter = result.filters[0]
    expect(brightnessFilter.id).toBe("filter-1")
    expect(brightnessFilter.filter_type).toBe("Brightness")
    expect(brightnessFilter.parameters).toEqual({ brightness: 0.7 })

    const contrastFilter = result.filters[1]
    expect(contrastFilter.filter_type).toBe("Contrast")
    expect(contrastFilter.parameters).toEqual({ contrast: 1.2 })
  })

  it("преобразует шаблоны с вертикальным разделением", () => {
    const project = createMockProject({
      resources: {
        templates: [
          {
            id: "template-1",
            screens: 2,
            split: "vertical",
          },
        ],
      },
    })

    const result = timelineToProjectSchema(project)
    const template = result.templates[0]

    expect(template.id).toBe("template-1")
    expect(template.template_type).toBe(CompilerTemplateType.Vertical)
    expect(template.screens).toBe(2)
    expect(template.cells).toHaveLength(2)

    expect(template.cells[0]).toEqual({
      index: 0,
      x: 0,
      y: 0,
      width: 50,
      height: 100,
      fit_mode: FitMode.Cover,
      align_x: AlignX.Center,
      align_y: AlignY.Center,
    })

    expect(template.cells[1]).toEqual({
      index: 1,
      x: 50,
      y: 0,
      width: 50,
      height: 100,
      fit_mode: FitMode.Cover,
      align_x: AlignX.Center,
      align_y: AlignY.Center,
    })
  })

  it("преобразует шаблоны с горизонтальным разделением", () => {
    const project = createMockProject({
      resources: {
        templates: [
          {
            id: "template-1",
            screens: 3,
            split: "horizontal",
          },
        ],
      },
    })

    const result = timelineToProjectSchema(project)
    const template = result.templates[0]

    expect(template.template_type).toBe(CompilerTemplateType.Horizontal)
    expect(template.cells).toHaveLength(3)

    template.cells.forEach((cell, index) => {
      expect(cell.index).toBe(index)
      expect(cell.x).toBe(0)
      expect(cell.y).toBe(index * (100 / 3))
      expect(cell.width).toBe(100)
      expect(cell.height).toBe(100 / 3)
    })
  })

  it("преобразует шаблоны с сеткой", () => {
    const project = createMockProject({
      resources: {
        templates: [
          {
            id: "template-1",
            screens: 4,
            split: "grid",
          },
        ],
      },
    })

    const result = timelineToProjectSchema(project)
    const template = result.templates[0]

    expect(template.template_type).toBe(CompilerTemplateType.Grid)
    expect(template.cells).toHaveLength(4)

    // 2x2 сетка
    expect(template.cells[0]).toMatchObject({ x: 0, y: 0, width: 50, height: 50 })
    expect(template.cells[1]).toMatchObject({ x: 50, y: 0, width: 50, height: 50 })
    expect(template.cells[2]).toMatchObject({ x: 0, y: 50, width: 50, height: 50 })
    expect(template.cells[3]).toMatchObject({ x: 50, y: 50, width: 50, height: 50 })
  })

  it("преобразует стилистические шаблоны", () => {
    const project = createMockProject({
      resources: {
        styleTemplates: [
          {
            id: "style-1",
            name: { en: "Modern Title", ru: "Современный заголовок" },
            category: "title",
            style: "modern",
            duration: 5,
            elements: [
              {
                id: "elem-1",
                type: "text",
                name: { en: "Main Text" },
                position: { x: 50, y: 50 },
                size: { width: 200, height: 100 },
                timing: { start: 0, end: 5 },
                properties: {
                  opacity: 1,
                  rotation: 0,
                  scale: 1,
                  text: "Hello World",
                  fontSize: 24,
                  fontFamily: "Arial",
                  color: "#ffffff",
                  textAlign: "center",
                  fontWeight: "bold",
                },
                animations: [
                  {
                    id: "anim-1",
                    type: "fadeIn",
                    duration: 1,
                    delay: 0,
                    easing: "ease-in-out",
                    direction: "left",
                    properties: {},
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    const result = timelineToProjectSchema(project)
    const styleTemplate = result.style_templates[0]

    expect(styleTemplate.id).toBe("style-1")
    expect(styleTemplate.name).toBe("Modern Title")
    expect(styleTemplate.category).toBe(StyleTemplateCategory.Title)
    expect(styleTemplate.style).toBe(StyleTemplateStyle.Modern)
    expect(styleTemplate.duration).toBe(5)

    const element = styleTemplate.elements[0]
    expect(element.element_type).toBe(StyleElementType.Text)
    expect(element.properties.text).toBe("Hello World")
    expect(element.properties.text_align).toBe(TextAlign.Center)
    expect(element.properties.font_weight).toBe(FontWeight.Bold)

    const animation = element.animations[0]
    expect(animation.animation_type).toBe(AnimationType.FadeIn)
    expect(animation.easing).toBe(AnimationEasing.EaseInOut)
    expect(animation.direction).toBe(AnimationDirection.Left)
  })

  it("собирает субтитры из треков субтитров", () => {
    const subtitleClip: any = {
      id: "subtitle-1",
      trackId: "track-1",
      type: "subtitle",
      startTime: 5,
      duration: 3,
      text: "Hello, world!",
      formatting: {
        fontSize: 32,
        color: "#ffff00",
        fontWeight: "bold",
      },
      subtitlePosition: {
        alignment: "top-center",
        marginX: 10,
        marginY: 20,
      },
      animationIn: {
        type: "fade",
        duration: 0.5,
        easing: "ease-in",
      },
      animationOut: {
        type: "slide",
        duration: 0.3,
        easing: "ease-out",
      },
    }

    const track = createMockTrack({
      type: "subtitle",
      clips: [subtitleClip],
    })

    const project = createMockProject({
      globalTracks: [track],
    })

    const result = timelineToProjectSchema(project)
    expect(result.subtitles).toHaveLength(1)

    const subtitle = result.subtitles[0]
    expect(subtitle.id).toBe("subtitle-1")
    expect(subtitle.text).toBe("Hello, world!")
    expect(subtitle.start_time).toBe(5)
    expect(subtitle.end_time).toBe(8)

    expect(subtitle.position).toEqual({
      x: 50,
      y: 0,
      align_x: SubtitleAlignX.Center,
      align_y: SubtitleAlignY.Top,
      margin: {
        left: 10,
        right: 10,
        top: 20,
        bottom: 20,
      },
    })

    expect(subtitle.style.font_size).toBe(32)
    expect(subtitle.style.color).toBe("#ffff00")
    expect(subtitle.style.font_weight).toBe(SubtitleFontWeight.Bold)

    expect(subtitle.animations).toBeDefined()
    expect(subtitle.animations).toHaveLength(2)
    expect(subtitle.animations?.[0]?.animation_type).toBe(SubtitleAnimationType.FadeIn)
    expect(subtitle.animations?.[0]?.easing).toBe(SubtitleEasing.EaseIn)
    expect(subtitle.animations?.[1]?.animation_type).toBe(SubtitleAnimationType.SlideOut)
    expect(subtitle.animations?.[1]?.direction).toBe(SubtitleDirection.Left)
  })

  it("использует настройки по умолчанию для субтитров", () => {
    const regularClip = createMockClip({ name: "Regular Clip" })
    const track = createMockTrack({
      type: "title",
      clips: [regularClip],
    })

    const project = createMockProject({
      globalTracks: [track],
    })

    const result = timelineToProjectSchema(project)
    const subtitle = result.subtitles[0]

    expect(subtitle.text).toBe("Regular Clip")
    expect(subtitle.position.x).toBe(50)
    expect(subtitle.position.y).toBe(85)
    expect(subtitle.position.align_x).toBe(SubtitleAlignX.Center)
    expect(subtitle.position.align_y).toBe(SubtitleAlignY.Bottom)
    expect(subtitle.style.font_family).toBe("Arial")
    expect(subtitle.style.font_size).toBe(24)
    expect(subtitle.animations).toEqual([])
  })

  it("конвертирует различные позиции субтитров", () => {
    const positions = [
      { alignment: "top-left", expected: { x: 0, y: 0, alignX: SubtitleAlignX.Left, alignY: SubtitleAlignY.Top } },
      {
        alignment: "middle-center",
        expected: { x: 50, y: 50, alignX: SubtitleAlignX.Center, alignY: SubtitleAlignY.Center },
      },
      {
        alignment: "bottom-right",
        expected: { x: 100, y: 100, alignX: SubtitleAlignX.Right, alignY: SubtitleAlignY.Bottom },
      },
    ]

    positions.forEach(({ alignment, expected }) => {
      const subtitleClip: any = {
        id: "subtitle-1",
        trackId: "track-1",
        type: "subtitle",
        startTime: 0,
        duration: 1,
        text: "Test",
        subtitlePosition: {
          alignment: alignment as any,
          marginX: 5,
          marginY: 10,
        },
      }

      const track = createMockTrack({ type: "subtitle", clips: [subtitleClip] })
      const project = createMockProject({ globalTracks: [track] })
      const result = timelineToProjectSchema(project)
      const subtitle = result.subtitles[0]

      expect(subtitle.position.x).toBe(expected.x)
      expect(subtitle.position.y).toBe(expected.y)
      expect(subtitle.position.align_x).toBe(expected.alignX)
      expect(subtitle.position.align_y).toBe(expected.alignY)
      expect(subtitle.position.margin).toEqual({
        left: 5,
        right: 5,
        top: 10,
        bottom: 10,
      })
    })
  })

  it("настраивает параметры экспорта", () => {
    const project = createMockProject()
    const result = timelineToProjectSchema(project)

    expect(result.settings.export).toEqual({
      format: OutputFormat.Mp4,
      quality: 85,
      video_bitrate: 8000,
      audio_bitrate: 192,
      hardware_acceleration: true,
      ffmpeg_args: [],
    })

    expect(result.settings.preview).toEqual({
      resolution: [1280, 720],
      fps: 30,
      quality: 75,
    })

    expect(result.settings.custom).toEqual({})
  })

  it("обрабатывает проект без настроек", () => {
    const project = createMockProject({ settings: null })
    const result = timelineToProjectSchema(project)

    expect(result.timeline.fps).toBe(30)
    expect(result.timeline.resolution).toEqual([1920, 1080])
    expect(result.timeline.sample_rate).toBe(48000)
  })

  it("обрабатывает пустые ресурсы", () => {
    const project = createMockProject({ resources: null })
    const result = timelineToProjectSchema(project)

    expect(result.effects).toEqual([])
    expect(result.filters).toEqual([])
    expect(result.transitions).toEqual([])
    expect(result.templates).toEqual([])
    expect(result.style_templates).toEqual([])
  })

  it("правильно маппит специальные параметры эффектов", () => {
    const project = createMockProject({
      resources: {
        effects: [
          { id: "e1", type: "brightness", name: "E1", params: { intensity: 0.8 } },
          { id: "e2", type: "contrast", name: "E2", params: { intensity: 1.2 } },
          { id: "e3", type: "saturation", name: "E3", params: { intensity: 0.5 } },
        ],
      },
    })

    const result = timelineToProjectSchema(project)

    result.effects.forEach((effect) => {
      expect(effect.parameters).toHaveProperty("value")
      expect(effect.parameters).not.toHaveProperty("intensity")
    })
  })
})
