//! Headless render PoC — Фаза 0/B задачи #90, теперь поверх крейта `ts-render`
//! (а не бин-в-монолите, который упирался в архивацию гигантского rlib).
//!
//! Строит `ProjectSchema` программно (без Tauri / AppHandle / webview) и рендерит
//! её в mp4 через `VideoRenderer`. Кодирование на CPU (`hardware_acceleration=false`).
//!
//! Запуск:
//! ```sh
//! cargo run --bin timeline-render -- <input-video> <output.mp4>
//! ```

use std::path::{Path, PathBuf};
use std::sync::Arc;

use ts_render::video_compiler::cache::RenderCache;
use ts_render::video_compiler::progress::ProgressUpdate;
use ts_render::video_compiler::renderer::VideoRenderer;
use ts_render::video_compiler::schema::{
  Clip, ExportSettings, OutputFormat, ProjectSchema, Track, TrackType,
};
use ts_render::video_compiler::CompilerSettings;
use tokio::sync::{mpsc, RwLock};

const CLIP_SECONDS: f64 = 5.0;

#[tokio::main]
async fn main() {
  env_logger::init(); // RUST_LOG=debug → видно ffmpeg-команду и stderr
  let args: Vec<String> = std::env::args().collect();
  if args.len() < 3 {
    eprintln!("usage: {} <input-video> <output.mp4>", args[0]);
    std::process::exit(2);
  }
  let input = PathBuf::from(&args[1]);
  let output = PathBuf::from(&args[2]);

  if !input.exists() {
    eprintln!("input not found: {}", input.display());
    std::process::exit(2);
  }

  // --- 1. Минимальный проект программно (без Tauri) ---
  let mut project = ProjectSchema::new("phase0-headless-poc".to_string());
  project.timeline.fps = 30;
  project.timeline.resolution = (1280, 720);
  project.timeline.duration = CLIP_SECONDS;
  project.settings.export = ExportSettings {
    format: OutputFormat::Mp4,
    hardware_acceleration: false, // CPU-путь, без GPU
    ..Default::default()
  };

  let mut track = Track::new(TrackType::Video, "Video".to_string());
  track.add_clip(Clip::new(input.clone(), 0.0, CLIP_SECONDS));
  project.tracks.push(track);

  // --- 2. Рендерер напрямую (без AppHandle / без webview) ---
  let settings = Arc::new(RwLock::new(CompilerSettings::default()));
  let cache = Arc::new(RwLock::new(RenderCache::new()));
  let (tx, mut rx) = mpsc::unbounded_channel::<ProgressUpdate>();

  let mut renderer = match VideoRenderer::new(project, settings, cache, tx).await {
    Ok(r) => r,
    Err(e) => {
      eprintln!("renderer init failed: {e}");
      std::process::exit(1);
    }
  };

  // --- 3. Рендер (спавнит таску; завершение — в канал прогресса) ---
  println!(
    "rendering {} -> {} (headless, CPU)…",
    input.display(),
    output.display()
  );
  let job_id = match renderer.render(Path::new(&output)).await {
    Ok(id) => id,
    Err(e) => {
      eprintln!("render start failed: {e}");
      std::process::exit(1);
    }
  };
  println!("job: {job_id}");

  // --- 4. Ждём терминальное событие ---
  use std::io::Write;
  while let Some(update) = rx.recv().await {
    match update {
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
        match std::fs::metadata(&output) {
          Ok(m) if m.len() > 0 => {
            println!("output size: {} bytes", m.len());
            return;
          }
          Ok(_) => {
            eprintln!("output exists but is empty");
            std::process::exit(1);
          }
          Err(e) => {
            eprintln!("output missing: {e}");
            std::process::exit(1);
          }
        }
      }
      ProgressUpdate::JobFailed {
        error, duration, ..
      } => {
        eprintln!("\n❌ render failed after {duration:?}: {error}");
        std::process::exit(1);
      }
      ProgressUpdate::JobCancelled { .. } => {
        eprintln!("\n⚠️ render cancelled");
        std::process::exit(1);
      }
      _ => {}
    }
  }

  eprintln!("progress channel closed before completion");
  std::process::exit(1);
}
