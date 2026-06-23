//! FFmpeg-анализ — вынесен в крейт `ts-render-analysis` (#91).
//! Ре-экспорт-шим: `crate::video_compiler::core::ffmpeg::{analysis,scene_detection,...}::*`,
//! типы анализа и командный примитив резолвятся без правок у потребителей
//! (analysis::services::{scene_detector,unified_audio_analyzer}, state::commands::media).
pub use ts_render_analysis::*;
