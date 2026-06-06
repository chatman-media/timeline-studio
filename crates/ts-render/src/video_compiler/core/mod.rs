//! Core - Основные модули Video Compiler
//!
//! Этот модуль содержит основные компоненты системы компиляции видео:
//! - Кэширование и управление ресурсами
//! - Обработка ошибок
//! - Извлечение кадров
//! - Поддержка GPU
//! - Конвейер обработки
//! - Генерация превью
//! - Отслеживание прогресса
//! - Рендеринг видео

pub mod cache;
pub mod constants;
pub mod error;
pub mod ffmpeg_builder;
pub mod ffmpeg_executor;
pub mod frame_extraction;
pub mod gpu;
pub mod performance_manager;
pub mod pipeline;
pub mod preview;
pub mod progress;
pub mod renderer;
pub use ts_schema as schema; // #93: схема вынесена в крейт ts-schema

// Новые модули после рефакторинга
pub mod pipeline_refactored;
pub mod stages;

// Re-export основных типов
