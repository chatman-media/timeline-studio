//! `timeline` — единый headless-CLI Timeline Studio для агента (M2 #121, M3 #122, M4 #123, M5 #124).
//!
//! Субкоманды без Tauri / AppHandle / webview — единый интерфейс для агента:
//! ```sh
//! timeline render <project.json> <out.mp4>            # ProjectSchema → видео (ts-render)
//! timeline ingest <file> [--proxy] [--proxy-dir DIR]  # ffprobe + опц. proxy → IngestResult JSON
//! timeline optimize -i in.mp4 -o out.mp4 -p youtube  # ре-энкод под платформу (ts-platform)
//! timeline thumbnail -i in.mp4 -o thumb.jpg          # кадр-превью (ts-platform)
//! timeline analyze <media>                            # ffprobe+ffmpeg → MediaAnalysis JSON
//! timeline pipeline -i in.mp4 -p tiktok -o out.mp4   # analyze→optimize→[publish] за 1 вызов
//! timeline publish telegram -i out.mp4 --token TOKEN --chat @channel
//! timeline emit-schema                                # JSON Schema контракта ProjectSchema
//! timeline emit-example <video>                       # пример ProjectSchema JSON
//! ```

use std::path::{Path, PathBuf};
use std::process::exit;
use std::sync::Arc;

use clap::{Parser, Subcommand};
use tokio::sync::{mpsc, RwLock};

use serde::Serialize;
use ts_media::media::metadata::get_media_metadata;
use ts_platform::business_logic::{generate_thumbnail_logic, optimize_for_platform_logic};
use ts_platform::types::{PlatformOptimizationParams, PlatformThumbnailParams};
use ts_agent::pipeline::{Pipeline, PipelineParams, PublishTarget};
use ts_analysis::headless::{AnalyzeParams, HeadlessAnalyzer};
use ts_montage::headless::{HeadlessMontagePlanner, MontagePlanParams};
use ts_publish::telegram::{TelegramPublishParams, TelegramPublisher};
use ts_publish::youtube::{YouTubePublishParams, YouTubePublisher};
use ts_render::video_compiler::cache::RenderCache;
use ts_render::video_compiler::progress::ProgressUpdate;
use ts_render::video_compiler::renderer::VideoRenderer;
use ts_render::video_compiler::schema::{
  Clip, ExportSettings, OutputFormat, ProjectSchema, Track, TrackType,
};
use ts_render::video_compiler::CompilerSettings;

const CLIP_SECONDS: f64 = 5.0;

#[derive(Parser)]
#[command(name = "timeline", version, about = "Headless Timeline Studio CLI для агента")]
struct Cli {
  #[command(subcommand)]
  cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
  /// Отрендерить ProjectSchema (JSON) в mp4
  Render {
    /// project.json (ProjectSchema)
    project: PathBuf,
    /// выходной mp4
    output: PathBuf,
  },
  /// Импортировать/зондировать медиафайл: ffprobe → IngestResult JSON; опционально прокси
  Ingest {
    /// медиафайл (локальный путь)
    input: PathBuf,
    /// сгенерировать низкорезолюционный прокси (960×540, h264 crf=28)
    #[arg(long)]
    proxy: bool,
    /// директория для прокси (по умолчанию рядом с файлом)
    #[arg(long)]
    proxy_dir: Option<PathBuf>,
    /// ширина прокси
    #[arg(long, default_value_t = 960)]
    proxy_width: u32,
    /// высота прокси
    #[arg(long, default_value_t = 540)]
    proxy_height: u32,
  },
  /// Оптимизировать видео под платформу (ffmpeg re-encode под specs)
  Optimize {
    #[arg(short, long)]
    input: String,
    #[arg(short, long)]
    output: String,
    /// пресет: youtube | tiktok | reels | shorts | instagram | square
    #[arg(short, long, default_value = "youtube")]
    platform: String,
    #[arg(long)]
    width: Option<u32>,
    #[arg(long)]
    height: Option<u32>,
    /// битрейт, кбит/с
    #[arg(long)]
    bitrate: Option<u32>,
    #[arg(long)]
    fps: Option<u32>,
    /// кропнуть под целевое соотношение
    #[arg(long)]
    crop: bool,
  },
  /// Сгенерировать превью (кадр)
  Thumbnail {
    #[arg(short, long)]
    input: String,
    #[arg(short, long)]
    output: String,
    /// тайм-код кадра, сек
    #[arg(long, default_value_t = 1.0)]
    time: f64,
    #[arg(long, default_value_t = 1280)]
    width: u32,
    #[arg(long, default_value_t = 720)]
    height: u32,
  },
  /// Напечатать JSON Schema контракта ProjectSchema
  EmitSchema,
  /// Напечатать пример ProjectSchema JSON (обёртка одного видео)
  EmitExample {
    /// входное видео для примера
    input: PathBuf,
  },
  /// Полный пайплайн: analyze → optimize → publish (один вызов для агента)
  Pipeline {
    /// входной медиафайл
    #[arg(short, long)]
    input: String,
    /// целевая платформа: youtube | tiktok | reels | shorts | instagram | square
    #[arg(short, long, default_value = "youtube")]
    platform: String,
    /// путь к оптимизированному файлу
    #[arg(short, long)]
    output: String,
    /// токен Telegram-бота (без этого — только optimize, без публикации)
    #[arg(long)]
    token: Option<String>,
    /// chat_id Telegram
    #[arg(long)]
    chat: Option<String>,
    /// подпись к видео
    #[arg(long)]
    caption: Option<String>,
    /// число сцен для анализа
    #[arg(long, default_value_t = 8)]
    scenes: usize,
  },
  /// Анализировать медиафайл: ffprobe+ffmpeg → структурированный JSON
  Analyze {
    /// входной медиафайл
    input: PathBuf,
    /// число сцен для сэмплирования (по умолчанию 8)
    #[arg(long, default_value_t = 8)]
    scenes: usize,
    /// сохранить JSON в файл (иначе stdout)
    #[arg(short, long)]
    output: Option<PathBuf>,
  },
  /// Опубликовать видео на платформу
  Publish {
    #[command(subcommand)]
    platform: PublishPlatform,
  },
  /// Построить план монтажа из медиафайлов → ProjectSchema JSON (ts-montage)
  MontagePlan {
    /// Входные медиафайлы (один или несколько)
    #[arg(required = true)]
    inputs: Vec<String>,
    /// Целевая платформа: youtube | tiktok | reels | shorts | instagram | square
    #[arg(short, long, default_value = "youtube")]
    platform: String,
    /// Целевая длительность монтажа (секунды)
    #[arg(short, long, default_value_t = 30.0)]
    duration: f64,
    /// Стиль монтажа: social-media | documentary | cinematic | music-video | corporate | travel | wedding
    #[arg(long, default_value = "social-media")]
    style: String,
    /// Число сцен для анализа каждого файла
    #[arg(long, default_value_t = 8)]
    scenes: usize,
    /// Сохранить ProjectSchema JSON в файл (иначе — stdout)
    #[arg(short, long)]
    output: Option<PathBuf>,
    /// Выводить только ProjectSchema (без обёртки с метаданными)
    #[arg(long)]
    schema_only: bool,
  },
}

#[derive(Subcommand)]
enum PublishPlatform {
  /// Загрузить видео на YouTube через Data API v3 resumable upload
  Youtube {
    /// видеофайл для загрузки
    #[arg(short, long)]
    input: String,
    /// OAuth2 access token (`ya29.a0...`)
    #[arg(long, env = "YOUTUBE_ACCESS_TOKEN")]
    token: String,
    /// Заголовок видео
    #[arg(long, default_value = "Timeline Studio Export")]
    title: String,
    /// Описание видео
    #[arg(long)]
    description: Option<String>,
    /// Теги через запятую
    #[arg(long)]
    tags: Option<String>,
    /// Категория YouTube (числовой ID, дефолт: 22 = People & Blogs)
    #[arg(long, default_value = "22")]
    category: String,
    /// Приватность: public | private | unlisted
    #[arg(long, default_value = "private")]
    privacy: String,
    /// Уведомить подписчиков
    #[arg(long)]
    notify: bool,
    /// Только проверить токен (channels.list?mine=true), не загружать
    #[arg(long)]
    validate_only: bool,
  },
  /// Загрузить видео в Telegram-канал/чат через Bot API (sendVideo)
  Telegram {
    /// входное видео (не нужен при --validate-only)
    #[arg(short, long)]
    input: Option<String>,
    /// токен бота (из @BotFather)
    #[arg(long)]
    token: String,
    /// chat_id: числовой ID, @username канала или «me»
    #[arg(long)]
    chat: String,
    /// подпись под видео
    #[arg(long)]
    caption: Option<String>,
    /// только проверить токен (getMe), не отправлять
    #[arg(long)]
    validate_only: bool,
  },
}

#[tokio::main]
async fn main() {
  env_logger::init();
  match Cli::parse().cmd {
    Cmd::Render { project, output } => cmd_render(&project, &output).await,
    Cmd::Ingest {
      input,
      proxy,
      proxy_dir,
      proxy_width,
      proxy_height,
    } => cmd_ingest(&input, proxy, proxy_dir.as_deref(), proxy_width, proxy_height),
    Cmd::Optimize {
      input,
      output,
      platform,
      width,
      height,
      bitrate,
      fps,
      crop,
    } => cmd_optimize(input, output, &platform, width, height, bitrate, fps, crop).await,
    Cmd::Thumbnail {
      input,
      output,
      time,
      width,
      height,
    } => cmd_thumbnail(input, output, time, width, height).await,
    Cmd::Pipeline {
      input,
      platform,
      output,
      token,
      chat,
      caption,
      scenes,
    } => cmd_pipeline(input, platform, output, token, chat, caption, scenes).await,
    Cmd::Analyze {
      input,
      scenes,
      output,
    } => cmd_analyze(&input, scenes, output.as_deref()).await,
    Cmd::EmitSchema => {
      let schema = schemars::schema_for!(ProjectSchema);
      println!("{}", serde_json::to_string_pretty(&schema).unwrap());
    }
    Cmd::EmitExample { input } => {
      let project = build_single_clip_project(input);
      println!("{}", serde_json::to_string_pretty(&project).unwrap());
    }
    Cmd::MontagePlan {
      inputs,
      platform,
      duration,
      style,
      scenes,
      output,
      schema_only,
    } => cmd_montage_plan(inputs, platform, duration, style, scenes, output.as_deref(), schema_only).await,
    Cmd::Publish { platform } => match platform {
      PublishPlatform::Youtube {
        input,
        token,
        title,
        description,
        tags,
        category,
        privacy,
        notify,
        validate_only,
      } => cmd_publish_youtube(input, token, title, description, tags, category, privacy, notify, validate_only).await,
      PublishPlatform::Telegram {
        input,
        token,
        chat,
        caption,
        validate_only,
      } => cmd_publish_telegram(input.unwrap_or_default(), token, chat, caption, validate_only).await,
    },
  }
}

// ─── ingest ──────────────────────────────────────────────────────────────────

/// Результат инжеста медиафайла (агент-friendly JSON).
#[derive(Debug, Serialize)]
struct IngestResult {
  path: String,
  filename: String,
  size_bytes: u64,
  media_type: String,
  duration_secs: Option<f64>,
  width: Option<u32>,
  height: Option<u32>,
  fps: Option<f64>,
  video_codec: Option<String>,
  audio_codec: Option<String>,
  sample_rate_hz: Option<u32>,
  audio_channels: Option<u8>,
  bitrate_kbps: Option<f64>,
  proxy_path: Option<String>,
}

fn cmd_ingest(
  input: &Path,
  make_proxy: bool,
  proxy_dir: Option<&Path>,
  proxy_width: u32,
  proxy_height: u32,
) {
  if !input.exists() {
    eprintln!("❌ ingest: файл не найден: {}", input.display());
    exit(2);
  }

  let media = match get_media_metadata(input.to_string_lossy().to_string()) {
    Ok(m) => m,
    Err(e) => {
      eprintln!("❌ ingest ffprobe: {e}");
      exit(1);
    }
  };

  // Разбираем потоки
  let video_stream = media
    .probe_data
    .streams
    .iter()
    .find(|s| s.codec_type == "video");
  let audio_stream = media
    .probe_data
    .streams
    .iter()
    .find(|s| s.codec_type == "audio");

  let fps = video_stream
    .and_then(|s| s.r_frame_rate.as_deref())
    .and_then(|r| {
      if let Some((n, d)) = r.split_once('/') {
        let n: f64 = n.parse().ok()?;
        let d: f64 = d.parse().ok()?;
        if d != 0.0 { Some(n / d) } else { None }
      } else {
        r.parse().ok()
      }
    });

  let bitrate_kbps = media
    .probe_data
    .format
    .bit_rate
    .as_deref()
    .and_then(|b| b.parse::<f64>().ok())
    .map(|b| b / 1000.0);

  let media_type = if media.is_video {
    "video"
  } else if media.is_audio {
    "audio"
  } else {
    "image"
  };

  // Опциональный прокси
  let proxy_path = if make_proxy && media.is_video {
    let dir = proxy_dir
      .map(|p| p.to_path_buf())
      .or_else(|| input.parent().map(|p| p.to_path_buf()))
      .unwrap_or_else(|| std::path::PathBuf::from("/tmp"));

    let stem = input
      .file_stem()
      .and_then(|s| s.to_str())
      .unwrap_or("proxy");
    let proxy_name = format!("{stem}_proxy_{proxy_width}x{proxy_height}.mp4");
    let proxy_out = dir.join(&proxy_name);

    let status = std::process::Command::new("ffmpeg")
      .args([
        "-i",
        &input.to_string_lossy(),
        "-vf",
        &format!("scale={proxy_width}:{proxy_height}"),
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "28",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-y",
        &proxy_out.to_string_lossy(),
      ])
      .stderr(std::process::Stdio::null())
      .status();

    match status {
      Ok(s) if s.success() => Some(proxy_out.to_string_lossy().to_string()),
      _ => {
        eprintln!("⚠️  прокси не создан (ffmpeg error)");
        None
      }
    }
  } else {
    None
  };

  let result = IngestResult {
    path: input.to_string_lossy().to_string(),
    filename: input
      .file_name()
      .and_then(|n| n.to_str())
      .unwrap_or("unknown")
      .to_string(),
    size_bytes: media.size,
    media_type: media_type.to_string(),
    duration_secs: media.duration,
    width: video_stream.and_then(|s| s.width),
    height: video_stream.and_then(|s| s.height),
    fps,
    video_codec: video_stream.and_then(|s| s.codec_name.clone()),
    audio_codec: audio_stream.and_then(|s| s.codec_name.clone()),
    sample_rate_hz: audio_stream
      .and_then(|s| s.sample_rate.as_deref())
      .and_then(|r| r.parse().ok()),
    audio_channels: audio_stream.and_then(|s| s.channels),
    bitrate_kbps,
    proxy_path,
  };

  println!("{}", serde_json::to_string_pretty(&result).unwrap());
}

/// Пресеты платформ: (width, height, bitrate-kbps, fps).
fn platform_preset(p: &str) -> (u32, u32, u32, u32) {
  match p {
    "tiktok" | "reels" | "shorts" => (1080, 1920, 6000, 30),
    "instagram" | "square" => (1080, 1080, 5000, 30),
    _ => (1920, 1080, 8000, 30), // youtube / default
  }
}

#[allow(clippy::too_many_arguments)]
async fn cmd_optimize(
  input: String,
  output: String,
  platform: &str,
  width: Option<u32>,
  height: Option<u32>,
  bitrate: Option<u32>,
  fps: Option<u32>,
  crop: bool,
) {
  let (pw, ph, pb, pf) = platform_preset(platform);
  let params = PlatformOptimizationParams {
    input_path: input,
    output_path: output,
    target_width: width.unwrap_or(pw),
    target_height: height.unwrap_or(ph),
    target_bitrate: bitrate.unwrap_or(pb),
    target_framerate: fps.unwrap_or(pf),
    audio_codec: "aac".to_string(),
    video_codec: "libx264".to_string(),
    crop_to_fit: crop,
  };
  match optimize_for_platform_logic(&params).await {
    Ok(r) => println!(
      "✅ optimize: {} ({}x{}, {}kbps, {} bytes) за {:.2}s",
      r.output_path, r.width, r.height, r.bitrate, r.file_size, r.processing_time
    ),
    Err(e) => {
      eprintln!("❌ optimize: {e}");
      exit(1);
    }
  }
}

async fn cmd_thumbnail(input: String, output: String, time: f64, width: u32, height: u32) {
  let params = PlatformThumbnailParams {
    input_path: input,
    output_path: output,
    width,
    height,
    timestamp: time,
    quality: Some(90),
  };
  match generate_thumbnail_logic(&params).await {
    Ok(r) => println!(
      "✅ thumbnail: {} ({}x{}, {} bytes)",
      r.thumbnail_path, r.width, r.height, r.file_size
    ),
    Err(e) => {
      eprintln!("❌ thumbnail: {e}");
      exit(1);
    }
  }
}

/// Минимальный 1-клиповый проект (без Tauri) — для emit-example.
fn build_single_clip_project(input: PathBuf) -> ProjectSchema {
  let mut project = ProjectSchema::new("headless-single-clip".to_string());
  project.timeline.fps = 30;
  project.timeline.resolution = (1280, 720);
  project.timeline.duration = CLIP_SECONDS;
  project.settings.export = ExportSettings {
    format: OutputFormat::Mp4,
    hardware_acceleration: false,
    ..Default::default()
  };
  let mut track = Track::new(TrackType::Video, "Video".to_string());
  track.add_clip(Clip::new(input, 0.0, CLIP_SECONDS));
  project.tracks.push(track);
  project
}

/// Рендер ProjectSchema headless (без AppHandle/webview).
async fn cmd_render(project_path: &Path, output: &Path) {
  let json = match std::fs::read_to_string(project_path) {
    Ok(s) => s,
    Err(e) => {
      eprintln!("cannot read {}: {e}", project_path.display());
      exit(2);
    }
  };
  let project: ProjectSchema = match serde_json::from_str(&json) {
    Ok(p) => p,
    Err(e) => {
      eprintln!("invalid ProjectSchema JSON: {e}");
      exit(2);
    }
  };

  let settings = Arc::new(RwLock::new(CompilerSettings::default()));
  let cache = Arc::new(RwLock::new(RenderCache::new()));
  let (tx, mut rx) = mpsc::unbounded_channel::<ProgressUpdate>();

  let mut renderer = match VideoRenderer::new(project, settings, cache, tx).await {
    Ok(r) => r,
    Err(e) => {
      eprintln!("renderer init failed: {e}");
      exit(1);
    }
  };

  println!("rendering -> {} (headless)…", output.display());
  if let Err(e) = renderer.render(output).await {
    eprintln!("render start failed: {e}");
    exit(1);
  }

  use std::io::Write;
  while let Some(u) = rx.recv().await {
    match u {
      ProgressUpdate::ProgressChanged { .. } => {
        print!(".");
        let _ = std::io::stdout().flush();
      }
      ProgressUpdate::JobCompleted {
        output_path,
        duration,
        ..
      } => {
        println!("\n✅ done in {duration:?} -> {output_path}");
        return;
      }
      ProgressUpdate::JobFailed { error, .. } => {
        eprintln!("\n❌ render failed: {error}");
        exit(1);
      }
      ProgressUpdate::JobCancelled { .. } => {
        eprintln!("\n⚠️ render cancelled");
        exit(1);
      }
      _ => {}
    }
  }
  eprintln!("progress channel closed before completion");
  exit(1);
}

/// Полный пайплайн: analyze → optimize → [publish].
#[allow(clippy::too_many_arguments)]
async fn cmd_pipeline(
  input: String,
  platform: String,
  output: String,
  token: Option<String>,
  chat: Option<String>,
  caption: Option<String>,
  scenes: usize,
) {
  let publish = match (token, chat) {
    (Some(t), Some(c)) => Some(PublishTarget::Telegram {
      bot_token: t,
      chat_id: c,
      caption,
    }),
    _ => None,
  };

  match Pipeline::new()
    .run(PipelineParams {
      input: input.clone(),
      platform: platform.clone(),
      output: output.clone(),
      publish,
      scene_count: scenes,
    })
    .await
  {
    Ok(r) => {
      let json = serde_json::to_string_pretty(&r).unwrap();
      println!("{json}");
    }
    Err(e) => {
      eprintln!("❌ pipeline: {e}");
      exit(1);
    }
  }
}

/// Анализ медиафайла через ffprobe + ffmpeg.
async fn cmd_analyze(input: &Path, scene_count: usize, output: Option<&Path>) {
  let analyzer = HeadlessAnalyzer::new();
  match analyzer
    .analyze(AnalyzeParams {
      input_path: input.to_string_lossy().to_string(),
      scene_count,
    })
    .await
  {
    Ok(result) => {
      let json = serde_json::to_string_pretty(&result).unwrap();
      match output {
        Some(p) => {
          if let Err(e) = std::fs::write(p, &json) {
            eprintln!("❌ не могу записать {}: {e}", p.display());
            exit(1);
          }
          println!(
            "✅ analyze: {} сцен, quality={:.2}, → {}",
            result.scenes.len(),
            result.content.quality_overall,
            p.display()
          );
        }
        None => println!("{json}"),
      }
    }
    Err(e) => {
      eprintln!("❌ analyze: {e}");
      exit(1);
    }
  }
}

/// Публикация на YouTube (Data API v3 resumable upload / channels.list).
#[allow(clippy::too_many_arguments)]
async fn cmd_publish_youtube(
  input: String,
  token: String,
  title: String,
  description: Option<String>,
  tags: Option<String>,
  category: String,
  privacy: String,
  notify: bool,
  validate_only: bool,
) {
  let publisher = YouTubePublisher::new();

  if validate_only {
    match publisher.validate_token(&token).await {
      Ok(channel) => println!("ok token valid, channel: {channel}"),
      Err(e) => {
        eprintln!("token invalid: {e}");
        exit(1);
      }
    }
    return;
  }

  let tag_list: Vec<String> = tags
    .as_deref()
    .unwrap_or("")
    .split(',')
    .map(|s| s.trim().to_string())
    .filter(|s| !s.is_empty())
    .collect();

  match publisher
    .upload_video(YouTubePublishParams {
      access_token: token,
      video_path: input,
      title,
      description,
      tags: tag_list,
      category_id: category,
      privacy_status: privacy,
      notify_subscribers: notify,
    })
    .await
  {
    Ok(r) => println!(
      "ok youtube: video_id={} url={} ({} bytes, {:.2}s)",
      r.video_id, r.url, r.file_size, r.elapsed_secs
    ),
    Err(e) => {
      eprintln!("youtube: {e}");
      exit(1);
    }
  }
}

/// Публикация в Telegram (Bot API sendVideo / getMe).
async fn cmd_publish_telegram(
  input: String,
  token: String,
  chat: String,
  caption: Option<String>,
  validate_only: bool,
) {
  let publisher = TelegramPublisher::new();

  if validate_only {
    match publisher.validate_token(&token).await {
      Ok(name) => println!("✅ токен действителен, бот: {name}"),
      Err(e) => {
        eprintln!("❌ токен недействителен: {e}");
        exit(1);
      }
    }
    return;
  }

  match publisher
    .send_video(TelegramPublishParams {
      bot_token: token,
      chat_id: chat,
      video_path: input,
      caption,
      supports_streaming: true,
    })
    .await
  {
    Ok(r) => println!(
      "✅ telegram: message_id={} ({} bytes, {:.2}s)",
      r.message_id, r.file_size, r.elapsed_secs
    ),
    Err(e) => {
      eprintln!("❌ telegram: {e}");
      exit(1);
    }
  }
}

/// Построить план монтажа: analyze(каждый файл) → PlanGenerator → ProjectSchema.
#[allow(clippy::too_many_arguments)]
async fn cmd_montage_plan(
  inputs: Vec<String>,
  platform: String,
  duration: f64,
  style: String,
  scenes: usize,
  output: Option<&Path>,
  schema_only: bool,
) {
  // Шаг 1: анализ каждого входного файла
  let mut analyses: Vec<serde_json::Value> = Vec::new();
  let mut source_files: Vec<String> = Vec::new();

  eprintln!("Analyzing {} file(s)...", inputs.len());
  for input in &inputs {
    let analyzer = HeadlessAnalyzer::new();
    match analyzer
      .analyze(AnalyzeParams {
        input_path: input.clone(),
        scene_count: scenes,
      })
      .await
    {
      Ok(result) => {
        let json = serde_json::to_value(&result).unwrap();
        eprintln!(
          "  ok {} -- {} scenes, quality={:.2}",
          input,
          result.scenes.len(),
          result.content.quality_overall
        );
        analyses.push(json);
        source_files.push(input.clone());
      }
      Err(e) => {
        eprintln!("  error {input}: {e}");
        exit(1);
      }
    }
  }

  // Шаг 2: планирование монтажа
  eprintln!("Building montage plan (style={style}, duration={duration}s, platform={platform})...");
  let planner = HeadlessMontagePlanner::new();
  match planner
    .plan_from_analyses(
      analyses,
      source_files,
      MontagePlanParams {
        inputs: inputs.clone(),
        platform: platform.clone(),
        duration_secs: duration,
        style: style.clone(),
        scene_count: scenes,
      },
    )
    .await
  {
    Ok(result) => {
      let json_out = if schema_only {
        serde_json::to_string_pretty(&result.project_schema).unwrap()
      } else {
        serde_json::to_string_pretty(&result).unwrap()
      };

      match output {
        Some(p) => {
          if let Err(e) = std::fs::write(p, &json_out) {
            eprintln!("cannot write {}: {e}", p.display());
            exit(1);
          }
          eprintln!(
            "ok montage-plan: {} clips, quality={:.2}, elapsed={:.2}s -> {}",
            result.plan.clips.len(),
            result.plan.quality_score,
            result.elapsed_secs,
            p.display()
          );
        }
        None => println!("{json_out}"),
      }
    }
    Err(e) => {
      eprintln!("montage-plan failed: {e}");
      exit(1);
    }
  }
}

#[cfg(test)]
mod tests {
  use super::platform_preset;

  #[test]
  fn presets_map_correctly() {
    assert_eq!(platform_preset("youtube"), (1920, 1080, 8000, 30));
    assert_eq!(platform_preset("tiktok"), (1080, 1920, 6000, 30));
    assert_eq!(platform_preset("reels"), (1080, 1920, 6000, 30));
    assert_eq!(platform_preset("square"), (1080, 1080, 5000, 30));
    assert_eq!(platform_preset("unknown"), (1920, 1080, 8000, 30)); // дефолт
  }
}
