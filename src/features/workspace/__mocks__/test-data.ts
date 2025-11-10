/**
 * Test data for workspace tests
 */

import { vi } from "vitest"

import type { LayoutPreset, Widget, WidgetBounds } from "../types/widget"

/**
 * Create a mock widget with default values
 */
export function createMockWidget(
  id: string,
  type: Widget["type"],
  bounds?: Partial<WidgetBounds>,
  options?: Partial<Widget>,
): Widget {
  return {
    id,
    type,
    bounds: {
      x: bounds?.x ?? 0,
      y: bounds?.y ?? 0,
      width: bounds?.width ?? 50,
      height: bounds?.height ?? 50,
    },
    isVisible: options?.isVisible ?? true,
    isMinimized: options?.isMinimized ?? false,
    zIndex: options?.zIndex ?? 1,
    config: options?.config,
  }
}

/**
 * Mock widgets for testing
 */
export const mockWidgets = {
  timeline: createMockWidget("timeline-1", "timeline", { x: 0, y: 80, width: 100, height: 20 }),
  player: createMockWidget("player-1", "player", { x: 50, y: 0, width: 50, height: 80 }),
  browser: createMockWidget("browser-1", "browser", { x: 0, y: 0, width: 50, height: 80 }),
  options: createMockWidget("options-1", "options", { x: 70, y: 0, width: 30, height: 100 }),
  aiChat: createMockWidget("ai-chat-1", "ai-chat", { x: 70, y: 0, width: 30, height: 100 }),
  aiSuggestions: createMockWidget("ai-suggestions-1", "ai-suggestions", { x: 70, y: 50, width: 30, height: 50 }),
}

/**
 * Mock layout presets for testing
 */
export const mockLayoutPresets: LayoutPreset[] = [
  {
    id: "default",
    name: "Default Layout",
    description: "Classic video editing layout",
    icon: "layout-grid",
    widgets: [mockWidgets.browser, mockWidgets.player, mockWidgets.timeline],
  },
  {
    id: "vertical",
    name: "Vertical Layout",
    description: "Vertical layout for ultrawide monitors",
    icon: "panel-left",
    widgets: [mockWidgets.browser, mockWidgets.options, mockWidgets.timeline, mockWidgets.player],
  },
  {
    id: "options",
    name: "Options Layout",
    description: "Focus on clip properties",
    icon: "panel-top",
    widgets: [mockWidgets.browser, mockWidgets.player, mockWidgets.timeline, mockWidgets.options],
  },
  {
    id: "chat",
    name: "Chat Layout",
    description: "AI assistant for editing",
    icon: "message-square",
    widgets: [mockWidgets.browser, mockWidgets.player, mockWidgets.options, mockWidgets.timeline, mockWidgets.aiChat],
  },
]

/**
 * Mock workspace context for testing
 */
export const mockWorkspaceContext = {
  // State
  currentPresetId: "default",
  activeWidgets: mockLayoutPresets[0].widgets,
  customLayouts: [],
  selectedWidgetId: null,
  isDragging: false,

  // Actions
  switchPreset: vi.fn(),
  addWidget: vi.fn(),
  removeWidget: vi.fn(),
  updateWidgetBounds: vi.fn(),
  toggleWidgetVisibility: vi.fn(),
  minimizeWidget: vi.fn(),
  maximizeWidget: vi.fn(),
  selectWidget: vi.fn(),
  saveCustomLayout: vi.fn(),
  deleteCustomLayout: vi.fn(),
  resetToPreset: vi.fn(),
  send: vi.fn(),
}

/**
 * Create mock workspace context with custom overrides
 */
export function createMockWorkspaceContext(overrides?: Partial<typeof mockWorkspaceContext>) {
  return {
    ...mockWorkspaceContext,
    ...overrides,
  }
}
