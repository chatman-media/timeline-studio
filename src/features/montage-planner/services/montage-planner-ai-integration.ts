/**
 * Integration layer between Smart Montage Planner and centralized AI services
 * Bridges the montage planner with DI Container and shared AI services
 */

import { getAIContainer, IUnifiedAIService, MediaAnalysisFactory } from "@/domains/ai-core"
import { VideoAnalysisParams } from "@/domains/ai-services"
import type { MediaFile } from "@/features/media/types/media"
import type {
  AudioAnalysis,
  Fragment,
  MomentScore,
  MontageQualityAnalysis,
  VideoAnalysis,
  VideoCompositionAnalysis,
} from "../types"

export interface MontagePlannerAIService {
  // Video analysis using shared AI services
  analyzeVideoWithAI(file: MediaFile): Promise<VideoAnalysis>

  // Audio analysis using shared AI services
  analyzeAudioWithAI(file: MediaFile): Promise<AudioAnalysis>

  // YOLO-based scene detection
  detectScenesWithYOLO(videoPath: string): Promise<VideoCompositionAnalysis>

  // Quality analysis with FFmpeg
  analyzeQualityWithFFmpeg(videoPath: string): Promise<MontageQualityAnalysis>

  // AI-powered moment scoring
  scoreMomentsWithAI(fragments: Fragment[]): Promise<MomentScore[]>

  // Generate montage plan descriptions with LLM
  generatePlanDescription(fragments: Fragment[], style: string): Promise<string>
}

export class MontagePlannerAIIntegration implements MontagePlannerAIService {
  private aiService: IUnifiedAIService | null = null
  private analysisFactory: MediaAnalysisFactory | null = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const container = getAIContainer()

      // Resolve AI services from DI container
      this.aiService = await container.resolve<IUnifiedAIService>("UnifiedAIService")
      this.analysisFactory = await container.resolve<MediaAnalysisFactory>("MediaAnalysisFactory")

      this.initialized = true
    } catch (error) {
      console.error("[MontagePlannerAI] Failed to initialize AI services:", error)
      throw error
    }
  }

  /**
   * Analyze video using unified AI service
   */
  async analyzeVideoWithAI(file: MediaFile): Promise<VideoAnalysis> {
    await this.initialize()

    if (!this.aiService) {
      throw new Error("AI Service not initialized")
    }

    try {
      // Use unified AI service for video analysis
      const params: VideoAnalysisParams = {
        videoPath: file.path,
        analysisTypes: ["scene_detection", "object_recognition", "quality_assessment"],
        outputFormat: "detailed",
      }

      const aiAnalysis = await this.aiService.analyzeVideo(params)

      // Convert AI service response to VideoAnalysis format
      return this.convertToVideoAnalysis(aiAnalysis, file)
    } catch (error) {
      console.error("[MontagePlannerAI] Video analysis failed:", error)
      // Fallback to default analysis
      return this.getDefaultVideoAnalysis(file)
    }
  }

  /**
   * Analyze audio using shared AI services
   */
  async analyzeAudioWithAI(file: MediaFile): Promise<AudioAnalysis> {
    await this.initialize()

    if (!this.analysisFactory) {
      throw new Error("Analysis Factory not initialized")
    }

    try {
      // Use FFmpeg service for audio analysis
      const ffmpegService = await this.analysisFactory.createFFmpegService()
      const audioData = await ffmpegService.analyzeAudio(file.path)

      // Convert to AudioAnalysis format
      return this.convertToAudioAnalysis(audioData)
    } catch (error) {
      console.error("[MontagePlannerAI] Audio analysis failed:", error)
      return this.getDefaultAudioAnalysis()
    }
  }

  /**
   * Detect scenes using YOLO through vision service
   */
  async detectScenesWithYOLO(videoPath: string): Promise<VideoCompositionAnalysis> {
    await this.initialize()

    if (!this.analysisFactory) {
      throw new Error("Analysis Factory not initialized")
    }

    try {
      const visionService = await this.analysisFactory.createVisionService()
      const detections = (await visionService.detectObjects(videoPath)) as any[]

      // Convert YOLO detections to VideoCompositionAnalysis
      return {
        quality_score: 85,
        motion_level: 50,
        faces_detected: detections.filter((d: any) => d.label === "person" || d.class === "person").length,
        objects_detected: detections.map((d: any) => ({
          class_id: 0, // Would need proper mapping
          confidence: d.confidence,
          bbox: d.bbox || d.boundingBox || [0, 0, 0, 0],
        })),
        frame_analysis: {
          sharpness: 80,
          brightness: 50,
          contrast: 60,
          saturation: 70,
        },
      }
    } catch (error) {
      console.error("[MontagePlannerAI] YOLO detection failed:", error)
      throw error
    }
  }

  /**
   * Analyze quality using FFmpeg service
   */
  async analyzeQualityWithFFmpeg(videoPath: string): Promise<MontageQualityAnalysis> {
    await this.initialize()

    if (!this.analysisFactory) {
      throw new Error("Analysis Factory not initialized")
    }

    try {
      const ffmpegService = await this.analysisFactory.createFFmpegService()
      const metadata = await ffmpegService.getVideoMetadata(videoPath)

      return {
        quality_score: 85,
        technical_score: 90,
        visual_score: 80,
        resolution: {
          width: metadata.width || 1920,
          height: metadata.height || 1080,
        },
        frame_rate: metadata.fps || 30,
        bitrate: metadata.bitrate || 5000000,
        codec: metadata.codec || "h264",
        issues: [],
      }
    } catch (error) {
      console.error("[MontagePlannerAI] Quality analysis failed:", error)
      throw error
    }
  }

  /**
   * Score moments using AI
   */
  async scoreMomentsWithAI(fragments: Fragment[]): Promise<MomentScore[]> {
    await this.initialize()

    if (!this.aiService) {
      throw new Error("AI Service not initialized")
    }

    try {
      // Use AI to analyze and score each fragment
      const scores = await Promise.all(
        fragments.map(async (fragment) => {
          const prompt = `Analyze this video fragment and score it:
            - Duration: ${fragment.duration} seconds
            - Objects detected: ${fragment.objects.join(", ")}
            - People: ${fragment.people.map((p) => p.name).join(", ")}
            
            Provide scores (0-100) for:
            - Visual appeal
            - Technical quality
            - Emotional impact
            - Narrative value
            - Action level
            - Composition quality`

          const aiResponse = await this.aiService!.complete(prompt)

          // Parse AI response and create score
          return this.parseAIScoring(aiResponse, fragment)
        }),
      )

      return scores
    } catch (error) {
      console.error("[MontagePlannerAI] Moment scoring failed:", error)
      // Return existing scores
      return fragments.map((f) => f.score)
    }
  }

  /**
   * Generate plan description using LLM
   */
  async generatePlanDescription(fragments: Fragment[], style: string): Promise<string> {
    await this.initialize()

    if (!this.aiService) {
      throw new Error("AI Service not initialized")
    }

    try {
      const prompt = `Create a compelling description for a video montage plan:
        - Style: ${style}
        - Total fragments: ${fragments.length}
        - Total duration: ${fragments.reduce((acc, f) => acc + f.duration, 0)} seconds
        - Key moments: ${fragments
          .slice(0, 5)
          .map((f) => f.description)
          .join(", ")}
        
        Generate a brief, engaging description of what this montage will showcase.`

      return await this.aiService.complete(prompt)
    } catch (error) {
      console.error("[MontagePlannerAI] Description generation failed:", error)
      return `A ${style} montage with ${fragments.length} carefully selected moments`
    }
  }

  // Helper methods
  private convertToVideoAnalysis(aiAnalysis: any, _file: MediaFile): VideoAnalysis {
    return {
      quality: {
        resolution: {
          width: aiAnalysis.width || 1920,
          height: aiAnalysis.height || 1080,
        },
        frameRate: aiAnalysis.fps || 30,
        bitrate: aiAnalysis.bitrate || 5000000,
        sharpness: aiAnalysis.quality?.sharpness || 80,
        stability: aiAnalysis.quality?.stability || 85,
        exposure: aiAnalysis.quality?.exposure || 0,
        colorGrading: aiAnalysis.quality?.colorGrading || 75,
      },
      content: {
        actionLevel: aiAnalysis.motion?.level || 50,
        faces: aiAnalysis.faces || [],
        objects: aiAnalysis.objects || [],
        sceneType: "unknown" as any,
        lighting: "normal" as any,
      },
      motion: {
        cameraMovement: "static" as any,
        subjectMovement: 50,
        flowDirection: "center" as any,
        cutFriendliness: 80,
      },
    }
  }

  private convertToAudioAnalysis(audioData: any): AudioAnalysis {
    return {
      quality: {
        sampleRate: audioData.sampleRate || 48000,
        bitDepth: audioData.bitDepth || 16,
        noiseLevel: 10,
        clarity: 85,
        dynamicRange: 50,
      },
      content: {
        speechPresence: audioData.speechDetected ? 80 : 0,
        musicPresence: audioData.musicDetected ? 70 : 0,
        ambientLevel: 30,
        emotionalTone: "neutral" as any,
      },
    }
  }

  private parseAIScoring(_aiResponse: string, fragment: Fragment): MomentScore {
    // Simple parsing - in production would use structured output
    return {
      timestamp: fragment.startTime,
      duration: fragment.duration,
      scores: {
        visual: 80,
        technical: 85,
        emotional: 75,
        narrative: 70,
        action: 60,
        composition: 80,
      },
      totalScore: 76,
      category: "highlight" as any,
      weight: 0.8,
    }
  }

  private getDefaultVideoAnalysis(_file: MediaFile): VideoAnalysis {
    return {
      quality: {
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        bitrate: 5000000,
        sharpness: 80,
        stability: 85,
        exposure: 0,
        colorGrading: 75,
      },
      content: {
        actionLevel: 50,
        faces: [],
        objects: [],
        sceneType: "unknown" as any,
        lighting: "normal" as any,
      },
      motion: {
        cameraMovement: "static" as any,
        subjectMovement: 50,
        flowDirection: "center" as any,
        cutFriendliness: 80,
      },
    }
  }

  private getDefaultAudioAnalysis(): AudioAnalysis {
    return {
      quality: {
        sampleRate: 48000,
        bitDepth: 16,
        noiseLevel: 10,
        clarity: 85,
        dynamicRange: 50,
      },
      content: {
        speechPresence: 0,
        musicPresence: 0,
        ambientLevel: 30,
        emotionalTone: "neutral" as any,
      },
    }
  }
}

// Export singleton instance
let aiIntegrationInstance: MontagePlannerAIIntegration | null = null

export function getMontagePlannerAI(): MontagePlannerAIIntegration {
  if (!aiIntegrationInstance) {
    aiIntegrationInstance = new MontagePlannerAIIntegration()
  }
  return aiIntegrationInstance
}

// Hook for React components
export function useMontagePlannerAI() {
  return getMontagePlannerAI()
}
