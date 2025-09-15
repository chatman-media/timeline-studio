/**
 * Moment detector service for Smart Montage Planner
 * Identifies key moments and scores them for montage selection
 */

import type {
  AnalysisOptions,
  AudioAnalysis,
  MomentCluster,
  MomentScore,
  TemporalDistribution,
  TimeGap,
  VideoAnalysis,
} from "../types"
import { CameraMovement, EmotionalTone, LightingCondition, MomentCategory, SceneType } from "../types"

export class MomentDetector {
  private static instance: MomentDetector

  private constructor() {}

  public static getInstance(): MomentDetector {
    if (!MomentDetector.instance) {
      MomentDetector.instance = new MomentDetector()
    }
    return MomentDetector.instance
  }

  /**
   * Detect and score moments in video content
   */
  detectMoments(
    videoAnalysis: VideoAnalysis,
    audioAnalysis: AudioAnalysis,
    duration: number,
    options?: AnalysisOptions["momentDetection"],
  ): MomentScore[] {
    const moments: MomentScore[] = []
    const threshold = options?.threshold || 0.7
    const minDuration = options?.minDuration || 1
    const categories = options?.categories || Object.values(MomentCategory)

    // Sample the video at regular intervals
    const sampleInterval = 2 // seconds
    const samples = Math.floor(duration / sampleInterval)

    for (let i = 0; i < samples; i++) {
      const timestamp = i * sampleInterval
      const scores = this.calculateScores(videoAnalysis, audioAnalysis, timestamp)
      const totalScore = this.calculateTotalScore(scores)

      if (totalScore >= threshold * 100) {
        const category = this.determineCategory(scores, videoAnalysis, audioAnalysis)

        if (categories.includes(category)) {
          const moment: MomentScore = {
            timestamp,
            duration: Math.max(sampleInterval, minDuration),
            scores,
            totalScore,
            category,
          }
          moments.push(moment)
        }
      }
    }

    // Merge adjacent moments
    const mergedMoments = this.mergeAdjacentMoments(moments)

    // Refine scores based on context
    return this.refineScores(mergedMoments, videoAnalysis, audioAnalysis)
  }

  /**
   * Calculate individual score components
   */
  private calculateScores(videoAnalysis: VideoAnalysis, audioAnalysis: AudioAnalysis, _timestamp: number) {
    // Visual score based on quality and composition
    const visual =
      (videoAnalysis.quality.sharpness + videoAnalysis.quality.stability + videoAnalysis.quality.colorGrading) / 3

    // Technical score based on overall quality
    const technical = (visual + audioAnalysis.quality.clarity + (100 - audioAnalysis.quality.noiseLevel)) / 3

    // Emotional score based on audio and visual cues
    const emotional = this.calculateEmotionalScore(audioAnalysis, videoAnalysis)

    // Narrative score based on speech and scene changes
    const narrative =
      audioAnalysis.content.speechPresence * 0.6 +
      (videoAnalysis.motion.cameraMovement !== CameraMovement.Static ? 40 : 0)

    // Action score based on motion and energy
    const action = videoAnalysis.content.actionLevel * 0.7 + videoAnalysis.motion.subjectMovement * 0.3

    // Composition score based on detected objects and faces
    const composition = this.calculateCompositionScore(videoAnalysis)

    return {
      visual: Math.min(100, visual),
      technical: Math.min(100, technical),
      emotional: Math.min(100, emotional),
      narrative: Math.min(100, narrative),
      action: Math.min(100, action),
      composition: Math.min(100, composition),
    }
  }

  /**
   * Calculate total weighted score
   */
  private calculateTotalScore(scores: MomentScore["scores"]): number {
    const weights = {
      visual: 0.2,
      technical: 0.15,
      emotional: 0.25,
      narrative: 0.15,
      action: 0.15,
      composition: 0.1,
    }

    let totalScore = 0
    let totalWeight = 0

    for (const [key, value] of Object.entries(scores)) {
      const weight = weights[key as keyof typeof weights] || 0
      totalScore += value * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  /**
   * Determine moment category based on scores
   */
  private determineCategory(
    scores: MomentScore["scores"],
    videoAnalysis: VideoAnalysis,
    audioAnalysis: AudioAnalysis,
  ): MomentCategory {
    // Action moments
    if (scores.action > 80) {
      return MomentCategory.Action
    }

    // Emotional/dramatic moments
    if (scores.emotional > 70 && audioAnalysis.content.speechPresence > 50) {
      return MomentCategory.Drama
    }

    // Comedy moments (high action + specific audio patterns)
    if (scores.action > 60 && audioAnalysis.content.emotionalTone === EmotionalTone.Happy && scores.emotional > 60) {
      return MomentCategory.Comedy
    }

    // Opening moments (good composition, establishing shots)
    if (scores.composition > 80 && videoAnalysis.content.sceneType !== SceneType.Unknown && scores.visual > 70) {
      return MomentCategory.Opening
    }

    // Closing moments (calm, resolving energy)
    if (scores.action < 30 && scores.emotional < 40 && scores.composition > 60) {
      return MomentCategory.Closing
    }

    // B-roll (good quality, low action/narrative)
    if (scores.visual > 70 && scores.action < 40 && scores.narrative < 30) {
      return MomentCategory.BRoll
    }

    // Transition moments
    if (videoAnalysis.motion.cutFriendliness > 80) {
      return MomentCategory.Transition
    }

    // Default to highlight
    return MomentCategory.Highlight
  }

  /**
   * Calculate emotional score from audio and visual cues
   */
  private calculateEmotionalScore(audioAnalysis: AudioAnalysis, videoAnalysis: VideoAnalysis): number {
    let score = 0

    // Audio emotional indicators
    switch (audioAnalysis.content.emotionalTone) {
      case EmotionalTone.Happy:
      case EmotionalTone.Energetic:
        score += 40
        break
      case EmotionalTone.Sad:
      case EmotionalTone.Tense:
        score += 60
        break
      case EmotionalTone.Calm:
        score += 30
        break
      default:
        score += 20
    }

    // Music presence adds emotion
    score += audioAnalysis.content.musicPresence * 0.3

    // Face detection indicates human emotion
    if (videoAnalysis.content.faces.length > 0) {
      score += 20
    }

    // Camera movement can enhance emotion
    if (videoAnalysis.motion.cameraMovement !== CameraMovement.Static) {
      score += 10
    }

    return Math.min(100, score)
  }

  /**
   * Calculate composition score based on visual elements
   */
  private calculateCompositionScore(videoAnalysis: VideoAnalysis): number {
    let score = 50 // Base score

    // Rule of thirds (simulated)
    const hasGoodComposition = Math.random() > 0.5
    if (hasGoodComposition) score += 20

    // Face detection improves composition for human subjects
    if (videoAnalysis.content.faces.length > 0) {
      score += 15
    }

    // Too many objects can clutter composition
    if (videoAnalysis.content.objects.length > 5) {
      score -= 10
    } else if (videoAnalysis.content.objects.length >= 2) {
      score += 10
    }

    // Good lighting improves composition
    if (
      videoAnalysis.content.lighting === LightingCondition.Bright ||
      videoAnalysis.content.lighting === LightingCondition.Normal
    ) {
      score += 10
    }

    // Stable shots have better composition
    score += videoAnalysis.quality.stability * 0.15

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Merge adjacent moments that are close together
   */
  private mergeAdjacentMoments(moments: MomentScore[]): MomentScore[] {
    if (moments.length <= 1) return moments

    const merged: MomentScore[] = []
    let current = moments[0]

    for (let i = 1; i < moments.length; i++) {
      const next = moments[i]
      const gap = next.timestamp - (current.timestamp + current.duration)

      // Merge if gap is less than 2 seconds
      if (gap < 2) {
        // Create merged moment
        current = {
          timestamp: current.timestamp,
          duration: next.timestamp + next.duration - current.timestamp,
          scores: this.averageScores(current.scores, next.scores),
          totalScore: (current.totalScore + next.totalScore) / 2,
          category: current.totalScore > next.totalScore ? current.category : next.category,
        }
      } else {
        merged.push(current)
        current = next
      }
    }

    merged.push(current)
    return merged
  }

  /**
   * Average two score sets
   */
  private averageScores(scores1: MomentScore["scores"], scores2: MomentScore["scores"]): MomentScore["scores"] {
    return {
      visual: (scores1.visual + scores2.visual) / 2,
      technical: (scores1.technical + scores2.technical) / 2,
      emotional: (scores1.emotional + scores2.emotional) / 2,
      narrative: (scores1.narrative + scores2.narrative) / 2,
      action: (scores1.action + scores2.action) / 2,
      composition: (scores1.composition + scores2.composition) / 2,
    }
  }

  /**
   * Refine scores based on context and neighboring moments
   */
  private refineScores(
    moments: MomentScore[],
    _videoAnalysis: VideoAnalysis,
    audioAnalysis: AudioAnalysis,
  ): MomentScore[] {
    return moments.map((moment, index) => {
      let refinedScore = moment.totalScore

      // Boost score for moments with speech
      if (audioAnalysis.content.speechPresence > 70) {
        refinedScore *= 1.1
      }

      // Boost score for moments with music beats (if available)
      if (audioAnalysis.music?.beatMarkers) {
        const nearBeat = audioAnalysis.music.beatMarkers.some((beat) => Math.abs(beat - moment.timestamp) < 0.5)
        if (nearBeat) {
          refinedScore *= 1.15
        }
      }

      // Reduce score for moments too close to each other
      if (index > 0) {
        const prevMoment = moments[index - 1]
        const gap = moment.timestamp - (prevMoment.timestamp + prevMoment.duration)
        if (gap < 5) {
          refinedScore *= 0.9
        }
      }

      // Boost opening/closing moments at appropriate positions
      const relativePosition = moment.timestamp / (moments[moments.length - 1]?.timestamp || 1)
      if (moment.category === MomentCategory.Opening && relativePosition < 0.2) {
        refinedScore *= 1.2
      } else if (moment.category === MomentCategory.Closing && relativePosition > 0.8) {
        refinedScore *= 1.2
      }

      return {
        ...moment,
        totalScore: Math.min(100, refinedScore),
        weight: 1.0,
        rank: index + 1, // Initial ranking by order
      }
    })
  }

  /**
   * Score a single moment at a specific timestamp
   */
  public scoreMoment(
    videoAnalysis: VideoAnalysis,
    audioAnalysis: AudioAnalysis,
    timestamp: number,
    duration: number,
  ): MomentScore {
    const scores = this.calculateScores(videoAnalysis, audioAnalysis, timestamp)
    const totalScore = this.calculateTotalScore(scores)
    const category = this.determineCategory(scores, videoAnalysis, audioAnalysis)

    return {
      timestamp,
      duration,
      scores,
      totalScore,
      category,
      weight: 1.0,
      rank: 0, // Will be set by rankMoments
    }
  }

  /**
   * Rank moments by their total score
   */
  public rankMoments(moments: MomentScore[]): MomentScore[] {
    // Sort by total score descending
    const sorted = [...moments].sort((a, b) => b.totalScore - a.totalScore)

    // Assign ranks
    return sorted.map((moment, index) => ({
      ...moment,
      rank: index + 1,
    }))
  }

  /**
   * Filter moments by minimum score
   */
  public filterByScore(moments: MomentScore[], minScore: number): MomentScore[] {
    return moments.filter((moment) => moment.totalScore >= minScore)
  }

  /**
   * Filter moments by categories
   */
  public filterByCategory(moments: MomentScore[], categories: MomentCategory[]): MomentScore[] {
    return moments.filter((moment) => categories.includes(moment.category))
  }

  /**
   * Group moments by category
   */
  public groupByCategory(moments: MomentScore[]): Record<MomentCategory, MomentScore[]> {
    const groups: Partial<Record<MomentCategory, MomentScore[]>> = {}

    for (const moment of moments) {
      if (!groups[moment.category]) {
        groups[moment.category] = []
      }
      groups[moment.category]!.push(moment)
    }

    return groups as Record<MomentCategory, MomentScore[]>
  }

  /**
   * Analyze temporal distribution of moments
   */
  public analyzeTemporalDistribution(moments: MomentScore[], videoDuration: number): TemporalDistribution {
    // Sort by timestamp
    const sorted = [...moments].sort((a, b) => a.timestamp - b.timestamp)

    // Calculate density (moments per minute)
    const density = (moments.length / videoDuration) * 60

    // Find gaps
    const gaps: TimeGap[] = []
    let lastEnd = 0

    for (const moment of sorted) {
      if (moment.timestamp > lastEnd) {
        gaps.push({
          start: lastEnd,
          end: moment.timestamp,
          duration: moment.timestamp - lastEnd,
        })
      }
      lastEnd = moment.timestamp + moment.duration
    }

    // Add final gap if exists
    if (lastEnd < videoDuration) {
      gaps.push({
        start: lastEnd,
        end: videoDuration,
        duration: videoDuration - lastEnd,
      })
    }

    // Find clusters (groups of moments close together)
    const clusters: MomentCluster[] = []
    let currentCluster: MomentScore[] = []
    const clusterThreshold = 5 // seconds

    for (const moment of sorted) {
      if (currentCluster.length === 0) {
        currentCluster.push(moment)
      } else {
        const lastMoment = currentCluster[currentCluster.length - 1]
        const gap = moment.timestamp - (lastMoment.timestamp + lastMoment.duration)

        if (gap <= clusterThreshold) {
          currentCluster.push(moment)
        } else {
          // Save current cluster and start new one
          if (currentCluster.length > 1) {
            clusters.push({
              moments: [...currentCluster],
              startTime: currentCluster[0].timestamp,
              endTime:
                currentCluster[currentCluster.length - 1].timestamp +
                currentCluster[currentCluster.length - 1].duration,
              density:
                currentCluster.length /
                (currentCluster[currentCluster.length - 1].timestamp +
                  currentCluster[currentCluster.length - 1].duration -
                  currentCluster[0].timestamp),
            })
          }
          currentCluster = [moment]
        }
      }
    }

    // Don't forget the last cluster
    if (currentCluster.length > 1) {
      clusters.push({
        moments: currentCluster,
        startTime: currentCluster[0].timestamp,
        endTime:
          currentCluster[currentCluster.length - 1].timestamp + currentCluster[currentCluster.length - 1].duration,
        density:
          currentCluster.length /
          (currentCluster[currentCluster.length - 1].timestamp +
            currentCluster[currentCluster.length - 1].duration -
            currentCluster[0].timestamp),
      })
    }

    return {
      density,
      gaps,
      clusters,
      coverage: moments.reduce((sum, m) => sum + m.duration, 0) / videoDuration,
    }
  }

  /**
   * Optimize moment selection for target duration
   */
  public optimizeMomentSelection(
    moments: MomentScore[],
    targetDuration: number,
    options?: {
      diversityWeight?: number
      qualityThreshold?: number
      maxGap?: number
    },
  ): MomentScore[] {
    const diversityWeight = options?.diversityWeight ?? 0.3
    const qualityThreshold = options?.qualityThreshold ?? 60
    const maxGap = options?.maxGap ?? 10

    // Filter by quality threshold
    let candidates = this.filterByScore(moments, qualityThreshold)

    // Sort by timestamp
    candidates = [...candidates].sort((a, b) => a.timestamp - b.timestamp)

    // Dynamic programming approach
    const selected: MomentScore[] = []
    let currentDuration = 0
    let lastCategory: MomentCategory | null = null
    let lastEnd = 0

    while (currentDuration < targetDuration && candidates.length > 0) {
      let bestMoment: MomentScore | null = null
      let bestScore = -1
      let bestIndex = -1

      for (let i = 0; i < candidates.length; i++) {
        const moment = candidates[i]

        // Skip if too close to last selected
        if (moment.timestamp < lastEnd) continue

        // Skip if gap is too large
        if (lastEnd > 0 && moment.timestamp - lastEnd > maxGap) continue

        // Calculate selection score
        let score = moment.totalScore

        // Apply diversity bonus
        if (lastCategory && moment.category !== lastCategory) {
          score *= 1 + diversityWeight
        }

        // Penalize if would exceed target duration
        if (currentDuration + moment.duration > targetDuration * 1.1) {
          score *= 0.5
        }

        if (score > bestScore) {
          bestScore = score
          bestMoment = moment
          bestIndex = i
        }
      }

      if (bestMoment && bestIndex >= 0) {
        selected.push(bestMoment)
        currentDuration += bestMoment.duration
        lastCategory = bestMoment.category
        lastEnd = bestMoment.timestamp + bestMoment.duration
        candidates.splice(bestIndex, 1)
      } else {
        // No more suitable moments
        break
      }
    }

    return selected
  }

  /**
   * Find peak moments in the timeline
   */
  public findPeakMoments(
    moments: MomentScore[],
    options?: {
      threshold?: number
      minDistance?: number
    },
  ): MomentScore[] {
    const threshold = options?.threshold ?? 85
    const minDistance = options?.minDistance ?? 10

    // Filter by threshold
    const highScoreMoments = this.filterByScore(moments, threshold)

    // Sort by score descending
    const sorted = [...highScoreMoments].sort((a, b) => b.totalScore - a.totalScore)

    const peaks: MomentScore[] = []

    for (const moment of sorted) {
      // Check if far enough from existing peaks
      const tooClose = peaks.some((peak) => Math.abs(peak.timestamp - moment.timestamp) < minDistance)

      if (!tooClose) {
        peaks.push(moment)
      }
    }

    // Sort peaks by timestamp for chronological order
    return peaks.sort((a, b) => a.timestamp - b.timestamp)
  }
}
