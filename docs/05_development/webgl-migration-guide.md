# Руководство по миграции на WebGL2

Это руководство объясняет, как перенести существующие WebGL реализации на новую унифицированную библиотеку WebGL2.

## Обзор

Timeline Studio теперь имеет унифицированную библиотеку WebGL2, расположенную в `/src/lib/webgl/`, которая предоставляет:

- Централизованное управление контекстом
- Пул шейдеров для избежания дублирования
- Поддержка VAO (Vertex Array Objects) для производительности
- Базовый класс рендерера для единообразных реализаций
- Комплексные утилиты

## Ключевые компоненты

### 1. Менеджер контекста (`contextManager`)

Управляет единым WebGL2 контекстом для всего приложения:

```typescript
import { contextManager } from "@/lib/webgl"

// Инициализация контекста
const success = contextManager.initialize({
  canvas: myCanvas,
  attributes: {
    powerPreference: "high-performance",
  },
})

// Получение контекста
const gl = contextManager.getContext()

import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('WebGL')

// Получение возможностей GPU
const capabilities = contextManager.getCapabilities()
logger.infoSync('GPU capabilities detected', {
  tier: capabilities.tier, // "low" | "medium" | "high"
  maxTextureSize: capabilities.maxTextureSize
})
```

### 2. Пул шейдеров (`shaderPool`)

Управляет компиляцией и переиспользованием шейдеров:

```typescript
import { shaderPool, type ShaderSource } from "@/lib/webgl"

// Использование встроенного шейдера
const copyProgram = shaderPool.getProgram("copy")

// Добавление пользовательского шейдера
const myShader: ShaderSource = {
  vertex: `...`,
  fragment: `...`,
}
const myProgram = shaderPool.getProgram("myEffect", myShader)
```

### 3. Менеджер VAO (`vaoManager`)

Оптимизирует настройку атрибутов вершин:

```typescript
import { vaoManager } from "@/lib/webgl"

// Создание quad VAO для полноэкранных эффектов
const quadVAO = vaoManager.createQuadVAO(program)

// Использование VAO
vaoManager.bindVAO(quadVAO)
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
vaoManager.unbindVAO()
```

### 4. Базовый рендерер

Предоставляет общую функциональность для всех рендереров:

```typescript
import { BaseRenderer } from "@/lib/webgl"

export class MyRenderer extends BaseRenderer {
  protected async onInitialize(): Promise<void> {
    // Инициализация вашего рендерера
  }
  
  public render(deltaTime: number): void {
    // Рендеринг кадра
  }
}
```

## Шаги миграции

### Шаг 1: Обновление модуля Preview

Замените существующий WebGL1 рендерер на новый WebGL2 рендерер:

```typescript
// До (WebGL1)
import { PreviewRenderer } from "./services/preview-renderer"

// После (WebGL2)
import { WebGL2PreviewRenderer } from "./services/webgl2-preview-renderer"

const renderer = new WebGL2PreviewRenderer({
  name: "preview",
  canvas: previewCanvas,
})
await renderer.initialize()
```

### Шаг 2: Обновление модуля Effects

Используйте новый унифицированный процессор эффектов:

```typescript
// До
import { ShaderCompiler } from "./services/shader-compiler"
import { UnifiedRenderer } from "./services/unified-renderer"

// После
import { WebGL2EffectProcessor } from "./services/webgl2-effect-processor"

const processor = new WebGL2EffectProcessor()
await processor.initialize()

// Компиляция пользовательского эффекта
await processor.compileEffect("myEffect", {
  fragmentShader: `...`,
  uniforms: { ... },
})

// Обработка изображения
const result = await processor.processImage(image, effect)
```

### Шаг 3: Обновление модуля Video Player

Video player уже использует WebGL2, но должен переключиться на унифицированную библиотеку:

```typescript
// Удалите локальный менеджер WebGL контекста
// import { WebGLContextManager } from "./services/webgl-context-manager"

// Используйте унифицированную библиотеку
import { contextManager, BaseRenderer } from "@/lib/webgl"
```

## Миграция шейдеров

### Обновление шейдеров с WebGL1 на WebGL2

1. Добавьте директиву версии:
```glsl
#version 300 es
```

2. Обновите синтаксис attribute/varying:
```glsl
// WebGL1
attribute vec2 a_position;
varying vec2 v_texCoord;

// WebGL2
in vec2 a_position;
out vec2 v_texCoord;
```

3. Обновите сэмплирование текстур:
```glsl
// WebGL1
vec4 color = texture2D(u_texture, v_texCoord);

// WebGL2
vec4 color = texture(u_texture, v_texCoord);
```

4. Добавьте выходную переменную в фрагментный шейдер:
```glsl
// WebGL2 фрагментный шейдер
out vec4 fragColor;

void main() {
  fragColor = vec4(1.0);
}
```

## Оптимизация производительности

### 1. Используйте VAO

Vertex Array Objects значительно снижают накладные расходы на вызовы отрисовки:

```typescript
// Создайте VAO один раз
const vao = vaoManager.createQuadVAO(program)

// Используйте многократно
vaoManager.bindVAO(vao)
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
```

### 2. Используйте пул шейдеров

Никогда не компилируйте один и тот же шейдер дважды:

```typescript
// Шейдеры автоматически кэшируются
const program1 = shaderPool.getProgram("blur")
const program2 = shaderPool.getProgram("blur") // Возвращает кэшированную версию
```

### 3. Переиспользуйте фреймбуферы

Базовый рендерер предоставляет управление фреймбуферами:

```typescript
// Создайте один раз
this.createFramebuffer("ping", width, height)
this.createFramebuffer("pong", width, height)

// Используйте для пинг-понг рендеринга
this.bindFramebuffer("ping")
// рендеринг...
this.bindFramebuffer("pong")
// рендеринг...
```

## Частые проблемы и решения

### Проблема: "WebGL2 не поддерживается"

**Решение**: WebGL2 поддерживается во всех современных браузерах. Обновите браузер или проверьте, включено ли аппаратное ускорение.

### Проблема: Ошибки компиляции шейдеров

**Решение**: Убедитесь, что шейдеры используют синтаксис WebGL2. Проверьте консоль браузера для подробных сообщений об ошибках.

### Проблема: Черный экран после миграции

**Решение**: 
1. Проверьте правильность привязки текстур
2. Убедитесь, что униформы шейдеров установлены
3. Проверьте правильность настройки VAO
4. Проверьте завершенность фреймбуфера

### Проблема: Снижение производительности

**Решение**:
1. Профилируйте с помощью DevTools браузера
2. Убедитесь, что используются VAO
3. Проверьте форматы текстур (предпочтительно RGBA8)
4. Убедитесь, что детекция уровня GPU работает

## Тестирование миграции

1. **Модульные тесты**: Обновите тесты для мокирования новой библиотеки WebGL2
2. **Визуальные тесты**: Сравните вывод до/после миграции
3. **Тесты производительности**: Измерьте FPS и время кадра
4. **Тесты совместимости**: Протестируйте на разных GPU/браузерах

## План отката

Если возникнут проблемы во время миграции:

1. Сохраните старые реализации рядом с новыми
2. Используйте флаги функций для переключения между реализациями
3. Постепенно мигрируйте по одному модулю за раз
4. Отслеживайте метрики производительности

## Будущие улучшения

После миграции рассмотрите реализацию:

1. **Compute Shaders** (когда WebGPU станет доступным)
2. **Texture Arrays** для пакетной обработки
3. **Instanced Rendering** для частиц
4. **Transform Feedback** для GPU-анимаций
5. **Multiple Render Targets** для продвинутых эффектов