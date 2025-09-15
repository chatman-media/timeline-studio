/**
 * Montage Planning Services
 * Smart montage planning with AI-powered content analysis and optimization
 */

export { ContentAnalyzer } from './content-analyzer'
export { MomentDetector } from './moment-detector'
export { PlanGenerator } from './plan-generator'
export { RhythmCalculator } from './rhythm-calculator'
export { TimelineIntegrationService } from './timeline-integration-service'
export { getMontagePlannerAI } from './montage-planner-ai-integration'

// Re-export types that services use
export type {
  AnalysisOptions,
  AudioAnalysis,
  VideoAnalysis,
  Fragment,
  MomentScore,
  MontagePlan,
  SceneTransition,
  EditingPace,
  ContentTheme
} from '../../../features/montage-planner/types'
