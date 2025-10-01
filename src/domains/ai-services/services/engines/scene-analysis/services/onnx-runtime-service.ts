/**
 * ONNX Runtime Service
 * Сервис для работы с ONNX моделями
 */

import { env, type InferenceSession, Tensor } from "onnxruntime-web"

import type { YoloDetection } from "@/features/recognition/types/yolo"

// Настройка ONNX Runtime
if (typeof window !== "undefined") {
  // Настройки для веб-окружения
  env.wasm.wasmPaths = "/onnx-wasm/"
  env.wasm.numThreads = navigator.hardwareConcurrency || 4
  env.wasm.simd = true
}

export interface ONNXModel {
  name: string
  path: string
  type: "yolo" | "face" | "ocr" | "activity"
  inputSize: [number, number]
  labels?: string[]
}

export interface ModelSession {
  session: InferenceSession
  model: ONNXModel
}

export class ONNXRuntimeService {
  private static instance: ONNXRuntimeService
  private sessions = new Map<string, ModelSession>()
  private isInitialized = false

  // Предопределенные модели
  private readonly models: ONNXModel[] = [
    {
      name: "yolov8n",
      path: "/models/yolov8n.onnx",
      type: "yolo",
      inputSize: [640, 640],
      labels: [
        "person",
        "bicycle",
        "car",
        "motorcycle",
        "airplane",
        "bus",
        "train",
        "truck",
        "boat",
        "traffic light",
        "fire hydrant",
        "stop sign",
        "parking meter",
        "bench",
        "bird",
        "cat",
        "dog",
        "horse",
        "sheep",
        "cow",
        "elephant",
        "bear",
        "zebra",
        "giraffe",
        "backpack",
        "umbrella",
        "handbag",
        "tie",
        "suitcase",
        "frisbee",
        "skis",
        "snowboard",
        "sports ball",
        "kite",
        "baseball bat",
        "baseball glove",
        "skateboard",
        "surfboard",
        "tennis racket",
        "bottle",
        "wine glass",
        "cup",
        "fork",
        "knife",
        "spoon",
        "bowl",
        "banana",
        "apple",
        "sandwich",
        "orange",
        "broccoli",
        "carrot",
        "hot dog",
        "pizza",
        "donut",
        "cake",
        "chair",
        "couch",
        "potted plant",
        "bed",
        "dining table",
        "toilet",
        "tv",
        "laptop",
        "mouse",
        "remote",
        "keyboard",
        "cell phone",
        "microwave",
        "oven",
        "toaster",
        "sink",
        "refrigerator",
        "book",
        "clock",
        "vase",
        "scissors",
        "teddy bear",
        "hair drier",
        "toothbrush",
      ],
    },
    {
      name: "face-detection",
      path: "/models/face-detection.onnx",
      type: "face",
      inputSize: [320, 320],
    },
    {
      name: "ocr-detection",
      path: "/models/ocr-detection.onnx",
      type: "ocr",
      inputSize: [640, 640],
    },
  ]

  private constructor() {}

  public static getInstance(): ONNXRuntimeService {
    if (!ONNXRuntimeService.instance) {
      ONNXRuntimeService.instance = new ONNXRuntimeService()
    }
    return ONNXRuntimeService.instance
  }

  /**
   * Инициализировать сервис
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Создаем сессии для всех моделей
      for (const model of this.models) {
        await this.loadModel(model)
      }

      this.isInitialized = true
      console.log("ONNX Runtime Service initialized successfully")
    } catch (error) {
      console.error("Failed to initialize ONNX Runtime Service:", error)
      throw error
    }
  }

  /**
   * Загрузить модель
   */
  private async loadModel(model: ONNXModel): Promise<void> {
    try {
      console.log(`Loading ONNX model: ${model.name}`)

      // В реальном приложении модель загружается с сервера
      // Сейчас создаем mock-сессию
      const mockSession = await this.createMockSession(model)

      this.sessions.set(model.name, {
        session: mockSession,
        model,
      })

      console.log(`Model ${model.name} loaded successfully`)
    } catch (error) {
      console.error(`Failed to load model ${model.name}:`, error)
      // Продолжаем работу без этой модели
    }
  }

  /**
   * Создать mock-сессию для тестирования
   */
  private async createMockSession(model: ONNXModel): Promise<InferenceSession> {
    // В реальном приложении:
    // return await InferenceSession.create(model.path);

    // Для тестирования возвращаем заглушку
    return {
      run: async () => {
        // Возвращаем mock результаты
        return this.generateMockResults(model)
      },
    } as any
  }

  /**
   * Выполнить инференс YOLO
   */
  public async runYOLOInference(imageData: ImageData | Float32Array, modelName = "yolov8n"): Promise<YoloDetection[]> {
    const modelSession = this.sessions.get(modelName)
    if (!modelSession) {
      throw new Error(`Model ${modelName} not loaded`)
    }

    try {
      // Подготовка входных данных
      const input = await this.preprocessImage(imageData, modelSession.model.inputSize)

      // Запуск инференса
      const feeds = { images: input }
      const results = await modelSession.session.run(feeds)

      // Обработка результатов
      return this.postprocessYOLO(results, modelSession.model)
    } catch (error) {
      console.error("YOLO inference failed:", error)
      throw error
    }
  }

  /**
   * Предобработка изображения
   */
  private async preprocessImage(imageData: ImageData | Float32Array, targetSize: [number, number]): Promise<Tensor> {
    // Если уже Float32Array, создаем тензор напрямую
    if (imageData instanceof Float32Array) {
      return new Tensor("float32", imageData, [1, 3, ...targetSize])
    }

    // Конвертируем ImageData в тензор
    const [width, height] = targetSize
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext("2d")!

    // Масштабируем изображение
    ctx.drawImage(await createImageBitmap(imageData), 0, 0, width, height)

    // Получаем пиксели
    const pixels = ctx.getImageData(0, 0, width, height).data

    // Конвертируем в формат CHW (Channel, Height, Width)
    const red = new Float32Array(width * height)
    const green = new Float32Array(width * height)
    const blue = new Float32Array(width * height)

    for (let i = 0; i < width * height; i++) {
      red[i] = pixels[i * 4] / 255.0
      green[i] = pixels[i * 4 + 1] / 255.0
      blue[i] = pixels[i * 4 + 2] / 255.0
    }

    // Объединяем каналы
    const data = new Float32Array(3 * width * height)
    data.set(red, 0)
    data.set(green, width * height)
    data.set(blue, 2 * width * height)

    return new Tensor("float32", data, [1, 3, height, width])
  }

  /**
   * Постобработка результатов YOLO
   */
  private postprocessYOLO(_outputs: any, _model: ONNXModel): YoloDetection[] {
    // В реальной реализации здесь будет обработка выходов модели
    // Сейчас возвращаем mock данные
    return this.generateMockYOLODetections()
  }

  /**
   * Генерировать mock результаты
   */
  private generateMockResults(model: ONNXModel): any {
    // Генерируем различные результаты в зависимости от типа модели
    switch (model.type) {
      case "yolo":
        return {
          output0: new Tensor("float32", new Float32Array(8400 * 84), [1, 84, 8400]),
        }
      case "face":
        return {
          output: new Tensor("float32", new Float32Array(100 * 5), [1, 100, 5]),
        }
      default:
        return {}
    }
  }

  /**
   * Генерировать mock YOLO детекции
   */
  private generateMockYOLODetections(): YoloDetection[] {
    // Случайные детекции для тестирования
    const detections: YoloDetection[] = []
    const numDetections = Math.floor(Math.random() * 5) + 1

    for (let i = 0; i < numDetections; i++) {
      detections.push({
        class: this.models[0].labels![Math.floor(Math.random() * this.models[0].labels!.length)],
        confidence: 0.5 + Math.random() * 0.5,
        bbox: {
          x: Math.random() * 0.7,
          y: Math.random() * 0.7,
          width: 0.1 + Math.random() * 0.2,
          height: 0.1 + Math.random() * 0.3,
        },
        trackId: i,
      })
    }

    return detections
  }

  /**
   * Выполнить инференс для детекции лиц
   */
  public async runFaceDetection(_imageData: ImageData | Float32Array): Promise<
    Array<{
      bbox: { x: number; y: number; width: number; height: number }
      confidence: number
      landmarks?: Array<{ x: number; y: number }>
    }>
  > {
    const modelSession = this.sessions.get("face-detection")
    if (!modelSession) {
      throw new Error("Face detection model not loaded")
    }

    // Mock реализация
    return [
      {
        bbox: { x: 0.3, y: 0.2, width: 0.2, height: 0.25 },
        confidence: 0.95,
        landmarks: [
          { x: 0.35, y: 0.28 }, // левый глаз
          { x: 0.45, y: 0.28 }, // правый глаз
          { x: 0.4, y: 0.35 }, // нос
          { x: 0.35, y: 0.4 }, // левый угол рта
          { x: 0.45, y: 0.4 }, // правый угол рта
        ],
      },
    ]
  }

  /**
   * Выполнить инференс для OCR
   */
  public async runOCRInference(_imageData: ImageData | Float32Array): Promise<
    Array<{
      text: string
      bbox: { x: number; y: number; width: number; height: number }
      confidence: number
      language?: string
    }>
  > {
    const modelSession = this.sessions.get("ocr-detection")
    if (!modelSession) {
      throw new Error("OCR model not loaded")
    }

    // Mock реализация - генерируем случайные детекции текста
    const mockTexts = [
      "BREAKING NEWS",
      "LIVE",
      "SUBSCRIBE",
      "FOLLOW US",
      "WELCOME",
      "SALE",
      "NEW",
      "TODAY",
      "WATCH NOW",
      "CLICK HERE",
    ]

    const detections = []
    const numDetections = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < numDetections; i++) {
      detections.push({
        text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
        bbox: {
          x: Math.random() * 0.6,
          y: Math.random() * 0.6,
          width: 0.2 + Math.random() * 0.3,
          height: 0.05 + Math.random() * 0.1,
        },
        confidence: 0.7 + Math.random() * 0.3,
        language: "en",
      })
    }

    return detections
  }

  /**
   * Проверить доступность модели
   */
  public hasModel(modelName: string): boolean {
    return this.sessions.has(modelName)
  }

  /**
   * Получить список загруженных моделей
   */
  public getLoadedModels(): string[] {
    return Array.from(this.sessions.keys())
  }

  /**
   * Очистить кэш моделей
   */
  public async dispose(): Promise<void> {
    for (const [name, session] of this.sessions.entries()) {
      try {
        await session.session.release?.()
      } catch (error) {
        console.error(`Failed to release session ${name}:`, error)
      }
    }
    this.sessions.clear()
    this.isInitialized = false
  }
}
