//! Advanced FFmpeg operations
//!
//! Расширенные операции FFmpeg для специализированных задач

use std::path::{Path, PathBuf};
use tokio::process::Command;

use crate::video_compiler::error::Result;

use super::builder::FFmpegBuilder;

impl FFmpegBuilder {
  /// Построить команду для генерации миниатюр видео
  pub async fn build_thumbnails_command(
    &self,
    input_path: &Path,
    output_pattern: &str,
    count: u32,
    size: Option<(u32, u32)>,
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings().ffmpeg_path);

    // Входной файл
    cmd.args(["-i", &input_path.to_string_lossy()]);

    // Фильтр для выбора кадров
    let fps_filter = format!("fps=1/{count}");
    let mut filter_complex = fps_filter;

    // Добавляем масштабирование если указан размер
    if let Some((width, height)) = size {
      filter_complex = format!("{filter_complex},scale={width}:{height}");
    }

    cmd.args(["-vf", &filter_complex]);

    // Качество изображений
    cmd.args(["-q:v", "2"]);

    // Формат вывода
    cmd.args(["-f", "image2"]);

    // Шаблон для выходных файлов
    cmd.arg(output_pattern);

    Ok(cmd)
  }

  /// Построить команду для генерации видео превью (короткий клип)
  pub async fn build_video_preview_command(
    &self,
    input_path: &Path,
    output_path: &Path,
    duration: f64,
    size: Option<(u32, u32)>,
    bitrate: Option<u32>,
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings().ffmpeg_path);

    // Входной файл
    cmd.args(["-i", &input_path.to_string_lossy()]);

    // Ограничение длительности
    cmd.args(["-t", &duration.to_string()]);

    // Видео фильтры
    let mut filters = Vec::new();

    // Масштабирование
    if let Some((width, height)) = size {
      filters.push(format!("scale={width}:{height}"));
    }

    // Ускорение видео для создания быстрого превью
    filters.push("setpts=0.5*PTS".to_string());

    if !filters.is_empty() {
      cmd.args(["-vf", &filters.join(",")]);
    }

    // Битрейт
    if let Some(br) = bitrate {
      cmd.args(["-b:v", &format!("{br}k")]);
    } else {
      cmd.args(["-b:v", "1000k"]);
    }

    // Аудио настройки
    cmd.args(["-c:a", "aac", "-b:a", "128k"]);

    // Ускорить аудио вместе с видео
    cmd.args(["-af", "atempo=2.0"]);

    // Перезапись
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }

  /// Построить команду для извлечения аудио волны (waveform)
  pub async fn build_waveform_command(
    &self,
    input_path: &Path,
    output_path: &Path,
    size: (u32, u32),
    colors: &str,
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings().ffmpeg_path);

    // Входной файл
    cmd.args(["-i", &input_path.to_string_lossy()]);

    // Фильтр для генерации waveform
    let filter = format!("showwavespic=s={}x{}:colors={}", size.0, size.1, colors);

    cmd.args(["-filter_complex", &filter]);

    // Только один кадр
    cmd.args(["-frames:v", "1"]);

    // Перезапись
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }

  /// Построить команду для создания анимированного GIF превью
  pub async fn build_gif_preview_command(
    &self,
    input_path: &Path,
    output_path: &Path,
    start_time: f64,
    duration: f64,
    fps: u32,
    size: Option<(u32, u32)>,
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings().ffmpeg_path);

    // Начальная позиция
    cmd.args(["-ss", &start_time.to_string()]);

    // Входной файл
    cmd.args(["-i", &input_path.to_string_lossy()]);

    // Длительность
    cmd.args(["-t", &duration.to_string()]);

    // Сложный фильтр для оптимизированного GIF
    let mut filters = vec![format!("fps={}", fps)];

    // Масштабирование
    let (width, height) = size.unwrap_or((320, 180));
    filters.push(format!("scale={width}:{height}:flags=lanczos"));

    // Палитра для лучшего качества GIF
    let palette_filter = format!(
      "[0:v] {},split [a][b];[a] palettegen [p];[b][p] paletteuse",
      filters.join(",")
    );

    cmd.args(["-filter_complex", &palette_filter]);

    // Перезапись
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }

  /// Построить команду для объединения видео сегментов
  pub async fn build_concat_command(
    &self,
    segment_paths: &[PathBuf],
    output_path: &Path,
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings().ffmpeg_path);

    // Создаем concat filter
    let mut filter_parts = Vec::new();
    let mut stream_refs = Vec::new();

    // Добавляем все входные файлы
    for (i, path) in segment_paths.iter().enumerate() {
      cmd.args(["-i", &path.to_string_lossy()]);
      filter_parts.push(format!("[{i}:v][{i}:a]"));
      stream_refs.push(format!("[v{i}][a{i}]"));
    }

    // Concat filter
    let filter = format!(
      "{}concat=n={}:v=1:a=1[outv][outa]",
      filter_parts.join(""),
      segment_paths.len()
    );

    cmd.args(["-filter_complex", &filter]);

    // Мапим выходные потоки
    cmd.args(["-map", "[outv]", "-map", "[outa]"]);

    // Кодеки для вывода
    cmd.args(["-c:v", "libx264", "-preset", "fast"]);
    cmd.args(["-c:a", "aac"]);

    // Перезапись
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }

  /// Построить команду для применения видео фильтров
  pub async fn build_filter_preview_command(
    &self,
    input_path: &Path,
    output_path: &Path,
    filter_string: &str,
    timestamp: Option<f64>,
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings().ffmpeg_path);

    // Если указан timestamp, переходим к нему
    if let Some(ts) = timestamp {
      cmd.args(["-ss", &ts.to_string()]);
    }

    // Входной файл
    cmd.args(["-i", &input_path.to_string_lossy()]);

    // Применяем фильтр
    cmd.args(["-vf", filter_string]);

    // Для превью одного кадра
    if timestamp.is_some() {
      cmd.args(["-vframes", "1"]);
    } else {
      // Для видео превью ограничиваем длительность
      cmd.args(["-t", "3"]);
    }

    // Перезапись
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }

  /// Построить команду для извлечения метаданных
  pub async fn build_probe_command(&self, input_path: &Path) -> Result<Command> {
    // Используем ffprobe для получения метаданных
    let ffprobe_path = self.settings().ffmpeg_path.replace("ffmpeg", "ffprobe");
    let mut cmd = Command::new(&ffprobe_path);

    cmd.args([
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      &input_path.to_string_lossy(),
    ]);

    Ok(cmd)
  }

  /// Построить команду для проверки аппаратного ускорения
  pub async fn build_hwaccel_test_command(&self) -> Result<Command> {
    let mut cmd = Command::new(&self.settings().ffmpeg_path);

    // Список доступных аппаратных ускорителей
    cmd.args(["-hwaccels"]);

    Ok(cmd)
  }

  /// Построить команду для генерации превью с субтитрами
  pub async fn build_subtitle_preview_command(
    &self,
    input_path: &Path,
    subtitle_path: &Path,
    output_path: &Path,
    timestamp: f64,
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings().ffmpeg_path);

    // Переход к временной метке
    cmd.args(["-ss", &timestamp.to_string()]);

    // Входной видео файл
    cmd.args(["-i", &input_path.to_string_lossy()]);

    // Фильтр для субтитров
    let subtitle_filter = format!(
      "subtitles={}:force_style='Fontsize=24,PrimaryColour=&H00FFFFFF&'",
      subtitle_path.to_string_lossy()
    );

    cmd.args(["-vf", &subtitle_filter]);

    // Один кадр
    cmd.args(["-vframes", "1"]);

    // Качество
    cmd.args(["-q:v", "2"]);

    // Перезапись
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }
}

#[cfg(test)]
mod tests;
