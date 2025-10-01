/**
 * Core AI Tools - Основные инструменты Timeline Studio
 *
 * Базовая функциональность для работы с Timeline, ресурсами, плеером и браузером
 */

// All core tools are now in the domains layer.
import { browserTools } from "@/domains/ai-tools/tools/core/browser"
import { effectsFiltersTools } from "@/domains/ai-tools/tools/core/effects-filters-tools"
import { playerTools } from "@/domains/ai-tools/tools/core/player"
import { resourceTools } from "@/domains/ai-tools/tools/core/resources"
import { settingsConfigurationTools } from "@/domains/ai-tools/tools/core/settings-configuration-tools"
import { timelineTools } from "@/domains/ai-tools/tools/core/timeline"

export const coreTools = [
  ...timelineTools,
  ...resourceTools,
  ...browserTools,
  ...playerTools,
  ...effectsFiltersTools,
  ...settingsConfigurationTools,
]

export const CORE_TOOLS_COUNT = coreTools.length
