/**
 * Layout Presets Configuration
 *
 * Defines 4 base layout presets for Timeline Studio workspace
 */

import type { LayoutPreset, Widget } from "../types/widget"

/**
 * Helper to create widget with default values
 */
function createWidget(
  id: string,
  type: Widget["type"],
  x: number,
  y: number,
  width: number,
  height: number,
): Widget {
  return {
    id,
    type,
    bounds: { x, y, width, height },
    isVisible: true,
    isMinimized: false,
    zIndex: 1,
  }
}

/**
 * Preset 1: Default Layout
 * Classic video editing layout with player, browser and timeline
 */
const defaultLayout: LayoutPreset = {
  id: "default",
  name: "Default",
  description: "Classic editing layout - player, browser, timeline",
  icon: "layout-grid",
  widgets: [
    // Browser - top left
    createWidget("browser-1", "browser", 0, 0, 50, 60),
    // Video player - top right
    createWidget("player-1", "player", 50, 0, 50, 60),
    // Timeline - bottom, full width
    createWidget("timeline-1", "timeline", 0, 60, 100, 40),
  ],
}

/**
 * Preset 2: Vertical Layout
 * Vertical arrangement for ultrawide monitors
 */
const verticalLayout: LayoutPreset = {
  id: "vertical",
  name: "Vertical",
  description: "Vertical stack layout for ultrawide displays",
  icon: "panel-left",
  widgets: [
    // Player - top
    createWidget("player-2", "player", 0, 0, 100, 35),
    // Browser - middle left
    createWidget("browser-2", "browser", 0, 35, 50, 30),
    // Options - middle right
    createWidget("options-2", "options", 50, 35, 50, 30),
    // Timeline - bottom
    createWidget("timeline-2", "timeline", 0, 65, 100, 35),
  ],
}

/**
 * Preset 3: Options Layout
 * Focus on clip options and properties
 */
const optionsLayout: LayoutPreset = {
  id: "options",
  name: "Options",
  description: "Focus on clip properties and options",
  icon: "panel-top",
  widgets: [
    // Player - top left
    createWidget("player-3", "player", 0, 0, 50, 60),
    // Options - top right, larger
    createWidget("options-3", "options", 50, 0, 50, 60),
    // Timeline - bottom
    createWidget("timeline-3", "timeline", 0, 60, 100, 40),
  ],
}

/**
 * Preset 4: Browser Layout
 * Emphasis on media browsing and selection
 */
const browserLayout: LayoutPreset = {
  id: "browser",
  name: "Browser",
  description: "Large browser for media selection",
  icon: "folder-open",
  widgets: [
    // Browser - large, left side
    createWidget("browser-4", "browser", 0, 0, 60, 60),
    // Player - top right
    createWidget("player-4", "player", 60, 0, 40, 60),
    // Timeline - bottom
    createWidget("timeline-4", "timeline", 0, 60, 100, 40),
  ],
}

/**
 * Preset 5: Chat Layout
 * AI Chat assistant on the right side
 */
const chatLayout: LayoutPreset = {
  id: "chat",
  name: "Chat",
  description: "AI assistant for editing help",
  icon: "message-square",
  widgets: [
    // Browser - top left
    createWidget("browser-5", "browser", 0, 0, 35, 60),
    // Player - top center
    createWidget("player-5", "player", 35, 0, 35, 60),
    // AI Chat - right sidebar, full height
    createWidget("ai-chat-5", "ai-chat", 70, 0, 30, 100),
    // Timeline - bottom left (under browser + player)
    createWidget("timeline-5", "timeline", 0, 60, 70, 40),
  ],
}

/**
 * All available layout presets
 */
export const LAYOUT_PRESETS: LayoutPreset[] = [
  defaultLayout,
  verticalLayout,
  optionsLayout,
  browserLayout,
  chatLayout,
]

/**
 * Default layout preset ID
 */
export const DEFAULT_LAYOUT_PRESET_ID = "default"

/**
 * Get preset by ID
 */
export function getLayoutPreset(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS.find((preset) => preset.id === id)
}

/**
 * Get default preset
 */
export function getDefaultLayoutPreset(): LayoutPreset {
  return LAYOUT_PRESETS[0]
}
