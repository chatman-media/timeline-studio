//! Filesystem Module
//!
//! Объединяет операции с файловой системой и управление директориями приложения

pub mod app_dirs;
pub mod operations;

// Re-export основных типов и функций для удобства
pub use app_dirs::{
  create_app_directories, get_app_directories,
  AppDirectories,
};
