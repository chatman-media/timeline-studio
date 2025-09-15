/**
 * Plan generator service for Smart Montage Planner
 * Creates optimized montage plans from analyzed fragments
 */

// Using crypto.randomUUID() instead of uuid package (native in modern browsers/Node.js)

import type {
  EmotionalCurve,
  Fragment,
  MontagePlan,
  PacingProfile,
  PlanGenerationOptions,
  PlanMetadata,
  PlannedClip,
  Sequence,
  TransitionPlan,
} from "../types"
import { ClipRole, MONTAGE_STYLES, SequencePurpose, SequenceType, TargetPlatform } from "../types"

// Fallback UUID generator in case crypto.randomUUID is not available

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments (shouldn't be needed in Tauri)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class PlanGenerator {
  private static instance: PlanGenerator

  private constructor() {}

  public static getInstance(): PlanGenerator {
    if (!PlanGenerator.instance) {
      PlanGenerator.instance = new PlanGenerator()
    }
    return PlanGenerator.instance
  }

  /**
   * Generate a montage plan from fragments
   */
  generatePlan(fragments: Fragment[], options: PlanGenerationOptions, pacing: PacingProfile): MontagePlan {
    const style = MONTAGE_STYLES[options.style] || MONTAGE_STYLES["dynamic-action"]

    // Filter and sort fragments based on preferences
    const selectedFragments = this.selectFragments(fragments, options)

    // Group fragments into sequences
    const sequences = this.createSequences(selectedFragments, style, options)

    // Add transitions between clips
    const sequencesWithTransitions = this.addTransitions(sequences, style)

    // Calculate total duration
    const totalDuration = sequences.reduce((sum, seq) => sum + seq.duration, 0)

    // Create plan metadata
    const metadata: PlanMetadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      instructions: options.instructions,
      targetDuration: options.targetDuration,
      targetPlatform: options.targetPlatform,
    }

    // Calculate quality scores
    const qualityScore = this.calculateQualityScore(selectedFragments)
    const engagementScore = this.calculateEngagementScore(sequences, style)
    const coherenceScore = this.calculateCoherenceScore(sequences)

    return {
      id: generateUUID(),
      name: `${style.name} Montage`,
      metadata,
      sequences: sequencesWithTransitions,
      totalDuration,
      style,
      pacing,
      qualityScore,
      engagementScore,
      coherenceScore,
    }
  }

  /**
   * Optimize an existing plan
   */
  optimizePlan(plan: MontagePlan, preferences?: PlanGenerationOptions["preferences"]): MontagePlan {
    let optimizedSequences = [...plan.sequences]

    // Re-order clips within sequences for better flow
    optimizedSequences = this.optimizeClipOrder(optimizedSequences)

    // Adjust durations for better pacing
    optimizedSequences = this.optimizeDurations(optimizedSequences, plan.pacing)

    // Improve transitions
    optimizedSequences = this.optimizeTransitions(optimizedSequences, plan.style)

    // Apply user preferences if provided
    if (preferences) {
      optimizedSequences = this.applyPreferences(optimizedSequences, preferences)
    }

    // Recalculate scores
    const fragments = this.extractFragmentsFromSequences(optimizedSequences)
    const qualityScore = this.calculateQualityScore(fragments)
    const engagementScore = this.calculateEngagementScore(optimizedSequences, plan.style)
    const coherenceScore = this.calculateCoherenceScore(optimizedSequences)

    return {
      ...plan,
      sequences: optimizedSequences,
      qualityScore,
      engagementScore,
      coherenceScore,
      metadata: {
        ...plan.metadata,
        updatedAt: new Date(),
        version: plan.metadata.version + 1,
      },
    }
  }

  // Private helper methods

  private selectFragments(fragments: Fragment[], options: PlanGenerationOptions): Fragment[] {
    let selected = [...fragments]

    // Filter by preferences
    if (options.preferences) {
      const { favorPeople, avoidPeople, favorObjects, avoidObjects } = options.preferences

      selected = selected.filter((fragment) => {
        // Filter by people
        if (favorPeople?.length) {
          const hasFavoredPerson = fragment.people.some((p) => favorPeople.includes(p.id))
          if (!hasFavoredPerson) return false
        }

        if (avoidPeople?.length) {
          const hasAvoidedPerson = fragment.people.some((p) => avoidPeople.includes(p.id))
          if (hasAvoidedPerson) return false
        }

        // Filter by objects
        if (favorObjects?.length) {
          const hasFavoredObject = fragment.objects.some((o) => favorObjects.includes(o))
          if (!hasFavoredObject) return false
        }

        if (avoidObjects?.length) {
          const hasAvoidedObject = fragment.objects.some((o) => avoidObjects.includes(o))
          if (hasAvoidedObject) return false
        }

        return true
      })
    }

    // Sort by score
    selected.sort((a, b) => b.score.totalScore - a.score.totalScore)

    // Limit to target duration if specified
    if (options.targetDuration) {
      let currentDuration = 0
      const limited: Fragment[] = []

      for (const fragment of selected) {
        if (currentDuration + fragment.duration <= options.targetDuration * 1.1) {
          limited.push(fragment)
          currentDuration += fragment.duration
        }
      }

      selected = limited
    }

    return selected
  }

  private createSequences(fragments: Fragment[], style: any, options: PlanGenerationOptions): Sequence[] {
    const sequences: Sequence[] = []
    const emotionalArc = style.emotionalArc

    // Determine sequence structure based on style and duration
    const structure = this.determineStructure(fragments, options)

    // Distribute fragments across sequences
    let fragmentIndex = 0

    structure.forEach((seqDef, _index) => {
      const sequence: Sequence = {
        id: generateUUID(),
        type: seqDef.type,
        clips: [],
        duration: 0,
        purpose: seqDef.purpose,
        energyLevel: this.calculateSequenceEnergy(seqDef.type, emotionalArc),
        emotionalArc: this.createSequenceEmotionalArc(seqDef.type, emotionalArc),
        transitions: [],
      }

      // Add clips to sequence
      const clipCount = Math.ceil(fragments.length * seqDef.proportion)
      for (let i = 0; i < clipCount && fragmentIndex < fragments.length; i++) {
        const fragment = fragments[fragmentIndex++]
        const clip: PlannedClip = {
          fragmentId: fragment.id,
          fragment,
          sequenceOrder: i,
          role: this.determineClipRole(fragment, i, clipCount),
          importance: fragment.score.totalScore,
          suggestions: [],
        }

        sequence.clips.push(clip)
        sequence.duration += fragment.duration
      }

      sequences.push(sequence)
    })

    return sequences
  }

  private determineStructure(
    fragments: Fragment[],
    options: PlanGenerationOptions,
  ): Array<{ type: SequenceType; purpose: SequencePurpose; proportion: number }> {
    const totalDuration = fragments.reduce((sum, f) => sum + f.duration, 0)

    // Short form (< 1 minute)
    if (totalDuration < 60 || options.targetPlatform === TargetPlatform.TikTok) {
      return [
        { type: SequenceType.Intro, purpose: SequencePurpose.Hook, proportion: 0.2 },
        { type: SequenceType.Main, purpose: SequencePurpose.Development, proportion: 0.6 },
        { type: SequenceType.Outro, purpose: SequencePurpose.CallToAction, proportion: 0.2 },
      ]
    }

    // Medium form (1-5 minutes)
    if (totalDuration < 300) {
      return [
        { type: SequenceType.Intro, purpose: SequencePurpose.Hook, proportion: 0.15 },
        { type: SequenceType.Main, purpose: SequencePurpose.Exposition, proportion: 0.25 },
        { type: SequenceType.Climax, purpose: SequencePurpose.Climax, proportion: 0.35 },
        { type: SequenceType.Resolution, purpose: SequencePurpose.Resolution, proportion: 0.15 },
        { type: SequenceType.Outro, purpose: SequencePurpose.CallToAction, proportion: 0.1 },
      ]
    }

    // Long form (> 5 minutes)
    return [
      { type: SequenceType.Intro, purpose: SequencePurpose.Hook, proportion: 0.1 },
      { type: SequenceType.Main, purpose: SequencePurpose.Exposition, proportion: 0.2 },
      { type: SequenceType.Main, purpose: SequencePurpose.Development, proportion: 0.25 },
      { type: SequenceType.Climax, purpose: SequencePurpose.Climax, proportion: 0.25 },
      { type: SequenceType.Resolution, purpose: SequencePurpose.Resolution, proportion: 0.15 },
      { type: SequenceType.Outro, purpose: SequencePurpose.CallToAction, proportion: 0.05 },
    ]
  }

  private calculateSequenceEnergy(type: SequenceType, styleArc: EmotionalCurve): number {
    const energyMap: Record<SequenceType, number> = {
      [SequenceType.Intro]: styleArc.startEnergy,
      [SequenceType.Main]: (styleArc.startEnergy + styleArc.peakEnergy) / 2,
      [SequenceType.Climax]: styleArc.peakEnergy,
      [SequenceType.Resolution]: (styleArc.peakEnergy + styleArc.endEnergy) / 2,
      [SequenceType.Outro]: styleArc.endEnergy,
      [SequenceType.Montage]: styleArc.peakEnergy * 0.8,
    }

    return energyMap[type] || 50
  }

  private createSequenceEmotionalArc(type: SequenceType, styleArc: EmotionalCurve): EmotionalCurve {
    // Create a mini emotional arc for each sequence
    const baseEnergy = this.calculateSequenceEnergy(type, styleArc)

    return {
      startEnergy: baseEnergy * 0.9,
      peakPosition: 0.6,
      peakEnergy: Math.min(100, baseEnergy * 1.2),
      endEnergy: baseEnergy,
      variability: styleArc.variability * 0.5,
    }
  }

  private determineClipRole(fragment: Fragment, index: number, total: number): ClipRole {
    const position = index / total

    // First clip is often establishing
    if (index === 0) return ClipRole.Establishing

    // High score fragments are heroes
    if (fragment.score.totalScore > 80) return ClipRole.Hero

    // Low action fragments in the middle are often filler
    if (position > 0.3 && position < 0.7 && fragment.score.scores.action < 30) {
      return ClipRole.Filler
    }

    // Transition-friendly fragments
    if (fragment.score.scores.visual > 70 && fragment.score.scores.action < 50) {
      return ClipRole.Transition
    }

    return ClipRole.Supporting
  }

  private addTransitions(sequences: Sequence[], style: any): Sequence[] {
    return sequences.map((sequence) => {
      const transitions: TransitionPlan[] = []

      // Add transitions between clips in sequence
      for (let i = 0; i < sequence.clips.length - 1; i++) {
        const fromClip = sequence.clips[i]
        const toClip = sequence.clips[i + 1]

        transitions.push({
          fromClipId: fromClip.fragmentId,
          toClipId: toClip.fragmentId,
          transitionId: this.selectTransition(fromClip, toClip, style),
          duration: 0.5, // Default transition duration
        })
      }

      return {
        ...sequence,
        transitions,
      }
    })
  }

  private selectTransition(from: PlannedClip, to: PlannedClip, style: any): string {
    const preferredTypes = style.transitions.preferredTypes

    // Simple selection based on clip properties
    if (from.fragment && to.fragment) {
      const energyDiff = Math.abs(from.fragment.score.scores.action - to.fragment.score.scores.action)

      // High energy difference = more dramatic transition
      if (energyDiff > 50) {
        return preferredTypes.find((t: string) => t.includes("flash") || t.includes("glitch")) || "cut"
      }
    }

    // Default to first preferred type
    return preferredTypes[0] || "cut"
  }

  private calculateQualityScore(fragments: Fragment[]): number {
    if (fragments.length === 0) return 0

    const avgScore = fragments.reduce((sum, f) => sum + f.score.scores.technical, 0) / fragments.length

    return Math.min(100, avgScore)
  }

  private calculateEngagementScore(sequences: Sequence[], style: any): number {
    let score = 50 // Base score

    // Variety in sequence types
    const uniqueTypes = new Set(sequences.map((s) => s.type)).size
    score += uniqueTypes * 5

    // Energy variation
    const energyVariation = this.calculateEnergyVariation(sequences)
    score += energyVariation * 0.3

    // Transition frequency matches style
    const transitionScore = this.calculateTransitionScore(sequences, style)
    score += transitionScore * 0.2

    return Math.min(100, score)
  }

  private calculateCoherenceScore(sequences: Sequence[]): number {
    let score = 70 // Base score

    // Check for proper sequence flow
    const hasIntro = sequences.some((s) => s.type === SequenceType.Intro)
    const hasOutro = sequences.some((s) => s.type === SequenceType.Outro)

    if (hasIntro) score += 10
    if (hasOutro) score += 10

    // Check energy flow
    const energyFlow = this.checkEnergyFlow(sequences)
    score += energyFlow * 10

    return Math.min(100, score)
  }

  private calculateEnergyVariation(sequences: Sequence[]): number {
    if (sequences.length < 2) return 0

    const energies = sequences.map((s) => s.energyLevel)
    const avg = energies.reduce((a, b) => a + b, 0) / energies.length
    const variance = energies.reduce((sum, e) => sum + (e - avg) ** 2, 0) / energies.length

    return Math.sqrt(variance)
  }

  private calculateTransitionScore(sequences: Sequence[], style: any): number {
    const totalTransitions = sequences.reduce((sum, s) => sum + s.transitions.length, 0)
    const totalClips = sequences.reduce((sum, s) => sum + s.clips.length, 0)

    if (totalClips === 0) return 0

    const transitionRatio = totalTransitions / totalClips
    const targetRatio = style.transitions.frequency / 100

    // Score based on how close we are to target ratio
    const difference = Math.abs(transitionRatio - targetRatio)
    return Math.max(0, 100 - difference * 200)
  }

  private checkEnergyFlow(sequences: Sequence[]): number {
    // Check if energy follows expected pattern (build up to climax, then resolve)
    let maxEnergyIndex = 0
    let maxEnergy = 0

    sequences.forEach((seq, index) => {
      if (seq.energyLevel > maxEnergy) {
        maxEnergy = seq.energyLevel
        maxEnergyIndex = index
      }
    })

    // Ideal is climax around 60-80% through
    const idealPosition = 0.7
    const actualPosition = maxEnergyIndex / (sequences.length - 1)
    const difference = Math.abs(actualPosition - idealPosition)

    return 1 - difference
  }

  private optimizeClipOrder(sequences: Sequence[]): Sequence[] {
    return sequences.map((sequence) => {
      // Sort clips by visual flow and energy
      const optimizedClips = [...sequence.clips].sort((a, b) => {
        // Prioritize establishing shots at the beginning
        if (a.role === ClipRole.Establishing) return -1
        if (b.role === ClipRole.Establishing) return 1

        // Then heroes
        if (a.role === ClipRole.Hero && b.role !== ClipRole.Hero) return -1
        if (b.role === ClipRole.Hero && a.role !== ClipRole.Hero) return 1

        // Then by importance
        return b.importance - a.importance
      })

      return {
        ...sequence,
        clips: optimizedClips,
      }
    })
  }

  private optimizeDurations(sequences: Sequence[], pacing: PacingProfile): Sequence[] {
    return sequences.map((sequence) => {
      const optimizedClips = sequence.clips.map((clip) => {
        if (!clip.fragment) return clip

        // Adjust duration based on pacing and importance
        const importanceFactor = clip.importance / 100
        const targetDuration = pacing.averageCutDuration * (0.5 + importanceFactor)

        // Don't change duration too drastically
        const currentDuration = clip.fragment.duration
        const optimizedDuration = currentDuration * 0.5 + targetDuration * 0.5

        return {
          ...clip,
          fragment: {
            ...clip.fragment,
            duration: optimizedDuration,
            endTime: clip.fragment.startTime + optimizedDuration,
          },
        }
      })

      // Recalculate sequence duration
      const newDuration = optimizedClips.reduce((sum, clip) => sum + (clip.fragment?.duration || 0), 0)

      return {
        ...sequence,
        clips: optimizedClips,
        duration: newDuration,
      }
    })
  }

  private optimizeTransitions(sequences: Sequence[], style: any): Sequence[] {
    return sequences.map((sequence) => {
      const optimizedTransitions = sequence.transitions.map((transition) => {
        // Adjust transition duration based on style
        const baseDuration = 0.5
        const complexity = style.transitions.complexity / 100
        const optimizedDuration = baseDuration * (0.5 + complexity)

        return {
          ...transition,
          duration: optimizedDuration,
        }
      })

      return {
        ...sequence,
        transitions: optimizedTransitions,
      }
    })
  }

  private applyPreferences(
    sequences: Sequence[],
    preferences: NonNullable<PlanGenerationOptions["preferences"]>,
  ): Sequence[] {
    return sequences.map((sequence) => {
      let clips = [...sequence.clips]

      // Apply duration constraints
      if (preferences.minClipDuration || preferences.maxClipDuration) {
        clips = clips.map((clip) => {
          if (!clip.fragment) return clip

          let duration = clip.fragment.duration
          if (preferences.minClipDuration) {
            duration = Math.max(duration, preferences.minClipDuration)
          }
          if (preferences.maxClipDuration) {
            duration = Math.min(duration, preferences.maxClipDuration)
          }

          return {
            ...clip,
            fragment: {
              ...clip.fragment,
              duration,
              endTime: clip.fragment.startTime + duration,
            },
          }
        })
      }

      // Recalculate duration
      const newDuration = clips.reduce((sum, clip) => sum + (clip.fragment?.duration || 0), 0)

      return {
        ...sequence,
        clips,
        duration: newDuration,
      }
    })
  }

  private extractFragmentsFromSequences(sequences: Sequence[]): Fragment[] {
    const fragments: Fragment[] = []

    sequences.forEach((sequence) => {
      sequence.clips.forEach((clip) => {
        if (clip.fragment) {
          fragments.push(clip.fragment)
        }
      })
    })

    return fragments
  }
}
