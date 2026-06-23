//! `ts-render-analysis` — ffmpeg-анализ видео/аудио Timeline Studio (#91).
//!
//! Вынесено из монолита `src-tauri/src/video_compiler/core/ffmpeg/` (анализное поддерево):
//! детекция сцен/тишины, анализ движения/качества/аудио, кадры, цветокоррекция, стабилизация.
//! Сюда же перенесены типы-результаты анализа (бывш. `video_compiler::commands::video_analysis::types`),
//! чтобы разорвать цикл движок<->командная группа.
//!
//! Зависит вниз: ts-render (error), ts-render-services (FFmpegCommand-примитив), ts-analysis (types).

/// Типы-результаты анализа (VideoMetadata/Scene/QualityAnalysisResult/...). Pure serde.
pub mod types;

pub mod analysis;
pub mod audio_analysis;
pub mod color_correction;
pub mod keyframes;
pub mod motion_analysis;
pub mod quality;
pub mod scene_detection;
pub mod silence_detection;
pub mod stabilization;
pub mod unified_audio_analysis;

// FFmpeg-командный примитив — единый источник истины в ts-render-services.
// Покрывает `super::FFmpegCommand` в анализных подмодулях и внешних потребителей
// (`core::ffmpeg::{check_*, FFmpegCommand, FFmpegSecurity, GpuCapabilities}`).
pub use ts_render_services::ffmpeg_command::{
  check_ffmpeg_available, check_ffprobe_available, check_gpu_encoders_available, security,
  FFmpegCommand, FFmpegSecurity, GpuCapabilities,
};
