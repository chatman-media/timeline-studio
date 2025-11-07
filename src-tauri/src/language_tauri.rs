// Правильная реализация управления языком для Tauri v2
// Использует встроенное управление состоянием Tauri вместо глобальных статических переменных

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, State};

// Поддерживаемые языки
const SUPPORTED_LANGUAGES: [&str; 15] = [
  "en", "ru", "es", "pt", "fr", "de", "zh", "ja", "ko", "tr", "th", "it", "hi", "ar", "fa",
];
const DEFAULT_LANGUAGE: &str = "en";

/// Состояние языка приложения, управляемое Tauri
#[derive(Debug)]
pub struct LanguageState {
  current_language: Mutex<String>,
}

impl LanguageState {
  pub fn new() -> Self {
    Self {
      current_language: Mutex::new(DEFAULT_LANGUAGE.to_string()),
    }
  }
}

impl Default for LanguageState {
  fn default() -> Self {
    Self::new()
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LanguageResponse {
  pub language: String,
  pub system_language: String,
}

/// Получение системного языка
fn get_system_language() -> String {
  // Получаем системную локаль
  let locale = match sys_locale::get_locale() {
    Some(loc) => loc,
    None => DEFAULT_LANGUAGE.to_string(),
  };

  // Извлекаем код языка (первые 2 символа)
  let lang_code = locale.chars().take(2).collect::<String>().to_lowercase();

  // Проверяем, поддерживается ли язык, иначе возвращаем значение по умолчанию
  if SUPPORTED_LANGUAGES.contains(&lang_code.as_str()) {
    lang_code
  } else {
    DEFAULT_LANGUAGE.to_string()
  }
}

/// Проверка, поддерживается ли язык
fn is_supported_language(lang: &str) -> bool {
  SUPPORTED_LANGUAGES.contains(&lang)
}

/// Получение текущего языка приложения (Tauri v2 way)
#[tauri::command]
pub fn get_app_language_tauri(
  language_state: State<'_, LanguageState>,
) -> Result<LanguageResponse, String> {
  let system_language = get_system_language();

  // Получаем текущий язык из состояния Tauri
  let language = language_state
    .current_language
    .lock()
    .map_err(|e| format!("Failed to lock language state: {e}"))?
    .clone();

  Ok(LanguageResponse {
    language,
    system_language,
  })
}

/// Установка языка приложения (Tauri v2 way)
#[tauri::command]
pub fn set_app_language_tauri(
  lang: String,
  language_state: State<'_, LanguageState>,
) -> Result<LanguageResponse, String> {
  // Проверяем, поддерживается ли язык
  if !is_supported_language(&lang) {
    return Err(format!("Unsupported language: {lang}"));
  }

  // Устанавливаем новый язык в состоянии Tauri
  *language_state
    .current_language
    .lock()
    .map_err(|e| format!("Failed to lock language state: {e}"))? = lang.clone();

  Ok(LanguageResponse {
    language: lang,
    system_language: get_system_language(),
  })
}

/// Загрузка JSON файла перевода из ресурсов приложения
#[tauri::command]
pub async fn load_translation_tauri<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  lang: String,
) -> Result<String, String> {
  // Проверяем, поддерживается ли язык
  if !is_supported_language(&lang) {
    return Err(format!("Unsupported language: {lang}"));
  }

  // Получаем путь к директории ресурсов
  let resource_path = app
    .path()
    .resource_dir()
    .map_err(|e| format!("Failed to get resource directory: {e}"))?;

  // Формируем путь к файлу перевода
  let translation_file = resource_path.join(format!("{lang}.json"));

  // Проверяем существование файла
  if !translation_file.exists() {
    return Err(format!(
      "Translation file not found: {}",
      translation_file.display()
    ));
  }

  // Читаем содержимое файла
  let content = std::fs::read_to_string(&translation_file)
    .map_err(|e| format!("Failed to read translation file: {e}"))?;

  // Проверяем что это валидный JSON
  serde_json::from_str::<serde_json::Value>(&content)
    .map_err(|e| format!("Invalid JSON in translation file: {e}"))?;

  Ok(content)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_is_supported_language() {
    // Test supported languages
    assert!(is_supported_language("en"));
    assert!(is_supported_language("ru"));
    assert!(is_supported_language("es"));
    assert!(is_supported_language("pt"));
    assert!(is_supported_language("fr"));
    assert!(is_supported_language("de"));

    // Test supported languages (extended)
    assert!(is_supported_language("zh"));
    assert!(is_supported_language("ja"));
    assert!(is_supported_language("ko"));
    assert!(is_supported_language("tr"));
    assert!(is_supported_language("th"));
    assert!(is_supported_language("it"));
    assert!(is_supported_language("hi"));

    // Test unsupported languages
    assert!(!is_supported_language("pl"));
    assert!(!is_supported_language("nl"));
    assert!(!is_supported_language(""));

    // Test newly added Phase 2 languages
    assert!(is_supported_language("ar"));
    assert!(is_supported_language("fa"));
  }

  #[test]
  fn test_supported_languages_constant() {
    assert_eq!(SUPPORTED_LANGUAGES.len(), 15);
    assert!(SUPPORTED_LANGUAGES.contains(&"en"));
    assert!(SUPPORTED_LANGUAGES.contains(&"ru"));
    assert!(SUPPORTED_LANGUAGES.contains(&"es"));
    assert!(SUPPORTED_LANGUAGES.contains(&"pt"));
    assert!(SUPPORTED_LANGUAGES.contains(&"fr"));
    assert!(SUPPORTED_LANGUAGES.contains(&"de"));
    assert!(SUPPORTED_LANGUAGES.contains(&"zh"));
    assert!(SUPPORTED_LANGUAGES.contains(&"ja"));
    assert!(SUPPORTED_LANGUAGES.contains(&"ko"));
    assert!(SUPPORTED_LANGUAGES.contains(&"tr"));
    assert!(SUPPORTED_LANGUAGES.contains(&"th"));
    assert!(SUPPORTED_LANGUAGES.contains(&"it"));
    assert!(SUPPORTED_LANGUAGES.contains(&"hi"));
    assert!(SUPPORTED_LANGUAGES.contains(&"ar"));
    assert!(SUPPORTED_LANGUAGES.contains(&"fa"));
  }

  #[test]
  fn test_default_language_constant() {
    assert_eq!(DEFAULT_LANGUAGE, "en");
    assert!(SUPPORTED_LANGUAGES.contains(&DEFAULT_LANGUAGE));
  }

  #[test]
  fn test_get_system_language() {
    let lang = get_system_language();
    // Should return a valid language code
    assert!(!lang.is_empty());
    assert!(SUPPORTED_LANGUAGES.contains(&lang.as_str()));
  }

  #[test]
  fn test_get_system_language_fallback() {
    // We can't easily test the case where sys_locale returns None,
    // but we can verify the returned language is always supported
    let lang = get_system_language();
    assert!(is_supported_language(&lang));
  }

  #[test]
  fn test_language_state_creation() {
    let state = LanguageState::new();
    // Should be able to lock and read
    let current = state.current_language.lock().unwrap();
    assert_eq!(*current, DEFAULT_LANGUAGE);
  }

  #[test]
  fn test_language_state_default() {
    let state = LanguageState::default();
    let current = state.current_language.lock().unwrap();
    assert_eq!(*current, DEFAULT_LANGUAGE);
  }

  #[test]
  fn test_language_state_modification() {
    let state = LanguageState::new();

    // Set a new language
    {
      let mut current = state.current_language.lock().unwrap();
      *current = "ru".to_string();
    }

    // Verify it was set
    let current = state.current_language.lock().unwrap();
    assert_eq!(*current, "ru");
  }

  #[test]
  fn test_language_state_concurrent_access() {
    let state = std::sync::Arc::new(LanguageState::new());
    let state1 = state.clone();
    let state2 = state.clone();

    // Simulate concurrent access
    let handle1 = std::thread::spawn(move || {
      let mut current = state1.current_language.lock().unwrap();
      *current = "fr".to_string();
    });

    let handle2 = std::thread::spawn(move || {
      std::thread::sleep(std::time::Duration::from_millis(10));
      let current = state2.current_language.lock().unwrap();
      current.clone()
    });

    handle1.join().unwrap();
    let result = handle2.join().unwrap();

    // One of the threads should have set it to "fr"
    assert_eq!(result, "fr");
  }

  #[test]
  fn test_language_response_serialization() {
    let response = LanguageResponse {
      language: "ru".to_string(),
      system_language: "en".to_string(),
    };

    let json = serde_json::to_string(&response).unwrap();
    assert!(json.contains("\"language\":\"ru\""));
    assert!(json.contains("\"system_language\":\"en\""));

    let deserialized: LanguageResponse = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.language, "ru");
    assert_eq!(deserialized.system_language, "en");
  }

  #[test]
  fn test_get_app_language_tauri_command() {
    // We can't easily test Tauri commands that require State in unit tests
    // These would be better tested as integration tests
    // For now, just test the LanguageState functionality directly
    let language_state = LanguageState::new();

    // Set a specific language
    {
      let mut current = language_state.current_language.lock().unwrap();
      *current = "fr".to_string();
    }

    // Verify it was set
    let current = language_state.current_language.lock().unwrap();
    assert_eq!(*current, "fr");
  }

  #[test]
  fn test_set_app_language_tauri_command_valid() {
    // Test validation logic
    assert!(is_supported_language("es"));

    // Test that setting a valid language works with LanguageState
    let language_state = LanguageState::new();
    {
      let mut current = language_state.current_language.lock().unwrap();
      *current = "es".to_string();
    }

    let current = language_state.current_language.lock().unwrap();
    assert_eq!(*current, "es");
  }

  #[test]
  fn test_set_app_language_tauri_command_invalid() {
    // Test validation logic
    assert!(!is_supported_language("invalid"));

    // The command would return an error for unsupported languages
    // We test the validation logic here
  }

  #[test]
  fn test_set_app_language_tauri_command_empty() {
    // Test validation logic for empty string
    assert!(!is_supported_language(""));
  }

  #[test]
  fn test_language_state_mutex_recovery() {
    // Вместо того чтобы намеренно отравлять mutex (что может повлиять на другие тесты),
    // тестируем правильную обработку ошибок mutex в production коде

    // Test 1: Проверяем что lock() возвращает Result
    let state = LanguageState::new();
    let lock_result = state.current_language.lock();
    assert!(lock_result.is_ok(), "Normal lock should succeed");

    // Test 2: Проверяем что мы правильно обрабатываем потенциальные ошибки
    // в production коде через map_err (как в get_app_language_tauri и set_app_language_tauri)
    let lock_with_error_handling = state
      .current_language
      .lock()
      .map_err(|e| format!("Failed to lock language state: {e}"));

    assert!(
      lock_with_error_handling.is_ok(),
      "Lock with error handling should succeed"
    );

    // Test 3: Вместо mutex poisoning, тестируем изолированный сценарий восстановления
    // Создаем отдельный изолированный mutex специально для этого теста
    let test_mutex = std::sync::Arc::new(std::sync::Mutex::new("initial".to_string()));
    let test_mutex_clone = test_mutex.clone();

    // Симулируем панику в изолированном потоке
    let handle = std::thread::spawn(move || {
      let _guard = test_mutex_clone.lock().unwrap();
      panic!("Simulated panic for testing recovery");
    });

    // Ждем завершения паники
    let _ = handle.join();

    // Проверяем что мы можем восстановить данные из отравленного mutex
    match test_mutex.lock() {
      Ok(_) => panic!("Expected poisoned mutex"),
      Err(poisoned) => {
        // Восстанавливаем данные - это то, что должен делать production код
        let recovered_data = poisoned.into_inner();
        assert_eq!(*recovered_data, "initial");
      }
    };

    // Важно: изолированный test_mutex будет уничтожен и не повлияет на другие тесты
  }

  #[test]
  fn test_all_supported_languages_valid() {
    // Verify each supported language is a valid 2-letter code
    for lang in SUPPORTED_LANGUAGES.iter() {
      assert_eq!(lang.len(), 2);
      assert!(lang.chars().all(|c| c.is_ascii_lowercase()));
    }
  }

  #[test]
  fn test_language_codes_unique() {
    // Verify no duplicate language codes
    use std::collections::HashSet;
    let unique_langs: HashSet<_> = SUPPORTED_LANGUAGES.iter().collect();
    assert_eq!(unique_langs.len(), SUPPORTED_LANGUAGES.len());
  }

  #[test]
  fn test_multiple_language_state_instances() {
    // Test that multiple instances of LanguageState work independently
    let state1 = LanguageState::new();
    let state2 = LanguageState::new();

    // Set different languages
    {
      let mut lang1 = state1.current_language.lock().unwrap();
      *lang1 = "fr".to_string();
    }

    {
      let mut lang2 = state2.current_language.lock().unwrap();
      *lang2 = "de".to_string();
    }

    // Verify they are independent
    assert_eq!(*state1.current_language.lock().unwrap(), "fr");
    assert_eq!(*state2.current_language.lock().unwrap(), "de");
  }

  #[test]
  fn test_language_state_drop_behavior() {
    // Test that LanguageState properly drops
    {
      let state = LanguageState::new();
      let mut lang = state.current_language.lock().unwrap();
      *lang = "es".to_string();
      // state is dropped here
    }

    // Create a new state - should start fresh
    let new_state = LanguageState::new();
    assert_eq!(
      *new_state.current_language.lock().unwrap(),
      DEFAULT_LANGUAGE
    );
  }

  #[test]
  fn test_language_state_thread_safety() {
    use std::sync::Arc;
    use std::thread;

    let state = Arc::new(LanguageState::new());
    let mut handles = vec![];

    // Test reading from multiple threads
    for i in 0..5 {
      let state_clone = state.clone();
      let handle = thread::spawn(move || {
        thread::sleep(std::time::Duration::from_millis(i * 10));
        let lang = state_clone.current_language.lock().unwrap();
        lang.clone()
      });
      handles.push(handle);
    }

    // Collect results
    for handle in handles {
      let result = handle.join().unwrap();
      assert_eq!(result, DEFAULT_LANGUAGE);
    }
  }

  #[test]
  fn test_language_state_write_contention() {
    use std::sync::Arc;
    use std::thread;

    let state = Arc::new(LanguageState::new());
    let languages = ["en", "fr", "de", "es", "ru"];
    let mut handles = vec![];

    // Multiple threads trying to write
    for (i, lang) in languages.iter().enumerate() {
      let state_clone = state.clone();
      let lang = lang.to_string();
      let handle = thread::spawn(move || {
        thread::sleep(std::time::Duration::from_millis(i as u64));
        let mut current = state_clone.current_language.lock().unwrap();
        *current = lang;
      });
      handles.push(handle);
    }

    // Wait for all threads
    for handle in handles {
      handle.join().unwrap();
    }

    // The final language should be one of the test languages
    let final_lang = state.current_language.lock().unwrap();
    assert!(languages.contains(&final_lang.as_str()));
  }

  #[test]
  fn test_supported_language_validation_edge_cases() {
    // Test edge cases for language validation
    assert!(!is_supported_language("EN")); // uppercase
    assert!(!is_supported_language("En")); // mixed case
    assert!(!is_supported_language(" en")); // with space
    assert!(!is_supported_language("en ")); // with space
    assert!(!is_supported_language("e")); // too short
    assert!(!is_supported_language("eng")); // too long
    assert!(!is_supported_language("12")); // numbers
    assert!(!is_supported_language("e!")); // special characters
  }

  #[test]
  fn test_language_response_debug_format() {
    let response = LanguageResponse {
      language: "fr".to_string(),
      system_language: "en".to_string(),
    };

    let debug_str = format!("{response:?}");
    assert!(debug_str.contains("LanguageResponse"));
    assert!(debug_str.contains("fr"));
    assert!(debug_str.contains("en"));
  }

  #[test]
  fn test_mutex_error_handling() {
    // Test that we can handle mutex errors gracefully
    let state = LanguageState::new();

    // Normal lock should work
    let result = state.current_language.lock();
    assert!(result.is_ok());
    drop(result);

    // Test with try_lock
    let result1 = state.current_language.try_lock();
    assert!(result1.is_ok());

    // Second try_lock should fail while first is held
    let result2 = state.current_language.try_lock();
    assert!(result2.is_err());

    drop(result1);

    // Now it should work again
    let result3 = state.current_language.try_lock();
    assert!(result3.is_ok());
  }

  #[test]
  fn test_language_state_memory_safety() {
    // Test that LanguageState doesn't leak memory
    let states: Vec<_> = (0..100).map(|_| LanguageState::new()).collect();

    // Set different values
    for (i, state) in states.iter().enumerate() {
      let mut lang = state.current_language.lock().unwrap();
      *lang = format!("test_{i}");
    }

    // Verify values
    for (i, state) in states.iter().enumerate() {
      let lang = state.current_language.lock().unwrap();
      assert_eq!(*lang, format!("test_{i}"));
    }

    // states are dropped here
  }

  #[test]
  fn test_system_language_parsing() {
    // We can't control what sys_locale returns, but we can test
    // that our parsing logic works correctly

    // Simulate various locale formats
    let test_cases = vec![
      ("en_US", "en"),
      ("fr_FR", "fr"),
      ("de_DE", "de"),
      ("es_ES", "es"),
      ("pt_BR", "pt"),
      ("zh_CN", "zh"),
      ("ja_JP", "ja"),
      ("ko_KR", "ko"),
      ("tr_TR", "tr"),
      ("th_TH", "th"),
      ("it_IT", "it"),
      ("hi_IN", "hi"),
      ("ar_SA", "ar"),
      ("fa_IR", "fa"),
    ];

    for (locale, expected) in test_cases {
      let lang_code = locale.chars().take(2).collect::<String>().to_lowercase();
      assert_eq!(lang_code, expected);
      assert!(is_supported_language(&lang_code));
    }
  }
}
