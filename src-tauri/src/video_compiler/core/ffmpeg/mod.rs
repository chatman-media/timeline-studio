//! FFmpeg интеграция для Timeline Studio
//!
//! Этот модуль предоставляет функциональность для работы с FFmpeg,
//! включая анализ видео, детекцию сцен, работу с аудио и другие операции.
//!
//! ВОЛНА 1 (#91): командный примитив `FFmpegCommand` + `FFmpegSecurity` + детекция
//! GPU-возможностей ИЗВЛЕЧЕНЫ в крейт `ts-render-services` (`ffmpeg_command`), потому что от
//! них зависит перенесённый сервисный слой (`services::preview_service`). Здесь оставлен
//! ре-экспорт-шим, чтобы анализные подмодули (`use super::FFmpegCommand;`) и внешний
//! потребитель (`analysis::services::unified_audio_analyzer` →
//! `core::ffmpeg::check_*`) продолжали резолвиться без правок. Сами анализные подмодули
//! пока остаются в монолите (их перенос — отдельная волна, см. план §Step 2).

pub mod analysis;
pub mod audio_analysis;
pub mod color_correction;
pub mod keyframes;
pub mod motion_analysis;
pub mod quality;
pub mod scene_detection;
pub mod silence_detection;
pub mod stabilization;
pub mod unified_audio_analysis; // 🆕 Modern unified audio analysis

// Ре-экспорт-шим командного примитива из крейта (единый источник истины).
// Покрывает `super::FFmpegCommand` в анализных подмодулях и
// `crate::video_compiler::core::ffmpeg::{check_ffmpeg_available, check_ffprobe_available,
// check_gpu_encoders_available, GpuCapabilities, FFmpegSecurity}` у внешних потребителей.
pub use ts_render_services::ffmpeg_command::{
  check_ffmpeg_available, check_ffprobe_available, check_gpu_encoders_available, security,
  FFmpegCommand, FFmpegSecurity, GpuCapabilities,
};
