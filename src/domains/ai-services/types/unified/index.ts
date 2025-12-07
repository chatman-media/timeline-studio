/**
 * Unified Montage Planner Types - Public API
 *
 * Единый источник истины для всех типов монтажного планнера
 */

// Core types
export type {
  UnifiedMontagePlan,
  UnifiedFragment,
  UnifiedMontageStyle,
  UnifiedMontageStyleParams,
  UnifiedTransition,
} from "./montage-plan"

// Supporting types
export type {
  Person,
  MomentScore,
  MomentCategory,
  FragmentAnalysis,
  Sequence,
  SequenceType,
  MontageMusicSettings,
  MontageTextSettings,
  PlanMetadata,
  PlanValidation,
  PlanStatistics,
  MontageRequest,
  MontageCreationStatus,
  MontageCreationState,
  TransitionType,
} from "./montage-plan"

// Converters
export {
  // Fragment converters
  convertLegacyClipToFragment,
  convertDomainFragmentToUnified,
  convertFeatureFragmentToUnified,
  convertUnifiedToDomainFragment,
  // Plan converters
  convertLegacyAIDirectorPlanToUnified,
  convertDomainPlanToUnified,
  convertUnifiedToLegacyAIDirectorPlan,
  convertUnifiedToDomainPlan,
  // Analysis converters
  convertMomentScoreToAnalysis,
  convertAnalysisToSimpleScore,
  // Type guards
  isLegacyPlan,
  isDomainPlan,
  isUnifiedPlan,
  // Auto converter
  convertToUnified,
} from "./converters"
