/**
 * Менеджер Vertex Array Objects (VAO)
 * Управляет созданием и привязкой VAO для оптимизации производительности
 */

import { createLogger } from "../tauri-logger"
import { contextManager } from "./context-manager"
import type { ShaderProgram } from "./shader-pool"

const logger = createLogger("VAOManager")

/**
 * Описание атрибута вершины
 */
export interface VertexAttribute {
  name: string
  size: number // Количество компонентов (1-4)
  type: number // gl.FLOAT, gl.INT, etc.
  normalized: boolean
  stride: number // Байтов между вершинами
  offset: number // Смещение в байтах
  divisor?: number // Для instanced rendering
}

/**
 * Описание геометрии
 */
export interface GeometryDescriptor {
  attributes: VertexAttribute[]
  vertexBuffer: WebGLBuffer
  indexBuffer?: WebGLBuffer
  instanceBuffer?: WebGLBuffer
}

/**
 * VAO с метаданными
 */
interface ManagedVAO {
  vao: WebGLVertexArrayObject
  geometry: GeometryDescriptor
  program: ShaderProgram
  refCount: number
}

/**
 * Менеджер VAO
 */
export class VAOManager {
  private static instance: VAOManager | null = null
  private vaos = new Map<string, ManagedVAO>()
  private currentVAO: WebGLVertexArrayObject | null = null

  /**
   * Получить синглтон экземпляр
   */
  public static getInstance(): VAOManager {
    if (!VAOManager.instance) {
      VAOManager.instance = new VAOManager()
    }
    return VAOManager.instance
  }

  private constructor() {
    // Регистрируем обработчики событий контекста
    contextManager.on("contextLost", this.handleContextLost.bind(this))
    contextManager.on("contextRestored", this.handleContextRestored.bind(this))
  }

  /**
   * Создать или получить существующий VAO
   */
  public getVAO(name: string, geometry: GeometryDescriptor, program: ShaderProgram): WebGLVertexArrayObject | null {
    // Проверяем существующий VAO
    if (this.vaos.has(name)) {
      const managed = this.vaos.get(name)!
      managed.refCount++
      return managed.vao
    }

    // Создаем новый VAO
    const vao = this.createVAO(geometry, program)
    if (!vao) return null

    this.vaos.set(name, {
      vao,
      geometry,
      program,
      refCount: 1,
    })

    return vao
  }

  /**
   * Освободить VAO
   */
  public releaseVAO(name: string): void {
    const managed = this.vaos.get(name)
    if (!managed) return

    managed.refCount--

    // Удаляем VAO, если больше нет ссылок
    if (managed.refCount <= 0) {
      const gl = contextManager.getContext()
      if (gl) {
        gl.deleteVertexArray(managed.vao)
      }
      this.vaos.delete(name)
    }
  }

  /**
   * Привязать VAO
   */
  public bindVAO(vao: WebGLVertexArrayObject | null): void {
    const gl = contextManager.getContext()
    if (!gl) return

    if (this.currentVAO !== vao) {
      gl.bindVertexArray(vao)
      this.currentVAO = vao
    }
  }

  /**
   * Отвязать текущий VAO
   */
  public unbindVAO(): void {
    this.bindVAO(null)
  }

  /**
   * Создать стандартный квад (полноэкранный четырехугольник)
   */
  public createQuadVAO(program: ShaderProgram): WebGLVertexArrayObject | null {
    const gl = contextManager.getContext()
    if (!gl) return null

    // Создаем буфер вершин для квада
    const quadBuffer = gl.createBuffer()
    if (!quadBuffer) return null

    // Вершины и текстурные координаты в одном буфере
    const quadData = new Float32Array([
      // x, y, u, v
      -1,
      -1,
      0,
      0, // Нижний левый
      1,
      -1,
      1,
      0, // Нижний правый
      -1,
      1,
      0,
      1, // Верхний левый
      1,
      1,
      1,
      1, // Верхний правый
    ])

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW)

    // Описание геометрии
    const geometry: GeometryDescriptor = {
      vertexBuffer: quadBuffer,
      attributes: [
        {
          name: "a_position",
          size: 2,
          type: gl.FLOAT,
          normalized: false,
          stride: 16, // 4 float * 4 bytes
          offset: 0,
        },
        {
          name: "a_texCoord",
          size: 2,
          type: gl.FLOAT,
          normalized: false,
          stride: 16,
          offset: 8, // 2 float * 4 bytes
        },
      ],
    }

    return this.getVAO("quad", geometry, program)
  }

  /**
   * Создать VAO для частиц
   */
  public createParticleVAO(
    particleBuffer: WebGLBuffer,
    instanceBuffer: WebGLBuffer,
    program: ShaderProgram,
  ): WebGLVertexArrayObject | null {
    const gl = contextManager.getContext()
    if (!gl) return null

    // Описание геометрии частицы
    const geometry: GeometryDescriptor = {
      vertexBuffer: particleBuffer,
      instanceBuffer,
      attributes: [
        // Атрибуты вершин (квад)
        {
          name: "a_position",
          size: 2,
          type: gl.FLOAT,
          normalized: false,
          stride: 8,
          offset: 0,
        },
        // Атрибуты экземпляров
        {
          name: "a_instancePosition",
          size: 3,
          type: gl.FLOAT,
          normalized: false,
          stride: 32, // 8 floats * 4 bytes
          offset: 0,
          divisor: 1,
        },
        {
          name: "a_instanceVelocity",
          size: 3,
          type: gl.FLOAT,
          normalized: false,
          stride: 32,
          offset: 12, // 3 floats * 4 bytes
          divisor: 1,
        },
        {
          name: "a_instanceSize",
          size: 1,
          type: gl.FLOAT,
          normalized: false,
          stride: 32,
          offset: 24, // 6 floats * 4 bytes
          divisor: 1,
        },
        {
          name: "a_instanceLifetime",
          size: 1,
          type: gl.FLOAT,
          normalized: false,
          stride: 32,
          offset: 28, // 7 floats * 4 bytes
          divisor: 1,
        },
      ],
    }

    return this.getVAO("particles", geometry, program)
  }

  /**
   * Очистить все VAO
   */
  public clear(): void {
    const gl = contextManager.getContext()

    if (gl) {
      for (const managed of this.vaos.values()) {
        gl.deleteVertexArray(managed.vao)
      }
    }

    this.vaos.clear()
    this.currentVAO = null
  }

  /**
   * Создать новый VAO
   */
  private createVAO(geometry: GeometryDescriptor, program: ShaderProgram): WebGLVertexArrayObject | null {
    const gl = contextManager.getContext()
    if (!gl) return null

    const vao = gl.createVertexArray()
    if (!vao) return null

    // Привязываем VAO
    gl.bindVertexArray(vao)

    // Привязываем вершинный буфер
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vertexBuffer)

    // Настраиваем атрибуты
    for (const attribute of geometry.attributes) {
      const location = gl.getAttribLocation(program.program, attribute.name)
      if (location < 0) {
        logger.warnSync("Атрибут не найден в программе", { attribute: attribute.name })
        continue
      }

      gl.enableVertexAttribArray(location)

      // Определяем, какой буфер использовать
      if (attribute.divisor !== undefined && geometry.instanceBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.instanceBuffer)
      } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vertexBuffer)
      }

      // Настраиваем указатель атрибута
      if (attribute.type === gl.FLOAT || attribute.type === gl.HALF_FLOAT) {
        gl.vertexAttribPointer(
          location,
          attribute.size,
          attribute.type,
          attribute.normalized,
          attribute.stride,
          attribute.offset,
        )
      } else {
        // Для целочисленных типов
        gl.vertexAttribIPointer(location, attribute.size, attribute.type, attribute.stride, attribute.offset)
      }

      // Настраиваем делитель для instanced rendering
      if (attribute.divisor !== undefined) {
        gl.vertexAttribDivisor(location, attribute.divisor)
      }
    }

    // Привязываем индексный буфер, если есть
    if (geometry.indexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indexBuffer)
    }

    // Отвязываем VAO
    gl.bindVertexArray(null)

    return vao
  }

  /**
   * Обработчик потери контекста
   */
  private handleContextLost(): void {
    this.vaos.clear()
    this.currentVAO = null
  }

  /**
   * Обработчик восстановления контекста
   */
  private handleContextRestored(): void {
    // VAO нужно пересоздавать после восстановления контекста
    // Это должно делаться компонентами, использующими VAO
  }

  /**
   * Создать буфер из данных
   */
  public createBuffer(data: ArrayBufferView, usage: number = WebGL2RenderingContext.STATIC_DRAW): WebGLBuffer | null {
    const gl = contextManager.getContext()
    if (!gl) return null

    const buffer = gl.createBuffer()
    if (!buffer) return null

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, usage)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    return buffer
  }

  /**
   * Создать индексный буфер
   */
  public createIndexBuffer(
    indices: Uint16Array | Uint32Array,
    usage: number = WebGL2RenderingContext.STATIC_DRAW,
  ): WebGLBuffer | null {
    const gl = contextManager.getContext()
    if (!gl) return null

    const buffer = gl.createBuffer()
    if (!buffer) return null

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, usage)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    return buffer
  }

  /**
   * Обновить данные буфера
   */
  public updateBuffer(buffer: WebGLBuffer, data: ArrayBufferView, offset: number = 0): void {
    const gl = contextManager.getContext()
    if (!gl) return

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, data)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }
}

// Экспортируем синглтон
export const vaoManager = VAOManager.getInstance()
