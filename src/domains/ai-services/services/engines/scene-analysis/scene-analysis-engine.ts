/**
 * Scene Analysis Engine - Обертка над existing video analysis tools
 *
 * Интегрируется с существующими 15 video-analysis-tools из AI Chat
 * и расширяет их возможностями scene classification и content analysis.
 */

// Используем shared типы вместо ai-chat
import type { MediaFile as MediaInput, SceneAnalysis } from "@domains/ai-services"
import { PersonDatabaseService } from "@/features/person-identification/services/person-database-service"
import type {
  DetectedFace,
  FaceEmbedding,
  PersonAppearance,
  PersonProfile,
} from "@/features/person-identification/types/person"

// Дополнительные типы для Scene Analysis
export interface SceneDetectionOptions {
  sensitivity: number
  minSceneDuration: number
  classifyTypes: boolean
  enableObjectDetection: boolean
  enablePersonTracking: boolean
}

export interface AdvancedSceneAnalysis extends SceneAnalysis {
  transitions: SceneTransition[]
  qualityScore: number
  complexity: "simple" | "moderate" | "complex"
  visualElements: VisualElement[]
  audioCharacteristics: AudioCharacteristics
  // Person Identification данные
  detectedFaces?: DetectedFace[]
  identifiedPersons?: IdentifiedPersonInScene[]
  personAppearances?: PersonAppearance[]
}

// Идентифицированная персона в сцене
export interface IdentifiedPersonInScene {
  personId: string
  person: PersonProfile
  confidence: number
  appearances: PersonAppearanceInScene[]
}

// Появление персоны в сцене
export interface PersonAppearanceInScene {
  startTime: number
  endTime: number
  confidence: number
  detectedFaces: DetectedFace[]
  isMainCharacter: boolean
}

export interface SceneTransition {
  type: "cut" | "fade" | "dissolve" | "wipe" | "zoom" | "custom"
  duration: number
  timestamp: number
  confidence: number
}

export interface VisualElement {
  type: "text" | "logo" | "graphic" | "face" | "object" | "motion"
  element: string
  confidence: number
  position: { x: number; y: number; width: number; height: number }
  duration: number
}

export interface AudioCharacteristics {
  hasVoice: boolean
  hasMusic: boolean
  hasSfx: boolean
  volume: "quiet" | "normal" | "loud"
  clarity: number
  language?: string
}

/**
 * Scene Analysis Engine - расширяет существующие video analysis tools
 * Использует shared AI services
 */
export class SceneAnalysisEngine {
  private sharedAIService: any = null
  private ffmpegService: any = null
  private personDatabase: PersonDatabaseService
  private defaultOptions: SceneDetectionOptions = {
    sensitivity: 0.5,
    minSceneDuration: 2.0,
    classifyTypes: true,
    enableObjectDetection: false,
    enablePersonTracking: false,
  }

  constructor() {
    this.personDatabase = PersonDatabaseService.getInstance()
  }

  /**
   * Инициализация shared сервисов
   */
  private async initializeServices() {
    if (!this.sharedAIService) {
      try {
        const { getAIContainer } = await import("@domains/ai-core")
        const aiContainer = getAIContainer()
        this.sharedAIService = await aiContainer.resolve("UnifiedAIService")
        this.ffmpegService = await aiContainer.resolve("FFmpegService")
      } catch (error) {
        console.error("Ошибка инициализации shared AI services:", error)
        throw new Error("Не удалось инициализировать AI сервисы")
      }
    }
  }

  /**
   * Основной метод анализа сцен
   */
  async analyzeScenes(
    mediaFile: MediaInput,
    options: Partial<SceneDetectionOptions> = {},
  ): Promise<AdvancedSceneAnalysis[]> {
    const opts = { ...this.defaultOptions, ...options }

    // Инициализируем shared сервисы
    await this.initializeServices()

    try {
      // 1. Базовый анализ через existing video tools
      const basicScenes = await this.performBasicSceneDetection(mediaFile, opts)

      // 2. Расширенный анализ каждой сцены
      const advancedScenes: AdvancedSceneAnalysis[] = []

      for (const scene of basicScenes) {
        const advancedScene = await this.enhanceSceneAnalysis(scene, mediaFile, opts)
        advancedScenes.push(advancedScene)
      }

      // 3. Person Identification (если включено)
      let scenesWithPersons = advancedScenes
      if (opts.enablePersonTracking) {
        scenesWithPersons = await this.enhanceWithPersonIdentification(scenesWithPersons, mediaFile)
      }

      // 4. Анализ переходов между сценами
      const scenesWithTransitions = await this.analyzeTransitions(scenesWithPersons, mediaFile)

      return scenesWithTransitions
    } catch (error) {
      console.error("Ошибка анализа сцен:", error)
      throw new Error(`Не удалось проанализировать сцены в файле ${mediaFile.filename}: ${String(error)}`)
    }
  }

  /**
   * Базовая детекция сцен с использованием shared FFmpeg service
   */
  private async performBasicSceneDetection(
    mediaFile: MediaInput,
    options: SceneDetectionOptions,
  ): Promise<SceneAnalysis[]> {
    try {
      // Используем shared FFmpeg service для детекции сцен
      const sceneDetection = await this.ffmpegService.detectScenes(mediaFile.path, {
        sensitivity: options.sensitivity,
        minSceneDuration: options.minSceneDuration,
        method: "threshold",
      })

      // Если нужна классификация типов сцен, используем AI
      if (options.classifyTypes && sceneDetection.scenes.length > 0) {
        const classificationPrompt = `Классифицируй типы сцен на основе их описаний:
${JSON.stringify(sceneDetection.scenes.map((s: any) => ({ id: s.id, description: s.description || "" })))}

Для каждой сцены определи тип: dialog, action, landscape, closeup, transition
Верни JSON массив с полями: id, type`

        const response = await (this.sharedAIService as any).sendRequest(
          "claude-4-sonnet-latest",
          [{ role: "user", content: classificationPrompt }],
          { temperature: 0.3 },
        )

        try {
          const classifications = JSON.parse(response.content)
          const classificationMap = new Map(classifications.map((c: any) => [c.id, c.type]))

          return sceneDetection.scenes.map((scene: SceneAnalysis) => ({
            id: scene.id,
            startTime: scene.startTime,
            endTime: scene.endTime,
            type: classificationMap.get(scene.id) || "action",
            confidence: scene.confidence || 0.8,
            keyFrames: scene.keyFrames || [],
            description: scene.description || "",
            objects: options.enableObjectDetection ? [] : undefined,
            persons: options.enablePersonTracking ? [] : undefined,
          }))
        } catch {
          // Fallback без классификации
          return sceneDetection.scenes.map((scene: SceneAnalysis) => ({
            id: scene.id,
            startTime: scene.startTime,
            endTime: scene.endTime,
            type: "action" as const,
            confidence: scene.confidence || 0.8,
            keyFrames: scene.keyFrames || [],
            description: scene.description || "",
            objects: options.enableObjectDetection ? [] : undefined,
            persons: options.enablePersonTracking ? [] : undefined,
          }))
        }
      }

      // Без классификации типов
      return sceneDetection.scenes.map((scene: SceneAnalysis) => ({
        id: scene.id,
        startTime: scene.startTime,
        endTime: scene.endTime,
        type: "action" as const,
        confidence: scene.confidence || 0.8,
        keyFrames: scene.keyFrames || [],
        description: scene.description || "",
        objects: options.enableObjectDetection ? [] : undefined,
        persons: options.enablePersonTracking ? [] : undefined,
      }))
    } catch (error) {
      console.warn("Ошибка детекции сцен через shared FFmpeg:", error)
      return []
    }
  }

  /**
   * Расширенный анализ отдельной сцены
   */
  private async enhanceSceneAnalysis(
    scene: SceneAnalysis,
    mediaFile: MediaInput,
    _options: SceneDetectionOptions,
  ): Promise<AdvancedSceneAnalysis> {
    const analysisPrompt = `Проведи углубленный анализ сцены:

Видео: ${mediaFile.filename}
Сцена: ${scene.startTime}s - ${scene.endTime}s
Тип: ${scene.type}
Описание: ${scene.description}

Проанализируй:
1. Визуальные элементы (текст, логотипы, графика, лица, объекты, движение)
2. Аудио характеристики (голос, музыка, эффекты, громкость, четкость)
3. Качество сцены (0-10)
4. Сложность сцены (simple/moderate/complex)

Формат ответа JSON:
{
  "visualElements": [
    {"type": "...", "element": "...", "confidence": 0.8, "position": {"x": 0, "y": 0, "width": 100, "height": 100}, "duration": 2.5}
  ],
  "audioCharacteristics": {
    "hasVoice": true,
    "hasMusic": false, 
    "hasSfx": false,
    "volume": "normal",
    "clarity": 0.8,
    "language": "ru"
  },
  "qualityScore": 7.5,
  "complexity": "moderate"
}`

    const response = await (this.sharedAIService as any).sendRequest(
      "claude-4-sonnet-latest",
      [{ role: "user", content: analysisPrompt }],
      { temperature: 0.2 },
    )

    try {
      const analysis = JSON.parse(response.content)

      return {
        ...scene,
        visualElements: analysis.visualElements || [],
        audioCharacteristics: analysis.audioCharacteristics || {
          hasVoice: false,
          hasMusic: false,
          hasSfx: false,
          volume: "normal",
          clarity: 0.5,
        },
        qualityScore: analysis.qualityScore || 5.0,
        complexity: analysis.complexity || "moderate",
        transitions: [], // Будет заполнено в analyzeTransitions
        detectedFaces: [],
        identifiedPersons: [],
        personAppearances: [],
      }
    } catch (error) {
      console.warn(`Ошибка расширенного анализа сцены ${scene.id}:`, error)
      return {
        ...scene,
        visualElements: [],
        audioCharacteristics: {
          hasVoice: false,
          hasMusic: false,
          hasSfx: false,
          volume: "normal",
          clarity: 0.5,
        },
        qualityScore: 5.0,
        complexity: "moderate",
        transitions: [],
        detectedFaces: [],
        identifiedPersons: [],
        personAppearances: [],
      }
    }
  }

  /**
   * Анализ переходов между сценами
   */
  private async analyzeTransitions(
    scenes: AdvancedSceneAnalysis[],
    mediaFile: MediaInput,
  ): Promise<AdvancedSceneAnalysis[]> {
    if (scenes.length < 2) return scenes

    const transitionsPrompt = `Проанализируй переходы между сценами в видео:

Файл: ${mediaFile.filename}
Сцены: ${scenes.map((s) => `${s.id} (${s.startTime}s-${s.endTime}s, ${s.type})`).join(", ")}

Для каждого перехода определи:
- type: тип перехода (cut, fade, dissolve, wipe, zoom, custom)
- duration: длительность перехода в секундах
- timestamp: временная метка перехода
- confidence: уверенность в определении типа

Формат ответа JSON массив переходов:
[
  {"sceneFromId": "scene1", "sceneToId": "scene2", "type": "cut", "duration": 0.1, "timestamp": 10.5, "confidence": 0.9}
]`

    try {
      const response = await (this.sharedAIService as any).sendRequest(
        "claude-4-sonnet-latest",
        [{ role: "user", content: transitionsPrompt }],
        { temperature: 0.2 },
      )

      const transitions = JSON.parse(response.content)

      // Применяем переходы к соответствующим сценам
      const scenesWithTransitions = scenes.map((scene) => ({
        ...scene,
        transitions: transitions.filter((t: any) => t.sceneFromId === scene.id || t.sceneToId === scene.id),
      }))

      return scenesWithTransitions
    } catch (error) {
      console.warn("Ошибка анализа переходов:", error)
      return scenes
    }
  }

  /**
   * Дополнительный анализ с Person Identification
   */
  private async enhanceWithPersonIdentification(
    scenes: AdvancedSceneAnalysis[],
    mediaFile: MediaInput,
  ): Promise<AdvancedSceneAnalysis[]> {
    const enhancedScenes: AdvancedSceneAnalysis[] = []

    for (const scene of scenes) {
      try {
        // 1. Детекция лиц в сцене
        const detectedFaces = await this.detectFacesInScene(scene, mediaFile)

        // 2. Идентификация персон
        const identifiedPersons = await this.identifyPersonsInFaces(detectedFaces, scene)

        // 3. Создание появлений персон
        const personAppearances = await this.createPersonAppearances(identifiedPersons, scene, detectedFaces)

        // 4. Обновление базы данных персон
        await this.updatePersonDatabase(identifiedPersons, personAppearances, scene, mediaFile)

        enhancedScenes.push({
          ...scene,
          detectedFaces,
          identifiedPersons,
          personAppearances,
        })
      } catch (error) {
        console.warn(`Ошибка Person Identification для сцены ${scene.id}:`, error)
        enhancedScenes.push({
          ...scene,
          detectedFaces: [],
          identifiedPersons: [],
          personAppearances: [],
        })
      }
    }

    return enhancedScenes
  }

  /**
   * Детекция лиц в сцене
   */
  private async detectFacesInScene(scene: AdvancedSceneAnalysis, mediaFile: MediaInput): Promise<DetectedFace[]> {
    const prompt = `Детектируй лица в видео сцене:

Файл: ${mediaFile.filename}
Сцена: ${scene.startTime}s - ${scene.endTime}s
Описание: ${scene.description}
Тип: ${scene.type}

Выполни детекцию лиц используя существующие video-analysis-tools и верни JSON массив обнаруженных лиц:

[
  {
    "id": "face_1",
    "bbox": {"x": 100, "y": 150, "width": 80, "height": 100},
    "confidence": 0.95,
    "frameNumber": 150,
    "timestamp": {"seconds": 5.0},
    "age": 25,
    "gender": "female",
    "emotion": "happy",
    "blur": 0.1,
    "occlusion": 0.0,
    "pose": {"yaw": 10, "pitch": -5, "roll": 2}
  }
]

Для каждого лица определи:
- Координаты bounding box
- Уверенность детекции
- Номер кадра и временную метку
- Возраст, пол, эмоцию (если возможно)
- Качественные характеристики (blur, occlusion, pose)`

    try {
      const response = await (this.sharedAIService as any).sendRequest(
        "claude-4-sonnet-latest",
        [{ role: "user", content: prompt }],
        {
          temperature: 0.2,
        },
      )

      const faces = JSON.parse(response.content)
      return faces.map((face: any) => ({
        id: face.id || `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        bbox: face.bbox || { x: 0, y: 0, width: 100, height: 100 },
        confidence: face.confidence || 0.8,
        age: face.age,
        gender: face.gender || "unknown",
        emotion: face.emotion || "neutral",
        blur: face.blur || 0.5,
        occlusion: face.occlusion || 0.5,
        pose: face.pose || { yaw: 0, pitch: 0, roll: 0 },
        frameNumber: face.frameNumber || 0,
        timestamp: face.timestamp || { seconds: scene.startTime },
        clipId: mediaFile.path,
      }))
    } catch (error) {
      console.warn("Ошибка детекции лиц:", error)
      return []
    }
  }

  /**
   * Идентификация персон по детектированным лицам
   */
  private async identifyPersonsInFaces(
    detectedFaces: DetectedFace[],
    _scene: AdvancedSceneAnalysis,
  ): Promise<IdentifiedPersonInScene[]> {
    const identifiedPersons: IdentifiedPersonInScene[] = []

    for (const face of detectedFaces) {
      try {
        // Генерируем фейковый эмбеддинг для демонстрации
        // В реальной реализации здесь будет использоваться ONNX Runtime
        const fakeEmbedding = this.generateFakeEmbedding()

        // Поиск в базе данных персон
        const searchResults = await this.personDatabase.searchPersonsByEmbedding(
          fakeEmbedding,
          0.7, // threshold
          1, // limit
        )

        if (searchResults.length > 0) {
          const result = searchResults[0]

          // Ищем уже добавленную персону в результатах
          const existingPerson = identifiedPersons.find((p) => p.personId === result.person.id)

          if (existingPerson) {
            // Добавляем новое появление к существующей персоне
            existingPerson.appearances.push({
              startTime: face.timestamp.seconds,
              endTime: face.timestamp.seconds + 1, // Примерная длительность
              confidence: face.confidence,
              detectedFaces: [face],
              isMainCharacter: face.confidence > 0.8 && face.bbox.width * face.bbox.height > 5000,
            })
          } else {
            // Создаем новую запись персоны
            identifiedPersons.push({
              personId: result.person.id,
              person: result.person,
              confidence: result.similarity,
              appearances: [
                {
                  startTime: face.timestamp.seconds,
                  endTime: face.timestamp.seconds + 1,
                  confidence: face.confidence,
                  detectedFaces: [face],
                  isMainCharacter: face.confidence > 0.8 && face.bbox.width * face.bbox.height > 5000,
                },
              ],
            })
          }
        } else {
          // Персона не найдена - можно создать новую или пропустить
          console.log(`Не удалось идентифицировать лицо ${face.id}`)
        }
      } catch (error) {
        console.warn(`Ошибка идентификации лица ${face.id}:`, error)
      }
    }

    return identifiedPersons
  }

  /**
   * Создание записей появлений персон
   */
  private async createPersonAppearances(
    identifiedPersons: IdentifiedPersonInScene[],
    scene: AdvancedSceneAnalysis,
    _detectedFaces: DetectedFace[],
  ): Promise<PersonAppearance[]> {
    const appearances: PersonAppearance[] = []

    for (const identifiedPerson of identifiedPersons) {
      try {
        // Объединяем все появления персоны в сцене
        const allDetections = identifiedPerson.appearances.flatMap((app) => app.detectedFaces)

        const appearance: PersonAppearance = {
          id: `appearance_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          personId: identifiedPerson.personId,
          clipId: scene.id,
          startTime: { seconds: Math.min(...identifiedPerson.appearances.map((app) => app.startTime)) },
          endTime: { seconds: Math.max(...identifiedPerson.appearances.map((app) => app.endTime)) },
          duration:
            Math.max(...identifiedPerson.appearances.map((app) => app.endTime)) -
            Math.min(...identifiedPerson.appearances.map((app) => app.startTime)),
          confidence:
            identifiedPerson.appearances.reduce((sum, app) => sum + app.confidence, 0) /
            identifiedPerson.appearances.length,
          minConfidence: Math.min(...identifiedPerson.appearances.map((app) => app.confidence)),
          maxConfidence: Math.max(...identifiedPerson.appearances.map((app) => app.confidence)),
          detections: allDetections,
          createdAt: new Date().toISOString(),
        }

        appearances.push(appearance)
      } catch (error) {
        console.warn(`Ошибка создания появления для персоны ${identifiedPerson.personId}:`, error)
      }
    }

    return appearances
  }

  /**
   * Обновление базы данных персон
   */
  private async updatePersonDatabase(
    _identifiedPersons: IdentifiedPersonInScene[],
    appearances: PersonAppearance[],
    _scene: AdvancedSceneAnalysis,
    _mediaFile: MediaInput,
  ): Promise<void> {
    for (const appearance of appearances) {
      try {
        // Добавляем появление в базу данных
        await this.personDatabase.addAppearance(appearance.personId, appearance)

        // Генерируем эмбеддинги для новых детекций
        for (const detection of appearance.detections) {
          const fakeEmbedding: FaceEmbedding = {
            vector: this.generateFakeEmbedding(),
            quality: detection.confidence,
            faceId: detection.id,
            timestamp: detection.timestamp,
            frameNumber: detection.frameNumber ?? 0,
            clipId: detection.clipId,
            createdAt: new Date().toISOString(),
          }

          await this.personDatabase.addEmbedding(appearance.personId, fakeEmbedding)
        }
      } catch (error) {
        console.warn(`Ошибка обновления базы данных для персоны ${appearance.personId}:`, error)
      }
    }
  }

  /**
   * Генерация фейкового эмбеддинга для демонстрации
   * В реальной реализации здесь будет ONNX Runtime модель
   */
  private generateFakeEmbedding(): Float32Array {
    const dimension = 512
    const embedding = new Float32Array(dimension)

    for (let i = 0; i < dimension; i++) {
      embedding[i] = (Math.random() - 0.5) * 2 // Значения от -1 до 1
    }

    // Нормализуем вектор
    let norm = 0
    for (let i = 0; i < dimension; i++) {
      norm += embedding[i] * embedding[i]
    }
    norm = Math.sqrt(norm)

    for (let i = 0; i < dimension; i++) {
      embedding[i] /= norm
    }

    return embedding
  }

  /**
   * Автоматическое создание профилей для новых лиц
   */
  async createPersonProfilesFromUnidentifiedFaces(
    detectedFaces: DetectedFace[],
    _mediaFile: MediaInput,
  ): Promise<PersonProfile[]> {
    try {
      // Кластеризуем неопознанные лица
      const newPersons = await this.personDatabase.clusterUnidentifiedFaces(detectedFaces, 0.8)

      console.log(`Создано ${newPersons.length} новых профилей персон из неопознанных лиц`)
      return newPersons
    } catch (error) {
      console.error("Ошибка создания профилей персон:", error)
      return []
    }
  }

  /**
   * Экспорт данных персон из сцен
   */
  async exportPersonsFromScenes(scenes: AdvancedSceneAnalysis[], format: "json" | "csv" = "json"): Promise<string> {
    const personsData = scenes.flatMap(
      (scene) =>
        scene.identifiedPersons?.map((person) => ({
          sceneId: scene.id,
          personId: person.personId,
          personName: person.person.name || "Unknown",
          confidence: person.confidence,
          appearances: person.appearances.length,
          isMainCharacter: person.appearances.some((app) => app.isMainCharacter),
          sceneStartTime: scene.startTime,
          sceneEndTime: scene.endTime,
        })) || [],
    )

    if (format === "json") {
      return JSON.stringify(personsData, null, 2)
    }
    // CSV формат
    const headers = [
      "sceneId",
      "personId",
      "personName",
      "confidence",
      "appearances",
      "isMainCharacter",
      "sceneStartTime",
      "sceneEndTime",
    ]
    const rows = personsData.map((data) => [
      data.sceneId,
      data.personId,
      `"${data.personName}"`,
      data.confidence,
      data.appearances,
      data.isMainCharacter,
      data.sceneStartTime,
      data.sceneEndTime,
    ])

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }

  /**
   * Групировка похожих сцен
   */
  async groupSimilarScenes(scenes: AdvancedSceneAnalysis[]): Promise<SceneGroup[]> {
    const groupingPrompt = `Сгруппируй похожие сцены на основе их характеристик:

Сцены:
${scenes.map((s) => `${s.id}: тип=${s.type}, описание="${s.description}", качество=${s.qualityScore}, сложность=${s.complexity}`).join("\n")}

Критерии группировки:
- Похожие типы сцен
- Схожие визуальные элементы
- Общие аудио характеристики
- Близкое качество и сложность

Верни JSON массив групп:
[
  {
    "id": "group1",
    "name": "Диалоговые сцены",
    "description": "Сцены с диалогами персонажей",
    "sceneIds": ["scene1", "scene3"],
    "commonCharacteristics": ["dialog", "has_voice", "medium_quality"],
    "similarity": 0.85
  }
]`

    try {
      const response = await (this.sharedAIService as any).sendRequest(
        "claude-4-sonnet-latest",
        [{ role: "user", content: groupingPrompt }],
        { temperature: 0.3 },
      )

      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка группировки сцен:", error)
      return []
    }
  }

  /**
   * Экспорт результатов анализа
   */
  async exportAnalysis(scenes: AdvancedSceneAnalysis[], format: "json" | "csv" | "xml" = "json"): Promise<string> {
    switch (format) {
      case "json":
        return JSON.stringify(scenes, null, 2)

      case "csv":
        return this.convertToCSV(scenes)

      case "xml":
        return this.convertToXML(scenes)

      default:
        throw new Error(`Неподдерживаемый формат экспорта: ${format}`)
    }
  }

  private convertToCSV(scenes: AdvancedSceneAnalysis[]): string {
    const headers = [
      "id",
      "startTime",
      "endTime",
      "type",
      "confidence",
      "description",
      "qualityScore",
      "complexity",
      "hasVoice",
      "hasMusic",
      "volume",
    ]

    const rows = scenes.map((scene) => [
      scene.id,
      scene.startTime,
      scene.endTime,
      scene.type,
      scene.confidence,
      `"${scene.description?.replace(/"/g, '""') ?? ""}"`,
      scene.qualityScore,
      scene.complexity,
      scene.audioCharacteristics.hasVoice,
      scene.audioCharacteristics.hasMusic,
      scene.audioCharacteristics.volume,
    ])

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }

  private convertToXML(scenes: AdvancedSceneAnalysis[]): string {
    const xmlScenes = scenes
      .map(
        (scene) => `
    <scene>
      <id>${scene.id}</id>
      <startTime>${scene.startTime}</startTime>
      <endTime>${scene.endTime}</endTime>
      <type>${scene.type}</type>
      <confidence>${scene.confidence}</confidence>
      <description><![CDATA[${scene.description}]]></description>
      <qualityScore>${scene.qualityScore}</qualityScore>
      <complexity>${scene.complexity}</complexity>
      <audio>
        <hasVoice>${scene.audioCharacteristics.hasVoice}</hasVoice>
        <hasMusic>${scene.audioCharacteristics.hasMusic}</hasMusic>
        <volume>${scene.audioCharacteristics.volume}</volume>
      </audio>
    </scene>`,
      )
      .join("")

    return `<?xml version="1.0" encoding="UTF-8"?>
<sceneAnalysis>
  <scenes>${xmlScenes}
  </scenes>
</sceneAnalysis>`
  }
}

// Дополнительные типы
export interface SceneGroup {
  id: string
  name: string
  description: string
  sceneIds: string[]
  commonCharacteristics: string[]
  similarity: number
}

export default SceneAnalysisEngine
