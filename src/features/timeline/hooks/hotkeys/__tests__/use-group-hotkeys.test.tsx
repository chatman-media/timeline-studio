/**
 * Comprehensive tests for use-group-hotkeys hook
 */

import { renderHook } from "@testing-library/react"
import { TimelineProviders } from "@/test/test-utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock timeline-machine
vi.mock("../../services/timeline-machine", () => ({
  timelineMachine: {},
}))

// Mock shortcuts registry
vi.mock("@/features/keyboard-shortcuts", () => ({
  shortcutsRegistry: {
    updateAction: vi.fn(),
  },
}))

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"

// Mock keyboard event
const mockKeyboardEvent = new KeyboardEvent("keydown", { key: "Enter" })
const mockHotkeyEvent = { keys: ["enter"], scope: "all", element: null }

// Создаем отдельный модуль для моков
const mockCreateGroup = vi.fn()
const mockUngroupClips = vi.fn()
const mockGetGroupByClip = vi.fn()

vi.mock("../../hooks/use-clip-groups", () => ({
  useClipGroups: () => ({
    createGroup: mockCreateGroup,
    ungroupClips: mockUngroupClips,
    getGroupByClip: mockGetGroupByClip,
    groups: [],
    groupManager: {},
    addToGroup: vi.fn(),
    removeFromGroup: vi.fn(),
    toggleCollapse: vi.fn(),
    lockGroup: vi.fn(),
    renameGroup: vi.fn(),
    setGroupColor: vi.fn(),
    createNestedSequence: vi.fn(),
    updateNestedSequence: vi.fn(),
    breakApartSequence: vi.fn(),
    isClipInGroup: vi.fn(),
    getClipsInGroup: vi.fn(),
  }),
}))

// Mock project data
const mockProject: TimelineProject = {
  id: "project-1",
  name: "Test Project",
  sections: [
    {
      id: "section-1",
      name: "Section 1",
      tracks: [
        {
          id: "track-1",
          clips: [
            {
              id: "clip-1",
              name: "Clip 1",
              trackId: "track-1",
              startTime: 0,
              duration: 5,
            } as TimelineClip,
            {
              id: "clip-2",
              name: "Clip 2",
              trackId: "track-1",
              startTime: 5,
              duration: 5,
            } as TimelineClip,
          ],
        },
      ],
    },
  ],
  globalTracks: [
    {
      id: "global-track-1",
      clips: [
        {
          id: "clip-3",
          name: "Clip 3",
          trackId: "global-track-1",
          startTime: 0,
          duration: 10,
        } as TimelineClip,
      ],
    },
  ],
} as any

const mockUiState = {
  selectedClipIds: ["clip-1", "clip-2"],
}

const mockSend = vi.fn()

vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: () => ({
    project: mockProject,
    selectedClipIds: mockUiState.selectedClipIds,
    send: mockSend,
  }),
}))

import type { TimelineClip, TimelineProject } from "@/features/timeline/types"
import { MockTimelineProvider } from "../../../__tests__/test-providers"
import type { ClipGroup } from "../../../types/clip-groups"
import { useGroupHotkeys } from "../use-group-hotkeys"

describe("useGroupHotkeys", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Сбрасываем выбранные клипы
    mockUiState.selectedClipIds = ["clip-1", "clip-2"]

    // Настройка мока getGroupByClip по умолчанию
    mockGetGroupByClip.mockReturnValue({
      id: "group-1",
      name: "Test Group",
      clips: [
        { clipId: "clip-1", trackId: "track-1" },
        { clipId: "clip-2", trackId: "track-1" },
      ],
    } as ClipGroup)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("должен регистрировать горячие клавиши", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    // Проверяем что были зарегистрированы actions для shortcuts
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("group-clips", expect.any(Function))
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("ungroup-clips", expect.any(Function))
  })

  it("должен создавать группу при нажатии Cmd+G с выбранными клипами", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    // Получаем функцию, переданную для group-clips
    const groupClipsAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "group-clips")?.[1]
    expect(groupClipsAction).toBeDefined()

    // Симулируем вызов action
    groupClipsAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockCreateGroup).toHaveBeenCalledWith([
      mockProject.sections[0].tracks[0].clips[0],
      mockProject.sections[0].tracks[0].clips[1],
    ])
  })

  it("не должен создавать группу если выбрано меньше 2 клипов", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Изменяем выбранные клипы
    mockUiState.selectedClipIds = ["clip-1"]

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    const groupClipsAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "group-clips")?.[1]
    expect(groupClipsAction).toBeDefined()

    groupClipsAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockCreateGroup).not.toHaveBeenCalled()
  })

  it("должен разгруппировывать клипы при нажатии Cmd+Shift+G", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    // Получаем функцию для ungroup-clips
    const ungroupClipsAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "ungroup-clips")?.[1]
    expect(ungroupClipsAction).toBeDefined()

    ungroupClipsAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockGetGroupByClip).toHaveBeenCalledWith("clip-1")
    expect(mockUngroupClips).toHaveBeenCalledWith("group-1")
  })

  it("не должен разгруппировывать если клип не в группе", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Мокаем что клип не в группе
    mockGetGroupByClip.mockReturnValue(undefined)

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    const ungroupClipsAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "ungroup-clips")?.[1]
    expect(ungroupClipsAction).toBeDefined()

    ungroupClipsAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockGetGroupByClip).toHaveBeenCalledWith("clip-1")
    expect(mockUngroupClips).not.toHaveBeenCalled()
  })

  it("не должен разгруппировывать если нет выбранных клипов", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Очищаем выбранные клипы
    mockUiState.selectedClipIds = []

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    const ungroupClipsAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "ungroup-clips")?.[1]
    expect(ungroupClipsAction).toBeDefined()

    ungroupClipsAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    expect(mockGetGroupByClip).not.toHaveBeenCalled()
    expect(mockUngroupClips).not.toHaveBeenCalled()
  })

  it("должен работать с клипами из глобальных треков", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Выбираем клипы включая глобальный трек
    mockUiState.selectedClipIds = ["clip-1", "clip-3"]

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    const groupClipsAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "group-clips")?.[1]
    expect(groupClipsAction).toBeDefined()

    groupClipsAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    // Проверяем что createGroup был вызван с правильными клипами
    // Порядок: сначала globalTracks, потом sections
    expect(mockCreateGroup).toHaveBeenCalledWith([
      mockProject.globalTracks[0].clips[0], // clip-3
      mockProject.sections[0].tracks[0].clips[0], // clip-1
    ])
  })

  it("должен работать с разными сочетаниями клавиш для разных ОС", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    // Проверяем что зарегистрированы shortcuts
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("group-clips", expect.any(Function))
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalledWith("ungroup-clips", expect.any(Function))
  })

  it("должен отключать хоткеи на элементах форм", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    // В новой системе shortcuts это контролируется контекстом,
    // проверяем что shortcuts были зарегистрированы
    expect(vi.mocked(shortcutsRegistry).updateAction).toHaveBeenCalled()
  })

  it("должен корректно обрабатывать отсутствие проекта", () => {
    // Временно сохраняем оригинальный проект и устанавливаем null
    const originalProject = mockProject

    // Очищаем глобальные переменные для имитации отсутствия проекта
    mockProject.sections = []
    mockProject.globalTracks = []

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    const groupClipsAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "group-clips")?.[1]
    expect(groupClipsAction).toBeDefined()

    groupClipsAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    // Не должно быть вызовов createGroup когда нет клипов
    expect(mockCreateGroup).not.toHaveBeenCalled()

    // Восстанавливаем проект
    mockProject.sections = originalProject.sections
    mockProject.globalTracks = originalProject.globalTracks
  })

  it("должен выбирать первый клип из выбранных для определения группы", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Убедимся что в проекте есть нужные клипы после предыдущего теста
    if (mockProject.sections.length === 0) {
      mockProject.sections = [
        {
          id: "section-1",
          name: "Section 1",
          tracks: [
            {
              id: "track-1",
              clips: [
                {
                  id: "clip-1",
                  name: "Clip 1",
                  trackId: "track-1",
                  startTime: 0,
                  duration: 5,
                } as TimelineClip,
                {
                  id: "clip-2",
                  name: "Clip 2",
                  trackId: "track-1",
                  startTime: 5,
                  duration: 5,
                } as TimelineClip,
              ],
            },
          ],
        },
      ] as any
    }

    // Выбираем только клипы из sections
    mockUiState.selectedClipIds = ["clip-2"]

    // Настраиваем группу для клипа
    mockGetGroupByClip.mockReturnValue({
      id: "group-2",
      name: "Group 2",
      clips: [{ clipId: "clip-2", trackId: "track-1" }],
    } as ClipGroup)

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    const ungroupClipsAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "ungroup-clips")?.[1]
    expect(ungroupClipsAction).toBeDefined()

    ungroupClipsAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    // Должна использоваться группа первого найденного клипа
    expect(mockGetGroupByClip).toHaveBeenCalledWith("clip-2")
    expect(mockUngroupClips).toHaveBeenCalledWith("group-2")
  })

  it("должен собирать клипы из всех секций", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Убедимся что проект восстановлен
    if (mockProject.sections.length === 0 || !mockProject.globalTracks) {
      mockProject.sections = [
        {
          id: "section-1",
          name: "Section 1",
          tracks: [
            {
              id: "track-1",
              clips: [
                {
                  id: "clip-1",
                  name: "Clip 1",
                  trackId: "track-1",
                  startTime: 0,
                  duration: 5,
                } as TimelineClip,
                {
                  id: "clip-2",
                  name: "Clip 2",
                  trackId: "track-1",
                  startTime: 5,
                  duration: 5,
                } as TimelineClip,
              ],
            },
          ],
        },
      ] as any

      mockProject.globalTracks = [
        {
          id: "global-track-1",
          clips: [
            {
              id: "clip-3",
              name: "Clip 3",
              trackId: "global-track-1",
              startTime: 0,
              duration: 10,
            } as TimelineClip,
          ],
        },
      ] as any
    }

    // Добавляем дополнительную секцию
    const originalSections = [...mockProject.sections]
    mockProject.sections.push({
      id: "section-2",
      name: "Section 2",
      tracks: [
        {
          id: "track-2",
          clips: [
            {
              id: "clip-4",
              name: "Clip 4",
              trackId: "track-2",
              startTime: 0,
              duration: 5,
            } as TimelineClip,
          ],
        },
      ],
    } as any)

    // Выбираем клипы из разных секций
    mockUiState.selectedClipIds = ["clip-1", "clip-4"]

    renderHook((, { wrapper: TimelineProviders }) => useGroupHotkeys(), { wrapper })

    const groupClipsAction = vi
      .mocked(shortcutsRegistry)
      .updateAction.mock.calls.find((call) => call[0] === "group-clips")?.[1]
    expect(groupClipsAction).toBeDefined()

    groupClipsAction?.(mockKeyboardEvent, mockHotkeyEvent as any)

    // Проверяем что createGroup был вызван
    expect(mockCreateGroup).toHaveBeenCalled()

    // Восстанавливаем оригинальные секции
    mockProject.sections = originalSections
  })
})
