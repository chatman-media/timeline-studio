/**
 * Audio Analysis and Transcription Tauri Commands for AI Services Domain
 */

import { invoke } from "@tauri-apps/api/core"

/**
 * Audio Analysis Commands
 */
export interface AudioPeakData {
  peaks: number[]
  timestamps: number[]
  maxPeak: number
  avgPeak: number
  duration: number
}

export interface SpeechOnsetData {
  onsets: Array<{
    timestamp: number
    confidence: number
    energy: number
  }>
  totalOnsets: number
  avgConfidence: number
}

export async function analyzeAudioPeaks(
  audioPath: string,
  options?: {
    windowSize?: number
    hopSize?: number
    threshold?: number
  },
): Promise<AudioPeakData> {
  console.log("[Audio Commands] Analyzing audio peaks:", audioPath)
  return invoke("analyze_audio_peaks", {
    audioPath,
    options: options || {},
  })
}

export async function detectSpeechOnsets(
  audioPath: string,
  options?: {
    frameSize?: number
    hopSize?: number
    threshold?: number
  },
): Promise<SpeechOnsetData> {
  console.log("[Audio Commands] Detecting speech onsets:", audioPath)
  return invoke("detect_speech_onsets", {
    audioPath,
    options: options || {},
  })
}

/**
 * Whisper Transcription Commands
 */
export interface TranscriptionResult {
  text: string
  language: string
  segments: Array<{
    start: number
    end: number
    text: string
    confidence?: number
  }>
  processingTime: number
}

export interface TranslationResult {
  originalText: string
  translatedText: string
  originalLanguage: string
  targetLanguage: string
  segments: Array<{
    start: number
    end: number
    originalText: string
    translatedText: string
  }>
  processingTime: number
}

export interface SubtitleSegment {
  index: number
  start: number
  end: number
  text: string
}

/**
 * OpenAI Whisper API Commands
 */
export async function whisperTranscribeOpenAI(
  audioPath: string,
  options?: {
    model?: string
    language?: string
    responseFormat?: string
    temperature?: number
  },
): Promise<TranscriptionResult> {
  console.log("[Audio Commands] Transcribing with OpenAI Whisper:", audioPath)
  return invoke("whisper_transcribe_openai", {
    audioPath,
    options: options || {},
  })
}

export async function whisperTranslateOpenAI(
  audioPath: string,
  targetLanguage: string = "en",
  options?: {
    model?: string
    responseFormat?: string
    temperature?: number
  },
): Promise<TranslationResult> {
  console.log("[Audio Commands] Translating with OpenAI Whisper:", audioPath)
  return invoke("whisper_translate_openai", {
    audioPath,
    targetLanguage,
    options: options || {},
  })
}

/**
 * Local Whisper Commands
 */
export async function whisperTranscribeLocal(
  audioPath: string,
  options?: {
    model?: string
    language?: string
    task?: "transcribe" | "translate"
    outputFormat?: string
  },
): Promise<TranscriptionResult> {
  console.log("[Audio Commands] Transcribing with local Whisper:", audioPath)
  return invoke("whisper_transcribe_local", {
    audioPath,
    options: options || {},
  })
}

export async function getWhisperLocalModels(): Promise<string[]> {
  return invoke("whisper_get_local_models")
}

export async function downloadWhisperModel(modelName: string, _onProgress?: (progress: number) => void): Promise<void> {
  console.log("[Audio Commands] Downloading Whisper model:", modelName)
  // Note: Progress callback would need special handling in Tauri
  return invoke("whisper_download_model", {
    modelName,
  })
}

export async function checkWhisperLocalAvailability(): Promise<{
  available: boolean
  models: string[]
  pythonPath?: string
  version?: string
}> {
  return invoke("whisper_check_local_availability")
}

/**
 * Faster Whisper Commands
 */
export async function initWhisperPython(): Promise<{
  success: boolean
  version?: string
  availableModels: string[]
}> {
  console.log("[Audio Commands] Initializing Faster Whisper")
  return invoke("init_whisper_python")
}

export async function transcribeWithFasterWhisper(
  audioPath: string,
  options?: {
    modelSize?: string
    language?: string
    task?: "transcribe" | "translate"
    beam_size?: number
    best_of?: number
    temperature?: number
  },
): Promise<TranscriptionResult> {
  console.log("[Audio Commands] Transcribing with Faster Whisper:", audioPath)
  return invoke("transcribe_with_faster_whisper", {
    audioPath,
    options: options || {},
  })
}

export async function getWhisperModels(): Promise<
  Array<{
    name: string
    size: string
    downloaded: boolean
    downloadUrl?: string
  }>
> {
  return invoke("get_whisper_models")
}

export async function downloadWhisperModelFaster(modelName: string): Promise<void> {
  console.log("[Audio Commands] Downloading Faster Whisper model:", modelName)
  return invoke("download_whisper_model", {
    modelName,
  })
}

/**
 * Audio Preparation Commands
 */
export async function extractAudioForWhisper(
  videoPath: string,
  outputPath?: string,
  options?: {
    format?: string
    sampleRate?: number
    channels?: number
    startTime?: number
    duration?: number
  },
): Promise<string> {
  console.log("[Audio Commands] Extracting audio for Whisper:", videoPath)
  return invoke("extract_audio_for_whisper", {
    videoPath,
    outputPath,
    options: options || {},
  })
}

export async function prepareAudioForWhisper(
  audioPath: string,
  options?: {
    normalize?: boolean
    removeNoise?: boolean
    targetSampleRate?: number
    targetChannels?: number
  },
): Promise<string> {
  console.log("[Audio Commands] Preparing audio for Whisper:", audioPath)
  return invoke("prepare_audio_for_whisper", {
    audioPath,
    options: options || {},
  })
}

/**
 * Subtitle Generation Commands
 */
export async function generateSubtitlesFromTranscription(
  transcriptionResult: TranscriptionResult,
  options?: {
    format?: "srt" | "vtt" | "ass"
    maxLineLength?: number
    maxDuration?: number
    wordsPerMinute?: number
  },
): Promise<{
  subtitles: SubtitleSegment[]
  formattedText: string
  format: string
}> {
  console.log("[Audio Commands] Generating subtitles from transcription")
  return invoke("generate_subtitles_from_transcription", {
    transcriptionResult,
    options: options || {},
  })
}
