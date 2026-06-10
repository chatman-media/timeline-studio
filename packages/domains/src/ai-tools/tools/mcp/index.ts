/**
 * MCP Tools - адаптеры для Model Context Protocol инструментов
 *
 * Эти инструменты являются адаптерами IAITool для 18 MCP tools из Rust backend.
 * Они позволяют использовать MCP через существующий AI Chat интерфейс.
 */

import {
  type AIToolExecutionOptions,
  type AIToolLogger,
  type AIToolMetadata,
  type AIToolResult,
  BaseAITool,
} from "../../base"
import { mcpExecuteTool } from "../../tauri/ai-tools-commands"

/**
 * Базовый класс для всех MCP инструментов
 */
abstract class BaseMCPTool extends BaseAITool {
  protected abstract mcpToolName: string

  constructor(logger?: AIToolLogger) {
    super(undefined, logger)
  }

  async execute(input: any, _options?: AIToolExecutionOptions): Promise<AIToolResult> {
    const executionId = `${this.mcpToolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    try {
      this.logger?.info(`Executing MCP tool: ${this.mcpToolName}`, { input })

      // Вызов MCP tool через Tauri
      const result = await mcpExecuteTool({
        tool_name: this.mcpToolName,
        arguments: input,
      })

      const executionTime = Date.now() - startTime

      if (result.success) {
        return {
          success: true,
          executionId,
          toolName: this.mcpToolName,
          executionTime,
          data: result.data,
          metadata: {
            mcpTool: this.mcpToolName,
            timestamp: Date.now(),
          },
        }
      }

      return {
        success: false,
        executionId,
        toolName: this.mcpToolName,
        executionTime,
        errors: [result.error || "MCP tool execution failed"],
        metadata: {
          mcpTool: this.mcpToolName,
          timestamp: Date.now(),
        },
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.logger?.error(`MCP tool ${this.mcpToolName} failed`, { error })
      return {
        success: false,
        executionId,
        toolName: this.mcpToolName,
        executionTime,
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          mcpTool: this.mcpToolName,
          timestamp: Date.now(),
        },
      }
    }
  }

  validate(input: any): boolean {
    // Базовая валидация - проверяем что input это объект
    return typeof input === "object" && input !== null
  }

  abstract getSchema(): { input: any; output: any }
}

// ==================== ANALYSIS TOOLS ====================

/**
 * Анализ видео: качество, метаданные, контент
 */
export class MCPAnalyzeVideoTool extends BaseMCPTool {
  protected mcpToolName = "analyze_video"

  metadata: AIToolMetadata = {
    name: "mcp-analyze-video",
    displayName: "MCP: Анализ видео",
    description: "Проанализировать видео файл: качество, метаданные, контент (через MCP)",
    domain: "analysis",
    category: "video-analysis",
    tags: ["mcp", "video", "analysis", "quality"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["video_path"],
        properties: {
          video_path: {
            type: "string",
            description: "Путь к видео файлу",
          },
          analysis_type: {
            type: "string",
            enum: ["quick", "balanced", "quality"],
            description: "Тип анализа",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          analysis_result: { type: "object" },
        },
      },
    }
  }
}

/**
 * Обнаружение сцен в видео
 */
export class MCPDetectScenesTool extends BaseMCPTool {
  protected mcpToolName = "detect_scenes"

  metadata: AIToolMetadata = {
    name: "mcp-detect-scenes",
    displayName: "MCP: Обнаружение сцен",
    description: "Обнаружить сцены в видео с анализом качества каждой сцены (через MCP)",
    domain: "analysis",
    category: "video-analysis",
    tags: ["mcp", "video", "scenes", "detection"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["video_path"],
        properties: {
          video_path: {
            type: "string",
            description: "Путь к видео файлу",
          },
          min_scene_duration: {
            type: "number",
            description: "Минимальная длительность сцены в секундах",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          scenes_count: { type: "number" },
          scenes: { type: "array" },
        },
      },
    }
  }
}

/**
 * Поиск ключевых моментов в видео
 */
export class MCPDetectMomentsTool extends BaseMCPTool {
  protected mcpToolName = "detect_moments"

  metadata: AIToolMetadata = {
    name: "mcp-detect-moments",
    displayName: "MCP: Поиск ключевых моментов",
    description: "Найти ключевые моменты в видео (динамичные сцены, эмоции, интересные кадры) (через MCP)",
    domain: "analysis",
    category: "video-analysis",
    tags: ["mcp", "video", "moments", "highlights"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["video_path"],
        properties: {
          video_path: {
            type: "string",
            description: "Путь к видео файлу",
          },
          max_moments: {
            type: "number",
            description: "Максимальное количество моментов",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          moments_count: { type: "number" },
          moments: { type: "array" },
        },
      },
    }
  }
}

/**
 * Анализ аудио дорожки
 */
export class MCPAnalyzeAudioTool extends BaseMCPTool {
  protected mcpToolName = "analyze_audio"

  metadata: AIToolMetadata = {
    name: "mcp-analyze-audio",
    displayName: "MCP: Анализ аудио",
    description: "Проанализировать аудио: уровень громкости, тишина, речь, музыка (через MCP)",
    domain: "analysis",
    category: "audio-analysis",
    tags: ["mcp", "audio", "analysis", "volume"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["video_path"],
        properties: {
          video_path: {
            type: "string",
            description: "Путь к видео файлу",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          audio_analysis: { type: "object" },
        },
      },
    }
  }
}

// ==================== TIMELINE TOOLS ====================

/**
 * Создать новый timeline проект
 */
export class MCPCreateTimelineTool extends BaseMCPTool {
  protected mcpToolName = "create_timeline"

  metadata: AIToolMetadata = {
    name: "mcp-create-timeline",
    displayName: "MCP: Создать Timeline",
    description: "Создать новый timeline проект с настройками (через MCP)",
    domain: "core",
    category: "timeline",
    tags: ["mcp", "timeline", "project", "create"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
            description: "Название проекта",
          },
          resolution: {
            type: "object",
            properties: {
              width: { type: "number" },
              height: { type: "number" },
            },
          },
          fps: {
            type: "number",
            description: "Частота кадров",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          timeline_info: { type: "object" },
        },
      },
    }
  }
}

/**
 * Добавить клип на timeline
 */
export class MCPAddClipTool extends BaseMCPTool {
  protected mcpToolName = "add_clip"

  metadata: AIToolMetadata = {
    name: "mcp-add-clip",
    displayName: "MCP: Добавить клип",
    description: "Добавить видео клип на timeline (через MCP)",
    domain: "core",
    category: "timeline",
    tags: ["mcp", "timeline", "clip", "add"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["track_id", "media_id", "time"],
        properties: {
          track_id: {
            type: "string",
            description: "ID трека",
          },
          media_id: {
            type: "string",
            description: "ID медиа файла",
          },
          time: {
            type: "number",
            description: "Время начала на timeline (секунды)",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          clip_id: { type: "string" },
        },
      },
    }
  }
}

/**
 * Удалить клип с timeline
 */
export class MCPRemoveClipTool extends BaseMCPTool {
  protected mcpToolName = "remove_clip"

  metadata: AIToolMetadata = {
    name: "mcp-remove-clip",
    displayName: "MCP: Удалить клип",
    description: "Удалить клип с timeline (через MCP)",
    domain: "core",
    category: "timeline",
    tags: ["mcp", "timeline", "clip", "remove"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["clip_id"],
        properties: {
          clip_id: {
            type: "string",
            description: "ID клипа для удаления",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
      },
    }
  }
}

/**
 * Переместить клип на timeline
 */
export class MCPMoveClipTool extends BaseMCPTool {
  protected mcpToolName = "move_clip"

  metadata: AIToolMetadata = {
    name: "mcp-move-clip",
    displayName: "MCP: Переместить клип",
    description: "Переместить клип на timeline (через MCP)",
    domain: "core",
    category: "timeline",
    tags: ["mcp", "timeline", "clip", "move"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["clip_id", "new_track_id", "new_time"],
        properties: {
          clip_id: {
            type: "string",
            description: "ID клипа",
          },
          new_track_id: {
            type: "string",
            description: "Новый ID трека",
          },
          new_time: {
            type: "number",
            description: "Новое время начала (секунды)",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
      },
    }
  }
}

/**
 * Разделить клип
 */
export class MCPSplitClipTool extends BaseMCPTool {
  protected mcpToolName = "split_clip"

  metadata: AIToolMetadata = {
    name: "mcp-split-clip",
    displayName: "MCP: Разделить клип",
    description: "Разделить клип на две части в указанной точке (через MCP)",
    domain: "core",
    category: "timeline",
    tags: ["mcp", "timeline", "clip", "split"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["clip_id", "time"],
        properties: {
          clip_id: {
            type: "string",
            description: "ID клипа",
          },
          time: {
            type: "number",
            description: "Время разделения внутри клипа (секунды)",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          clip_ids: { type: "array" },
        },
      },
    }
  }
}

// ==================== EFFECTS TOOLS ====================

/**
 * Применить фильтр к клипу
 */
export class MCPApplyFilterTool extends BaseMCPTool {
  protected mcpToolName = "apply_filter"

  metadata: AIToolMetadata = {
    name: "mcp-apply-filter",
    displayName: "MCP: Применить фильтр",
    description: "Применить фильтр к клипу (blur, grayscale, sharpen, etc.) (через MCP)",
    domain: "automation",
    category: "workflow-automation",
    tags: ["mcp", "filter", "effects"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["clip_id", "filter_type"],
        properties: {
          clip_id: {
            type: "string",
            description: "ID клипа",
          },
          filter_type: {
            type: "string",
            enum: ["blur", "grayscale", "sharpen", "vignette", "sepia"],
            description: "Тип фильтра",
          },
          intensity: {
            type: "number",
            description: "Интенсивность эффекта (0.0 - 1.0)",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
      },
    }
  }
}

/**
 * Добавить переход между клипами
 */
export class MCPAddTransitionTool extends BaseMCPTool {
  protected mcpToolName = "add_transition"

  metadata: AIToolMetadata = {
    name: "mcp-add-transition",
    displayName: "MCP: Добавить переход",
    description: "Добавить переход между клипами (через MCP)",
    domain: "automation",
    category: "workflow-automation",
    tags: ["mcp", "transition", "effects"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["clip_id_from", "clip_id_to", "transition_type"],
        properties: {
          clip_id_from: {
            type: "string",
            description: "ID первого клипа",
          },
          clip_id_to: {
            type: "string",
            description: "ID второго клипа",
          },
          transition_type: {
            type: "string",
            enum: ["fade", "dissolve", "wipe", "slide"],
            description: "Тип перехода",
          },
          duration: {
            type: "number",
            description: "Длительность перехода (секунды)",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
      },
    }
  }
}

/**
 * Применить цветокоррекцию
 */
export class MCPApplyColorGradingTool extends BaseMCPTool {
  protected mcpToolName = "apply_color_grading"

  metadata: AIToolMetadata = {
    name: "mcp-apply-color-grading",
    displayName: "MCP: Цветокоррекция",
    description: "Применить цветокоррекцию к клипу (через MCP)",
    domain: "automation",
    category: "workflow-automation",
    tags: ["mcp", "color", "grading"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["clip_id"],
        properties: {
          clip_id: {
            type: "string",
            description: "ID клипа",
          },
          brightness: {
            type: "number",
            description: "Яркость (-1.0 to 1.0)",
          },
          contrast: {
            type: "number",
            description: "Контраст (-1.0 to 1.0)",
          },
          saturation: {
            type: "number",
            description: "Насыщенность (-1.0 to 1.0)",
          },
          temperature: {
            type: "number",
            description: "Температура цвета (-1.0 to 1.0)",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
      },
    }
  }
}

/**
 * Добавить текстовый оверлей
 */
export class MCPAddTextOverlayTool extends BaseMCPTool {
  protected mcpToolName = "add_text_overlay"

  metadata: AIToolMetadata = {
    name: "mcp-add-text-overlay",
    displayName: "MCP: Текстовый оверлей",
    description: "Добавить текстовый оверлей на клип (через MCP)",
    domain: "automation",
    category: "workflow-automation",
    tags: ["mcp", "text", "overlay"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["clip_id", "text"],
        properties: {
          clip_id: {
            type: "string",
            description: "ID клипа",
          },
          text: {
            type: "string",
            description: "Текст для отображения",
          },
          position: {
            type: "string",
            enum: ["top", "center", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"],
            description: "Позиция текста",
          },
          font_size: {
            type: "number",
            description: "Размер шрифта",
          },
          color: {
            type: "string",
            description: "Цвет текста (hex, например #FFFFFF)",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
      },
    }
  }
}

// ==================== EXPORT TOOLS ====================

/**
 * Экспортировать видео
 */
export class MCPExportVideoTool extends BaseMCPTool {
  protected mcpToolName = "export_video"

  metadata: AIToolMetadata = {
    name: "mcp-export-video",
    displayName: "MCP: Экспорт видео",
    description: "Экспортировать timeline в видео файл (через MCP)",
    domain: "integration",
    category: "export-tools",
    tags: ["mcp", "export", "video"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["output_path"],
        properties: {
          output_path: {
            type: "string",
            description: "Путь для сохранения видео",
          },
          quality: {
            type: "string",
            enum: ["draft", "medium", "high", "maximum"],
            description: "Качество экспорта",
          },
          format: {
            type: "string",
            enum: ["mp4", "mov", "webm"],
            description: "Формат видео",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          output_path: { type: "string" },
        },
      },
    }
  }
}

/**
 * Создать превью изображение
 */
export class MCPCreatePreviewTool extends BaseMCPTool {
  protected mcpToolName = "create_preview"

  metadata: AIToolMetadata = {
    name: "mcp-create-preview",
    displayName: "MCP: Создать превью",
    description: "Создать превью изображение из видео (через MCP)",
    domain: "integration",
    category: "export-tools",
    tags: ["mcp", "preview", "image"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        required: ["video_path", "timestamp"],
        properties: {
          video_path: {
            type: "string",
            description: "Путь к видео файлу",
          },
          timestamp: {
            type: "number",
            description: "Время кадра (секунды)",
          },
          output_path: {
            type: "string",
            description: "Путь для сохранения превью",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          preview_path: { type: "string" },
        },
      },
    }
  }
}

// ==================== PROJECT TOOLS ====================

/**
 * Получить информацию о проекте
 */
export class MCPGetProjectInfoTool extends BaseMCPTool {
  protected mcpToolName = "get_project_info"

  metadata: AIToolMetadata = {
    name: "mcp-get-project-info",
    displayName: "MCP: Информация о проекте",
    description: "Получить информацию о текущем проекте: клипы, треки, длительность (через MCP)",
    domain: "core",
    category: "timeline",
    tags: ["mcp", "project", "info"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        properties: {},
      },
      output: {
        type: "object",
        properties: {
          project_name: { type: "string" },
          timeline: { type: "object" },
          media_pool: { type: "object" },
        },
      },
    }
  }
}

/**
 * Сохранить проект
 */
export class MCPSaveProjectTool extends BaseMCPTool {
  protected mcpToolName = "save_project"

  metadata: AIToolMetadata = {
    name: "mcp-save-project",
    displayName: "MCP: Сохранить проект",
    description: "Сохранить текущий проект (через MCP)",
    domain: "core",
    category: "timeline",
    tags: ["mcp", "project", "save"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        properties: {
          project_path: {
            type: "string",
            description: "Путь для сохранения проекта (.tsp)",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
      },
    }
  }
}

/**
 * Получить список медиа файлов
 */
export class MCPListMediaFilesTool extends BaseMCPTool {
  protected mcpToolName = "list_media_files"

  metadata: AIToolMetadata = {
    name: "mcp-list-media-files",
    displayName: "MCP: Список медиа файлов",
    description: "Получить список всех медиа файлов в проекте (через MCP)",
    domain: "core",
    category: "browser",
    tags: ["mcp", "media", "files", "list"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  getSchema() {
    return {
      input: {
        type: "object",
        properties: {
          filter_type: {
            type: "string",
            enum: ["all", "video", "audio", "image"],
            description: "Фильтр по типу файлов",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          media_files: { type: "array" },
          total_count: { type: "number" },
        },
      },
    }
  }
}

// Экспортируем все MCP инструменты
export const allMCPTools = [
  // Analysis (4)
  new MCPAnalyzeVideoTool(),
  new MCPDetectScenesTool(),
  new MCPDetectMomentsTool(),
  new MCPAnalyzeAudioTool(),
  // Timeline (5)
  new MCPCreateTimelineTool(),
  new MCPAddClipTool(),
  new MCPRemoveClipTool(),
  new MCPMoveClipTool(),
  new MCPSplitClipTool(),
  // Effects (4)
  new MCPApplyFilterTool(),
  new MCPAddTransitionTool(),
  new MCPApplyColorGradingTool(),
  new MCPAddTextOverlayTool(),
  // Export (2)
  new MCPExportVideoTool(),
  new MCPCreatePreviewTool(),
  // Project (3)
  new MCPGetProjectInfoTool(),
  new MCPSaveProjectTool(),
  new MCPListMediaFilesTool(),
]
