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
 * Classic video editing layout - browser, player on top, timeline bottom
 * Based on commented code in default-layout.tsx
 */
const defaultLayout: LayoutPreset = {
  id: "default",
  name: "Default",
  description: "Classic editing - browser, player, timeline",
  icon: "layout-grid",
  widgets: [
    // Top area (80% height) - Browser (50%) + Player (50%) horizontal
    createWidget("browser-1", "browser", 0, 0, 50, 80),
    createWidget("player-1", "player", 50, 0, 50, 80),
    // Timeline - bottom (20% height)
    createWidget("timeline-1", "timeline", 0, 80, 100, 20),
  ],
}

/**
 * Preset 2: Vertical Layout
 * Left panel with browser/options/timeline, player on right
 */
const verticalLayout: LayoutPreset = {
  id: "vertical",
  name: "Vertical",
  description: "Vertical stack on left, player on right",
  icon: "panel-left",
  widgets: [
    // Left side (67% width) - vertical stack
    // Browser - top left (30% of left panel)
    createWidget("browser-2", "browser", 0, 0, 67, 30),
    // Options - middle left (50% of left panel)
    createWidget("options-2", "options", 0, 30, 67, 50),
    // Timeline - bottom left (20% of left panel)
    createWidget("timeline-2", "timeline", 0, 80, 67, 20),
    // Player - right side (33% width, full height)
    createWidget("player-2", "player", 67, 0, 33, 100),
  ],
}

/**
 * Preset 3: Options Layout
 * Left panel with browser/player/timeline, options on right
 */
const optionsLayout: LayoutPreset = {
  id: "options",
  name: "Options",
  description: "Options panel on right side",
  icon: "panel-top",
  widgets: [
    // Left side (70% width)
    // Top row - Browser (30%) + Player (70%) horizontal split (50% height of left)
    createWidget("browser-3", "browser", 0, 0, 21, 50), // 30% of 70% = 21%
    createWidget("player-3", "player", 21, 0, 49, 50), // 70% of 70% = 49%
    // Timeline - bottom of left (50% height of left)
    createWidget("timeline-3", "timeline", 0, 50, 70, 50),
    // Options - right side (30% width, full height)
    createWidget("options-3", "options", 70, 0, 30, 100),
  ],
}

/**
 * Preset 4: Browser Layout
 * Removed - this preset doesn't exist in original layouts
 */
// const browserLayout: LayoutPreset = {
//   id: "browser",
//   name: "Browser",
//   description: "Large browser for media selection",
//   icon: "folder-open",
//   widgets: [
//     createWidget("browser-4", "browser", 0, 0, 60, 60),
//     createWidget("player-4", "player", 60, 0, 40, 60),
//     createWidget("timeline-4", "timeline", 0, 60, 100, 40),
//   ],
// }

/**
 * Preset 4: Chat Layout
 * Left panel with browser/player/options/timeline, AI chat on right
 */
const chatLayout: LayoutPreset = {
  id: "chat",
  name: "Chat",
  description: "AI assistant on right side",
  icon: "message-square",
  widgets: [
    // Left side (70% width)
    // Top row - Browser (25%) + Player (50%) + Options (25%) horizontal split (50% height of left)
    createWidget("browser-4", "browser", 0, 0, 17.5, 50), // 25% of 70% = 17.5%
    createWidget("player-4", "player", 17.5, 0, 35, 50), // 50% of 70% = 35%
    createWidget("options-4", "options", 52.5, 0, 17.5, 50), // 25% of 70% = 17.5%
    // Timeline - bottom of left (50% height of left)
    createWidget("timeline-4", "timeline", 0, 50, 70, 50),
    // AI Chat + Suggestions - right side (30% width, full height)
    createWidget("ai-chat-4", "ai-chat", 70, 0, 30, 100),
  ],
}

/**
 * All available layout presets
 */
export const LAYOUT_PRESETS: LayoutPreset[] = [defaultLayout, verticalLayout, optionsLayout, chatLayout]

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
