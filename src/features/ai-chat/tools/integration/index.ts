/**
 * Integration AI Tools - Инструменты интеграции и экспорта
 *
 * Экспорт проектов, интеграция с платформами и конвертация форматов
 */

// Migrated tools
import { exportTools } from "@/domains/ai-tools/tools/integration/export"
import { formatConversionTools } from "@/domains/ai-tools/tools/integration/format-conversion"

// Not migrated tools
export * from "./platform-integration-tools"

import { platformOptimizationTools } from "./platform-integration-tools"

export const integrationTools = [...exportTools, ...platformOptimizationTools, ...formatConversionTools]

export const INTEGRATION_TOOLS_COUNT = integrationTools.length
