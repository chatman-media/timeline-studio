//! `timeline` — единый headless-CLI Timeline Studio для агента (M2 #121, M5 #124).
//!
//! Субкоманды без Tauri / AppHandle / webview — единый интерфейс для агента:
//! ```sh
//! timeline render <project.json> <out.mp4>            # ProjectSchema → видео (ts-render)
//! timeline optimize -i in.mp4 -o out.mp4 -p youtube  # ре-энкод под платформу (ts-platform)
//! timeline thumbnail -i in.mp4 -o thumb.jpg          # кадр-превью (ts-platform)
//! timeline publish telegram -i out.mp4 --token TOKEN --chat @channel  # Bot API sendVideo
//! timeline emit-schema                                # JSON Schema контракта ProjectSchema
//! timeline emit-example <video>                       # пример ProjectSchema JSON
//! ```

use std::path::{Path, PathBuf};
use std::process::exit;
use std::sync::Arc;

use clap::{Parser, Subcommand};
use tokio::sync::{mpsc, RwLock};

use ts_platform::business_logic::{generate_thumbnail_logic, optimize_for_platform_logic};
use ts_platform::types::{PlatformOptimizationParams, PlatformThumbnailParams};
use ts_agent::pipeline::{Pipeline, PipelineParams, PublishTarget};
use ts_analysis::headless::{AnalyzeParams, HeadlessAnalyzer};
use ts_publish::telegram::{TelegramPublishParams, TelegramPublisher};
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
}

#[derive(Subcommand)]
enum PublishPlatform {
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
    Cmd::Publish { platform } => match platform {
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
