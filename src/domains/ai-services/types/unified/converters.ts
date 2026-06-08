/**
 * Type Converters for Montage Plan
 *
 * Обеспечивают обратную совместимость между старыми и новыми типами
 */

import type { Fragment as DomainFragment, MontagePlan as DomainPlan } from "@/domains/ai-services/types/montage-planner"
import type { Fragment as FeatureFragment } from "@/domains/ai-services/types/montage-planning"
import type {
  FragmentAnalysis,
  MomentScore,
  MontageClip,
  UnifiedFragment,
  UnifiedMontagePlan,
  UnifiedMontageStyle,
} from "./montage-plan"

type LegacyAIDirectorPlan = UnifiedMontagePlan

// ============================================================================
// FRAGMENT CONVERTERS
// ============================================================================

/**
 * Конвертирует legacy MontageClip в UnifiedFragment
 */
export function convertLegacyClipToFragment(clip: MontageClip): UnifiedFragment {
  return {
    id: `${clip.fileId}-${clip.startTime}`,
    videoId: clip.fileId,
    filePath: clip.filePath,
    startTime: clip.startTime,
    endTime: clip.endTime,
    duration: clip.duration,
    objects: [],
    people: [],
    tags: [],
    reason: clip.reason,
    qualityScore: clip.qualityScore,
    metadata: clip.metadata,
  }
}

/**
 * Конвертирует domain Fragment в UnifiedFragment
 */
export function convertDomainFragmentToUnified(fragment: DomainFragment): UnifiedFragment {
  return {
    id: fragment.id,
    videoId: fragment.videoId,
    sourceFile: fragment.sourceFile,
    startTime: fragment.startTime,
    endTime: fragment.endTime,
    duration: fragment.duration,
    screenshotPath: fragment.screenshotPath,
    objects: fragment.objects,
    people: fragment.people,
    transitionId: fragment.transitionId,
    transition: fragment.transition as UnifiedFragment["transition"],
    effectId: fragment.effectId,
    effect: fragment.effect as UnifiedFragment["effect"],
    analysis: fragment.analysis,
    tags: [],
  }
}

/**
 * Конвертирует feature Fragment в UnifiedFragment
 */
export function convertFeatureFragmentToUnified(fragment: FeatureFragment): UnifiedFragment {
  return {
    id: fragment.id,
    videoId: fragment.videoId,
    sourceFile: fragment.sourceFile,
    startTime: fragment.startTime,
    endTime: fragment.endTime,
    duration: fragment.duration,
    screenshotPath: fragment.screenshotPath,
    objects: fragment.objects,
    people: fragment.people,
    transitionId: fragment.transitionId,
    transition: fragment.transition,
    effectId: fragment.effectId,
    effect: fragment.effect,
    score: fragment.score,
    tags: fragment.tags,
    description: fragment.description,
  }
}

/**
 * Конвертирует UnifiedFragment обратно в domain Fragment
 */
export function convertUnifiedToDomainFragment(fragment: UnifiedFragment): DomainFragment {
  // Создаем FragmentAnalysis из доступных данных
  const analysis: FragmentAnalysis = fragment.analysis || {
    quality: fragment.qualityScore || 0.5,
    motion: 0.5,
    faceCount: fragment.people.length,
    objectsOfInterest: fragment.objects,
    audioQuality: 0.5,
    duration: fragment.duration,
    brightnessVariation: 0.5,
    colorfulness: 0.5,
    sharpness: 0.5,
    contrast: 0.5,
    visualComplexity: 0.5,
    audioLoudness: -20,
    speechPresence: false,
  }

  return {
    id: fragment.id,
    videoId: fragment.videoId,
    sourceFile: fragment.sourceFile,
    startTime: fragment.startTime,
    endTime: fragment.endTime,
    duration: fragment.duration,
    screenshotPath: fragment.screenshotPath,
    objects: fragment.objects,
    people: fragment.people,
    transitionId: fragment.transitionId,
    transition: fragment.transition as DomainFragment["transition"],
    effectId: fragment.effectId,
    effect: fragment.effect as DomainFragment["effect"],
    analysis,
  }
}

// ============================================================================
// MONTAGE PLAN CONVERTERS
// ============================================================================

/**
 * Конвертирует legacy AI Director plan в Unified plan
 */
export function convertLegacyAIDirectorPlanToUnified(plan: LegacyAIDirectorPlan): UnifiedMontagePlan {
  // Since LegacyAIDirectorPlan is now UnifiedMontagePlan, clips are already UnifiedFragment[]
  const clips = plan.clips || plan.fragments || []
  return {
    id: plan.id,
    name: plan.name,
    title: plan.name,
    description: plan.description,
    style: plan.style as UnifiedMontageStyle,
    clips: clips,
    totalDuration: plan.actualDuration || plan.targetDuration || plan.totalDuration || 0,
    targetDuration: plan.targetDuration || plan.totalDuration || 0,
    actualDuration: plan.actualDuration,
    transitions: plan.transitions.map((t) => ({
      type: t.type,
      duration: t.duration,
      afterClipIndex: t.afterClipIndex,
      atTime: t.atTime,
    })),
    music: plan.music || plan.musicSettings,
    musicSettings: plan.music || plan.musicSettings,
    texts: plan.texts,
    textSettings: plan.textSettings,
    metadata: {
      averageQuality: 0.5,
      sourceFilesCount: plan.metadata?.sourceFilesCount,
      usedFilesCount: plan.metadata?.usedFilesCount,
      usagePercentage: plan.metadata?.usagePercentage,
    },
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt || plan.createdAt,
    version: 1,
  }
}

/**
 * Конвертирует domain plan в Unified plan
 */
export function convertDomainPlanToUnified(plan: DomainPlan): UnifiedMontagePlan {
  return {
    id: plan.id,
    name: plan.title, // domain использует title
    title: plan.title,
    style: plan.style as UnifiedMontageStyle,
    fragments: plan.fragments.map(convertDomainFragmentToUnified),
    totalDuration: plan.totalDuration,
    targetDuration: plan.targetDuration,
    transitions: [],
    instructions: plan.instructions,
    metadata: {
      analysisDuration: plan.metadata.analysisDuration,
      generationDuration: plan.metadata.generationDuration,
      averageQuality: plan.metadata.averageQuality,
      totalFragments: plan.metadata.totalFragments,
    },
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    version: plan.version,
  }
}

/**
 * Конвертирует Unified plan обратно в legacy AI Director plan
 */
export function convertUnifiedToLegacyAIDirectorPlan(plan: UnifiedMontagePlan): LegacyAIDirectorPlan {
  // Получаем clips из sequences или напрямую из clips
  const clips: UnifiedFragment[] = plan.sequences
    ? plan.sequences.flatMap((seq) =>
        seq.fragments.map((f) => ({
          id: f.id,
          videoId: f.videoId,
          filePath: f.filePath || "",
          startTime: f.startTime,
          endTime: f.endTime,
          duration: f.duration,
          objects: f.objects || [],
          people: f.people || [],
          tags: f.tags || [],
          reason: f.reason || f.description || "",
          qualityScore: f.qualityScore || f.analysis?.quality,
          metadata: f.metadata,
        })),
      )
    : (plan.clips || plan.fragments || []).map((f) => ({
        id: f.id,
        videoId: f.videoId,
        filePath: f.filePath || "",
        startTime: f.startTime,
        endTime: f.endTime,
        duration: f.duration,
        objects: f.objects || [],
        people: f.people || [],
        tags: f.tags || [],
        reason: f.reason || f.description || "",
        qualityScore: f.qualityScore || f.analysis?.quality,
        metadata: f.metadata,
      }))

  return {
    id: plan.id,
    name: plan.name,
    title: plan.title || plan.name,
    style: plan.style as LegacyAIDirectorPlan["style"],
    targetDuration: plan.targetDuration || plan.totalDuration,
    actualDuration: plan.actualDuration || plan.totalDuration,
    clips,
    transitions: plan.transitions.map((t) => ({
      type: t.type,
      duration: t.duration,
      afterClipIndex: t.afterClipIndex,
      atTime: t.atTime,
    })),
    music: plan.music || plan.musicSettings,
    musicSettings: plan.music || plan.musicSettings,
    texts: plan.texts,
    textSettings: plan.textSettings,
    description: plan.description,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    version: plan.version || 1,
    metadata: {
      sourceFilesCount: plan.metadata?.sourceFilesCount ?? 0,
      usedFilesCount: plan.metadata?.usedFilesCount ?? 0,
      usagePercentage: plan.metadata?.usagePercentage,
      averageQuality: plan.metadata?.averageQuality ?? 0.8,
    },
    totalDuration: plan.totalDuration,
  }
}

/**
 * Конвертирует Unified plan обратно в domain plan
 */
export function convertUnifiedToDomainPlan(plan: UnifiedMontagePlan): DomainPlan {
  // Получаем fragments из sequences или напрямую
  const fragments = plan.sequences
    ? plan.sequences.flatMap((seq) => seq.fragments.map(convertUnifiedToDomainFragment))
    : (plan.fragments || plan.clips || []).map(convertUnifiedToDomainFragment)

  return {
    id: plan.id,
    title: plan.title || plan.name,
    fragments,
    totalDuration: plan.totalDuration,
    targetDuration: plan.targetDuration,
    style: plan.style as string,
    instructions: plan.instructions || "",
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    version: plan.version,
    metadata: {
      analysisDuration: plan.metadata.analysisDuration ?? 0,
      generationDuration: plan.metadata.generationDuration ?? 0,
      averageQuality: plan.metadata.averageQuality ?? 0.5,
      totalFragments: fragments.length,
    },
  }
}

// ============================================================================
// ANALYSIS CONVERTERS
// ============================================================================

/**
 * Конвертирует MomentScore в FragmentAnalysis
 */
export function convertMomentScoreToAnalysis(score: MomentScore): FragmentAnalysis {
  return {
    quality: score.scores.technical / 100,
    motion: score.scores.action / 100,
    faceCount: 0,
    objectsOfInterest: [],
    audioQuality: 0.5,
    duration: score.duration,
    brightnessVariation: score.scores.visual / 100,
    colorfulness: score.scores.composition / 100,
    sharpness: score.scores.technical / 100,
    contrast: 0.5,
    visualComplexity: score.scores.composition / 100,
    audioLoudness: -20,
    speechPresence: false,
    sentiment: score.scores.emotional > 60 ? "positive" : score.scores.emotional < 40 ? "negative" : "neutral",
  }
}

/**
 * Конвертирует FragmentAnalysis в упрощенный score
 */
export function convertAnalysisToSimpleScore(analysis: FragmentAnalysis): number {
  const weights = {
    quality: 0.3,
    motion: 0.2,
    audioQuality: 0.2,
    sharpness: 0.15,
    colorfulness: 0.15,
  }

  return (
    analysis.quality * weights.quality +
    analysis.motion * weights.motion +
    analysis.audioQuality * weights.audioQuality +
    analysis.sharpness * weights.sharpness +
    analysis.colorfulness * weights.colorfulness
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Проверяет, является ли план legacy форматом (AI Director)
 */
export function isLegacyPlan(plan: unknown): plan is LegacyAIDirectorPlan {
  return (
    typeof plan === "object" &&
    plan !== null &&
    "clips" in plan &&
    Array.isArray((plan as LegacyAIDirectorPlan).clips) &&
    !("sequences" in plan) &&
    !("fragments" in plan)
  )
}

/**
 * Проверяет, является ли план domain форматом
 */
export function isDomainPlan(plan: unknown): plan is DomainPlan {
  return (
    typeof plan === "object" &&
    plan !== null &&
    "fragments" in plan &&
    "title" in plan &&
    Array.isArray((plan as DomainPlan).fragments)
  )
}

/**
 * Проверяет, является ли план unified форматом
 */
export function isUnifiedPlan(plan: unknown): plan is UnifiedMontagePlan {
  return (
    typeof plan === "object" &&
    plan !== null &&
    "version" in plan &&
    ("sequences" in plan || "clips" in plan || "fragments" in plan)
  )
}

/**
 * Автоматически конвертирует любой план в Unified формат
 */
export function convertToUnified(plan: unknown): UnifiedMontagePlan {
  if (isUnifiedPlan(plan)) {
    return plan
  }

  if (isLegacyPlan(plan)) {
    return convertLegacyAIDirectorPlanToUnified(plan)
  }

  if (isDomainPlan(plan)) {
    return convertDomainPlanToUnified(plan)
  }

  throw new Error("Unknown montage plan format")
}
