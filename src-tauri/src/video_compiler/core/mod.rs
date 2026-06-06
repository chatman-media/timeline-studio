//! Core Video Compiler.
//!
//! ДЕДУП (#90/#91): движок компиляции (renderer/pipeline/stages/ffmpeg_builder/executor/
//! cache/progress/error/gpu/preview/frame_extraction/constants/performance_manager) вынесен
//! в крейт `ts-render` и здесь РЕ-ЭКСПОРТИТСЯ. В монолите остаются `ffmpeg` (FFmpeg-анализ,
//! тендрилы в analysis) и `schema` (уже re-export ts-schema, #106).
pub use ts_render::video_compiler::core::{
  cache, constants, error, ffmpeg_builder, ffmpeg_executor, frame_extraction, gpu,
  performance_manager, pipeline, pipeline_refactored, preview, progress, renderer, stages,
};

pub mod ffmpeg;
pub mod schema;
