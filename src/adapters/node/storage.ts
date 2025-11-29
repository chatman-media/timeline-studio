/**
 * Node.js Storage Adapter
 *
 * Реализация IStorageService для Node.js.
 * Использует JSON файл для хранения данных.
 */

import fs from "node:fs"
import path from "node:path"

import type { IStorageService } from "@/core/ports"

export interface NodeStorageOptions {
  /** Путь к файлу хранилища */
  filePath?: string
  /** Директория для хранилища (по умолчанию ~/.timeline-studio) */
  configDir?: string
  /** Имя файла (по умолчанию settings.json) */
  fileName?: string
}

export class NodeStorageService implements IStorageService {
  private data: Record<string, unknown> = {}
  private filePath: string
  private initialized = false

  constructor(options: NodeStorageOptions = {}) {
    if (options.filePath) {
      this.filePath = options.filePath
    } else {
      const configDir = options.configDir || path.join(process.env.HOME || "~", ".timeline-studio")
      const fileName = options.fileName || "settings.json"
      this.filePath = path.join(configDir, fileName)
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return

    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const content = fs.readFileSync(this.filePath, "utf-8")
        this.data = JSON.parse(content)
      } catch {
        this.data = {}
      }
    }

    this.initialized = true
  }

  private async save(): Promise<void> {
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8")
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ensureInitialized()
    return (this.data[key] as T) ?? null
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.ensureInitialized()
    this.data[key] = value
    await this.save()
  }

  async delete(key: string): Promise<void> {
    await this.ensureInitialized()
    delete this.data[key]
    await this.save()
  }

  async has(key: string): Promise<boolean> {
    await this.ensureInitialized()
    return key in this.data
  }

  async clear(): Promise<void> {
    this.data = {}
    await this.save()
  }

  async keys(): Promise<string[]> {
    await this.ensureInitialized()
    return Object.keys(this.data)
  }

  async entries(): Promise<Array<[string, unknown]>> {
    await this.ensureInitialized()
    return Object.entries(this.data)
  }
}
