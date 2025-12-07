/**
 * Script Generation Engine
 * Движок для генерации сценариев на основе анализа контента
 */

import { type UnifiedContentAnalysis } from "@/domains/ai-services/types/unified-analysis"
import type { Person } from "@/domains/ai-services/types"
import { createLogger } from "@/lib/tauri-logger"
import { BaseAIEngine, type EngineCapabilities } from "./base-engine"
import { DialogueGenerator } from "./dialogue-generator"
import { TemplateEngine } from "./template-engine"

const logger = createLogger("ScriptGenerationEngine")

import {
  Act,
  AudioElementType,
  Character,
  CharacterRole,
  Emotion,
  GeneratedScript,
  ImprovementType,
  NarrativeStructure,
  NarrativeType,
  PaceType,
  PaceVariation,
  Pacing,
  ScriptAlternative,
  ScriptGenerationConfig,
  ScriptGenerationContext,
  ScriptGenerationParams,
  ScriptGenerationResult,
  ScriptImprovement,
  ScriptQuality,
  ScriptScene,
  TurningPoint,
  TurningPointType,
  VisualElementType,
} from "./types"

export class ScriptGenerationEngine extends BaseAIEngine {
  private static instance: ScriptGenerationEngine | null = null
  name = "Script Generation Engine"
  version = "1.0.0"
  description = "AI-powered script generation based on video content analysis"
  private templateEngine: TemplateEngine
  private dialogueGenerator: DialogueGenerator
  private config: ScriptGenerationConfig = this.getDefaultConfig()

  private constructor() {
    super()
    this.templateEngine = TemplateEngine.getInstance()
    this.dialogueGenerator = DialogueGenerator.getInstance()
  }

  static getInstance(): ScriptGenerationEngine {
    if (!ScriptGenerationEngine.instance) {
      ScriptGenerationEngine.instance = new ScriptGenerationEngine()
    }
    return ScriptGenerationEngine.instance
  }

  async initialize(): Promise<void> {
    try {
      // Инициализация подсистем
      await this.templateEngine.initialize()
      await this.dialogueGenerator.initialize()

      this._isReady = true
    } catch (error) {
      logger.errorSync("Failed to initialize Script Generation Engine", { error })
      throw error
    }
  }

  async process(
    data: { analysis: UnifiedContentAnalysis; context?: ScriptGenerationContext },
    params: ScriptGenerationParams,
  ): Promise<ScriptGenerationResult> {
    if (!this._isReady) {
      throw new Error("Script Generation Engine not initialized")
    }

    try {
      // 1. Анализ входных данных
      const context = this.prepareContext(data.analysis, data.context)

      // 2. Определение структуры повествования
      const narrativeStructure = await this.determineNarrativeStructure(context, params.narrativeStructure)

      // 3. Генерация сцен сценария
      const scriptScenes = await this.generateScriptScenes(context, narrativeStructure, params)

      // 4. Генерация диалогов (если требуется)
      if (params.includeDialogue && this.config.generation.generateDialogue) {
        await this.generateDialogues(scriptScenes, context)
      }

      // 5. Генерация закадрового голоса (если требуется)
      if (params.includeVoiceover && this.config.generation.generateVoiceover) {
        await this.generateVoiceovers(scriptScenes, context, params)
      }

      // 6. Сборка финального сценария
      const script = this.assembleScript(scriptScenes, narrativeStructure, params, context)

      // 7. Оценка качества
      const quality = await this.evaluateScriptQuality(script, context)

      // 8. Генерация улучшений
      const improvements = this.suggestImprovements(script, quality)

      // 9. Генерация альтернативных вариантов
      const alternatives = await this.generateAlternatives(script, context, params)

      return {
        ...script,
        quality,
        improvements,
        alternatives,
      }
    } catch (error) {
      logger.errorSync("Script generation failed", { error })
      throw error
    }
  }

  getCapabilities(): EngineCapabilities {
    return {
      supportsStreaming: true,
      supportsBatch: true,
      maxBatchSize: 5,
      supportedFormats: ["json", "text", "markdown"],
      requiredResources: {
        minRAM: 1024, // 1GB
        recommendedRAM: 2048, // 2GB
        requiresGPU: false,
      },
      estimatedProcessingTime: (data) => {
        // Примерная оценка: 10 секунд + 1 секунда на минуту видео
        const duration = data.analysis?.mediaFile?.duration || 60
        return 10 + duration / 60
      },
    }
  }

  async configure(config: Partial<ScriptGenerationConfig>): Promise<void> {
    this.config = { ...this.config, ...config }
  }

  // Приватные методы

  private prepareContext(
    analysis: UnifiedContentAnalysis,
    providedContext?: ScriptGenerationContext,
  ): ScriptGenerationContext {
    // Извлекаем персонажей из результатов анализа сцен
    const detectedPersons = this.extractPersonsFromAnalysis(analysis)

    return {
      analysis: analysis.scenes,
      metadata: {
        duration: analysis.mediaFile.duration,
        title: providedContext?.metadata?.title || analysis.mediaFile.filename,
        tags: providedContext?.metadata?.tags || [],
      },
      userPrompt: providedContext?.userPrompt,
      references: providedContext?.references || [],
      constraints: providedContext?.constraints,
      detectedPersons,
    }
  }

  private async determineNarrativeStructure(
    context: ScriptGenerationContext,
    preferredType?: NarrativeType,
  ): Promise<NarrativeStructure> {
    // Если указан предпочтительный тип, используем его
    if (preferredType) {
      return this.createNarrativeStructure(preferredType, context)
    }

    // Иначе определяем на основе анализа
    const prompt = this.buildNarrativeAnalysisPrompt(context)
    const response = await this.aiService
      .sendRequest("claude-4-sonnet-latest", [{ role: "user", content: prompt }], { temperature: 0.3 })
      .then((r: { content: string }) => r.content)

    const narrativeType = this.parseNarrativeType(response) || NarrativeType.THREE_ACT
    return this.createNarrativeStructure(narrativeType, context)
  }

  private createNarrativeStructure(type: NarrativeType, context: ScriptGenerationContext): NarrativeStructure {
    const duration = context.metadata.duration

    switch (type) {
      case NarrativeType.THREE_ACT:
        return {
          type,
          acts: [
            {
              number: 1,
              title: "Setup",
              description: "Introduction and establishment",
              scenes: [],
              duration: duration * 0.25,
            },
            {
              number: 2,
              title: "Confrontation",
              description: "Main conflict and development",
              scenes: [],
              duration: duration * 0.5,
            },
            {
              number: 3,
              title: "Resolution",
              description: "Climax and conclusion",
              scenes: [],
              duration: duration * 0.25,
            },
          ],
          turningPoints: [
            {
              timestamp: duration * 0.25,
              type: TurningPointType.INCITING_INCIDENT,
              description: "The event that sets the story in motion",
              impact: 0.8,
            },
            {
              timestamp: duration * 0.75,
              type: TurningPointType.CLIMAX,
              description: "The highest point of tension",
              impact: 1.0,
            },
          ],
        }

      case NarrativeType.FIVE_ACT:
        return {
          type,
          acts: this.createFiveActStructure(duration),
          turningPoints: this.createFiveActTurningPoints(duration),
        }

      default:
        return this.createDefaultStructure(type, duration)
    }
  }

  private async generateScriptScenes(
    context: ScriptGenerationContext,
    structure: NarrativeStructure,
    params: ScriptGenerationParams,
  ): Promise<ScriptScene[]> {
    const scenes: ScriptScene[] = []

    // Распределяем анализированные сцены по актам
    const scenesPerAct = this.distributeScenesToActs(context.analysis, structure.acts)

    // Генерируем сценарные сцены для каждого акта
    for (let i = 0; i < structure.acts.length; i++) {
      const act = structure.acts[i]
      const actScenes = scenesPerAct[i] || []

      for (const sceneAnalysis of actScenes) {
        const scriptScene = await this.generateScriptScene(sceneAnalysis, act, context, params)
        scenes.push(scriptScene)
        act.scenes.push(scriptScene.id)
      }
    }

    return scenes
  }

  private async generateScriptScene(
    sceneAnalysis: any,
    act: Act,
    context: ScriptGenerationContext,
    params: ScriptGenerationParams,
  ): Promise<ScriptScene> {
    const prompt = this.buildSceneGenerationPrompt(sceneAnalysis, act, context, params)
    const response = await this.aiService
      .sendRequest(this.config.ai.model, [{ role: "user", content: prompt }], { temperature: 0.7, maxTokens: 1500 })
      .then((r: { content: string }) => r.content)

    const parsedScene = this.parseSceneResponse(response, sceneAnalysis)

    return {
      id: `scene-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      number: parsedScene.number || 1,
      title: parsedScene.title || "Untitled Scene",
      description: parsedScene.description || "",
      location: parsedScene.location,
      timeOfDay: parsedScene.timeOfDay,
      duration: sceneAnalysis.duration,
      visualElements: parsedScene.visualElements || [],
      audioElements: parsedScene.audioElements || [],
      actions: parsedScene.actions,
      transitions: parsedScene.transitions,
      linkedSceneAnalysis: sceneAnalysis,
    }
  }

  private async generateDialogues(scenes: ScriptScene[], context: ScriptGenerationContext): Promise<void> {
    for (const scene of scenes) {
      if (this.shouldHaveDialogue(scene)) {
        // Получаем персонажей для текущей сцены
        const scenePersons = this.getPersonsForScene(scene, context)

        const characters: Character[] = scenePersons.map((person, index) => ({
          id: `char-${index}`,
          name: person.name,
          role: CharacterRole.SUPPORTING,
          description: `Confidence: ${Math.round(person.confidence * 100)}%`,
          appearances: [],
        }))

        const dialogues = await this.dialogueGenerator.generate({
          characters,
          scene: {
            location: scene.location || "unknown",
            timeOfDay: scene.timeOfDay || "day",
            mood: this.determineSceneMood(scene),
            action: scene.description,
          },
          style: {
            tone: "casual",
            pacing: "medium",
            naturalism: 0.8,
            subtext: true,
          },
        })

        // Добавляем диалоги в аудио элементы сцены
        scene.audioElements.push(
          ...dialogues.map((d) => ({
            type: "DIALOGUE" as AudioElementType,
            description: `${d.character}: ${d.text}`,
            timing: d.timing,
          })),
        )
      }
    }
  }

  private async generateVoiceovers(
    scenes: ScriptScene[],
    context: ScriptGenerationContext,
    params: ScriptGenerationParams,
  ): Promise<void> {
    for (const scene of scenes) {
      if (this.shouldHaveVoiceover(scene, params)) {
        const voiceoverPrompt = this.buildVoiceoverPrompt(scene, context)
        const response = await this.aiService
          .sendRequest(this.config.ai.model, [{ role: "user", content: voiceoverPrompt }], {
            temperature: 0.6,
            maxTokens: 500,
          })
          .then((r: { content: string }) => r.content)

        scene.audioElements.push({
          type: "VOICEOVER" as AudioElementType,
          description: response,
          timing: {
            start: 0,
            end: scene.duration,
            duration: scene.duration,
          },
        })
      }
    }
  }

  private assembleScript(
    scenes: ScriptScene[],
    structure: NarrativeStructure,
    params: ScriptGenerationParams,
    context: ScriptGenerationContext,
  ): GeneratedScript {
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)

    // Извлекаем персонажей и диалоги из сцен
    const characters = this.extractCharactersFromContext(context)
    const dialogue = this.extractDialogueFromScenes(scenes)
    const voiceover = this.extractVoiceoverFromScenes(scenes)

    return {
      id: `script-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      title: context.metadata.title || "Untitled Script",
      genre: params.genre || [],
      duration: totalDuration,
      structure,
      scenes,
      characters,
      dialogue,
      voiceover,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        language: this.config.language.primaryLanguage,
        tone: params.tone || { primary: Emotion.CALM, intensity: 0.5 },
        pacing: this.calculatePacing(scenes),
        style: params.style,
      },
    }
  }

  private async evaluateScriptQuality(
    script: GeneratedScript,
    context: ScriptGenerationContext,
  ): Promise<ScriptQuality> {
    // Базовая оценка качества
    const structure = this.evaluateStructure(script)
    const pacing = this.evaluatePacing(script)
    const coherence = await this.evaluateCoherence(script)
    const creativity = this.evaluateCreativity(script)
    const audienceAppeal = this.evaluateAudienceAppeal(script, context)

    const overall = (structure + pacing + coherence + creativity + audienceAppeal) / 5

    return {
      overall,
      structure,
      pacing,
      coherence,
      creativity,
      audienceAppeal,
    }
  }

  private suggestImprovements(_script: GeneratedScript, quality: ScriptQuality): ScriptImprovement[] {
    const improvements: ScriptImprovement[] = []

    if (quality.pacing < 0.7) {
      improvements.push({
        type: "pacing" as ImprovementType,
        description: "Consider adjusting scene durations for better rhythm",
        impact: "medium",
        implementation: "Shorten longer scenes and add breathing room between intense moments",
      })
    }

    if (quality.structure < 0.7) {
      improvements.push({
        type: "structure" as ImprovementType,
        description: "The narrative structure could be more defined",
        impact: "high",
        implementation: "Add clearer act breaks and turning points",
      })
    }

    if (quality.dialogue !== undefined && quality.dialogue < 0.6) {
      improvements.push({
        type: "dialogue" as ImprovementType,
        description: "Dialogue could be more natural and engaging",
        impact: "medium",
        implementation: "Revise dialogue to match character voices and add subtext",
      })
    }

    return improvements
  }

  // Вспомогательные методы

  private buildNarrativeAnalysisPrompt(context: ScriptGenerationContext): string {
    return `Analyze this video content and suggest the best narrative structure:

Duration: ${context.metadata.duration}s
Scenes: ${context.analysis.length}
Content type: ${context.analysis[0]?.type || "unknown"}

Please suggest a narrative structure type from:
- three_act: Classic beginning, middle, end
- five_act: Extended dramatic structure
- hero_journey: Campbell's monomyth
- nonlinear: Non-chronological storytelling
- episodic: Series of connected vignettes
- circular: Ending returns to beginning

Respond with just the structure type.`
  }

  private buildSceneGenerationPrompt(
    sceneAnalysis: any,
    act: Act,
    context: ScriptGenerationContext,
    params: ScriptGenerationParams,
  ): string {
    // Получаем персонажей сцены
    const scenePersons = sceneAnalysis.content?.identifiedPersons || []
    const personNames = scenePersons.map((p: Person) => p.name).join(", ")

    return `Generate a script scene based on this analysis:

Act: ${act.number} - ${act.title}
Scene Duration: ${sceneAnalysis.duration}s
Scene Type: ${sceneAnalysis.type}
Visual Elements: ${JSON.stringify(sceneAnalysis.content)}
${scenePersons.length > 0 ? `Characters in scene: ${personNames}` : ""}

Style: ${params.style?.narrative || "standard"}
Tone: ${params.tone?.primary || "neutral"}

Generate a scene with:
1. Title (short, descriptive)
2. Description (2-3 sentences)
3. Location (if applicable)
4. Time of day (if applicable)
5. Visual elements (what we see)
6. Audio elements (what we hear)
7. Actions (what happens)
${scenePersons.length > 0 ? "8. Character interactions (if applicable)" : ""}

${context.userPrompt ? `User instructions: ${context.userPrompt}` : ""}

Format as JSON.`
  }

  private buildVoiceoverPrompt(scene: ScriptScene, _context: ScriptGenerationContext): string {
    return `Write voiceover narration for this scene:

Scene: ${scene.title}
Description: ${scene.description}
Duration: ${scene.duration}s

Keep it:
- Concise (max ${Math.floor(scene.duration * 10)} words)
- ${this.config.language.tone} in tone
- Complementary to visuals, not redundant

Return only the voiceover text.`
  }

  private parseNarrativeType(response: string): NarrativeType | null {
    const normalized = response.toLowerCase().trim()

    if (normalized.includes("three_act") || normalized.includes("three act")) {
      return NarrativeType.THREE_ACT
    }
    if (normalized.includes("five_act") || normalized.includes("five act")) {
      return NarrativeType.FIVE_ACT
    }
    if (normalized.includes("hero")) {
      return NarrativeType.HEROS_JOURNEY
    }
    if (normalized.includes("nonlinear")) {
      return NarrativeType.NONLINEAR
    }
    if (normalized.includes("episodic")) {
      return NarrativeType.EPISODIC
    }
    if (normalized.includes("circular")) {
      return NarrativeType.CIRCULAR
    }

    return null
  }

  private parseSceneResponse(response: string, _sceneAnalysis: any): any {
    try {
      const jsonMatch = /```json\n([\s\S]*?)\n```/.exec(response)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
      return JSON.parse(response)
    } catch {
      // Fallback parsing
      return {
        title: "Scene",
        description: response.slice(0, 200),
        visualElements: [],
        audioElements: [],
      }
    }
  }

  private distributeScenesToActs(scenes: any[], acts: Act[]): any[][] {
    const result: any[][] = acts.map(() => [])
    const totalDuration = scenes.reduce((sum: number, s) => sum + Number(s.duration), 0)

    let currentActIndex = 0
    let currentActDuration = 0

    for (const scene of scenes) {
      if (currentActIndex < acts.length - 1) {
        const targetDuration = acts[currentActIndex].duration
        if (currentActDuration + Number(scene.duration) > targetDuration * 1.2) {
          currentActIndex++
          currentActDuration = 0
        }
      }

      result[currentActIndex].push(scene)
      currentActDuration += Number(scene.duration)
    }

    return result
  }

  private shouldHaveDialogue(scene: ScriptScene): boolean {
    return (
      scene.visualElements.some(
        (ve) => ve.type === VisualElementType.CLOSE_UP || ve.type === VisualElementType.MEDIUM_SHOT,
      ) && scene.duration > 3
    )
  }

  private shouldHaveVoiceover(scene: ScriptScene, params: ScriptGenerationParams): boolean {
    return (
      params.includeVoiceover === true &&
      !scene.audioElements.some((ae) => ae.type === AudioElementType.DIALOGUE) &&
      scene.duration > 2
    )
  }

  private calculatePacing(scenes: ScriptScene[]): Pacing {
    const sceneDurations = scenes.map((s) => s.duration)
    const avgDuration = sceneDurations.reduce((a, b) => a + b, 0) / sceneDurations.length

    let overall: PaceType = PaceType.MODERATE
    if (avgDuration < 3) overall = PaceType.FAST
    else if (avgDuration > 10) overall = PaceType.SLOW

    return {
      overall,
      variations: this.calculatePaceVariations(scenes),
    }
  }

  private createFiveActStructure(duration: number): Act[] {
    return [
      { number: 1, title: "Exposition", description: "Introduction", scenes: [], duration: duration * 0.1 },
      { number: 2, title: "Rising Action", description: "Building tension", scenes: [], duration: duration * 0.25 },
      { number: 3, title: "Climax", description: "Peak conflict", scenes: [], duration: duration * 0.3 },
      { number: 4, title: "Falling Action", description: "Aftermath", scenes: [], duration: duration * 0.25 },
      { number: 5, title: "Denouement", description: "Resolution", scenes: [], duration: duration * 0.1 },
    ]
  }

  private createFiveActTurningPoints(duration: number): TurningPoint[] {
    return [
      { timestamp: duration * 0.1, type: TurningPointType.INCITING_INCIDENT, description: "Story begins", impact: 0.6 },
      { timestamp: duration * 0.35, type: TurningPointType.PLOT_POINT, description: "Major development", impact: 0.8 },
      { timestamp: duration * 0.65, type: TurningPointType.CLIMAX, description: "Peak moment", impact: 1.0 },
      { timestamp: duration * 0.9, type: TurningPointType.RESOLUTION, description: "Final resolution", impact: 0.7 },
    ]
  }

  private createDefaultStructure(type: NarrativeType, duration: number): NarrativeStructure {
    return {
      type,
      acts: [
        { number: 1, title: "Beginning", description: "Opening", scenes: [], duration: duration * 0.3 },
        { number: 2, title: "Middle", description: "Development", scenes: [], duration: duration * 0.4 },
        { number: 3, title: "End", description: "Conclusion", scenes: [], duration: duration * 0.3 },
      ],
      turningPoints: [],
    }
  }

  private evaluateStructure(script: GeneratedScript): number {
    // Проверяем наличие всех элементов структуры
    let score = 0

    if (script.structure.acts.length >= 3) score += 0.3
    if (script.structure.turningPoints.length >= 2) score += 0.3
    if (script.scenes.length >= 5) score += 0.2
    if (script.structure.climax) score += 0.2

    return Math.min(1, score)
  }

  private evaluatePacing(script: GeneratedScript): number {
    const pace = script.metadata.pacing
    if (!pace) return 0.5

    // Проверяем вариативность темпа
    const hasVariations = pace.variations && pace.variations.length > 0
    return hasVariations ? 0.8 : 0.6
  }

  private async evaluateCoherence(script: GeneratedScript): Promise<number> {
    try {
      // Используем AI для оценки связности сценария
      const coherencePrompt = this.buildCoherenceEvaluationPrompt(script)

      const response = await this.aiService.sendRequest("gpt-4o", [{ role: "user", content: coherencePrompt }], {
        temperature: 0.1,
        maxTokens: 500,
      })

      // Парсим ответ и извлекаем числовую оценку
      const coherenceMatch = response.content.match(/coherence[:\s]*(\d+(?:\.\d+)?)/i)
      if (coherenceMatch) {
        const score = Number.parseFloat(coherenceMatch[1])
        return Math.min(1, Math.max(0, score / 10)) // Нормализуем к 0-1
      }

      // Fallback: анализируем связность локально
      return this.calculateLocalCoherence(script)
    } catch (error) {
      logger.warnSync("AI coherence evaluation failed, using local analysis", { error })
      return this.calculateLocalCoherence(script)
    }
  }

  private evaluateCreativity(script: GeneratedScript): number {
    // Базовая оценка креативности
    const uniqueElements = new Set(script.scenes.map((s) => s.type)).size
    return Math.min(1, uniqueElements / 5)
  }

  private evaluateAudienceAppeal(script: GeneratedScript, context: ScriptGenerationContext): number {
    let score = 0.5 // Базовый скор

    // Анализируем соответствие длительности
    const idealDuration = this.getIdealDurationForAudience(context.targetAudience)
    if (idealDuration) {
      // Вычисляем длительность сценария через сцены
      const scriptDuration = script.scenes.reduce((sum: number, scene) => sum + (scene.duration || 0), 0)
      const durationDiff = Math.abs(scriptDuration - idealDuration) / idealDuration
      score += Math.max(0, 0.2 - durationDiff) // До +0.2 за подходящую длительность
    }

    // Анализируем соответствие тематики
    const appropriateContent = this.evaluateContentAppropriateness(script, context.targetAudience)
    score += appropriateContent * 0.3 // До +0.3 за подходящий контент

    // Анализируем сложность повествования
    const narrativeComplexity = this.evaluateNarrativeComplexity(script)
    const idealComplexity = this.getIdealComplexityForAudience(context.targetAudience)
    const complexityMatch = 1 - Math.abs(narrativeComplexity - idealComplexity)
    score += complexityMatch * 0.2 // До +0.2 за подходящую сложность

    return Math.min(1, Math.max(0, score))
  }

  private getDefaultConfig(): ScriptGenerationConfig {
    return {
      ai: {
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 2000,
        enableStreaming: false,
      },
      generation: {
        includeSceneDescriptions: true,
        includeVisualCues: true,
        includeAudioCues: true,
        includeTransitions: true,
        generateDialogue: true,
        generateVoiceover: true,
        adaptToSceneAnalysis: true,
      },
      structure: {
        defaultNarrativeType: NarrativeType.THREE_ACT,
        minSceneLength: 2,
        maxSceneLength: 60,
        targetPacing: "medium",
      },
      language: {
        primaryLanguage: "en",
        tone: "professional",
        vocabulary: "standard",
      },
    }
  }

  // Методы для работы с персонажами из montage-planner

  /**
   * Извлечь персонажей из анализа контента
   */
  private extractPersonsFromAnalysis(analysis: UnifiedContentAnalysis): Person[] {
    const persons: Person[] = []

    // Проверяем, есть ли персонажи в общем анализе
    if ((analysis as any).persons) {
      return (analysis as any).persons
    }

    // Иначе собираем из сцен
    const personMap = new Map<string, Person>()

    for (const scene of analysis.scenes) {
      const scenePersons = (scene as any).content?.identifiedPersons || []
      for (const person of scenePersons) {
        if (!personMap.has(person.id)) {
          personMap.set(person.id, person)
        } else {
          // Обновляем уверенность, если выше
          const existing = personMap.get(person.id)!
          if (person.confidence > existing.confidence) {
            personMap.set(person.id, person)
          }
        }
      }
    }

    return Array.from(personMap.values())
  }

  /**
   * Получить персонажей для конкретной сцены
   */
  private getPersonsForScene(scene: ScriptScene, context: ScriptGenerationContext): Person[] {
    // Если есть связанный анализ сцены, берем персонажей оттуда
    const linkedAnalysis = (scene as any).linkedSceneAnalysis
    if (linkedAnalysis?.content?.identifiedPersons) {
      return linkedAnalysis.content.identifiedPersons
    }

    // Иначе возвращаем топ персонажей из контекста
    const allPersons = context.detectedPersons || []
    return allPersons.sort((a, b) => b.confidence - a.confidence).slice(0, 3) // Максимум 3 персонажа в диалоге
  }

  /**
   * Определить настроение сцены
   */
  private determineSceneMood(scene: ScriptScene): string {
    // Анализируем визуальные элементы
    const hasCloseUp = scene.visualElements.some((ve) => ve.type === VisualElementType.CLOSE_UP)
    const hasAction = scene.visualElements.some((ve) => ve.type === VisualElementType.ACTION_SHOT)

    if (hasAction) return "tense"
    if (hasCloseUp) return "intimate"

    // Анализируем длительность
    if (scene.duration < 3) return "dynamic"
    if (scene.duration > 10) return "contemplative"

    return "neutral"
  }

  /**
   * Преобразовать персонажей в формат персонажей сценария
   */
  private extractCharactersFromContext(context: ScriptGenerationContext): any[] {
    const persons = context.detectedPersons || []

    return persons.map((person, index) => ({
      id: person.id,
      name: person.name,
      role: index === 0 ? "protagonist" : index === 1 ? "deuteragonist" : "supporting",
      description: `Character with ${Math.round(person.confidence * 100)}% confidence`,
      traits: [],
      appearances: context.personStats?.personAppearances?.[person.name] || 0,
      screenTime: context.personStats?.screenTimeByPerson?.[person.name] || 0,
    }))
  }

  /**
   * Извлечь диалоги из сцен
   */
  private extractDialogueFromScenes(scenes: ScriptScene[]): any[] {
    const dialogues: any[] = []

    for (const scene of scenes) {
      const sceneDialogues = scene.audioElements
        .filter((ae) => ae.type === AudioElementType.DIALOGUE)
        .map((ae) => {
          const [character, ...textParts] = ae.description.split(":")
          return {
            sceneId: scene.id,
            character: character.trim(),
            text: textParts.join(":").trim(),
            timing: ae.timing,
          }
        })

      dialogues.push(...sceneDialogues)
    }

    return dialogues
  }

  /**
   * Извлечь закадровый голос из сцен
   */
  private extractVoiceoverFromScenes(scenes: ScriptScene[]): any[] {
    return scenes.flatMap((scene) =>
      scene.audioElements
        .filter((ae) => ae.type === AudioElementType.VOICEOVER)
        .map((ae) => ({
          sceneId: scene.id,
          text: ae.description,
          timing: ae.timing,
        })),
    )
  }

  /**
   * Адаптировать сценарий под инструкции о персонажах
   */
  public adaptScriptToPersonInstructions(
    script: GeneratedScript,
    instructions: string,
    context: ScriptGenerationContext,
  ): GeneratedScript {
    // Парсим инструкции
    const focusOnRegex = /(?:фокус|focus|больше|more)\s+(?:на|on)\s+(.+?)(?:\s|$)/gi
    const reduceRegex = /(?:меньше|less|убрать|remove)\s+(.+?)(?:\s|$)/gi

    const focusPersons: string[] = []
    const reducePersons: string[] = []

    let match: RegExpExecArray | null
    while ((match = focusOnRegex.exec(instructions)) !== null) {
      focusPersons.push(match[1].toLowerCase().trim())
    }

    while ((match = reduceRegex.exec(instructions)) !== null) {
      reducePersons.push(match[1].toLowerCase().trim())
    }

    // Адаптируем сцены
    const adaptedScenes = script.scenes.map((scene) => {
      const scenePersons = this.getPersonsForScene(scene, context)
      const scenePersonNames = scenePersons.map((p) => p.name.toLowerCase())

      // Проверяем, есть ли нужные персонажи
      const hasFocusPerson = focusPersons.some((name) => scenePersonNames.some((pName) => pName.includes(name)))
      const hasReducePerson = reducePersons.some((name) => scenePersonNames.some((pName) => pName.includes(name)))

      // Модифицируем сцену
      if (hasFocusPerson) {
        // Увеличиваем длительность сцены
        scene.duration *= 1.5
        // Добавляем больше крупных планов
        scene.visualElements.push({
          type: VisualElementType.CLOSE_UP,
          description: "Focus on main character",
          subjects: scenePersons.map((p) => p.name),
        })
      }

      if (hasReducePerson) {
        // Уменьшаем длительность
        scene.duration *= 0.7
      }

      return scene
    })

    return {
      ...script,
      scenes: adaptedScenes,
      metadata: {
        ...script.metadata,
        // Добавляем информацию об адаптации
        targetAudience: `${script.metadata.targetAudience || ""} (adapted for persons: ${instructions})`,
        adaptedForPersons: true,
        personInstructions: instructions,
      },
    }
  }

  /**
   * Генерация альтернативных вариантов сценария
   */
  private async generateAlternatives(
    script: GeneratedScript,
    context: ScriptGenerationContext,
    params: ScriptGenerationParams,
  ): Promise<ScriptAlternative[]> {
    try {
      const alternatives: ScriptAlternative[] = []

      // 1. Альтернатива с другим эмоциональным тоном
      if (script.scenes.length > 0) {
        alternatives.push({
          id: `alt-mood-${Date.now()}`,
          type: "different_style",
          description: "Альтернатива с другим эмоциональным тоном",
          preview: this.generateMoodAlternativePreview(script, params),
          differences: ["Изменен эмоциональный тон", "Скорректирован темп", "Модифицирован стиль диалогов"],
        })
      }

      // 2. Структурная вариация
      if (script.scenes.length >= 3) {
        alternatives.push({
          id: `alt-structure-${Date.now()}`,
          type: "different_structure",
          description: "Альтернатива с переупорядоченными сценами",
          preview: "Сцены переставлены для лучшего повествования",
          differences: ["Переупорядочены сцены", "Другое начало", "Модифицированы переходы"],
        })
      }

      // 3. Короткая версия для соцсетей
      alternatives.push({
        id: `alt-short-${Date.now()}`,
        type: "variation",
        description: "Сжатая версия для социальных медиа",
        preview: `${Math.min(60, script.duration / 2)}-секундная версия для социальных платформ`,
        differences: ["Короче по длительности", "Быстрее темп", "Фокус на ключевых моментах"],
      })

      // 4. Версия с фокусом на персонаже (если есть персонажи)
      if (context.characters && context.characters.length > 1) {
        const secondaryChar = context.characters.find((c) => c.role !== CharacterRole.PROTAGONIST)
        if (secondaryChar) {
          alternatives.push({
            id: `alt-character-${Date.now()}`,
            type: "variation",
            description: `Версия с фокусом на ${secondaryChar.name}`,
            preview: `История с точки зрения ${secondaryChar.name}`,
            differences: ["Другая перспектива", "Больше времени на второстепенного персонажа", "Изменена структура"],
          })
        }
      }

      return alternatives.slice(0, 3) // Ограничиваем до 3 альтернатив
    } catch (error) {
      logger.errorSync("Failed to generate alternatives", { error })
      return []
    }
  }

  /**
   * Генерация превью для альтернативы с другим настроением
   */
  private generateMoodAlternativePreview(_script: GeneratedScript, params: ScriptGenerationParams): string {
    const currentTone = params.tone?.primary || "neutral"
    const alternateTones = ["dramatic", "upbeat", "contemplative", "energetic", "mysterious"]
    const newTone = alternateTones.find((t) => t !== currentTone) || "dramatic"

    return `Версия с ${newTone} настроением вместо ${currentTone}`
  }

  /**
   * Вычисление вариаций темпа
   */
  private calculatePaceVariations(scenes: ScriptScene[]): PaceVariation[] {
    const variations: PaceVariation[] = []
    let currentTime = 0

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const sceneIntensity = this.calculateSceneIntensity(scene)

      let pace: PaceType = PaceType.MODERATE
      let reason = "Базовый темп"

      // Определяем темп на основе интенсивности и типа сцены
      if (sceneIntensity > 8) {
        pace = PaceType.FAST
        reason = "Высокая интенсивность действия"
      } else if (sceneIntensity < 3) {
        pace = PaceType.SLOW
        reason = "Спокойная диалоговая сцена"
      } else if (scene.type && scene.type === "action") {
        pace = PaceType.FAST
        reason = "Экшн сцена"
      } else if (scene.type && scene.type === "dialogue") {
        pace = PaceType.SLOW
        reason = "Диалоговая сцена"
      }

      const startTime = currentTime
      const endTime = currentTime + scene.duration

      variations.push({
        startTime,
        endTime,
        pace,
        reason,
      })

      currentTime = endTime
    }

    return variations
  }

  /**
   * Вычисление интенсивности сцены
   */
  private calculateSceneIntensity(scene: ScriptScene): number {
    let intensity = 5 // Базовая интенсивность

    // Учитываем тип сцены
    if (scene.type === "action" || scene.type === "climax") {
      intensity += 3
    } else if (scene.type === "dialogue" || scene.type === "exposition") {
      intensity -= 2
    }

    // Учитываем визуальные элементы
    const hasCloseUps = scene.visualElements.some((ve) => typeof ve.type === "string" && ve.type.includes("close"))
    const hasActionShots = scene.visualElements.some((ve) => typeof ve.type === "string" && ve.type.includes("action"))

    if (hasActionShots) intensity += 2
    if (hasCloseUps) intensity += 1

    // Учитываем длительность
    if (scene.duration < 3) intensity += 1
    if (scene.duration > 10) intensity -= 1

    // Учитываем количество персонажей
    if (scene.characters && scene.characters.length > 3) intensity += 1

    return Math.max(0, Math.min(10, intensity))
  }

  /**
   * Построение промпта для оценки связности сценария
   */
  private buildCoherenceEvaluationPrompt(script: GeneratedScript): string {
    return `Оцените связность и логичность следующего сценария по шкале от 1 до 10:

СЦЕНАРИЙ:
Название: "${script.title}"
Структура: ${script.structure.type} (${script.structure.acts.length} актов)

СЦЕНЫ:
${script.scenes
  .map((scene, index) => `${index + 1}. ${scene.type?.toUpperCase()}: ${scene.description} (${scene.timestamp}с)`)
  .join("\n")}

ОЦЕНИТЕ:
1. Логическая последовательность событий
2. Соответствие сцен общей структуре повествования
3. Наличие причинно-следственных связей
4. Плавность переходов между сценами
5. Общая целостность истории

Верните ответ в формате: "Coherence: [оценка от 1 до 10]"`
  }

  /**
   * Локальное вычисление связности без AI
   */
  private calculateLocalCoherence(script: GeneratedScript): number {
    let coherenceScore = 0.5

    // Проверяем соответствие количества сцен структуре
    const expectedScenesPerAct = Math.ceil(script.scenes.length / script.structure.acts.length)
    if (expectedScenesPerAct >= 2 && expectedScenesPerAct <= 5) {
      coherenceScore += 0.2
    }

    // Проверяем хронологический порядок
    let chronologicalOrder = true
    for (let i = 1; i < script.scenes.length; i++) {
      const currentTimestamp = script.scenes[i]?.timestamp
      const prevTimestamp = script.scenes[i - 1]?.timestamp
      if (currentTimestamp !== undefined && prevTimestamp !== undefined && currentTimestamp < prevTimestamp) {
        chronologicalOrder = false
        break
      }
    }
    if (chronologicalOrder) coherenceScore += 0.2

    // Проверяем разнообразие типов сцен
    const sceneTypes = new Set(script.scenes.map((s) => s.type))
    if (sceneTypes.size >= 3) coherenceScore += 0.1

    return Math.min(1, coherenceScore)
  }

  /**
   * Получение идеальной длительности для целевой аудитории
   */
  private getIdealDurationForAudience(targetAudience?: string): number | null {
    if (!targetAudience) return null

    const durationMap: Record<string, number> = {
      children: 180, // 3 минуты
      teens: 300, // 5 минут
      adults: 600, // 10 минут
      seniors: 480, // 8 минут
      professionals: 900, // 15 минут
      social_media: 60, // 1 минута
      youtube: 480, // 8 минут
      tiktok: 30, // 30 секунд
    }

    const audience = targetAudience.toLowerCase()
    return durationMap[audience] || null
  }

  /**
   * Оценка подходящности контента для аудитории
   */
  private evaluateContentAppropriateness(script: GeneratedScript, targetAudience?: string): number {
    if (!targetAudience) return 0.5

    const audience = targetAudience.toLowerCase()
    let appropriatenessScore = 0.7 // Базовый скор

    // Анализируем типы сцен
    const sceneTypes = script.scenes.map((s) => s.type)

    if (audience.includes("children")) {
      // Для детей: больше образовательного и игрового контента
      const educationalScenes = sceneTypes.filter(
        (type) => type && ["tutorial", "educational", "demonstration"].includes(type),
      ).length
      appropriatenessScore = educationalScenes / sceneTypes.length
    } else if (audience.includes("professional")) {
      // Для профессионалов: больше информативного контента
      const professionalScenes = sceneTypes.filter(
        (type) => type && ["demonstration", "tutorial", "presentation"].includes(type),
      ).length
      appropriatenessScore = professionalScenes / sceneTypes.length
    } else if (audience.includes("social")) {
      // Для соцсетей: больше динамичного контента
      const dynamicScenes = sceneTypes.filter(
        (type) => type && ["action", "montage", "highlight"].includes(type),
      ).length
      appropriatenessScore = dynamicScenes / sceneTypes.length
    }

    return Math.min(1, Math.max(0, appropriatenessScore))
  }

  /**
   * Оценка сложности повествования
   */
  private evaluateNarrativeComplexity(script: GeneratedScript): number {
    let complexity = 0

    // Количество актов влияет на сложность
    complexity += script.structure.acts.length * 0.1

    // Количество поворотных точек
    complexity += script.structure.turningPoints.length * 0.15

    // Разнообразие типов сцен
    const uniqueSceneTypes = new Set(script.scenes.map((s) => s.type)).size
    complexity += uniqueSceneTypes * 0.1

    // Наличие нелинейной структуры
    if (script.structure.type !== NarrativeType.THREE_ACT) {
      complexity += 0.2
    }

    return Math.min(1, complexity)
  }

  /**
   * Получение идеальной сложности для аудитории
   */
  private getIdealComplexityForAudience(targetAudience?: string): number {
    if (!targetAudience) return 0.5

    const complexityMap: Record<string, number> = {
      children: 0.2, // Простые истории
      teens: 0.4, // Умеренная сложность
      adults: 0.7, // Сложные повествования
      professionals: 0.8, // Высокая сложность
      social_media: 0.1, // Очень простые
      tiktok: 0.1, // Максимально простые
    }

    const audience = targetAudience.toLowerCase()
    return complexityMap[audience] || 0.5
  }
}
