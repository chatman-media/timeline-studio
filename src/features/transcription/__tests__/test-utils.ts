import { vi } from "vitest"
import type {
  ModelInfo,
  TranscriptionOptions,
  TranscriptionProgress,
  TranscriptionResult,
  TranscriptionSegment,
  TranscriptionWord,
} from "@/domains/ai-services/types/transcription"

/**
 * Mock данные для тестирования транскрипции
 */

// Mock слово для транскрипции
export function createMockWord(overrides?: Partial<TranscriptionWord>): TranscriptionWord {
  return {
    word: "test",
    start: 0,
    end: 1,
    probability: 0.95,
    ...overrides,
  }
}

// Mock сегмент транскрипции
export function createMockSegment(overrides?: Partial<TranscriptionSegment>): TranscriptionSegment {
  return {
    id: 1,
    start: 0,
    end: 5,
    text: "This is a test segment",
    words: [
      createMockWord({ word: "This", start: 0, end: 0.5 }),
      createMockWord({ word: "is", start: 0.5, end: 1 }),
      createMockWord({ word: "a", start: 1, end: 1.5 }),
      createMockWord({ word: "test", start: 1.5, end: 2.5 }),
      createMockWord({ word: "segment", start: 2.5, end: 3.5 }),
    ],
    confidence: 0.92,
    ...overrides,
  }
}

// Mock результат транскрипции
export function createMockTranscriptionResult(overrides?: Partial<TranscriptionResult>): TranscriptionResult {
  return {
    segments: [
      createMockSegment({ id: 1, start: 0, end: 5, text: "Hello world" }),
      createMockSegment({ id: 2, start: 5, end: 10, text: "This is a test" }),
    ],
    language: "en",
    languageProbability: 0.98,
    duration: 10,
    text: "Hello world This is a test",
    processingTime: 2500,
    ...overrides,
  }
}

// Mock прогресс транскрипции
export function createMockProgress(overrides?: Partial<TranscriptionProgress>): TranscriptionProgress {
  return {
    status: "processing",
    progress: 50,
    message: "Processing audio...",
    ...overrides,
  }
}

// Mock опции транскрипции
export function createMockTranscriptionOptions(overrides?: Partial<TranscriptionOptions>): TranscriptionOptions {
  return {
    language: "en",
    task: "transcribe",
    modelSize: "base",
    wordTimestamps: true,
    vadFilter: true,
    maxSegmentLength: 80,
    provider: "local",
    device: "auto",
    computeType: "auto",
    ...overrides,
  }
}

// Mock информация о модели
export function createMockModelInfo(overrides?: Partial<ModelInfo>): ModelInfo {
  return {
    name: "base",
    size: "74M",
    isDownloaded: true,
    englishOnly: false,
    ...overrides,
  }
}

// Список mock моделей
export function createMockModels(): ModelInfo[] {
  return [
    createMockModelInfo({ name: "tiny", size: "39M", isDownloaded: false }),
    createMockModelInfo({ name: "base", size: "74M", isDownloaded: true }),
    createMockModelInfo({ name: "small", size: "244M", isDownloaded: false }),
    createMockModelInfo({ name: "medium", size: "769M", isDownloaded: false }),
    createMockModelInfo({ name: "large-v3", size: "1.5G", isDownloaded: false }),
  ]
}

/**
 * Mock для TranscriptionService
 */
export function createMockTranscriptionService() {
  return {
    transcribeMedia: vi.fn().mockResolvedValue(createMockTranscriptionResult()),
    generateSubtitles: vi.fn().mockResolvedValue("1\n00:00:00,000 --> 00:00:05,000\nHello world\n"),
    getAvailableModels: vi.fn().mockResolvedValue(createMockModels()),
    downloadModel: vi.fn().mockResolvedValue(true),
    getSupportedLanguages: vi.fn().mockReturnValue([
      { code: "en", name: "English" },
      { code: "ru", name: "Russian" },
      { code: "es", name: "Spanish" },
    ]),
    recommendModel: vi.fn().mockReturnValue("base"),
    getInstance: vi.fn(),
  }
}

/**
 * Mock для enhanced subtitle automation result
 */
export function createMockEnhancedSubtitleResult() {
  return {
    subtitles: [
      {
        id: "1",
        text: "Hello world",
        startTime: 0,
        endTime: 5000,
        confidence: 0.95,
        speaker: "Speaker 1",
      },
      {
        id: "2",
        text: "This is a test",
        startTime: 5000,
        endTime: 10000,
        confidence: 0.92,
        speaker: "Speaker 1",
      },
    ],
    quality: {
      overallConfidence: 0.93,
      languageDetectionAccuracy: 0.98,
      speechRecognitionQuality: 0.94,
      ocrAccuracy: 0,
      sceneAnalysisReliability: 0.9,
    },
    processing: {
      detectedLanguages: ["en"],
      totalProcessingTime: 2500,
      speechRecognitionTime: 1500,
      ocrTime: 0,
      sceneAnalysisTime: 500,
      optimizationTime: 500,
    },
    metadata: {
      clipId: "test-clip",
      duration: 10000,
      sourceType: "audio",
      processingDate: new Date().toISOString(),
    },
  }
}

/**
 * Mock для enhanced subtitle automation progress
 */
export function createMockEnhancedProgress(overrides?: any) {
  return {
    stage: "processing",
    progress: 50,
    message: "Processing audio...",
    details: {
      speechProgress: 50,
      ocrProgress: 0,
      sceneProgress: 0,
      optimizationProgress: 0,
    },
    ...overrides,
  }
}
