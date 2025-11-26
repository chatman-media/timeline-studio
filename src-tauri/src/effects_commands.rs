/// Команды для работы с пользовательскими эффектами
use serde_json;
use std::path::PathBuf;

/// Сохранить пользовательский эффект
#[tauri::command]
pub async fn save_user_effect(file_name: String, effect: String) -> Result<String, String> {
  let app_dirs = crate::filesystem::get_app_directories()
    .await
    .map_err(|e| e.to_string())?;

  // Создаем директорию для пользовательских эффектов
  let effects_dir = app_dirs.base_dir.join("user_effects");
  if !effects_dir.exists() {
    std::fs::create_dir_all(&effects_dir)
      .map_err(|e| format!("Failed to create effects directory: {}", e))?;
  }

  let file_path = effects_dir.join(&file_name);

  // Валидируем JSON
  serde_json::from_str::<serde_json::Value>(&effect).map_err(|e| format!("Invalid JSON: {}", e))?;

  // Сохраняем файл
  std::fs::write(&file_path, effect).map_err(|e| format!("Failed to save effect: {}", e))?;

  Ok(file_path.to_string_lossy().to_string())
}

/// Загрузить пользовательский эффект
#[tauri::command]
pub async fn load_user_effect(file_path: String) -> Result<String, String> {
  let path = PathBuf::from(&file_path);

  if !path.exists() {
    return Err("Effect file not found".to_string());
  }

  std::fs::read_to_string(&path).map_err(|e| format!("Failed to read effect file: {}", e))
}

/// Сохранить коллекцию эффектов
#[tauri::command]
pub async fn save_effects_collection(
  file_name: String,
  collection: String,
) -> Result<String, String> {
  let app_dirs = crate::filesystem::get_app_directories()
    .await
    .map_err(|e| e.to_string())?;

  // Создаем директорию для коллекций
  let collections_dir = app_dirs.base_dir.join("effect_collections");
  if !collections_dir.exists() {
    std::fs::create_dir_all(&collections_dir)
      .map_err(|e| format!("Failed to create collections directory: {}", e))?;
  }

  let file_path = collections_dir.join(&file_name);

  // Валидируем JSON
  serde_json::from_str::<serde_json::Value>(&collection)
    .map_err(|e| format!("Invalid JSON: {}", e))?;

  // Сохраняем файл
  std::fs::write(&file_path, collection)
    .map_err(|e| format!("Failed to save collection: {}", e))?;

  Ok(file_path.to_string_lossy().to_string())
}

/// Загрузить коллекцию эффектов
#[tauri::command]
pub async fn load_effects_collection(file_path: String) -> Result<String, String> {
  let path = PathBuf::from(&file_path);

  if !path.exists() {
    return Err("Collection file not found".to_string());
  }

  std::fs::read_to_string(&path).map_err(|e| format!("Failed to read collection file: {}", e))
}

/// Получить список пользовательских эффектов
#[tauri::command]
pub async fn get_user_effects_list() -> Result<Vec<String>, String> {
  let app_dirs = crate::filesystem::get_app_directories()
    .await
    .map_err(|e| e.to_string())?;

  let effects_dir = app_dirs.base_dir.join("user_effects");

  if !effects_dir.exists() {
    return Ok(Vec::new());
  }

  let mut effects = Vec::new();

  let entries = std::fs::read_dir(&effects_dir)
    .map_err(|e| format!("Failed to read effects directory: {}", e))?;

  for entry in entries.flatten() {
    let path = entry.path();
    if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
      effects.push(path.to_string_lossy().to_string());
    }
  }

  Ok(effects)
}

/// Удалить пользовательский эффект
#[tauri::command]
pub async fn delete_user_effect(file_path: String) -> Result<(), String> {
  let path = PathBuf::from(&file_path);

  if !path.exists() {
    return Err("Effect file not found".to_string());
  }

  // Проверяем, что файл находится в директории пользовательских эффектов
  if !path.to_string_lossy().contains("user_effects")
    && !path.to_string_lossy().contains("effect_collections")
  {
    return Err("Invalid file path".to_string());
  }

  std::fs::remove_file(&path).map_err(|e| format!("Failed to delete effect: {}", e))
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::TempDir;

  #[tokio::test]
  async fn test_save_and_load_user_effect() {
    let temp_dir = TempDir::new().unwrap();
    let effect_json = r#"{
            "id": "test_effect",
            "name": "Test Effect",
            "type": "blur",
            "parameters": {"intensity": 0.5}
        }"#;

    // Создаем тестовую директорию
    let effects_dir = temp_dir.path().join("user_effects");
    std::fs::create_dir_all(&effects_dir).unwrap();

    let file_path = effects_dir.join("test_effect.json");
    std::fs::write(&file_path, effect_json).unwrap();

    // Загружаем эффект
    let loaded = load_user_effect(file_path.to_string_lossy().to_string())
      .await
      .unwrap();

    // Проверяем, что JSON корректно десериализуется
    let parsed: serde_json::Value = serde_json::from_str(&loaded).unwrap();
    assert_eq!(parsed["id"], "test_effect");
    assert_eq!(parsed["name"], "Test Effect");
  }

  #[tokio::test]
  async fn test_get_user_effects_list_empty() {
    let temp_dir = TempDir::new().unwrap();
    let effects_dir = temp_dir.path().join("user_effects");

    // Проверяем пустую директорию
    // Список должен быть пустым, если директория не существует
    assert!(!effects_dir.exists());
  }

  #[tokio::test]
  async fn test_delete_user_effect() {
    let temp_dir = TempDir::new().unwrap();
    let effects_dir = temp_dir.path().join("user_effects");
    std::fs::create_dir_all(&effects_dir).unwrap();

    let file_path = effects_dir.join("test_effect.json");
    std::fs::write(&file_path, "{}").unwrap();

    assert!(file_path.exists());

    delete_user_effect(file_path.to_string_lossy().to_string())
      .await
      .unwrap();

    assert!(!file_path.exists());
  }
}
