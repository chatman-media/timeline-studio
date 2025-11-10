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
 * LEGACY REMOVED! ✅
 *
 * Старые классы удалены:
 * - webgl-transition-service.ts (489 строк) ❌ УДАЛЁН
 * - dynamic-transition-service.ts (1858 строк) ❌ УДАЛЁН
 * - base-webgl-service.ts (315 строк) ❌ УДАЛЁН
 *
 * Новая архитектура на базе BaseRenderer:
 * - BasicTransitionRenderer (~330 строк) - заменяет webgl-transition-service
 * - GlitchTransitionRenderer (~260 строк) - заменяет часть dynamic-transition-service
 * - ParticleTransitionRenderer (~300 строк) - заменяет часть dynamic-transition-service
 * - ThreeDTransitionRenderer (~540 строк) - заменяет часть dynamic-transition-service
 *
 * Итого: 2662 строки → ~1430 строк (-46%)
 *
 * Миграция:
 * - Вместо WebGLTransitionService используйте BasicTransitionRenderer
 * - Вместо DynamicTransitionService используйте соответствующий рендерер:
 *   - Для glitch эффектов → GlitchTransitionRenderer
 *   - Для particle эффектов → ParticleTransitionRenderer
 *   - Для 3D эффектов → ThreeDTransitionRenderer
 */
