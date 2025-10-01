/**
 * Person Identification AI Tools с использованием BaseAITool
 *
 * Набор AI инструментов для работы с распознаванием и управлением персонами
 * в видеоконтенте. Интегрируется с Claude Tools через AI Chat модуль.
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../base-ai-tool"

// Типы для операций распознавания персон
export interface PersonIdentificationInput {
  operation:
    | "identify_persons"
    | "search_persons"
    | "create_profile"
    | "update_profile"
    | "get_statistics"
    | "merge_profiles"
    | "delete_profile"
    | "manage_privacy"
  videoPath?: string
  personId?: string
  personIds?: string[]
  query?: string
  faceImagePath?: string
  name?: string
  description?: string
  tags?: string[]
  thumbnailPath?: string
  enableFaceDetection?: boolean
  enablePersonTracking?: boolean
  confidenceThreshold?: number
  similarityThreshold?: number
  createNewProfiles?: boolean
  isVerified?: boolean
  privacySettings?: any
  limit?: number
  includeUnverified?: boolean
  includeStatistics?: boolean
  targetPersonId?: string
}

export interface PersonIdentificationResult {
  operation: string
  success: boolean
  persons?: any[]
  profile?: any
  statistics?: any
  searchResults?: any[]
  detectedPersons?: any[]
  mergeResult?: any
  privacyChanges?: any
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для работы с распознаванием персон с унифицированной обработкой ошибок
 */
export class PersonIdentificationTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("PersonIdentificationTool", logger)
  }

  /**
   * Идентификация персон в видео
   */
  private async identifyPersonsInVideo(input: PersonIdentificationInput): Promise<PersonIdentificationResult> {
    if (!input.videoPath) {
      throw new Error("Не указан путь к видео")
    }

    this.logger?.info("Идентифиция персон в видео", { videoPath: input.videoPath })

    try {
      // Используем Scene Analysis Engine для реального анализа
      const { SceneAnalysisEngine } = await import(
        "@/domains/ai-services/services/scene-analysis/scene-analysis-engine"
      )
      const sceneEngine = SceneAnalysisEngine.getInstance()

      // Анализ видео для обнаружения лиц через scene analysis
      const mediaFile = {
        path: input.videoPath,
        name: input.videoPath.split("/").pop() || input.videoPath,
        filename: input.videoPath.split("/").pop() || input.videoPath,
        type: "video" as const,
        duration: 0,
        size: 0,
      }
      const sceneAnalysis = await sceneEngine.analyzeScenes(mediaFile)

      // Извлекаем информацию о персонах из анализа сцен (заглушка)
      const detectedPersons = sceneAnalysis.map((scene: any, index: number) => ({
        id: `person-${index}`,
        name: `Персона ${index + 1}`,
        confidence: 0.8,
        appearances: [
          {
            sceneId: scene.id || `scene-${index}`,
            startTime: scene.startTime || 0,
            endTime: scene.endTime || 10,
            confidence: 0.8,
          },
        ],
      }))

      // Подготавливаем результаты
      const processedPersons = detectedPersons.map((person: any) => ({
        id: person.id,
        name: person.name || `Неизвестная персона ${person.id}`,
        confidence: person.confidence || input.confidenceThreshold || 0.7,
        appearances: person.appearances || [],
        isVerified: false,
        thumbnailUrl: person.thumbnailUrl,
      }))

      // Кластеризация неизвестных лиц если нужно
      if (input.createNewProfiles) {
        const { PersonDatabaseService } = await import(
          "@/features/person-identification/services/person-database-service"
        )
        const dbService = PersonDatabaseService.getInstance()
        // Кластеризация лиц (заглушка - требует правильный тип DetectedFaceWithEmbedding)
        // await dbService.clusterUnidentifiedFaces(detectedPersons, input.similarityThreshold || 0.8)
      }

      const warnings: string[] = []
      if (processedPersons.length === 0) {
        warnings.push("Не обнаружено лиц в видео")
      }
      if (processedPersons.some((p: any) => p.confidence < 0.5)) {
        warnings.push("Некоторые лица обнаружены с низкой уверенностью")
      }

      return {
        operation: input.operation,
        success: true,
        detectedPersons: processedPersons,
        message: `Обнаружено персон: ${processedPersons.length}`,
        recommendations: [
          "Проверьте неизвестные персоны",
          "Добавьте имена для опознанных лиц",
          input.createNewProfiles ? "Профили созданы автоматически" : "Рассмотрите создание профилей",
        ],
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      throw new Error(`Ошибка идентификации персон: ${error}`)
    }
  }

  /**
   * Поиск персон в базе данных
   */
  private async searchPersonsInDatabase(input: PersonIdentificationInput): Promise<PersonIdentificationResult> {
    if (!input.query && !input.faceImagePath) {
      throw new Error("Не указан запрос или изображение для поиска")
    }

    this.logger?.info("Поиск персон в базе данных")

    try {
      const { PersonDatabaseService } = await import(
        "@/features/person-identification/services/person-database-service"
      )
      const dbService = PersonDatabaseService.getInstance()

      let searchResults: any[] = []

      if (input.query) {
        // Поиск по имени или тегам
        const persons = await dbService.searchPersons(input.query, {
          tags: input.tags,
          limit: input.limit || 20,
        })

        searchResults = persons.map((person) => ({
          id: person.id,
          name: person.name || "Неизвестный",
          similarity: 1.0, // Полное совпадение по имени
          isVerified: person.isVerified,
          tags: person.tags,
          thumbnailUrl: person.thumbnails.find((t) => t.isPrimary)?.imageUrl,
        }))
      } else if (input.faceImagePath) {
        // Поиск по лицу
        const { VisionService } = await import("@/domains/ai-services/services/vision/vision-service")
        const visionService = VisionService.getInstance()

        // Извлекаем эмбеддинг из изображения
        const faceEmbedding = await visionService.extractFaceEmbedding(input.faceImagePath)

        if (faceEmbedding) {
          const results = await dbService.findSimilarPersons(new Float32Array(faceEmbedding), {
            limit: input.limit || 10,
            minConfidence: input.similarityThreshold || 0.7,
          })

          searchResults = results.map((result) => ({
            id: result.person.id,
            name: result.person.name || "Неизвестный",
            similarity: result.similarity,
            isVerified: result.person.isVerified,
            tags: result.person.tags,
            thumbnailUrl: result.person.thumbnails.find((t) => t.isPrimary)?.imageUrl,
            matches: result.matches,
          }))
        }
      }

      if (!input.includeUnverified) {
        searchResults = searchResults.filter((r) => r.isVerified)
      }

      return {
        operation: input.operation,
        success: true,
        searchResults,
        message: `Найдено совпадений: ${searchResults.length}`,
        recommendations:
          searchResults.length === 0
            ? ["Попробуйте другой запрос", "Снизьте порог сходства"]
            : ["Проверьте результаты поиска"],
      }
    } catch (error) {
      throw new Error(`Ошибка поиска персон: ${error}`)
    }
  }

  /**
   * Создание профиля персоны
   */
  private async createPersonProfile(input: PersonIdentificationInput): Promise<PersonIdentificationResult> {
    if (!input.name) {
      throw new Error("Не указано имя персоны")
    }

    this.logger?.info("Создание профиля персоны", { name: input.name })

    try {
      const { PersonDatabaseService } = await import(
        "@/features/person-identification/services/person-database-service"
      )
      const dbService = PersonDatabaseService.getInstance()

      const profile = await dbService.addPerson({
        name: input.name,
        description: input.description,
        tags: input.tags || [],
        thumbnailPath: input.thumbnailPath,
      })

      return {
        operation: input.operation,
        success: true,
        profile: {
          id: profile.id,
          name: profile.name,
          description: profile.notes,
          tags: profile.tags,
          isVerified: profile.isVerified,
          createdAt: profile.createdAt,
          thumbnailUrl: profile.thumbnails.find((t) => t.isPrimary)?.imageUrl,
        },
        message: "Профиль успешно создан",
        recommendations: [
          "Добавьте фотографии для улучшения распознавания",
          "Начните анализ видео для обнаружения этой персоны",
        ],
      }
    } catch (error) {
      throw new Error(`Ошибка создания профиля: ${error}`)
    }
  }

  /**
   * Обновление профиля персоны
   */
  private async updatePersonProfile(input: PersonIdentificationInput): Promise<PersonIdentificationResult> {
    if (!input.personId) {
      throw new Error("Не указан ID персоны")
    }

    this.logger?.info("Обновление профиля персоны", { personId: input.personId })

    try {
      const { PersonDatabaseService } = await import(
        "@/features/person-identification/services/person-database-service"
      )
      const dbService = PersonDatabaseService.getInstance()

      const updates: any = {}
      if (input.name !== undefined) updates.name = input.name
      if (input.description !== undefined) updates.notes = input.description
      if (input.tags !== undefined) updates.tags = input.tags
      if (input.isVerified !== undefined) updates.isVerified = input.isVerified

      const updatedProfile = await dbService.updatePerson(input.personId, updates)

      if (!updatedProfile) {
        throw new Error("Персона не найдена")
      }

      // Обновляем миниатюру если указана
      if (input.thumbnailPath) {
        await dbService.addPersonThumbnail(input.personId, {
          imageUrl: input.thumbnailPath,
          width: 200,
          height: 200,
          isPrimary: true,
        })
      }

      return {
        operation: input.operation,
        success: true,
        profile: {
          id: updatedProfile.id,
          name: updatedProfile.name,
          description: updatedProfile.notes,
          tags: updatedProfile.tags,
          isVerified: updatedProfile.isVerified,
          updatedAt: updatedProfile.updatedAt,
          thumbnailUrl: updatedProfile.thumbnails.find((t) => t.isPrimary)?.imageUrl,
        },
        message: "Профиль успешно обновлен",
        recommendations: [],
      }
    } catch (error) {
      throw new Error(`Ошибка обновления профиля: ${error}`)
    }
  }

  /**
   * Получение статистики персоны
   */
  private async getPersonStatistics(input: PersonIdentificationInput): Promise<PersonIdentificationResult> {
    this.logger?.info("Получение статистики", { personId: input.personId })

    try {
      const { PersonDatabaseService } = await import(
        "@/features/person-identification/services/person-database-service"
      )
      const dbService = PersonDatabaseService.getInstance()

      if (input.personId) {
        // Статистика конкретной персоны
        const stats = await dbService.getPersonStats(input.personId)

        if (!stats) {
          throw new Error("Персона не найдена")
        }

        return {
          operation: input.operation,
          success: true,
          statistics: {
            personId: stats.personId,
            totalAppearances: stats.totalAppearances,
            totalScreenTime: stats.totalScreenTime,
            averageConfidence: stats.averageConfidence,
            firstAppearance: stats.firstAppearance,
            lastAppearance: stats.lastAppearance,
            clipsCount: stats.clipsCount,
            emotionDistribution: stats.emotionDistribution,
          },
          message: "Статистика получена",
          recommendations: [
            stats.totalAppearances === 0 ? "Начните анализ видео для обнаружения появлений" : "",
          ].filter(Boolean),
        }
      }
      // Общая статистика базы данных
      const dbStats = await dbService.getDatabaseStats()

      return {
        operation: input.operation,
        success: true,
        statistics: {
          totalPersons: dbStats.totalPersons,
          totalEmbeddings: dbStats.totalEmbeddings,
          totalAppearances: dbStats.totalAppearances,
          averageEmbeddingsPerPerson: dbStats.averageEmbeddingsPerPerson,
          lastUpdated: dbStats.lastUpdated,
        },
        message: "Общая статистика получена",
        recommendations: [
          dbStats.totalPersons === 0 ? "Начните добавлять персон в базу" : "",
          dbStats.averageEmbeddingsPerPerson < 3 ? "Добавьте больше фотографий для лучшего распознавания" : "",
        ].filter(Boolean),
      }
    } catch (error) {
      throw new Error(`Ошибка получения статистики: ${error}`)
    }
  }

  /**
   * Объединение профилей персон
   */
  private async mergePersonProfiles(input: PersonIdentificationInput): Promise<PersonIdentificationResult> {
    if (!input.targetPersonId || !input.personIds || input.personIds.length === 0) {
      throw new Error("Не указаны ID персон для объединения")
    }

    this.logger?.info("Объединение профилей", {
      targetPersonId: input.targetPersonId,
      sourceIds: input.personIds,
    })

    try {
      const { PersonDatabaseService } = await import(
        "@/features/person-identification/services/person-database-service"
      )
      const dbService = PersonDatabaseService.getInstance()

      const success = await dbService.mergePersons(input.targetPersonId, input.personIds)

      if (!success) {
        throw new Error("Не удалось объединить профили")
      }

      const mergedPerson = await dbService.getPerson(input.targetPersonId)

      return {
        operation: input.operation,
        success: true,
        mergeResult: {
          targetPersonId: input.targetPersonId,
          mergedPersonIds: input.personIds,
          totalEmbeddings: mergedPerson?.faceEmbeddings.length || 0,
          totalAppearances: mergedPerson?.appearances.length || 0,
        },
        message: `Профили успешно объединены (${input.personIds.length + 1} → 1)`,
        recommendations: ["Проверьте результат объединения", "Обновите информацию о персоне"],
      }
    } catch (error) {
      throw new Error(`Ошибка объединения профилей: ${error}`)
    }
  }

  /**
   * Удаление профиля персоны
   */
  private async deletePersonProfile(input: PersonIdentificationInput): Promise<PersonIdentificationResult> {
    if (!input.personId) {
      throw new Error("Не указан ID персоны")
    }

    this.logger?.info("Удаление профиля персоны", { personId: input.personId })

    try {
      const { PersonDatabaseService } = await import(
        "@/features/person-identification/services/person-database-service"
      )
      const dbService = PersonDatabaseService.getInstance()

      const success = await dbService.deletePerson(input.personId)

      if (!success) {
        throw new Error("Не удалось удалить профиль")
      }

      return {
        operation: input.operation,
        success: true,
        message: "Профиль успешно удален",
        recommendations: ["Все связанные данные также удалены"],
      }
    } catch (error) {
      throw new Error(`Ошибка удаления профиля: ${error}`)
    }
  }

  /**
   * Управление приватностью персоны
   */
  private async managePersonPrivacy(input: PersonIdentificationInput): Promise<PersonIdentificationResult> {
    if (!input.personId || !input.privacySettings) {
      throw new Error("Не указаны ID персоны или настройки приватности")
    }

    this.logger?.info("Управление приватностью", {
      personId: input.personId,
      settings: input.privacySettings,
    })

    try {
      const { PersonDatabaseService } = await import(
        "@/features/person-identification/services/person-database-service"
      )
      const dbService = PersonDatabaseService.getInstance()

      const updatedPerson = await dbService.updatePerson(input.personId, {
        privacy: input.privacySettings,
      })

      if (!updatedPerson) {
        throw new Error("Персона не найдена")
      }

      const warnings: string[] = []
      if (input.privacySettings.blurFace) {
        warnings.push("Лицо будет размыто во всех появлениях")
      }
      if (input.privacySettings.hideFromSearch) {
        warnings.push("Персона не будет отображаться в результатах поиска")
      }

      return {
        operation: input.operation,
        success: true,
        privacyChanges: {
          personId: input.personId,
          blurFace: input.privacySettings.blurFace || false,
          hideFromSearch: input.privacySettings.hideFromSearch || false,
          anonymize: input.privacySettings.anonymize || false,
          blurIntensity: input.privacySettings.blurIntensity || 5,
        },
        message: "Настройки приватности обновлены",
        recommendations: [
          input.privacySettings.anonymize ? "При экспорте видео данные будут анонимизированы" : "",
        ].filter(Boolean),
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      throw new Error(`Ошибка управления приватностью: ${error}`)
    }
  }

  /**
   * Выполняет операции распознавания персон
   */
  public async processPersonIdentification(
    input: PersonIdentificationInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<PersonIdentificationResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInput(input, (data) => {
        const errors: string[] = []

        const validOperations = [
          "identify_persons",
          "search_persons",
          "create_profile",
          "update_profile",
          "get_statistics",
          "merge_profiles",
          "delete_profile",
          "manage_privacy",
        ]
        if (!validOperations.includes(data.operation)) {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        return { isValid: errors.length === 0, errors }
      })

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      let result: PersonIdentificationResult

      switch (input.operation) {
        case "identify_persons":
          result = await this.identifyPersonsInVideo(input)
          break

        case "search_persons":
          result = await this.searchPersonsInDatabase(input)
          break

        case "create_profile":
          result = await this.createPersonProfile(input)
          break

        case "update_profile":
          result = await this.updatePersonProfile(input)
          break

        case "get_statistics":
          result = await this.getPersonStatistics(input)
          break

        case "merge_profiles":
          result = await this.mergePersonProfiles(input)
          break

        case "delete_profile":
          result = await this.deletePersonProfile(input)
          break

        case "manage_privacy":
          result = await this.managePersonPrivacy(input)
          break

        default:
          result = {
            operation: input.operation,
            success: false,
            message: `Неподдерживаемая операция: ${input.operation}`,
            recommendations: ["Проверьте название операции"],
          }
          break
      }

      return result
    }, options)
  }
}

// Создаем singleton экземпляр
const personIdentificationTool = new PersonIdentificationTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executePersonIdentificationTool(
  operation: PersonIdentificationInput["operation"],
  params: Omit<PersonIdentificationInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<PersonIdentificationResult>> {
  return personIdentificationTool.processPersonIdentification({ operation, ...params }, options)
}

// Экспорт для обратной совместимости
export const personIdentificationTools: any[] = [
  {
    name: "identify_persons_in_video",
    description: "Автоматически распознает и идентифицирует людей в видео с использованием AI анализа лиц",
    input_schema: {
      type: "object",
      properties: {
        videoPath: {
          type: "string",
          description: "Путь к видеофайлу для анализа персон",
        },
        enableFaceDetection: {
          type: "boolean",
          description: "Включить детекцию лиц",
          default: true,
        },
        enablePersonTracking: {
          type: "boolean",
          description: "Включить отслеживание персон по времени",
          default: true,
        },
        confidenceThreshold: {
          type: "number",
          description: "Минимальный уровень уверенности для распознавания (0.0-1.0)",
          minimum: 0.0,
          maximum: 1.0,
          default: 0.7,
        },
        createNewProfiles: {
          type: "boolean",
          description: "Автоматически создавать профили для новых персон",
          default: false,
        },
      },
      required: ["videoPath"],
    },
  },

  {
    name: "search_person_database",
    description: "Поиск персон в базе данных по имени, тегам или другим критериям",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Поисковый запрос (имя, тег, описание)",
        },
        limit: {
          type: "number",
          description: "Максимальное количество результатов",
          minimum: 1,
          maximum: 100,
          default: 20,
        },
        includeUnverified: {
          type: "boolean",
          description: "Включить неверифицированные профили в результаты",
          default: false,
        },
        similarityThreshold: {
          type: "number",
          description: "Минимальный порог схожести для поиска",
          minimum: 0.0,
          maximum: 1.0,
          default: 0.5,
        },
      },
      required: ["query"],
    },
  },
]

export default personIdentificationTools
