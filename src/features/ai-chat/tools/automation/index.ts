/**
 * Automation AI Tools - Инструменты автоматизации и оптимизации
 *
 * Автоматические процессы, пакетная обработка и интеллектуальные шаблоны
 */

// Migrated tools
import { batchProcessingTools } from "@/domains/ai-tools/tools/automation/batch-processing"
import { enhancedSubtitleAutomationTools } from "@/domains/ai-tools/tools/automation/enhanced-subtitle-automation"
import { performanceTools } from "@/domains/ai-tools/tools/automation/performance"
import { subtitleTools } from "@/domains/ai-tools/tools/automation/subtitles"
import { templateTools } from "@/domains/ai-tools/tools/automation/templates"
import { workflowTools } from "@/domains/ai-tools/tools/automation/workflow"

export const automationTools = [
  ...workflowTools,
  ...batchProcessingTools,
  ...performanceTools,
  ...templateTools,
  ...subtitleTools,
  ...enhancedSubtitleAutomationTools,
]

export const AUTOMATION_TOOLS_COUNT = automationTools.length
