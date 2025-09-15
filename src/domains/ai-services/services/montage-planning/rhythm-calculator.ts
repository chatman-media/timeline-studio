/**
 * Rhythm calculator service for Smart Montage Planner
 * Calculates optimal pacing and rhythm for montage sequences
 */

import {
  type AudioAnalysis,
  type Fragment,
  type MontagePlan,
  type MusicSyncPoint,
  type PacingProfile,
  type PacingType,
  PatternType,
  type RhythmAnalysis,
  type RhythmPattern,
  type TempoChange,
  TempoChangeReason,
} from "../types"

export class RhythmCalculator {
  private static instance: RhythmCalculator

  private constructor() {}

  public static getInstance(): RhythmCalculator {
    if (!RhythmCalculator.instance) {
      RhythmCalculator.instance = new RhythmCalculator()
    }
    return RhythmCalculator.instance
  }

  /**
   * Analyze rhythm of a montage plan
   */
  analyzeRhythm(plan: MontagePlan): RhythmAnalysis {
    const globalTempo = this.calculateGlobalTempo(plan)
    const tempoChanges = this.detectTempoChanges(plan)
    const patterns = this.detectRhythmPatterns(plan)
    const musicSync = this.findMusicSyncPoints(plan)

    return {
      globalTempo,
      tempoChanges,
      patterns,
      musicSync,
    }
  }

  /**
   * Calculate pacing profile for a style
   */
  calculatePacingProfile(style: string, fragments: Fragment[], targetDuration?: number): PacingProfile {
    // Base pacing on style
    const stylePacing = this.getStylePacing(style)

    // Adjust for content
    const contentAdjustedPacing = this.adjustPacingForContent(stylePacing, fragments)

    // Adjust for target duration if specified
    if (targetDuration) {
      return this.adjustPacingForDuration(contentAdjustedPacing, fragments, targetDuration)
    }

    return contentAdjustedPacing
  }

  /**
   * Calculate optimal cut points for fragments
   */
  calculateOptimalCuts(
    fragments: Fragment[],
    pacing: PacingProfile,
    audioAnalysis?: Map<string, AudioAnalysis>,
  ): Fragment[] {
    return fragments.map((fragment) => {
      const optimalDuration = this.calculateOptimalDuration(fragment, pacing, audioAnalysis?.get(fragment.videoId))

      // Adjust fragment duration
      return {
        ...fragment,
        duration: optimalDuration,
        endTime: fragment.startTime + optimalDuration,
      }
    })
  }

  /**
   * Find rhythm patterns in montage
   */
  findRhythmSync(fragments: Fragment[], audioAnalyses: Map<string, AudioAnalysis>): MusicSyncPoint[] {
    const syncPoints: MusicSyncPoint[] = []

    fragments.forEach((fragment) => {
      const audio = audioAnalyses.get(fragment.videoId)
      if (!audio?.music?.beatMarkers) return

      // Find beats within fragment duration
      const fragmentBeats = audio.music.beatMarkers.filter(
        (beat) => beat >= fragment.startTime && beat <= fragment.endTime,
      )

      // Add sync points for strong beats
      fragmentBeats.forEach((beat, index) => {
        const type = this.determineBeatType(index, fragmentBeats.length)
        const strength = this.calculateBeatStrength(beat, audio)

        syncPoints.push({
          timestamp: beat,
          type,
          strength,
        })
      })
    })

    return syncPoints.sort((a, b) => a.timestamp - b.timestamp)
  }

  // Private helper methods

  private calculateGlobalTempo(plan: MontagePlan): number {
    if (!plan.sequences.length) return 0

    const totalCuts = plan.sequences.reduce((sum, seq) => sum + seq.clips.length - 1, 0)
    const totalDuration = plan.totalDuration / 60 // Convert to minutes

    return totalDuration > 0 ? totalCuts / totalDuration : 0
  }

  private detectTempoChanges(plan: MontagePlan): TempoChange[] {
    const changes: TempoChange[] = []
    let previousTempo = 0
    let currentTime = 0

    plan.sequences.forEach((sequence, index) => {
      const sequenceTempo = this.calculateSequenceTempo(sequence)

      if (index > 0 && Math.abs(sequenceTempo - previousTempo) > 5) {
        changes.push({
          timestamp: currentTime,
          oldTempo: previousTempo,
          newTempo: sequenceTempo,
          reason: this.determineTempoChangeReason(sequence),
          smoothness: this.calculateTransitionSmoothness(previousTempo, sequenceTempo),
        })
      }

      previousTempo = sequenceTempo
      currentTime += sequence.duration
    })

    return changes
  }

  private calculateSequenceTempo(sequence: any): number {
    if (sequence.clips.length <= 1) return 0
    const cuts = sequence.clips.length - 1
    const durationMinutes = sequence.duration / 60
    return cuts / durationMinutes
  }

  private determineTempoChangeReason(sequence: any): TempoChangeReason {
    // Determine based on sequence properties
    if (sequence.energyLevel > 80) {
      return TempoChangeReason.ActionIncrease
    }
    if (sequence.emotionalArc.peakEnergy > 85) {
      return TempoChangeReason.EmotionalPeak
    }
    if (sequence.type === "climax") {
      return TempoChangeReason.NarrativeShift
    }
    return TempoChangeReason.SceneChange
  }

  private calculateTransitionSmoothness(oldTempo: number, newTempo: number): number {
    const change = Math.abs(newTempo - oldTempo)
    const maxChange = 50 // Maximum expected tempo change
    return Math.max(0, 100 - (change / maxChange) * 100)
  }

  private detectRhythmPatterns(plan: MontagePlan): RhythmPattern[] {
    const patterns: RhythmPattern[] = []
    let currentTime = 0

    plan.sequences.forEach((sequence) => {
      const pattern = this.analyzeSequencePattern(sequence)
      patterns.push({
        type: pattern,
        startTime: currentTime,
        endTime: currentTime + sequence.duration,
        strength: this.calculatePatternStrength(sequence, pattern),
      })
      currentTime += sequence.duration
    })

    return patterns
  }

  private analyzeSequencePattern(sequence: any): PatternType {
    const clipDurations = sequence.clips.map((clip: any) => clip.fragment?.duration || 0)

    if (clipDurations.length < 2) return PatternType.Regular

    // Calculate variation in clip durations
    const avgDuration = clipDurations.reduce((a: number, b: number) => a + b, 0) / clipDurations.length
    const variance =
      clipDurations.reduce((sum: number, d: number) => sum + (d - avgDuration) ** 2, 0) / clipDurations.length
    const stdDev = Math.sqrt(variance)
    const cv = stdDev / avgDuration // Coefficient of variation

    // Check for acceleration/deceleration
    const trend = this.calculateTrend(clipDurations)

    if (cv < 0.2) {
      return PatternType.Regular
    }
    if (trend > 0.3) {
      return PatternType.Accelerating
    }
    if (trend < -0.3) {
      return PatternType.Decelerating
    }
    if (cv > 0.6) {
      return PatternType.Chaotic
    }
    return PatternType.Syncopated
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    let trend = 0
    for (let i = 1; i < values.length; i++) {
      trend += (values[i] - values[i - 1]) / values[i - 1]
    }
    return trend / (values.length - 1)
  }

  private calculatePatternStrength(sequence: any, pattern: PatternType): number {
    let strength = 50 // Base strength

    // Regular patterns are stronger with consistent energy
    if (pattern === PatternType.Regular) {
      strength += (100 - sequence.emotionalArc.variability) * 0.3
    }

    // Accelerating patterns are stronger with increasing energy
    if (pattern === PatternType.Accelerating && sequence.energyLevel > 70) {
      strength += 20
    }

    // Syncopated patterns work well with music
    if (pattern === PatternType.Syncopated) {
      strength += 15
    }

    return Math.min(100, strength)
  }

  private findMusicSyncPoints(_plan: MontagePlan): MusicSyncPoint[] {
    // This would integrate with actual music analysis
    // For now, return empty array
    return []
  }

  private getStylePacing(style: string): PacingProfile {
    const pacingProfiles: Record<string, PacingProfile> = {
      "dynamic-action": {
        type: "variable" as PacingType,
        averageCutDuration: 2,
        cutDurationRange: [0.5, 4],
        rhythmComplexity: 80,
      },
      "cinematic-drama": {
        type: "steady" as PacingType,
        averageCutDuration: 6,
        cutDurationRange: [3, 12],
        rhythmComplexity: 30,
      },
      "music-video": {
        type: "rhythmic" as PacingType,
        averageCutDuration: 3,
        cutDurationRange: [1, 5],
        rhythmComplexity: 90,
      },
      documentary: {
        type: "steady" as PacingType,
        averageCutDuration: 5,
        cutDurationRange: [3, 10],
        rhythmComplexity: 40,
      },
      "social-media": {
        type: "accelerating" as PacingType,
        averageCutDuration: 1.5,
        cutDurationRange: [0.5, 3],
        rhythmComplexity: 60,
      },
      corporate: {
        type: "steady" as PacingType,
        averageCutDuration: 4,
        cutDurationRange: [2, 8],
        rhythmComplexity: 20,
      },
    }

    return pacingProfiles[style] || pacingProfiles["dynamic-action"]
  }

  private adjustPacingForContent(basePacing: PacingProfile, fragments: Fragment[]): PacingProfile {
    // Calculate average action level
    const avgAction = fragments.reduce((sum, f) => sum + (f.score?.scores.action || 0), 0) / fragments.length

    // Adjust pacing based on content
    const adjustedPacing = { ...basePacing }

    if (avgAction > 70) {
      // High action content needs faster pacing
      adjustedPacing.averageCutDuration *= 0.8
      adjustedPacing.cutDurationRange = [
        adjustedPacing.cutDurationRange[0] * 0.8,
        adjustedPacing.cutDurationRange[1] * 0.8,
      ]
    } else if (avgAction < 30) {
      // Low action content can have slower pacing
      adjustedPacing.averageCutDuration *= 1.2
      adjustedPacing.cutDurationRange = [
        adjustedPacing.cutDurationRange[0] * 1.2,
        adjustedPacing.cutDurationRange[1] * 1.2,
      ]
    }

    return adjustedPacing
  }

  private adjustPacingForDuration(pacing: PacingProfile, fragments: Fragment[], targetDuration: number): PacingProfile {
    const currentDuration = fragments.reduce((sum, f) => sum + f.duration, 0)
    const ratio = targetDuration / currentDuration

    return {
      ...pacing,
      averageCutDuration: pacing.averageCutDuration * ratio,
      cutDurationRange: [pacing.cutDurationRange[0] * ratio, pacing.cutDurationRange[1] * ratio],
    }
  }

  private calculateOptimalDuration(fragment: Fragment, pacing: PacingProfile, audio?: AudioAnalysis): number {
    let baseDuration = pacing.averageCutDuration

    // Adjust based on fragment properties
    const actionFactor = (fragment.score.scores.action || 50) / 50
    const visualFactor = (fragment.score.scores.visual || 50) / 50

    // High action = shorter duration
    baseDuration *= 2 - actionFactor

    // High visual quality = longer duration
    baseDuration *= 0.5 + visualFactor * 0.5

    // Sync with music if available
    if (audio?.music?.tempo) {
      const beatDuration = 60 / audio.music.tempo
      // Round to nearest beat or bar
      const beats = Math.round(baseDuration / beatDuration)
      baseDuration = beats * beatDuration
    }

    // Clamp to pacing range
    return Math.max(pacing.cutDurationRange[0], Math.min(pacing.cutDurationRange[1], baseDuration))
  }

  private determineBeatType(index: number, totalBeats: number): MusicSyncPoint["type"] {
    // Every 4th beat is a bar
    if (index % 4 === 0) return "bar"

    // Every 16th beat is a phrase
    if (index % 16 === 0) return "phrase"

    // Special markers for drops (simplified)
    if (index > totalBeats * 0.6 && index % 32 === 0) return "drop"

    return "beat"
  }

  private calculateBeatStrength(beat: number, audio: AudioAnalysis): number {
    // Base strength on audio energy
    const baseStrength = audio.music?.energy || 50

    // Boost for certain beat positions
    const beatPosition = beat % 4
    const positionBoost = beatPosition === 0 ? 20 : beatPosition === 2 ? 10 : 0

    return Math.min(100, baseStrength + positionBoost)
  }
}
