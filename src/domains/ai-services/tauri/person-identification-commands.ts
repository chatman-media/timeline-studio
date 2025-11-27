/**
 * Person Identification Tauri Commands for AI Services Domain
 * Advanced face detection, tracking, and person database operations
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("PersonIdentification")

/**
 * Advanced Face Detection Commands
 */
export interface AdvancedDetectionConfig {
  faceDetectionModel: "yolo-face" | "retinaface" | "mtcnn" | "mediapipe"
  recognitionModel: "facenet" | "arcface" | "cosface" | "sphereface"
  useGPU: boolean
  batchSize: number
  maxFPS: number
  minFaceSize: number
  maxFaces: number
  qualityThreshold: number
  detectEmotions: boolean
  detectAgeGender: boolean
  detectLandmarks: boolean
  detectGaze: boolean
}

export interface AdvancedFaceDetection {
  id: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number
  landmarks?: Array<{ x: number; y: number }>
  embedding?: Float32Array
  advancedAttributes?: {
    detailedEmotions?: Record<string, number>
    ageRange?: { min: number; max: number }
    genderConfidence?: number
    gazeDirection?: { yaw: number; pitch: number; confidence: number }
    facialHair?: Record<string, number>
    accessories?: Record<string, number>
    makeup?: Record<string, number>
  }
  pose3D?: {
    yaw: number
    pitch: number
    roll: number
    translationX: number
    translationY: number
    translationZ: number
    confidence: number
  }
  imageQuality?: {
    overall: number
    sharpness: number
    brightness: number
    contrast: number
    isBlurry: boolean
    isTooDark: boolean
    isTooBright: boolean
    isOccluded: boolean
    suitableForRecognition: boolean
    suitableForEnrollment: boolean
  }
  trackingId?: string
  trackingConfidence?: number
}

export async function initYoloProcessor(options: { modelType: string; confidenceThreshold: number }): Promise<void> {
  logger.info("Initializing YOLO processor", options)
  return invoke("init_yolo_processor", options)
}

export async function initFacenetProcessor(options: { modelType: string }): Promise<void> {
  logger.info("Initializing FaceNet processor", options)
  return invoke("init_facenet_processor", options)
}

export async function checkGpuAvailability(): Promise<boolean> {
  return invoke("check_gpu_availability")
}

export async function detectFacesAdvanced(options: {
  imageData: string
  returnEmbeddings: boolean
  returnCroppedFaces: boolean
  minConfidence: number
}): Promise<AdvancedFaceDetection[]> {
  logger.info("Detecting faces with advanced analysis", {
    returnEmbeddings: options.returnEmbeddings,
    returnCroppedFaces: options.returnCroppedFaces,
  })
  return invoke("detect_faces_advanced", options)
}

export async function generateFaceEmbeddingFromBase64(imageData: string): Promise<{
  vector: number[]
  quality: number
  dimension: number
}> {
  logger.info("Generating face embedding from base64")
  return invoke("generate_face_embedding_from_base64", { imageData })
}

export async function analyzeFaceQuality(faceImage: string): Promise<AdvancedFaceDetection["imageQuality"]> {
  logger.info("Analyzing face quality")
  return invoke("analyze_face_quality", { faceImage })
}

export async function blurFacesInImage(options: {
  imageData: string
  blurIntensity: number
  blurType: "gaussian" | "pixelate" | "solid"
  faceIds?: string[]
}): Promise<string> {
  logger.info("Blurring faces in image", { blurType: options.blurType, blurIntensity: options.blurIntensity })
  return invoke("blur_faces_in_image", options)
}

export async function startRealtimeFaceDetection(options: {
  streamId: string
  config: AdvancedDetectionConfig
}): Promise<void> {
  logger.info("Starting real-time face detection", { streamId: options.streamId })
  return invoke("start_realtime_face_detection", options)
}

export async function stopRealtimeFaceDetection(): Promise<void> {
  logger.info("Stopping real-time face detection")
  return invoke("stop_realtime_face_detection")
}

export async function updateFaceDetectionConfig(config: AdvancedDetectionConfig): Promise<void> {
  return invoke("update_face_detection_config", { config })
}

export async function cleanupFaceDetection(): Promise<void> {
  return invoke("cleanup_face_detection")
}

/**
 * Advanced Tracking Commands
 */
export interface TrackingConfig {
  algorithm: "deepsort" | "sort" | "iou" | "kalman"
  maxAge: number
  minHits: number
  iouThreshold: number
  useAppearanceFeatures: boolean
  appearanceThreshold: number
  useKalmanFilter: boolean
  processNoise: number
  measurementNoise: number
  maxTracks: number
  skipFrames: number
}

export interface TrackedPerson {
  trackId: string
  personId?: string
  currentBox: { x: number; y: number; width: number; height: number }
  predictedBox?: { x: number; y: number; width: number; height: number }
  state: {
    id: string
    personId?: string
    state: "tentative" | "confirmed" | "deleted"
    age: number
    hits: number
    timeSinceUpdate: number
    startFrame: number
    endFrame: number
    confidence: number
  }
  features?: Float32Array
  trajectory: Array<{
    frameNumber: number
    timestamp: number
    box: { x: number; y: number; width: number; height: number }
    confidence: number
    isInterpolated?: boolean
  }>
  velocity?: { x: number; y: number }
  acceleration?: { x: number; y: number }
}

export async function initAdvancedTracking(config: TrackingConfig): Promise<void> {
  logger.info("Initializing advanced tracking", { algorithm: config.algorithm })
  return invoke("init_advanced_tracking", { config })
}

export async function startPersonTracking(options: { videoId: string; config: TrackingConfig }): Promise<void> {
  logger.info("Starting person tracking", { videoId: options.videoId })
  return invoke("start_person_tracking", options)
}

export async function processTrackingFrame(options: {
  detections: Array<{
    id: string
    bbox: { x: number; y: number; width: number; height: number }
    confidence: number
    embedding?: number[]
  }>
  frameNumber: number
  timestamp: number
  frameImage?: string
}): Promise<{
  tracks: any[]
  newTracks: string[]
  deletedTracks: string[]
  statistics: {
    totalTracks: number
    activeTracks: number
    confirmedTracks: number
    tentativeTracks: number
    deletedTracks: number
    averageTrackAge: number
    averageConfidence: number
    processingTime: number
  }
}> {
  return invoke("process_tracking_frame", options)
}

export async function predictTrackPositions(trackIds: string[]): Promise<
  Array<{
    trackId: string
    box: { x: number; y: number; width: number; height: number }
  }>
> {
  return invoke("predict_track_positions", { trackIds })
}

export async function assignPersonToTrack(trackId: string, personId: string): Promise<void> {
  logger.info("Assigning person to track", { trackId, personId })
  return invoke("assign_person_to_track", { trackId, personId })
}

export async function mergeTracks(sourceTrackId: string, targetTrackId: string): Promise<void> {
  logger.info("Merging tracks", { sourceTrackId, targetTrackId })
  return invoke("merge_tracks", { sourceTrackId, targetTrackId })
}

export async function interpolateTrackPositions(options: {
  trackId: string
  startFrame: number
  endFrame: number
}): Promise<
  Array<{
    frameNumber: number
    timestamp: number
    box: { x: number; y: number; width: number; height: number }
    confidence: number
    isInterpolated: boolean
  }>
> {
  return invoke("interpolate_track_positions", options)
}

export async function stopPersonTracking(): Promise<void> {
  logger.info("Stopping person tracking")
  return invoke("stop_person_tracking")
}

export async function updateTrackingConfig(config: TrackingConfig): Promise<void> {
  return invoke("update_tracking_config", { config })
}

export async function cleanupTracking(): Promise<void> {
  return invoke("cleanup_tracking")
}

/**
 * Person Database Commands
 */
export async function initPersonDatabase(): Promise<void> {
  logger.info("Initializing person database")
  return invoke("init_person_database")
}

export async function createPerson(options: { name: string; tags?: string[]; notes?: string }): Promise<any> {
  logger.info("Creating person", { name: options.name })
  return invoke("create_person", options)
}

export async function getPerson(personId: string): Promise<any | null> {
  return invoke("get_person", { personId })
}

export async function deletePerson(personId: string): Promise<void> {
  logger.info("Deleting person", { personId })
  return invoke("delete_person", { personId })
}

export async function searchSimilarPersons(options: { embedding: number[]; topK: number; useCosine: boolean }): Promise<
  Array<{
    personId: string
    similarity: number
    embedding: any
    confidence: number
  }>
> {
  logger.info("Searching similar persons", { embeddingSize: options.embedding.length, topK: options.topK })
  return invoke("search_similar_persons", options)
}

export async function addFaceEmbedding(options: {
  personId: string
  embedding: number[]
  quality: number
  sourceClipId: string
  frameNumber: number
  timestamp: any
}): Promise<void> {
  logger.info("Adding face embedding", { personId: options.personId, embeddingSize: options.embedding.length })
  return invoke("add_face_embedding", options)
}

export async function addPersonAppearance(options: {
  personId: string
  clipId: string
  startTime: any
  endTime: any
  confidence: number
  detectionCount: number
}): Promise<void> {
  logger.info("Adding person appearance", { personId: options.personId, clipId: options.clipId })
  return invoke("add_person_appearance", options)
}

export async function getPersonDatabaseStats(): Promise<{
  totalPersons: number
  totalEmbeddings: number
  totalAppearances: number
  averageEmbeddingsPerPerson: number
  storageSize: number
  lastUpdated: string
}> {
  return invoke("get_person_database_stats")
}

export async function setSimilarityThreshold(threshold: number): Promise<void> {
  return invoke("set_similarity_threshold", { threshold })
}

export async function addPersonThumbnail(options: {
  personId: string
  imageDataBase64: string
  width: number
  height: number
  isPrimary: boolean
  quality: number
}): Promise<void> {
  logger.info("Adding person thumbnail", { personId: options.personId, width: options.width, height: options.height })
  return invoke("add_person_thumbnail", options)
}

/**
 * YOLO Data Service Commands
 */
export async function loadYoloData(videoId: string): Promise<any | null> {
  return invoke("load_yolo_data", { videoId })
}

export async function saveYoloData(videoId: string, data: any): Promise<void> {
  logger.info("Saving YOLO data", { videoId })
  return invoke("save_yolo_data", { videoId, data })
}

export async function analyzeVideoWithYolo(request: {
  video_path: string
  confidence_threshold: number
  skip_frames: number
}): Promise<any[]> {
  logger.info("Analyzing video with YOLO", { videoPath: request.video_path, skipFrames: request.skip_frames })
  return invoke("analyze_video_with_yolo", { request })
}
