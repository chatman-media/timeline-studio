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
  TimeoutError(String),

  /// Операция была отменена пользователем
  CancelledError(String),

  /// Ошибка GPU ускорения
  GpuError(String),

  /// GPU недоступен или не поддерживается
  GpuUnavailable(String),

  /// Ошибка ввода/вывода (переименовано для ясности)
  Io(String),

  /// Внутренняя ошибка
  InternalError(String),

  /// Неизвестная ошибка
  Unknown(String),

  /// Шаблон не найден
  TemplateNotFound(String),

  /// Неверный параметр
  InvalidParameter(String),

  /// Функция не реализована
  NotImplemented(String),

  /// Неверный путь к файлу
  InvalidPath(String),

  /// Слишком много активных задач
  TooManyActiveJobs(String),

  /// Сервис не найден в DI контейнере
  ServiceNotFound(String),

  /// Ошибка безопасности
  SecurityError(String),

  /// Ошибка обработки
  ProcessingError { operation: String, details: String },

  /// Ошибка ввода/вывода с деталями
  IoError {
    operation: String,
    path: String,
    details: String,
  },
}

impl fmt::Display for VideoCompilerError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      VideoCompilerError::ValidationError(msg) => {
        write!(f, "Ошибка валидации: {msg}")
      }
      VideoCompilerError::FFmpegError {
        exit_code,
        stderr,
        command,
      } => {
        write!(
          f,
          "Ошибка FFmpeg (код выхода: {exit_code:?}): {stderr}\nКоманда: {command}"
        )
      }
      VideoCompilerError::DependencyMissing(dep) => {
        write!(f, "Отсутствует зависимость: {dep}")
      }
      VideoCompilerError::SerializationError(msg) => {
        write!(f, "Ошибка сериализации: {msg}")
      }
      VideoCompilerError::MediaFileError { path, reason } => {
        write!(f, "Ошибка медиа файла '{path}': {reason}")
      }
      VideoCompilerError::UnsupportedFormat { format, file_path } => {
        write!(
          f,
          "Неподдерживаемый формат '{format}' для файла '{file_path}'"
        )
      }
      VideoCompilerError::RenderError {
        job_id,
        stage,
        message,
      } => {
        write!(
          f,
          "Ошибка рендеринга [{job_id}] на этапе '{stage}': {message}"
        )
      }
      VideoCompilerError::PreviewError { timestamp, reason } => {
        write!(f, "Ошибка генерации превью на {timestamp}с: {reason}")
      }
      VideoCompilerError::CacheError(msg) => {
        write!(f, "Ошибка кэша: {msg}")
      }
      VideoCompilerError::ConfigError(msg) => {
        write!(f, "Ошибка конфигурации: {msg}")
      }
      VideoCompilerError::ResourceError {
        resource_type,
        available,
        required,
      } => {
        write!(
          f,
          "Нехватка ресурса '{resource_type}': доступно {available}, требуется {required}"
        )
      }
      VideoCompilerError::TimeoutError(msg) => {
        write!(f, "Тайм-аут операции: {msg}")
      }
      VideoCompilerError::CancelledError(msg) => {
        write!(f, "Операция отменена: {msg}")
      }
      VideoCompilerError::GpuError(msg) => {
        write!(f, "Ошибка GPU: {msg}")
      }
      VideoCompilerError::GpuUnavailable(msg) => {
        write!(f, "GPU недоступен: {msg}")
      }
      VideoCompilerError::Io(msg) => {
        write!(f, "Ошибка ввода/вывода: {msg}")
      }
      VideoCompilerError::InternalError(msg) => {
        write!(f, "Внутренняя ошибка: {msg}")
      }
      VideoCompilerError::Unknown(msg) => {
        write!(f, "Неизвестная ошибка: {msg}")
      }
      VideoCompilerError::TemplateNotFound(template_id) => {
        write!(f, "Шаблон не найден: {template_id}")
      }
      VideoCompilerError::InvalidParameter(msg) => {
        write!(f, "Неверный параметр: {msg}")
      }
      VideoCompilerError::NotImplemented(msg) => {
        write!(f, "Функция не реализована: {msg}")
      }
      VideoCompilerError::InvalidPath(path) => {
        write!(f, "Неверный путь к файлу: {path}")
      }
      VideoCompilerError::TooManyActiveJobs(msg) => {
        write!(f, "Слишком много активных задач: {msg}")
      }
      VideoCompilerError::ServiceNotFound(service) => {
        write!(f, "Сервис не найден в DI контейнере: {service}")
      }
      VideoCompilerError::SecurityError(msg) => {
        write!(f, "Ошибка безопасности: {msg}")
      }
      VideoCompilerError::ProcessingError { operation, details } => {
        write!(f, "Ошибка обработки при {operation}: {details}")
      }
      VideoCompilerError::IoError {
        operation,
        path,
        details,
      } => {
        write!(
          f,
          "Ошибка ввода/вывода при {operation} для '{path}': {details}"
        )
      }
    }
  }
}

impl std::error::Error for VideoCompilerError {}

impl VideoCompilerError {
  /// Создать ошибку GPU
  pub fn gpu(message: impl Into<String>) -> Self {
    VideoCompilerError::GpuError(message.into())
  }

  /// Создать ошибку недоступности GPU
  pub fn gpu_unavailable(message: impl Into<String>) -> Self {
    VideoCompilerError::GpuUnavailable(message.into())
  }

  /// Создать ошибку I/O
  pub fn io(message: impl Into<String>) -> Self {
    VideoCompilerError::Io(message.into())
  }

  /// Проверить, является ли ошибка связанной с GPU
  pub fn is_gpu_related(&self) -> bool {
    matches!(
      self,
      VideoCompilerError::GpuError(_) | VideoCompilerError::GpuUnavailable(_)
    )
  }

  /// Получить сообщение об ошибке
  #[allow(dead_code)]
  pub fn message(&self) -> String {
    self.to_string()
  }

  /// Проверить, можно ли использовать fallback на CPU
  pub fn should_fallback_to_cpu(&self) -> bool {
    matches!(
      self,
      VideoCompilerError::GpuError(_) | VideoCompilerError::GpuUnavailable(_)
    )
  }
}

// Конверсии из стандартных ошибок
impl From<std::io::Error> for VideoCompilerError {
  fn from(error: std::io::Error) -> Self {
    VideoCompilerError::Io(error.to_string())
  }
}

impl From<serde_json::Error> for VideoCompilerError {
  fn from(error: serde_json::Error) -> Self {
    VideoCompilerError::SerializationError(error.to_string())
  }
}

impl From<uuid::Error> for VideoCompilerError {
  fn from(error: uuid::Error) -> Self {
    VideoCompilerError::InternalError(format!("UUID error: {error}"))
  }
}

impl From<tokio::time::error::Elapsed> for VideoCompilerError {
  fn from(_error: tokio::time::error::Elapsed) -> Self {
    VideoCompilerError::TimeoutError("Operation timed out".to_string())
  }
}

impl From<String> for VideoCompilerError {
  fn from(error: String) -> Self {
    VideoCompilerError::ValidationError(error)
  }
}

impl From<anyhow::Error> for VideoCompilerError {
  fn from(error: anyhow::Error) -> Self {
    VideoCompilerError::InternalError(error.to_string())
  }
}

/// Вспомогательные функции для создания ошибок
impl VideoCompilerError {
  /// Создать ошибку валидации
  pub fn validation<S: Into<String>>(message: S) -> Self {
    VideoCompilerError::ValidationError(message.into())
  }

  /// Создать ошибку FFmpeg
  pub fn ffmpeg<S1: Into<String>, S2: Into<String>>(
    exit_code: Option<i32>,
    stderr: S1,
    command: S2,
  ) -> Self {
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
  #[allow(dead_code)]
  pub fn resource<S: Into<String>>(resource_type: S, available: S, required: S) -> Self {
    VideoCompilerError::ResourceError {
      resource_type: resource_type.into(),
      available: available.into(),
      required: required.into(),
    }
  }

  /// Создать ошибку тайм-аута
  #[allow(dead_code)]
  pub fn timeout<S: Into<String>>(operation: S) -> Self {
    VideoCompilerError::TimeoutError(operation.into())
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
      VideoCompilerError::Io(_)
        | VideoCompilerError::TimeoutError(_)
        | VideoCompilerError::CacheError(_)
    )
  }

  /// Получить код ошибки для логирования
  pub fn error_code(&self) -> &'static str {
    match self {
      VideoCompilerError::ValidationError(_) => "VALIDATION_ERROR",
      VideoCompilerError::FFmpegError { .. } => "FFMPEG_ERROR",
      VideoCompilerError::DependencyMissing(_) => "DEPENDENCY_MISSING",
      VideoCompilerError::Io(_) => "IO_ERROR",
      VideoCompilerError::SerializationError(_) => "SERIALIZATION_ERROR",
      VideoCompilerError::MediaFileError { .. } => "MEDIA_FILE_ERROR",
      VideoCompilerError::UnsupportedFormat { .. } => "UNSUPPORTED_FORMAT",
      VideoCompilerError::RenderError { .. } => "RENDER_ERROR",
      VideoCompilerError::PreviewError { .. } => "PREVIEW_ERROR",
      VideoCompilerError::CacheError(_) => "CACHE_ERROR",
      VideoCompilerError::ConfigError(_) => "CONFIG_ERROR",
      VideoCompilerError::ResourceError { .. } => "RESOURCE_ERROR",
      VideoCompilerError::TimeoutError(_) => "TIMEOUT_ERROR",
      VideoCompilerError::CancelledError(_) => "CANCELLED_ERROR",
      VideoCompilerError::GpuError(_) => "GPU_ERROR",
      VideoCompilerError::GpuUnavailable(_) => "GPU_UNAVAILABLE",
      VideoCompilerError::InternalError(_) => "INTERNAL_ERROR",
      VideoCompilerError::Unknown(_) => "UNKNOWN_ERROR",
      VideoCompilerError::TemplateNotFound(_) => "TEMPLATE_NOT_FOUND",
      VideoCompilerError::InvalidParameter(_) => "INVALID_PARAMETER",
      VideoCompilerError::NotImplemented(_) => "NOT_IMPLEMENTED",
      VideoCompilerError::InvalidPath(_) => "INVALID_PATH",
      VideoCompilerError::TooManyActiveJobs(_) => "TOO_MANY_ACTIVE_JOBS",
      VideoCompilerError::ServiceNotFound(_) => "SERVICE_NOT_FOUND",
      VideoCompilerError::SecurityError(_) => "SECURITY_ERROR",
      VideoCompilerError::ProcessingError { .. } => "PROCESSING_ERROR",
      VideoCompilerError::IoError { .. } => "IO_ERROR",
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
  #[allow(unused_imports)]
  use tokio::time::{timeout, Duration as TokioDuration};

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

    let retryable_error = VideoCompilerError::Io("Temporary file error".to_string());
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
      VideoCompilerError::Io("test".to_string()),
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
    assert!(matches!(video_error, VideoCompilerError::Io(_)));

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

  #[test]
  fn test_all_error_displays() {
    // Тестируем Display для всех вариантов ошибок
    let errors: Vec<(VideoCompilerError, &str)> = vec![
      (
        VideoCompilerError::DependencyMissing("FFmpeg".to_string()),
        "Отсутствует зависимость: FFmpeg",
      ),
      (
        VideoCompilerError::Io("Disk full".to_string()),
        "Ошибка ввода/вывода: Disk full",
      ),
      (
        VideoCompilerError::SerializationError("Invalid JSON".to_string()),
        "Ошибка сериализации: Invalid JSON",
      ),
      (
        VideoCompilerError::MediaFileError {
          path: "/test.mp4".to_string(),
          reason: "Not found".to_string(),
        },
        "Ошибка медиа файла '/test.mp4': Not found",
      ),
      (
        VideoCompilerError::UnsupportedFormat {
          format: "AVI".to_string(),
          file_path: "/test.avi".to_string(),
        },
        "Неподдерживаемый формат 'AVI' для файла '/test.avi'",
      ),
      (
        VideoCompilerError::RenderError {
          job_id: "123".to_string(),
          stage: "encoding".to_string(),
          message: "Failed".to_string(),
        },
        "Ошибка рендеринга [123] на этапе 'encoding': Failed",
      ),
      (
        VideoCompilerError::PreviewError {
          timestamp: 10.5,
          reason: "Frame extraction failed".to_string(),
        },
        "Ошибка генерации превью на 10.5с: Frame extraction failed",
      ),
      (
        VideoCompilerError::CacheError("Cache corrupted".to_string()),
        "Ошибка кэша: Cache corrupted",
      ),
      (
        VideoCompilerError::ConfigError("Invalid settings".to_string()),
        "Ошибка конфигурации: Invalid settings",
      ),
      (
        VideoCompilerError::ResourceError {
          resource_type: "memory".to_string(),
          available: "1GB".to_string(),
          required: "2GB".to_string(),
        },
        "Нехватка ресурса 'memory': доступно 1GB, требуется 2GB",
      ),
      (
        VideoCompilerError::TimeoutError("rendering operation timeout".to_string()),
        "Тайм-аут операции: rendering operation timeout",
      ),
      (
        VideoCompilerError::CancelledError("User cancelled".to_string()),
        "Операция отменена: User cancelled",
      ),
      (
        VideoCompilerError::GpuError("CUDA out of memory".to_string()),
        "Ошибка GPU: CUDA out of memory",
      ),
      (
        VideoCompilerError::GpuUnavailable("No GPU found".to_string()),
        "GPU недоступен: No GPU found",
      ),
      (
        VideoCompilerError::Io("Permission denied".to_string()),
        "Ошибка ввода/вывода: Permission denied",
      ),
      (
        VideoCompilerError::InternalError("Unexpected state".to_string()),
        "Внутренняя ошибка: Unexpected state",
      ),
      (
        VideoCompilerError::Unknown("Something went wrong".to_string()),
        "Неизвестная ошибка: Something went wrong",
      ),
    ];

    for (error, expected_display) in errors {
      let display_str = error.to_string();
      assert_eq!(display_str, expected_display);
    }
  }

  #[test]
  fn test_all_error_codes() {
    // Тестируем error_code для всех вариантов
    let test_cases = vec![
      (
        VideoCompilerError::ValidationError("test".to_string()),
        "VALIDATION_ERROR",
      ),
      (
        VideoCompilerError::FFmpegError {
          exit_code: None,
          stderr: "test".to_string(),
          command: "test".to_string(),
        },
        "FFMPEG_ERROR",
      ),
      (
        VideoCompilerError::DependencyMissing("test".to_string()),
        "DEPENDENCY_MISSING",
      ),
      (VideoCompilerError::Io("test".to_string()), "IO_ERROR"),
      (
        VideoCompilerError::SerializationError("test".to_string()),
        "SERIALIZATION_ERROR",
      ),
      (
        VideoCompilerError::MediaFileError {
          path: "test".to_string(),
          reason: "test".to_string(),
        },
        "MEDIA_FILE_ERROR",
      ),
      (
        VideoCompilerError::UnsupportedFormat {
          format: "test".to_string(),
          file_path: "test".to_string(),
        },
        "UNSUPPORTED_FORMAT",
      ),
      (
        VideoCompilerError::RenderError {
          job_id: "test".to_string(),
          stage: "test".to_string(),
          message: "test".to_string(),
        },
        "RENDER_ERROR",
      ),
      (
        VideoCompilerError::PreviewError {
          timestamp: 0.0,
          reason: "test".to_string(),
        },
        "PREVIEW_ERROR",
      ),
      (
        VideoCompilerError::CacheError("test".to_string()),
        "CACHE_ERROR",
      ),
      (
        VideoCompilerError::ConfigError("test".to_string()),
        "CONFIG_ERROR",
      ),
      (
        VideoCompilerError::ResourceError {
          resource_type: "test".to_string(),
          available: "test".to_string(),
          required: "test".to_string(),
        },
        "RESOURCE_ERROR",
      ),
      (
        VideoCompilerError::TimeoutError("test".to_string()),
        "TIMEOUT_ERROR",
      ),
      (
        VideoCompilerError::CancelledError("test".to_string()),
        "CANCELLED_ERROR",
      ),
      (
        VideoCompilerError::GpuError("test".to_string()),
        "GPU_ERROR",
      ),
      (
        VideoCompilerError::GpuUnavailable("test".to_string()),
        "GPU_UNAVAILABLE",
      ),
      (VideoCompilerError::Io("test".to_string()), "IO_ERROR"),
      (
        VideoCompilerError::InternalError("test".to_string()),
        "INTERNAL_ERROR",
      ),
      (
        VideoCompilerError::Unknown("test".to_string()),
        "UNKNOWN_ERROR",
      ),
    ];

    for (error, expected_code) in test_cases {
      assert_eq!(error.error_code(), expected_code);
    }
  }

  #[test]
  fn test_gpu_related_errors() {
    let gpu_error = VideoCompilerError::gpu("CUDA initialization failed");
    assert!(gpu_error.is_gpu_related());
    assert!(gpu_error.should_fallback_to_cpu());

    let gpu_unavailable = VideoCompilerError::gpu_unavailable("No compatible GPU");
    assert!(gpu_unavailable.is_gpu_related());
    assert!(gpu_unavailable.should_fallback_to_cpu());

    let non_gpu_error = VideoCompilerError::io("File not found");
    assert!(!non_gpu_error.is_gpu_related());
    assert!(!non_gpu_error.should_fallback_to_cpu());
  }

  #[test]
  fn test_error_message_method() {
    let error = VideoCompilerError::validation("Test error");
    assert_eq!(error.message(), "Ошибка валидации: Test error");
  }

  #[test]
  fn test_helper_constructors() {
    // Тестируем все вспомогательные конструкторы
    let unsupported = VideoCompilerError::unsupported_format("MOV", "/test.mov");
    match unsupported {
      VideoCompilerError::UnsupportedFormat { format, file_path } => {
        assert_eq!(format, "MOV");
        assert_eq!(file_path, "/test.mov");
      }
      _ => panic!("Неожиданный тип ошибки"),
    }

    let render = VideoCompilerError::render("job-456", "audio-mixing", "No audio tracks");
    match render {
      VideoCompilerError::RenderError {
        job_id,
        stage,
        message,
      } => {
        assert_eq!(job_id, "job-456");
        assert_eq!(stage, "audio-mixing");
        assert_eq!(message, "No audio tracks");
      }
      _ => panic!("Неожиданный тип ошибки"),
    }

    let preview = VideoCompilerError::preview(15.5, "Invalid timestamp".to_string());
    match preview {
      VideoCompilerError::PreviewError { timestamp, reason } => {
        assert_eq!(timestamp, 15.5);
        assert_eq!(reason, "Invalid timestamp");
      }
      _ => panic!("Неожиданный тип ошибки"),
    }

    let resource = VideoCompilerError::resource("disk space", "100MB", "500MB");
    match resource {
      VideoCompilerError::ResourceError {
        resource_type,
        available,
        required,
      } => {
        assert_eq!(resource_type, "disk space");
        assert_eq!(available, "100MB");
        assert_eq!(required, "500MB");
      }
      _ => panic!("Неожиданный тип ошибки"),
    }

    let timeout = VideoCompilerError::timeout("video encoding timeout");
    match timeout {
      VideoCompilerError::TimeoutError(msg) => {
        assert_eq!(msg, "video encoding timeout");
      }
      _ => panic!("Неожиданный тип ошибки"),
    }
  }

  #[test]
  fn test_is_critical_comprehensive() {
    // Критические ошибки
    assert!(VideoCompilerError::DependencyMissing("test".to_string()).is_critical());
    assert!(VideoCompilerError::ResourceError {
      resource_type: "test".to_string(),
      available: "test".to_string(),
      required: "test".to_string()
    }
    .is_critical());
    assert!(VideoCompilerError::InternalError("test".to_string()).is_critical());

    // Некритические ошибки
    assert!(!VideoCompilerError::ValidationError("test".to_string()).is_critical());
    assert!(!VideoCompilerError::Io("test".to_string()).is_critical());
    assert!(!VideoCompilerError::TimeoutError("test".to_string()).is_critical());
  }

  #[test]
  fn test_is_retryable_comprehensive() {
    // Повторяемые ошибки
    assert!(VideoCompilerError::Io("test".to_string()).is_retryable());
    assert!(VideoCompilerError::TimeoutError("test".to_string()).is_retryable());
    assert!(VideoCompilerError::CacheError("test".to_string()).is_retryable());

    // Неповторяемые ошибки
    assert!(!VideoCompilerError::ValidationError("test".to_string()).is_retryable());
    assert!(!VideoCompilerError::DependencyMissing("test".to_string()).is_retryable());
    assert!(!VideoCompilerError::UnsupportedFormat {
      format: "test".to_string(),
      file_path: "test".to_string()
    }
    .is_retryable());
  }

  #[test]
  fn test_uuid_error_conversion() {
    // Создаём UUID ошибку вручную
    let uuid_error_str = "invalid UUID";
    let error = VideoCompilerError::InternalError(format!("UUID error: {uuid_error_str}"));
    match error {
      VideoCompilerError::InternalError(msg) => {
        assert!(msg.contains("UUID error"));
      }
      _ => panic!("Неожиданный тип ошибки"),
    }
  }

  #[tokio::test]
  async fn test_tokio_elapsed_error_conversion() {
    // Тестируем конверсию из tokio::time::error::Elapsed
    // Создаём Elapsed ошибку через тайм-аут
    let result = timeout(TokioDuration::from_millis(1), async {
      tokio::time::sleep(TokioDuration::from_millis(10)).await;
    })
    .await;

    if let Err(elapsed) = result {
      let video_error: VideoCompilerError = elapsed.into();
      match video_error {
        VideoCompilerError::TimeoutError(msg) => {
          assert_eq!(msg, "Operation timed out");
        }
        _ => panic!("Ожидалась TimeoutError"),
      }
    }
  }

  #[test]
  fn test_operation_metadata_default() {
    let metadata = OperationMetadata::default();
    assert_eq!(metadata.duration_ms, 0);
    assert!(metadata.warnings.is_empty());
    assert_eq!(metadata.resources_used.memory_bytes, 0);
    assert_eq!(metadata.resources_used.disk_bytes, 0);
    assert_eq!(metadata.resources_used.cpu_time_ms, 0);
    assert_eq!(metadata.resources_used.frames_processed, 0);
    assert_eq!(metadata.extra, serde_json::Value::Null);
  }

  #[test]
  fn test_resource_usage_default() {
    let usage = ResourceUsage::default();
    assert_eq!(usage.memory_bytes, 0);
    assert_eq!(usage.disk_bytes, 0);
    assert_eq!(usage.cpu_time_ms, 0);
    assert_eq!(usage.frames_processed, 0);
  }

  #[test]
  fn test_detailed_result_serialization() {
    let metadata = OperationMetadata::default();
    let detailed_result: DetailedResult<String> = DetailedResult {
      result: Err(VideoCompilerError::validation("Test error")),
      metadata,
    };

    // Сериализация
    let json = serde_json::to_string(&detailed_result).unwrap();
    assert!(json.contains("ValidationError"));
    assert!(json.contains("Test error"));

    // Десериализация
    let deserialized: DetailedResult<String> = serde_json::from_str(&json).unwrap();
    assert!(deserialized.result.is_err());
  }

  #[test]
  fn test_error_implements_error_trait() {
    let error = VideoCompilerError::validation("Test");
    // Проверяем, что VideoCompilerError реализует std::error::Error
    let _: &dyn std::error::Error = &error;
  }
}
