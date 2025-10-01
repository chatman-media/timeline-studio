# WebGL2 Library - Унифицированная WebGL2 библиотека

Унифицированная WebGL2 библиотека для Timeline Studio, обеспечивающая высокопроизводительный рендеринг видео с эффектами.

**🌐 Languages:** [English](./README_EN.md) | [Русский](./README.md)

## 🚀 Особенности

- **WebGL2**: Полная поддержка современного WebGL2 API
- **GPU Tier Detection**: Автоматическое определение уровня GPU (low/medium/high)
- **Контекст-менеджер**: Централизованное управление WebGL2 контекстами
- **Пул шейдеров**: Кэширование и переиспользование скомпилированных шейдеров
- **VAO менеджер**: Эффективное управление Vertex Array Objects
- **Event-driven**: Архитектура на основе событий
- **Type-safe**: Полная типизация TypeScript

## 📁 Структура

```
src/lib/webgl/
├── context-manager.ts     # Центральный менеджер WebGL2 контекстов
├── shader-pool.ts         # Пул шейдеров для оптимизации
├── vao-manager.ts         # Менеджер Vertex Array Objects
├── base-renderer.ts       # Базовый класс для всех рендереров
├── utils.ts              # Утилиты WebGL2
├── types.ts              # TypeScript типы
├── index.ts              # Главный экспорт
└── __tests__/            # Тесты модуля
```

## 🏗️ Архитектура

### ContextManager
Синглтон для управления WebGL2 контекстами с автоматическим определением GPU возможностей:

```typescript
import { contextManager } from '@/lib/webgl'

// Инициализация контекста
const success = contextManager.initialize({ canvas })

// Получение возможностей GPU
const capabilities = contextManager.getCapabilities()
console.log(capabilities.tier) // "low" | "medium" | "high"

// Изменение размера
contextManager.resize(1920, 1080)

// События
contextManager.on('contextLost', () => console.log('Context lost'))
contextManager.on('contextRestored', () => console.log('Context restored'))
```

### ShaderPool
Эффективное кэширование и управление шейдерами:

```typescript
import { shaderPool } from '@/lib/webgl'

// Получение встроенного шейдера
const copyProgram = shaderPool.getProgram("copy")

// Создание кастомного шейдера
const customProgram = shaderPool.getProgram("myShader", {
  vertex: vertexShaderSource,
  fragment: fragmentShaderSource
})

// Получение местоположений uniform/attribute
const uTexture = shaderPool.getUniformLocation(program, "u_texture")
const aPosition = shaderPool.getAttributeLocation(program, "a_position")

// Освобождение ресурсов
shaderPool.releaseProgram("myShader")
```

### VAOManager
Управление Vertex Array Objects для оптимизации рендеринга:

```typescript
import { vaoManager } from '@/lib/webgl'

// Создание VAO для полноэкранного квада
const quadVAO = vaoManager.createQuadVAO(program)

// Использование VAO
vaoManager.bindVAO(quadVAO)
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
vaoManager.unbindVAO()

// Освобождение ресурсов
vaoManager.releaseVAO(quadVAO)
```

### BaseRenderer
Базовый класс для создания рендереров:

```typescript
import { BaseRenderer } from '@/lib/webgl'

class MyRenderer extends BaseRenderer {
  protected async onInitialize(): Promise<void> {
    // Инициализация специфичная для рендерера
    const program = shaderPool.getProgram("myShader")
    this.quadVAO = vaoManager.createQuadVAO(program)
  }

  public render(deltaTime: number): void {
    if (!this.gl) return
    
    // Логика рендеринга
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    // ...
  }
}
```

## 🚀 Быстрый старт

1. **Инициализация контекста:**
```typescript
import { contextManager } from '@/lib/webgl'

const canvas = document.createElement('canvas')
const success = contextManager.initialize({ canvas })

if (success) {
  console.log('WebGL2 initialized successfully')
}
```

2. **Создание простого рендерера:**
```typescript
import { BaseRenderer, shaderPool, vaoManager } from '@/lib/webgl'

class SimpleRenderer extends BaseRenderer {
  private quadVAO: WebGLVertexArrayObject | null = null

  protected async onInitialize(): Promise<void> {
    const program = shaderPool.getProgram("copy")
    if (program) {
      this.quadVAO = vaoManager.createQuadVAO(program)
    }
  }

  public render(): void {
    if (!this.gl || !this.quadVAO) return
    
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    vaoManager.bindVAO(this.quadVAO)
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
    vaoManager.unbindVAO()
  }
}

// Использование
const renderer = new SimpleRenderer({ name: 'simple', canvas })
await renderer.initialize()
renderer.render()
```

## 🎨 Встроенные шейдеры

Библиотека включает набор оптимизированных шейдеров для общих задач:

- **copy**: Простое копирование текстуры
- **blend**: Блендинг двух текстур
- **colorCorrection**: Коррекция цвета (HSL, RGB)
- **gaussianBlur**: Размытие по Гауссу

```typescript
// Использование встроенных шейдеров
const copyProgram = shaderPool.getProgram("copy")
const blurProgram = shaderPool.getProgram("gaussianBlur")
```

## 🔧 GPU Tier Detection

Автоматическое определение производительности GPU для оптимизации качества:

```typescript
const capabilities = contextManager.getCapabilities()

switch (capabilities.tier) {
  case "high":
    // Максимальное качество
    quality = { resolution: 1.0, effects: "all", antialiasing: true }
    break
  case "medium":
    // Сбалансированное качество
    quality = { resolution: 0.75, effects: "all", antialiasing: true }
    break
  case "low":
    // Производительность приоритет
    quality = { resolution: 0.5, effects: "basic", antialiasing: false }
    break
}
```

## 📊 События

Библиотека поддерживает события для реагирования на изменения контекста:

```typescript
contextManager.on('contextLost', () => {
  console.log('WebGL context lost - pausing rendering')
})

contextManager.on('contextRestored', () => {
  console.log('WebGL context restored - resuming rendering')
  // Перезагрузка ресурсов
})

contextManager.on('resize', ({ width, height, dpr }) => {
  console.log(`Canvas resized: ${width}x${height} (DPR: ${dpr})`)
})
```

## 🧪 Тестирование

Запуск тестов:
```bash
bun run test src/lib/webgl/__tests__/
```

Тесты покрывают:
- ✅ Инициализацию ContextManager
- ✅ GPU capabilities detection
- ✅ Компиляцию и кэширование шейдеров
- ✅ Управление VAO
- ✅ Обработку потери контекста
- ✅ Очистку ресурсов

## 🔄 Миграция с WebGL1

Если вы мигрируете с WebGL1, см. [руководство по миграции](../../../docs/05_development/webgl-migration-guide.md).

## 📚 API Reference

### ContextManager
- `initialize(options)` - Инициализация WebGL2 контекста
- `getContext()` - Получение текущего контекста
- `getCapabilities()` - Получение возможностей GPU
- `resize(width, height)` - Изменение размера canvas
- `dispose()` - Очистка ресурсов

### ShaderPool
- `getProgram(name, source?)` - Получение шейдерной программы
- `releaseProgram(name)` - Освобождение программы
- `getUniformLocation(program, name)` - Местоположение uniform
- `getAttributeLocation(program, name)` - Местоположение attribute
- `clear()` - Очистка всех программ

### VAOManager
- `createQuadVAO(program)` - Создание VAO для квада
- `createVAO(program, attributes)` - Создание кастомного VAO
- `bindVAO(vao)` - Привязка VAO
- `unbindVAO()` - Отвязка VAO
- `releaseVAO(vao)` - Освобождение VAO

## 🤝 Вклад в развитие

При добавлении новых возможностей:
1. Следуйте существующим паттернам архитектуры
2. Добавляйте TypeScript типы
3. Покрывайте код тестами
4. Обновляйте документацию

## 📄 Лицензия

Часть Timeline Studio - см. корневую лицензию проекта.