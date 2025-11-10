/**
 * Transitions Services - Unified Exports
 *
 * Экспорт всех специализированных рендереров переходов на базе BaseRenderer из lib/webgl
 *
 * Архитектура:
 * - BasicTransitionRenderer - Blur и Color эффекты (WebGL2)
 * - GlitchTransitionRenderer - 10 Glitch эффектов (WebGL2)
 * - ParticleTransitionRenderer - 5 Dynamic эффектов с физикой (WebGL2)
 * - ThreeDTransitionRenderer - 9 3D геометрических эффектов (WebGL2)
 *
 * Все рендереры наследуются от BaseRenderer (/src/lib/webgl/base-renderer.ts)
 */

// 3D Transitions (9 effects)
export {
  type ThreeDEffectType,
  type ThreeDRenderParams,
  type ThreeDTransformParams,
  ThreeDTransitionRenderer,
  threeDTransitionRenderer,
} from "./3d-transition-renderer"
// Basic Transitions (Blur + Color)
export {
  BasicTransitionRenderer,
  basicTransitionRenderer,
  type RenderResult,
  type TransitionRenderParams,
} from "./basic-transition-renderer"
// Glitch Transitions (10 effects)
export {
  type GlitchEffectType,
  type GlitchRenderParams,
  GlitchTransitionRenderer,
  glitchTransitionRenderer,
} from "./glitch-transition-renderer"
// Particle Transitions (5 dynamic effects + physics)
export {
  type ParticleEffectType,
  type ParticleRenderParams,
  type ParticleSystemParams,
  ParticleTransitionRenderer,
  type PhysicsParams,
  particleTransitionRenderer,
} from "./particle-transition-renderer"

/**
 * LEGACY: Старые WebGL сервисы (будут удалены в Phase 2)
 *
 * ⚠️ Используйте новые специализированные рендереры вместо этих классов!
 *
 * Старая архитектура:
 * - webgl-transition-service.ts (489 строк) - WebGL1 basic transitions
 * - dynamic-transition-service.ts (1858 строк) - WebGL2 монолитный класс
 * - base-webgl-service.ts (УДАЛЁН) - дубликат BaseRenderer
 *
 * Новая архитектура:
 * - BasicTransitionRenderer (~300 строк) - заменяет webgl-transition-service
 * - GlitchTransitionRenderer (~400 строк) - выделен из dynamic-transition-service
 * - ParticleTransitionRenderer (~350 строк) - выделен из dynamic-transition-service
 * - ThreeDTransitionRenderer (~400 строк) - выделен из dynamic-transition-service
 *
 * Итого: 2662 строки → ~1450 строк (-45%)
 */

export { DynamicTransitionService } from "./dynamic-transition-service"
// Временно экспортируем старые сервисы для обратной совместимости
// TODO: Удалить после миграции всего кода на новые рендереры
export { WebGLTransitionService } from "./webgl-transition-service"
