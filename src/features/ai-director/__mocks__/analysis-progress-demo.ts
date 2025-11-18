/**
 * Demo/Mock data for testing Analysis Progress components
 */

import type { AnalyzerType, FileAnalysisProgress } from "../types/analysis-progress"
import { createInitialFileProgress, updateAnalyzerProgress } from "../types/analysis-progress"

/**
 * Create demo file progress with various analyzer states for testing
 */
export function createDemoFileProgress(): FileAnalysisProgress[] {
  const file1Id = "demo-file-1"
  const file2Id = "demo-file-2"
  const file3Id = "demo-file-3"

  // File 1: Analyzing (в процессе)
  const analyzers1: AnalyzerType[] = [
    "scene_detection",
    "audio_quality",
    "moment_detection",
    "vlm_analysis",
    "object_detection",
  ]

  let file1 = createInitialFileProgress(file1Id, "/Users/test/Videos/demo-video-1.mp4", "demo-video-1.mp4", analyzers1)

  // Simulate progress on file 1
  file1 = {
    ...file1,
    status: "analyzing",
    startTime: new Date(Date.now() - 45000).toISOString(), // Started 45s ago
  }

  // scene_detection - completed
  file1 = updateAnalyzerProgress(file1, "scene_detection", {
    status: "completed",
    progress: 100,
    startTime: new Date(Date.now() - 45000).toISOString(),
    endTime: new Date(Date.now() - 30000).toISOString(),
    duration: 15000,
    result: {
      type: "scene_detection",
      success: true,
      metadata: {
        processingTime: 15000,
        itemsFound: 12,
        confidence: 0.89,
      },
    },
  })

  // audio_quality - completed
  file1 = updateAnalyzerProgress(file1, "audio_quality", {
    status: "completed",
    progress: 100,
    startTime: new Date(Date.now() - 30000).toISOString(),
    endTime: new Date(Date.now() - 18000).toISOString(),
    duration: 12000,
    result: {
      type: "audio_quality",
      success: true,
      metadata: {
        processingTime: 12000,
        confidence: 0.95,
      },
    },
  })

  // moment_detection - running
  file1 = updateAnalyzerProgress(file1, "moment_detection", {
    status: "running",
    progress: 65,
    startTime: new Date(Date.now() - 18000).toISOString(),
    details: "Analyzing key moments...",
  })

  // vlm_analysis - running
  file1 = updateAnalyzerProgress(file1, "vlm_analysis", {
    status: "running",
    progress: 35,
    startTime: new Date(Date.now() - 10000).toISOString(),
    details: "Processing with LLaVA vision model...",
  })

  // object_detection - pending
  // (stays as pending)

  // File 2: Completed
  const analyzers2: AnalyzerType[] = ["scene_detection", "audio_quality", "speech_recognition", "mood_analysis"]

  let file2 = createInitialFileProgress(file2Id, "/Users/test/Videos/demo-video-2.mp4", "demo-video-2.mp4", analyzers2)

  file2 = {
    ...file2,
    status: "completed",
    startTime: new Date(Date.now() - 120000).toISOString(),
    endTime: new Date(Date.now() - 30000).toISOString(),
    duration: 90000,
  }

  // All completed
  file2 = updateAnalyzerProgress(file2, "scene_detection", {
    status: "completed",
    progress: 100,
    duration: 20000,
    result: {
      type: "scene_detection",
      success: true,
      metadata: { processingTime: 20000, itemsFound: 8, confidence: 0.92 },
    },
  })

  file2 = updateAnalyzerProgress(file2, "audio_quality", {
    status: "completed",
    progress: 100,
    duration: 15000,
    result: {
      type: "audio_quality",
      success: true,
      metadata: { processingTime: 15000, confidence: 0.88 },
    },
  })

  file2 = updateAnalyzerProgress(file2, "speech_recognition", {
    status: "completed",
    progress: 100,
    duration: 45000,
    result: {
      type: "speech_recognition",
      success: true,
      metadata: { processingTime: 45000, itemsFound: 25, confidence: 0.94 },
    },
  })

  file2 = updateAnalyzerProgress(file2, "mood_analysis", {
    status: "completed",
    progress: 100,
    duration: 10000,
    result: {
      type: "mood_analysis",
      success: true,
      metadata: { processingTime: 10000, confidence: 0.87 },
    },
  })

  // File 3: Error
  const analyzers3: AnalyzerType[] = ["scene_detection", "object_detection", "audio_quality"]

  let file3 = createInitialFileProgress(
    file3Id,
    "/Users/test/Videos/corrupted-video.mp4",
    "corrupted-video.mp4",
    analyzers3,
  )

  file3 = {
    ...file3,
    status: "error",
    startTime: new Date(Date.now() - 60000).toISOString(),
    endTime: new Date(Date.now() - 50000).toISOString(),
    duration: 10000,
    error: "Failed to decode video: unsupported codec",
  }

  file3 = updateAnalyzerProgress(file3, "scene_detection", {
    status: "error",
    progress: 0,
    error: "Cannot analyze scenes: video decode failed",
  })

  file3 = updateAnalyzerProgress(file3, "object_detection", {
    status: "skipped",
    progress: 0,
  })

  file3 = updateAnalyzerProgress(file3, "audio_quality", {
    status: "completed",
    progress: 100,
    duration: 8000,
    result: {
      type: "audio_quality",
      success: true,
      metadata: { processingTime: 8000, confidence: 0.91 },
    },
  })

  return [file1, file2, file3]
}

/**
 * Create minimal demo for quick testing
 */
export function createMinimalDemoFileProgress(): FileAnalysisProgress {
  const analyzers: AnalyzerType[] = ["scene_detection", "audio_quality"]

  let file = createInitialFileProgress("demo-minimal", "/Users/test/Videos/test.mp4", "test.mp4", analyzers)

  file = {
    ...file,
    status: "analyzing",
    startTime: new Date(Date.now() - 15000).toISOString(),
  }

  file = updateAnalyzerProgress(file, "scene_detection", {
    status: "completed",
    progress: 100,
    duration: 10000,
    result: {
      type: "scene_detection",
      success: true,
      metadata: { processingTime: 10000, itemsFound: 5 },
    },
  })

  file = updateAnalyzerProgress(file, "audio_quality", {
    status: "running",
    progress: 45,
    details: "Analyzing audio...",
  })

  return file
}
