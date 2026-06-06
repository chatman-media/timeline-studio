//! Константы конфигурации для video_compiler
//!
//! Централизованное хранилище всех констант конфигурации,
//! используемых в модуле video_compiler.

/// Константы экспорта видео
pub mod export {
  /// Качество по умолчанию (0-100)
  pub const DEFAULT_QUALITY: u8 = 85;

  /// Битрейт видео по умолчанию в kbps
  pub const DEFAULT_VIDEO_BITRATE: u32 = 8000;

  /// Битрейт аудио по умолчанию в kbps
  pub const DEFAULT_AUDIO_BITRATE: u32 = 192;

  /// Частота кадров по умолчанию
  pub const DEFAULT_FRAME_RATE: f64 = 30.0;

  /// Разрешение по умолчанию
  pub const DEFAULT_RESOLUTION: (u32, u32) = (1920, 1080);

  /// Включение аппаратного ускорения по умолчанию
  pub const DEFAULT_HARDWARE_ACCELERATION: bool = true;

  /// Интервал ключевых кадров по умолчанию (в кадрах)
  pub const DEFAULT_KEYFRAME_INTERVAL: u32 = 60;
}

/// Константы компилятора
pub mod compiler {
  /// Путь к FFmpeg по умолчанию
  pub const DEFAULT_FFMPEG_PATH: &str = "ffmpeg";

  /// Количество параллельных задач по умолчанию
  pub const DEFAULT_PARALLEL_JOBS: usize = 4;

  /// Лимит памяти по умолчанию в МБ
  pub const DEFAULT_MEMORY_LIMIT_MB: usize = 2048;

  /// Уровень логирования по умолчанию
  pub const DEFAULT_LOG_LEVEL: &str = "info";

  /// Размер кэша по умолчанию в МБ
  pub const DEFAULT_CACHE_SIZE_MB: usize = 1024;
}

/// Пресеты качества
pub mod quality_presets {

  /// Низкое качество
  pub mod low {
    pub const NAME: &str = "Low";
    pub const DESCRIPTION: &str = "Низкое качество для быстрого просмотра";
    pub const VIDEO_BITRATE: u32 = 1000;
    pub const AUDIO_BITRATE: u32 = 128;
    pub const QUALITY: u8 = 70;
    pub const RESOLUTION: &str = "720p";
    pub const FPS: u32 = 30;
    pub const CODEC: &str = "h264";
    pub const PRESET: &str = "ultrafast";
  }

  /// Среднее качество
  pub mod medium {
    pub const NAME: &str = "Medium";
    pub const DESCRIPTION: &str = "Среднее качество для общего использования";
    pub const VIDEO_BITRATE: u32 = 3000;
    pub const AUDIO_BITRATE: u32 = 192;
    pub const QUALITY: u8 = 80;
    pub const RESOLUTION: &str = "1080p";
    pub const FPS: u32 = 30;
    pub const CODEC: &str = "h264";
    pub const PRESET: &str = "medium";
  }

  /// Высокое качество
  pub mod high {
    pub const NAME: &str = "High";
    pub const DESCRIPTION: &str = "Высокое качество для финального рендера";
    pub const VIDEO_BITRATE: u32 = 8000;
    pub const AUDIO_BITRATE: u32 = 256;
    pub const QUALITY: u8 = 90;
    pub const RESOLUTION: &str = "1080p";
    pub const FPS: u32 = 60;
    pub const CODEC: &str = "h264";
    pub const PRESET: &str = "slow";
  }

  /// Ультра качество
  pub mod ultra {
    pub const NAME: &str = "Ultra";
    pub const DESCRIPTION: &str = "Максимальное качество для профессионального использования";
    pub const VIDEO_BITRATE: u32 = 20000;
    pub const AUDIO_BITRATE: u32 = 320;
    pub const QUALITY: u8 = 95;
    pub const RESOLUTION: &str = "4K";
    pub const FPS: u32 = 60;
    pub const CODEC: &str = "h265";
    pub const PRESET: &str = "veryslow";
  }
}

/// Константы превью
pub mod preview {
  /// Разрешение превью по умолчанию
  pub const DEFAULT_RESOLUTION: (u32, u32) = (640, 360);

  /// Качество превью по умолчанию
  pub const DEFAULT_QUALITY: u8 = 75;

  /// FPS превью по умолчанию
  pub const DEFAULT_FPS: u32 = 15;
}
