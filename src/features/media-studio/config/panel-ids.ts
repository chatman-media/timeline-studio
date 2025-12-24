/**
 * Стабильные ID для ResizablePanel
 *
 * Эти ID используются для сохранения размеров панелей между сессиями
 * и между переключениями layout'ов.
 *
 * Правило: ID всегда одинаковый для одного и того же компонента,
 * независимо от того в каком layout'е он находится.
 */

// Основные панели компонентов
export const PANEL_IDS = {
  BROWSER: "panel-browser",
  PLAYER: "panel-player",
  OPTIONS: "panel-options",
  TIMELINE: "panel-timeline",
  AI_CHAT: "panel-ai-chat",
} as const

// Группы панелей (используются для сохранения их взаимного расположения)
export const PANEL_GROUP_IDS = {
  // Горизонтальные группы
  BROWSER_PLAYER: "group-browser-player",
  PLAYER_OPTIONS: "group-player-options",
  BROWSER_PLAYER_OPTIONS: "group-browser-player-options",
  TIMELINE_AI: "group-timeline-ai",

  // Вертикальные группы
  MAIN_VERTICAL: "group-main-vertical",
  LEFT_VERTICAL: "group-left-vertical",

  // Специфичные для layout'ов
  VERTICAL_LAYOUT_LEFT: "group-vertical-left",
  OPTIONS_LAYOUT_LEFT_TOP: "group-options-left-top",
  CHAT_LAYOUT_LEFT_TOP: "group-chat-left-top",
} as const

export type PanelId = (typeof PANEL_IDS)[keyof typeof PANEL_IDS]
export type PanelGroupId = (typeof PANEL_GROUP_IDS)[keyof typeof PANEL_GROUP_IDS]
