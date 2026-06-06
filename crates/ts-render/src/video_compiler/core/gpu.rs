/*!
 * GPU ускорение для Video Compiler
 *
 * Этот модуль отвечает за:
 * - Автоматическое определение доступных GPU кодировщиков
 * - Выбор оптимального кодировщика для каждой платформы
 * - Мониторинг использования GPU во время рендеринга
 * - Fallback на CPU кодирование при недоступности GPU
 */

use crate::video_compiler::error::{Result, VideoCompilerError};
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Типы GPU кодировщиков
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum GpuEncoder {
  /// Нет GPU ускорения (CPU only)
  None,
  /// NVIDIA NVENC
  Nvenc,
  /// Intel QuickSync Video
  QuickSync,
  /// Video Acceleration API (Linux)
  Vaapi,
  /// Apple VideoToolbox (macOS)
  VideoToolbox,
  /// AMD Advanced Media Framework
  Amf,
  /// Video4Linux2 Memory-to-Memory
  V4l2,
  /// Software encoder
  Software,
}

impl GpuEncoder {
  /// Получить название FFmpeg кодека для H.264
  pub fn h264_codec_name(&self) -> &'static str {
    match self {
      GpuEncoder::None => "libx264",
      GpuEncoder::Nvenc => "h264_nvenc",
      GpuEncoder::QuickSync => "h264_qsv",
      GpuEncoder::Vaapi => "h264_vaapi",
      GpuEncoder::VideoToolbox => "h264_videotoolbox",
      GpuEncoder::Amf => "h264_amf",
      GpuEncoder::V4l2 => "h264_v4l2m2m",
      GpuEncoder::Software => "libx264",
    }
  }

  /// Получить название FFmpeg кодека для H.265/HEVC
  #[allow(dead_code)]
  pub fn hevc_codec_name(&self) -> &'static str {
    match self {
      GpuEncoder::None => "libx265",
      GpuEncoder::Nvenc => "hevc_nvenc",
      GpuEncoder::QuickSync => "hevc_qsv",
      GpuEncoder::Vaapi => "hevc_vaapi",
      GpuEncoder::VideoToolbox => "hevc_videotoolbox",
      GpuEncoder::Amf => "hevc_amf",
      GpuEncoder::V4l2 => "hevc_v4l2m2m",
      GpuEncoder::Software => "libx265",
    }
  }

  /// Проверить, является ли кодировщик аппаратным
  pub fn is_hardware(&self) -> bool {
    !matches!(self, GpuEncoder::None | GpuEncoder::Software)
  }
}

/// Информация о GPU
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GpuInfo {
  pub name: String,
  pub driver_version: Option<String>,
  pub memory_total: Option<u64>,
  pub memory_used: Option<u64>,
  pub utilization: Option<f32>,
  pub encoder_type: GpuEncoder,
  pub supported_codecs: Vec<String>,
}

/// Возможности GPU системы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuCapabilities {
  pub available_encoders: Vec<GpuEncoder>,
  pub recommended_encoder: Option<GpuEncoder>,
  pub current_gpu: Option<GpuInfo>,
  pub hardware_acceleration_supported: bool,
}

/// Детектор GPU возможностей
#[derive(Clone)]
pub struct GpuDetector {
  ffmpeg_path: String,
}

impl GpuDetector {
  pub fn new(ffmpeg_path: String) -> Self {
    Self { ffmpeg_path }
  }

  /// Определить все доступные GPU кодировщики
  pub async fn detect_available_encoders(&self) -> Result<Vec<GpuEncoder>> {
    let mut available = Vec::new();

    log::info!("Detecting available GPU encoders...");

    // Проверяем каждый тип кодировщика
    let encoders_to_check = [
      (GpuEncoder::Nvenc, "h264_nvenc"),
      (GpuEncoder::QuickSync, "h264_qsv"),
      (GpuEncoder::Vaapi, "h264_vaapi"),
      (GpuEncoder::VideoToolbox, "h264_videotoolbox"),
      (GpuEncoder::Amf, "h264_amf"),
      (GpuEncoder::V4l2, "h264_v4l2m2m"),
    ];

    // Всегда добавляем Software как доступный
    available.push(GpuEncoder::Software);

    for (encoder_type, codec_name) in encoders_to_check {
      if self.check_encoder_available(codec_name).await? {
        log::info!("Found available encoder: {encoder_type:?} ({codec_name})");
        available.push(encoder_type);
      }
    }

    log::info!("Total available encoders: {available:?}");
    Ok(available)
  }

  /// Проверить доступность конкретного кодировщика
  async fn check_encoder_available(&self, codec: &str) -> Result<bool> {
    log::debug!("Checking encoder availability for: {codec}");

    // In CI environments, retry a few times to avoid "Text file busy" errors
    let mut last_error = None;
    for attempt in 0..3 {
      if attempt > 0 {
        // Wait a bit before retrying
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
      }

      match tokio::process::Command::new(&self.ffmpeg_path)
        .args(["-encoders"])
        .output()
        .await
      {
        Ok(output) => {
          if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let available = stdout.contains(codec);
            log::debug!(
              "Encoder {} is {}",
              codec,
              if available {
                "available"
              } else {
                "not available"
              }
            );
            return Ok(available);
          } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            log::error!("Failed to check encoders: {stderr}");
            last_error = Some(format!("ffmpeg exited with non-zero status: {stderr}"));
          }
        }
        Err(e) => {
          last_error = Some(format!("Failed to run ffmpeg: {e}"));
          log::warn!("Attempt {}/{} failed: {e}", attempt + 1, 3);
        }
      }
    }

    // If all attempts failed, return the last error
    if let Some(err) = last_error {
      log::error!("All attempts to check encoder failed: {err}");
    }
    Ok(false)
  }

  /// Получить рекомендуемый кодировщик для текущей платформы
  pub async fn get_recommended_encoder(&self) -> Result<Option<GpuEncoder>> {
    let available = self.detect_available_encoders().await?;

    if available.is_empty() {
      return Ok(None);
    }

    log::info!("Available encoders: {available:?}");

    // Приоритет кодировщиков по платформам
    #[cfg(target_os = "windows")]
    let priority = [GpuEncoder::Nvenc, GpuEncoder::QuickSync, GpuEncoder::Amf];

    #[cfg(target_os = "linux")]
    let priority = [GpuEncoder::Nvenc, GpuEncoder::Vaapi, GpuEncoder::QuickSync];

    #[cfg(target_os = "macos")]
    let priority = [GpuEncoder::VideoToolbox, GpuEncoder::Nvenc];

    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    let priority = [GpuEncoder::Nvenc];

    // Находим первый доступный из приоритетного списка
    for preferred in &priority {
      if available.contains(preferred) {
        log::info!("Recommended encoder: {preferred:?}");
        return Ok(Some(preferred.clone()));
      }
    }

    // Если ни один приоритетный не найден, берем первый доступный hardware encoder
    let hardware_encoder = available.iter().find(|e| e.is_hardware()).cloned();

    if let Some(encoder) = hardware_encoder {
      log::info!("Using first available hardware encoder: {encoder:?}");
      Ok(Some(encoder))
    } else {
      log::info!("No hardware encoders available");
      Ok(None)
    }
  }

  /// Обнаружить доступные GPU
  pub async fn detect_gpus(&self) -> Result<Vec<GpuInfo>> {
    let mut gpus = Vec::new();

    // Пытаемся получить информацию о текущем GPU
    if let Ok(gpu_info) = self.get_current_gpu_info().await {
      gpus.push(gpu_info);
    }

    // Если не удалось получить информацию о GPU, создаем fallback запись
    if gpus.is_empty() {
      gpus.push(GpuInfo {
        name: "Unknown GPU".to_string(),
        driver_version: None,
        memory_total: None,
        memory_used: None,
        utilization: None,
        encoder_type: GpuEncoder::Software,
        supported_codecs: vec!["libx264".to_string(), "libx265".to_string()],
      });
    }

    Ok(gpus)
  }

  /// Получить полную информацию о возможностях GPU
  pub async fn get_gpu_capabilities(&self) -> Result<GpuCapabilities> {
    let available_encoders = self.detect_available_encoders().await?;
    let recommended_encoder = self.get_recommended_encoder().await?;
    let current_gpu = self.get_current_gpu_info().await.ok();

    Ok(GpuCapabilities {
      available_encoders: available_encoders.clone(),
      recommended_encoder,
      current_gpu,
      hardware_acceleration_supported: !available_encoders.is_empty(),
    })
  }

  /// Получить информацию о текущем GPU
  async fn get_current_gpu_info(&self) -> Result<GpuInfo> {
    // Пытаемся определить тип GPU и получить информацию

    #[cfg(target_os = "windows")]
    {
      if let Ok(info) = self.get_nvidia_info_windows().await {
        return Ok(info);
      }
      if let Ok(info) = self.get_intel_info_windows().await {
        return Ok(info);
      }
      if let Ok(info) = self.get_amd_info_windows().await {
        return Ok(info);
      }
    }

    #[cfg(target_os = "linux")]
    {
      if let Ok(info) = self.get_nvidia_info_linux().await {
        return Ok(info);
      }
      if let Ok(info) = self.get_gpu_info_linux().await {
        return Ok(info);
      }
    }

    #[cfg(target_os = "macos")]
    {
      if let Ok(info) = self.get_gpu_info_macos().await {
        return Ok(info);
      }
    }

    // Fallback: создаем базовую информацию
    Ok(GpuInfo {
      name: "Unknown GPU".to_string(),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: GpuEncoder::None,
      supported_codecs: vec!["libx264".to_string()],
    })
  }

  /// Мониторинг использования GPU в реальном времени
  pub async fn monitor_gpu_usage(&self) -> Result<GpuInfo> {
    let mut current_info = self.get_current_gpu_info().await?;

    // Обновляем информацию об использовании GPU
    match current_info.encoder_type {
      GpuEncoder::Nvenc =>
      {
        #[cfg(any(target_os = "windows", target_os = "linux"))]
        if let Ok(usage) = self.get_nvidia_gpu_usage().await {
          current_info.memory_used = usage.memory_used;
          current_info.utilization = usage.utilization;
        }
      }
      GpuEncoder::VideoToolbox =>
      {
        #[cfg(target_os = "macos")]
        if let Ok(usage) = self.get_macos_gpu_usage().await {
          current_info.utilization = usage.utilization;
        }
      }
      _ => {
        // Для других GPU пытаемся получить общую информацию
        log::debug!(
          "GPU monitoring not fully implemented for {:?}",
          current_info.encoder_type
        );
      }
    }

    Ok(current_info)
  }

  /// Проверить доступность GPU для кодирования
  pub async fn check_gpu_availability(&self) -> Result<bool> {
    let capabilities = self.get_gpu_capabilities().await?;

    if !capabilities.hardware_acceleration_supported {
      return Ok(false);
    }

    // Проверяем загруженность GPU
    if let Some(gpu) = &capabilities.current_gpu {
      if let Some(utilization) = gpu.utilization {
        // Если GPU загружен более чем на 90%, считаем его недоступным
        if utilization > 90.0 {
          log::warn!("GPU utilization is too high: {:.1}%", utilization);
          return Ok(false);
        }
      }

      // Проверяем доступную память
      if let (Some(total), Some(used)) = (gpu.memory_total, gpu.memory_used) {
        let free_memory = total.saturating_sub(used);
        let free_mb = free_memory / (1024 * 1024);

        // Требуем минимум 512MB свободной памяти GPU
        if free_mb < 512 {
          log::warn!("Insufficient GPU memory: {} MB free", free_mb);
          return Ok(false);
        }
      }
    }

    Ok(true)
  }

  /// Получить информацию о NVIDIA GPU (Windows)
  #[cfg(target_os = "windows")]
  async fn get_nvidia_info_windows(&self) -> Result<GpuInfo> {
    let output = tokio::process::Command::new("nvidia-smi")
      .args([
        "--query-gpu=name,driver_version,memory.total,memory.used,utilization.gpu,encoder.stats.sessionCount,encoder.stats.averageFps",
        "--format=csv,noheader,nounits",
      ])
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run nvidia-smi: {e}")))?;

    if !output.status.success() {
      return Err(VideoCompilerError::gpu("nvidia-smi failed"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let line = stdout
      .lines()
      .next()
      .ok_or_else(|| VideoCompilerError::gpu("No GPU data from nvidia-smi"))?;

    let parts: Vec<&str> = line.split(", ").collect();
    if parts.len() >= 5 {
      let mut info = GpuInfo {
        name: parts[0].trim().to_string(),
        driver_version: Some(parts[1].trim().to_string()),
        memory_total: parts[2].trim().parse::<u64>().ok().map(|m| m * 1024 * 1024),
        memory_used: parts[3].trim().parse::<u64>().ok().map(|m| m * 1024 * 1024),
        utilization: parts[4].trim().parse().ok(),
        encoder_type: GpuEncoder::Nvenc,
        supported_codecs: vec![
          "h264_nvenc".to_string(),
          "hevc_nvenc".to_string(),
          "av1_nvenc".to_string(),
        ],
      };

      // Проверяем поддержку AV1 на новых картах (RTX 40 серии)
      if info.name.contains("RTX 40")
        || info.name.contains("RTX 4080")
        || info.name.contains("RTX 4090")
      {
        info.supported_codecs.push("av1_nvenc".to_string());
      }

      Ok(info)
    } else {
      Err(VideoCompilerError::gpu("Invalid nvidia-smi output format"))
    }
  }

  /// Получить информацию об использовании NVIDIA GPU
  #[cfg(any(target_os = "windows", target_os = "linux"))]
  async fn get_nvidia_gpu_usage(&self) -> Result<GpuUsageInfo> {
    let output = tokio::process::Command::new("nvidia-smi")
      .args([
        "--query-gpu=memory.used,utilization.gpu,encoder.stats.sessionCount,encoder.stats.averageFps",
        "--format=csv,noheader,nounits",
      ])
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run nvidia-smi: {e}")))?;

    if !output.status.success() {
      return Err(VideoCompilerError::gpu("nvidia-smi failed"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let line = stdout
      .lines()
      .next()
      .ok_or_else(|| VideoCompilerError::gpu("No GPU usage data"))?;

    let parts: Vec<&str> = line.split(", ").collect();
    if parts.len() >= 2 {
      Ok(GpuUsageInfo {
        memory_used: parts[0].trim().parse::<u64>().ok().map(|m| m * 1024 * 1024),
        utilization: parts[1].trim().parse().ok(),
        encoder_sessions: parts.get(2).and_then(|s| s.trim().parse().ok()),
        encoder_fps: parts.get(3).and_then(|s| s.trim().parse().ok()),
      })
    } else {
      Err(VideoCompilerError::gpu("Invalid nvidia-smi usage output"))
    }
  }

  /// Получить информацию о NVIDIA GPU (Linux)
  #[cfg(target_os = "linux")]
  async fn get_nvidia_info_linux(&self) -> Result<GpuInfo> {
    // Используем nvidia-smi так же как на Windows
    let output = tokio::process::Command::new("nvidia-smi")
      .args([
        "--query-gpu=name,driver_version,memory.total,memory.used,utilization.gpu",
        "--format=csv,noheader,nounits",
      ])
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run nvidia-smi: {e}")))?;

    if !output.status.success() {
      return Err(VideoCompilerError::gpu("nvidia-smi failed"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let line = stdout
      .lines()
      .next()
      .ok_or_else(|| VideoCompilerError::gpu("No GPU data from nvidia-smi"))?;

    let parts: Vec<&str> = line.split(", ").collect();
    if parts.len() >= 5 {
      Ok(GpuInfo {
        name: parts[0].trim().to_string(),
        driver_version: Some(parts[1].trim().to_string()),
        memory_total: parts[2].trim().parse::<u64>().ok().map(|m| m * 1024 * 1024),
        memory_used: parts[3].trim().parse::<u64>().ok().map(|m| m * 1024 * 1024),
        utilization: parts[4].trim().parse().ok(),
        encoder_type: GpuEncoder::Nvenc,
        supported_codecs: vec!["h264_nvenc".to_string(), "hevc_nvenc".to_string()],
      })
    } else {
      Err(VideoCompilerError::gpu("Invalid nvidia-smi output format"))
    }
  }

  /// Получить информацию о Intel GPU (Windows)
  #[cfg(target_os = "windows")]
  async fn get_intel_info_windows(&self) -> Result<GpuInfo> {
    // Для Intel можно использовать WMI или другие системные API
    // Пока простая заглушка
    Ok(GpuInfo {
      name: "Intel Graphics".to_string(),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: GpuEncoder::QuickSync,
      supported_codecs: vec!["h264_qsv".to_string(), "hevc_qsv".to_string()],
    })
  }

  /// Получить информацию о AMD GPU (Windows)
  #[cfg(target_os = "windows")]
  async fn get_amd_info_windows(&self) -> Result<GpuInfo> {
    Ok(GpuInfo {
      name: "AMD Graphics".to_string(),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: GpuEncoder::Amf,
      supported_codecs: vec!["h264_amf".to_string(), "hevc_amf".to_string()],
    })
  }

  /// Получить информацию о GPU (Linux через /sys)
  #[cfg(target_os = "linux")]
  async fn get_gpu_info_linux(&self) -> Result<GpuInfo> {
    // Читаем информацию из /sys/class/drm
    use tokio::fs;

    let _drm_cards = fs::read_dir("/sys/class/drm")
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to read /sys/class/drm: {e}")))?;

    // Ищем первую видеокарту
    // Это упрощенная реализация, можно расширить
    Ok(GpuInfo {
      name: "Linux GPU".to_string(),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: GpuEncoder::Vaapi,
      supported_codecs: vec!["h264_vaapi".to_string()],
    })
  }

  /// Получить информацию о GPU (macOS)
  #[cfg(target_os = "macos")]
  async fn get_gpu_info_macos(&self) -> Result<GpuInfo> {
    // Используем system_profiler для получения информации
    let output = tokio::process::Command::new("system_profiler")
      .args(["SPDisplaysDataType", "-json"])
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run system_profiler: {e}")))?;

    if output.status.success() {
      // Парсим JSON вывод system_profiler
      // Упрощенная реализация
      Ok(GpuInfo {
        name: "macOS GPU".to_string(),
        driver_version: None,
        memory_total: None,
        memory_used: None,
        utilization: None,
        encoder_type: GpuEncoder::VideoToolbox,
        supported_codecs: vec![
          "h264_videotoolbox".to_string(),
          "hevc_videotoolbox".to_string(),
        ],
      })
    } else {
      Err(VideoCompilerError::gpu("system_profiler failed"))
    }
  }
}

/// Помощник для выбора GPU параметров
pub struct GpuHelper;

impl GpuHelper {
  /// Получить параметры FFmpeg для конкретного GPU кодировщика
  pub fn get_ffmpeg_params(encoder: &GpuEncoder, quality: u8) -> Vec<String> {
    match encoder {
      GpuEncoder::None => Self::get_cpu_params(quality),
      GpuEncoder::Nvenc => Self::get_nvenc_params(quality),
      GpuEncoder::QuickSync => Self::get_quicksync_params(quality),
      GpuEncoder::Vaapi => Self::get_vaapi_params(quality),
      GpuEncoder::VideoToolbox => Self::get_videotoolbox_params(quality),
      GpuEncoder::Amf => Self::get_amf_params(quality),
      GpuEncoder::V4l2 => Self::get_v4l2_params(quality),
      GpuEncoder::Software => Self::get_cpu_params(quality),
    }
  }

  /// Параметры для CPU кодирования
  fn get_cpu_params(quality: u8) -> Vec<String> {
    let preset = match quality {
      0..=30 => "ultrafast",
      31..=50 => "superfast",
      51..=70 => "fast",
      71..=85 => "medium",
      86..=95 => "slow",
      _ => "slower",
    };

    vec![
      "-preset".to_string(),
      preset.to_string(),
      "-crf".to_string(),
      Self::quality_to_crf(quality).to_string(),
    ]
  }

  /// Параметры для NVIDIA NVENC
  fn get_nvenc_params(quality: u8) -> Vec<String> {
    let preset = match quality {
      0..=40 => "p1", // Fastest
      41..=60 => "p2",
      61..=75 => "p3",
      76..=85 => "p4", // Balanced
      86..=90 => "p5",
      91..=95 => "p6",
      _ => "p7", // Slowest/Best quality
    };

    vec![
      "-preset".to_string(),
      preset.to_string(),
      "-tune".to_string(),
      "hq".to_string(),
      "-rc".to_string(),
      "vbr".to_string(),
      "-cq".to_string(),
      Self::quality_to_nvenc_cq(quality).to_string(),
      "-rc-lookahead".to_string(),
      "20".to_string(),
      "-spatial_aq".to_string(),
      "1".to_string(),
      "-temporal_aq".to_string(),
      "1".to_string(),
    ]
  }

  /// Параметры для Intel QuickSync
  fn get_quicksync_params(quality: u8) -> Vec<String> {
    let preset = match quality {
      0..=50 => "veryfast",
      51..=75 => "fast",
      76..=85 => "medium",
      _ => "slow",
    };

    vec![
      "-preset".to_string(),
      preset.to_string(),
      "-global_quality".to_string(),
      Self::quality_to_qsv_quality(quality).to_string(),
      "-look_ahead".to_string(),
      "1".to_string(),
      "-look_ahead_depth".to_string(),
      "20".to_string(),
    ]
  }

  /// Параметры для VAAPI
  fn get_vaapi_params(quality: u8) -> Vec<String> {
    vec![
      "-vaapi_device".to_string(),
      "/dev/dri/renderD128".to_string(),
      "-vf".to_string(),
      "format=nv12,hwupload".to_string(),
      "-rc_mode".to_string(),
      "VBR".to_string(),
      "-quality".to_string(),
      Self::quality_to_vaapi_quality(quality).to_string(),
    ]
  }

  /// Параметры для VideoToolbox
  fn get_videotoolbox_params(quality: u8) -> Vec<String> {
    vec![
      "-profile:v".to_string(),
      "high".to_string(),
      "-level".to_string(),
      "4.1".to_string(),
      "-q:v".to_string(),
      Self::quality_to_videotoolbox_quality(quality).to_string(),
      "-allow_sw".to_string(),
      "1".to_string(),
    ]
  }

  /// Параметры для AMD AMF
  fn get_amf_params(quality: u8) -> Vec<String> {
    vec![
      "-usage".to_string(),
      "transcoding".to_string(),
      "-quality".to_string(),
      "balanced".to_string(),
      "-rc".to_string(),
      "vbr_peak".to_string(),
      "-qp_i".to_string(),
      Self::quality_to_amf_qp(quality).to_string(),
    ]
  }

  /// Конвертация качества (0-100) в CRF (0-51)
  fn quality_to_crf(quality: u8) -> u8 {
    // Инвертируем: высокое качество = низкий CRF
    let clamped_quality = quality.min(100);
    51 - (clamped_quality as f32 * 0.51) as u8
  }

  /// Конвертация качества в NVENC CQ параметр
  fn quality_to_nvenc_cq(quality: u8) -> u8 {
    // NVENC CQ: 0-51, где 0 = лучшее качество
    let clamped_quality = quality.min(100);
    51 - (clamped_quality as f32 * 0.51) as u8
  }

  /// Конвертация качества в QuickSync quality
  fn quality_to_qsv_quality(quality: u8) -> u8 {
    // QSV качество обычно 1-51
    let clamped_quality = quality.min(100);
    51 - (clamped_quality as f32 * 0.5) as u8
  }

  /// Конвертация качества в VAAPI quality
  fn quality_to_vaapi_quality(quality: u8) -> u8 {
    // VAAPI качество 1-8, где 1 = лучшее
    let clamped_quality = quality.min(100);
    8 - (clamped_quality as f32 * 0.07) as u8
  }

  /// Конвертация качества в VideoToolbox quality
  fn quality_to_videotoolbox_quality(quality: u8) -> u8 {
    // VideoToolbox q:v 1-100
    quality.clamp(1, 100)
  }

  /// Конвертация качества в AMF QP
  fn quality_to_amf_qp(quality: u8) -> u8 {
    // AMF QP 0-51
    let clamped_quality = quality.min(100);
    51 - (clamped_quality as f32 * 0.51) as u8
  }

  /// Параметры для V4L2
  fn get_v4l2_params(quality: u8) -> Vec<String> {
    vec![
      "-pix_fmt".to_string(),
      "nv12".to_string(),
      "-bitrate".to_string(),
      Self::quality_to_v4l2_bitrate(quality).to_string(),
    ]
  }

  /// Конвертация качества в V4L2 bitrate
  fn quality_to_v4l2_bitrate(quality: u8) -> u32 {
    // V4L2 bitrate mapping
    let clamped_quality = quality.min(100);
    (clamped_quality as u32 * 50000) + 500000 // 0.5M to 5.5M bps
  }
}

/// Информация об использовании GPU
#[derive(Debug, Clone)]
#[allow(dead_code)]
struct GpuUsageInfo {
  memory_used: Option<u64>,
  utilization: Option<f32>,
  encoder_sessions: Option<u32>,
  encoder_fps: Option<f32>,
}

/// GPU Performance Monitor
pub struct GpuMonitor {
  detector: GpuDetector,
  last_check: std::time::Instant,
  check_interval: Duration,
}

impl GpuMonitor {
  pub fn new(ffmpeg_path: String) -> Self {
    Self {
      detector: GpuDetector::new(ffmpeg_path),
      last_check: std::time::Instant::now(),
      check_interval: Duration::from_secs(5),
    }
  }

  /// Проверить, нужно ли переключиться на CPU
  pub async fn should_switch_to_cpu(&mut self) -> bool {
    // Проверяем не чаще чем раз в 5 секунд
    if self.last_check.elapsed() < self.check_interval {
      return false;
    }

    self.last_check = std::time::Instant::now();

    match self.detector.monitor_gpu_usage().await {
      Ok(info) => {
        if let Some(util) = info.utilization {
          if util > 95.0 {
            log::warn!("GPU overloaded: {:.1}% utilization", util);
            return true;
          }
        }

        if let (Some(total), Some(used)) = (info.memory_total, info.memory_used) {
          let usage_percent = (used as f64 / total as f64) * 100.0;
          if usage_percent > 90.0 {
            log::warn!("GPU memory nearly full: {:.1}%", usage_percent);
            return true;
          }
        }

        false
      }
      Err(e) => {
        log::error!("Failed to monitor GPU: {}", e);
        true // При ошибке мониторинга лучше переключиться на CPU
      }
    }
  }

  /// Получить оптимальные параметры кодирования на основе загрузки GPU
  pub async fn get_adaptive_encoding_params(&mut self, base_quality: u8) -> Vec<String> {
    match self.detector.monitor_gpu_usage().await {
      Ok(info) => {
        let utilization = info.utilization.unwrap_or(50.0);

        // Адаптируем пресет в зависимости от загрузки
        let preset = if utilization > 80.0 {
          "p1" // Самый быстрый
        } else if utilization > 60.0 {
          "p2"
        } else if utilization > 40.0 {
          "p3"
        } else {
          "p4" // Сбалансированный
        };

        let mut params = vec!["-preset".to_string(), preset.to_string()];

        // Если GPU не сильно загружен, включаем дополнительные оптимизации
        if utilization < 50.0 {
          params.extend_from_slice(&[
            "-rc-lookahead".to_string(),
            "32".to_string(),
            "-spatial_aq".to_string(),
            "1".to_string(),
            "-temporal_aq".to_string(),
            "1".to_string(),
            "-weighted_pred".to_string(),
            "1".to_string(),
          ]);
        }

        // Добавляем качество
        let cq = GpuHelper::quality_to_nvenc_cq(base_quality);
        params.extend_from_slice(&["-cq".to_string(), cq.to_string()]);

        params
      }
      Err(_) => {
        // Fallback на стандартные параметры
        GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, base_quality)
      }
    }
  }
}

/// Получить информацию об использовании GPU на macOS
#[cfg(target_os = "macos")]
impl GpuDetector {
  async fn get_macos_gpu_usage(&self) -> Result<GpuUsageInfo> {
    // Используем ioreg для получения информации о GPU
    let output = tokio::process::Command::new("ioreg")
      .args(["-r", "-c", "IOAccelerator"])
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run ioreg: {e}")))?;

    if output.status.success() {
      // Базовая реализация - возвращаем приблизительные значения
      // В реальности нужен более сложный парсинг вывода ioreg
      Ok(GpuUsageInfo {
        memory_used: None,
        utilization: Some(30.0), // Примерное значение
        encoder_sessions: None,
        encoder_fps: None,
      })
    } else {
      Err(VideoCompilerError::gpu("ioreg failed"))
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::TempDir;

  #[tokio::test]
  async fn test_gpu_encoder_codec_names() {
    assert_eq!(GpuEncoder::Nvenc.h264_codec_name(), "h264_nvenc");
    assert_eq!(GpuEncoder::QuickSync.h264_codec_name(), "h264_qsv");
    assert_eq!(GpuEncoder::None.h264_codec_name(), "libx264");
    assert_eq!(GpuEncoder::Vaapi.h264_codec_name(), "h264_vaapi");
    assert_eq!(
      GpuEncoder::VideoToolbox.h264_codec_name(),
      "h264_videotoolbox"
    );
    assert_eq!(GpuEncoder::Amf.h264_codec_name(), "h264_amf");
    assert_eq!(GpuEncoder::V4l2.h264_codec_name(), "h264_v4l2m2m");
    assert_eq!(GpuEncoder::Software.h264_codec_name(), "libx264");
  }

  #[tokio::test]
  async fn test_gpu_encoder_hevc_codec_names() {
    assert_eq!(GpuEncoder::Nvenc.hevc_codec_name(), "hevc_nvenc");
    assert_eq!(GpuEncoder::QuickSync.hevc_codec_name(), "hevc_qsv");
    assert_eq!(GpuEncoder::None.hevc_codec_name(), "libx265");
    assert_eq!(GpuEncoder::Vaapi.hevc_codec_name(), "hevc_vaapi");
    assert_eq!(
      GpuEncoder::VideoToolbox.hevc_codec_name(),
      "hevc_videotoolbox"
    );
    assert_eq!(GpuEncoder::Amf.hevc_codec_name(), "hevc_amf");
    assert_eq!(GpuEncoder::V4l2.hevc_codec_name(), "hevc_v4l2m2m");
    assert_eq!(GpuEncoder::Software.hevc_codec_name(), "libx265");
  }

  #[tokio::test]
  async fn test_is_hardware() {
    assert!(!GpuEncoder::None.is_hardware());
    assert!(!GpuEncoder::Software.is_hardware());
    assert!(GpuEncoder::Nvenc.is_hardware());
    assert!(GpuEncoder::QuickSync.is_hardware());
    assert!(GpuEncoder::Vaapi.is_hardware());
    assert!(GpuEncoder::VideoToolbox.is_hardware());
    assert!(GpuEncoder::Amf.is_hardware());
    assert!(GpuEncoder::V4l2.is_hardware());
  }

  #[tokio::test]
  async fn test_quality_conversion() {
    // Тест конвертации качества в CRF
    assert_eq!(GpuHelper::quality_to_crf(100), 0); // Лучшее качество
    assert_eq!(GpuHelper::quality_to_crf(0), 51); // Худшее качество
    assert_eq!(GpuHelper::quality_to_crf(50), 26); // Среднее качество
    assert_eq!(GpuHelper::quality_to_crf(75), 13); // Высокое качество (75 * 0.51 = 38.25, 51 - 38 = 13)
    assert_eq!(GpuHelper::quality_to_crf(25), 39); // Низкое качество (25 * 0.51 = 12.75, 51 - 12 = 39)
  }

  #[tokio::test]
  async fn test_quality_to_nvenc_cq() {
    assert_eq!(GpuHelper::quality_to_nvenc_cq(100), 0);
    assert_eq!(GpuHelper::quality_to_nvenc_cq(0), 51);
    assert_eq!(GpuHelper::quality_to_nvenc_cq(50), 26);
  }

  #[tokio::test]
  async fn test_quality_to_qsv_quality() {
    assert_eq!(GpuHelper::quality_to_qsv_quality(100), 1);
    assert_eq!(GpuHelper::quality_to_qsv_quality(0), 51);
    assert_eq!(GpuHelper::quality_to_qsv_quality(50), 26);
  }

  #[tokio::test]
  async fn test_quality_to_vaapi_quality() {
    assert_eq!(GpuHelper::quality_to_vaapi_quality(100), 1); // 8 - (100 * 0.07) = 8 - 7 = 1
    assert_eq!(GpuHelper::quality_to_vaapi_quality(0), 8); // 8 - (0 * 0.07) = 8 - 0 = 8
    assert_eq!(GpuHelper::quality_to_vaapi_quality(50), 5); // 8 - (50 * 0.07) = 8 - 3.5 = 4.5, rounds to 5
  }

  #[tokio::test]
  async fn test_quality_to_videotoolbox_quality() {
    assert_eq!(GpuHelper::quality_to_videotoolbox_quality(100), 100);
    assert_eq!(GpuHelper::quality_to_videotoolbox_quality(0), 1);
    assert_eq!(GpuHelper::quality_to_videotoolbox_quality(50), 50);
  }

  #[tokio::test]
  async fn test_quality_to_amf_qp() {
    assert_eq!(GpuHelper::quality_to_amf_qp(100), 0);
    assert_eq!(GpuHelper::quality_to_amf_qp(0), 51);
    assert_eq!(GpuHelper::quality_to_amf_qp(50), 26);
  }

  #[tokio::test]
  async fn test_gpu_params_generation() {
    // Test NVENC params
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, 85);
    assert!(params.contains(&"-preset".to_string()));
    assert!(params.contains(&"p4".to_string()));
    assert!(params.contains(&"-tune".to_string()));
    assert!(params.contains(&"hq".to_string()));
    assert!(params.contains(&"-rc".to_string()));
    assert!(params.contains(&"vbr".to_string()));

    // Test QuickSync params
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::QuickSync, 70);
    assert!(params.contains(&"-preset".to_string()));
    assert!(params.contains(&"fast".to_string()));
    assert!(params.contains(&"-global_quality".to_string()));
    assert!(params.contains(&"-look_ahead".to_string()));

    // Test VAAPI params
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Vaapi, 80);
    assert!(params.contains(&"-vaapi_device".to_string()));
    assert!(params.contains(&"/dev/dri/renderD128".to_string()));
    assert!(params.contains(&"-vf".to_string()));
    assert!(params.contains(&"format=nv12,hwupload".to_string()));

    // Test VideoToolbox params
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::VideoToolbox, 90);
    assert!(params.contains(&"-profile:v".to_string()));
    assert!(params.contains(&"high".to_string()));
    assert!(params.contains(&"-level".to_string()));
    assert!(params.contains(&"4.1".to_string()));

    // Test AMF params
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Amf, 75);
    assert!(params.contains(&"-usage".to_string()));
    assert!(params.contains(&"transcoding".to_string()));
    assert!(params.contains(&"-quality".to_string()));
    assert!(params.contains(&"balanced".to_string()));

    // Test CPU params - quality 50 falls in 31..=50 range which should give "superfast"
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::None, 50);
    assert!(params.contains(&"-preset".to_string()));
    assert!(params.contains(&"superfast".to_string()));
    assert!(params.contains(&"-crf".to_string()));
  }

  #[tokio::test]
  async fn test_cpu_params_quality_levels() {
    // Test different quality presets
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::None, 10);
    assert!(params.contains(&"ultrafast".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::None, 40);
    assert!(params.contains(&"superfast".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::None, 60);
    assert!(params.contains(&"fast".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::None, 80);
    assert!(params.contains(&"medium".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::None, 90);
    assert!(params.contains(&"slow".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::None, 100);
    assert!(params.contains(&"slower".to_string()));
  }

  #[tokio::test]
  async fn test_nvenc_params_quality_levels() {
    // Test different NVENC presets
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, 20);
    assert!(params.contains(&"p1".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, 50);
    assert!(params.contains(&"p2".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, 70);
    assert!(params.contains(&"p3".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, 85);
    assert!(params.contains(&"p4".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, 88);
    assert!(params.contains(&"p5".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, 93);
    assert!(params.contains(&"p6".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, 100);
    assert!(params.contains(&"p7".to_string()));
  }

  #[tokio::test]
  async fn test_quicksync_params_quality_levels() {
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::QuickSync, 25);
    assert!(params.contains(&"veryfast".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::QuickSync, 60);
    assert!(params.contains(&"fast".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::QuickSync, 80);
    assert!(params.contains(&"medium".to_string()));

    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::QuickSync, 95);
    assert!(params.contains(&"slow".to_string()));
  }

  #[tokio::test]
  async fn test_gpu_detector_new() {
    let detector = GpuDetector::new("/usr/bin/ffmpeg".to_string());
    assert_eq!(detector.ffmpeg_path, "/usr/bin/ffmpeg");
  }

  #[tokio::test]
  async fn test_gpu_info_serialization() {
    let gpu_info = GpuInfo {
      name: "NVIDIA GeForce RTX 3080".to_string(),
      driver_version: Some("525.125.06".to_string()),
      memory_total: Some(10737418240),
      memory_used: Some(2147483648),
      utilization: Some(45.5),
      encoder_type: GpuEncoder::Nvenc,
      supported_codecs: vec!["h264_nvenc".to_string(), "hevc_nvenc".to_string()],
    };

    let json = serde_json::to_string(&gpu_info).unwrap();
    assert!(json.contains("NVIDIA GeForce RTX 3080"));
    assert!(json.contains("525.125.06"));
    assert!(json.contains("Nvenc"));

    let deserialized: GpuInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.name, gpu_info.name);
    assert_eq!(deserialized.encoder_type, gpu_info.encoder_type);
  }

  #[tokio::test]
  async fn test_gpu_capabilities_serialization() {
    let capabilities = GpuCapabilities {
      available_encoders: vec![GpuEncoder::Nvenc, GpuEncoder::QuickSync],
      recommended_encoder: Some(GpuEncoder::Nvenc),
      current_gpu: None,
      hardware_acceleration_supported: true,
    };

    let json = serde_json::to_string(&capabilities).unwrap();
    assert!(json.contains("Nvenc"));
    assert!(json.contains("QuickSync"));
    assert!(json.contains("hardware_acceleration_supported"));

    let deserialized: GpuCapabilities = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.available_encoders.len(), 2);
    assert_eq!(deserialized.recommended_encoder, Some(GpuEncoder::Nvenc));
    assert!(deserialized.hardware_acceleration_supported);
  }

  #[tokio::test]
  async fn test_gpu_encoder_equality() {
    assert_eq!(GpuEncoder::Nvenc, GpuEncoder::Nvenc);
    assert_ne!(GpuEncoder::Nvenc, GpuEncoder::QuickSync);
    assert_ne!(GpuEncoder::None, GpuEncoder::Nvenc);
  }

  #[tokio::test]
  async fn test_gpu_encoder_clone() {
    let encoder = GpuEncoder::Nvenc;
    let cloned = encoder.clone();
    assert_eq!(encoder, cloned);
  }

  // Mock tests for platform-specific methods
  #[tokio::test]
  #[cfg(target_os = "windows")]
  async fn test_get_nvidia_info_windows_error() {
    let detector = GpuDetector::new("ffmpeg".to_string());
    // This should fail as nvidia-smi is not available in test environment
    let result = detector.get_nvidia_info_windows().await;
    assert!(result.is_err());
  }

  #[tokio::test]
  #[cfg(target_os = "linux")]
  async fn test_get_nvidia_info_linux_error() {
    let detector = GpuDetector::new("ffmpeg".to_string());
    // This should fail as nvidia-smi is not available in test environment
    let result = detector.get_nvidia_info_linux().await;
    assert!(result.is_err());
  }

  #[tokio::test]
  #[cfg(target_os = "linux")]
  async fn test_get_gpu_info_linux() {
    let detector = GpuDetector::new("ffmpeg".to_string());
    let result = detector.get_gpu_info_linux().await;
    // Should return Ok with default Linux GPU info
    assert!(result.is_ok());
    let info = result.unwrap();
    assert_eq!(info.name, "Linux GPU");
    assert_eq!(info.encoder_type, GpuEncoder::Vaapi);
  }

  #[tokio::test]
  #[cfg(target_os = "windows")]
  async fn test_get_intel_info_windows() {
    let detector = GpuDetector::new("ffmpeg".to_string());
    let result = detector.get_intel_info_windows().await;
    assert!(result.is_ok());
    let info = result.unwrap();
    assert_eq!(info.name, "Intel Graphics");
    assert_eq!(info.encoder_type, GpuEncoder::QuickSync);
  }

  #[tokio::test]
  #[cfg(target_os = "windows")]
  async fn test_get_amd_info_windows() {
    let detector = GpuDetector::new("ffmpeg".to_string());
    let result = detector.get_amd_info_windows().await;
    assert!(result.is_ok());
    let info = result.unwrap();
    assert_eq!(info.name, "AMD Graphics");
    assert_eq!(info.encoder_type, GpuEncoder::Amf);
  }

  #[tokio::test]
  #[cfg(target_os = "macos")]
  async fn test_get_gpu_info_macos() {
    let detector = GpuDetector::new("ffmpeg".to_string());
    let result = detector.get_gpu_info_macos().await;
    // This might fail in test environment, but check the error path
    if let Ok(info) = result {
      assert_eq!(info.name, "macOS GPU");
      assert_eq!(info.encoder_type, GpuEncoder::VideoToolbox);
    }
  }

  #[tokio::test]
  async fn test_get_current_gpu_info_fallback() {
    let detector = GpuDetector::new("ffmpeg".to_string());
    let result = detector.get_current_gpu_info().await;
    // Should always succeed with fallback
    assert!(result.is_ok());
    let info = result.unwrap();
    // If no GPU detected, should return fallback info
    if info.name == "Unknown GPU" {
      assert_eq!(info.encoder_type, GpuEncoder::None);
      assert!(info.supported_codecs.contains(&"libx264".to_string()));
    }
  }

  #[tokio::test]
  async fn test_check_encoder_available_mock() {
    // Create a temporary ffmpeg mock script
    let temp_dir = TempDir::new().unwrap();
    let mock_ffmpeg = temp_dir.path().join("ffmpeg");

    #[cfg(unix)]
    {
      use std::os::unix::fs::PermissionsExt;
      std::fs::write(&mock_ffmpeg, "#!/bin/sh\necho ' h264_nvenc'\nexit 0").unwrap();
      std::fs::set_permissions(&mock_ffmpeg, std::fs::Permissions::from_mode(0o755)).unwrap();
    }

    #[cfg(windows)]
    {
      let mock_ffmpeg = temp_dir.path().join("ffmpeg.bat");
      std::fs::write(&mock_ffmpeg, "@echo off\necho  h264_nvenc\nexit /b 0").unwrap();
    }

    let detector = GpuDetector::new(mock_ffmpeg.to_string_lossy().to_string());
    let result = detector.check_encoder_available("h264_nvenc").await;
    assert!(result.is_ok());
    assert!(result.unwrap());
  }

  #[tokio::test]
  async fn test_gpu_info_json_parsing_edge_cases() {
    // Test parsing with missing fields
    let info = GpuInfo {
      name: "Test GPU".to_string(),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: GpuEncoder::None,
      supported_codecs: vec![],
    };

    // This test verifies our struct can handle partial data
    assert_eq!(info.name, "Test GPU");
    assert!(info.driver_version.is_none());
    assert!(info.memory_total.is_none());
    assert!(info.memory_used.is_none());
    assert!(info.utilization.is_none());
    assert_eq!(info.encoder_type, GpuEncoder::None);
    assert!(info.supported_codecs.is_empty());
  }

  #[tokio::test]
  async fn test_detect_available_encoders_with_multiple_gpus() {
    let temp_dir = TempDir::new().unwrap();
    let mock_ffmpeg = temp_dir.path().join("ffmpeg");

    // Mock ffmpeg that returns multiple encoders
    #[cfg(unix)]
    {
      let script = r#"#!/bin/bash
if [[ "$*" == *"encoders"* ]]; then
  echo " V..... h264_nvenc           NVIDIA NVENC H.264 encoder"
  echo " V..... hevc_nvenc           NVIDIA NVENC HEVC encoder"
  echo " V..... h264_qsv             Intel Quick Sync Video H.264 encoder"
  echo " V..... h264_vaapi           H.264/AVC (VAAPI)"
  echo " V..... h264_videotoolbox    VideoToolbox H.264 Encoder"
  echo " V..... h264_amf             AMD AMF H.264 encoder"
fi
exit 0"#;
      std::fs::write(&mock_ffmpeg, script).unwrap();
      use std::os::unix::fs::PermissionsExt;
      std::fs::set_permissions(&mock_ffmpeg, std::fs::Permissions::from_mode(0o755)).unwrap();
    }

    #[cfg(windows)]
    {
      let script = r#"@echo off
echo  V..... h264_nvenc           NVIDIA NVENC H.264 encoder
echo  V..... hevc_nvenc           NVIDIA NVENC HEVC encoder
echo  V..... h264_qsv             Intel Quick Sync Video H.264 encoder
echo  V..... h264_amf             AMD AMF H.264 encoder
exit /b 0"#;
      std::fs::write(&mock_ffmpeg, script).unwrap();
    }

    let detector = GpuDetector::new(mock_ffmpeg.to_string_lossy().to_string());
    let encoders = detector.detect_available_encoders().await.unwrap();

    // Should detect multiple encoders
    assert!(encoders.len() >= 2);
  }

  #[test]
  fn test_gpu_encoder_priority_ordering() {
    let encoders = vec![
      GpuEncoder::None,
      GpuEncoder::Amf,
      GpuEncoder::VideoToolbox,
      GpuEncoder::Nvenc,
      GpuEncoder::QuickSync,
      GpuEncoder::Vaapi,
    ];

    let mut sorted = encoders.clone();
    sorted.sort_by_key(|e| match e {
      GpuEncoder::Nvenc => 0,
      GpuEncoder::QuickSync => 1,
      GpuEncoder::VideoToolbox => 2,
      GpuEncoder::Vaapi => 3,
      GpuEncoder::Amf => 4,
      GpuEncoder::V4l2 => 5,
      GpuEncoder::Software => 6,
      GpuEncoder::None => 7,
    });

    // Verify priority order
    assert_eq!(sorted[0], GpuEncoder::Nvenc);
    assert_eq!(sorted[1], GpuEncoder::QuickSync);
    assert_eq!(sorted[2], GpuEncoder::VideoToolbox);
    assert_eq!(sorted[3], GpuEncoder::Vaapi);
    assert_eq!(sorted[4], GpuEncoder::Amf);
    assert_eq!(sorted[5], GpuEncoder::None);
  }

  #[test]
  fn test_quality_edge_cases() {
    // Test quality values at boundaries
    assert_eq!(GpuHelper::quality_to_nvenc_cq(101), 0); // Over 100 should clamp to 0
    assert_eq!(GpuHelper::quality_to_nvenc_cq(0), 51); // Zero quality

    assert_eq!(GpuHelper::quality_to_qsv_quality(150), 1);
    assert_eq!(GpuHelper::quality_to_qsv_quality(0), 51);

    assert_eq!(GpuHelper::quality_to_videotoolbox_quality(200), 100);
    assert_eq!(GpuHelper::quality_to_videotoolbox_quality(0), 1);
  }

  #[tokio::test]
  async fn test_gpu_memory_parsing() {
    // Test parsing memory from various formats
    let test_cases = vec![
      ("VRAM:    4096 MB", Some(4096)),
      ("Memory: 8192MB", Some(8192)),
      ("Total Memory: 16384 MiB", Some(16384)),
      ("No memory info", None),
      ("Memory: invalid", None),
    ];

    for (input, expected) in test_cases {
      // Simple parsing logic for testing
      let parsed = input.split_whitespace().find_map(|word| {
        word
          .chars()
          .take_while(|c| c.is_numeric())
          .collect::<String>()
          .parse::<u32>()
          .ok()
      });

      assert_eq!(parsed, expected);
    }
  }

  #[test]
  fn test_gpu_params_with_extreme_quality_values() {
    // Test with extreme quality values
    let qualities = vec![0, 1, 25, 50, 75, 99, 100];

    for quality in qualities {
      let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, quality);
      assert!(!params.is_empty());
      assert!(params.len() >= 6); // Should have at least codec, preset, tune, rc, cq, profile

      // Verify CQ value is within valid range
      if let Some(cq_index) = params.iter().position(|p| p == "-cq") {
        if let Some(cq_value) = params.get(cq_index + 1) {
          let cq: u8 = cq_value.parse().unwrap();
          assert!(cq <= 51);
        }
      }
    }
  }

  #[tokio::test]
  async fn test_encoder_detection_multiple_calls() {
    let temp_dir = TempDir::new().unwrap();
    let mock_ffmpeg = temp_dir.path().join("ffmpeg");

    // Create a mock ffmpeg
    #[cfg(unix)]
    {
      std::fs::write(&mock_ffmpeg, "#!/bin/bash\necho ' h264_nvenc'\nexit 0").unwrap();
      use std::os::unix::fs::PermissionsExt;
      std::fs::set_permissions(&mock_ffmpeg, std::fs::Permissions::from_mode(0o755)).unwrap();
    }

    #[cfg(windows)]
    {
      std::fs::write(&mock_ffmpeg, "@echo off\necho  h264_nvenc\nexit /b 0").unwrap();
    }

    let detector = GpuDetector::new(mock_ffmpeg.to_string_lossy().to_string());

    // Test multiple sequential calls work correctly
    for _ in 0..3 {
      let result = detector.check_encoder_available("h264_nvenc").await;
      assert!(result.is_ok());
      assert!(result.unwrap());
    }

    // Test checking different encoders
    let encoders = ["h264_nvenc", "h264_qsv", "h264_vaapi"];
    for encoder in &encoders {
      let result = detector.check_encoder_available(encoder).await;
      assert!(result.is_ok());
    }
  }

  #[tokio::test]
  async fn test_gpu_vs_cpu_performance_comparison() {
    // Тест сравнения производительности GPU vs CPU кодировщиков
    use std::time::Instant;

    let gpu_encoders = vec![
      GpuEncoder::Nvenc,
      GpuEncoder::QuickSync,
      GpuEncoder::VideoToolbox,
      GpuEncoder::Vaapi,
      GpuEncoder::Amf,
    ];

    let cpu_encoders = vec![GpuEncoder::None, GpuEncoder::Software];

    // Симулируем время генерации параметров как proxy для производительности
    for encoder in &gpu_encoders {
      let start = Instant::now();
      for quality in (10..=90).step_by(10) {
        let _params = GpuHelper::get_ffmpeg_params(encoder, quality);
      }
      let gpu_time = start.elapsed();

      // GPU параметры должны генерироваться быстро и включать аппаратное ускорение
      let params = GpuHelper::get_ffmpeg_params(encoder, 75);
      assert!(
        params.len() >= 6,
        "GPU encoder should have complex parameters"
      );
      // Parameters should not contain codec name - that's added separately
      assert!(!params.is_empty(), "GPU encoder should generate parameters");

      // Время генерации параметров должно быть разумным
      assert!(
        gpu_time.as_millis() < 100,
        "Parameter generation should be fast"
      );
    }

    // Тестируем CPU кодировщики
    for encoder in &cpu_encoders {
      let start = Instant::now();
      for quality in (10..=90).step_by(10) {
        let _params = GpuHelper::get_ffmpeg_params(encoder, quality);
      }
      let cpu_time = start.elapsed();

      let params = GpuHelper::get_ffmpeg_params(encoder, 75);
      assert!(
        params.len() >= 2,
        "CPU encoder should have basic parameters"
      );

      // CPU параметры проще, но время генерации тоже должно быть разумным
      assert!(
        cpu_time.as_millis() < 50,
        "CPU parameter generation should be fast"
      );
    }

    // Проверяем что GPU кодировщики используют аппаратные кодеки
    for encoder in &gpu_encoders {
      let codec_name = encoder.h264_codec_name();
      assert!(
        !codec_name.contains("libx264"),
        "GPU encoder {codec_name} should not use software codec"
      );
    }

    // Проверяем что CPU кодировщики используют программные кодеки
    for encoder in &cpu_encoders {
      let codec_name = encoder.h264_codec_name();
      assert!(
        codec_name == "libx264" || codec_name.contains("software"),
        "CPU encoder should use software codec"
      );
    }
  }

  #[tokio::test]
  async fn test_encoder_performance_characteristics() {
    // Тест характеристик производительности различных кодировщиков
    struct EncoderProfile {
      encoder: GpuEncoder,
      expected_speed: &'static str,
      expected_complexity: usize,
    }

    let profiles = vec![
      EncoderProfile {
        encoder: GpuEncoder::Nvenc,
        expected_speed: "fast", // NVENC обычно быстрый
        expected_complexity: 8, // Много параметров
      },
      EncoderProfile {
        encoder: GpuEncoder::QuickSync,
        expected_speed: "medium", // QuickSync умеренный
        expected_complexity: 6,
      },
      EncoderProfile {
        encoder: GpuEncoder::VideoToolbox,
        expected_speed: "slow", // VideoToolbox качественный
        expected_complexity: 4,
      },
      EncoderProfile {
        encoder: GpuEncoder::None,
        expected_speed: "medium", // CPU baseline
        expected_complexity: 2,
      },
    ];

    for profile in profiles {
      let params = GpuHelper::get_ffmpeg_params(&profile.encoder, 75);

      // Проверяем сложность параметров
      assert!(
        params.len() >= profile.expected_complexity,
        "Encoder {:?} should have at least {} parameters, got {}",
        profile.encoder,
        profile.expected_complexity,
        params.len()
      );

      // Проверяем что параметры включают ожидаемые настройки скорости/качества
      if profile.encoder != GpuEncoder::None {
        let has_speed_or_quality = params.contains(&profile.expected_speed.to_string())
          || params
            .iter()
            .any(|p| p.contains("preset") || p.contains("quality") || p.contains("q:v"));
        assert!(
          has_speed_or_quality,
          "Encoder {:?} should include speed/quality settings",
          profile.encoder
        );
      }

      // Проверяем что параметры генерируются (кодек добавляется отдельно)
      let codec = profile.encoder.h264_codec_name();
      assert!(!codec.is_empty(), "Codec name should not be empty");
      assert!(!params.is_empty(), "Should generate parameters for encoder");
    }
  }

  #[tokio::test]
  async fn test_real_encoder_integration() {
    // Интеграционный тест с реальными кодировщиками
    let temp_dir = TempDir::new().unwrap();

    // Создаем более реалистичный mock ffmpeg, который поддерживает разные кодеки
    let mock_ffmpeg = temp_dir.path().join("ffmpeg");

    #[cfg(unix)]
    {
      let script = r#"#!/bin/bash
case "$*" in
  *"-encoders"*)
    echo "Video:"
    echo " h264_nvenc          NVIDIA NVENC H.264 encoder"
    echo " h264_qsv            Intel QuickSync Video H.264 encoder"  
    echo " h264_videotoolbox   VideoToolbox H.264 encoder"
    echo " h264_vaapi          VAAPI H.264 encoder"
    echo " libx264             libx264 H.264 encoder"
    ;;
  *"h264_nvenc"*)
    echo "Encoder h264_nvenc:"
    echo "General capabilities: encoder"
    ;;
  *"h264_qsv"*)
    echo "Encoder h264_qsv:"
    echo "General capabilities: encoder"
    ;;
  *)
    echo "ffmpeg version 4.4.0"
    ;;
esac
exit 0"#;
      std::fs::write(&mock_ffmpeg, script).unwrap();
      use std::os::unix::fs::PermissionsExt;
      std::fs::set_permissions(&mock_ffmpeg, std::fs::Permissions::from_mode(0o755)).unwrap();
    }

    #[cfg(windows)]
    {
      let script = r#"@echo off
if "%*" == "-encoders" (
    echo Video:
    echo  h264_nvenc          NVIDIA NVENC H.264 encoder
    echo  h264_qsv            Intel QuickSync Video H.264 encoder
    echo  libx264             libx264 H.264 encoder
) else if "%*" == "-f null -" (
    echo ffmpeg version 4.4.0
) else (
    echo Encoder test output
)
exit /b 0"#;
      std::fs::write(&mock_ffmpeg, script).unwrap();
    }

    let detector = GpuDetector::new(mock_ffmpeg.to_string_lossy().to_string());

    // Тестируем обнаружение различных кодировщиков
    let encoder_tests = vec![
      ("h264_nvenc", GpuEncoder::Nvenc),
      ("h264_qsv", GpuEncoder::QuickSync),
      ("h264_videotoolbox", GpuEncoder::VideoToolbox),
      ("libx264", GpuEncoder::None),
    ];

    for (codec_name, expected_encoder) in encoder_tests {
      let available = detector.check_encoder_available(codec_name).await.unwrap();

      if available {
        // Если кодировщик доступен, проверяем генерацию параметров
        let params = GpuHelper::get_ffmpeg_params(&expected_encoder, 75);
        assert!(
          !params.is_empty(),
          "Should generate parameters for {codec_name}"
        );
        // Note: codec name is not included in parameters - it's added as -c:v separately
        assert!(!codec_name.is_empty(), "Codec name should not be empty");
        assert!(!params.is_empty(), "Should generate parameters for codec");

        // Проверяем что параметры подходят для реального использования
        if expected_encoder != GpuEncoder::None {
          assert!(
            params.len() >= 4,
            "Hardware encoder should have multiple parameters"
          );
          assert!(
            params.contains(&"-preset".to_string())
              || params.iter().any(|p| p.contains("quality")
                || p.contains("q:v")
                || p.contains("cq")
                || p.contains("global_quality")),
            "Hardware encoder should have quality/preset settings"
          );
        }
      }
    }

    // Тестируем обнаружение множественных GPU
    let available_encoders = detector.detect_available_encoders().await.unwrap();
    assert!(
      !available_encoders.is_empty(),
      "Should detect at least one encoder"
    );

    // Проверяем что рекомендуемый кодировщик разумный
    if let Some(recommended) = detector.get_recommended_encoder().await.unwrap() {
      assert!(
        available_encoders.contains(&recommended),
        "Recommended encoder should be in available list"
      );

      // Рекомендуемый кодировщик не должен быть "None" если есть GPU опции
      if available_encoders.len() > 1 {
        assert!(
          recommended != GpuEncoder::None,
          "Should recommend GPU encoder when available"
        );
      }
    }
  }

  #[tokio::test]
  async fn test_encoder_fallback_chain() {
    // Тест цепочки fallback кодировщиков
    let temp_dir = TempDir::new().unwrap();
    let mock_ffmpeg = temp_dir.path().join("ffmpeg");

    // Mock ffmpeg который поддерживает только CPU кодировщик
    #[cfg(unix)]
    {
      let script = r#"#!/bin/bash
case "$*" in
  *"-encoders"*)
    echo "Video:"
    echo " libx264             libx264 H.264 encoder"
    ;;
  *"libx264"*)
    echo "Encoder libx264:"
    echo "General capabilities: encoder"
    ;;
  *"h264_nvenc"*|*"h264_qsv"*|*"h264_vaapi"*)
    echo "Unknown encoder"
    exit 1
    ;;
  *)
    echo "ffmpeg version 4.4.0"
    ;;
esac
exit 0"#;
      std::fs::write(&mock_ffmpeg, script).unwrap();
      use std::os::unix::fs::PermissionsExt;
      std::fs::set_permissions(&mock_ffmpeg, std::fs::Permissions::from_mode(0o755)).unwrap();
    }

    #[cfg(windows)]
    {
      let script = r#"@echo off
if "%*" == "-encoders" (
    echo Video:
    echo  libx264             libx264 H.264 encoder
) else if "%1" == "libx264" (
    echo Encoder libx264:
    echo General capabilities: encoder
) else (
    echo Unknown encoder
    exit /b 1
)
exit /b 0"#;
      std::fs::write(&mock_ffmpeg, script).unwrap();
    }

    let detector = GpuDetector::new(mock_ffmpeg.to_string_lossy().to_string());

    // Тестируем fallback когда GPU кодировщики недоступны
    let gpu_encoders = vec!["h264_nvenc", "h264_qsv", "h264_vaapi", "h264_videotoolbox"];

    for encoder in gpu_encoders {
      let available = detector
        .check_encoder_available(encoder)
        .await
        .unwrap_or(false);
      assert!(
        !available,
        "GPU encoder {encoder} should not be available in CPU-only mock"
      );
    }

    // CPU кодировщик должен быть доступен
    let cpu_available = detector.check_encoder_available("libx264").await.unwrap();
    assert!(cpu_available, "CPU encoder should always be available");

    // Проверяем что система корректно fallback на CPU
    let available_encoders = detector.detect_available_encoders().await.unwrap();
    assert!(!available_encoders.is_empty());
    assert!(
      available_encoders.contains(&GpuEncoder::None)
        || available_encoders.contains(&GpuEncoder::Software)
    );

    // Рекомендуемый кодировщик должен быть CPU-based
    let recommended = detector.get_recommended_encoder().await.unwrap();
    assert!(
      recommended == Some(GpuEncoder::None)
        || recommended == Some(GpuEncoder::Software)
        || recommended.is_none()
    );
  }

  #[test]
  fn test_encoder_codec_compatibility_matrix() {
    // Тест матрицы совместимости кодировщиков и кодеков
    let encoders = vec![
      GpuEncoder::Nvenc,
      GpuEncoder::QuickSync,
      GpuEncoder::VideoToolbox,
      GpuEncoder::Vaapi,
      GpuEncoder::Amf,
      GpuEncoder::None,
      GpuEncoder::Software,
    ];

    for encoder in encoders {
      // Проверяем H.264 поддержку
      let h264_codec = encoder.h264_codec_name();
      assert!(
        !h264_codec.is_empty(),
        "H.264 codec name should not be empty"
      );

      // Проверяем H.265 поддержку
      let h265_codec = encoder.hevc_codec_name();
      assert!(
        !h265_codec.is_empty(),
        "H.265 codec name should not be empty"
      );

      // Проверяем корректность названий кодеков
      match encoder {
        GpuEncoder::Nvenc => {
          assert!(h264_codec.contains("nvenc"));
          assert!(h265_codec.contains("nvenc"));
        }
        GpuEncoder::QuickSync => {
          assert!(h264_codec.contains("qsv"));
          assert!(h265_codec.contains("qsv"));
        }
        GpuEncoder::VideoToolbox => {
          assert!(h264_codec.contains("videotoolbox"));
          assert!(h265_codec.contains("videotoolbox"));
        }
        GpuEncoder::Vaapi => {
          assert!(h264_codec.contains("vaapi"));
          assert!(h265_codec.contains("vaapi"));
        }
        GpuEncoder::Amf => {
          assert!(h264_codec.contains("amf"));
          assert!(h265_codec.contains("amf"));
        }
        GpuEncoder::None | GpuEncoder::Software => {
          assert!(h264_codec == "libx264");
          assert!(h265_codec == "libx265");
        }
        GpuEncoder::V4l2 => {
          assert!(h264_codec.contains("v4l2"));
          assert!(h265_codec.contains("v4l2"));
        }
      }

      // Проверяем что кодировщик аппаратный или программный
      let is_hw = encoder.is_hardware();
      match encoder {
        GpuEncoder::None | GpuEncoder::Software => assert!(!is_hw),
        _ => assert!(is_hw),
      }
    }
  }

  #[tokio::test]
  async fn test_encoder_fallback_chain_with_priorities() {
    // Тест цепочки fallback с приоритетами для разных платформ
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let mock_ffmpeg = temp_dir.path().join("ffmpeg");

    // Mock ffmpeg с различными доступными кодировщиками
    #[cfg(unix)]
    {
      let script = r#"#!/bin/bash
case "$*" in
  *"-encoders"*)
    echo "Video:"
    echo " h264_nvenc         NVENC H.264 encoder"
    echo " h264_qsv           Intel QuickSync Video H.264 encoder" 
    echo " h264_vaapi         VA-API H.264 encoder"
    echo " libx264           libx264 H.264 encoder"
    ;;
  *)
    echo "ffmpeg version 4.4.0"
    ;;
esac
exit 0"#;
      std::fs::write(&mock_ffmpeg, script).unwrap();

      // Give the filesystem time to sync in CI environments
      std::thread::sleep(std::time::Duration::from_millis(100));

      use std::os::unix::fs::PermissionsExt;
      std::fs::set_permissions(&mock_ffmpeg, std::fs::Permissions::from_mode(0o755)).unwrap();

      // Another small delay to ensure permissions are applied
      std::thread::sleep(std::time::Duration::from_millis(50));
    }

    #[cfg(windows)]
    {
      let mock_ffmpeg = temp_dir.path().join("ffmpeg.bat");
      let script = r#"@echo off
if "%*" == "-encoders" (
    echo Video:
    echo  h264_nvenc         NVENC H.264 encoder
    echo  h264_qsv           Intel QuickSync Video H.264 encoder
    echo  h264_vaapi         VA-API H.264 encoder
    echo  libx264           libx264 H.264 encoder
) else (
    echo ffmpeg version 4.4.0
)
exit /b 0"#;
      std::fs::write(&mock_ffmpeg, script).unwrap();

      // Give the filesystem time to sync in CI environments
      std::thread::sleep(std::time::Duration::from_millis(100));
    }

    let detector = GpuDetector::new(mock_ffmpeg.to_string_lossy().to_string());

    // Получаем доступные кодировщики
    let available_encoders = detector.detect_available_encoders().await.unwrap();
    let recommended = detector.get_recommended_encoder().await.unwrap();

    // Проверяем что рекомендация основана на приоритетах платформы
    if let Some(rec) = recommended {
      assert!(
        available_encoders.contains(&rec),
        "Recommended encoder should be available"
      );

      // На разных платформах должны быть разные приоритеты
      #[cfg(target_os = "linux")]
      {
        // На Linux предпочтение: NVENC > VAAPI > QuickSync
        if available_encoders.contains(&GpuEncoder::Nvenc) {
          assert_eq!(rec, GpuEncoder::Nvenc, "Should prefer NVENC on Linux");
        } else if available_encoders.contains(&GpuEncoder::Vaapi) {
          assert_eq!(
            rec,
            GpuEncoder::Vaapi,
            "Should prefer VAAPI over QuickSync on Linux"
          );
        }
      }

      #[cfg(target_os = "windows")]
      {
        // На Windows предпочтение: NVENC > QuickSync > AMF
        if available_encoders.contains(&GpuEncoder::Nvenc) {
          assert_eq!(rec, GpuEncoder::Nvenc, "Should prefer NVENC on Windows");
        } else if available_encoders.contains(&GpuEncoder::QuickSync) {
          assert_eq!(
            rec,
            GpuEncoder::QuickSync,
            "Should prefer QuickSync on Windows"
          );
        }
      }

      #[cfg(target_os = "macos")]
      {
        // На macOS предпочтение: VideoToolbox > NVENC
        if available_encoders.contains(&GpuEncoder::VideoToolbox) {
          assert_eq!(
            rec,
            GpuEncoder::VideoToolbox,
            "Should prefer VideoToolbox on macOS"
          );
        } else if available_encoders.contains(&GpuEncoder::Nvenc) {
          assert_eq!(rec, GpuEncoder::Nvenc, "Should prefer NVENC on macOS");
        }
      }
    }
  }

  #[test]
  fn test_encoder_codec_compatibility_matrix_extended() {
    // Расширенный тест матрицы совместимости кодеков
    let all_encoders = vec![
      GpuEncoder::Nvenc,
      GpuEncoder::QuickSync,
      GpuEncoder::VideoToolbox,
      GpuEncoder::Vaapi,
      GpuEncoder::Amf,
      GpuEncoder::V4l2,
      GpuEncoder::None,
      GpuEncoder::Software,
    ];

    for encoder in &all_encoders {
      // Тестируем все поддерживаемые кодеки
      let h264_codec = encoder.h264_codec_name();
      let h265_codec = encoder.hevc_codec_name();

      // Проверяем что названия кодеков уникальны и корректны
      assert!(!h264_codec.is_empty());
      assert!(!h265_codec.is_empty());
      assert_ne!(
        h264_codec, h265_codec,
        "H.264 and H.265 codecs should be different"
      );

      // Проверяем соответствие аппаратной природы кодировщика
      let is_hardware = encoder.is_hardware();
      match encoder {
        GpuEncoder::None | GpuEncoder::Software => {
          assert!(!is_hardware, "Software encoders should not be hardware");
          assert!(
            h264_codec.contains("lib"),
            "Software codecs should use lib prefix"
          );
        }
        _ => {
          assert!(is_hardware, "GPU encoders should be hardware");
          assert!(
            !h264_codec.contains("lib"),
            "Hardware codecs should not use lib prefix"
          );
        }
      }

      // Проверяем генерацию параметров FFmpeg для разных уровней качества
      for quality in [25, 50, 75, 90] {
        let params = GpuHelper::get_ffmpeg_params(encoder, quality);
        assert!(
          !params.is_empty(),
          "Should generate params for quality {quality}"
        );

        // Параметры не содержат кодек напрямую - он добавляется отдельно как -c:v
        assert!(!h264_codec.is_empty(), "Codec name should not be empty");
        assert!(!params.is_empty(), "Should generate parameters");

        // Для hardware кодировщиков должны быть специальные параметры
        if is_hardware {
          let has_hw_params = params.iter().any(|p| {
            p.contains("preset")
              || p.contains("quality")
              || p.contains("cq")
              || p.contains("global_quality")
              || p.contains("q:v")
              || p.contains("rc")
              || p.contains("bitrate")
              || p.contains("-usage")
              || p.contains("vaapi_device")
              || p.contains("profile")
          });
          assert!(
            has_hw_params,
            "Hardware encoder should have quality parameters for {encoder:?}"
          );
        }
      }
    }
  }
}
