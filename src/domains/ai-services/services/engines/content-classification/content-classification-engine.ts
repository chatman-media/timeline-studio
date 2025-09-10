/**
 * Content Classification Engine
 *
 * Классифицирует видео контент по множественным категориям
 * используя AI анализ и машинное обучение.
 */

import { UnifiedAIService } from "@/domains/ai-core/services"
import { AdvancedSceneAnalysis } from "@/domains/ai-services"
import {
  type ContentClassification,
  type MediaInput,
  type SceneAnalysis,
} from "@/domains/ai-services/services/content-intelligence-service"

// Расширенная классификация контента
export interface ExtendedContentClassification extends ContentClassification {
  subcategories: SubcategoryClassification
  contentTags: ContentTag[]
  moodAnalysis: MoodAnalysis
  targetingRecommendations: TargetingRecommendation[]
  platformSuitability: PlatformSuitability
  marketingPotential: MarketingPotential
  accessibilityScore: AccessibilityScore
}

export interface SubcategoryClassification {
  genre: {
    primary: string
    secondary: string[]
    confidence: Record<string, number>
  }
  style: {
    cinematography: string
    editing: string
    color: string
    audio: string
  }
  narrative: {
    structure: string
    pacing: string
    complexity: string
  }
}

export interface ContentTag {
  tag: string
  category: "visual" | "audio" | "narrative" | "technical" | "emotional"
  confidence: number
  importance: "high" | "medium" | "low"
  context?: string
}

export interface MoodAnalysis {
  primary: string
  secondary: string[]
  valence: number // -1 (negative) to 1 (positive)
  arousal: number // 0 (calm) to 1 (exciting)
  dominance: number // 0 (submissive) to 1 (dominant)
  emotionalArc: EmotionalPoint[]
}

export interface EmotionalPoint {
  timestamp: number
  emotion: string
  intensity: number
  confidence: number
}

export interface TargetingRecommendation {
  demographic: string
  suitability: number
  reasoning: string
  adjustments?: string[]
}

export interface PlatformSuitability {
  youtube: PlatformScore
  tiktok: PlatformScore
  instagram: PlatformScore
  facebook: PlatformScore
  twitter: PlatformScore
  linkedin: PlatformScore
  telegram: PlatformScore
}

export interface PlatformScore {
  score: number
  reasoning: string
  optimizationSuggestions: string[]
  bestTimeSlots?: string[]
}

export interface MarketingPotential {
  viralPotential: number
  engagementPrediction: number
  shareabilityScore: number
  conversionPotential: number
  brandingOpportunities: string[]
  callToActionSuggestions: string[]
}

export interface AccessibilityScore {
  overallScore: number
  visualAccessibility: number
  audioAccessibility: number
  cognitiveAccessibility: number
  recommendations: string[]
}

/**
 * Content Classification Engine
 */
export class ContentClassificationEngine {
  private aiService: UnifiedAIService

  constructor() {
    this.aiService = UnifiedAIService.getInstance()
  }

  /**
   * Полная классификация контента
   */
  async classifyContent(
    mediaFile: MediaInput,
    scenes?: AdvancedSceneAnalysis[],
    options: {
      includeSubcategories?: boolean
      analyzeMood?: boolean
      includeTargeting?: boolean
      analyzePlatforms?: boolean
      includeMarketing?: boolean
      analyzeAccessibility?: boolean
    } = {},
  ): Promise<ExtendedContentClassification> {
    const {
      includeSubcategories = true,
      analyzeMood = true,
      includeTargeting = true,
      analyzePlatforms = true,
      includeMarketing = true,
      analyzeAccessibility = true,
    } = options

    try {
      // 1. Базовая классификация
      const baseClassification = await this.performBaseClassification(mediaFile, scenes)

      // 2. Подкategории (если включено)
      const subcategories = includeSubcategories
        ? await this.analyzeSubcategories(mediaFile, scenes, baseClassification)
        : this.getDefaultSubcategories()

      // 3. Теги контента
      const contentTags = await this.extractContentTags(mediaFile, scenes, baseClassification)

      // 4. Анализ настроения (если включено)
      const moodAnalysis = analyzeMood ? await this.analyzeMood(mediaFile, scenes) : this.getDefaultMoodAnalysis()

      // 5. Рекомендации по таргетингу (если включено)
      const targetingRecommendations = includeTargeting
        ? await this.generateTargetingRecommendations(baseClassification, subcategories, moodAnalysis)
        : []

      // 6. Анализ подходящих платформ (если включено)
      const platformSuitability = analyzePlatforms
        ? await this.analyzePlatformSuitability(baseClassification, subcategories, moodAnalysis)
        : this.getDefaultPlatformSuitability()

      // 7. Маркетинговый потенциал (если включено)
      const marketingPotential = includeMarketing
        ? await this.analyzeMarketingPotential(baseClassification, subcategories, moodAnalysis)
        : this.getDefaultMarketingPotential()

      // 8. Оценка доступности (если включено)
      const accessibilityScore = analyzeAccessibility
        ? await this.analyzeAccessibility(mediaFile, scenes)
        : this.getDefaultAccessibilityScore()

      return {
        ...baseClassification,
        subcategories,
        contentTags,
        moodAnalysis,
        targetingRecommendations,
        platformSuitability,
        marketingPotential,
        accessibilityScore,
      }
    } catch (error) {
      console.error("Ошибка классификации контента:", error)
      throw new Error(`Не удалось классифицировать контент ${mediaFile.filename}: ${String(error)}`)
    }
  }

  /**
   * Базовая классификация контента
   */
  private async performBaseClassification(
    mediaFile: MediaInput,
    scenes?: SceneAnalysis[],
  ): Promise<ContentClassification> {
    const prompt = `Классифицируй видео контент:

Файл: ${mediaFile.filename}
Тип: ${mediaFile.type}
Длительность: ${mediaFile.duration} сек
${scenes ? `Количество сцен: ${scenes.length}` : ""}
${scenes ? `Типы сцен: ${scenes.map((s) => s.type).join(", ")}` : ""}

Определи основные характеристики:

1. Genre (жанр):
   - documentary (документальный)
   - narrative (художественный)
   - instructional (обучающий) 
   - promotional (рекламный)
   - entertainment (развлекательный)
   - news (новостной)
   - educational (образовательный)
   - corporate (корпоративный)
   - personal (личный)
   - artistic (артистический)

2. Style (стиль):
   - professional (профессиональный)
   - casual (неформальный)
   - artistic (художественный)
   - minimalist (минималистичный)
   - dynamic (динамичный)
   - static (статичный)
   - vintage (винтажный)
   - modern (современный)

3. Emotion (эмоциональная окраска):
   - positive (позитивная)
   - negative (негативная)
   - neutral (нейтральная)
   - dramatic (драматическая)
   - humorous (юмористическая)
   - inspiring (вдохновляющая)
   - melancholic (меланхоличная)
   - energetic (энергичная)

4. Audience (целевая аудитория):
   - children (дети)
   - teenagers (подростки)
   - young_adults (молодежь)
   - adults (взрослые)
   - seniors (пожилые)
   - professionals (профессионалы)
   - general (общая)
   - niche (специализированная)

5. Technical Quality (техническое качество):
   - poor (плохое)
   - fair (удовлетворительное)
   - good (хорошее)
   - excellent (отличное)
   - broadcast (вещательное)

6. Content Rating (возрастной рейтинг):
   - G (для всех)
   - PG (под руководством взрослых)
   - PG-13 (13+)
   - R (ограничено)
   - NC-17 (17+)

Верни результат в JSON формате с полями genre, style, emotion, audience, technicalQuality, contentRating и confidence (объект с уверенностью для каждого поля 0-1).`

    const response = await this.aiService.sendRequest("claude-4-sonnet", [{ role: "user", content: prompt }], {
      temperature: 0.2,
    })

    try {
      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка парсинга базовой классификации:", error)
      return {
        genre: "unknown",
        style: "unknown",
        emotion: "neutral",
        audience: "general",
        technicalQuality: "fair",
        contentRating: "G",
        confidence: {},
      }
    }
  }

  /**
   * Анализ подкатегорий
   */
  private async analyzeSubcategories(
    _mediaFile: MediaInput,
    _scenes: SceneAnalysis[] | undefined,
    baseClassification: ContentClassification,
  ): Promise<SubcategoryClassification> {
    const prompt = `Проведи углубленный анализ подкатегорий для видео:

Базовая классификация:
- Жанр: ${baseClassification.genre}
- Стиль: ${baseClassification.style}
- Аудитория: ${baseClassification.audience}

Определи подкатегории:

1. Genre subcategories:
   - primary: основной поджанр
   - secondary: дополнительные поджанры (массив)
   - confidence: уверенность для каждого поджанра

2. Style components:
   - cinematography: кинематография (static, handheld, professional, amateur, artistic)
   - editing: монтаж (fast, slow, rhythmic, chaotic, smooth, jump_cuts)
   - color: цветовое решение (natural, saturated, desaturated, monochrome, vintage, vibrant)
   - audio: аудио стиль (clear, ambient, musical, voice_over, natural_sound)

3. Narrative structure:
   - structure: структура (linear, non_linear, circular, episodic, experimental)
   - pacing: темп (slow, medium, fast, variable, crescendo)
   - complexity: сложность (simple, moderate, complex, experimental)

Формат ответа JSON с указанными полями.`

    try {
      const response = await this.aiService.sendRequest("claude-4-sonnet", [{ role: "user", content: prompt }], {
        temperature: 0.3,
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка анализа подкатегорий:", error)
      return this.getDefaultSubcategories()
    }
  }

  /**
   * Извлечение тегов контента
   */
  private async extractContentTags(
    mediaFile: MediaInput,
    scenes: SceneAnalysis[] | undefined,
    classification: ContentClassification,
  ): Promise<ContentTag[]> {
    const prompt = `Извлеки релевантные теги для видео контента:

Файл: ${mediaFile.filename}
Классификация: ${JSON.stringify(classification)}
${
  scenes
    ? `Сцены: ${scenes
        .map((s) => `${s.type}: ${s.description}`)
        .slice(0, 5)
        .join("; ")}`
    : ""
}

Создай массив тегов с категориями:

1. Visual tags: то, что видно (objects, people, locations, actions, colors, lighting)
2. Audio tags: то, что слышно (music, speech, sounds, effects, silence)
3. Narrative tags: повествование (story, character, conflict, resolution, theme)
4. Technical tags: техника (camera_work, editing, quality, format, effects)
5. Emotional tags: эмоции (mood, feeling, atmosphere, energy, tension)

Для каждого тега указывай:
- tag: название тега
- category: категория (visual/audio/narrative/technical/emotional)
- confidence: уверенность 0-1
- importance: важность (high/medium/low)
- context: контекст использования (опционально)

Верни JSON массив тегов (максимум 20 самых релевантных).`

    try {
      const response = await this.aiService.sendRequest("claude-4-sonnet", [{ role: "user", content: prompt }], {
        temperature: 0.4,
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка извлечения тегов:", error)
      return []
    }
  }

  /**
   * Анализ настроения и эмоций
   */
  private async analyzeMood(mediaFile: MediaInput, scenes: SceneAnalysis[] | undefined): Promise<MoodAnalysis> {
    const prompt = `Проанализируй эмоциональное содержание видео:

Файл: ${mediaFile.filename}
${scenes ? `Сцены: ${scenes.map((s) => `${s.startTime}s-${s.endTime}s: ${s.type} - ${s.description}`).join("; ")}` : ""}

Определи:

1. Primary emotion: основная эмоция (happiness, sadness, anger, fear, surprise, disgust, contempt, neutral)
2. Secondary emotions: дополнительные эмоции (массив)
3. Emotional dimensions:
   - valence: валентность от -1 (негативно) до 1 (позитивно)
   - arousal: возбуждение от 0 (спокойно) до 1 (возбужденно)
   - dominance: доминирование от 0 (покорно) до 1 (доминантно)
4. Emotional arc: эмоциональная дуга (массив точек с timestamp, emotion, intensity, confidence)

Формат ответа JSON:
{
  "primary": "happiness",
  "secondary": ["excitement", "joy"],
  "valence": 0.7,
  "arousal": 0.6,
  "dominance": 0.8,
  "emotionalArc": [
    {"timestamp": 0, "emotion": "neutral", "intensity": 0.5, "confidence": 0.8},
    {"timestamp": 30, "emotion": "happiness", "intensity": 0.8, "confidence": 0.9}
  ]
}`

    try {
      const response = await this.aiService.sendRequest("claude-4-sonnet", [{ role: "user", content: prompt }], {
        temperature: 0.3,
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка анализа настроения:", error)
      return this.getDefaultMoodAnalysis()
    }
  }

  /**
   * Генерация рекомендаций по таргетингу
   */
  private async generateTargetingRecommendations(
    classification: ContentClassification,
    _subcategories: SubcategoryClassification,
    mood: MoodAnalysis,
  ): Promise<TargetingRecommendation[]> {
    const prompt = `Создай рекомендации по таргетингу аудитории:

Контент:
- Жанр: ${classification.genre}
- Стиль: ${classification.style}
- Основная аудитория: ${classification.audience}
- Эмоция: ${classification.emotion}
- Настроение: ${mood.primary}

Для каждой демографической группы оцени:
- Подходящие демографии: children, teenagers, young_adults, adults, seniors, parents, professionals, students, retirees
- Дополнительные характеристики: gender, interests, income_level, education, geographic_location
- Suitability score: 0-1
- Reasoning: обоснование
- Adjustments: корректировки для лучшего соответствия (опционально)

Верни JSON массив рекомендаций.`

    try {
      const response = await this.aiService.sendRequest("claude-4-sonnet", [{ role: "user", content: prompt }], {
        temperature: 0.4,
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка генерации рекомендаций таргетинга:", error)
      return []
    }
  }

  /**
   * Анализ подходящих платформ
   */
  private async analyzePlatformSuitability(
    classification: ContentClassification,
    _subcategories: SubcategoryClassification,
    mood: MoodAnalysis,
  ): Promise<PlatformSuitability> {
    const prompt = `Оцени подходящесть контента для различных платформ:

Контент:
- Жанр: ${classification.genre}
- Стиль: ${classification.style}
- Аудитория: ${classification.audience}
- Техническое качество: ${classification.technicalQuality}
- Настроение: ${mood.primary}

Для каждой платформы оцени (0-1):
1. YouTube: длинные видео, SEO, обучающий контент
2. TikTok: короткие вертикальные видео, молодежь, тренды
3. Instagram: визуальность, Stories/Reels, lifestyle
4. Facebook: разнообразный контент, широкая аудитория
5. Twitter: короткие клипы, новости, viral контент
6. LinkedIn: профессиональный контент, B2B
7. Telegram: каналы, документальный контент

Для каждой платформы укажи:
- score: оценка подходящести 0-1
- reasoning: обоснование
- optimizationSuggestions: предложения по оптимизации (массив)
- bestTimeSlots: лучшие временные слоты для публикации (опционально)

Формат ответа JSON с полями для каждой платформы.`

    try {
      const response = await this.aiService.sendRequest("claude-4-sonnet", [{ role: "user", content: prompt }], {
        temperature: 0.3,
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка анализа платформ:", error)
      return this.getDefaultPlatformSuitability()
    }
  }

  /**
   * Анализ маркетингового потенциала
   */
  private async analyzeMarketingPotential(
    classification: ContentClassification,
    _subcategories: SubcategoryClassification,
    mood: MoodAnalysis,
  ): Promise<MarketingPotential> {
    const prompt = `Оцени маркетинговый потенциал контента:

Характеристики:
- Жанр: ${classification.genre}
- Эмоция: ${classification.emotion}
- Аудитория: ${classification.audience}
- Настроение: ${mood.primary}
- Валентность: ${mood.valence}
- Возбуждение: ${mood.arousal}

Оцени (0-1):
1. viralPotential: потенциал виральности
2. engagementPrediction: прогноз вовлеченности
3. shareabilityScore: склонность к расшариванию
4. conversionPotential: потенциал конверсии

Предложи:
5. brandingOpportunities: возможности для брендинга (массив)
6. callToActionSuggestions: предложения призывов к действию (массив)

Формат ответа JSON с указанными полями.`

    try {
      const response = await this.aiService.sendRequest("claude-4-sonnet", [{ role: "user", content: prompt }], {
        temperature: 0.4,
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка анализа маркетингового потенциала:", error)
      return this.getDefaultMarketingPotential()
    }
  }

  /**
   * Анализ доступности контента
   */
  private async analyzeAccessibility(
    mediaFile: MediaInput,
    scenes: SceneAnalysis[] | undefined,
  ): Promise<AccessibilityScore> {
    const prompt = `Оцени доступность видео контента для людей с ограниченными возможностями:

Файл: ${mediaFile.filename}
${scenes ? `Сцены с голосом: ${scenes.filter((s) => s.description?.includes("голос") || s.description?.includes("речь")).length}` : ""}

Оцени по шкале 0-10:

1. visualAccessibility: визуальная доступность
   - Контрастность и читаемость текста
   - Цветовая схема (для дальтоников)
   - Размер и четкость элементов
   - Описания визуального контента

2. audioAccessibility: аудио доступность  
   - Четкость речи
   - Фоновый шум
   - Наличие субтитров
   - Аудиоописания для слепых

3. cognitiveAccessibility: когнитивная доступность
   - Простота языка
   - Скорость подачи информации
   - Логичность структуры
   - Отсутствие перегрузки информацией

4. overallScore: общая оценка (среднее)

5. recommendations: рекомендации по улучшению доступности (массив строк)

Формат ответа JSON.`

    try {
      const response = await this.aiService.sendRequest("claude-4-sonnet", [{ role: "user", content: prompt }], {
        temperature: 0.2,
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка анализа доступности:", error)
      return this.getDefaultAccessibilityScore()
    }
  }

  // Методы по умолчанию
  private getDefaultSubcategories(): SubcategoryClassification {
    return {
      genre: { primary: "unknown", secondary: [], confidence: {} },
      style: { cinematography: "unknown", editing: "unknown", color: "unknown", audio: "unknown" },
      narrative: { structure: "unknown", pacing: "unknown", complexity: "unknown" },
    }
  }

  private getDefaultMoodAnalysis(): MoodAnalysis {
    return {
      primary: "neutral",
      secondary: [],
      valence: 0,
      arousal: 0.5,
      dominance: 0.5,
      emotionalArc: [],
    }
  }

  private getDefaultPlatformSuitability(): PlatformSuitability {
    const defaultScore: PlatformScore = {
      score: 0.5,
      reasoning: "Недостаточно данных для анализа",
      optimizationSuggestions: [],
    }

    return {
      youtube: defaultScore,
      tiktok: defaultScore,
      instagram: defaultScore,
      facebook: defaultScore,
      twitter: defaultScore,
      linkedin: defaultScore,
      telegram: defaultScore,
    }
  }

  private getDefaultMarketingPotential(): MarketingPotential {
    return {
      viralPotential: 0.5,
      engagementPrediction: 0.5,
      shareabilityScore: 0.5,
      conversionPotential: 0.5,
      brandingOpportunities: [],
      callToActionSuggestions: [],
    }
  }

  private getDefaultAccessibilityScore(): AccessibilityScore {
    return {
      overallScore: 5,
      visualAccessibility: 5,
      audioAccessibility: 5,
      cognitiveAccessibility: 5,
      recommendations: [],
    }
  }
}

export default ContentClassificationEngine
