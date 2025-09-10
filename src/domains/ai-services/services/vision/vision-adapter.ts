/**
 * Vision Adapter - адаптер для интеграции VisionService с AI архитектурой
 */

import { VisionService } from "./vision-service"
import type {
  ColorAnalysis,
  CompositionAnalysis,
  DetectedObject,
  ExtractedText,
  FrameAnalysis,
  FrameAnalysisResult,
  IVisionService,
} from "../../types/interfaces"

export class VisionAdapter implements IVisionService {
  private visionService: VisionService
  private initialized = false

  constructor() {
    this.visionService = VisionService.getInstance({
      enableObjectDetection: true,
      enableFaceDetection: true,
      enableTextRecognition: true,
      enableActivityDetection: false,
      objectConfidenceThreshold: 0.5,
      faceConfidenceThreshold: 0.5,
      textConfidenceThreshold: 0.7,
      maxDetectionsPerFrame: 100,
    })
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.visionService.initialize()
      this.initialized = true
    }
  }

  private async loadImageData(imagePath: string): Promise<ImageData> {
    // TODO: Реальная загрузка изображения
    // Сейчас возвращаем заглушку
    console.warn(`Loading image from ${imagePath} - using mock data`)
    return new ImageData(1920, 1080)
  }

  async analyzeFrame(imagePath: string): Promise<FrameAnalysisResult> {
    await this.ensureInitialized()

    try {
      const imageData = await this.loadImageData(imagePath)
      const analysis = await this.visionService.analyzeFrame(imageData, 0)

      // Преобразуем к формату FrameAnalysisResult
      return {
        objects: this.convertToObjects(analysis.objects || []),
        faces: this.convertToFaces(analysis.faces || []),
        text: this.convertToText(analysis.text || []),
        scene: {
          type: "unknown",
          confidence: 0.5,
          attributes: [],
        },
        nsfw: {
          safe: 0.9,
          suggestive: 0.08,
          explicit: 0.02,
        },
      }
    } catch (error) {
      throw new Error(`Frame analysis error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async analyzeFrames(imagePaths: string[]): Promise<FrameAnalysis[]> {
    await this.ensureInitialized()

    // Анализируем кадры батчами для оптимизации
    const batchSize = 5
    const results: FrameAnalysis[] = []

    for (let i = 0; i < imagePaths.length; i += batchSize) {
      const batch = imagePaths.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (path, index) => {
          const imageData = await this.loadImageData(path)
          const frameAnalysis = await this.visionService.analyzeFrame(imageData, i + index)

          // Извлекаем доминирующие цвета
          const dominantColors = this.visionService.extractDominantColors(imageData, 5)

          return {
            id: `frame_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            timestamp: Date.now(),
            objects: this.convertToDetectedObjects(frameAnalysis.objects || []),
            text: this.convertToExtractedText(frameAnalysis.text || []),
            composition: this.getDefaultComposition(),
            colors: this.convertToColorAnalysis(dominantColors),
            quality: {
              sharpness: 75,
              brightness: 75,
              contrast: 75,
            },
          } as FrameAnalysis
        }),
      )
      results.push(...batchResults)
    }

    return results
  }

  async detectObjects(imagePath: string): Promise<DetectedObject[]> {
    await this.ensureInitialized()

    try {
      const imageData = await this.loadImageData(imagePath)
      const analysis = await this.visionService.analyzeFrame(imageData, 0)

      return this.convertToDetectedObjects(analysis.objects || [])
    } catch (error) {
      console.warn(`Object detection failed for ${imagePath}:`, error)
      return []
    }
  }

  async extractText(imagePath: string): Promise<ExtractedText[]> {
    await this.ensureInitialized()

    try {
      const imageData = await this.loadImageData(imagePath)
      const analysis = await this.visionService.analyzeFrame(imageData, 0)

      return this.convertToExtractedText(analysis.text || [])
    } catch (error) {
      console.warn(`Text extraction failed for ${imagePath}:`, error)
      return []
    }
  }

  async analyzeComposition(imagePath: string): Promise<CompositionAnalysis> {
    await this.ensureInitialized()

    try {
      const imageData = await this.loadImageData(imagePath)
      const analysis = await this.visionService.analyzeFrame(imageData, 0)

      if (analysis.composition) {
        return this.convertToCompositionAnalysis(analysis.composition)
      }

      return this.getDefaultComposition()
    } catch (error) {
      console.warn(`Composition analysis failed for ${imagePath}:`, error)
      return this.getDefaultComposition()
    }
  }

  async analyzeColors(imagePath: string): Promise<ColorAnalysis> {
    await this.ensureInitialized()

    try {
      const imageData = await this.loadImageData(imagePath)
      const dominantColors = this.visionService.extractDominantColors(imageData, 5)

      return this.convertToColorAnalysis(dominantColors)
    } catch (error) {
      console.warn(`Color analysis failed for ${imagePath}:`, error)
      return this.getDefaultColors()
    }
  }

  async analyzeVideo(videoPath: string, _sampleRate: number = 1): Promise<FrameAnalysisResult[]> {
    await this.ensureInitialized()

    try {
      // TODO: Извлечь кадры из видео с заданной частотой
      console.warn(`Video analysis not fully implemented for ${videoPath}`)

      // Возвращаем пример анализа одного кадра
      const frameResult = await this.analyzeFrame(videoPath)
      return [frameResult]
    } catch (error) {
      throw new Error(`Video analysis error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async detectFaces(imagePath: string): Promise<any[]> {
    await this.ensureInitialized()

    try {
      const imageData = await this.loadImageData(imagePath)
      const analysis = await this.visionService.analyzeFrame(imageData, 0)

      return this.convertToFaces(analysis.faces || [])
    } catch (error) {
      console.warn(`Face detection failed for ${imagePath}:`, error)
      return []
    }
  }

  async recognizeText(imagePath: string): Promise<string> {
    await this.ensureInitialized()

    try {
      const textResults = await this.extractText(imagePath)
      return textResults.map((result) => result.text).join(" ")
    } catch (error) {
      console.warn(`Text recognition failed for ${imagePath}:`, error)
      return ""
    }
  }

  // Методы преобразования данных

  private convertToObjects(objects: any[]): Array<{
    label: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
  }> {
    return objects.map((obj) => ({
      label: obj.label || obj.class || "unknown",
      confidence: obj.confidence || 0.5,
      bbox: {
        x: obj.bbox?.x || obj.x || 0,
        y: obj.bbox?.y || obj.y || 0,
        width: obj.bbox?.width || obj.width || 100,
        height: obj.bbox?.height || obj.height || 100,
      },
    }))
  }

  private convertToFaces(faces: any[]): any[] {
    return faces.map((face) => ({
      confidence: face.confidence || 0.8,
      bbox: {
        x: face.bbox?.x || face.x || 0,
        y: face.bbox?.y || face.y || 0,
        width: face.bbox?.width || face.width || 100,
        height: face.bbox?.height || face.height || 100,
      },
      emotions: face.emotions || {
        neutral: 0.7,
        happy: 0.1,
        sad: 0.1,
        angry: 0.05,
        surprised: 0.05,
      },
    }))
  }

  private convertToText(text: any[]): Array<{
    text: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
  }> {
    return text.map((t) => ({
      text: t.text || "",
      confidence: t.confidence || 0.7,
      bbox: {
        x: t.bbox?.x || t.x || 0,
        y: t.bbox?.y || t.y || 0,
        width: t.bbox?.width || t.width || 100,
        height: t.bbox?.height || t.height || 50,
      },
    }))
  }

  private convertToDetectedObjects(objects: any[]): DetectedObject[] {
    return objects.map((obj) => ({
      class: obj.label || obj.class || "unknown",
      confidence: obj.confidence || 0.5,
      boundingBox: {
        x: obj.bbox?.x || obj.x || 0,
        y: obj.bbox?.y || obj.y || 0,
        width: obj.bbox?.width || obj.width || 100,
        height: obj.bbox?.height || obj.height || 100,
      },
      attributes: obj.attributes || {},
    }))
  }

  private convertToExtractedText(text: any[]): ExtractedText[] {
    return text.map((t) => ({
      text: t.text || "",
      confidence: t.confidence || 0.7,
      boundingBox: {
        x: t.bbox?.x || t.x || 0,
        y: t.bbox?.y || t.y || 0,
        width: t.bbox?.width || t.width || 100,
        height: t.bbox?.height || t.height || 50,
      },
      language: t.language || "unknown",
    }))
  }

  private convertToCompositionAnalysis(composition: any): CompositionAnalysis {
    return {
      ruleOfThirds: {
        score: composition.ruleOfThirds?.score || 50,
        points: composition.ruleOfThirds?.points || [],
      },
      leadingLines: {
        score: composition.leadingLines?.score || 50,
        lines: composition.leadingLines?.lines || [],
      },
      balance: {
        score: composition.balance?.score || 50,
        centerOfMass: composition.balance?.centerOfMass || { x: 0.5, y: 0.5 },
      },
      symmetry: {
        score: composition.symmetry?.score || 50,
        axis: composition.symmetry?.axis,
      },
    }
  }

  private convertToColorAnalysis(colors: string[]): ColorAnalysis {
    const palette = colors.map((color, index) => {
      // Парсим rgb строку в компоненты
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (match) {
        const [, r, g, b] = match
        return {
          r: Number.parseInt(r),
          g: Number.parseInt(g),
          b: Number.parseInt(b),
          hex: `#${Number.parseInt(r).toString(16).padStart(2, "0")}${Number.parseInt(g).toString(16).padStart(2, "0")}${Number.parseInt(b).toString(16).padStart(2, "0")}`,
          percentage: (100 - index * 15) / 100, // Примерное распределение
        }
      }
      return {
        r: 0,
        g: 0,
        b: 0,
        hex: "#000000",
        percentage: 0,
      }
    })

    return {
      dominantColors: palette.slice(0, 3),
      palette: palette,
      temperature: "neutral",
      saturation: "medium",
      brightness: "medium",
    }
  }

  private getDefaultComposition(): CompositionAnalysis {
    return {
      ruleOfThirds: { score: 50, points: [] },
      leadingLines: { score: 50, lines: [] },
      balance: { score: 50, centerOfMass: { x: 0.5, y: 0.5 } },
      symmetry: { score: 50 },
    }
  }

  private getDefaultColors(): ColorAnalysis {
    return {
      dominantColors: [],
      palette: [],
      temperature: "neutral",
      saturation: "medium",
      brightness: "medium",
    }
  }
}

// Фабричная функция
export function createVisionService(): VisionAdapter {
  return new VisionAdapter()
}
