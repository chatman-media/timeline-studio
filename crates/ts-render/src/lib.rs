//! `ts-render` — headless render-core, вынесенный из timeline-studio.
//!
//! Содержит движок компиляции видео (`video_compiler::core`: schema → pipeline →
//! stages → ffmpeg_builder → ffmpeg_executor) БЕЗ Tauri, ort/ONNX и libav.
//! Рендер исполняется через CLI-бинарь ffmpeg (`tokio::process::Command`).
//!
//! Спайк Фазы B эпика #91 / задачи #90 — доказывает, что рендер запускается в
//! обычном бинарнике (см. `bin/render.rs`).

pub mod video_compiler;
