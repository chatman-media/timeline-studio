#[cfg(test)]
mod tests {
  use crate::additional_commands::*;

  // Поскольку команды требуют Tauri State, которое сложно мокировать в юнит-тестах,
  // мы тестируем только сериализацию структур данных

  #[test]
  fn test_encryption_key_result_serialization() {
    let result = EncryptionKeyResult {
      success: true,
      key_exists: true,
      key_length: 32,
      error: None,
    };

    let json = serde_json::to_string(&result).unwrap();
    assert!(json.contains("\"success\":true"));
    assert!(json.contains("\"key_exists\":true"));
    assert!(json.contains("\"key_length\":32"));
  }

  #[test]
  fn test_secure_storage_info_serialization() {
    let info = SecureStorageInfo {
      storage_version: "1.0.0".to_string(),
      encryption_algorithm: "AES-256-GCM".to_string(),
      key_strength: "256-bit".to_string(),
      storage_location: "test_location".to_string(),
      last_access: Some("2024-01-01T00:00:00Z".to_string()),
      data_integrity_check: true,
    };

    let json = serde_json::to_string(&info).unwrap();
    let deserialized: SecureStorageInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.storage_version, info.storage_version);
    assert_eq!(deserialized.encryption_algorithm, info.encryption_algorithm);
  }
}
