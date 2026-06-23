//! Бизнес-логика для команд Whisper (тестируемые функции)

use super::types::*;
use std::path::PathBuf;

/// Получить директорию для моделей Whisper
pub fn get_whisper_models_dir() -> Result<PathBuf, String> {
  let home_dir = dirs::home_dir().ok_or("Не удалось определить домашнюю директорию")?;
  Ok(home_dir.join(".timeline_studio").join("whisper_models"))
}

/// Получить путь к конкретной модели Whisper
pub fn get_whisper_model_path(model_name: &str) -> Result<PathBuf, String> {
  let models_dir = get_whisper_models_dir()?;

  let filename = match model_name {
    "whisper-tiny" => "ggml-tiny.bin",
    "whisper-base" => "ggml-base.bin",
    "whisper-small" => "ggml-small.bin",
    "whisper-medium" => "ggml-medium.bin",
    "whisper-large-v2" => "ggml-large-v2.bin",
    "whisper-large-v3" => "ggml-large-v3.bin",
    _ => return Err(format!("Неизвестная модель: {model_name}")),
  };

  Ok(models_dir.join(filename))
}

/// Парсить сегменты из JSON результата Whisper
pub fn parse_whisper_segments(whisper_json: &serde_json::Value) -> Vec<WhisperSegment> {
  let segments_array = match whisper_json.get("segments") {
    Some(serde_json::Value::Array(arr)) => arr,
    _ => return Vec::new(),
  };

  segments_array
    .iter()
    .enumerate()
    .filter_map(|(i, segment)| {
      Some(WhisperSegment {
        id: i as u32,
        seek: segment.get("seek")?.as_u64()? as u32,
        start: segment.get("start")?.as_f64()?,
        end: segment.get("end")?.as_f64()?,
        text: segment.get("text")?.as_str()?.to_string(),
        tokens: segment
          .get("tokens")?
          .as_array()?
          .iter()
          .filter_map(|t| t.as_u64().map(|n| n as u32))
          .collect(),
        temperature: segment.get("temperature")?.as_f64()?,
        avg_logprob: segment.get("avg_logprob")?.as_f64()?,
        compression_ratio: segment.get("compression_ratio")?.as_f64()?,
        no_speech_prob: segment.get("no_speech_prob")?.as_f64()?,
      })
    })
    .collect()
}

/// Валидировать параметры транскрипции
pub fn validate_transcription_params(
  api_key: &str,
  model: &str,
  language: Option<&str>,
  temperature: Option<f32>,
) -> Result<(), String> {
  if api_key.trim().is_empty() {
    return Err("API ключ не может быть пустым".to_string());
  }

  let valid_models = [
    "whisper-1",
    "whisper-tiny",
    "whisper-base",
    "whisper-small",
    "whisper-medium",
    "whisper-large-v2",
    "whisper-large-v3",
  ];

  if !valid_models.contains(&model) {
    return Err(format!("Неподдерживаемая модель: {model}"));
  }

  if let Some(lang) = language {
    if lang.len() != 2 {
      return Err("Код языка должен состоять из 2 символов (например, 'ru', 'en')".to_string());
    }
  }

  if let Some(temp) = temperature {
    if !(0.0..=2.0).contains(&temp) {
      return Err("Temperature должна быть между 0.0 и 2.0".to_string());
    }
  }

  Ok(())
}

/// Генерировать имя временного аудиофайла
pub fn generate_temp_audio_filename(
  video_filename: &str,
  output_format: &str,
  timestamp: i64,
) -> String {
  let base_name = std::path::Path::new(video_filename)
    .file_stem()
    .and_then(|s| s.to_str())
    .unwrap_or("audio");

  format!("{base_name}_{timestamp}.{output_format}")
}

/// Проверить доступность локального Whisper
pub fn check_local_whisper_availability() -> bool {
  which::which("whisper").is_ok() || which::which("whisper.cpp").is_ok()
}

/// Список доступных локальных моделей Whisper
pub fn get_available_local_models() -> Vec<LocalWhisperModel> {
  vec![
    LocalWhisperModel {
      name: "whisper-tiny".to_string(),
      size: "39 MB".to_string(),
      languages: vec!["en".to_string(), "ru".to_string(), "es".to_string()],
      path: None,
      is_downloaded: false,
      download_url: Some(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin".to_string(),
      ),
    },
    LocalWhisperModel {
      name: "whisper-base".to_string(),
      size: "142 MB".to_string(),
      languages: vec![
        "en".to_string(),
        "ru".to_string(),
        "es".to_string(),
        "fr".to_string(),
      ],
      path: None,
      is_downloaded: false,
      download_url: Some(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin".to_string(),
      ),
    },
    LocalWhisperModel {
      name: "whisper-small".to_string(),
      size: "466 MB".to_string(),
      languages: vec![
        "en".to_string(),
        "ru".to_string(),
        "es".to_string(),
        "fr".to_string(),
        "de".to_string(),
      ],
      path: None,
      is_downloaded: false,
      download_url: Some(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin".to_string(),
      ),
    },
    LocalWhisperModel {
      name: "whisper-medium".to_string(),
      size: "1.42 GB".to_string(),
      languages: vec!["многоязычная поддержка".to_string()],
      path: None,
      is_downloaded: false,
      download_url: Some(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin".to_string(),
      ),
    },
    LocalWhisperModel {
      name: "whisper-large-v3".to_string(),
      size: "2.87 GB".to_string(),
      languages: vec!["многоязычная поддержка".to_string()],
      path: None,
      is_downloaded: false,
      download_url: Some(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin".to_string(),
      ),
    },
  ]
}

/// Конвертировать результат API в WhisperTranscriptionResult
pub fn convert_api_response_to_transcription(
  response_text: &str,
  language: Option<String>,
  duration: Option<f64>,
) -> Result<WhisperTranscriptionResult, String> {
  // Пытаемся парсить как JSON сначала
  if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(response_text) {
    let text = json_val
      .get("text")
      .and_then(|t| t.as_str())
      .unwrap_or(response_text)
      .to_string();

    let segments = if json_val.get("segments").is_some() {
      Some(parse_whisper_segments(&json_val))
    } else {
      None
    };

    Ok(WhisperTranscriptionResult {
      text,
      language,
      duration,
      segments,
      words: None, // API обычно не возвращает word-level timestamps
    })
  } else {
    // Если не JSON, то просто текст
    Ok(WhisperTranscriptionResult {
      text: response_text.to_string(),
      language,
      duration,
      segments: None,
      words: None,
    })
  }
}
