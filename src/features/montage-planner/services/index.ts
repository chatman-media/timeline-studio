/**
 * @deprecated
 * Services have been migrated to @/domains/ai-services/services/montage-planning/
 *
 * This file re-exports from the new location for backward compatibility.
 * Please update imports to use:
 * import { ... } from '@/domains/ai-services/services/montage-planning'
 */

// Re-export machine
export type {
  MontagePlannerContext,
  MontagePlannerEvent,
} from "@/domains/ai-services/machines/montage-planner-machine"
export { montagePlannerMachine } from "@/domains/ai-services/machines/montage-planner-machine"
// Re-export services from domains
export {
  applyPlanToTimeline,
  ContentAnalyzer,
  createMarkersFromPlan,
  MomentDetector,
  PlanGenerator,
  RhythmCalculator,
} from "@/domains/ai-services/services/montage-planning"
// Re-export types
export type { TimelineIntegrationOptions } from "@/domains/ai-services/services/montage-planning/timeline-integration-service"
// Analysis Task Bridge - connects frontend UI with backend UnifiedOrchestrator
export { AnalysisTaskBridge, analysisTaskBridge } from "./analysis-task-bridge"
// Provider stays in features (UI layer)
export { MontagePlannerProvider, useMontagePlanner as useMontagePlannerContext } from "./montage-planner-provider"
