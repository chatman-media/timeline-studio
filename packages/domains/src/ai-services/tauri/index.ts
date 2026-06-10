/**
 * AI Services Domain - Tauri Commands
 *
 * Centralized access to all AI-related Tauri commands
 * Organized by service type for better maintainability
 *
 * Note: Using explicit re-exports to avoid ambiguities from duplicate function names
 * across different command modules.
 */

// AI Director commands (comprehensive analysis)
export * from "./ai-director-commands"

// Audio analysis and transcription commands
// Note: extractAudioForWhisper also exists in workflow-automation-commands
export {
  type AudioPeakData,
  analyzeAudioPeaks,
  checkWhisperLocalAvailability,
  detectSpeechOnsets,
  downloadWhisperModel,
  downloadWhisperModelFaster,
  // Export extractAudioForWhisper from audio-commands (primary implementation)
  extractAudioForWhisper,
  generateSubtitlesFromTranscription,
  getWhisperLocalModels,
  getWhisperModels,
  initWhisperPython,
  prepareAudioForWhisper,
  type SpeechOnsetData,
  type SubtitleSegment,
  type TranscriptionResult,
  type TranslationResult,
  transcribeWithFasterWhisper,
  whisperTranscribeLocal,
  whisperTranscribeOpenAI,
  whisperTranslateOpenAI,
} from "./audio-commands"

// Chat and AI interaction commands
export * from "./chat-commands"

// Content intelligence and analysis commands
// Note: Several functions also exist in platform-optimization-commands
export {
  adaptContentForPlatforms,
  analyzeContentWithAI,
  analyzeScenesByPath,
  convertImageToBase64,
  createFrameCollage,
  extractFramesForMultimodalAnalysis,
  extractThumbnailCandidates,
  ffmpegAnalyzeAudio,
  ffmpegAnalyzeMotion,
  ffmpegAnalyzeQuality,
  // Export FFmpeg utilities from content-intelligence-commands (primary implementation)
  ffmpegDetectScenes,
  ffmpegDetectSilence,
  ffmpegExtractKeyframes,
  ffmpegQuickAnalysis,
  generateScriptWithAI,
  optimizeImageForAnalysis,
  type SceneAnalysisResult,
} from "./content-intelligence-commands"

// Montage planning commands
// Note: Several functions also exist in workflow-automation-commands
export {
  applyMontagePlan,
  calculatePlanStatistics,
  exportMontagePlan,
  // Export montage planning functions from montage-planner-commands (primary implementation)
  generateMontagePlan,
  generateMontagePlanFromMoments,
  optimizeMontagePlan,
  validateMontagePlan,
} from "./montage-planner-commands"

// Person identification, face detection and tracking commands
// Note: Several functions also exist in recognition-commands
export {
  type AdvancedDetectionConfig,
  type AdvancedFaceDetection,
  addFaceEmbedding,
  addPersonAppearance,
  addPersonThumbnail,
  analyzeFaceQuality,
  // Export person database functions from person-identification-commands (primary implementation)
  blurFacesInImage,
  checkGpuAvailability,
  cleanupFaceDetection,
  createPerson,
  deletePerson,
  detectFacesAdvanced,
  generateFaceEmbeddingFromBase64,
  getPerson,
  getPersonDatabaseStats,
  initFacenetProcessor,
  initPersonDatabase,
  initYoloProcessor,
  searchSimilarPersons,
  setSimilarityThreshold,
  startRealtimeFaceDetection,
  stopRealtimeFaceDetection,
  updateFaceDetectionConfig,
} from "./person-identification-commands"

// Platform optimization and FFmpeg commands
// Note: Avoid re-exporting duplicate functions already exported from content-intelligence-commands
export {
  ffmpegGenerateThumbnail,
  ffmpegGetMetadata,
  ffmpegOptimizeForPlatform,
  // FFmpeg utilities (ffmpegQuickAnalysis, ffmpegDetectScenes, convertImageToBase64, extractFramesForMultimodalAnalysis)
  // are exported from content-intelligence-commands to avoid ambiguity
} from "./platform-optimization-commands"

// Recognition and detection commands
// Note: Avoid re-exporting duplicate person management functions already exported from person-identification-commands
export {
  analyzeFacialExpressions,
  analyzeVideoWithYOLO,
  calculateCosineSimilarity,
  detectFacesBlazeFace,
  detectFacesWithLandmarks,
  detectObjectsInImage,
  extractFaceMeshLandmarks,
  type FaceDetectionResult,
  generateFaceEmbedding,
  getAvailableYOLOModels,
  getYOLOClassNames,
  initFaceNetProcessor,
  initMediaPipeProcessor,
  initRetinaFaceProcessor,
  initYOLOProcessor,
  type PersonData,
  updateYOLOConfidenceThreshold,
  // Person management functions (createPerson, getPerson, addFaceEmbedding, searchSimilarPersons,
  // addPersonAppearance, deletePerson, getPersonDatabaseStats, blurFacesInImage)
  // are exported from person-identification-commands to avoid ambiguity
  type YOLODetectionResult,
} from "./recognition-commands"

// Generic AI service utilities
export * from "./service-utils"

// Workflow automation commands
// Note: Avoid re-exporting duplicate functions already exported from other modules
export {
  analyzeMontagelVideos,
  compileWorkflowVideo,
  createDirectory,
  createTimelineProject,
  whisperTranscribeOpenai,
  // Audio and montage planning functions (extractAudioForWhisper, applyMontagePlan, exportMontagePlan,
  // generateMontagePlan, optimizeMontagePlan, validateMontagePlan, calculatePlanStatistics)
  // are exported from their respective primary modules to avoid ambiguity
} from "./workflow-automation-commands"
