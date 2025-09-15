/**
 * Content analyzer service for Smart Montage Planner
 * Coordinates video and audio analysis to extract meaningful data
 */

import type { MediaFile } from "@/features/media/types/media"
import type { AnalysisOptions, AudioAnalysis, Fragment, MomentScore, VideoAnalysis } from "../types"
import { CameraMovement, EmotionalTone, FlowDirection, LightingCondition, SceneType } from "../types"
import { getMontagePlannerAI } from "./montage-planner-ai-integration"

export class ContentAnalyzer {
  private static instance: ContentAnalyzer
  private aiService = getMontagePlannerAI()

  private constructor() {}

  public static getInstance(): ContentAnalyzer {
    if (!ContentAnalyzer.instance) {
      ContentAnalyzer.instance = new ContentAnalyzer()
    }
    return ContentAnalyzer.instance
  }

  /**
   * Analyze video content for quality, motion, and composition
   */
  async analyzeVideo(
    _videoId: string,
    file: MediaFile,
    options: AnalysisOptions["videoAnalysis"],
  ): Promise<VideoAnalysis> {
    try {
      // Try to use AI service first
      if (options?.enableObjectDetection || options?.enableSceneDetection) {
        return await this.aiService.analyzeVideoWithAI(file)
      }
    } catch (error) {
      console.warn("[ContentAnalyzer] AI analysis failed, using fallback:", error)
    }

    // Fallback to simulated analysis
    const width = 1920 // file.width || 1920 - MediaFile doesn't have width property
    const height = 1080 // file.height || 1080 - MediaFile doesn't have height property
    const frameRate = 30 // file.frameRate || 30 - MediaFile doesn't have frameRate property

    return {
      quality: {
        resolution: { width, height },
        frameRate,
        bitrate: 5000000, // file.bitrate || 5000000 - MediaFile doesn't have bitrate property
        sharpness: this.calculateSharpness(width, height),
        stability: Math.random() * 30 + 70, // 70-100
        exposure: (Math.random() - 0.5) * 40, // -20 to 20
        colorGrading: Math.random() * 20 + 80, // 80-100
      },
      content: {
        actionLevel: Math.random() * 100,
        faces: this.generateFaceDetections(),
        objects: this.generateObjectDetections(),
        sceneType: this.detectSceneType(),
        lighting: this.detectLightingCondition(),
      },
      motion: {
        cameraMovement: this.detectCameraMovement(),
        subjectMovement: Math.random() * 100,
        flowDirection: this.detectFlowDirection(),
        cutFriendliness: Math.random() * 30 + 70, // 70-100
      },
    }
  }

  /**
   * Analyze audio content for quality, speech, and music
   */
  async analyzeAudio(
    _videoId: string,
    file: MediaFile,
    options: AnalysisOptions["audioAnalysis"],
  ): Promise<AudioAnalysis> {
    const hasAudio = file.isAudio !== false

    if (!hasAudio) {
      return this.getEmptyAudioAnalysis()
    }

    try {
      // Try to use AI service first
      if (options?.enableSpeechDetection || options?.enableMusicAnalysis) {
        return await this.aiService.analyzeAudioWithAI(file)
      }
    } catch (error) {
      console.warn("[ContentAnalyzer] AI audio analysis failed, using fallback:", error)
    }

    // Fallback to simulated analysis
    return {
      quality: {
        sampleRate: 48000, // file.audioSampleRate || 48000 - MediaFile doesn't have audioSampleRate property
        bitDepth: 16, // file.audioBitDepth || 16 - MediaFile doesn't have audioBitDepth property
        noiseLevel: Math.random() * 30, // 0-30
        clarity: Math.random() * 30 + 70, // 70-100
        dynamicRange: Math.random() * 20 + 40, // 40-60 dB
      },
      content: {
        speechPresence: options?.enableSpeechDetection ? Math.random() * 100 : 0,
        musicPresence: options?.enableMusicAnalysis ? Math.random() * 100 : 0,
        ambientLevel: Math.random() * 50,
        emotionalTone: this.detectEmotionalTone(),
      },
      music: options?.enableMusicAnalysis
        ? {
            tempo: Math.floor(Math.random() * 80) + 80, // 80-160 BPM
            energy: Math.random() * 100,
            beatMarkers: this.generateBeatMarkers(file.duration || 0),
          }
        : undefined,
    }
  }

  /**
   * Extract fragments from analyzed content
   */
  extractFragments(
    videoId: string,
    file: MediaFile,
    videoAnalysis: VideoAnalysis,
    audioAnalysis: AudioAnalysis,
    momentScores: MomentScore[],
  ): Fragment[] {
    const fragments: Fragment[] = []
    const duration = file.duration || 0

    // Create fragments based on moment scores
    momentScores.forEach((score, index) => {
      const fragment: Fragment = {
        id: `${videoId}-fragment-${index}`,
        videoId,
        sourceFile: file,
        startTime: score.timestamp,
        endTime: Math.min(score.timestamp + score.duration, duration),
        duration: score.duration,
        objects: videoAnalysis.content.objects.map((obj) => obj.label),
        people: [], // Would be populated by person identification
        score,
        tags: this.generateTags(score, videoAnalysis, audioAnalysis),
        description: this.generateDescription(score, videoAnalysis, audioAnalysis),
      }
      fragments.push(fragment)
    })

    return fragments
  }

  /**
   * Calculate overall content quality score
   */
  calculateQualityScore(videoAnalysis: VideoAnalysis, audioAnalysis: AudioAnalysis): number {
    const videoQuality =
      (videoAnalysis.quality.sharpness +
        videoAnalysis.quality.stability +
        (100 + videoAnalysis.quality.exposure) / 2 +
        videoAnalysis.quality.colorGrading) /
      4

    const audioQuality = (audioAnalysis.quality.clarity + (100 - audioAnalysis.quality.noiseLevel)) / 2

    // Weight video quality more heavily
    return videoQuality * 0.7 + audioQuality * 0.3
  }

  // Helper methods
  private calculateSharpness(width: number, height: number): number {
    const resolution = width * height
    const hdResolution = 1920 * 1080
    const sharpness = Math.min((resolution / hdResolution) * 100, 100)
    return Math.max(sharpness, 50) // Minimum 50
  }

  private generateFaceDetections() {
    const count = Math.floor(Math.random() * 3)
    return Array.from({ length: count }, () => ({
      box: [Math.random() * 1920, Math.random() * 1080, 200 + Math.random() * 100, 200 + Math.random() * 100] as [
        number,
        number,
        number,
        number,
      ],
      confidence: Math.random() * 0.3 + 0.7,
    }))
  }

  private generateObjectDetections() {
    const objects = ["person", "car", "tree", "building", "sky", "water"]
    const count = Math.floor(Math.random() * 5) + 1
    return Array.from({ length: count }, () => ({
      label: objects[Math.floor(Math.random() * objects.length)],
      confidence: Math.random() * 0.3 + 0.7,
      box: [Math.random() * 1920, Math.random() * 1080, 100 + Math.random() * 200, 100 + Math.random() * 200] as [
        number,
        number,
        number,
        number,
      ],
    }))
  }

  private detectSceneType(): SceneType {
    const types = Object.values(SceneType)
    return types[Math.floor(Math.random() * types.length)]
  }

  private detectLightingCondition(): LightingCondition {
    const conditions = Object.values(LightingCondition)
    return conditions[Math.floor(Math.random() * conditions.length)]
  }

  private detectCameraMovement(): CameraMovement {
    const movements = Object.values(CameraMovement)
    return movements[Math.floor(Math.random() * movements.length)]
  }

  private detectFlowDirection(): FlowDirection {
    const directions = Object.values(FlowDirection)
    return directions[Math.floor(Math.random() * directions.length)]
  }

  private detectEmotionalTone(): EmotionalTone {
    const tones = Object.values(EmotionalTone)
    return tones[Math.floor(Math.random() * tones.length)]
  }

  private generateBeatMarkers(duration: number): number[] {
    const bpm = 120
    const beatInterval = 60 / bpm
    const markers: number[] = []

    for (let time = 0; time < duration; time += beatInterval) {
      markers.push(time)
    }

    return markers
  }

  private generateTags(score: MomentScore, videoAnalysis: VideoAnalysis, audioAnalysis: AudioAnalysis): string[] {
    const tags: string[] = []

    // Add category tag
    tags.push(score.category)

    // Add quality tags
    if (score.scores.visual > 80) tags.push("high-visual-quality")
    if (score.scores.action > 70) tags.push("action-packed")
    if (score.scores.emotional > 70) tags.push("emotional")

    // Add content tags
    if (videoAnalysis.content.actionLevel > 70) tags.push("dynamic")
    if (audioAnalysis.content.speechPresence > 50) tags.push("dialogue")
    if (audioAnalysis.content.musicPresence > 50) tags.push("musical")

    // Add scene tags
    tags.push(videoAnalysis.content.sceneType)
    tags.push(videoAnalysis.content.lighting)

    return tags
  }

  private generateDescription(score: MomentScore, videoAnalysis: VideoAnalysis, audioAnalysis: AudioAnalysis): string {
    const parts: string[] = []

    // Describe the scene
    parts.push(`${score.category} scene`)

    // Add visual description
    if (videoAnalysis.content.actionLevel > 70) {
      parts.push("with high action")
    } else if (videoAnalysis.content.actionLevel < 30) {
      parts.push("with calm atmosphere")
    }

    // Add audio description
    if (audioAnalysis.content.speechPresence > 70) {
      parts.push("featuring dialogue")
    }
    if (audioAnalysis.content.musicPresence > 70) {
      parts.push("with prominent music")
    }

    // Add movement description
    if (videoAnalysis.motion.cameraMovement !== CameraMovement.Static) {
      parts.push(`and ${videoAnalysis.motion.cameraMovement} camera movement`)
    }

    return parts.join(" ")
  }

  private getEmptyAudioAnalysis(): AudioAnalysis {
    return {
      quality: {
        sampleRate: 0,
        bitDepth: 0,
        noiseLevel: 0,
        clarity: 0,
        dynamicRange: 0,
      },
      content: {
        speechPresence: 0,
        musicPresence: 0,
        ambientLevel: 0,
        emotionalTone: EmotionalTone.Neutral,
      },
    }
  }
}
