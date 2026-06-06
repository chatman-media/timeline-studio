//! Общие error-типы для всех движков Timeline Studio.

use thiserror::Error;

/// Лёгкий общий error-тип, не тянущий тяжёлых зависимостей.
///
/// Используется как базовый `?`-конвертируемый тип в `ts-agent`,
/// `ts-analysis`, `ts-publish` и других крейтах.
#[derive(Debug, Error)]
pub enum CoreError {
    /// Операция введённых/выходных данных завершилась неудачно.
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    /// Ошибка сериализации/десериализации JSON.
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    /// Задача была отменена.
    #[error("Operation cancelled")]
    Cancelled,

    /// Превышен лимит времени ожидания.
    #[error("Operation timed out")]
    Timeout,

    /// Переданы некорректные входные данные.
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    /// Ресурс не найден.
    #[error("Not found: {0}")]
    NotFound(String),

    /// Произошла внутренняя ошибка.
    #[error("Internal error: {0}")]
    Internal(String),
}

impl CoreError {
    /// Удобный конструктор для [`CoreError::Internal`].
    pub fn internal(msg: impl Into<String>) -> Self {
        CoreError::Internal(msg.into())
    }

    /// Удобный конструктор для [`CoreError::InvalidInput`].
    pub fn invalid_input(msg: impl Into<String>) -> Self {
        CoreError::InvalidInput(msg.into())
    }

    /// Удобный конструктор для [`CoreError::NotFound`].
    pub fn not_found(msg: impl Into<String>) -> Self {
        CoreError::NotFound(msg.into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constructors() {
        let e = CoreError::internal("boom");
        assert!(e.to_string().contains("boom"));

        let e = CoreError::not_found("file.mp4");
        assert!(e.to_string().contains("file.mp4"));

        let e = CoreError::invalid_input("bad fps");
        assert!(e.to_string().contains("bad fps"));
    }

    #[test]
    fn from_io_error() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file missing");
        let core_err: CoreError = io_err.into();
        assert!(matches!(core_err, CoreError::Io(_)));
    }

    #[test]
    fn from_json_error() {
        let json_err = serde_json::from_str::<serde_json::Value>("{bad}").unwrap_err();
        let core_err: CoreError = json_err.into();
        assert!(matches!(core_err, CoreError::Json(_)));
    }

    #[test]
    fn cancel_and_timeout_display() {
        assert_eq!(CoreError::Cancelled.to_string(), "Operation cancelled");
        assert_eq!(CoreError::Timeout.to_string(), "Operation timed out");
    }
}
