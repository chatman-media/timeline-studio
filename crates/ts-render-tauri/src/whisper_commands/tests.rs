//! Тесты для модуля whisper_commands

use super::*;

// ============ Тесты бизнес-логики ============

#[test]
fn test_get_whisper_models_dir() {
  let result = get_whisper_models_dir();
  assert!(result.is_ok());

  let path = result.unwrap();
  assert!(path.to_string_lossy().contains(".timeline_studio"));
  assert!(path.to_string_lossy().contains("whisper_models"));
}

#[test]
fn test_get_whisper_model_path_valid_models() {
  let models = [
    ("whisper-tiny", "ggml-tiny.bin"),
    ("whisper-base", "ggml-base.bin"),
    ("whisper-small", "ggml-small.bin"),
    ("whisper-medium", "ggml-medium.bin"),
    ("whisper-large-v2", "ggml-large-v2.bin"),
    ("whisper-large-v3", "ggml-large-v3.bin"),
  ];

  for (model_name, expected_filename) in &models {
    let result = get_whisper_model_path(model_name);
    assert!(result.is_ok(), "Model {model_name} should be valid");

    let path = result.unwrap();
    assert!(path.to_string_lossy().ends_with(expected_filename));
  }
}

#[test]
fn test_get_whisper_model_path_invalid_model() {
  let result = get_whisper_model_path("invalid-model");
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("Неизвестная модель"));
}

#[test]
fn test_validate_transcription_params_valid() {
  let result = validate_transcription_params("sk-test123", "whisper-1", Some("en"), Some(0.5));
  assert!(result.is_ok());
}

#[test]
fn test_validate_transcription_params_empty_api_key() {
  let result = validate_transcription_params("", "whisper-1", None, None);
  assert!(result.is_err());
  assert!(result
    .unwrap_err()
    .contains("API ключ не может быть пустым"));
}

#[test]
fn test_validate_transcription_params_invalid_model() {
  let result = validate_transcription_params("sk-test", "invalid-model", None, None);
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("Неподдерживаемая модель"));
}

#[test]
fn test_validate_transcription_params_invalid_language() {
  let result = validate_transcription_params("sk-test", "whisper-1", Some("english"), None);
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("2 символов"));
}

#[test]
fn test_validate_transcription_params_invalid_temperature() {
  let result = validate_transcription_params("sk-test", "whisper-1", None, Some(3.0));
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("между 0.0 и 2.0"));
}

#[test]
fn test_generate_temp_audio_filename() {
  let filename = generate_temp_audio_filename("/path/to/video.mp4", "wav", 1234567890);

  assert_eq!(filename, "video_1234567890.wav");
}

#[test]
fn test_generate_temp_audio_filename_without_extension() {
  let filename = generate_temp_audio_filename("video_without_ext", "mp3", 9876543210);

  assert_eq!(filename, "video_without_ext_9876543210.mp3");
}

#[test]
fn test_check_local_whisper_availability() {
  // Этот тест проверяет, что функция работает без паники
  // и возвращает корректный boolean результат
  let _available = check_local_whisper_availability();
  // Функция должна завершиться без паники - это и есть успешный тест
}

#[test]
fn test_get_available_local_models() {
  let models = get_available_local_models();

  assert!(!models.is_empty());
  assert_eq!(models.len(), 5);

  // Проверяем, что все модели имеют необходимые поля
  for model in &models {
    assert!(!model.name.is_empty());
    assert!(!model.size.is_empty());
    assert!(!model.languages.is_empty());
    assert!(!model.is_downloaded); // По умолчанию не загружены
    assert!(model.download_url.is_some());
  }

  // Проверяем конкретные модели
  let tiny_model = models.iter().find(|m| m.name == "whisper-tiny").unwrap();
  assert_eq!(tiny_model.size, "39 MB");

  let large_model = models
    .iter()
    .find(|m| m.name == "whisper-large-v3")
    .unwrap();
  assert_eq!(large_model.size, "2.87 GB");
}

#[test]
fn test_parse_whisper_segments_empty() {
  let empty_json = serde_json::json!({});
  let segments = parse_whisper_segments(&empty_json);
  assert!(segments.is_empty());
}

#[test]
fn test_parse_whisper_segments_valid() {
  let whisper_json = serde_json::json!({
    "segments": [
      {
        "seek": 0,
        "start": 0.0,
        "end": 5.0,
        "text": "Hello world",
        "tokens": [1, 2, 3],
        "temperature": 0.0,
        "avg_logprob": -0.5,
        "compression_ratio": 1.2,
        "no_speech_prob": 0.1
      },
      {
        "seek": 1,
        "start": 5.0,
        "end": 10.0,
        "text": "Second segment",
        "tokens": [4, 5, 6],
        "temperature": 0.2,
        "avg_logprob": -0.7,
        "compression_ratio": 1.1,
        "no_speech_prob": 0.05
      }
    ]
  });

  let segments = parse_whisper_segments(&whisper_json);
  assert_eq!(segments.len(), 2);

  // Проверяем первый сегмент
  let first = &segments[0];
  assert_eq!(first.id, 0);
  assert_eq!(first.start, 0.0);
  assert_eq!(first.end, 5.0);
  assert_eq!(first.text, "Hello world");
  assert_eq!(first.tokens, vec![1, 2, 3]);

  // Проверяем второй сегмент
  let second = &segments[1];
  assert_eq!(second.id, 1);
  assert_eq!(second.start, 5.0);
  assert_eq!(second.end, 10.0);
  assert_eq!(second.text, "Second segment");
}

#[test]
fn test_convert_api_response_to_transcription_json() {
  let json_response = r#"{
    "text": "This is a test transcription",
    "segments": [
      {
        "seek": 0,
        "start": 0.0,
        "end": 3.0,
        "text": "This is a test",
        "tokens": [1, 2, 3],
        "temperature": 0.0,
        "avg_logprob": -0.5,
        "compression_ratio": 1.2,
        "no_speech_prob": 0.1
      }
    ]
  }"#;

  let result =
    convert_api_response_to_transcription(json_response, Some("en".to_string()), Some(10.0));

  assert!(result.is_ok());
  let transcription = result.unwrap();
  assert_eq!(transcription.text, "This is a test transcription");
  assert_eq!(transcription.language, Some("en".to_string()));
  assert_eq!(transcription.duration, Some(10.0));
  assert!(transcription.segments.is_some());
  assert_eq!(transcription.segments.unwrap().len(), 1);
}

#[test]
fn test_convert_api_response_to_transcription_plain_text() {
  let text_response = "Simple plain text transcription";

  let result =
    convert_api_response_to_transcription(text_response, Some("ru".to_string()), Some(5.0));

  assert!(result.is_ok());
  let transcription = result.unwrap();
  assert_eq!(transcription.text, "Simple plain text transcription");
  assert_eq!(transcription.language, Some("ru".to_string()));
  assert_eq!(transcription.duration, Some(5.0));
  assert!(transcription.segments.is_none());
  assert!(transcription.words.is_none());
}

// ============ Тесты сериализации ============

#[test]
fn test_whisper_segment_serialization() {
  let segment = WhisperSegment {
    id: 1,
    seek: 100,
    start: 1.5,
    end: 5.0,
    text: "Test segment".to_string(),
    tokens: vec![1, 2, 3, 4],
    temperature: 0.3,
    avg_logprob: -0.8,
    compression_ratio: 1.15,
    no_speech_prob: 0.05,
  };

  let serialized = serde_json::to_string(&segment).unwrap();
  let deserialized: WhisperSegment = serde_json::from_str(&serialized).unwrap();

  assert_eq!(segment.id, deserialized.id);
  assert_eq!(segment.text, deserialized.text);
  assert_eq!(segment.tokens, deserialized.tokens);
}

#[test]
fn test_whisper_transcription_result_serialization() {
  let result = WhisperTranscriptionResult {
    text: "Full transcription text".to_string(),
    language: Some("en".to_string()),
    duration: Some(30.5),
    segments: Some(vec![]),
    words: None,
  };

  let serialized = serde_json::to_string(&result).unwrap();
  let deserialized: WhisperTranscriptionResult = serde_json::from_str(&serialized).unwrap();

  assert_eq!(result.text, deserialized.text);
  assert_eq!(result.language, deserialized.language);
  assert_eq!(result.duration, deserialized.duration);
}

#[test]
fn test_local_whisper_model_serialization() {
  let model = LocalWhisperModel {
    name: "whisper-test".to_string(),
    size: "100 MB".to_string(),
    languages: vec!["en".to_string(), "ru".to_string()],
    path: Some("/path/to/model".to_string()),
    is_downloaded: true,
    download_url: Some("https://example.com/model".to_string()),
  };

  let serialized = serde_json::to_string(&model).unwrap();
  let deserialized: LocalWhisperModel = serde_json::from_str(&serialized).unwrap();

  assert_eq!(model.name, deserialized.name);
  assert_eq!(model.languages, deserialized.languages);
  assert_eq!(model.is_downloaded, deserialized.is_downloaded);
}

// ============ Интеграционные тесты ============

#[tokio::test]
async fn test_extract_audio_for_whisper_file_not_found() {
  let result =
    extract_audio_for_whisper("/nonexistent/video.mp4".to_string(), "wav".to_string()).await;

  assert!(result.is_err());
  let error_message = format!("{:?}", result.unwrap_err());
  assert!(error_message.contains("not found") || error_message.contains("MediaFileError"));
}

#[tokio::test]
async fn test_whisper_check_local_availability() {
  let result = whisper_check_local_availability().await;

  // Функция должна всегда возвращать результат без ошибок
  assert!(result.is_ok());
  // Результат может быть true или false в зависимости от окружения
  let _available = result.unwrap();
}

#[tokio::test]
async fn test_whisper_get_local_models() {
  let result = whisper_get_local_models().await;

  assert!(result.is_ok());
  let models = result.unwrap();
  assert!(!models.is_empty());

  // Все модели должны иметь корректную структуру
  for model in models {
    assert!(!model.name.is_empty());
    assert!(!model.size.is_empty());
    assert!(!model.languages.is_empty());
  }
}
