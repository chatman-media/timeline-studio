/**
 * AI Services Domain - Service Exports
 *
 * ⚠️ IMPORTANT: AI Analysis services migrated to Rust backend (AI Director)
 * Use @/features/ai-director hooks instead of these legacy services
 *
 * Migration Guide:
 * - Scene Analysis → AI Director comprehensive analysis
 * - Content Classification → AI Director content engine
 * - Moment Detection → AI Director moment engine
 * - Vision Analysis → AI Director vision service
 *
 * See: /docs/ru/05_development/ai-director-unified-migration-guide.md
 */

// Core services
// export * from "./ai-orchestrator" // ⚠️ REMOVED: Migrated to unified-orchestrator with AI Director integration
// Specialized services
// export * from "./audio"
// export * from "./batch-processing-service" // ⚠️ Deprecated: Use AI Director batch analysis
export * from "./content"
// export * from "./content-classifier" // ⚠️ Deprecated: Migrated to Rust backend
// Removed: content-intelligence-service - migrated to Rust backend
// Removed: content-pipeline - migrated to Rust backend
// Removed: engines/content-classification - migrated to Rust backend
export * from "./ffmpeg"
export * from "./media-analysis"
export * from "./media-analysis-interface"
export * from "./montage-planning"
export * from "./multi-platform"
export * from "./person-identification"
// export * from "./platform-optimization"
export * from "./recognition"
// export * from "./scene-analysis" // ⚠️ Deprecated: Migrated to Rust backend
// export * from "./script-generation"
export * from "./timeline-ai-service"
export * from "./transcription-service"
export * from "./vision"
export * from "./whisper-service"
export * from "./workflow-automation"
