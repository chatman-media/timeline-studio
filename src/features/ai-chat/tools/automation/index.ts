/**
 * Automation AI Tools - Инструменты автоматизации и оптимизации
 *
 * Автоматические процессы, пакетная обработка и интеллектуальные шаблоны
 */

// Migrated tools
import { batchProcessingTools } from "@/domains/ai-tools/tools/automation/batch-processing";
import { performanceTools } from "@/domains/ai-tools/tools/automation/performance";
import { templateTools } from "@/domains/ai-tools/tools/automation/templates";
import { subtitleTools } from "@/domains/ai-tools/tools/automation/subtitles";
import { workflowTools } from "@/domains/ai-tools/tools/automation/workflow";
import { enhancedSubtitleAutomationTools } from "@/domains/ai-tools/tools/automation/enhanced-subtitle-automation";

export const automationTools = [
  ...workflowTools,
  ...batchProcessingTools,
  ...performanceTools,
  ...templateTools,
  ...subtitleTools,
  ...enhancedSubtitleAutomationTools,
];

export const AUTOMATION_TOOLS_COUNT = automationTools.length;
