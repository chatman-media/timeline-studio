/**
 * Unified Montage Planner Types - Public API
 *
 * Единый источник истины для всех типов монтажного планнера
 */

// Converters
export {
  convertAnalysisToSimpleScore,
  convertDomainFragmentToUnified,
  convertDomainPlanToUnified,
  convertFeatureFragmentToUnified,
  // Plan converters
  convertLegacyAIDirectorPlanToUnified,
  // Fragment converters
  convertLegacyClipToFragment,
  // Analysis converters
  convertMomentScoreToAnalysis,
  // Auto converter
  convertToUnified,
  convertUnifiedToDomainFragment,
  convertUnifiedToDomainPlan,
  convertUnifiedToLegacyAIDirectorPlan,
  isDomainPlan,
  // Type guards
  isLegacyPlan,
  isUnifiedPlan,
} from "./converters"
// Core types
// Supporting types
export type {
  FragmentAnalysis,
  MomentCategory,
  MomentScore,
  MontageCreationState,
  MontageCreationStatus,
  MontageMusicSettings,
  MontageRequest,
  MontageTextSettings,
  Person,
  PlanMetadata,
  PlanStatistics,
  PlanValidation,
  Sequence,
  SequenceType,
  TransitionType,
  UnifiedFragment,
  UnifiedMontagePlan,
  UnifiedMontageStyle,
  UnifiedMontageStyleParams,
  UnifiedTransition,
} from "./montage-plan"
