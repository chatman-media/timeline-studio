/**
 * Recognition and Detection Tauri Commands for AI Services Domain
 */

import { invoke } from "@tauri-apps/api/core"

/**
 * YOLO Object Detection Commands
 */
export interface YOLODetectionResult {
  objects: Array<{
    class: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
    timestamp?: number
  }>
  processingTime: number
  frameCount?: number
}

export async function initYOLOProcessor(modelPath?: string, useGPU?: boolean): Promise<string> {
  console.log("[Recognition] Initializing YOLO processor")
  return invoke("init_yolo_processor", {
    modelPath,
    useGPU: useGPU ?? true,
  })
}

export async function detectObjectsInImage(
  processorId: string,
  imagePath: string,
  confidenceThreshold?: number,
): Promise<YOLODetectionResult> {
  console.log("[Recognition] Detecting objects in image:", imagePath)
  return invoke("detect_objects_in_image", {
    processorId,
    imagePath,
    confidenceThreshold: confidenceThreshold ?? 0.5,
  })
}

export async function analyzeVideoWithYOLO(
  processorId: string,
  videoPath: string,
  options?: {
    frameInterval?: number
    maxFrames?: number
    confidenceThreshold?: number
  },
): Promise<YOLODetectionResult[]> {
  console.log("[Recognition] Analyzing video with YOLO:", videoPath)
  return invoke("analyze_video_with_yolo", {
    processorId,
    videoPath,
    options: options || {},
  })
}

export async function getYOLOClassNames(processorId: string): Promise<string[]> {
  return invoke("get_yolo_class_names_advanced", { processorId })
}

export async function updateYOLOConfidenceThreshold(processorId: string, threshold: number): Promise<void> {
  return invoke("update_yolo_confidence_threshold", {
    processorId,
    threshold,
  })
}

export async function getAvailableYOLOModels(): Promise<string[]> {
  return invoke("get_available_yolo_models")
}

export async function checkGPUAvailability(): Promise<boolean> {
  return invoke("check_gpu_availability")
}

/**
 * Face Recognition Commands
 */
export interface FaceDetectionResult {
  faces: Array<{
    bbox: { x: number; y: number; width: number; height: number }
    confidence: number
    landmarks?: Array<{ x: number; y: number }>
    embedding?: number[]
    personId?: string
  }>
  processingTime: number
}

export async function initRetinaFaceProcessor(): Promise<string> {
  console.log("[Recognition] Initializing RetinaFace processor")
  return invoke("init_retinaface_processor")
}

export async function detectFacesWithLandmarks(processorId: string, imagePath: string): Promise<FaceDetectionResult> {
  console.log("[Recognition] Detecting faces with landmarks:", imagePath)
  return invoke("detect_faces_with_landmarks", {
    processorId,
    imagePath,
  })
}

export async function initFaceNetProcessor(): Promise<string> {
  console.log("[Recognition] Initializing FaceNet processor")
  return invoke("init_facenet_processor")
}

export async function generateFaceEmbedding(
  processorId: string,
  imagePath: string,
  faceBox?: { x: number; y: number; width: number; height: number },
): Promise<number[]> {
  console.log("[Recognition] Generating face embedding:", imagePath)
  return invoke("generate_face_embedding", {
    processorId,
    imagePath,
    faceBox,
  })
}

export async function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
  return invoke("calculate_cosine_similarity", {
    embedding1,
    embedding2,
  })
}

/**
 * MediaPipe Commands
 */
export async function initMediaPipeProcessor(): Promise<string> {
  console.log("[Recognition] Initializing MediaPipe processor")
  return invoke("init_mediapipe_processor")
}

export async function detectFacesBlazeFace(processorId: string, imagePath: string): Promise<FaceDetectionResult> {
  console.log("[Recognition] Detecting faces with BlazeFace:", imagePath)
  return invoke("detect_faces_blazeface", {
    processorId,
    imagePath,
  })
}

export async function extractFaceMeshLandmarks(
  processorId: string,
  imagePath: string,
): Promise<Array<{ x: number; y: number; z?: number }>> {
  console.log("[Recognition] Extracting face mesh landmarks:", imagePath)
  return invoke("extract_face_mesh_landmarks", {
    processorId,
    imagePath,
  })
}

export async function analyzeFacialExpressions(
  processorId: string,
  imagePath: string,
): Promise<{
  expressions: Record<string, number>
  confidence: number
}> {
  console.log("[Recognition] Analyzing facial expressions:", imagePath)
  return invoke("analyze_facial_expressions", {
    processorId,
    imagePath,
  })
}

/**
 * Person Identification Commands
 */
export interface PersonData {
  id: string
  name: string
  embeddings: number[][]
  appearances: Array<{
    videoPath: string
    timestamp: number
    bbox: { x: number; y: number; width: number; height: number }
    confidence: number
  }>
  thumbnailPath?: string
}

export async function createPerson(name: string): Promise<PersonData> {
  console.log("[Recognition] Creating person:", name)
  return invoke("create_person", { name })
}

export async function getPerson(personId: string): Promise<PersonData | null> {
  return invoke("get_person", { personId })
}

export async function addFaceEmbedding(personId: string, embedding: number[], sourcePath: string): Promise<void> {
  console.log("[Recognition] Adding face embedding for person:", personId)
  return invoke("add_face_embedding", {
    personId,
    embedding,
    sourcePath,
  })
}

export async function searchSimilarPersons(
  embedding: number[],
  threshold?: number,
  maxResults?: number,
): Promise<Array<{ personId: string; similarity: number; name: string }>> {
  console.log("[Recognition] Searching similar persons")
  return invoke("search_similar_persons", {
    embedding,
    threshold: threshold ?? 0.7,
    maxResults: maxResults ?? 5,
  })
}

export async function addPersonAppearance(
  personId: string,
  videoPath: string,
  timestamp: number,
  bbox: { x: number; y: number; width: number; height: number },
  confidence: number,
): Promise<void> {
  console.log("[Recognition] Adding person appearance:", personId)
  return invoke("add_person_appearance", {
    personId,
    videoPath,
    timestamp,
    bbox,
    confidence,
  })
}

export async function deletePerson(personId: string): Promise<void> {
  console.log("[Recognition] Deleting person:", personId)
  return invoke("delete_person", { personId })
}

export async function getPersonDatabaseStats(): Promise<{
  totalPersons: number
  totalEmbeddings: number
  totalAppearances: number
}> {
  return invoke("get_person_database_stats")
}

/**
 * Privacy Commands
 */
export async function initPrivacyProcessor(): Promise<string> {
  console.log("[Recognition] Initializing privacy processor")
  return invoke("init_privacy_processor")
}

export async function blurFacesInImage(
  processorId: string,
  imagePath: string,
  outputPath: string,
  blurIntensity?: number,
): Promise<void> {
  console.log("[Recognition] Blurring faces in image:", imagePath)
  return invoke("blur_faces_in_image", {
    processorId,
    imagePath,
    outputPath,
    blurIntensity: blurIntensity ?? 15,
  })
}

export async function blurFacesInVideoFrames(
  processorId: string,
  videoPath: string,
  outputDir: string,
  options?: {
    frameInterval?: number
    blurIntensity?: number
    preserveAudioTimestamp?: boolean
  },
): Promise<string[]> {
  console.log("[Recognition] Blurring faces in video frames:", videoPath)
  return invoke("blur_faces_in_video_frames", {
    processorId,
    videoPath,
    outputDir,
    options: options || {},
  })
}

/**
 * Clustering Commands
 */
export async function initClusteringEngine(): Promise<string> {
  console.log("[Recognition] Initializing clustering engine")
  return invoke("init_clustering_engine")
}

export async function clusterFaces(
  engineId: string,
  embeddings: number[][],
  options?: {
    eps?: number
    minSamples?: number
    algorithm?: string
  },
): Promise<number[]> {
  console.log("[Recognition] Clustering faces:", embeddings.length)
  return invoke("cluster_faces", {
    engineId,
    embeddings,
    options: options || {},
  })
}

export async function autoClusterVideoFaces(
  engineId: string,
  videoPath: string,
  options?: {
    frameInterval?: number
    confidenceThreshold?: number
    clusteringParams?: {
      eps?: number
      minSamples?: number
    }
  },
): Promise<{
  clusters: Array<{
    clusterId: number
    faces: Array<{
      frameNumber: number
      timestamp: number
      bbox: { x: number; y: number; width: number; height: number }
      confidence: number
    }>
  }>
  totalFaces: number
  processingTime: number
}> {
  console.log("[Recognition] Auto-clustering video faces:", videoPath)
  return invoke("auto_cluster_video_faces", {
    engineId,
    videoPath,
    options: options || {},
  })
}
