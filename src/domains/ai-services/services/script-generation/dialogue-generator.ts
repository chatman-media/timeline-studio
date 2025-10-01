/**
 * Dialogue Generator
 * Генератор диалогов для сценариев
 */

import { UnifiedAIService } from "@/domains/ai-core/services"
import type { Character, Dialogue, Timing } from "./types"

export interface DialogueGenerationParams {
  characters: Character[]
  scene: SceneContext
  style: DialogueStyle
  constraints?: DialogueConstraints
}

export interface SceneContext {
  location: string
  timeOfDay: string
  mood: string
  action?: string
}

export interface DialogueStyle {
  tone: "formal" | "casual" | "dramatic" | "comedic"
  pacing: "slow" | "medium" | "fast"
  naturalism: number // 0-1
  subtext: boolean
}

export interface DialogueConstraints {
  maxLength?: number
  minLength?: number
  requiredTopics?: string[]
  bannedWords?: string[]
}

export class DialogueGenerator {
  private static instance: DialogueGenerator | null = null
  private aiService: UnifiedAIService
  private isInitialized = false

  private constructor() {
    this.aiService = UnifiedAIService.getInstance()
  }

  static getInstance(): DialogueGenerator {
    if (!DialogueGenerator.instance) {
      DialogueGenerator.instance = new DialogueGenerator()
    }
    return DialogueGenerator.instance
  }

  async initialize(): Promise<void> {
    // Инициализация генератора диалогов
    this.isInitialized = true
  }

  /**
   * Генерировать диалоги для сцены
   */
  async generate(params: DialogueGenerationParams): Promise<Dialogue[]> {
    if (!this.isInitialized) {
      throw new Error("Dialogue Generator not initialized")
    }

    const { characters, scene, style, constraints } = params

    // Строим промпт для генерации
    const prompt = this.buildDialoguePrompt(characters, scene, style, constraints)

    // Генерируем диалог через AI
    const response = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], {
        temperature: style.naturalism || 0.8,
        maxTokens: 1500,
      })
      .then((r) => r.content)

    // Парсим ответ в диалоги
    return this.parseDialogueResponse(response, characters, scene)
  }

  /**
   * Генерировать реплику персонажа
   */
  async generateLine(character: Character, context: SceneContext, previousLine?: string): Promise<string> {
    const prompt = `Generate a single line of dialogue for ${character.name} (${character.role}).
    
Character description: ${character.description || "not specified"}
Character role: ${character.role}
Scene: ${context.location} - ${context.timeOfDay}
Mood: ${context.mood}
Action: ${context.action}
${previousLine ? `Previous line: "${previousLine}"` : ""}

Generate only the dialogue line, no attribution or stage directions.`

    const response = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], { temperature: 0.8, maxTokens: 100 })
      .then((r) => r.content)

    return this.cleanDialogueLine(response)
  }

  /**
   * Улучшить существующий диалог
   */
  async improveDialogue(dialogue: Dialogue, character: Character, style: DialogueStyle): Promise<Dialogue> {
    const prompt = `Improve this dialogue line while maintaining character voice:

Character: ${character.name} (${character.role})
Current line: "${dialogue.text}"
Style: ${style.tone}, ${style.pacing} pacing
${style.subtext ? "Include subtext" : "Direct communication"}

Provide an improved version that sounds more ${style.naturalism > 0.7 ? "natural" : "stylized"}.`

    const improvedText = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], { temperature: 0.6, maxTokens: 150 })
      .then((r) => r.content)

    return {
      ...dialogue,
      text: this.cleanDialogueLine(improvedText),
    }
  }

  /**
   * Генерировать диалог между персонажами
   */
  async generateConversation(characters: Character[], scene: SceneContext, turnCount = 4): Promise<Dialogue[]> {
    const dialogues: Dialogue[] = []
    let previousLine = ""

    for (let i = 0; i < turnCount; i++) {
      const currentCharacter = characters[i % characters.length]
      const line = await this.generateLine(currentCharacter, scene, previousLine)

      dialogues.push({
        id: `dialogue_${Date.now()}_${i}`,
        sceneId: "scene_temp",
        character: currentCharacter.name,
        text: line,
        timing: this.calculateTiming(i, line),
      })

      previousLine = line
    }

    return dialogues
  }

  /**
   * Построить промпт для генерации диалога
   */
  private buildDialoguePrompt(
    characters: Character[],
    scene: SceneContext,
    style: DialogueStyle,
    constraints?: DialogueConstraints,
  ): string {
    const characterDescriptions = characters
      .map((c) => `${c.name} (${c.role}): ${c.description || "no description"}`)
      .join("\n")

    return `Generate dialogue for a scene with these characters:

${characterDescriptions}

Scene Context:
Location: ${scene.location}
Time: ${scene.timeOfDay}
Mood: ${scene.mood}
Action: ${scene.action || "conversation"}

Style Requirements:
- Tone: ${style.tone}
- Pacing: ${style.pacing}
- Naturalism: ${style.naturalism * 100}%
- ${style.subtext ? "Include subtext and unspoken meanings" : "Direct communication"}

${constraints ? this.formatConstraints(constraints) : ""}

Generate ${Math.min(characters.length * 2, 6)} lines of dialogue as JSON:
[
  {"character": "Name", "text": "Dialogue line", "emotion": "emotion if relevant"}
]`
  }

  /**
   * Парсить ответ AI в диалоги
   */
  private parseDialogueResponse(response: string, _characters: Character[], _scene: SceneContext): Dialogue[] {
    try {
      // Пытаемся извлечь JSON из ответа
      const jsonMatch = response.match(/\[[\s\S]*\]/)?.[0]
      if (!jsonMatch) throw new Error("No JSON found in response")

      const parsed = JSON.parse(jsonMatch)

      return parsed.map((item: any, index: number) => ({
        id: `dialogue_${Date.now()}_${index}`,
        sceneId: "temp_scene",
        character: item.character,
        text: item.text,
        emotion: item.emotion,
        timing: this.calculateTiming(index, item.text),
      }))
    } catch (error) {
      console.error("Failed to parse dialogue response:", error)
      // Fallback: пытаемся извлечь диалог из текста
      return this.extractDialogueFromText(response)
    }
  }

  /**
   * Извлечь диалог из текста (fallback)
   */
  private extractDialogueFromText(text: string): Dialogue[] {
    const dialogues: Dialogue[] = []
    const lines = text.split("\n").filter((line) => line.trim())

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Ищем паттерн "Character: dialogue"
      const match = line.match(/^([A-Z][A-Za-z\s]+):\s*"?([^"]+)"?/)
      if (match) {
        dialogues.push({
          id: `dialogue_${Date.now()}_${i}`,
          sceneId: "temp_scene",
          character: match[1].trim(),
          text: match[2].trim(),
          timing: this.calculateTiming(i, match[2]),
        })
      }
    }

    return dialogues
  }

  /**
   * Очистить строку диалога
   */
  private cleanDialogueLine(text: string): string {
    return text
      .replace(/^["']|["']$/g, "") // Удаляем кавычки
      .replace(/^\w+:\s*/, "") // Удаляем атрибуцию
      .replace(/\s*\([^)]*\)\s*/g, "") // Удаляем ремарки
      .trim()
  }

  /**
   * Рассчитать тайминг для диалога
   */
  private calculateTiming(index: number, text: string): Timing {
    // Примерный расчет: 150 слов в минуту
    const wordsPerSecond = 2.5
    const words = text.split(/\s+/).length
    const duration = words / wordsPerSecond
    const start = index * 3 // 3 секунды между репликами

    return {
      start,
      end: start + duration,
      duration,
    }
  }

  /**
   * Форматировать ограничения
   */
  private formatConstraints(constraints: DialogueConstraints): string {
    const parts: string[] = []

    if (constraints.maxLength) {
      parts.push(`Maximum ${constraints.maxLength} words per line`)
    }
    if (constraints.minLength) {
      parts.push(`Minimum ${constraints.minLength} words per line`)
    }
    if (constraints.requiredTopics?.length) {
      parts.push(`Must mention: ${constraints.requiredTopics.join(", ")}`)
    }
    if (constraints.bannedWords?.length) {
      parts.push(`Avoid words: ${constraints.bannedWords.join(", ")}`)
    }

    return parts.length > 0 ? `\nConstraints:\n${parts.join("\n")}` : ""
  }

  /**
   * Генерировать диалог с эмоциями
   */
  async generateEmotionalDialogue(
    character: Character,
    emotion: string,
    context: SceneContext,
    intensity = 0.5,
  ): Promise<string> {
    const prompt = `Generate dialogue for ${character.name} expressing ${emotion} with intensity ${intensity * 10}/10.

Context: ${context.location}, ${context.mood}
Character should sound ${intensity > 0.7 ? "very" : intensity > 0.3 ? "moderately" : "slightly"} ${emotion}.

Return only the dialogue line.`

    const response = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], { temperature: 0.7 + intensity * 0.3, maxTokens: 100 })
      .then((r) => r.content)

    return this.cleanDialogueLine(response)
  }
}
