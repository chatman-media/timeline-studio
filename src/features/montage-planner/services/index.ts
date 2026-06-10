/**
 * @deprecated
 * Domain-backed services are exposed through ./domain-adapters.
 *
 * This file re-exports from the new location for backward compatibility.
 */

// Re-export machine
export type {
  MontagePlannerContext,
  MontagePlannerEvent,
} from "./domain-adapters"
export { montagePlannerMachine } from "./domain-adapters"
// Re-export services from domains
export {
  applyPlanToTimeline,
  ContentAnalyzer,
  createMarkersFromPlan,
  MomentDetector,
  PlanGenerator,
  RhythmCalculator,
} from "./domain-adapters"
// Re-export types
export type { TimelineIntegrationOptions } from "./domain-adapters"
// Analysis Task Bridge - connects frontend UI with backend UnifiedOrchestrator
export { AnalysisTaskBridge, analysisTaskBridge } from "./analysis-task-bridge"
// Provider stays in features (UI layer)
export { MontagePlannerProvider, useMontagePlanner as useMontagePlannerContext } from "./montage-planner-provider"
