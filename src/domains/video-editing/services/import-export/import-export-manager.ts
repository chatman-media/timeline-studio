/**
 * Import/Export Manager
 *
 * Централизованный менеджер для импорта и экспорта Timeline в различные форматы
 */

import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"

import { Timeline } from "../../types"
import { AAFExporter } from "./exporters/aaf-exporter"
import { EDLExporter } from "./exporters/edl-exporter"
import { FCPXMLExporter } from "./exporters/fcpxml-exporter"
import { AAFImporter } from "./importers/aaf-importer"
import { EDLImporter } from "./importers/edl-importer"
import { FCPXMLImporter } from "./importers/fcpxml-importer"
import type {
  Exporter,
  ExportFormat,
  ExportOptions,
  Importer,
  ImportFormat,
  ImportOptions,
  ImportResult,
} from "./types"

export class ImportExportManager {
  private importers = new Map<ImportFormat, Importer>()
  private exporters = new Map<ExportFormat, Exporter>()

  constructor() {
    // Регистрируем импортеры
    this.registerImporter("edl", new EDLImporter())
    this.registerImporter("fcpxml", new FCPXMLImporter())
    this.registerImporter("aaf", new AAFImporter())

    // Регистрируем экспортеры
    this.registerExporter("edl", new EDLExporter())
    this.registerExporter("fcpxml", new FCPXMLExporter())
    this.registerExporter("aaf", new AAFExporter())
  }

  /**
   * Регистрирует новый импортер
   */
  registerImporter(format: ImportFormat, importer: Importer): void {
    this.importers.set(format, importer)
  }

  /**
   * Регистрирует новый экспортер
   */
  registerExporter(format: ExportFormat, exporter: Exporter): void {
    this.exporters.set(format, exporter)
  }

  /**
   * Импортирует проект из строки
   */
  async import(content: string, options: ImportOptions): Promise<ImportResult> {
    const importer = this.importers.get(options.format)

    if (!importer) {
      return {
        success: false,
        errors: [
          {
            message: `Unsupported import format: ${options.format}`,
            code: "UNSUPPORTED_FORMAT",
          },
        ],
        warnings: [],
        mediaFiles: [],
      }
    }

    return importer.import(content, options)
  }

  /**
   * Импортирует проект из файла
   */
  async importFromFile(filePath: string, options?: Partial<ImportOptions>): Promise<ImportResult> {
    // Определяем формат по расширению файла
    const format = this.detectFormatFromPath(filePath) as ImportFormat

    if (!format) {
      return {
        success: false,
        errors: [
          {
            message: `Cannot detect format from file: ${filePath}`,
            code: "UNKNOWN_FORMAT",
          },
        ],
        warnings: [],
        mediaFiles: [],
      }
    }

    try {
      // Читаем файл через Tauri fs plugin
      const content = await readTextFile(filePath)

      const importOptions: ImportOptions = {
        format,
        ...options,
      }

      return await this.import(content, importOptions)
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            message: error instanceof Error ? error.message : "Failed to read file",
            code: "FILE_READ_ERROR",
          },
        ],
        warnings: [],
        mediaFiles: [],
      }
    }
  }

  /**
   * Экспортирует проект в строку
   */
  async export(project: Timeline, options: ExportOptions): Promise<string> {
    const exporter = this.exporters.get(options.format)

    if (!exporter) {
      throw new Error(`Unsupported export format: ${options.format}`)
    }

    return exporter.export(project, options)
  }

  /**
   * Экспортирует проект в файл
   */
  async exportToFile(project: Timeline, filePath: string, options?: Partial<ExportOptions>): Promise<void> {
    // Определяем формат по расширению файла или используем указанный
    const format = options?.format || (this.detectFormatFromPath(filePath) as ExportFormat)

    if (!format) {
      throw new Error(`Cannot detect format from file: ${filePath}`)
    }

    const exporter = this.exporters.get(format)

    if (!exporter) {
      throw new Error(`Unsupported export format: ${format}`)
    }

    const exportOptions: ExportOptions = {
      format,
      includeDisabledClips: false,
      includeEffects: true,
      includeTransitions: true,
      includeMarkers: true,
      ...options,
    }

    const content = await this.export(project, exportOptions)

    // Записываем файл через Tauri fs plugin
    await writeTextFile(filePath, content)
  }

  /**
   * Возвращает поддерживаемые форматы импорта
   */
  getSupportedImportFormats(): ImportFormat[] {
    return Array.from(this.importers.keys())
  }

  /**
   * Возвращает поддерживаемые форматы экспорта
   */
  getSupportedExportFormats(): ExportFormat[] {
    return Array.from(this.exporters.keys())
  }

  /**
   * Возвращает расширение файла для формата
   */
  getFileExtension(format: ExportFormat): string {
    const exporter = this.exporters.get(format)
    return exporter?.getFileExtension() || `.${format}`
  }

  /**
   * Возвращает MIME тип для формата
   */
  getMimeType(format: ExportFormat): string {
    const exporter = this.exporters.get(format)
    return exporter?.getMimeType() || "application/octet-stream"
  }

  /**
   * Определяет формат по пути к файлу
   */
  private detectFormatFromPath(filePath: string): string | null {
    const extension = filePath.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "edl":
        return "edl"
      case "fcpxml":
      case "xml": // Final Cut Pro XML
        return "fcpxml"
      case "aaf":
        return "aaf"
      case "json":
        return "json"
      default:
        return null
    }
  }
}

// Singleton экземпляр
export const importExportManager = new ImportExportManager()
