//! Serde helper functions for custom serialization/deserialization

use serde::{Deserialize, Deserializer, Serializer};

/// Serialize u64 as string for TypeScript compatibility
///
/// JavaScript's Number type can only safely represent integers up to 2^53-1,
/// so we serialize large numbers as strings to avoid precision loss
pub fn serialize_u64_as_string<S>(value: &u64, serializer: S) -> Result<S::Ok, S::Error>
where
  S: Serializer,
{
  serializer.serialize_str(&value.to_string())
}

/// Deserialize u64 from string
pub fn deserialize_u64_from_string<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
  D: Deserializer<'de>,
{
  let s = String::deserialize(deserializer)?;
  s.parse::<u64>().map_err(serde::de::Error::custom)
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde::{Deserialize, Serialize};

  #[derive(Serialize, Deserialize, Debug, PartialEq)]
  struct TestStruct {
    #[serde(serialize_with = "serialize_u64_as_string")]
    #[serde(deserialize_with = "deserialize_u64_from_string")]
    pub value: u64,
  }

  #[test]
  fn test_u64_serialization() {
    let test = TestStruct {
      value: 1234567890123456789,
    };

    let json = serde_json::to_string(&test).unwrap();
    assert_eq!(json, r#"{"value":"1234567890123456789"}"#);

    let deserialized: TestStruct = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized, test);
  }

  #[test]
  fn test_small_value() {
    let test = TestStruct { value: 42 };

    let json = serde_json::to_string(&test).unwrap();
    assert_eq!(json, r#"{"value":"42"}"#);

    let deserialized: TestStruct = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized, test);
  }

  #[test]
  fn test_zero() {
    let test = TestStruct { value: 0 };

    let json = serde_json::to_string(&test).unwrap();
    assert_eq!(json, r#"{"value":"0"}"#);

    let deserialized: TestStruct = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized, test);
  }

  #[test]
  fn test_max_u64() {
    let test = TestStruct {
      value: u64::MAX,
    };

    let json = serde_json::to_string(&test).unwrap();
    assert_eq!(json, r#"{"value":"18446744073709551615"}"#);

    let deserialized: TestStruct = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized, test);
  }

  #[test]
  fn test_invalid_string() {
    let json = r#"{"value":"not a number"}"#;
    let result: Result<TestStruct, _> = serde_json::from_str(json);
    assert!(result.is_err());
  }
}
