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
  analyzeAudioPeaks,
  detectSpeechOnsets,
  whisperTranscribeOpenAI,
  whisperTranslateOpenAI,
  whisperTranscribeLocal,
  getWhisperLocalModels,
  downloadWhisperModel,
  checkWhisperLocalAvailability,
  initWhisperPython,
  transcribeWithFasterWhisper,
  getWhisperModels,
  downloadWhisperModelFaster,
  prepareAudioForWhisper,
  generateSubtitlesFromTranscription,
  // Export extractAudioForWhisper from audio-commands (primary implementation)
  extractAudioForWhisper,
  type AudioPeakData,
  type SpeechOnsetData,
  type TranscriptionResult,
  type TranslationResult,
  type SubtitleSegment,
} from "./audio-commands"

// Chat and AI interaction commands
export * from "./chat-commands"

// Content intelligence and analysis commands
// Note: Several functions also exist in platform-optimization-commands
export {
  ffmpegAnalyzeQuality,
  ffmpegDetectSilence,
  ffmpegAnalyzeMotion,
  ffmpegExtractKeyframes,
  ffmpegAnalyzeAudio,
  extractThumbnailCandidates,
  createFrameCollage,
  optimizeImageForAnalysis,
  analyzeContentWithAI,
  generateScriptWithAI,
  adaptContentForPlatforms,
  analyzeScenesByPath,
  // Export FFmpeg utilities from content-intelligence-commands (primary implementation)
  ffmpegDetectScenes,
  ffmpegQuickAnalysis,
  extractFramesForMultimodalAnalysis,
  convertImageToBase64,
  type SceneAnalysisResult,
} from "./content-intelligence-commands"

// Montage planning commands
// Note: Several functions also exist in workflow-automation-commands
export {
  // Export montage planning functions from montage-planner-commands (primary implementation)
  generateMontagePlan,
  optimizeMontagePlan,
  validateMontagePlan,
  calculatePlanStatistics,
  applyMontagePlan,
  exportMontagePlan,
  generateMontagePlanFromMoments,
} from "./montage-planner-commands"

// Person identification, face detection and tracking commands
// Note: Several functions also exist in recognition-commands
export {
  initYoloProcessor,
  initFacenetProcessor,
  checkGpuAvailability,
  detectFacesAdvanced,
  generateFaceEmbeddingFromBase64,
  analyzeFaceQuality,
  startRealtimeFaceDetection,
  stopRealtimeFaceDetection,
  updateFaceDetectionConfig,
  cleanupFaceDetection,
  // Export person database functions from person-identification-commands (primary implementation)
  blurFacesInImage,
  initPersonDatabase,
  createPerson,
  getPerson,
  deletePerson,
  searchSimilarPersons,
  addFaceEmbedding,
  addPersonAppearance,
  addPersonThumbnail,
  getPersonDatabaseStats,
  setSimilarityThreshold,
  type AdvancedDetectionConfig,
  type AdvancedFaceDetection,
} from "./person-identification-commands"

// Platform optimization and FFmpeg commands
// Note: Avoid re-exporting duplicate functions already exported from content-intelligence-commands
export {
  ffmpegGetMetadata,
  ffmpegOptimizeForPlatform,
  ffmpegGenerateThumbnail,
  // FFmpeg utilities (ffmpegQuickAnalysis, ffmpegDetectScenes, convertImageToBase64, extractFramesForMultimodalAnalysis)
  // are exported from content-intelligence-commands to avoid ambiguity
} from "./platform-optimization-commands"

// Recognition and detection commands
// Note: Avoid re-exporting duplicate person management functions already exported from person-identification-commands
export {
  initYOLOProcessor,
  detectObjectsInImage,
  analyzeVideoWithYOLO,
  getYOLOClassNames,
  updateYOLOConfidenceThreshold,
  getAvailableYOLOModels,
  initRetinaFaceProcessor,
  detectFacesWithLandmarks,
  initFaceNetProcessor,
  generateFaceEmbedding,
  calculateCosineSimilarity,
  initMediaPipeProcessor,
  detectFacesBlazeFace,
  extractFaceMeshLandmarks,
  analyzeFacialExpressions,
  // Person management functions (createPerson, getPerson, addFaceEmbedding, searchSimilarPersons,
  // addPersonAppearance, deletePerson, getPersonDatabaseStats, blurFacesInImage)
  // are exported from person-identification-commands to avoid ambiguity
  type YOLODetectionResult,
  type FaceDetectionResult,
  type PersonData,
} from "./recognition-commands"

// Generic AI service utilities
export * from "./service-utils"

// Workflow automation commands
// Note: Avoid re-exporting duplicate functions already exported from other modules
export {
  createDirectory,
  whisperTranscribeOpenai,
  createTimelineProject,
  compileWorkflowVideo,
  analyzeMontagelVideos,
  // Audio and montage planning functions (extractAudioForWhisper, applyMontagePlan, exportMontagePlan,
  // generateMontagePlan, optimizeMontagePlan, validateMontagePlan, calculatePlanStatistics)
  // are exported from their respective primary modules to avoid ambiguity
} from "./workflow-automation-commands"
