/**
 * Character Analysis Service
 * Анализ персонажей и определение отношений между ними
 */

import { SceneAnalysis } from "@/domains/shared/types/ai-tools/content-analysis"
import type { Person } from "@/features/montage-planner/types"
import type { DetectedFace, PersonProfile } from "@/features/person-identification/types/person"

// Типы отношений между персонажами
export enum RelationshipType {
  FAMILY = "family",
  ROMANTIC = "romantic",
  FRIENDS = "friends",
  COLLEAGUES = "colleagues",
  STRANGERS = "strangers",
  CONFLICT = "conflict",
  MENTOR_STUDENT = "mentor_student",
  PROFESSIONAL = "professional",
  UNKNOWN = "unknown",
}

// Интенсивность взаимодействия
export enum InteractionIntensity {
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "very_high",
}

// Эмоциональная окраска взаимодействия
export enum EmotionalTone {
  POSITIVE = "positive",
  NEGATIVE = "negative",
  NEUTRAL = "neutral",
  MIXED = "mixed",
}

// Анализ отношений между персонажами
export interface CharacterRelationship {
  id: string
  personA: string // ID персоны A
  personB: string // ID персоны B
  type: RelationshipType
  confidence: number
  intensity: InteractionIntensity
  emotionalTone: EmotionalTone
  interactions: CharacterInteraction[]
  evidence: RelationshipEvidence[]
  firstDetectedAt: number // timestamp
  lastDetectedAt: number // timestamp
  totalInteractionTime: number // в секундах
}

// Отдельное взаимодействие между персонажами
export interface CharacterInteraction {
  id: string
  sceneId: string
  startTime: number
  endTime: number
  duration: number
  type: InteractionType
  participants: string[] // IDs персон
  description: string
  confidence: number
  visualCues: VisualCue[]
  proximityScore: number // 0-1, насколько близко находятся персонажи
  gazeDirection?: GazeDirection
  bodyLanguage?: BodyLanguage
}

// Типы взаимодействий
export enum InteractionType {
  CONVERSATION = "conversation",
  PHYSICAL_CONTACT = "physical_contact",
  SHARED_ACTIVITY = "shared_activity",
  CONFLICT = "conflict",
  COOPERATION = "cooperation",
  OBSERVATION = "observation", // один смотрит на другого
  PARALLEL_ACTION = "parallel_action", // делают что-то параллельно
  UNKNOWN = "unknown",
}

// Визуальные подсказки для определения отношений
export interface VisualCue {
  type: VisualCueType
  description: string
  confidence: number
  timestamp: number
}

export enum VisualCueType {
  PROXIMITY = "proximity", // близость расположения
  EYE_CONTACT = "eye_contact", // зрительный контакт
  BODY_POSTURE = "body_posture", // поза тела
  FACIAL_EXPRESSION = "facial_expression", // выражение лица
  GESTURE = "gesture", // жесты
  SHARED_FOCUS = "shared_focus", // общий фокус внимания
  SIMILAR_CLOTHING = "similar_clothing", // похожая одежда
  SYNCHRONIZED_MOVEMENT = "synchronized_movement", // синхронные движения
}

// Направление взгляда
export interface GazeDirection {
  isLookingAtOtherPerson: boolean
  targetPersonId?: string
  confidence: number
}

// Язык тела
export interface BodyLanguage {
  openness: number // 0-1, открытая/закрытая поза
  dominance: number // 0-1, доминирующая/подчиненная поза
  engagement: number // 0-1, заинтересованность/отстраненность
  mirroring: boolean // повторяют ли персонажи позы друг друга
  confidence: number
}

// Доказательства отношений
export interface RelationshipEvidence {
  type: EvidenceType
  description: string
  confidence: number
  sceneIds: string[]
  weight: number // важность этого доказательства
}

export enum EvidenceType {
  PROXIMITY_FREQUENCY = "proximity_frequency", // часто находятся рядом
  INTERACTION_DURATION = "interaction_duration", // продолжительность взаимодействий
  EMOTIONAL_SYNCHRONY = "emotional_synchrony", // синхронность эмоций
  CONVERSATION_PATTERNS = "conversation_patterns", // паттерны разговоров
  PHYSICAL_CONTACT = "physical_contact", // физический контакт
  SHARED_OBJECTS = "shared_objects", // общие предметы
  ENTRY_EXIT_TIMING = "entry_exit_timing", // синхронность появления/исчезновения
  CLOTHING_COORDINATION = "clothing_coordination", // координация одежды
}

// Результат анализа персонажей
export interface CharacterAnalysisResult {
  characters: CharacterProfile[]
  relationships: CharacterRelationship[]
  interactions: CharacterInteraction[]
  socialNetwork: SocialNetworkNode[]
  summary: CharacterAnalysisSummary
}

// Профиль персонажа с анализом поведения
export interface CharacterProfile {
  personId: string
  person: PersonProfile | Person
  appearanceCount: number
  totalScreenTime: number // в секундах
  sceneAppearances: string[] // IDs сцен где появляется
  role: CharacterRole
  traits: CharacterTraits
  relationships: string[] // IDs отношений
  mostActiveScene: string // ID сцены с наибольшей активностью
  averageProximityToOthers: number // средняя близость к другим персонажам
  emotionalRange: EmotionalRange
}

export enum CharacterRole {
  PROTAGONIST = "protagonist",
  ANTAGONIST = "antagonist",
  SUPPORTING = "supporting",
  BACKGROUND = "background",
  NARRATOR = "narrator",
  UNKNOWN = "unknown",
}

// Черты характера на основе визуального анализа
export interface CharacterTraits {
  dominance: number // 0-1
  sociability: number // 0-1
  activityLevel: number // 0-1
  emotionalStability: number // 0-1
  confidence: number
}

// Эмоциональный диапазон персонажа
export interface EmotionalRange {
  dominantEmotion: string
  emotionalVariability: number // 0-1, насколько разнообразны эмоции
  positiveRatio: number // процент позитивных эмоций
  negativeRatio: number // процент негативных эмоций
  neutralRatio: number // процент нейтральных эмоций
}

// Узел социальной сети
export interface SocialNetworkNode {
  personId: string
  connections: SocialConnection[]
  centrality: number // центральность в сети
  influence: number // влияние на других
}

export interface SocialConnection {
  targetPersonId: string
  strength: number // сила связи 0-1
  relationshipType: RelationshipType
}

// Сводка анализа персонажей
export interface CharacterAnalysisSummary {
  totalCharacters: number
  mainCharacters: number // персонажи с ролью protagonist/antagonist
  averageRelationshipsPerCharacter: number
  mostCommonRelationshipType: RelationshipType
  socialComplexity: number // 0-1, сложность социальных взаимодействий
  dominantEmotionalTone: EmotionalTone
  networkDensity: number // плотность социальной сети
}

interface CharacterAnalysisConfig {
  enableRelationshipDetection: boolean
  enableInteractionAnalysis: boolean
  enableEmotionalAnalysis: boolean
  enableTraitAnalysis: boolean
  minInteractionDuration: number // минимальная длительность взаимодействия
  proximityThreshold: number // порог близости для определения взаимодействия
  confidenceThreshold: number
  useAI: boolean
  aiModel?: string
}

export class CharacterAnalysisService {
  private static instance: CharacterAnalysisService
  private config: CharacterAnalysisConfig

  private constructor() {
    this.config = {
      enableRelationshipDetection: true,
      enableInteractionAnalysis: true,
      enableEmotionalAnalysis: true,
      enableTraitAnalysis: true,
      minInteractionDuration: 1.0, // 1 секунда
      proximityThreshold: 0.3, // персонажи должны быть близко
      confidenceThreshold: 0.6,
      useAI: true,
      aiModel: "gpt-4",
    }
  }

  static getInstance(): CharacterAnalysisService {
    if (!CharacterAnalysisService.instance) {
      CharacterAnalysisService.instance = new CharacterAnalysisService()
    }
    return CharacterAnalysisService.instance
  }

  /**
   * Основной метод анализа персонажей
   */
  async analyzeCharacters(
    scenes: SceneAnalysis[],
    detectedPersons: Person[],
    _mediaFile: any,
  ): Promise<CharacterAnalysisResult> {
    try {
      console.log(`Analyzing characters for ${detectedPersons.length} detected persons in ${scenes.length} scenes`)

      // 1. Создаем профили персонажей
      const characters = await this.createCharacterProfiles(scenes, detectedPersons)

      // 2. Анализируем взаимодействия между персонажами
      const interactions = await this.analyzeInteractions(scenes, characters)

      // 3. Определяем отношения на основе взаимодействий
      const relationships = await this.detectRelationships(interactions, characters, scenes)

      // 4. Строим социальную сеть
      const socialNetwork = this.buildSocialNetwork(characters, relationships)

      // 5. Создаем сводку
      const summary = this.createAnalysisSummary(characters, relationships, interactions)

      return {
        characters,
        relationships,
        interactions,
        socialNetwork,
        summary,
      }
    } catch (error) {
      console.error("Character analysis failed:", error)
      throw error
    }
  }

  /**
   * Создание профилей персонажей на основе их появлений в сценах
   */
  private async createCharacterProfiles(
    scenes: SceneAnalysis[],
    detectedPersons: Person[],
  ): Promise<CharacterProfile[]> {
    const profiles: CharacterProfile[] = []

    for (const person of detectedPersons) {
      // Находим все сцены где появляется этот персонаж
      const personScenes = scenes.filter((scene) =>
        scene.content?.identifiedPersons?.some((p: any) => p.id === person.id),
      )

      if (personScenes.length === 0) continue

      // Вычисляем статистику появлений
      const totalScreenTime = personScenes.reduce((sum, scene) => sum + scene.duration, 0)
      const mostActiveScene = personScenes.reduce((max, scene) => (scene.duration > max.duration ? scene : max)).id

      // Анализируем черты характера
      const traits = await this.analyzeCharacterTraits(person, personScenes)

      // Анализируем эмоциональный диапазон
      const emotionalRange = await this.analyzeEmotionalRange(person, personScenes)

      // Определяем роль персонажа
      const role = this.determineCharacterRole(person, personScenes, totalScreenTime)

      const profile: CharacterProfile = {
        personId: person.id,
        person,
        appearanceCount: personScenes.length,
        totalScreenTime,
        sceneAppearances: personScenes.map((s) => s.id),
        role,
        traits,
        relationships: [], // Будет заполнено после анализа отношений
        mostActiveScene,
        averageProximityToOthers: 0, // Будет вычислено после анализа взаимодействий
        emotionalRange,
      }

      profiles.push(profile)
    }

    return profiles
  }

  /**
   * Анализ взаимодействий между персонажами в сценах
   */
  private async analyzeInteractions(
    scenes: SceneAnalysis[],
    characters: CharacterProfile[],
  ): Promise<CharacterInteraction[]> {
    const interactions: CharacterInteraction[] = []

    for (const scene of scenes) {
      // Находим персонажей в этой сцене
      const sceneCharacters = characters.filter((char) => char.sceneAppearances.includes(scene.id))

      if (sceneCharacters.length < 2) continue // Нужно минимум 2 персонажа для взаимодействия

      // Анализируем все возможные пары персонажей
      for (let i = 0; i < sceneCharacters.length; i++) {
        for (let j = i + 1; j < sceneCharacters.length; j++) {
          const charA = sceneCharacters[i]
          const charB = sceneCharacters[j]

          const interaction = await this.analyzePersonPairInteraction(charA, charB, scene)

          if (interaction && interaction.duration >= this.config.minInteractionDuration) {
            interactions.push(interaction)
          }
        }
      }
    }

    return interactions
  }

  /**
   * Анализ взаимодействия между парой персонажей в сцене
   */
  private async analyzePersonPairInteraction(
    charA: CharacterProfile,
    charB: CharacterProfile,
    scene: SceneAnalysis,
  ): Promise<CharacterInteraction | null> {
    try {
      // Извлекаем данные о лицах персонажей из сцены
      const facesA = this.extractPersonFacesFromScene(charA.personId, scene)
      const facesB = this.extractPersonFacesFromScene(charB.personId, scene)

      if (facesA.length === 0 || facesB.length === 0) return null

      // Вычисляем близость персонажей
      const proximityScore = this.calculateProximity(facesA, facesB)

      if (proximityScore < this.config.proximityThreshold) return null

      // Определяем тип взаимодействия
      const interactionType = await this.determineInteractionType(charA, charB, scene, facesA, facesB)

      // Анализируем визуальные подсказки
      const visualCues = await this.analyzeVisualCues(facesA, facesB, scene)

      // Анализируем направление взгляда
      const gazeDirection = this.analyzeGazeDirection(facesA, facesB)

      // Анализируем язык тела
      const bodyLanguage = await this.analyzeBodyLanguage(facesA, facesB)

      const interaction: CharacterInteraction = {
        id: `interaction_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        sceneId: scene.id,
        startTime: scene.startTime,
        endTime: scene.endTime,
        duration: scene.duration,
        type: interactionType,
        participants: [charA.personId, charB.personId],
        description: this.generateInteractionDescription(interactionType, charA, charB),
        confidence: Math.min(proximityScore, 0.9),
        visualCues,
        proximityScore,
        gazeDirection,
        bodyLanguage,
      }

      return interaction
    } catch (error) {
      console.warn(`Failed to analyze interaction between ${charA.personId} and ${charB.personId}:`, error)
      return null
    }
  }

  /**
   * Определение отношений между персонажами на основе взаимодействий
   */
  private async detectRelationships(
    interactions: CharacterInteraction[],
    characters: CharacterProfile[],
    scenes: SceneAnalysis[],
  ): Promise<CharacterRelationship[]> {
    const relationships: CharacterRelationship[] = []

    // Группируем взаимодействия по парам персонажей
    const interactionPairs = new Map<string, CharacterInteraction[]>()

    for (const interaction of interactions) {
      if (interaction.participants.length !== 2) continue

      const [personA, personB] = interaction.participants.sort() // Сортируем для консистентности
      const pairKey = `${personA}_${personB}`

      if (!interactionPairs.has(pairKey)) {
        interactionPairs.set(pairKey, [])
      }
      interactionPairs.get(pairKey)!.push(interaction)
    }

    // Анализируем каждую пару
    for (const [pairKey, pairInteractions] of interactionPairs) {
      const [personA, personB] = pairKey.split("_")

      const relationship = await this.analyzeRelationshipBetweenPersons(
        personA,
        personB,
        pairInteractions,
        characters,
        scenes,
      )

      if (relationship) {
        relationships.push(relationship)

        // Обновляем профили персонажей
        const charA = characters.find((c) => c.personId === personA)
        const charB = characters.find((c) => c.personId === personB)

        if (charA) charA.relationships.push(relationship.id)
        if (charB) charB.relationships.push(relationship.id)
      }
    }

    return relationships
  }

  /**
   * Анализ отношений между двумя конкретными персонажами
   */
  private async analyzeRelationshipBetweenPersons(
    personAId: string,
    personBId: string,
    interactions: CharacterInteraction[],
    _characters: CharacterProfile[],
    scenes: SceneAnalysis[],
  ): Promise<CharacterRelationship | null> {
    if (interactions.length === 0) return null

    try {
      // Собираем доказательства отношений
      const evidence = await this.collectRelationshipEvidence(interactions, scenes)

      // Определяем тип отношений
      const relationshipType = await this.determineRelationshipType(interactions, evidence)

      // Вычисляем интенсивность взаимодействия
      const intensity = this.calculateInteractionIntensity(interactions)

      // Определяем эмоциональную окраску
      const emotionalTone = await this.determineEmotionalTone(interactions)

      // Вычисляем общую уверенность
      const confidence = this.calculateRelationshipConfidence(evidence, interactions)

      if (confidence < this.config.confidenceThreshold) return null

      const totalInteractionTime = interactions.reduce((sum, i) => sum + i.duration, 0)
      const timestamps = interactions.map((i) => i.startTime).sort()

      const relationship: CharacterRelationship = {
        id: `relationship_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        personA: personAId,
        personB: personBId,
        type: relationshipType,
        confidence,
        intensity,
        emotionalTone,
        interactions,
        evidence,
        firstDetectedAt: timestamps[0],
        lastDetectedAt: timestamps[timestamps.length - 1],
        totalInteractionTime,
      }

      return relationship
    } catch (error) {
      console.warn(`Failed to analyze relationship between ${personAId} and ${personBId}:`, error)
      return null
    }
  }

  /**
   * Сбор доказательств отношений
   */
  private async collectRelationshipEvidence(
    interactions: CharacterInteraction[],
    _scenes: SceneAnalysis[],
  ): Promise<RelationshipEvidence[]> {
    const evidence: RelationshipEvidence[] = []

    // Доказательство частоты близости
    const proximitySum = interactions.reduce((sum, i) => sum + i.proximityScore, 0)
    const avgProximity = proximitySum / interactions.length

    if (avgProximity > 0.7) {
      evidence.push({
        type: EvidenceType.PROXIMITY_FREQUENCY,
        description: `Characters frequently appear close together (avg proximity: ${avgProximity.toFixed(2)})`,
        confidence: Math.min(avgProximity, 1.0),
        sceneIds: interactions.map((i) => i.sceneId),
        weight: 0.8,
      })
    }

    // Доказательство продолжительности взаимодействий
    const totalDuration = interactions.reduce((sum, i) => sum + i.duration, 0)
    if (totalDuration > 10) {
      // Более 10 секунд общего взаимодействия
      evidence.push({
        type: EvidenceType.INTERACTION_DURATION,
        description: `Extended interaction time: ${totalDuration.toFixed(1)} seconds`,
        confidence: Math.min(totalDuration / 30, 1.0), // Нормализуем к 30 секундам
        sceneIds: interactions.map((i) => i.sceneId),
        weight: 0.6,
      })
    }

    // Доказательство физического контакта
    const physicalContactInteractions = interactions.filter((i) => i.type === InteractionType.PHYSICAL_CONTACT)

    if (physicalContactInteractions.length > 0) {
      evidence.push({
        type: EvidenceType.PHYSICAL_CONTACT,
        description: `Physical contact observed in ${physicalContactInteractions.length} scenes`,
        confidence: 0.9,
        sceneIds: physicalContactInteractions.map((i) => i.sceneId),
        weight: 1.0,
      })
    }

    // Доказательство паттернов разговоров
    const conversationInteractions = interactions.filter((i) => i.type === InteractionType.CONVERSATION)

    if (conversationInteractions.length > 2) {
      evidence.push({
        type: EvidenceType.CONVERSATION_PATTERNS,
        description: `Multiple conversation instances: ${conversationInteractions.length}`,
        confidence: Math.min(conversationInteractions.length / 5, 1.0),
        sceneIds: conversationInteractions.map((i) => i.sceneId),
        weight: 0.7,
      })
    }

    return evidence
  }

  /**
   * Определение типа отношений
   */
  private async determineRelationshipType(
    interactions: CharacterInteraction[],
    evidence: RelationshipEvidence[],
  ): Promise<RelationshipType> {
    // Проверяем физический контакт
    const hasPhysicalContact = evidence.some((e) => e.type === EvidenceType.PHYSICAL_CONTACT)
    if (hasPhysicalContact) {
      return RelationshipType.ROMANTIC // или FAMILY, нужен дополнительный анализ
    }

    // Проверяем конфликтные взаимодействия
    const hasConflict = interactions.some((i) => i.type === InteractionType.CONFLICT)
    if (hasConflict) {
      return RelationshipType.CONFLICT
    }

    // Проверяем кооперацию
    const hasCooperation = interactions.some((i) => i.type === InteractionType.COOPERATION)
    if (hasCooperation) {
      return RelationshipType.COLLEAGUES
    }

    // По умолчанию - друзья, если есть взаимодействия
    const totalInteractions = interactions.length
    if (totalInteractions > 0) {
      return RelationshipType.FRIENDS
    }

    return RelationshipType.STRANGERS
  }

  // Вспомогательные методы (продолжение)

  private calculateInteractionIntensity(interactions: CharacterInteraction[]): InteractionIntensity {
    if (interactions.length === 0) return InteractionIntensity.NONE

    const avgProximity = interactions.reduce((sum, i) => sum + i.proximityScore, 0) / interactions.length
    const totalDuration = interactions.reduce((sum, i) => sum + i.duration, 0)
    const interactionCount = interactions.length

    const intensityScore = (avgProximity + Math.min(totalDuration / 30, 1) + Math.min(interactionCount / 5, 1)) / 3

    if (intensityScore > 0.8) return InteractionIntensity.VERY_HIGH
    if (intensityScore > 0.6) return InteractionIntensity.HIGH
    if (intensityScore > 0.4) return InteractionIntensity.MEDIUM
    if (intensityScore > 0.1) return InteractionIntensity.LOW
    return InteractionIntensity.NONE
  }

  private async determineEmotionalTone(interactions: CharacterInteraction[]): Promise<EmotionalTone> {
    if (interactions.length === 0) return EmotionalTone.NEUTRAL

    let positiveCount = 0
    let negativeCount = 0
    let neutralCount = 0

    for (const interaction of interactions) {
      if (interaction.type === InteractionType.CONFLICT) {
        negativeCount++
      } else if (
        interaction.type === InteractionType.COOPERATION ||
        interaction.type === InteractionType.PHYSICAL_CONTACT
      ) {
        positiveCount++
      } else {
        neutralCount++
      }
    }

    const total = positiveCount + negativeCount + neutralCount
    if (total === 0) return EmotionalTone.NEUTRAL

    const positiveRatio = positiveCount / total
    const negativeRatio = negativeCount / total

    if (positiveRatio > 0.6) return EmotionalTone.POSITIVE
    if (negativeRatio > 0.6) return EmotionalTone.NEGATIVE
    if (positiveRatio >= 0.33 && negativeRatio >= 0.33) return EmotionalTone.MIXED

    return EmotionalTone.NEUTRAL
  }

  private calculateRelationshipConfidence(
    evidence: RelationshipEvidence[],
    interactions: CharacterInteraction[],
  ): number {
    if (evidence.length === 0) return 0

    // Взвешенная сумма доказательств
    const evidenceScore =
      evidence.reduce((sum, e) => sum + e.confidence * e.weight, 0) / evidence.reduce((sum, e) => sum + e.weight, 0)

    // Дополнительная уверенность от количества взаимодействий
    const interactionScore = Math.min(interactions.length / 5, 1.0)

    return evidenceScore * 0.7 + interactionScore * 0.3
  }

  private extractPersonFacesFromScene(personId: string, scene: SceneAnalysis): DetectedFace[] {
    // Извлекаем лица конкретного персонажа из сцены
    const identifiedPersons = (scene.content?.identifiedPersons as any[]) || []
    const person = identifiedPersons.find((p: any) => p.id === personId)

    if (!person || !person.appearances) return []

    return person.appearances.flatMap((app: any) => app.detectedFaces || [])
  }

  private calculateProximity(facesA: DetectedFace[], facesB: DetectedFace[]): number {
    if (facesA.length === 0 || facesB.length === 0) return 0

    let totalProximity = 0
    let comparisons = 0

    for (const faceA of facesA) {
      for (const faceB of facesB) {
        // Вычисляем расстояние между центрами лиц
        const centerAX = faceA.bbox.x + faceA.bbox.width / 2
        const centerAY = faceA.bbox.y + faceA.bbox.height / 2
        const centerBX = faceB.bbox.x + faceB.bbox.width / 2
        const centerBY = faceB.bbox.y + faceB.bbox.height / 2

        const distance = Math.sqrt((centerAX - centerBX) ** 2 + (centerAY - centerBY) ** 2)

        // Нормализуем расстояние (предполагаем, что кадр 1920x1080)
        const maxDistance = Math.sqrt(1920 * 1920 + 1080 * 1080)
        const normalizedDistance = distance / maxDistance

        // Инвертируем для получения близости (чем меньше расстояние, тем больше близость)
        const proximity = 1 - normalizedDistance

        totalProximity += proximity
        comparisons++
      }
    }

    return comparisons > 0 ? totalProximity / comparisons : 0
  }

  private async determineInteractionType(
    _charA: CharacterProfile,
    _charB: CharacterProfile,
    _scene: SceneAnalysis,
    facesA: DetectedFace[],
    facesB: DetectedFace[],
  ): Promise<InteractionType> {
    // Простая эвристика для определения типа взаимодействия
    const proximity = this.calculateProximity(facesA, facesB)

    if (proximity > 0.8) {
      return InteractionType.PHYSICAL_CONTACT
    }

    if (proximity > 0.5) {
      // Проверяем есть ли признаки разговора (можно расширить анализом аудио)
      return InteractionType.CONVERSATION
    }

    if (proximity > 0.3) {
      return InteractionType.SHARED_ACTIVITY
    }

    return InteractionType.OBSERVATION
  }

  private async analyzeVisualCues(
    facesA: DetectedFace[],
    facesB: DetectedFace[],
    scene: SceneAnalysis,
  ): Promise<VisualCue[]> {
    const cues: VisualCue[] = []

    // Анализ близости
    const proximity = this.calculateProximity(facesA, facesB)
    if (proximity > 0.6) {
      cues.push({
        type: VisualCueType.PROXIMITY,
        description: `Characters appear close together (proximity: ${proximity.toFixed(2)})`,
        confidence: proximity,
        timestamp: scene.startTime,
      })
    }

    // Анализ выражений лиц
    for (const face of [...facesA, ...facesB]) {
      if (face.emotion && face.emotion !== "neutral") {
        cues.push({
          type: VisualCueType.FACIAL_EXPRESSION,
          description: `${face.emotion} expression detected`,
          confidence: face.confidence,
          timestamp: face.timestamp.seconds,
        })
      }
    }

    return cues
  }

  private analyzeGazeDirection(facesA: DetectedFace[], facesB: DetectedFace[]): GazeDirection | undefined {
    // Упрощенный анализ направления взгляда
    // В реальной реализации здесь будет анализ pose данных

    if (facesA.length === 0 || facesB.length === 0) return undefined

    const avgPoseA = this.calculateAveragePose(facesA)
    const avgPoseB = this.calculateAveragePose(facesB)

    // Простая эвристика: если лица повернуты друг к другу
    const isLookingAtEachOther = Math.abs(avgPoseA.yaw + avgPoseB.yaw) < 30

    return {
      isLookingAtOtherPerson: isLookingAtEachOther,
      confidence: 0.6, // Низкая уверенность для простой эвристики
    }
  }

  private calculateAveragePose(faces: DetectedFace[]): { yaw: number; pitch: number; roll: number } {
    if (faces.length === 0) return { yaw: 0, pitch: 0, roll: 0 }

    const sum = faces.reduce(
      (acc, face) => ({
        yaw: acc.yaw + (face.pose?.yaw || 0),
        pitch: acc.pitch + (face.pose?.pitch || 0),
        roll: acc.roll + (face.pose?.roll || 0),
      }),
      { yaw: 0, pitch: 0, roll: 0 },
    )

    return {
      yaw: sum.yaw / faces.length,
      pitch: sum.pitch / faces.length,
      roll: sum.roll / faces.length,
    }
  }

  private async analyzeBodyLanguage(facesA: DetectedFace[], facesB: DetectedFace[]): Promise<BodyLanguage | undefined> {
    // Упрощенный анализ языка тела
    // В реальной реализации нужен анализ полных скелетов тела

    if (facesA.length === 0 || facesB.length === 0) return undefined

    return {
      openness: 0.5, // Нейтральное значение
      dominance: 0.5,
      engagement: 0.5,
      mirroring: false,
      confidence: 0.3, // Низкая уверенность без анализа скелета
    }
  }

  private generateInteractionDescription(
    type: InteractionType,
    charA: CharacterProfile,
    charB: CharacterProfile,
  ): string {
    const nameA = charA.person.name || `Person ${charA.personId.substring(0, 8)}`
    const nameB = charB.person.name || `Person ${charB.personId.substring(0, 8)}`

    switch (type) {
      case InteractionType.CONVERSATION:
        return `${nameA} and ${nameB} appear to be in conversation`
      case InteractionType.PHYSICAL_CONTACT:
        return `${nameA} and ${nameB} have physical contact`
      case InteractionType.SHARED_ACTIVITY:
        return `${nameA} and ${nameB} are engaged in shared activity`
      case InteractionType.CONFLICT:
        return `${nameA} and ${nameB} appear to be in conflict`
      case InteractionType.COOPERATION:
        return `${nameA} and ${nameB} are cooperating`
      case InteractionType.OBSERVATION:
        return `${nameA} observes ${nameB}`
      case InteractionType.PARALLEL_ACTION:
        return `${nameA} and ${nameB} perform parallel actions`
      default:
        return `${nameA} interacts with ${nameB}`
    }
  }

  private async analyzeCharacterTraits(_person: Person, scenes: SceneAnalysis[]): Promise<CharacterTraits> {
    // Упрощенный анализ черт характера на основе появлений
    const totalAppearances = scenes.length
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)

    // Эвристики для определения черт
    const sociability = Math.min(totalAppearances / 10, 1.0) // Больше появлений = больше социальности
    const activityLevel = Math.min(totalDuration / 60, 1.0) // Больше экранного времени = больше активности

    return {
      dominance: 0.5, // Нейтральное значение, нужен дополнительный анализ
      sociability,
      activityLevel,
      emotionalStability: 0.5, // Нужен анализ эмоций во времени
      confidence: 0.6,
    }
  }

  private async analyzeEmotionalRange(person: Person, scenes: SceneAnalysis[]): Promise<EmotionalRange> {
    // Собираем все эмоции персонажа из сцен
    const emotions: string[] = []

    for (const scene of scenes) {
      const identifiedPersons = (scene.content?.identifiedPersons as any[]) || []
      const personInScene = identifiedPersons.find((p: any) => p.id === person.id)

      if (personInScene?.appearances) {
        for (const appearance of personInScene.appearances) {
          for (const face of appearance.detectedFaces || []) {
            if (face.emotion) {
              emotions.push(face.emotion)
            }
          }
        }
      }
    }

    if (emotions.length === 0) {
      return {
        dominantEmotion: "neutral",
        emotionalVariability: 0.5,
        positiveRatio: 0.33,
        negativeRatio: 0.33,
        neutralRatio: 0.33,
      }
    }

    // Анализируем эмоции
    const emotionCounts = emotions.reduce<Record<string, number>>((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1
      return acc
    }, {})

    const dominantEmotion = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0][0]

    const uniqueEmotions = Object.keys(emotionCounts).length
    const emotionalVariability = Math.min(uniqueEmotions / 7, 1.0) // 7 основных эмоций

    // Классифицируем эмоции
    const positiveEmotions = ["happy", "joy", "surprise", "love"]
    const negativeEmotions = ["sad", "anger", "fear", "disgust"]

    const positiveCount = emotions.filter((e) => positiveEmotions.includes(e)).length
    const negativeCount = emotions.filter((e) => negativeEmotions.includes(e)).length
    const neutralCount = emotions.length - positiveCount - negativeCount

    return {
      dominantEmotion,
      emotionalVariability,
      positiveRatio: positiveCount / emotions.length,
      negativeRatio: negativeCount / emotions.length,
      neutralRatio: neutralCount / emotions.length,
    }
  }

  private determineCharacterRole(_person: Person, scenes: SceneAnalysis[], totalScreenTime: number): CharacterRole {
    const totalVideoTime = Math.max(...scenes.map((s) => s.endTime))
    const screenTimeRatio = totalScreenTime / totalVideoTime

    // Простая эвристика основанная на экранном времени
    if (screenTimeRatio > 0.5) {
      return CharacterRole.PROTAGONIST
    }
    if (screenTimeRatio > 0.2) {
      return CharacterRole.SUPPORTING
    }
    if (screenTimeRatio > 0.05) {
      return CharacterRole.BACKGROUND
    }
    return CharacterRole.UNKNOWN
  }

  private buildSocialNetwork(
    characters: CharacterProfile[],
    relationships: CharacterRelationship[],
  ): SocialNetworkNode[] {
    const nodes: SocialNetworkNode[] = []

    for (const character of characters) {
      const connections: SocialConnection[] = []

      // Находим все отношения для этого персонажа
      const charRelationships = relationships.filter(
        (rel) => rel.personA === character.personId || rel.personB === character.personId,
      )

      for (const rel of charRelationships) {
        const targetPersonId = rel.personA === character.personId ? rel.personB : rel.personA

        connections.push({
          targetPersonId,
          strength: this.calculateConnectionStrength(rel),
          relationshipType: rel.type,
        })
      }

      // Вычисляем центральность (количество связей)
      const centrality = connections.length / Math.max(characters.length - 1, 1)

      // Влияние на основе силы связей
      const influence = connections.reduce((sum, conn) => sum + conn.strength, 0) / connections.length || 0

      nodes.push({
        personId: character.personId,
        connections,
        centrality,
        influence,
      })
    }

    return nodes
  }

  private calculateConnectionStrength(relationship: CharacterRelationship): number {
    // Сила связи на основе типа отношений, интенсивности и времени взаимодействия
    const typeWeights: Record<RelationshipType, number> = {
      [RelationshipType.FAMILY]: 0.9,
      [RelationshipType.ROMANTIC]: 0.95,
      [RelationshipType.FRIENDS]: 0.7,
      [RelationshipType.COLLEAGUES]: 0.6,
      [RelationshipType.MENTOR_STUDENT]: 0.8,
      [RelationshipType.PROFESSIONAL]: 0.5,
      [RelationshipType.CONFLICT]: 0.4,
      [RelationshipType.STRANGERS]: 0.2,
      [RelationshipType.UNKNOWN]: 0.3,
    }

    const intensityWeights: Record<InteractionIntensity, number> = {
      [InteractionIntensity.VERY_HIGH]: 1.0,
      [InteractionIntensity.HIGH]: 0.8,
      [InteractionIntensity.MEDIUM]: 0.6,
      [InteractionIntensity.LOW]: 0.4,
      [InteractionIntensity.NONE]: 0.1,
    }

    const typeWeight = typeWeights[relationship.type] || 0.5
    const intensityWeight = intensityWeights[relationship.intensity] || 0.5
    const timeWeight = Math.min(relationship.totalInteractionTime / 30, 1.0) // Нормализуем к 30 секундам

    return ((typeWeight + intensityWeight + timeWeight) / 3) * relationship.confidence
  }

  private createAnalysisSummary(
    characters: CharacterProfile[],
    relationships: CharacterRelationship[],
    _interactions: CharacterInteraction[],
  ): CharacterAnalysisSummary {
    const mainCharacters = characters.filter(
      (char) => char.role === CharacterRole.PROTAGONIST || char.role === CharacterRole.ANTAGONIST,
    ).length

    const relationshipTypeCounts = relationships.reduce(
      (acc, rel) => {
        acc[rel.type] = (acc[rel.type] || 0) + 1
        return acc
      },
      {} as Record<RelationshipType, number>,
    )

    const mostCommonRelationshipType =
      (Object.entries(relationshipTypeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as RelationshipType) ||
      RelationshipType.UNKNOWN

    const avgRelationshipsPerCharacter = characters.length > 0 ? (relationships.length * 2) / characters.length : 0 // *2 потому что каждое отношение связывает двух персонажей

    // Социальная сложность на основе количества уникальных типов отношений
    const uniqueRelationshipTypes = Object.keys(relationshipTypeCounts).length
    const socialComplexity = Math.min(uniqueRelationshipTypes / 7, 1.0) // 7 возможных типов

    // Доминирующий эмоциональный тон
    const emotionalToneCounts = relationships.reduce(
      (acc, rel) => {
        acc[rel.emotionalTone] = (acc[rel.emotionalTone] || 0) + 1
        return acc
      },
      {} as Record<EmotionalTone, number>,
    )

    const dominantEmotionalTone =
      (Object.entries(emotionalToneCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as EmotionalTone) ||
      EmotionalTone.NEUTRAL

    // Плотность сети (процент возможных связей, которые существуют)
    const maxPossibleRelationships = (characters.length * (characters.length - 1)) / 2
    const networkDensity = maxPossibleRelationships > 0 ? relationships.length / maxPossibleRelationships : 0

    return {
      totalCharacters: characters.length,
      mainCharacters,
      averageRelationshipsPerCharacter: avgRelationshipsPerCharacter,
      mostCommonRelationshipType,
      socialComplexity,
      dominantEmotionalTone,
      networkDensity,
    }
  }

  /**
   * Получение статистики по персонажам
   */
  getCharacterStatistics(result: CharacterAnalysisResult): any {
    return {
      characterCount: result.characters.length,
      relationshipCount: result.relationships.length,
      interactionCount: result.interactions.length,
      avgScreenTimePerCharacter:
        result.characters.reduce((sum, char) => sum + char.totalScreenTime, 0) / result.characters.length,
      mostActiveCharacter: result.characters.reduce((max, char) =>
        char.totalScreenTime > max.totalScreenTime ? char : max,
      ),
      relationshipTypes: result.relationships.reduce<Record<string, number>>((acc, rel) => {
        acc[rel.type] = (acc[rel.type] || 0) + 1
        return acc
      }, {}),
    }
  }

  /**
   * Экспорт результатов анализа в различных форматах
   */
  async exportAnalysis(result: CharacterAnalysisResult, format: "json" | "csv" | "graph" = "json"): Promise<string> {
    switch (format) {
      case "json":
        return JSON.stringify(result, null, 2)

      case "csv":
        return this.convertToCSV(result)

      case "graph":
        return this.convertToGraphFormat(result)

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private convertToCSV(result: CharacterAnalysisResult): string {
    // Экспорт отношений в CSV
    const headers = [
      "PersonA",
      "PersonB",
      "RelationshipType",
      "Confidence",
      "Intensity",
      "EmotionalTone",
      "TotalInteractionTime",
      "InteractionCount",
    ]

    const rows = result.relationships.map((rel) => [
      rel.personA,
      rel.personB,
      rel.type,
      rel.confidence.toFixed(2),
      rel.intensity,
      rel.emotionalTone,
      rel.totalInteractionTime.toFixed(1),
      rel.interactions.length,
    ])

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }

  private convertToGraphFormat(result: CharacterAnalysisResult): string {
    // Экспорт в формате DOT для визуализации графа
    const nodes = result.characters
      .map((char) => `  "${char.personId}" [label="${char.person.name || char.personId}", role="${char.role}"];`)
      .join("\n")

    const edges = result.relationships
      .map((rel) => `  "${rel.personA}" -- "${rel.personB}" [label="${rel.type}", weight="${rel.confidence}"];`)
      .join("\n")

    return `graph CharacterNetwork {
${nodes}

${edges}
}`
  }

  /**
   * Обновление конфигурации
   */
  updateConfig(newConfig: Partial<CharacterAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Получение текущей конфигурации
   */
  getConfig(): CharacterAnalysisConfig {
    return { ...this.config }
  }
}
