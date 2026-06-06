//! Headless-рендер ts-render (#90) — управляем агентом, без Tauri / AppHandle / webview.
//!
//! Собирает/загружает `ProjectSchema` и рендерит её в mp4 через `VideoRenderer`
//! (CPU-кодирование, `hardware_acceleration=false`).
//!
//! Режимы:
//! ```sh
//! # обернуть одно видео в 1-клиповый проект и отрендерить (удобный режим):
//! timeline-render <input-video> <output.mp4>
//!
//! # отрендерить произвольный таймлайн из JSON (ОСНОВНОЙ agent-интерфейс):
//! timeline-render --project <project.json> <output.mp4>
//!
//! # напечатать пример ProjectSchema JSON (шаблон, который агент редактирует):
//! timeline-render --emit-example <input-video>
//! ```
//! Агентный цикл: `--emit-example` → правка JSON (клипы/треки/эффекты) → `--project` → видео.

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
  let prog = args
    .first()
    .cloned()
    .unwrap_or_else(|| "timeline-render".into());

  match args.get(1).map(String::as_str) {
    // --- ОСНОВНОЙ agent-интерфейс: ProjectSchema из JSON -> видео ---
    Some("--project") => {
      let (Some(json_path), Some(output)) = (args.get(2), args.get(3)) else {
        eprintln!("usage: {prog} --project <project.json> <output.mp4>");
        std::process::exit(2);
      };
      let json = match std::fs::read_to_string(json_path) {
        Ok(s) => s,
        Err(e) => {
          eprintln!("cannot read {json_path}: {e}");
          std::process::exit(2);
        }
      };
      let project: ProjectSchema = match serde_json::from_str(&json) {
        Ok(p) => p,
        Err(e) => {
          eprintln!("invalid ProjectSchema JSON ({json_path}): {e}");
          std::process::exit(2);
        }
      };
      render_project(project, Path::new(output)).await;
    }

    // --- шаблон ProjectSchema JSON для агента ---
    Some("--emit-example") => {
      let Some(input) = args.get(2) else {
        eprintln!("usage: {prog} --emit-example <input-video>");
        std::process::exit(2);
      };
      let project = build_single_clip_project(PathBuf::from(input));
      match serde_json::to_string_pretty(&project) {
        Ok(s) => println!("{s}"),
        Err(e) => {
          eprintln!("serialize failed: {e}");
          std::process::exit(1);
        }
      }
    }

    // --- JSON Schema контракта ProjectSchema (машинный контракт для агента) ---
    Some("--emit-schema") => {
      let schema = schemars::schema_for!(ProjectSchema);
      match serde_json::to_string_pretty(&schema) {
        Ok(s) => println!("{s}"),
        Err(e) => {
          eprintln!("serialize failed: {e}");
          std::process::exit(1);
        }
      }
    }

    // --- удобный режим: обернуть одно видео в 1 клип ---
    Some(arg) if !arg.starts_with("--") && args.len() >= 3 => {
      let input = PathBuf::from(&args[1]);
      let output = PathBuf::from(&args[2]);
      if !input.exists() {
        eprintln!("input not found: {}", input.display());
        std::process::exit(2);
      }
      render_project(build_single_clip_project(input), Path::new(&output)).await;
    }

    _ => {
      eprintln!("usage:");
      eprintln!("  {prog} <input-video> <output.mp4>            обернуть 1 клип и отрендерить");
      eprintln!("  {prog} --project <project.json> <output.mp4>  отрендерить ProjectSchema из JSON");
      eprintln!("  {prog} --emit-example <input-video>           напечатать пример ProjectSchema JSON");
      eprintln!("  {prog} --emit-schema                          напечатать JSON Schema контракта");
      std::process::exit(2);
    }
  }
}

/// Минимальный 1-клиповый проект, собранный программно (без Tauri).
fn build_single_clip_project(input: PathBuf) -> ProjectSchema {
  let mut project = ProjectSchema::new("headless-single-clip".to_string());
  project.timeline.fps = 30;
  project.timeline.resolution = (1280, 720);
  project.timeline.duration = CLIP_SECONDS;
  project.settings.export = ExportSettings {
    format: OutputFormat::Mp4,
    hardware_acceleration: false, // CPU-путь, без GPU
    ..Default::default()
  };

  let mut track = Track::new(TrackType::Video, "Video".to_string());
  track.add_clip(Clip::new(input, 0.0, CLIP_SECONDS));
  project.tracks.push(track);
  project
}

/// Рендерит `ProjectSchema` headless (без AppHandle/webview) и ждёт терминальное событие.
async fn render_project(project: ProjectSchema, output: &Path) {
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

  println!("rendering -> {} (headless, CPU)…", output.display());
  let job_id = match renderer.render(output).await {
    Ok(id) => id,
    Err(e) => {
      eprintln!("render start failed: {e}");
      std::process::exit(1);
    }
  };
  println!("job: {job_id}");

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
        match std::fs::metadata(output) {
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
