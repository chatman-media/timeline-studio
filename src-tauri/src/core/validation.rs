//! Input validation utilities
//!
//! Provides validation functions for user inputs to prevent invalid data
//! from entering the system (NaN, Infinity, out of range values, etc.)

use serde::{Deserialize, Serialize};

/// Validation error type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationError {
  /// Value is NaN
  NaN { field: String },
  /// Value is Infinity
  Infinity { field: String },
  /// Value is out of valid range
  OutOfRange {
    field: String,
    value: f64,
    min: f64,
    max: f64,
  },
  /// Value is negative when it should be positive
  Negative { field: String, value: f64 },
  /// Invalid string format
  InvalidFormat { field: String, reason: String },
}

impl std::fmt::Display for ValidationError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      ValidationError::NaN { field } => write!(f, "Field '{field}' is NaN"),
      ValidationError::Infinity { field } => write!(f, "Field '{field}' is Infinity"),
      ValidationError::OutOfRange {
        field,
        value,
        min,
        max,
      } => write!(
        f,
        "Field '{field}' value {value} is out of range [{min}, {max}]"
      ),
      ValidationError::Negative { field, value } => {
        write!(f, "Field '{field}' value {value} is negative")
      }
      ValidationError::InvalidFormat { field, reason } => {
        write!(f, "Field '{field}' has invalid format: {reason}")
      }
    }
  }
}

impl std::error::Error for ValidationError {}

/// Validation result type
pub type ValidationResult<T> = Result<T, ValidationError>;

/// Numeric input validator
pub struct InputValidator;

impl InputValidator {
  /// Validate f32 value is finite (not NaN or Infinity)
  pub fn validate_finite_f32(value: f32, field: &str) -> ValidationResult<f32> {
    if value.is_nan() {
      return Err(ValidationError::NaN {
        field: field.to_string(),
      });
    }

    if value.is_infinite() {
      return Err(ValidationError::Infinity {
        field: field.to_string(),
      });
    }

    Ok(value)
  }

  /// Validate f64 value is finite (not NaN or Infinity)
  pub fn validate_finite_f64(value: f64, field: &str) -> ValidationResult<f64> {
    if value.is_nan() {
      return Err(ValidationError::NaN {
        field: field.to_string(),
      });
    }

    if value.is_infinite() {
      return Err(ValidationError::Infinity {
        field: field.to_string(),
      });
    }

    Ok(value)
  }

  /// Validate f32 value is in range [min, max]
  pub fn validate_range_f32(
    value: f32,
    min: f32,
    max: f32,
    field: &str,
  ) -> ValidationResult<f32> {
    // First check if finite
    Self::validate_finite_f32(value, field)?;

    if value < min || value > max {
      return Err(ValidationError::OutOfRange {
        field: field.to_string(),
        value: value as f64,
        min: min as f64,
        max: max as f64,
      });
    }

    Ok(value)
  }

  /// Validate f64 value is in range [min, max]
  pub fn validate_range_f64(
    value: f64,
    min: f64,
    max: f64,
    field: &str,
  ) -> ValidationResult<f64> {
    // First check if finite
    Self::validate_finite_f64(value, field)?;

    if value < min || value > max {
      return Err(ValidationError::OutOfRange {
        field: field.to_string(),
        value,
        min,
        max,
      });
    }

    Ok(value)
  }

  /// Validate f32 value is non-negative (>= 0)
  pub fn validate_non_negative_f32(value: f32, field: &str) -> ValidationResult<f32> {
    Self::validate_finite_f32(value, field)?;

    if value < 0.0 {
      return Err(ValidationError::Negative {
        field: field.to_string(),
        value: value as f64,
      });
    }

    Ok(value)
  }

  /// Validate f64 value is non-negative (>= 0)
  pub fn validate_non_negative_f64(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_finite_f64(value, field)?;

    if value < 0.0 {
      return Err(ValidationError::Negative {
        field: field.to_string(),
        value,
      });
    }

    Ok(value)
  }

  /// Validate f32 value is positive (> 0)
  pub fn validate_positive_f32(value: f32, field: &str) -> ValidationResult<f32> {
    Self::validate_finite_f32(value, field)?;

    if value <= 0.0 {
      return Err(ValidationError::Negative {
        field: field.to_string(),
        value: value as f64,
      });
    }

    Ok(value)
  }

  /// Validate f64 value is positive (> 0)
  pub fn validate_positive_f64(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_finite_f64(value, field)?;

    if value <= 0.0 {
      return Err(ValidationError::Negative {
        field: field.to_string(),
        value,
      });
    }

    Ok(value)
  }

  /// Validate timestamp is valid for timeline
  ///
  /// Checks:
  /// - Must be finite
  /// - Must be non-negative
  /// - Must not exceed max timeline duration (24 hours)
  pub fn validate_timestamp(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_non_negative_f64(value, field)?;

    // Max 24 hours
    const MAX_TIMELINE_DURATION: f64 = 24.0 * 60.0 * 60.0;

    if value > MAX_TIMELINE_DURATION {
      return Err(ValidationError::OutOfRange {
        field: field.to_string(),
        value,
        min: 0.0,
        max: MAX_TIMELINE_DURATION,
      });
    }

    Ok(value)
  }

  /// Validate duration is valid
  ///
  /// Checks:
  /// - Must be finite
  /// - Must be positive (> 0)
  /// - Must not exceed max duration (24 hours)
  pub fn validate_duration(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_positive_f64(value, field)?;

    const MAX_DURATION: f64 = 24.0 * 60.0 * 60.0;

    if value > MAX_DURATION {
      return Err(ValidationError::OutOfRange {
        field: field.to_string(),
        value,
        min: 0.0,
        max: MAX_DURATION,
      });
    }

    Ok(value)
  }

  /// Validate playback rate
  ///
  /// Checks:
  /// - Must be finite
  /// - Must be positive
  /// - Must be in range [0.1, 10.0]
  pub fn validate_playback_rate(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_range_f64(value, 0.1, 10.0, field)
  }

  /// Validate volume level
  ///
  /// Checks:
  /// - Must be finite
  /// - Must be in range [0.0, 2.0] (0 = mute, 1 = normal, 2 = 200%)
  pub fn validate_volume(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_range_f64(value, 0.0, 2.0, field)
  }

  /// Validate pan value
  ///
  /// Checks:
  /// - Must be finite
  /// - Must be in range [-1.0, 1.0] (-1 = left, 0 = center, 1 = right)
  pub fn validate_pan(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_range_f64(value, -1.0, 1.0, field)
  }

  /// Validate opacity/alpha value
  ///
  /// Checks:
  /// - Must be finite
  /// - Must be in range [0.0, 1.0]
  pub fn validate_opacity(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_range_f64(value, 0.0, 1.0, field)
  }

  /// Validate percentage value
  ///
  /// Checks:
  /// - Must be finite
  /// - Must be in range [0.0, 100.0]
  pub fn validate_percentage(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_range_f64(value, 0.0, 100.0, field)
  }

  /// Validate frame rate
  ///
  /// Checks:
  /// - Must be finite
  /// - Must be positive
  /// - Must be in range [1.0, 240.0]
  pub fn validate_frame_rate(value: f64, field: &str) -> ValidationResult<f64> {
    Self::validate_range_f64(value, 1.0, 240.0, field)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_finite_validation() {
    // Valid values
    assert!(InputValidator::validate_finite_f32(1.0, "test").is_ok());
    assert!(InputValidator::validate_finite_f64(1.0, "test").is_ok());

    // NaN should fail
    assert!(InputValidator::validate_finite_f32(f32::NAN, "test").is_err());
    assert!(InputValidator::validate_finite_f64(f64::NAN, "test").is_err());

    // Infinity should fail
    assert!(InputValidator::validate_finite_f32(f32::INFINITY, "test").is_err());
    assert!(InputValidator::validate_finite_f64(f64::INFINITY, "test").is_err());
    assert!(InputValidator::validate_finite_f32(f32::NEG_INFINITY, "test").is_err());
    assert!(InputValidator::validate_finite_f64(f64::NEG_INFINITY, "test").is_err());
  }

  #[test]
  fn test_range_validation() {
    // Within range
    assert!(InputValidator::validate_range_f32(5.0, 0.0, 10.0, "test").is_ok());
    assert!(InputValidator::validate_range_f64(5.0, 0.0, 10.0, "test").is_ok());

    // Below range
    assert!(InputValidator::validate_range_f32(-1.0, 0.0, 10.0, "test").is_err());
    assert!(InputValidator::validate_range_f64(-1.0, 0.0, 10.0, "test").is_err());

    // Above range
    assert!(InputValidator::validate_range_f32(11.0, 0.0, 10.0, "test").is_err());
    assert!(InputValidator::validate_range_f64(11.0, 0.0, 10.0, "test").is_err());

    // NaN should fail
    assert!(InputValidator::validate_range_f32(f32::NAN, 0.0, 10.0, "test").is_err());
    assert!(InputValidator::validate_range_f64(f64::NAN, 0.0, 10.0, "test").is_err());
  }

  #[test]
  fn test_non_negative_validation() {
    // Non-negative values
    assert!(InputValidator::validate_non_negative_f32(0.0, "test").is_ok());
    assert!(InputValidator::validate_non_negative_f32(5.0, "test").is_ok());
    assert!(InputValidator::validate_non_negative_f64(0.0, "test").is_ok());
    assert!(InputValidator::validate_non_negative_f64(5.0, "test").is_ok());

    // Negative values should fail
    assert!(InputValidator::validate_non_negative_f32(-1.0, "test").is_err());
    assert!(InputValidator::validate_non_negative_f64(-1.0, "test").is_err());
  }

  #[test]
  fn test_positive_validation() {
    // Positive values
    assert!(InputValidator::validate_positive_f32(0.1, "test").is_ok());
    assert!(InputValidator::validate_positive_f64(0.1, "test").is_ok());

    // Zero should fail
    assert!(InputValidator::validate_positive_f32(0.0, "test").is_err());
    assert!(InputValidator::validate_positive_f64(0.0, "test").is_err());

    // Negative values should fail
    assert!(InputValidator::validate_positive_f32(-1.0, "test").is_err());
    assert!(InputValidator::validate_positive_f64(-1.0, "test").is_err());
  }

  #[test]
  fn test_timestamp_validation() {
    // Valid timestamps
    assert!(InputValidator::validate_timestamp(0.0, "test").is_ok());
    assert!(InputValidator::validate_timestamp(60.0, "test").is_ok());
    assert!(InputValidator::validate_timestamp(3600.0, "test").is_ok());

    // Negative should fail
    assert!(InputValidator::validate_timestamp(-1.0, "test").is_err());

    // Exceeding 24 hours should fail
    assert!(InputValidator::validate_timestamp(24.0 * 60.0 * 60.0 + 1.0, "test").is_err());

    // NaN should fail
    assert!(InputValidator::validate_timestamp(f64::NAN, "test").is_err());
  }

  #[test]
  fn test_duration_validation() {
    // Valid durations
    assert!(InputValidator::validate_duration(1.0, "test").is_ok());
    assert!(InputValidator::validate_duration(60.0, "test").is_ok());

    // Zero should fail (duration must be positive)
    assert!(InputValidator::validate_duration(0.0, "test").is_err());

    // Negative should fail
    assert!(InputValidator::validate_duration(-1.0, "test").is_err());

    // Exceeding max should fail
    assert!(InputValidator::validate_duration(25.0 * 60.0 * 60.0, "test").is_err());
  }

  #[test]
  fn test_playback_rate_validation() {
    // Valid rates
    assert!(InputValidator::validate_playback_rate(0.5, "test").is_ok());
    assert!(InputValidator::validate_playback_rate(1.0, "test").is_ok());
    assert!(InputValidator::validate_playback_rate(2.0, "test").is_ok());

    // Below min should fail
    assert!(InputValidator::validate_playback_rate(0.05, "test").is_err());

    // Above max should fail
    assert!(InputValidator::validate_playback_rate(11.0, "test").is_err());

    // NaN should fail
    assert!(InputValidator::validate_playback_rate(f64::NAN, "test").is_err());
  }

  #[test]
  fn test_volume_validation() {
    // Valid volumes
    assert!(InputValidator::validate_volume(0.0, "test").is_ok());
    assert!(InputValidator::validate_volume(1.0, "test").is_ok());
    assert!(InputValidator::validate_volume(2.0, "test").is_ok());

    // Below min should fail
    assert!(InputValidator::validate_volume(-0.1, "test").is_err());

    // Above max should fail
    assert!(InputValidator::validate_volume(2.1, "test").is_err());
  }

  #[test]
  fn test_pan_validation() {
    // Valid pan values
    assert!(InputValidator::validate_pan(-1.0, "test").is_ok());
    assert!(InputValidator::validate_pan(0.0, "test").is_ok());
    assert!(InputValidator::validate_pan(1.0, "test").is_ok());

    // Out of range should fail
    assert!(InputValidator::validate_pan(-1.1, "test").is_err());
    assert!(InputValidator::validate_pan(1.1, "test").is_err());
  }

  #[test]
  fn test_opacity_validation() {
    // Valid opacity
    assert!(InputValidator::validate_opacity(0.0, "test").is_ok());
    assert!(InputValidator::validate_opacity(0.5, "test").is_ok());
    assert!(InputValidator::validate_opacity(1.0, "test").is_ok());

    // Out of range should fail
    assert!(InputValidator::validate_opacity(-0.1, "test").is_err());
    assert!(InputValidator::validate_opacity(1.1, "test").is_err());
  }

  #[test]
  fn test_percentage_validation() {
    // Valid percentages
    assert!(InputValidator::validate_percentage(0.0, "test").is_ok());
    assert!(InputValidator::validate_percentage(50.0, "test").is_ok());
    assert!(InputValidator::validate_percentage(100.0, "test").is_ok());

    // Out of range should fail
    assert!(InputValidator::validate_percentage(-1.0, "test").is_err());
    assert!(InputValidator::validate_percentage(101.0, "test").is_err());
  }

  #[test]
  fn test_frame_rate_validation() {
    // Valid frame rates
    assert!(InputValidator::validate_frame_rate(24.0, "test").is_ok());
    assert!(InputValidator::validate_frame_rate(30.0, "test").is_ok());
    assert!(InputValidator::validate_frame_rate(60.0, "test").is_ok());
    assert!(InputValidator::validate_frame_rate(120.0, "test").is_ok());

    // Below min should fail
    assert!(InputValidator::validate_frame_rate(0.5, "test").is_err());

    // Above max should fail
    assert!(InputValidator::validate_frame_rate(300.0, "test").is_err());

    // NaN should fail
    assert!(InputValidator::validate_frame_rate(f64::NAN, "test").is_err());
  }

  #[test]
  fn test_error_messages() {
    let err = InputValidator::validate_finite_f32(f32::NAN, "test_field");
    assert!(err.is_err());
    let err_msg = err.unwrap_err().to_string();
    assert!(err_msg.contains("test_field"));
    assert!(err_msg.contains("NaN"));

    let err = InputValidator::validate_range_f64(150.0, 0.0, 100.0, "percentage");
    assert!(err.is_err());
    let err_msg = err.unwrap_err().to_string();
    assert!(err_msg.contains("percentage"));
    assert!(err_msg.contains("150"));
    assert!(err_msg.contains("out of range"));
  }
}
