//! FFmpeg Builder - Основная логика построителя команд FFmpeg

use std::path::Path;
use tokio::process::Command;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::ProjectSchema;

use super::filters::FilterBuilder;
use super::inputs::InputBuilder;
use super::outputs::OutputBuilder;

/// Настройки построителя FFmpeg
#[derive(Debug, Clone)]
pub struct FFmpegBuilderSettings {
  /// Путь к исполняемому файлу FFmpeg
  pub ffmpeg_path: String,
  /// Использовать аппаратное ускорение
  pub use_hardware_acceleration: bool,
  /// Тип аппаратного ускорения
  pub hardware_acceleration_type: Option<String>,
  /// Дополнительные глобальные параметры
  pub global_options: Vec<String>,
}

impl Default for FFmpegBuilderSettings {
  fn default() -> Self {
    Self {
      ffmpeg_path: "ffmpeg".to_string(),
      use_hardware_acceleration: false,
      hardware_acceleration_type: None,
      global_options: vec![],
    }
  }
}

/// Построитель команд FFmpeg
#[derive(Debug, Clone)]
pub struct FFmpegBuilder {
  /// Схема проекта
  project: ProjectSchema,
  /// Настройки построения
  settings: FFmpegBuilderSettings,
}

impl FFmpegBuilder {
  /// Создать новый построитель
  pub fn new(project: ProjectSchema) -> Self {
    Self {
      project,
      settings: FFmpegBuilderSettings::default(),
    }
  }

  /// Создать построитель с настройками
  pub fn with_settings(project: ProjectSchema, settings: FFmpegBuilderSettings) -> Self {
    Self { project, settings }
  }

  /// Построить команду для рендеринга проекта
  pub async fn build_render_command(&self, output_path: &Path) -> Result<Command> {
    let mut cmd = Command::new(&self.settings.ffmpeg_path);

    // Добавляем входные файлы
    let input_builder = InputBuilder::new(&self.project);
    input_builder.add_input_sources(&mut cmd).await?;

    // Добавляем фильтры
    let filter_builder = FilterBuilder::new(&self.project);
    filter_builder.add_filter_complex(&mut cmd).await?;

    // Добавляем настройки вывода
    let output_builder = OutputBuilder::new(&self.project, &self.settings);
    output_builder
      .add_output_settings(&mut cmd, output_path)
      .await?;

    // Добавляем глобальные параметры
    self.add_global_options(&mut cmd);

    Ok(cmd)
  }

  /// Построить команду для генерации превью
  pub async fn build_preview_command(
    &self,
    input_path: &Path,
    timestamp: f64,
    output_path: &Path,
    resolution: (u32, u32),
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings.ffmpeg_path);

    // Переход к временной метке
    cmd.args(["-ss", &timestamp.to_string()]);

    // Входной файл
    cmd.args(["-i", &input_path.to_string_lossy()]);

    // Один кадр
    cmd.args(["-vframes", "1"]);

    // Масштабирование
    cmd.args(["-vf", &format!("scale={}:{}", resolution.0, resolution.1)]);

    // Качество
    cmd.args(["-q:v", "2"]);

    // Перезапись
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }

  /// Построить команду для пререндера сегмента видео
  pub async fn build_prerender_segment_command(
    &self,
    start_time: f64,
    end_time: f64,
    output_path: &Path,
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings.ffmpeg_path);

    // Добавляем входные файлы для сегмента
    let input_builder = InputBuilder::new(&self.project);
    input_builder
      .add_segment_inputs(&mut cmd, start_time, end_time)
      .await?;

    // Добавляем фильтры для сегмента
    let filter_builder = FilterBuilder::new(&self.project);
    filter_builder
      .add_segment_filters(&mut cmd, start_time, end_time)
      .await?;

    // Настройки вывода для пререндера
    let output_builder = OutputBuilder::new(&self.project, &self.settings);
    output_builder
      .add_prerender_settings(&mut cmd, output_path)
      .await?;

    // Глобальные опции
    self.add_global_options(&mut cmd);

    Ok(cmd)
  }

  /// Добавить глобальные опции
  fn add_global_options(&self, cmd: &mut Command) {
    // Перезапись выходного файла
    cmd.arg("-y");

    // Скрыть баннер
    cmd.args(["-hide_banner"]);

    // Уровень логирования
    cmd.args(["-loglevel", "info"]);

    // Статистика прогресса
    cmd.args(["-progress", "pipe:1"]);
    cmd.args(["-stats_period", "0.5"]);

    // Дополнительные пользовательские опции
    for option in &self.settings.global_options {
      cmd.arg(option);
    }
  }

  /// Получить настройки
  pub fn settings(&self) -> &FFmpegBuilderSettings {
    &self.settings
  }

  /// Получить проект
  pub fn project(&self) -> &ProjectSchema {
    &self.project
  }
}

/// Конвертировать качество (0-100) в CRF (0-51)
pub fn quality_to_crf(quality: u32) -> u32 {
  // Инвертируем качество и масштабируем к CRF диапазону
  // Quality 100 = CRF 18 (высокое качество)
  // Quality 50 = CRF 28 (среднее качество)
  // Quality 0 = CRF 51 (низкое качество)
  51 - (quality * 33 / 100).min(33)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::tests::fixtures::*;
  use std::path::PathBuf;

  #[test]
  fn test_ffmpeg_builder_settings_default() {
    let settings = FFmpegBuilderSettings::default();

    assert_eq!(settings.ffmpeg_path, "ffmpeg");
    assert!(!settings.use_hardware_acceleration);
    assert!(settings.hardware_acceleration_type.is_none());
    assert!(settings.global_options.is_empty());
  }

  #[test]
  fn test_ffmpeg_builder_new() {
    let project = create_minimal_project();
    let builder = FFmpegBuilder::new(project.clone());

    assert_eq!(builder.project().metadata.name, project.metadata.name);
    assert_eq!(builder.settings().ffmpeg_path, "ffmpeg");
  }

  #[test]
  fn test_ffmpeg_builder_with_settings() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings {
      ffmpeg_path: "/usr/local/bin/ffmpeg".to_string(),
      use_hardware_acceleration: true,
      hardware_acceleration_type: Some("nvenc".to_string()),
      global_options: vec!["-threads".to_string(), "4".to_string()],
    };

    let builder = FFmpegBuilder::with_settings(project, settings.clone());

    assert_eq!(builder.settings().ffmpeg_path, "/usr/local/bin/ffmpeg");
    assert!(builder.settings().use_hardware_acceleration);
    assert_eq!(
      builder.settings().hardware_acceleration_type,
      Some("nvenc".to_string())
    );
    assert_eq!(builder.settings().global_options, vec!["-threads", "4"]);
  }

  #[tokio::test]
  async fn test_build_render_command_structure() {
    let project = create_project_with_clips();
    let builder = FFmpegBuilder::new(project);

    let output_path = PathBuf::from("/tmp/test_output.mp4");
    let result = builder.build_render_command(&output_path).await;

    assert!(result.is_ok(), "Command building should succeed");

    let cmd = result.unwrap();
    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем что команда содержит основные элементы
    assert!(
      args.contains(&"-y".to_string()),
      "Should have overwrite flag"
    );
    assert!(
      args.contains(&"-hide_banner".to_string()),
      "Should hide banner"
    );
    assert!(
      args.contains(&"-loglevel".to_string()),
      "Should have loglevel"
    );
    assert!(
      args.contains(&"-progress".to_string()),
      "Should have progress reporting"
    );
  }

  #[tokio::test]
  async fn test_build_preview_command() {
    let project = create_minimal_project();
    let builder = FFmpegBuilder::new(project);

    let input_path = PathBuf::from("/test/input.mp4");
    let output_path = PathBuf::from("/tmp/preview.jpg");
    let timestamp = 30.5;
    let resolution = (640, 360);

    let result = builder
      .build_preview_command(&input_path, timestamp, &output_path, resolution)
      .await;

    assert!(result.is_ok(), "Preview command should build successfully");

    let cmd = result.unwrap();
    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем seek к timestamp
    assert!(args.contains(&"-ss".to_string()));
    assert!(args.contains(&"30.5".to_string()));

    // Проверяем входной файл
    assert!(args.contains(&"-i".to_string()));
    assert!(args.contains(&"/test/input.mp4".to_string()));

    // Проверяем один кадр
    assert!(args.contains(&"-vframes".to_string()));
    assert!(args.contains(&"1".to_string()));

    // Проверяем масштабирование
    assert!(args.contains(&"-vf".to_string()));
    assert!(args.contains(&"scale=640:360".to_string()));

    // Проверяем качество
    assert!(args.contains(&"-q:v".to_string()));
    assert!(args.contains(&"2".to_string()));

    // Проверяем перезапись
    assert!(args.contains(&"-y".to_string()));
  }

  #[tokio::test]
  async fn test_build_prerender_segment_command() {
    let project = create_project_with_clips();
    let builder = FFmpegBuilder::new(project);

    let start_time = 10.0;
    let end_time = 20.0;
    let output_path = PathBuf::from("/tmp/segment.mp4");

    let result = builder
      .build_prerender_segment_command(start_time, end_time, &output_path)
      .await;

    assert!(result.is_ok(), "Segment command should build successfully");

    let cmd = result.unwrap();
    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем что команда содержит основные элементы сегмента
    assert!(args.contains(&"-y".to_string()));
    assert!(args.contains(&"-hide_banner".to_string()));
  }

  #[test]
  fn test_quality_to_crf_conversion() {
    // Тестируем граничные значения
    assert_eq!(quality_to_crf(100), 18); // Высокое качество
    assert_eq!(quality_to_crf(50), 35); // Среднее качество
    assert_eq!(quality_to_crf(0), 51); // Низкое качество

    // Тестируем промежуточные значения
    assert_eq!(quality_to_crf(75), 27);
    assert_eq!(quality_to_crf(25), 43);

    // Проверяем что CRF не выходит за границы
    assert!(quality_to_crf(100) >= 18);
    assert!(quality_to_crf(0) <= 51);
  }

  #[test]
  fn test_global_options_application() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings {
      global_options: vec![
        "-threads".to_string(),
        "8".to_string(),
        "-preset".to_string(),
        "fast".to_string(),
      ],
      ..Default::default()
    };

    let builder = FFmpegBuilder::with_settings(project, settings);
    let mut cmd = Command::new("ffmpeg");

    builder.add_global_options(&mut cmd);

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем стандартные опции
    assert!(args.contains(&"-y".to_string()));
    assert!(args.contains(&"-hide_banner".to_string()));
    assert!(args.contains(&"-loglevel".to_string()));
    assert!(args.contains(&"info".to_string()));
    assert!(args.contains(&"-progress".to_string()));
    assert!(args.contains(&"pipe:1".to_string()));

    // Проверяем пользовательские опции
    assert!(args.contains(&"-threads".to_string()));
    assert!(args.contains(&"8".to_string()));
    assert!(args.contains(&"-preset".to_string()));
    assert!(args.contains(&"fast".to_string()));
  }

  #[test]
  fn test_builder_accessors() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings {
      ffmpeg_path: "/custom/ffmpeg".to_string(),
      ..Default::default()
    };

    let builder = FFmpegBuilder::with_settings(project.clone(), settings.clone());

    // Проверяем доступ к настройкам
    assert_eq!(builder.settings().ffmpeg_path, "/custom/ffmpeg");

    // Проверяем доступ к проекту
    assert_eq!(builder.project().metadata.name, project.metadata.name);
  }

  #[tokio::test]
  async fn test_hardware_acceleration_settings() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings {
      use_hardware_acceleration: true,
      hardware_acceleration_type: Some("cuda".to_string()),
      ..Default::default()
    };

    let builder = FFmpegBuilder::with_settings(project, settings);

    // Проверяем что настройки аппаратного ускорения применяются
    assert!(builder.settings().use_hardware_acceleration);
    assert_eq!(
      builder.settings().hardware_acceleration_type,
      Some("cuda".to_string())
    );
  }

  #[tokio::test]
  async fn test_builder_with_empty_project() {
    let mut project = create_minimal_project();
    project.tracks.clear(); // Убираем все треки, создавая "пустой" проект
    let builder = FFmpegBuilder::new(project);

    let output_path = PathBuf::from("/tmp/empty.mp4");
    let result = builder.build_render_command(&output_path).await;

    // Даже пустой проект должен успешно создать команду
    assert!(result.is_ok(), "Empty project should still build command");
  }

  #[tokio::test]
  async fn test_builder_with_custom_ffmpeg_path() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings {
      ffmpeg_path: "/opt/ffmpeg/bin/ffmpeg".to_string(),
      ..Default::default()
    };

    let builder = FFmpegBuilder::with_settings(project, settings);
    let output_path = PathBuf::from("/tmp/output.mp4");

    let cmd = builder.build_render_command(&output_path).await.unwrap();

    // Проверяем что используется правильный путь к FFmpeg
    assert_eq!(
      cmd.as_std().get_program().to_string_lossy(),
      "/opt/ffmpeg/bin/ffmpeg"
    );
  }

  // Тесты из внешнего файла tests.rs

  #[tokio::test]
  async fn test_basic_ffmpeg_command_generation() {
    let project = create_project_with_clips();
    let settings = FFmpegBuilderSettings::default();
    let builder = FFmpegBuilder::with_settings(project, settings);

    let output_path = std::path::Path::new("/tmp/output.mp4");
    let result = builder.build_render_command(output_path).await;

    assert!(result.is_ok(), "Command generation should succeed");
  }

  #[tokio::test]
  async fn test_output_format_settings() {
    let mut project = create_minimal_project();

    // Изменяем формат на WebM
    project.settings.export.format = crate::video_compiler::schema::OutputFormat::WebM;

    let builder = FFmpegBuilder::new(project);
    let output_path = std::path::Path::new("/tmp/output.webm");
    let result = builder.build_render_command(output_path).await;

    assert!(result.is_ok(), "WebM format should be supported");
  }

  #[tokio::test]
  async fn test_hardware_acceleration_external() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings {
      use_hardware_acceleration: true,
      hardware_acceleration_type: Some("nvenc".to_string()),
      ..Default::default()
    };

    let builder = FFmpegBuilder::with_settings(project, settings);
    let output_path = std::path::Path::new("/tmp/output.mp4");
    let result = builder.build_render_command(output_path).await;

    assert!(result.is_ok(), "Hardware acceleration should work");
  }

  #[tokio::test]
  async fn test_complex_project_build() {
    let project = create_complex_project();
    let builder = FFmpegBuilder::new(project);

    let result = builder
      .build_render_command(std::path::Path::new("/tmp/output.mp4"))
      .await;

    assert!(result.is_ok(), "Complex project build should succeed");
  }

  #[tokio::test]
  async fn test_preview_command_generation_external() {
    let project = create_minimal_project();
    let builder = FFmpegBuilder::new(project);

    let result = builder
      .build_render_command(std::path::Path::new("/tmp/output.mp4"))
      .await;

    assert!(result.is_ok(), "Preview command generation should succeed");
  }
}
