/**
 * Smart Montage Planner module exports
 * AI-powered tool for automatic montage plan generation
 */

// Main component
export { MontagePlanner } from "./components"

// Analysis Tasks dropdown for top bar
export { AnalysisTasksDropdown } from "./components/analysis-tasks-dropdown"

// Hooks
export {
  useContentAnalysis,
  useMontagePlanner,
  usePlanGenerator,
} from "./hooks"

// Services
export {
  ContentAnalyzer,
  MomentDetector,
  MontagePlannerProvider,
  PlanGenerator,
  RhythmCalculator,
} from "./services"

// Types
export * from "./types"
