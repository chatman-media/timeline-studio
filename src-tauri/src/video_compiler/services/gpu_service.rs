//! Сервис работы с GPU

use crate::video_compiler::{
  core::{
    error::{Result, VideoCompilerError},
    gpu::{GpuDetector, GpuEncoder, GpuInfo},
  },
  services::Service,
};
use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Возможности GPU
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GpuCapabilities {
  pub available_encoders: Vec<GpuEncoder>,
  pub gpu_info: Vec<GpuInfo>,
  pub hardware_acceleration_available: bool,
  pub recommended_encoder: Option<GpuEncoder>,
}

/// Результат бенчмарка GPU
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GpuBenchmarkResult {
  pub encoder: GpuEncoder,
  pub encoding_speed: f64,   // кадров в секунду
  pub quality_score: f64,    // от 0 до 100
  pub power_efficiency: f64, // от 0 до 100
}

/// Трейт для сервиса GPU
#[async_trait]
#[allow(dead_code)]
pub trait GpuService: Service + Send + Sync {
  /// Обнаружить доступные GPU
  async fn detect_gpus(&self) -> Result<Vec<GpuInfo>>;

  /// Получить возможности GPU
  async fn get_capabilities(&self) -> Result<GpuCapabilities>;

  /// Проверить поддержку аппаратного ускорения
  async fn check_hardware_acceleration(&self) -> Result<bool>;

  /// Провести бенчмарк GPU
  async fn benchmark_gpu(&self, encoder: GpuEncoder) -> Result<GpuBenchmarkResult>;

  /// Получить рекомендуемый кодировщик
  async fn get_recommended_encoder(&self) -> Result<Option<GpuEncoder>>;

  /// Обновить информацию о GPU
  async fn refresh_gpu_info(&self) -> Result<()>;
}

/// Реализация сервиса GPU
pub struct GpuServiceImpl {
  ffmpeg_path: String,
  gpu_info_cache: Arc<RwLock<Option<Vec<GpuInfo>>>>,
  capabilities_cache: Arc<RwLock<Option<GpuCapabilities>>>,
}

impl GpuServiceImpl {
  pub fn new(ffmpeg_path: String) -> Self {
    Self {
      ffmpeg_path,
      gpu_info_cache: Arc::new(RwLock::new(None)),
      capabilities_cache: Arc::new(RwLock::new(None)),
    }
  }

  /// Провести тестовое кодирование для бенчмарка
  async fn run_encoding_benchmark(&self, encoder: GpuEncoder) -> Result<(f64, f64)> {
    // Создаем временный тестовый файл
    let temp_dir = std::env::temp_dir();
    let test_output = temp_dir.join(format!("gpu_benchmark_{}.mp4", uuid::Uuid::new_v4()));

    // Параметры тестового видео
    let duration = 5.0;
    let resolution = "1920x1080";
    let fps = 30;

    // Формируем команду FFmpeg для генерации тестового видео
    let encoder_args = match encoder {
      GpuEncoder::None => vec!["-c:v", "libx264"],
      GpuEncoder::Nvenc => vec!["-c:v", "h264_nvenc"],
      GpuEncoder::QuickSync => vec!["-c:v", "h264_qsv"],
      GpuEncoder::Amf => vec!["-c:v", "h264_amf"],
      GpuEncoder::VideoToolbox => vec!["-c:v", "h264_videotoolbox"],
      GpuEncoder::Vaapi => vec!["-c:v", "h264_vaapi"],
      GpuEncoder::V4l2 => vec!["-c:v", "h264_v4l2m2m"],
      GpuEncoder::Software => vec!["-c:v", "libx264"],
    };

    let start_time = std::time::Instant::now();

    let output = tokio::process::Command::new(&self.ffmpeg_path)
      .args([
        "-f",
        "lavfi",
        "-i",
        &format!("testsrc2=duration={duration}:size={resolution}:rate={fps}"),
        "-pix_fmt",
        "yuv420p",
      ])
      .args(&encoder_args)
      .args(["-preset", "fast", "-y", test_output.to_str().unwrap()])
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg benchmark".to_string(),
      })?;

    let encoding_time = start_time.elapsed().as_secs_f64();

    // Удаляем временный файл
    let _ = tokio::fs::remove_file(&test_output).await;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        command: "ffmpeg benchmark".to_string(),
      });
    }

    // Рассчитываем скорость кодирования
    let total_frames = duration * fps as f64;
    let encoding_speed = total_frames / encoding_time;

    // Простая оценка качества на основе типа кодировщика
    let quality_score = match encoder {
      GpuEncoder::None | GpuEncoder::Software => 100.0,
      GpuEncoder::Nvenc | GpuEncoder::QuickSync => 95.0,
      GpuEncoder::Amf | GpuEncoder::VideoToolbox => 93.0,
      GpuEncoder::Vaapi | GpuEncoder::V4l2 => 90.0,
    };

    Ok((encoding_speed, quality_score))
  }
}

#[async_trait]
impl Service for GpuServiceImpl {
  async fn initialize(&self) -> Result<()> {
    log::info!("Инициализация сервиса GPU");

    // Сразу пытаемся обнаружить GPU
    self.refresh_gpu_info().await?;

    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    // Проверяем доступность FFmpeg
    let output = tokio::process::Command::new(&self.ffmpeg_path)
      .arg("-version")
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg -version".to_string(),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: "FFmpeg недоступен".to_string(),
        command: "ffmpeg -version".to_string(),
      });
    }

    Ok(())
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("Остановка сервиса GPU");
    Ok(())
  }
}

#[async_trait]
impl GpuService for GpuServiceImpl {
  async fn detect_gpus(&self) -> Result<Vec<GpuInfo>> {
    // Проверяем кэш
    {
      let cache = self.gpu_info_cache.read().await;
      if let Some(info) = cache.as_ref() {
        return Ok(info.clone());
      }
    }

    // Если кэш пуст, обнаруживаем GPU
    let detector = GpuDetector::new(self.ffmpeg_path.clone());
    let gpu_info = detector.detect_gpus().await?;

    // Сохраняем в кэш
    {
      let mut cache = self.gpu_info_cache.write().await;
      *cache = Some(gpu_info.clone());
    }

    Ok(gpu_info)
  }

  async fn get_capabilities(&self) -> Result<GpuCapabilities> {
    // Проверяем кэш
    {
      let cache = self.capabilities_cache.read().await;
      if let Some(caps) = cache.as_ref() {
        return Ok(caps.clone());
      }
    }

    // Обнаруживаем возможности
    let detector = GpuDetector::new(self.ffmpeg_path.clone());
    let available_encoders = detector.detect_available_encoders().await?;
    let gpu_info = self.detect_gpus().await?;

    let hardware_acceleration_available = !available_encoders.is_empty()
      && available_encoders
        .iter()
        .any(|e| !matches!(e, GpuEncoder::Software));

    // Определяем рекомендуемый кодировщик с учётом платформы
    let recommended_encoder = {
      #[cfg(target_os = "macos")]
      {
        // На macOS VideoToolbox в приоритете
        if available_encoders.contains(&GpuEncoder::VideoToolbox) {
          Some(GpuEncoder::VideoToolbox)
        } else if available_encoders.contains(&GpuEncoder::Nvenc) {
          Some(GpuEncoder::Nvenc)
        } else {
          None
        }
      }

      #[cfg(target_os = "windows")]
      {
        // На Windows приоритет: NVENC > QuickSync > AMF
        if available_encoders.contains(&GpuEncoder::Nvenc) {
          Some(GpuEncoder::Nvenc)
        } else if available_encoders.contains(&GpuEncoder::QuickSync) {
          Some(GpuEncoder::QuickSync)
        } else if available_encoders.contains(&GpuEncoder::Amf) {
          Some(GpuEncoder::Amf)
        } else {
          None
        }
      }

      #[cfg(target_os = "linux")]
      {
        // На Linux приоритет: NVENC > VAAPI > QuickSync
        if available_encoders.contains(&GpuEncoder::Nvenc) {
          Some(GpuEncoder::Nvenc)
        } else if available_encoders.contains(&GpuEncoder::Vaapi) {
          Some(GpuEncoder::Vaapi)
        } else if available_encoders.contains(&GpuEncoder::QuickSync) {
          Some(GpuEncoder::QuickSync)
        } else {
          None
        }
      }

      #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
      {
        // Для других платформ - общий приоритет
        if available_encoders.contains(&GpuEncoder::Nvenc) {
          Some(GpuEncoder::Nvenc)
        } else if available_encoders.contains(&GpuEncoder::QuickSync) {
          Some(GpuEncoder::QuickSync)
        } else if available_encoders.contains(&GpuEncoder::VideoToolbox) {
          Some(GpuEncoder::VideoToolbox)
        } else if available_encoders.contains(&GpuEncoder::Amf) {
          Some(GpuEncoder::Amf)
        } else if available_encoders.contains(&GpuEncoder::Vaapi) {
          Some(GpuEncoder::Vaapi)
        } else {
          None
        }
      }
    };

    let capabilities = GpuCapabilities {
      available_encoders,
      gpu_info,
      hardware_acceleration_available,
      recommended_encoder,
    };

    // Сохраняем в кэш
    {
      let mut cache = self.capabilities_cache.write().await;
      *cache = Some(capabilities.clone());
    }

    Ok(capabilities)
  }

  async fn check_hardware_acceleration(&self) -> Result<bool> {
    let caps = self.get_capabilities().await?;
    Ok(caps.hardware_acceleration_available)
  }

  async fn benchmark_gpu(&self, encoder: GpuEncoder) -> Result<GpuBenchmarkResult> {
    log::info!("Запуск бенчмарка GPU для {:?}", encoder);

    let (encoding_speed, quality_score) = self.run_encoding_benchmark(encoder.clone()).await?;

    // Оценка энергоэффективности (упрощенная)
    let power_efficiency = match encoder {
      GpuEncoder::None | GpuEncoder::Software => 20.0,
      GpuEncoder::Nvenc | GpuEncoder::QuickSync => 90.0,
      GpuEncoder::Amf | GpuEncoder::VideoToolbox => 85.0,
      GpuEncoder::Vaapi | GpuEncoder::V4l2 => 80.0,
    };

    Ok(GpuBenchmarkResult {
      encoder,
      encoding_speed,
      quality_score,
      power_efficiency,
    })
  }

  async fn get_recommended_encoder(&self) -> Result<Option<GpuEncoder>> {
    let caps = self.get_capabilities().await?;
    Ok(caps.recommended_encoder)
  }

  async fn refresh_gpu_info(&self) -> Result<()> {
    log::info!("Обновление информации о GPU");

    // Очищаем кэши
    {
      let mut gpu_cache = self.gpu_info_cache.write().await;
      *gpu_cache = None;

      let mut caps_cache = self.capabilities_cache.write().await;
      *caps_cache = None;
    }

    // Заново обнаруживаем GPU
    self.detect_gpus().await?;
    self.get_capabilities().await?;

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::core::gpu::GpuInfo;
  use std::sync::atomic::{AtomicBool, Ordering};

  /// Mock GPU сервис для тестирования
  pub struct MockGpuService {
    pub available_encoders: Vec<GpuEncoder>,
    pub gpu_info: Vec<GpuInfo>,
    pub should_fail: AtomicBool,
    pub benchmark_results:
      std::sync::Mutex<std::collections::HashMap<GpuEncoder, GpuBenchmarkResult>>,
  }

  impl MockGpuService {
    /// Создать mock с NVIDIA GPU
    pub fn nvidia_available() -> Self {
      let gpu_info = vec![GpuInfo {
        name: "NVIDIA GeForce RTX 3080".to_string(),
        driver_version: Some("516.01".to_string()),
        memory_total: Some(10_737_418_240), // 10GB в байтах
        memory_used: Some(2_147_483_648),   // 2GB в байтах
        utilization: Some(45.0),
        encoder_type: GpuEncoder::Nvenc,
        supported_codecs: vec!["h264_nvenc".to_string(), "hevc_nvenc".to_string()],
      }];

      Self {
        available_encoders: vec![GpuEncoder::Nvenc, GpuEncoder::Software],
        gpu_info,
        should_fail: AtomicBool::new(false),
        benchmark_results: std::sync::Mutex::new(std::collections::HashMap::new()),
      }
    }

    /// Создать mock с AMD GPU
    pub fn amd_available() -> Self {
      let gpu_info = vec![GpuInfo {
        name: "AMD Radeon RX 6700 XT".to_string(),
        driver_version: Some("22.5.1".to_string()),
        memory_total: Some(12_884_901_888), // 12GB в байтах
        memory_used: Some(1_073_741_824),   // 1GB в байтах
        utilization: Some(30.0),
        encoder_type: GpuEncoder::Amf,
        supported_codecs: vec!["h264_amf".to_string(), "hevc_amf".to_string()],
      }];

      Self {
        available_encoders: vec![GpuEncoder::Amf, GpuEncoder::Software],
        gpu_info,
        should_fail: AtomicBool::new(false),
        benchmark_results: std::sync::Mutex::new(std::collections::HashMap::new()),
      }
    }

    /// Создать mock с Intel GPU
    pub fn intel_available() -> Self {
      let gpu_info = vec![GpuInfo {
        name: "Intel Arc A380".to_string(),
        driver_version: Some("30.0.101.1404".to_string()),
        memory_total: Some(6_442_450_944), // 6GB в байтах
        memory_used: Some(536_870_912),    // 512MB в байтах
        utilization: Some(15.0),
        encoder_type: GpuEncoder::QuickSync,
        supported_codecs: vec!["h264_qsv".to_string(), "hevc_qsv".to_string()],
      }];

      Self {
        available_encoders: vec![GpuEncoder::QuickSync, GpuEncoder::Software],
        gpu_info,
        should_fail: AtomicBool::new(false),
        benchmark_results: std::sync::Mutex::new(std::collections::HashMap::new()),
      }
    }

    /// Создать mock без GPU (только CPU)
    pub fn no_gpu() -> Self {
      Self {
        available_encoders: vec![GpuEncoder::Software],
        gpu_info: vec![],
        should_fail: AtomicBool::new(false),
        benchmark_results: std::sync::Mutex::new(std::collections::HashMap::new()),
      }
    }

    /// Создать mock с ошибками
    pub fn failing() -> Self {
      Self {
        available_encoders: vec![],
        gpu_info: vec![],
        should_fail: AtomicBool::new(true),
        benchmark_results: std::sync::Mutex::new(std::collections::HashMap::new()),
      }
    }

    /// Создать mock с множественными GPU
    pub fn multiple_gpus() -> Self {
      let gpu_info = vec![
        GpuInfo {
          name: "NVIDIA GeForce RTX 4090".to_string(),
          driver_version: Some("522.25".to_string()),
          memory_total: Some(25_769_803_776), // 24GB в байтах
          memory_used: Some(4_294_967_296),   // 4GB в байтах
          utilization: Some(60.0),
          encoder_type: GpuEncoder::Nvenc,
          supported_codecs: vec![
            "h264_nvenc".to_string(),
            "hevc_nvenc".to_string(),
            "av1_nvenc".to_string(),
          ],
        },
        GpuInfo {
          name: "Intel UHD Graphics 770".to_string(),
          driver_version: Some("30.0.101.1915".to_string()),
          memory_total: None, // Shared memory
          memory_used: None,
          utilization: Some(5.0),
          encoder_type: GpuEncoder::QuickSync,
          supported_codecs: vec!["h264_qsv".to_string(), "hevc_qsv".to_string()],
        },
      ];

      Self {
        available_encoders: vec![
          GpuEncoder::Nvenc,
          GpuEncoder::QuickSync,
          GpuEncoder::Software,
        ],
        gpu_info,
        should_fail: AtomicBool::new(false),
        benchmark_results: std::sync::Mutex::new(std::collections::HashMap::new()),
      }
    }

    /// Установить результат бенчмарка для кодировщика
    pub fn set_benchmark_result(&self, encoder: GpuEncoder, result: GpuBenchmarkResult) {
      let mut results = self.benchmark_results.lock().unwrap();
      results.insert(encoder, result);
    }

    /// Установить флаг ошибки
    pub fn set_should_fail(&self, should_fail: bool) {
      self.should_fail.store(should_fail, Ordering::Relaxed);
    }
  }

  #[async_trait]
  impl Service for MockGpuService {
    async fn initialize(&self) -> Result<()> {
      if self.should_fail.load(Ordering::Relaxed) {
        return Err(VideoCompilerError::InternalError(
          "Mock GPU service failed to initialize".to_string(),
        ));
      }
      Ok(())
    }

    async fn health_check(&self) -> Result<()> {
      if self.should_fail.load(Ordering::Relaxed) {
        return Err(VideoCompilerError::InternalError(
          "Mock GPU service health check failed".to_string(),
        ));
      }
      Ok(())
    }

    async fn shutdown(&self) -> Result<()> {
      Ok(())
    }
  }

  #[async_trait]
  impl GpuService for MockGpuService {
    async fn detect_gpus(&self) -> Result<Vec<GpuInfo>> {
      if self.should_fail.load(Ordering::Relaxed) {
        return Err(VideoCompilerError::InternalError(
          "Failed to detect GPUs".to_string(),
        ));
      }
      Ok(self.gpu_info.clone())
    }

    async fn get_capabilities(&self) -> Result<GpuCapabilities> {
      if self.should_fail.load(Ordering::Relaxed) {
        return Err(VideoCompilerError::InternalError(
          "Failed to get GPU capabilities".to_string(),
        ));
      }

      let hardware_acceleration_available = self
        .available_encoders
        .iter()
        .any(|e| !matches!(e, GpuEncoder::Software));

      let recommended_encoder = self
        .available_encoders
        .iter()
        .find(|e| !matches!(e, GpuEncoder::Software))
        .cloned();

      Ok(GpuCapabilities {
        available_encoders: self.available_encoders.clone(),
        gpu_info: self.gpu_info.clone(),
        hardware_acceleration_available,
        recommended_encoder,
      })
    }

    async fn check_hardware_acceleration(&self) -> Result<bool> {
      if self.should_fail.load(Ordering::Relaxed) {
        return Err(VideoCompilerError::InternalError(
          "Failed to check hardware acceleration".to_string(),
        ));
      }
      Ok(
        self
          .available_encoders
          .iter()
          .any(|e| !matches!(e, GpuEncoder::Software)),
      )
    }

    async fn benchmark_gpu(&self, encoder: GpuEncoder) -> Result<GpuBenchmarkResult> {
      if self.should_fail.load(Ordering::Relaxed) {
        return Err(VideoCompilerError::InternalError(
          "Benchmark failed".to_string(),
        ));
      }

      let results = self.benchmark_results.lock().unwrap();
      if let Some(result) = results.get(&encoder) {
        return Ok(result.clone());
      }

      // Возвращаем стандартные результаты
      let (encoding_speed, quality_score, power_efficiency) = match encoder {
        GpuEncoder::Nvenc => (120.0, 95.0, 90.0),
        GpuEncoder::QuickSync => (100.0, 93.0, 88.0),
        GpuEncoder::Amf => (95.0, 90.0, 85.0),
        GpuEncoder::VideoToolbox => (85.0, 92.0, 87.0),
        GpuEncoder::Vaapi => (80.0, 88.0, 82.0),
        GpuEncoder::V4l2 => (70.0, 85.0, 80.0),
        GpuEncoder::Software => (40.0, 100.0, 20.0),
        GpuEncoder::None => (30.0, 100.0, 15.0),
      };

      Ok(GpuBenchmarkResult {
        encoder,
        encoding_speed,
        quality_score,
        power_efficiency,
      })
    }

    async fn get_recommended_encoder(&self) -> Result<Option<GpuEncoder>> {
      let caps = self.get_capabilities().await?;
      Ok(caps.recommended_encoder)
    }

    async fn refresh_gpu_info(&self) -> Result<()> {
      if self.should_fail.load(Ordering::Relaxed) {
        return Err(VideoCompilerError::InternalError(
          "Failed to refresh GPU info".to_string(),
        ));
      }
      Ok(())
    }
  }

  // Базовые тесты
  #[tokio::test]
  async fn test_gpu_service_creation() {
    let service = GpuServiceImpl::new("ffmpeg".to_string());
    // Не вызываем initialize() здесь, так как FFmpeg может быть недоступен
    assert_eq!(service.ffmpeg_path, "ffmpeg");
  }

  #[tokio::test]
  async fn test_encoder_detection() {
    let service = GpuServiceImpl::new("ffmpeg".to_string());

    // Тест может провалиться если FFmpeg не установлен
    match service.get_capabilities().await {
      Ok(caps) => {
        // Должен быть хотя бы software encoder
        assert!(!caps.available_encoders.is_empty());
      }
      Err(_) => {
        // FFmpeg не установлен, пропускаем тест
      }
    }
  }

  // Тесты с mock GPU сервисом
  #[tokio::test]
  async fn test_mock_nvidia_gpu() {
    let service = MockGpuService::nvidia_available();

    let gpus = service.detect_gpus().await.unwrap();
    assert_eq!(gpus.len(), 1);
    assert_eq!(gpus[0].name, "NVIDIA GeForce RTX 3080");
    assert_eq!(gpus[0].memory_total, Some(10_737_418_240));
    assert_eq!(gpus[0].encoder_type, GpuEncoder::Nvenc);

    let caps = service.get_capabilities().await.unwrap();
    assert!(caps.hardware_acceleration_available);
    assert!(caps.available_encoders.contains(&GpuEncoder::Nvenc));
    assert_eq!(caps.recommended_encoder, Some(GpuEncoder::Nvenc));
  }

  #[tokio::test]
  async fn test_mock_amd_gpu() {
    let service = MockGpuService::amd_available();

    let gpus = service.detect_gpus().await.unwrap();
    assert_eq!(gpus.len(), 1);
    assert_eq!(gpus[0].name, "AMD Radeon RX 6700 XT");
    assert_eq!(gpus[0].encoder_type, GpuEncoder::Amf);

    let caps = service.get_capabilities().await.unwrap();
    assert!(caps.hardware_acceleration_available);
    assert!(caps.available_encoders.contains(&GpuEncoder::Amf));
    assert_eq!(caps.recommended_encoder, Some(GpuEncoder::Amf));
  }

  #[tokio::test]
  async fn test_mock_intel_gpu() {
    let service = MockGpuService::intel_available();

    let gpus = service.detect_gpus().await.unwrap();
    assert_eq!(gpus.len(), 1);
    assert_eq!(gpus[0].name, "Intel Arc A380");
    assert_eq!(gpus[0].encoder_type, GpuEncoder::QuickSync);

    let caps = service.get_capabilities().await.unwrap();
    assert!(caps.hardware_acceleration_available);
    assert!(caps.available_encoders.contains(&GpuEncoder::QuickSync));
    assert_eq!(caps.recommended_encoder, Some(GpuEncoder::QuickSync));
  }

  #[tokio::test]
  async fn test_mock_no_gpu() {
    let service = MockGpuService::no_gpu();

    let gpus = service.detect_gpus().await.unwrap();
    assert!(gpus.is_empty());

    let caps = service.get_capabilities().await.unwrap();
    assert!(!caps.hardware_acceleration_available);
    assert_eq!(caps.available_encoders, vec![GpuEncoder::Software]);
    assert_eq!(caps.recommended_encoder, None);
  }

  #[tokio::test]
  async fn test_mock_multiple_gpus() {
    let service = MockGpuService::multiple_gpus();

    let gpus = service.detect_gpus().await.unwrap();
    assert_eq!(gpus.len(), 2);

    // Первый GPU - NVIDIA
    assert_eq!(gpus[0].name, "NVIDIA GeForce RTX 4090");
    assert_eq!(gpus[0].memory_total, Some(25_769_803_776));
    assert_eq!(gpus[0].encoder_type, GpuEncoder::Nvenc);

    // Второй GPU - Intel
    assert_eq!(gpus[1].name, "Intel UHD Graphics 770");
    assert_eq!(gpus[1].encoder_type, GpuEncoder::QuickSync);

    let caps = service.get_capabilities().await.unwrap();
    assert!(caps.hardware_acceleration_available);
    assert!(caps.available_encoders.contains(&GpuEncoder::Nvenc));
    assert!(caps.available_encoders.contains(&GpuEncoder::QuickSync));
    // NVENC должен быть предпочтительным
    assert_eq!(caps.recommended_encoder, Some(GpuEncoder::Nvenc));
  }

  #[tokio::test]
  async fn test_gpu_service_caching() {
    let service = GpuServiceImpl::new("mock_ffmpeg".to_string());

    // Первый вызов должен заполнить кэш
    let result1 = service.detect_gpus().await;

    // Второй вызов должен использовать кэш (если первый был успешным)
    let result2 = service.detect_gpus().await;

    // Если оба провалились (FFmpeg недоступен), это ожидаемо
    match (result1, result2) {
      (Ok(gpus1), Ok(gpus2)) => {
        assert_eq!(gpus1, gpus2); // Результаты должны быть одинаковыми
      }
      (Err(_), Err(_)) => {
        // FFmpeg недоступен, это ожидаемо в CI
      }
      _ => panic!("Inconsistent caching behavior"),
    }
  }

  #[tokio::test]
  async fn test_gpu_service_refresh() {
    let service = MockGpuService::nvidia_available();

    // Получаем начальные возможности
    let caps1 = service.get_capabilities().await.unwrap();

    // Обновляем информацию
    service.refresh_gpu_info().await.unwrap();

    // Получаем обновленные возможности
    let caps2 = service.get_capabilities().await.unwrap();

    // В mock сервисе результаты должны быть одинаковыми
    assert_eq!(caps1.available_encoders, caps2.available_encoders);
    assert_eq!(
      caps1.hardware_acceleration_available,
      caps2.hardware_acceleration_available
    );
  }

  #[tokio::test]
  async fn test_benchmark_nvidia() {
    let service = MockGpuService::nvidia_available();

    let benchmark = service.benchmark_gpu(GpuEncoder::Nvenc).await.unwrap();

    assert_eq!(benchmark.encoder, GpuEncoder::Nvenc);
    assert!(benchmark.encoding_speed > 0.0);
    assert!(benchmark.quality_score > 0.0 && benchmark.quality_score <= 100.0);
    assert!(benchmark.power_efficiency > 0.0 && benchmark.power_efficiency <= 100.0);

    // NVENC должен иметь хорошую производительность
    assert!(benchmark.encoding_speed > 100.0);
    assert!(benchmark.quality_score > 90.0);
    assert!(benchmark.power_efficiency > 85.0);
  }

  #[tokio::test]
  async fn test_benchmark_software() {
    let service = MockGpuService::no_gpu();

    let benchmark = service.benchmark_gpu(GpuEncoder::Software).await.unwrap();

    assert_eq!(benchmark.encoder, GpuEncoder::Software);

    // Software кодирование должно быть медленнее но качественнее
    assert!(benchmark.encoding_speed < 100.0);
    assert_eq!(benchmark.quality_score, 100.0);
    assert!(benchmark.power_efficiency < 50.0);
  }

  #[tokio::test]
  async fn test_custom_benchmark_results() {
    let service = MockGpuService::nvidia_available();

    // Устанавливаем кастомный результат бенчмарка
    let custom_result = GpuBenchmarkResult {
      encoder: GpuEncoder::Nvenc,
      encoding_speed: 200.0,
      quality_score: 98.0,
      power_efficiency: 95.0,
    };
    service.set_benchmark_result(GpuEncoder::Nvenc, custom_result.clone());

    let benchmark = service.benchmark_gpu(GpuEncoder::Nvenc).await.unwrap();

    assert_eq!(benchmark.encoding_speed, 200.0);
    assert_eq!(benchmark.quality_score, 98.0);
    assert_eq!(benchmark.power_efficiency, 95.0);
  }

  #[tokio::test]
  async fn test_gpu_service_error_handling() {
    let service = MockGpuService::failing();

    // Все операции должны возвращать ошибки
    assert!(service.initialize().await.is_err());
    assert!(service.health_check().await.is_err());
    assert!(service.detect_gpus().await.is_err());
    assert!(service.get_capabilities().await.is_err());
    assert!(service.check_hardware_acceleration().await.is_err());
    assert!(service.benchmark_gpu(GpuEncoder::Nvenc).await.is_err());
    assert!(service.refresh_gpu_info().await.is_err());
  }

  #[tokio::test]
  async fn test_gpu_service_error_recovery() {
    let service = MockGpuService::nvidia_available();

    // Сначала сервис работает
    assert!(service.detect_gpus().await.is_ok());

    // Включаем режим ошибок
    service.set_should_fail(true);
    assert!(service.detect_gpus().await.is_err());

    // Восстанавливаем работу
    service.set_should_fail(false);
    assert!(service.detect_gpus().await.is_ok());
  }

  #[tokio::test]
  async fn test_hardware_acceleration_detection() {
    // С GPU
    let service_with_gpu = MockGpuService::nvidia_available();
    assert!(service_with_gpu
      .check_hardware_acceleration()
      .await
      .unwrap());

    // Без GPU
    let service_no_gpu = MockGpuService::no_gpu();
    assert!(!service_no_gpu.check_hardware_acceleration().await.unwrap());
  }

  #[tokio::test]
  async fn test_recommended_encoder_selection() {
    // NVIDIA GPU - должен рекомендовать NVENC
    let nvidia_service = MockGpuService::nvidia_available();
    let recommended = nvidia_service.get_recommended_encoder().await.unwrap();
    assert_eq!(recommended, Some(GpuEncoder::Nvenc));

    // AMD GPU - должен рекомендовать AMF
    let amd_service = MockGpuService::amd_available();
    let recommended = amd_service.get_recommended_encoder().await.unwrap();
    assert_eq!(recommended, Some(GpuEncoder::Amf));

    // Intel GPU - должен рекомендовать QuickSync
    let intel_service = MockGpuService::intel_available();
    let recommended = intel_service.get_recommended_encoder().await.unwrap();
    assert_eq!(recommended, Some(GpuEncoder::QuickSync));

    // Нет GPU - не должен ничего рекомендовать
    let no_gpu_service = MockGpuService::no_gpu();
    let recommended = no_gpu_service.get_recommended_encoder().await.unwrap();
    assert_eq!(recommended, None);
  }

  #[tokio::test]
  async fn test_gpu_capabilities_serialization() {
    let service = MockGpuService::nvidia_available();
    let caps = service.get_capabilities().await.unwrap();

    // Тестируем сериализацию в JSON
    let serialized = serde_json::to_string(&caps).unwrap();
    assert!(serialized.contains("available_encoders"));
    assert!(serialized.contains("gpu_info"));
    assert!(serialized.contains("hardware_acceleration_available"));

    // Тестируем десериализацию
    let deserialized: GpuCapabilities = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.available_encoders, caps.available_encoders);
    assert_eq!(
      deserialized.hardware_acceleration_available,
      caps.hardware_acceleration_available
    );
    assert_eq!(deserialized.recommended_encoder, caps.recommended_encoder);
  }

  #[tokio::test]
  async fn test_benchmark_result_serialization() {
    let result = GpuBenchmarkResult {
      encoder: GpuEncoder::Nvenc,
      encoding_speed: 120.5,
      quality_score: 95.2,
      power_efficiency: 89.7,
    };

    // Тестируем сериализацию
    let serialized = serde_json::to_string(&result).unwrap();
    assert!(serialized.contains("Nvenc"));
    assert!(serialized.contains("120.5"));
    assert!(serialized.contains("95.2"));
    assert!(serialized.contains("89.7"));

    // Тестируем десериализацию
    let deserialized: GpuBenchmarkResult = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.encoder, GpuEncoder::Nvenc);
    assert_eq!(deserialized.encoding_speed, 120.5);
    assert_eq!(deserialized.quality_score, 95.2);
    assert_eq!(deserialized.power_efficiency, 89.7);
  }
}
