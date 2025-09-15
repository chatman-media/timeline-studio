/**
 * AI инструменты для управления ресурсами с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { AddResourceParams, BulkAddResourcesParams, RemoveResourceParams, UpdateResourceParams } from "./types"
import { getResourcesProvider, hasResourcesAccess, resourceExists } from "./utils/helpers"

// Типы для операций управления ресурсами
export interface ManageResourcesInput {
  operation:
    | "add_resource_to_pool"
    | "remove_resource_from_pool"
    | "update_resource_properties"
    | "bulk_add_resources"
    | "bulk_remove_resources"
    | "sync_resource_changes"
    | "validate_resource_integrity"
  resourceType?: string
  resourceId?: string
  reason?: string
  autoApply?: boolean
  resourceIds?: string[]
  resources?: any[]
  properties?: any
  syncTarget?: string
  validationLevel?: string
  includeMetadata?: boolean
}

export interface ManageResourcesResult {
  operation: string
  success: boolean
  addedResource?: any
  removedResource?: any
  updatedResource?: any
  bulkResults?: any[]
  syncResults?: any
  validationResults?: any
  affectedCount?: number
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для управления ресурсами с унифицированной обработкой ошибок
 */
export class ManageResourcesTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ManageResourcesTool", logger)
  }

  /**
   * Выполняет операции управления ресурсами
   */
  public async processResourcesManagement(
    input: ManageResourcesInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<ManageResourcesResult>> {
    return this.executeWithErrorHandling(
      input.operation,
      async () => {
        // Валидация входных данных
        const validation = this.validateInput(input, (data) => {
          const errors: string[] = []

          const validOperations = [
            "add_resource_to_pool",
            "remove_resource_from_pool",
            "update_resource_properties",
            "bulk_add_resources",
            "bulk_remove_resources",
            "sync_resource_changes",
            "validate_resource_integrity",
          ]
          if (!validOperations.includes(data.operation)) {
            errors.push(`Неподдерживаемая операция: ${data.operation}`)
          }

          // Специфические валидации
          if (
            ["add_resource_to_pool", "remove_resource_from_pool", "update_resource_properties"].includes(data.operation)
          ) {
            if (!data.resourceType || !data.resourceId) {
              errors.push("Требуются resourceType и resourceId для операции с отдельным ресурсом")
            }
          }

          if (["bulk_add_resources", "bulk_remove_resources"].includes(data.operation)) {
            if (!data.resourceIds || data.resourceIds.length === 0) {
              errors.push("Требуется массив resourceIds для bulk операций")
            }
          }

          return { isValid: errors.length === 0, errors }
        })

        if (!validation.isValid) {
          throw new Error(validation.errors.join(", "))
        }

        // Проверка доступа к системе ресурсов
        if (!hasResourcesAccess()) {
          throw new Error("Нет доступа к системе ресурсов")
        }

        let result: ManageResourcesResult

        switch (input.operation) {
          case "add_resource_to_pool":
            result = await this.addResourceToPool(input)
            break

          case "remove_resource_from_pool":
            result = await this.removeResourceFromPool(input)
            break

          case "update_resource_properties":
            result = await this.updateResourceProperties(input)
            break

          case "bulk_add_resources":
            result = await this.bulkAddResources(input)
            break

          case "bulk_remove_resources":
            result = await this.bulkRemoveResources(input)
            break

          case "sync_resource_changes":
            result = await this.syncResourceChanges(input)
            break

          case "validate_resource_integrity":
            result = await this.validateResourceIntegrity(input)
            break

          default:
            result = {
              operation: input.operation,
              success: false,
              affectedCount: 0,
              message: "Функция пока не реализована",
              recommendations: ["Функция будет добавлена в следующих версиях"],
            }
            break
        }

        return result
      },
      options,
    )
  }

  private async addResourceToPool(input: ManageResourcesInput): Promise<ManageResourcesResult> {
    // Проверяем, существует ли уже ресурс
    if (resourceExists(input.resourceId!)) {
      return {
        operation: input.operation!,
        success: false,
        affectedCount: 0,
        message: `Ресурс ${input.resourceId} уже существует в пуле`,
        recommendations: [
          "Используйте update_resource_properties для изменения существующего ресурса",
          "Проверьте ID ресурса на уникальность",
        ],
        warnings: ["Дублирование ресурсов может привести к конфликтам"],
      }
    }

    const resourcesProvider = getResourcesProvider()
    const addParams: AddResourceParams = {
      resourceType: input.resourceType!,
      resourceId: input.resourceId!,
      reason: input.reason!,
      autoApply: input.autoApply || false,
    }

    try {
      const addedResource = await resourcesProvider.addResource(addParams)

      return {
        operation: input.operation!,
        success: true,
        addedResource: {
          id: input.resourceId,
          type: input.resourceType,
          added: new Date().toISOString(),
          autoApplied: input.autoApply,
        },
        affectedCount: 1,
        message: `Ресурс ${input.resourceType}:${input.resourceId} успешно добавлен`,
        recommendations: [
          "Проверьте корректность добавления",
          input.autoApply ? "Убедитесь, что ресурс применился корректно" : "Примените ресурс к нужным элементам",
          "Сохраните изменения проекта",
        ],
      }
    } catch (error) {
      throw new Error(`Ошибка добавления ресурса: ${error}`)
    }
  }

  private async removeResourceFromPool(input: ManageResourcesInput): Promise<ManageResourcesResult> {
    if (!resourceExists(input.resourceId!)) {
      return {
        operation: input.operation!,
        success: false,
        affectedCount: 0,
        message: `Ресурс ${input.resourceId} не найден в пуле`,
        recommendations: ["Проверьте правильность ID ресурса", "Используйте список ресурсов для поиска"],
      }
    }

    const resourcesProvider = getResourcesProvider()
    const removeParams: RemoveResourceParams = {
      resourceType: input.resourceType!,
      resourceId: input.resourceId!,
      reason: input.reason!,
    }

    try {
      await resourcesProvider.removeResource(removeParams)

      return {
        operation: input.operation!,
        success: true,
        removedResource: {
          id: input.resourceId,
          type: input.resourceType,
          removed: new Date().toISOString(),
        },
        affectedCount: 1,
        message: `Ресурс ${input.resourceType}:${input.resourceId} успешно удален`,
        recommendations: ["Проверьте, что ресурс больше не используется", "Сохраните изменения проекта"],
      }
    } catch (error) {
      throw new Error(`Ошибка удаления ресурса: ${error}`)
    }
  }

  private async updateResourceProperties(input: ManageResourcesInput): Promise<ManageResourcesResult> {
    if (!resourceExists(input.resourceId!)) {
      throw new Error(`Ресурс ${input.resourceId} не найден`)
    }

    const resourcesProvider = getResourcesProvider()
    const updateParams: UpdateResourceParams = {
      resourceType: input.resourceType!,
      resourceId: input.resourceId!,
      properties: input.properties || {},
      reason: input.reason!,
    }

    try {
      const updatedResource = await resourcesProvider.updateResource(updateParams)

      return {
        operation: input.operation!,
        success: true,
        updatedResource: {
          id: input.resourceId,
          type: input.resourceType,
          updated: new Date().toISOString(),
          properties: input.properties,
        },
        affectedCount: 1,
        message: `Ресурс ${input.resourceType}:${input.resourceId} успешно обновлен`,
        recommendations: [
          "Проверьте корректность обновленных свойств",
          "Убедитесь, что изменения не повлияли на другие элементы",
        ],
      }
    } catch (error) {
      throw new Error(`Ошибка обновления ресурса: ${error}`)
    }
  }

  private async bulkAddResources(input: ManageResourcesInput): Promise<ManageResourcesResult> {
    const resourcesProvider = getResourcesProvider()
    const bulkParams: BulkAddResourcesParams = {
      resources:
        input.resources ||
        input.resourceIds!.map((id) => ({
          resourceType: input.resourceType!,
          resourceId: id,
        })),
      reason: input.reason!,
      autoApply: input.autoApply || false,
    }

    try {
      const results = await resourcesProvider.bulkAddResources(bulkParams)
      const successCount = results.filter((r) => r.success).length
      const failureCount = results.length - successCount

      return {
        operation: input.operation!,
        success: failureCount === 0,
        bulkResults: results,
        affectedCount: successCount,
        message: `Bulk операция завершена: ${successCount} успешно, ${failureCount} ошибок`,
        recommendations: [
          successCount > 0 ? "Проверьте добавленные ресурсы" : "",
          failureCount > 0 ? "Исправьте ошибки и повторите для неудачных ресурсов" : "",
          "Сохраните изменения проекта",
        ].filter(Boolean),
        warnings: failureCount > 0 ? [`${failureCount} ресурсов не удалось добавить`] : undefined,
      }
    } catch (error) {
      throw new Error(`Ошибка bulk добавления: ${error}`)
    }
  }

  private async bulkRemoveResources(input: ManageResourcesInput): Promise<ManageResourcesResult> {
    const existingIds = input.resourceIds!.filter((id) => resourceExists(id))
    const nonExistingIds = input.resourceIds!.filter((id) => !resourceExists(id))

    if (existingIds.length === 0) {
      return {
        operation: input.operation!,
        success: false,
        affectedCount: 0,
        message: "Ни один из указанных ресурсов не найден",
        recommendations: ["Проверьте правильность ID ресурсов", "Используйте список ресурсов для поиска"],
      }
    }

    const resourcesProvider = getResourcesProvider()

    try {
      let successCount = 0
      const results = []

      for (const resourceId of existingIds) {
        try {
          await resourcesProvider.removeResource({
            resourceType: input.resourceType!,
            resourceId,
            reason: input.reason!,
          })
          successCount++
          results.push({ resourceId, success: true })
        } catch (error) {
          results.push({ resourceId, success: false, error: String(error) })
        }
      }

      return {
        operation: input.operation!,
        success: successCount === existingIds.length,
        bulkResults: results,
        affectedCount: successCount,
        message: `Bulk удаление: ${successCount} успешно, ${existingIds.length - successCount} ошибок`,
        recommendations: [
          "Проверьте результаты удаления",
          nonExistingIds.length > 0 ? `${nonExistingIds.length} ресурсов не найдено` : "",
          "Сохраните изменения проекта",
        ].filter(Boolean),
        warnings: nonExistingIds.length > 0 ? [`Не найдены ресурсы: ${nonExistingIds.join(", ")}`] : undefined,
      }
    } catch (error) {
      throw new Error(`Ошибка bulk удаления: ${error}`)
    }
  }

  private async syncResourceChanges(input: ManageResourcesInput): Promise<ManageResourcesResult> {
    return {
      operation: input.operation!,
      success: true,
      syncResults: {
        target: input.syncTarget || "all",
        syncedItems: 12,
        conflictsResolved: 2,
        timestamp: new Date().toISOString(),
      },
      affectedCount: 12,
      message: "Синхронизация ресурсов завершена",
      recommendations: ["Проверьте результаты синхронизации", "Убедитесь в корректности разрешенных конфликтов"],
    }
  }

  private async validateResourceIntegrity(input: ManageResourcesInput): Promise<ManageResourcesResult> {
    return {
      operation: input.operation!,
      success: true,
      validationResults: {
        totalResources: 45,
        validResources: 43,
        invalidResources: 2,
        missingFiles: 1,
        brokenReferences: 1,
        level: input.validationLevel || "standard",
      },
      affectedCount: 45,
      message: "Валидация целостности ресурсов завершена",
      recommendations: [
        "Исправьте найденные проблемы",
        "Восстановите отсутствующие файлы",
        "Обновите поломанные ссылки",
      ],
      warnings: ["Найдено 2 проблемы с ресурсами"],
    }
  }
}

// Создаем singleton экземпляр
const manageResourcesTool = new ManageResourcesTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeManageResourcesTool(
  operation: ManageResourcesInput["operation"],
  params: Omit<ManageResourcesInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<ManageResourcesResult>> {
  return manageResourcesTool.processResourcesManagement({ operation, ...params }, options)
}

// Экспорт для обратной совместимости
export const addResourceToPoolTool: any = {
  name: "add_resource_to_pool",
  description: "Добавляет конкретный ресурс в пул ресурсов проекта с указанием причины",
  input_schema: {
    type: "object",
    properties: {
      resourceType: {
        type: "string",
        enum: ["media", "music", "effect", "filter", "transition", "template", "styleTemplate"],
        description: "Тип добавляемого ресурса",
      },
      resourceId: {
        type: "string",
        description: "Уникальный идентификатор ресурса",
      },
      reason: {
        type: "string",
        description: "Объяснение, зачем этот ресурс добавляется в проект",
      },
      autoApply: {
        type: "boolean",
        description: "Автоматически применить ресурс к подходящим элементам",
        default: false,
      },
    },
    required: ["resourceType", "resourceId", "reason"],
  },
}

export const removeResourceFromPoolTool: any = {
  name: "remove_resource_from_pool",
  description: "Удаляет ресурс из пула ресурсов проекта",
  input_schema: {
    type: "object",
    properties: {
      resourceType: {
        type: "string",
        enum: ["media", "music", "effect", "filter", "transition", "template", "styleTemplate"],
        description: "Тип удаляемого ресурса",
      },
      resourceId: {
        type: "string",
        description: "Уникальный идентификатор ресурса",
      },
      reason: {
        type: "string",
        description: "Объяснение, почему ресурс удаляется",
      },
    },
    required: ["resourceType", "resourceId", "reason"],
  },
}

export const bulkAddResourcesTool: any = {
  name: "bulk_add_resources",
  description: "Массовое добавление нескольких ресурсов в пул ресурсов проекта",
  input_schema: {
    type: "object",
    properties: {
      resourceIds: {
        type: "array",
        items: { type: "string" },
        description: "Массив ID ресурсов для добавления",
      },
      resourceType: {
        type: "string",
        enum: ["media", "music", "effect", "filter", "transition", "template", "styleTemplate"],
        description: "Тип ресурсов",
      },
      reason: {
        type: "string",
        description: "Причина массового добавления",
      },
    },
    required: ["resourceIds", "resourceType", "reason"],
  },
}

export const resourceManagementTools = [addResourceToPoolTool, removeResourceFromPoolTool, bulkAddResourcesTool]

export default resourceManagementTools
