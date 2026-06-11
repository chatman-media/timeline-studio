/**
 * Whisper Tools Domain
 * Инструменты речевого анализа с использованием OpenAI Whisper
 */

import { BaseAITool } from "../../../base"
import type { AIToolExecutionOptions, AIToolMetadata, AIToolResult, IAITool } from "../../../types"

// Временные типы для Whisper
interface WhisperInput {
  operation: string
  audioPath?: string
  language?: string
  model?: string
  task?: string
  enableDiarization?: boolean
  temperature?: number
  word_timestamps?: boolean
}

interface WhisperResult {
  operation: string
  success: boolean
  transcription?: any
  translation?: any
  diarization?: any
  model_used?: string
  speech_analysis?: any
  processingTime: number
}

async function adaptTranscription(input: WhisperInput): Promise<WhisperResult> {
  if (!input.audioPath) {
    throw new Error("Whisper transcription requires audioPath; demo transcription output is disabled")
  }

  throw new Error("Whisper transcription backend is not wired for this AI tool; use a configured transcription adapter")
}

async function adaptSpeechAnalysis(input: WhisperInput): Promise<WhisperResult> {
  if (!input.audioPath) {
    throw new Error("Speech analysis requires audioPath; demo speech analysis output is disabled")
  }

  throw new Error("Speech analysis backend is not wired for this AI tool; use a configured transcription adapter")
}

// ============================================================================
// WHISPER TOOLS
// ============================================================================

export class WhisperTranscriptionTool extends BaseAITool implements IAITool {
  metadata: AIToolMetadata = {
    name: "whisper-transcription",
    displayName: "Whisper транскрипция",
    description: "Транскрипция речи в текст с использованием OpenAI Whisper",
    domain: "analysis",
    category: "whisper-tools",
    tags: ["whisper", "transcription", "speech", "ai"],
    version: "1.0.0",
    author: "Timeline Studio",
    dependencies: ["whisper", "openai"],
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", enum: ["transcribe", "translate"] },
        audioId: { type: "string" },
        language: { type: "string" },
        model: { type: "string", enum: ["tiny", "base", "small", "medium", "large", "large-v2", "large-v3"] },
        word_timestamps: { type: "boolean" },
        temperature: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["operation", "audioId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        operation: { type: "string" },
        success: { type: "boolean" },
        transcription: { type: "object" },
        translation: { type: "object" },
        model_used: { type: "string" },
        processingTime: { type: "number" },
      },
    },
    examples: [
      {
        description: "Транскрипция с временными метками слов",
        input: {
          operation: "transcribe",
          audioId: "audio_123",
          language: "ru",
          model: "large-v3",
          word_timestamps: true,
        },
        expectedOutput: {
          operation: "transcribe",
          success: true,
          transcription: {},
          model_used: "large-v3",
        },
      },
    ],
  }

  async execute(input: WhisperInput, options?: AIToolExecutionOptions): Promise<AIToolResult<WhisperResult>> {
    return this.executeWithErrorHandling(
      async (_context) => {
        return await adaptTranscription(input)
      },
      input,
      options,
    )
  }

  validate(input: any): boolean {
    return typeof input === "object" && input !== null && typeof input.operation === "string"
  }

  getSchema(): { input: any; output: any } {
    return {
      input: this.metadata.inputSchema,
      output: this.metadata.outputSchema,
    }
  }
}

export class SpeechAnalysisTool extends BaseAITool implements IAITool {
  metadata: AIToolMetadata = {
    name: "speech-analysis",
    displayName: "Анализ речи",
    description: "Анализ характеристик речи: темп, паузы, тональность",
    domain: "analysis",
    category: "whisper-tools",
    tags: ["speech", "analysis", "voice", "characteristics"],
    version: "1.0.0",
    author: "Timeline Studio",
    dependencies: ["whisper", "librosa"],
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", enum: ["analyze_speech"] },
        audioId: { type: "string" },
        language: { type: "string" },
        model: { type: "string", enum: ["tiny", "base", "small", "medium", "large", "large-v2", "large-v3"] },
      },
      required: ["operation", "audioId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        operation: { type: "string" },
        success: { type: "boolean" },
        speech_analysis: { type: "object" },
        model_used: { type: "string" },
        processingTime: { type: "number" },
      },
    },
    examples: [
      {
        description: "Анализ характеристик речи",
        input: {
          operation: "analyze_speech",
          audioId: "audio_123",
          language: "ru",
          model: "large-v3",
        },
        expectedOutput: {
          operation: "analyze_speech",
          success: true,
          speech_analysis: {},
          model_used: "large-v3",
        },
      },
    ],
  }

  async execute(input: WhisperInput, options?: AIToolExecutionOptions): Promise<AIToolResult<WhisperResult>> {
    return this.executeWithErrorHandling(
      async (_context) => {
        return await adaptSpeechAnalysis(input)
      },
      input,
      options,
    )
  }

  validate(input: any): boolean {
    return typeof input === "object" && input !== null && typeof input.operation === "string"
  }

  getSchema(): { input: any; output: any } {
    return {
      input: this.metadata.inputSchema,
      output: this.metadata.outputSchema,
    }
  }
}

// Экспорт всех Whisper инструментов
export const whisperTools = [new WhisperTranscriptionTool(), new SpeechAnalysisTool()]

export const WHISPER_TOOLS_COUNT = whisperTools.length
