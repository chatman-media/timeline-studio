//! Error - Модуль обработки ошибок Video Compiler
//!
//! Этот модуль определяет типы ошибок, которые могут возникнуть при работе
//! с Video Compiler модулем, включая ошибки FFmpeg, валидации и I/O операций.

use serde::{Deserialize, Serialize};
use std::fmt;

/// Результат операции Video Compiler
pub type Result<T> = std::result::Result<T, VideoCompilerError>;

/// Основные типы ошибок Video Compiler
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoCompilerError {
  /// Ошибка валидации схемы проекта
  ValidationError(String),

  /// Ошибка FFmpeg (код выхода, stderr)
  FFmpegError {
    exit_code: Option<i32>,
    stderr: String,
    command: String,
  },

  /// Отсутствующая зависимость (FFmpeg, библиотеки)
  DependencyMissing(String),

  /// Ошибка ввода/вывода
  IoError(String),

  /// Ошибка сериализации/десериализации
  SerializationError(String),

  /// Медиа файл не найден или недоступен
  MediaFileError { path: String, reason: String },

  /// Неподдерживаемый формат медиа
  UnsupportedFormat { format: String, file_path: String },

  /// Ошибка рендеринга
  RenderError {
    job_id: String,
    stage: String,
    message: String,
  },

  /// Ошибка генерации превью
  PreviewError { timestamp: f64, reason: String },

  /// Ошибка кэша
  CacheError(String),

  /// Ошибка конфигурации
  ConfigError(String),

  /// Нехватка ресурсов (память, диск)
  ResourceError {
    resource_type: String,
    available: String,
    required: String,
  },

  /// Тайм-аут операции
  TimeoutError {
    operation: String,
    timeout_seconds: u64,
  },

  /// Операция была отменена пользователем
  CancelledError(String),

  /// Внутренняя ошибка
  InternalError(String),

  /// Неизвестная ошибка
  Unknown(String),
}

impl fmt::Display for VideoCompilerError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      VideoCompilerError::ValidationError(msg) => {
        write!(f, "Ошибка валидации: {}", msg)
      }
      VideoCompilerError::FFmpegError {
        exit_code,
        stderr,
        command,
      } => {
        write!(
          f,
          "Ошибка FFmpeg (код выхода: {:?}): {}\nКоманда: {}",
          exit_code, stderr, command
        )
      }
      VideoCompilerError::DependencyMissing(dep) => {
        write!(f, "Отсутствует зависимость: {}", dep)
      }
      VideoCompilerError::IoError(msg) => {
        write!(f, "Ошибка ввода/вывода: {}", msg)
      }
      VideoCompilerError::SerializationError(msg) => {
        write!(f, "Ошибка сериализации: {}", msg)
      }
      VideoCompilerError::MediaFileError { path, reason } => {
        write!(f, "Ошибка медиа файла '{}': {}", path, reason)
      }
      VideoCompilerError::UnsupportedFormat { format, file_path } => {
        write!(
          f,
          "Неподдерживаемый формат '{}' для файла '{}'",
          format, file_path
        )
      }
      VideoCompilerError::RenderError {
        job_id,
        stage,
        message,
      } => {
        write!(
          f,
          "Ошибка рендеринга [{}] на этапе '{}': {}",
          job_id, stage, message
        )
      }
      VideoCompilerError::PreviewError { timestamp, reason } => {
        write!(f, "Ошибка генерации превью на {}с: {}", timestamp, reason)
      }
      VideoCompilerError::CacheError(msg) => {
        write!(f, "Ошибка кэша: {}", msg)
      }
      VideoCompilerError::ConfigError(msg) => {
        write!(f, "Ошибка конфигурации: {}", msg)
      }
      VideoCompilerError::ResourceError {
        resource_type,
        available,
        required,
      } => {
        write!(
          f,
          "Нехватка ресурса '{}': доступно {}, требуется {}",
          resource_type, available, required
        )
      }
      VideoCompilerError::TimeoutError {
        operation,
        timeout_seconds,
      } => {
        write!(
          f,
          "Тайм-аут операции '{}' ({}с)",
          operation, timeout_seconds
        )
      }
      VideoCompilerError::CancelledError(msg) => {
        write!(f, "Операция отменена: {}", msg)
      }
      VideoCompilerError::InternalError(msg) => {
        write!(f, "Внутренняя ошибка: {}", msg)
      }
      VideoCompilerError::Unknown(msg) => {
        write!(f, "Неизвестная ошибка: {}", msg)
      }
    }
  }
}

impl std::error::Error for VideoCompilerError {}

// Конверсии из стандартных ошибок
impl From<std::io::Error> for VideoCompilerError {
  fn from(error: std::io::Error) -> Self {
    VideoCompilerError::IoError(error.to_string())
  }
}

impl From<serde_json::Error> for VideoCompilerError {
  fn from(error: serde_json::Error) -> Self {
    VideoCompilerError::SerializationError(error.to_string())
  }
}

impl From<uuid::Error> for VideoCompilerError {
  fn from(error: uuid::Error) -> Self {
    VideoCompilerError::InternalError(format!("UUID error: {}", error))
  }
}

impl From<tokio::time::error::Elapsed> for VideoCompilerError {
  fn from(_error: tokio::time::error::Elapsed) -> Self {
    VideoCompilerError::TimeoutError {
      operation: "Unknown".to_string(),
      timeout_seconds: 0,
    }
  }
}

/// Вспомогательные функции для создания ошибок
impl VideoCompilerError {
  /// Создать ошибку валидации
  pub fn validation<S: Into<String>>(message: S) -> Self {
    VideoCompilerError::ValidationError(message.into())
  }

  /// Создать ошибку FFmpeg
  pub fn ffmpeg<S: Into<String>>(exit_code: Option<i32>, stderr: S, command: S) -> Self {
    VideoCompilerError::FFmpegError {
      exit_code,
      stderr: stderr.into(),
      command: command.into(),
    }
  }

  /// Создать ошибку медиа файла
  pub fn media_file<P: Into<String>, R: Into<String>>(path: P, reason: R) -> Self {
    VideoCompilerError::MediaFileError {
      path: path.into(),
      reason: reason.into(),
    }
  }

  /// Создать ошибку неподдерживаемого формата
  pub fn unsupported_format<F: Into<String>, P: Into<String>>(format: F, file_path: P) -> Self {
    VideoCompilerError::UnsupportedFormat {
      format: format.into(),
      file_path: file_path.into(),
    }
  }

  /// Создать ошибку рендеринга
  pub fn render<J: Into<String>, S: Into<String>, M: Into<String>>(
    job_id: J,
    stage: S,
    message: M,
  ) -> Self {
    VideoCompilerError::RenderError {
      job_id: job_id.into(),
      stage: stage.into(),
      message: message.into(),
    }
  }

  /// Создать ошибку превью
  pub fn preview(timestamp: f64, reason: String) -> Self {
    VideoCompilerError::PreviewError { timestamp, reason }
  }

  /// Создать ошибку ресурсов
  pub fn resource<S: Into<String>>(resource_type: S, available: S, required: S) -> Self {
    VideoCompilerError::ResourceError {
      resource_type: resource_type.into(),
      available: available.into(),
      required: required.into(),
    }
  }

  /// Создать ошибку тайм-аута
  pub fn timeout<S: Into<String>>(operation: S, timeout_seconds: u64) -> Self {
    VideoCompilerError::TimeoutError {
      operation: operation.into(),
      timeout_seconds,
    }
  }

  /// Проверить, является ли ошибка критической (требует остановки процесса)
  pub fn is_critical(&self) -> bool {
    matches!(
      self,
      VideoCompilerError::DependencyMissing(_)
        | VideoCompilerError::ResourceError { .. }
        | VideoCompilerError::InternalError(_)
    )
  }

  /// Проверить, можно ли повторить операцию
  pub fn is_retryable(&self) -> bool {
    matches!(
      self,
      VideoCompilerError::IoError(_)
        | VideoCompilerError::TimeoutError { .. }
        | VideoCompilerError::CacheError(_)
    )
  }

  /// Получить код ошибки для логирования
  pub fn error_code(&self) -> &'static str {
    match self {
      VideoCompilerError::ValidationError(_) => "VALIDATION_ERROR",
      VideoCompilerError::FFmpegError { .. } => "FFMPEG_ERROR",
      VideoCompilerError::DependencyMissing(_) => "DEPENDENCY_MISSING",
      VideoCompilerError::IoError(_) => "IO_ERROR",
      VideoCompilerError::SerializationError(_) => "SERIALIZATION_ERROR",
      VideoCompilerError::MediaFileError { .. } => "MEDIA_FILE_ERROR",
      VideoCompilerError::UnsupportedFormat { .. } => "UNSUPPORTED_FORMAT",
      VideoCompilerError::RenderError { .. } => "RENDER_ERROR",
      VideoCompilerError::PreviewError { .. } => "PREVIEW_ERROR",
      VideoCompilerError::CacheError(_) => "CACHE_ERROR",
      VideoCompilerError::ConfigError(_) => "CONFIG_ERROR",
      VideoCompilerError::ResourceError { .. } => "RESOURCE_ERROR",
      VideoCompilerError::TimeoutError { .. } => "TIMEOUT_ERROR",
      VideoCompilerError::CancelledError(_) => "CANCELLED_ERROR",
      VideoCompilerError::InternalError(_) => "INTERNAL_ERROR",
      VideoCompilerError::Unknown(_) => "UNKNOWN_ERROR",
    }
  }
}

/// Результат операции с дополнительной информацией
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailedResult<T> {
  /// Результат операции
  pub result: Result<T>,
  /// Дополнительная информация (предупреждения, метрики)
  pub metadata: OperationMetadata,
}

/// Метаданные операции
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationMetadata {
  /// Время выполнения операции
  pub duration_ms: u64,
  /// Предупреждения
  pub warnings: Vec<String>,
  /// Использованные ресурсы
  pub resources_used: ResourceUsage,
  /// Дополнительная информация
  pub extra: serde_json::Value,
}

/// Информация об использованных ресурсах
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ResourceUsage {
  /// Использовано памяти (байты)
  pub memory_bytes: u64,
  /// Использовано места на диске (байты)
  pub disk_bytes: u64,
  /// Время CPU (миллисекунды)
  pub cpu_time_ms: u64,
  /// Количество обработанных кадров
  pub frames_processed: u64,
}

impl Default for OperationMetadata {
  fn default() -> Self {
    Self {
      duration_ms: 0,
      warnings: Vec::new(),
      resources_used: ResourceUsage::default(),
      extra: serde_json::Value::Null,
    }
  }
}

/// Макрос для удобного создания ошибок валидации
#[macro_export]
macro_rules! validation_error {
    ($msg:expr) => {
        VideoCompilerError::ValidationError($msg.to_string())
    };
    ($fmt:expr, $($arg:tt)*) => {
        VideoCompilerError::ValidationError(format!($fmt, $($arg)*))
    };
}

/// Макрос для удобного создания ошибок рендеринга
#[macro_export]
macro_rules! render_error {
  ($job_id:expr, $stage:expr, $msg:expr) => {
    VideoCompilerError::RenderError {
      job_id: $job_id.to_string(),
      stage: $stage.to_string(),
      message: $msg.to_string(),
    }
  };
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_error_creation() {
    let error = VideoCompilerError::validation("Test validation error");
    assert!(matches!(error, VideoCompilerError::ValidationError(_)));
    assert_eq!(error.error_code(), "VALIDATION_ERROR");
  }

  #[test]
  fn test_error_display() {
    let error = VideoCompilerError::ffmpeg(
      Some(1),
      "FFmpeg stderr output",
      "ffmpeg -i input.mp4 output.mp4",
    );
    let display_str = error.to_string();
    assert!(display_str.contains("FFmpeg"));
    assert!(display_str.contains("stderr output"));
  }

  #[test]
  fn test_error_classification() {
    let critical_error = VideoCompilerError::DependencyMissing("FFmpeg".to_string());
    assert!(critical_error.is_critical());
    assert!(!critical_error.is_retryable());

    let retryable_error = VideoCompilerError::IoError("Temporary file error".to_string());
    assert!(!retryable_error.is_critical());
    assert!(retryable_error.is_retryable());
  }

  #[test]
  fn test_error_codes() {
    let errors = vec![
      VideoCompilerError::ValidationError("test".to_string()),
      VideoCompilerError::FFmpegError {
        exit_code: Some(1),
        stderr: "test".to_string(),
        command: "test".to_string(),
      },
      VideoCompilerError::DependencyMissing("test".to_string()),
      VideoCompilerError::IoError("test".to_string()),
    ];

    let expected_codes = [
      "VALIDATION_ERROR",
      "FFMPEG_ERROR",
      "DEPENDENCY_MISSING",
      "IO_ERROR",
    ];

    for (error, expected_code) in errors.iter().zip(expected_codes.iter()) {
      assert_eq!(error.error_code(), *expected_code);
    }
  }

  #[test]
  fn test_serialization() {
    let error = VideoCompilerError::media_file("/path/to/video.mp4", "File not found");

    // Сериализация
    let json = serde_json::to_string(&error).unwrap();
    assert!(json.contains("MediaFileError"));

    // Десериализация
    let deserialized: VideoCompilerError = serde_json::from_str(&json).unwrap();
    match deserialized {
      VideoCompilerError::MediaFileError { path, reason } => {
        assert_eq!(path, "/path/to/video.mp4");
        assert_eq!(reason, "File not found");
      }
      _ => panic!("Неожиданный тип ошибки после десериализации"),
    }
  }

  #[test]
  fn test_conversion_from_std_errors() {
    let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "File not found");
    let video_error: VideoCompilerError = io_error.into();
    assert!(matches!(video_error, VideoCompilerError::IoError(_)));

    let json_error = serde_json::from_str::<serde_json::Value>("invalid json").unwrap_err();
    let video_error: VideoCompilerError = json_error.into();
    assert!(matches!(
      video_error,
      VideoCompilerError::SerializationError(_)
    ));
  }

  #[test]
  fn test_detailed_result() {
    let metadata = OperationMetadata {
      duration_ms: 1500,
      warnings: vec!["Low memory warning".to_string()],
      resources_used: ResourceUsage {
        memory_bytes: 1024 * 1024 * 100, // 100 MB
        disk_bytes: 1024 * 1024 * 50,    // 50 MB
        cpu_time_ms: 1200,
        frames_processed: 300,
      },
      extra: serde_json::json!({"test": "value"}),
    };

    let detailed_result = DetailedResult {
      result: Ok("Success".to_string()),
      metadata,
    };

    assert!(detailed_result.result.is_ok());
    assert_eq!(detailed_result.metadata.duration_ms, 1500);
    assert_eq!(detailed_result.metadata.warnings.len(), 1);
  }

  #[test]
  fn test_validation_error_macro() {
    let error = validation_error!("Simple message");
    assert!(matches!(error, VideoCompilerError::ValidationError(_)));

    let error = validation_error!("Formatted {} message {}", "test", 42);
    if let VideoCompilerError::ValidationError(msg) = error {
      assert_eq!(msg, "Formatted test message 42");
    } else {
      panic!("Ожидалась ValidationError");
    }
  }

  #[test]
  fn test_render_error_macro() {
    let error = render_error!("job-123", "encoding", "FFmpeg failed");
    if let VideoCompilerError::RenderError {
      job_id,
      stage,
      message,
    } = error
    {
      assert_eq!(job_id, "job-123");
      assert_eq!(stage, "encoding");
      assert_eq!(message, "FFmpeg failed");
    } else {
      panic!("Ожидалась RenderError");
    }
  }
}
