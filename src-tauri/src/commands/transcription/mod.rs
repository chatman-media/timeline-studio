use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use std::sync::Mutex;
use tauri::{command, Emitter};

// Global Python interpreter path
static PYTHON_PATH: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TranscriptionWord {
  pub word: String,
  pub start: f64,
  pub end: f64,
  pub probability: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TranscriptionSegment {
  pub id: usize,
  pub start: f64,
  pub end: f64,
  pub text: String,
  pub words: Option<Vec<TranscriptionWord>>,
  pub avg_logprob: f64,
  pub compression_ratio: f64,
  pub no_speech_prob: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TranscriptionResult {
  pub segments: Vec<TranscriptionSegment>,
  pub language: String,
  pub language_probability: f64,
  pub duration: f64,
  pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TranscriptionOptions {
  pub language: Option<String>,
  pub task: String, // "transcribe" or "translate"
  pub model_size: String,
  pub device: String,
  pub compute_type: String,
  pub beam_size: i32,
  pub best_of: i32,
  pub patience: f64,
  pub temperature: Vec<f64>,
  pub compression_ratio_threshold: f64,
  pub log_prob_threshold: f64,
  pub no_speech_threshold: f64,
  pub word_timestamps: bool,
  pub vad_filter: bool,
  pub max_new_tokens: Option<i32>,
  pub hotwords: Option<String>,
}

impl Default for TranscriptionOptions {
  fn default() -> Self {
    Self {
      language: None,
      task: "transcribe".to_string(),
      model_size: "base".to_string(),
      device: "auto".to_string(),
      compute_type: "auto".to_string(),
      beam_size: 5,
      best_of: 5,
      patience: 1.0,
      temperature: vec![0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
      compression_ratio_threshold: 2.4,
      log_prob_threshold: -1.0,
      no_speech_threshold: 0.6,
      word_timestamps: true,
      vad_filter: true,
      max_new_tokens: None,
      hotwords: None,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelInfo {
  pub name: String,
  pub size: String,
  pub params: String,
  pub english_only: bool,
  pub is_downloaded: bool,
}

/// Initialize Python environment for Whisper
#[command]
pub async fn init_whisper_python() -> Result<bool, String> {
  // Find Python executable
  let python_paths = vec![
    "python3",
    "python",
    "/usr/bin/python3",
    "/usr/local/bin/python3",
    // macOS specific paths
    "/opt/homebrew/bin/python3",
    "/usr/local/opt/python@3/bin/python3",
    // Windows paths
    "C:\\Python311\\python.exe",
    "C:\\Python310\\python.exe",
    "C:\\Python39\\python.exe",
  ];

  let mut found_python = None;
  for path in python_paths {
    let output = Command::new(path).arg("--version").output();

    if let Ok(output) = output {
      if output.status.success() {
        found_python = Some(path.to_string());
        break;
      }
    }
  }

  if let Some(python_path) = found_python {
    // Store Python path
    let mut python = PYTHON_PATH.lock().unwrap();
    *python = Some(python_path.clone());

    // Check if faster-whisper is installed
    let check_output = Command::new(&python_path)
      .args(["-c", "import faster_whisper; print('OK')"])
      .output()
      .map_err(|e| format!("Failed to check faster-whisper: {}", e))?;

    if !check_output.status.success() {
      // Try to install faster-whisper
      let install_output = Command::new(&python_path)
        .args(["-m", "pip", "install", "faster-whisper"])
        .output()
        .map_err(|e| format!("Failed to install faster-whisper: {}", e))?;

      if !install_output.status.success() {
        return Err("Failed to install faster-whisper. Please install manually.".to_string());
      }
    }

    Ok(true)
  } else {
    Err("Python not found. Please install Python 3.8 or later.".to_string())
  }
}

/// Transcribe audio using Faster Whisper
#[command]
pub async fn transcribe_with_faster_whisper(
  audio_path: String,
  options: TranscriptionOptions,
) -> Result<TranscriptionResult, String> {
  // Ensure Python is initialized
  let python_path = {
    let python = PYTHON_PATH.lock().unwrap();
    python
      .clone()
      .ok_or_else(|| "Python not initialized. Call init_whisper_python first.".to_string())?
  };

  // Get path to Python script
  let script_path = std::env::current_dir()
    .map_err(|e| e.to_string())?
    .join("python")
    .join("transcription_service.py");

  if !script_path.exists() {
    return Err(format!(
      "Transcription script not found at: {:?}",
      script_path
    ));
  }

  // Prepare arguments
  let mut args = vec![
    script_path.to_str().unwrap().to_string(),
    audio_path.clone(),
    "--model".to_string(),
    options.model_size.clone(),
    "--device".to_string(),
    options.device.clone(),
    "--task".to_string(),
    options.task.clone(),
    "--format".to_string(),
    "json".to_string(),
  ];

  if let Some(language) = &options.language {
    args.push("--language".to_string());
    args.push(language.clone());
  }

  // Run transcription
  let output = Command::new(&python_path)
    .args(&args)
    .output()
    .map_err(|e| format!("Failed to run transcription: {}", e))?;

  if !output.status.success() {
    let error = String::from_utf8_lossy(&output.stderr);
    return Err(format!("Transcription failed: {}", error));
  }

  // Parse result
  let result_str = String::from_utf8_lossy(&output.stdout);
  let result: TranscriptionResult = serde_json::from_str(&result_str)
    .map_err(|e| format!("Failed to parse transcription result: {}", e))?;

  Ok(result)
}

/// Get available Whisper models
#[command]
pub async fn get_whisper_models() -> Result<Vec<ModelInfo>, String> {
  let models = vec![
    ModelInfo {
      name: "tiny".to_string(),
      size: "39M".to_string(),
      params: "39M".to_string(),
      english_only: false,
      is_downloaded: check_model_exists("tiny"),
    },
    ModelInfo {
      name: "tiny.en".to_string(),
      size: "39M".to_string(),
      params: "39M".to_string(),
      english_only: true,
      is_downloaded: check_model_exists("tiny.en"),
    },
    ModelInfo {
      name: "base".to_string(),
      size: "74M".to_string(),
      params: "74M".to_string(),
      english_only: false,
      is_downloaded: check_model_exists("base"),
    },
    ModelInfo {
      name: "base.en".to_string(),
      size: "74M".to_string(),
      params: "74M".to_string(),
      english_only: true,
      is_downloaded: check_model_exists("base.en"),
    },
    ModelInfo {
      name: "small".to_string(),
      size: "244M".to_string(),
      params: "244M".to_string(),
      english_only: false,
      is_downloaded: check_model_exists("small"),
    },
    ModelInfo {
      name: "small.en".to_string(),
      size: "244M".to_string(),
      params: "244M".to_string(),
      english_only: true,
      is_downloaded: check_model_exists("small.en"),
    },
    ModelInfo {
      name: "medium".to_string(),
      size: "769M".to_string(),
      params: "769M".to_string(),
      english_only: false,
      is_downloaded: check_model_exists("medium"),
    },
    ModelInfo {
      name: "medium.en".to_string(),
      size: "769M".to_string(),
      params: "769M".to_string(),
      english_only: true,
      is_downloaded: check_model_exists("medium.en"),
    },
    ModelInfo {
      name: "large-v1".to_string(),
      size: "1550M".to_string(),
      params: "1550M".to_string(),
      english_only: false,
      is_downloaded: check_model_exists("large-v1"),
    },
    ModelInfo {
      name: "large-v2".to_string(),
      size: "1550M".to_string(),
      params: "1550M".to_string(),
      english_only: false,
      is_downloaded: check_model_exists("large-v2"),
    },
    ModelInfo {
      name: "large-v3".to_string(),
      size: "1550M".to_string(),
      params: "1550M".to_string(),
      english_only: false,
      is_downloaded: check_model_exists("large-v3"),
    },
  ];

  Ok(models)
}

/// Download a Whisper model
#[command]
pub async fn download_whisper_model<R: tauri::Runtime>(
  model_name: String,
  app_handle: tauri::AppHandle<R>,
) -> Result<bool, String> {
  let python_path = {
    let python = PYTHON_PATH.lock().unwrap();
    python
      .clone()
      .ok_or_else(|| "Python not initialized".to_string())?
  };

  // Run Python script to download model
  let download_script = format!(
    r#"
import sys
from faster_whisper import download_model
try:
    model_path = download_model("{}", output_dir=None)
    print(f"Model downloaded to: {{model_path}}")
    sys.exit(0)
except Exception as e:
    print(f"Error: {{e}}", file=sys.stderr)
    sys.exit(1)
"#,
    model_name
  );

  let output = Command::new(&python_path)
    .args(["-c", &download_script])
    .output()
    .map_err(|e| format!("Failed to download model: {}", e))?;

  if output.status.success() {
    // Emit download complete event
    app_handle
      .emit("whisper_model_downloaded", &model_name)
      .map_err(|e| e.to_string())?;
    Ok(true)
  } else {
    let error = String::from_utf8_lossy(&output.stderr);
    Err(format!("Model download failed: {}", error))
  }
}

/// Check if a model exists locally
fn check_model_exists(model_name: &str) -> bool {
  let home = dirs::home_dir().unwrap_or_default();
  let model_path = home.join(".cache").join("whisper").join(model_name);

  model_path.exists()
}

/// Convert audio to format suitable for Whisper
#[command]
pub async fn prepare_audio_for_whisper(
  input_path: String,
  output_format: String,
) -> Result<String, String> {
  use crate::video_compiler::commands::extract_audio_for_whisper as extract_audio;

  // Generate output path
  let input = Path::new(&input_path);
  let _output_path = input.parent().unwrap_or(Path::new(".")).join(format!(
    "{}_whisper.{}",
    input.file_stem().unwrap_or_default().to_string_lossy(),
    output_format
  ));

  // Extract audio using existing FFmpeg command
  let result = extract_audio(input_path, output_format)
    .await
    .map_err(|e| e.to_string())?;

  Ok(result)
}

/// Generate subtitles from transcription
#[command]
pub async fn generate_subtitles_from_transcription(
  transcription: TranscriptionResult,
  format: String,
) -> Result<String, String> {
  match format.as_str() {
    "srt" => generate_srt(&transcription),
    "vtt" => generate_vtt(&transcription),
    "ass" => generate_ass(&transcription),
    _ => Err(format!("Unsupported subtitle format: {}", format)),
  }
}

fn generate_srt(transcription: &TranscriptionResult) -> Result<String, String> {
  let mut srt = String::new();

  for (i, segment) in transcription.segments.iter().enumerate() {
    srt.push_str(&format!("{}\n", i + 1));
    srt.push_str(&format!(
      "{} --> {}\n",
      format_srt_time(segment.start),
      format_srt_time(segment.end)
    ));
    srt.push_str(&format!("{}\n\n", segment.text));
  }

  Ok(srt)
}

fn generate_vtt(transcription: &TranscriptionResult) -> Result<String, String> {
  let mut vtt = String::from("WEBVTT\n\n");

  for segment in &transcription.segments {
    vtt.push_str(&format!(
      "{} --> {}\n",
      format_vtt_time(segment.start),
      format_vtt_time(segment.end)
    ));
    vtt.push_str(&format!("{}\n\n", segment.text));
  }

  Ok(vtt)
}

fn generate_ass(transcription: &TranscriptionResult) -> Result<String, String> {
  let mut ass = String::from("[Script Info]\n");
  ass.push_str("Title: Timeline Studio Subtitles\n");
  ass.push_str("ScriptType: v4.00+\n\n");
  ass.push_str("[V4+ Styles]\n");
  ass.push_str("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n");
  ass.push_str("Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n");
  ass.push_str("[Events]\n");
  ass.push_str("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n");

  for segment in &transcription.segments {
    ass.push_str(&format!(
      "Dialogue: 0,{},{},Default,,0,0,0,,{}\n",
      format_ass_time(segment.start),
      format_ass_time(segment.end),
      segment.text
    ));
  }

  Ok(ass)
}

fn format_srt_time(seconds: f64) -> String {
  let hours = (seconds / 3600.0) as u32;
  let minutes = ((seconds % 3600.0) / 60.0) as u32;
  let secs = (seconds % 60.0) as u32;
  let millis = ((seconds % 1.0) * 1000.0) as u32;
  format!("{:02}:{:02}:{:02},{:03}", hours, minutes, secs, millis)
}

fn format_vtt_time(seconds: f64) -> String {
  let hours = (seconds / 3600.0) as u32;
  let minutes = ((seconds % 3600.0) / 60.0) as u32;
  let secs = (seconds % 60.0) as u32;
  let millis = ((seconds % 1.0) * 1000.0) as u32;
  format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, secs, millis)
}

fn format_ass_time(seconds: f64) -> String {
  let hours = (seconds / 3600.0) as u32;
  let minutes = ((seconds % 3600.0) / 60.0) as u32;
  let secs = (seconds % 60.0) as u32;
  let centis = ((seconds % 1.0) * 100.0) as u32;
  format!("{}:{:02}:{:02}.{:02}", hours, minutes, secs, centis)
}
