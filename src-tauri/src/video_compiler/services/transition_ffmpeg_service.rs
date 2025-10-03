//! Сервис для работы с переходами через FFmpeg

use crate::video_compiler::{
  error::{Result, VideoCompilerError},
  services::{ffmpeg_service::FfmpegService, Service},
};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::Path, sync::Arc};

/// Конфигурация перехода для FFmpeg
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionFFmpegConfig {
  pub id: String,
  pub transition_type: String,
  pub start_time: f64,
  pub duration: f64,
  pub input_a: String,
  pub input_b: String,
  pub output: String,
  pub parameters: HashMap<String, serde_json::Value>,
  pub quality: u32,
  pub resolution: (u32, u32),
  pub use_gpu: bool,
  pub gpu_device: Option<String>,
}

/// Команда FFmpeg для перехода
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionFFmpegCommand {
  pub inputs: Vec<TransitionInput>,
  pub filter_graph: String,
  pub output: TransitionOutput,
  pub global_options: Vec<String>,
  pub metadata: TransitionMetadata,
}

/// Входной файл для перехода
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionInput {
  pub path: String,
  pub options: Vec<String>,
}

/// Выходной файл для перехода
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionOutput {
  pub path: String,
  pub options: Vec<String>,
}

/// Метаданные перехода
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionMetadata {
  pub transition_id: String,
  pub transition_type: String,
  pub duration: f64,
  pub quality: u32,
}

/// Статус выполнения перехода
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionStatus {
  pub transition_id: String,
  pub status: String, // "pending" | "processing" | "completed" | "failed"
  pub progress: f64,
  pub start_time: Option<chrono::DateTime<chrono::Utc>>,
  pub end_time: Option<chrono::DateTime<chrono::Utc>>,
  pub error: Option<String>,
  pub render_time_ms: Option<u64>,
  pub output_size_bytes: Option<u64>,
  pub gpu_used: Option<bool>,
}

/// Результат экспорта переходов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionExportResult {
  pub success: bool,
  pub total_transitions: usize,
  pub processed_transitions: usize,
  pub failed_transitions: Vec<TransitionStatus>,
  pub output_path: String,
  pub temp_files: Vec<String>,
  pub total_render_time: u64,
  pub average_transition_time: f64,
  pub gpu_accelerated: bool,
  pub ffmpeg_logs: Vec<String>,
  pub errors: Vec<String>,
  pub warnings: Vec<String>,
}

/// Трейт для работы с переходами через FFmpeg
#[async_trait]
pub trait TransitionFFmpegService: Service + Send + Sync {
  /// Создать команду FFmpeg для перехода
  async fn create_transition_command(
    &self,
    config: &TransitionFFmpegConfig,
  ) -> Result<TransitionFFmpegCommand>;

  /// Выполнить команду перехода
  async fn execute_transition_command(
    &self,
    command: &TransitionFFmpegCommand,
  ) -> Result<TransitionStatus>;

  /// Выполнить несколько переходов параллельно
  async fn execute_transitions_batch(
    &self,
    commands: Vec<TransitionFFmpegCommand>,
    max_workers: usize,
  ) -> Result<Vec<TransitionStatus>>;

  /// Получить поддерживаемые типы переходов
  async fn get_supported_transitions(&self) -> Result<Vec<String>>;

  /// Проверить качество перехода
  async fn validate_transition_config(&self, config: &TransitionFFmpegConfig) -> Result<()>;
}

/// Реализация сервиса переходов
pub struct TransitionFFmpegServiceImpl {
  ffmpeg_service: Arc<dyn FfmpegService>,
  transition_templates: HashMap<String, String>,
}

impl TransitionFFmpegServiceImpl {
  pub fn new(ffmpeg_service: Arc<dyn FfmpegService>) -> Self {
    let mut transition_templates = HashMap::new();

    // Загружаем шаблоны переходов
    Self::load_transition_templates(&mut transition_templates);

    Self {
      ffmpeg_service,
      transition_templates,
    }
  }

  /// Загрузить шаблоны переходов FFmpeg
  fn load_transition_templates(templates: &mut HashMap<String, String>) {
    // Базовые переходы
    templates.insert(
      "fade".to_string(),
      "xfade=transition=fade:duration={duration}:offset={offset}".to_string(),
    );
    templates.insert(
      "dissolve".to_string(),
      "xfade=transition=dissolve:duration={duration}:offset={offset}".to_string(),
    );

    // Wipe переходы
    templates.insert(
      "wipe_left".to_string(),
      "xfade=transition=wipeleft:duration={duration}:offset={offset}".to_string(),
    );
    templates.insert(
      "wipe_right".to_string(),
      "xfade=transition=wiperight:duration={duration}:offset={offset}".to_string(),
    );
    templates.insert(
      "wipe_up".to_string(),
      "xfade=transition=wipeup:duration={duration}:offset={offset}".to_string(),
    );
    templates.insert(
      "wipe_down".to_string(),
      "xfade=transition=wipedown:duration={duration}:offset={offset}".to_string(),
    );

    // Slide переходы
    templates.insert(
      "slide_left".to_string(),
      "xfade=transition=slideleft:duration={duration}:offset={offset}".to_string(),
    );
    templates.insert(
      "slide_right".to_string(),
      "xfade=transition=slideright:duration={duration}:offset={offset}".to_string(),
    );
    templates.insert(
      "slide_up".to_string(),
      "xfade=transition=slideup:duration={duration}:offset={offset}".to_string(),
    );
    templates.insert(
      "slide_down".to_string(),
      "xfade=transition=slidedown:duration={duration}:offset={offset}".to_string(),
    );

    // Геометрические переходы
    templates.insert(
      "circle_open".to_string(),
      "xfade=transition=circleopen:duration={duration}:offset={offset}".to_string(),
    );
    templates.insert(
      "circle_close".to_string(),
      "xfade=transition=circleclose:duration={duration}:offset={offset}".to_string(),
    );

    // Эффекты
    templates.insert(
      "pixelate".to_string(),
      "xfade=transition=pixelize:duration={duration}:offset={offset}".to_string(),
    );
    templates.insert(
      "blur".to_string(),
      "xfade=transition=fadeblack:duration={duration}:offset={offset}".to_string(),
    );

    // Fallback
    templates.insert(
      "custom".to_string(),
      "xfade=transition=fade:duration={duration}:offset={offset}".to_string(),
    );
  }

  /// Создать фильтр-граф для перехода
  fn create_filter_graph(&self, config: &TransitionFFmpegConfig) -> Result<String> {
    let template = self
      .transition_templates
      .get(&config.transition_type)
      .ok_or_else(|| {
        VideoCompilerError::ValidationError(format!(
          "Неизвестный тип перехода: {}",
          config.transition_type
        ))
      })?;

    // Заменяем параметры в шаблоне
    let filter_graph = template
      .replace("{duration}", &config.duration.to_string())
      .replace("{offset}", &config.start_time.to_string());

    // Добавляем кастомные параметры если есть
    let mut final_filter = filter_graph;
    for (key, value) in &config.parameters {
      if let Some(param_value) = value.as_str() {
        final_filter = final_filter.replace(&format!("{{{}}}", key), param_value);
      } else if let Some(param_value) = value.as_f64() {
        final_filter = final_filter.replace(&format!("{{{}}}", key), &param_value.to_string());
      }
    }

    Ok(final_filter)
  }

  /// Создать опции вывода
  fn create_output_options(&self, config: &TransitionFFmpegConfig) -> Vec<String> {
    let mut options = vec![
      "-c:v".to_string(),
      if config.use_gpu {
        "h264_nvenc".to_string()
      } else {
        "libx264".to_string()
      },
      "-crf".to_string(),
      self.quality_to_crf(config.quality).to_string(),
      "-preset".to_string(),
      "medium".to_string(),
      "-s".to_string(),
      format!("{}x{}", config.resolution.0, config.resolution.1),
    ];

    // GPU ускорение
    if config.use_gpu {
      if let Some(device) = &config.gpu_device {
        options.extend_from_slice(&[
          "-hwaccel".to_string(),
          "cuda".to_string(),
          "-hwaccel_device".to_string(),
          device.clone(),
        ]);
      }
    }

    options
  }

  /// Конвертировать качество в CRF
  fn quality_to_crf(&self, quality: u32) -> u32 {
    // Конвертируем качество (0-100) в CRF (0-51)
    // Используем округление для точного результата
    51 - ((quality * 51 + 50) / 100)
  }

  /// Выполнить одну команду перехода
  async fn execute_single_transition(
    &self,
    command: &TransitionFFmpegCommand,
  ) -> Result<TransitionStatus> {
    let start_time = chrono::Utc::now();

    let mut status = TransitionStatus {
      transition_id: command.metadata.transition_id.clone(),
      status: "processing".to_string(),
      progress: 0.0,
      start_time: Some(start_time),
      end_time: None,
      error: None,
      render_time_ms: None,
      output_size_bytes: None,
      gpu_used: Some(command.output.options.contains(&"-hwaccel".to_string())),
    };

    // Создаем аргументы для FFmpeg
    let mut args = command.global_options.clone();

    // Добавляем входы
    for input in &command.inputs {
      args.extend(input.options.clone());
      args.extend_from_slice(&["-i".to_string(), input.path.clone()]);
    }

    // Добавляем фильтр-граф
    args.extend_from_slice(&["-filter_complex".to_string(), command.filter_graph.clone()]);

    // Добавляем выходные опции
    args.extend(command.output.options.clone());
    args.push(command.output.path.clone());

    match self.ffmpeg_service.run_command(args).await {
      Ok(_output) => {
        let end_time = chrono::Utc::now();
        let render_time = end_time.signed_duration_since(start_time);

        // Получаем размер выходного файла
        let output_size = match std::fs::metadata(&command.output.path) {
          Ok(metadata) => Some(metadata.len()),
          Err(_) => None,
        };

        status.status = "completed".to_string();
        status.progress = 100.0;
        status.end_time = Some(end_time);
        status.render_time_ms = Some(render_time.num_milliseconds() as u64);
        status.output_size_bytes = output_size;

        log::info!(
          "Переход {} выполнен успешно за {}мс",
          command.metadata.transition_id,
          render_time.num_milliseconds()
        );
      }
      Err(error) => {
        status.status = "failed".to_string();
        status.error = Some(error.to_string());
        status.end_time = Some(chrono::Utc::now());

        log::error!(
          "Ошибка выполнения перехода {}: {}",
          command.metadata.transition_id,
          error
        );
      }
    }

    Ok(status)
  }
}

#[async_trait]
impl Service for TransitionFFmpegServiceImpl {
  async fn initialize(&self) -> Result<()> {
    // Проверяем доступность FFmpeg
    self.ffmpeg_service.health_check().await?;
    log::info!("Сервис переходов FFmpeg инициализирован");
    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    self.ffmpeg_service.health_check().await
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("Сервис переходов FFmpeg остановлен");
    Ok(())
  }
}

#[async_trait]
impl TransitionFFmpegService for TransitionFFmpegServiceImpl {
  async fn create_transition_command(
    &self,
    config: &TransitionFFmpegConfig,
  ) -> Result<TransitionFFmpegCommand> {
    // Валидируем конфигурацию
    self.validate_transition_config(config).await?;

    // Создаем фильтр-граф
    let filter_graph = self.create_filter_graph(config)?;

    // Создаем входы
    let inputs = vec![
      TransitionInput {
        path: config.input_a.clone(),
        options: vec!["-ss".to_string(), config.start_time.to_string()],
      },
      TransitionInput {
        path: config.input_b.clone(),
        options: vec![
          "-ss".to_string(),
          (config.start_time + config.duration).to_string(),
        ],
      },
    ];

    // Создаем выходные опции
    let output_options = self.create_output_options(config);

    let command = TransitionFFmpegCommand {
      inputs,
      filter_graph,
      output: TransitionOutput {
        path: config.output.clone(),
        options: output_options,
      },
      global_options: vec![
        "-y".to_string(),
        "-loglevel".to_string(),
        "error".to_string(),
      ],
      metadata: TransitionMetadata {
        transition_id: config.id.clone(),
        transition_type: config.transition_type.clone(),
        duration: config.duration,
        quality: config.quality,
      },
    };

    Ok(command)
  }

  async fn execute_transition_command(
    &self,
    command: &TransitionFFmpegCommand,
  ) -> Result<TransitionStatus> {
    self.execute_single_transition(command).await
  }

  async fn execute_transitions_batch(
    &self,
    commands: Vec<TransitionFFmpegCommand>,
    max_workers: usize,
  ) -> Result<Vec<TransitionStatus>> {
    use std::sync::Arc;
    use tokio::sync::Semaphore;

    let semaphore = Arc::new(Semaphore::new(max_workers));
    let mut handles = Vec::new();

    for command in commands {
      let semaphore = semaphore.clone();
      let service = self.ffmpeg_service.clone();

      let handle = tokio::spawn(async move {
        let _permit = semaphore.acquire().await.unwrap();

        // Создаем временный сервис для выполнения команды
        let temp_service = TransitionFFmpegServiceImpl::new(service);
        temp_service.execute_single_transition(&command).await
      });

      handles.push(handle);
    }

    // Ждем завершения всех задач
    let mut results = Vec::new();
    for handle in handles {
      match handle.await {
        Ok(Ok(status)) => results.push(status),
        Ok(Err(error)) => {
          log::error!("Ошибка выполнения перехода: {}", error);
          results.push(TransitionStatus {
            transition_id: "unknown".to_string(),
            status: "failed".to_string(),
            progress: 0.0,
            start_time: None,
            end_time: Some(chrono::Utc::now()),
            error: Some(error.to_string()),
            render_time_ms: None,
            output_size_bytes: None,
            gpu_used: None,
          });
        }
        Err(join_error) => {
          log::error!("Ошибка join: {}", join_error);
          results.push(TransitionStatus {
            transition_id: "unknown".to_string(),
            status: "failed".to_string(),
            progress: 0.0,
            start_time: None,
            end_time: Some(chrono::Utc::now()),
            error: Some(join_error.to_string()),
            render_time_ms: None,
            output_size_bytes: None,
            gpu_used: None,
          });
        }
      }
    }

    Ok(results)
  }

  async fn get_supported_transitions(&self) -> Result<Vec<String>> {
    Ok(self.transition_templates.keys().cloned().collect())
  }

  async fn validate_transition_config(&self, config: &TransitionFFmpegConfig) -> Result<()> {
    // Проверяем тип перехода
    if !self
      .transition_templates
      .contains_key(&config.transition_type)
    {
      return Err(VideoCompilerError::ValidationError(format!(
        "Неподдерживаемый тип перехода: {}",
        config.transition_type
      )));
    }

    // Проверяем входные файлы
    if !Path::new(&config.input_a).exists() {
      return Err(VideoCompilerError::ValidationError(format!(
        "Входной файл A не найден: {}",
        config.input_a
      )));
    }

    if !Path::new(&config.input_b).exists() {
      return Err(VideoCompilerError::ValidationError(format!(
        "Входной файл B не найден: {}",
        config.input_b
      )));
    }

    // Проверяем выходную директорию
    if let Some(parent) = Path::new(&config.output).parent() {
      if !parent.exists() {
        return Err(VideoCompilerError::ValidationError(format!(
          "Выходная директория не найдена: {}",
          parent.display()
        )));
      }
    }

    // Проверяем параметры времени
    if config.duration <= 0.0 {
      return Err(VideoCompilerError::ValidationError(
        "Длительность перехода должна быть больше 0".to_string(),
      ));
    }

    if config.start_time < 0.0 {
      return Err(VideoCompilerError::ValidationError(
        "Время начала не может быть отрицательным".to_string(),
      ));
    }

    // Проверяем качество
    if config.quality > 100 {
      return Err(VideoCompilerError::ValidationError(
        "Качество не может быть больше 100".to_string(),
      ));
    }

    // Проверяем разрешение
    if config.resolution.0 == 0 || config.resolution.1 == 0 {
      return Err(VideoCompilerError::ValidationError(
        "Разрешение не может быть нулевым".to_string(),
      ));
    }

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::services::ffmpeg_service::FfmpegServiceImpl;
  use std::sync::Arc;

  #[tokio::test]
  async fn test_transition_service_creation() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("echo".to_string()));
    let service = TransitionFFmpegServiceImpl::new(ffmpeg_service);

    assert!(service.transition_templates.contains_key("fade"));
    assert!(service.transition_templates.contains_key("dissolve"));
  }

  #[tokio::test]
  async fn test_get_supported_transitions() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("echo".to_string()));
    let service = TransitionFFmpegServiceImpl::new(ffmpeg_service);

    let transitions = service.get_supported_transitions().await.unwrap();
    assert!(!transitions.is_empty());
    assert!(transitions.contains(&"fade".to_string()));
  }

  #[tokio::test]
  async fn test_create_filter_graph() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("echo".to_string()));
    let service = TransitionFFmpegServiceImpl::new(ffmpeg_service);

    let config = TransitionFFmpegConfig {
      id: "test".to_string(),
      transition_type: "fade".to_string(),
      start_time: 5.0,
      duration: 2.0,
      input_a: "input1.mp4".to_string(),
      input_b: "input2.mp4".to_string(),
      output: "output.mp4".to_string(),
      parameters: HashMap::new(),
      quality: 85,
      resolution: (1920, 1080),
      use_gpu: false,
      gpu_device: None,
    };

    let filter_graph = service.create_filter_graph(&config).unwrap();
    assert!(filter_graph.contains("xfade"));
    assert!(filter_graph.contains("duration=2"));
    assert!(filter_graph.contains("offset=5"));
  }

  #[tokio::test]
  async fn test_quality_to_crf() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("echo".to_string()));
    let service = TransitionFFmpegServiceImpl::new(ffmpeg_service);

    assert_eq!(service.quality_to_crf(100), 0); // Максимальное качество
    assert_eq!(service.quality_to_crf(0), 51); // Минимальное качество
    assert_eq!(service.quality_to_crf(50), 25); // Среднее качество
  }

  #[tokio::test]
  async fn test_validate_transition_config_invalid_type() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("echo".to_string()));
    let service = TransitionFFmpegServiceImpl::new(ffmpeg_service);

    let config = TransitionFFmpegConfig {
      id: "test".to_string(),
      transition_type: "invalid_type".to_string(),
      start_time: 5.0,
      duration: 2.0,
      input_a: "input1.mp4".to_string(),
      input_b: "input2.mp4".to_string(),
      output: "output.mp4".to_string(),
      parameters: HashMap::new(),
      quality: 85,
      resolution: (1920, 1080),
      use_gpu: false,
      gpu_device: None,
    };

    let result = service.validate_transition_config(&config).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_validate_transition_config_invalid_duration() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("echo".to_string()));
    let service = TransitionFFmpegServiceImpl::new(ffmpeg_service);

    let config = TransitionFFmpegConfig {
      id: "test".to_string(),
      transition_type: "fade".to_string(),
      start_time: 5.0,
      duration: -1.0, // Неверная длительность
      input_a: "input1.mp4".to_string(),
      input_b: "input2.mp4".to_string(),
      output: "output.mp4".to_string(),
      parameters: HashMap::new(),
      quality: 85,
      resolution: (1920, 1080),
      use_gpu: false,
      gpu_device: None,
    };

    let result = service.validate_transition_config(&config).await;
    assert!(result.is_err());
  }
}
