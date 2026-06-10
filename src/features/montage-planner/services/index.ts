/**
 * @deprecated
 * Domain-backed services are exposed through ./domain-adapters.
 *
 * This file re-exports from the new location for backward compatibility.
 */

// Analysis Task Bridge - connects frontend UI with backend UnifiedOrchestrator
export { AnalysisTaskBridge, analysisTaskBridge } from "./analysis-task-bridge"
// Re-export machine
// Re-export types
export type {
  MontagePlannerContext,
  MontagePlannerEvent,
  TimelineIntegrationOptions,
} from "./domain-adapters"
// Re-export services from domains
export {
  applyPlanToTimeline,
  ContentAnalyzer,
  createMarkersFromPlan,
  MomentDetector,
  montagePlannerMachine,
  PlanGenerator,
  RhythmCalculator,
} from "./domain-adapters"
// Provider stays in features (UI layer)
export { MontagePlannerProvider, useMontagePlanner as useMontagePlannerContext } from "./montage-planner-provider"
