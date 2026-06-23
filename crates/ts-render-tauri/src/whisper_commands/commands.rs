//! Tauri команды для работы с Whisper API
//!
//! Тонкие команды, которые делегируют всю бизнес-логику в модуль business_logic

use super::{business_logic::*, types::*};
use ts_render::video_compiler::core::error::{Result, VideoCompilerError};
use ts_render::video_compiler::ffmpeg_executor::FFmpegExecutor;
use reqwest::multipart::{Form, Part};
use std::path::Path;
use tokio::fs;

/// Транскрипция аудио через OpenAI Whisper API
#[tauri::command]
pub async fn whisper_transcribe_openai(
  audio_file_path: String,
  api_key: String,
  model: String,
  language: Option<String>,
  prompt: Option<String>,
  response_format: String,
  temperature: f64,
  timestamp_granularities: Vec<String>,
) -> Result<WhisperTranscriptionResult> {
  // Валидация входных параметров
  validate_transcription_params(
    &api_key,
    &model,
    language.as_deref(),
    Some(temperature as f32),
  )
  .map_err(VideoCompilerError::InvalidParameter)?;

  let file_path = Path::new(&audio_file_path);
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: audio_file_path,
      reason: "Аудио файл не найден".to_string(),
    });
  }

  // Читаем файл
  let file_content = fs::read(&file_path)
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка чтения файла: {e}")))?;

  let file_name = file_path
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("audio.wav");

  // Создаем multipart form
  let mut form = Form::new()
    .text("model", model)
    .text("response_format", response_format)
    .text("temperature", temperature.to_string())
    .part(
      "file",
      Part::bytes(file_content).file_name(file_name.to_string()),
    );

  if let Some(lang) = language {
    form = form.text("language", lang);
  }

  if let Some(prompt_text) = prompt {
    form = form.text("prompt", prompt_text);
  }

  if !timestamp_granularities.is_empty() {
    form = form.text(
      "timestamp_granularities[]",
      timestamp_granularities.join(","),
    );
  }

  // Отправляем запрос
  let client = reqwest::Client::new();
  let response = client
    .post("https://api.openai.com/v1/audio/transcriptions")
    .header("Authorization", format!("Bearer {api_key}"))
    .multipart(form)
    .send()
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка запроса к OpenAI: {e}")))?;

  let status = response.status();
  if !status.is_success() {
    let error_text = response.text().await.unwrap_or_default();
    return Err(VideoCompilerError::ValidationError(format!(
      "OpenAI API error {status}: {error_text}"
    )));
  }

  let response_text = response
    .text()
    .await
    .map_err(|e| VideoCompilerError::SerializationError(format!("Ошибка получения ответа: {e}")))?;

  // Используем бизнес-логику для конвертации ответа
  convert_api_response_to_transcription(&response_text, None, None)
    .map_err(VideoCompilerError::SerializationError)
}

/// Перевод аудио на английский через OpenAI Whisper API
#[tauri::command]
pub async fn whisper_translate_openai(
  audio_file_path: String,
  api_key: String,
  model: String,
  prompt: Option<String>,
  response_format: String,
  temperature: f64,
) -> Result<WhisperTranslationResult> {
  // Валидация входных параметров
  validate_transcription_params(&api_key, &model, None, Some(temperature as f32))
    .map_err(VideoCompilerError::InvalidParameter)?;

  let file_path = Path::new(&audio_file_path);
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: audio_file_path,
      reason: "Аудио файл не найден".to_string(),
    });
  }

  // Читаем файл
  let file_content = fs::read(&file_path)
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка чтения файла: {e}")))?;

  let file_name = file_path
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("audio.wav");

  // Создаем multipart form
  let mut form = Form::new()
    .text("model", model)
    .text("response_format", response_format)
    .text("temperature", temperature.to_string())
    .part(
      "file",
      Part::bytes(file_content).file_name(file_name.to_string()),
    );

  if let Some(prompt_text) = prompt {
    form = form.text("prompt", prompt_text);
  }

  // Отправляем запрос
  let client = reqwest::Client::new();
  let response = client
    .post("https://api.openai.com/v1/audio/translations")
    .header("Authorization", format!("Bearer {api_key}"))
    .multipart(form)
    .send()
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка запроса к OpenAI: {e}")))?;

  let status = response.status();
  if !status.is_success() {
    let error_text = response.text().await.unwrap_or_default();
    return Err(VideoCompilerError::ValidationError(format!(
      "OpenAI API error {status}: {error_text}"
    )));
  }

  let translation: WhisperTranslationResult = response
    .json()
    .await
    .map_err(|e| VideoCompilerError::SerializationError(format!("Ошибка парсинга ответа: {e}")))?;

  Ok(translation)
}

/// Транскрипция через локальную модель Whisper
#[tauri::command]
pub async fn whisper_transcribe_local(
  audio_file_path: String,
  model_name: String,
  language: String,
  threads: u32,
  output_format: String,
) -> Result<WhisperTranscriptionResult> {
  let file_path = Path::new(&audio_file_path);
  if !file_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: audio_file_path,
      reason: "Аудио файл не найден".to_string(),
    });
  }

  // Проверяем доступность локального Whisper
  if !check_local_whisper_availability() {
    return Err(VideoCompilerError::DependencyMissing(
      "Whisper.cpp не найден в системе".to_string(),
    ));
  }

  let whisper_executable = which::which("whisper")
    .or_else(|_| which::which("whisper.cpp"))
    .map_err(|_| VideoCompilerError::DependencyMissing("Whisper.cpp не найден".to_string()))?;

  // Получаем путь к модели
  let model_path =
    get_whisper_model_path(&model_name).map_err(VideoCompilerError::InvalidParameter)?;

  if !model_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: model_path.to_string_lossy().to_string(),
      reason: format!("Модель {model_name} не найдена"),
    });
  }

  // Создаем временный файл для вывода
  let temp_dir = std::env::temp_dir();
  let timestamp = chrono::Utc::now().timestamp_millis();
  let output_file = temp_dir.join(format!("whisper_output_{timestamp}.{output_format}"));

  // Подготавливаем команду whisper.cpp
  let mut cmd = tokio::process::Command::new(whisper_executable);
  cmd.args([
    "-m",
    &model_path.to_string_lossy(),
    "-f",
    &audio_file_path,
    "-t",
    &threads.to_string(),
    "-of",
    &output_format,
    "-o",
    &output_file.to_string_lossy(),
  ]);

  if language != "auto" {
    cmd.args(["-l", &language]);
  }

  // Используем FFmpegExecutor для выполнения команды
  let executor = FFmpegExecutor::new();
  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка выполнения whisper.cpp: {e}")))?;

  if result.exit_code != 0 {
    return Err(VideoCompilerError::FFmpegError {
      exit_code: Some(result.exit_code),
      stderr: result.stderr,
      command: "whisper.cpp".to_string(),
    });
  }

  // Читаем результат
  match output_format.as_str() {
    "json" => {
      let json_file = output_file.with_extension("json");
      let content = fs::read_to_string(&json_file)
        .await
        .map_err(|e| VideoCompilerError::Io(format!("Ошибка чтения результата: {e}")))?;

      // Парсим JSON результат whisper.cpp
      let whisper_result: serde_json::Value = serde_json::from_str(&content).map_err(|e| {
        VideoCompilerError::SerializationError(format!("Ошибка парсинга JSON: {e}"))
      })?;

      let text = whisper_result["text"].as_str().unwrap_or("").to_string();
      let segments = parse_whisper_segments(&whisper_result);

      // Удаляем временный файл
      let _ = fs::remove_file(&json_file).await;

      Ok(WhisperTranscriptionResult {
        text,
        language: Some(language),
        duration: None,
        segments: Some(segments),
        words: None,
      })
    }
    "txt" => {
      let txt_file = output_file.with_extension("txt");
      let text = fs::read_to_string(&txt_file)
        .await
        .map_err(|e| VideoCompilerError::Io(format!("Ошибка чтения результата: {e}")))?;

      // Удаляем временный файл
      let _ = fs::remove_file(&txt_file).await;

      Ok(WhisperTranscriptionResult {
        text,
        language: Some(language),
        duration: None,
        segments: None,
        words: None,
      })
    }
    _ => Err(VideoCompilerError::InvalidParameter(format!(
      "Неподдерживаемый формат вывода: {output_format}"
    ))),
  }
}

/// Получить список доступных локальных моделей
#[tauri::command]
pub async fn whisper_get_local_models() -> Result<Vec<LocalWhisperModel>> {
  let models_dir = get_whisper_models_dir().map_err(VideoCompilerError::ConfigError)?;

  let mut models = get_available_local_models();

  // Проверяем какие модели уже скачаны
  for model in &mut models {
    if let Some(name) = model.name.strip_prefix("whisper-") {
      let filename = match name {
        "tiny" => "ggml-tiny.bin",
        "base" => "ggml-base.bin",
        "small" => "ggml-small.bin",
        "medium" => "ggml-medium.bin",
        "large-v2" => "ggml-large-v2.bin",
        "large-v3" => "ggml-large-v3.bin",
        _ => continue,
      };

      let model_path = models_dir.join(filename);
      if model_path.exists() {
        model.is_downloaded = true;
        model.path = Some(model_path.to_string_lossy().to_string());
      }
    }
  }

  Ok(models)
}

/// Скачать локальную модель Whisper
#[tauri::command]
pub async fn whisper_download_model(model_name: String) -> Result<bool> {
  let models_dir = get_whisper_models_dir().map_err(VideoCompilerError::ConfigError)?;

  // Создаем директорию если её нет
  fs::create_dir_all(&models_dir)
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка создания директории моделей: {e}")))?;

  // Определяем имя файла модели
  let filename = match model_name.as_str() {
    "whisper-tiny" => "ggml-tiny.bin",
    "whisper-base" => "ggml-base.bin",
    "whisper-small" => "ggml-small.bin",
    "whisper-medium" => "ggml-medium.bin",
    "whisper-large-v2" => "ggml-large-v2.bin",
    "whisper-large-v3" => "ggml-large-v3.bin",
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Неизвестная модель: {model_name}"
      )));
    }
  };

  let model_path = models_dir.join(filename);

  // Проверяем, не скачана ли уже модель
  if model_path.exists() {
    return Ok(true);
  }

  // URL для скачивания
  let download_url =
    format!("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{filename}");

  // Скачиваем модель
  let client = reqwest::Client::new();
  let response = client
    .get(&download_url)
    .send()
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка скачивания модели: {e}")))?;

  if !response.status().is_success() {
    return Err(VideoCompilerError::Io(format!(
      "Ошибка скачивания: HTTP {}",
      response.status()
    )));
  }

  // Сохраняем файл
  let content = response
    .bytes()
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка получения данных: {e}")))?;

  fs::write(&model_path, content)
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка сохранения модели: {e}")))?;

  Ok(true)
}

/// Проверить доступность локального Whisper
#[tauri::command]
pub async fn whisper_check_local_availability() -> Result<bool> {
  Ok(check_local_whisper_availability())
}

/// Извлечь аудио из видео для Whisper
#[tauri::command]
pub async fn extract_audio_for_whisper(
  video_file_path: String,
  output_format: String,
) -> Result<String> {
  let video_path = Path::new(&video_file_path);
  if !video_path.exists() {
    return Err(VideoCompilerError::MediaFileError {
      path: video_file_path.clone(),
      reason: "Видео файл не найден".to_string(),
    });
  }

  // Проверяем поддерживаемый формат
  if !matches!(output_format.as_str(), "wav" | "mp3" | "flac") {
    return Err(VideoCompilerError::InvalidParameter(format!(
      "Неподдерживаемый формат аудио: {output_format}"
    )));
  }

  // Создаем временную директорию
  let temp_dir = std::env::temp_dir().join("timeline_studio_whisper");
  fs::create_dir_all(&temp_dir)
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка создания временной директории: {e}")))?;

  // Генерируем имя выходного файла
  let timestamp = chrono::Utc::now().timestamp_millis();
  let video_filename = video_path
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("video");
  let audio_filename = generate_temp_audio_filename(video_filename, &output_format, timestamp);
  let audio_path = temp_dir.join(&audio_filename);

  // Используем FFmpeg для извлечения аудио
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  // Настройки для оптимального качества для Whisper
  match output_format.as_str() {
    "wav" => {
      cmd.args([
        "-i",
        &video_file_path,
        "-vn", // без видео
        "-acodec",
        "pcm_s16le", // 16-bit PCM
        "-ar",
        "16000", // 16kHz - оптимально для Whisper
        "-ac",
        "1",  // моно
        "-y", // перезаписать файл
        &audio_path.to_string_lossy(),
      ]);
    }
    "mp3" => {
      cmd.args([
        "-i",
        &video_file_path,
        "-vn",
        "-acodec",
        "mp3",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-b:a",
        "128k",
        "-y",
        &audio_path.to_string_lossy(),
      ]);
    }
    "flac" => {
      cmd.args([
        "-i",
        &video_file_path,
        "-vn",
        "-acodec",
        "flac",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-y",
        &audio_path.to_string_lossy(),
      ]);
    }
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Неподдерживаемый формат аудио: {output_format}"
      )));
    }
  }

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка извлечения аудио: {e}")))?;

  if result.exit_code != 0 {
    return Err(VideoCompilerError::FFmpegError {
      exit_code: Some(result.exit_code),
      stderr: result.stderr,
      command: "ffmpeg".to_string(),
    });
  }

  Ok(audio_path.to_string_lossy().to_string())
}
