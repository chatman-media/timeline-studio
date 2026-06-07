use std::{
  fs,
  path::{Path, PathBuf},
  process::{Command, Output},
  time::{SystemTime, UNIX_EPOCH},
};

use serde_json::Value;

#[test]
fn agent_produce_to_publish_headless_smoke() {
  if !command_succeeds("ffmpeg", &["-version"]) || !command_succeeds("ffprobe", &["-version"]) {
    eprintln!("skipping headless smoke: ffmpeg/ffprobe is not available");
    return;
  }

  let workdir = temp_workdir();
  fs::create_dir_all(&workdir).expect("create smoke temp dir");

  let input = workdir.join("agent-input.mp4");
  create_synthetic_video(&input);

  let schema = run_timeline("emit-schema", &["emit-schema".into()]);
  let schema_json: Value = parse_json("emit-schema stdout", &schema.stdout);
  assert_eq!(schema_json["title"], "ProjectSchema");

  let analysis_path = workdir.join("analysis.json");
  run_timeline(
    "analyze",
    &[
      "analyze".into(),
      path_arg(&input),
      "--scenes".into(),
      "1".into(),
      "--output".into(),
      path_arg(&analysis_path),
    ],
  );
  let analysis_json: Value = parse_json_file("analysis output", &analysis_path);
  assert_eq!(analysis_json["file"]["media_type"], "video");
  assert!(
    analysis_json["scenes"]
      .as_array()
      .is_some_and(|s| !s.is_empty()),
    "analyze should emit at least one sampled scene"
  );

  let validate_output = workdir.join("validate-only-should-not-exist.mp4");
  let validation = run_timeline(
    "pipeline validate-only",
    &[
      "pipeline".into(),
      "--input".into(),
      path_arg(&input),
      "--platform".into(),
      "square".into(),
      "--output".into(),
      path_arg(&validate_output),
      "--token".into(),
      "fake-token-for-shape-only".into(),
      "--chat".into(),
      "@timeline_smoke".into(),
      "--caption".into(),
      "smoke".into(),
      "--scenes".into(),
      "1".into(),
      "--validate-only".into(),
    ],
  );
  let validation_json: Value = parse_json("pipeline validate-only stdout", &validation.stdout);
  assert_eq!(validation_json["mode"], "validate-only");
  assert_eq!(validation_json["publish"], "telegram");
  assert!(
    validation_json["steps"]
      .as_array()
      .is_some_and(|steps| steps.iter().any(|step| step == "publish:telegram")),
    "pipeline validate-only should cover the telegram publish leg"
  );
  assert!(
    !validate_output.exists(),
    "pipeline validate-only must not render or publish output"
  );

  let project_path = workdir.join("project.json");
  let example = run_timeline("emit-example", &["emit-example".into(), path_arg(&input)]);
  let project_json: Value = parse_json("emit-example stdout", &example.stdout);
  assert_eq!(project_json["metadata"]["name"], "headless-single-clip");
  fs::write(&project_path, &example.stdout).expect("write emitted ProjectSchema fixture");

  let rendered_output = workdir.join("rendered.mp4");
  run_timeline(
    "render",
    &[
      "render".into(),
      path_arg(&project_path),
      path_arg(&rendered_output),
    ],
  );
  assert_nonempty_file("render output", &rendered_output);

  let optimized_output = workdir.join("optimized.mp4");
  let pipeline = run_timeline(
    "pipeline",
    &[
      "pipeline".into(),
      "--input".into(),
      path_arg(&input),
      "--platform".into(),
      "square".into(),
      "--output".into(),
      path_arg(&optimized_output),
      "--scenes".into(),
      "1".into(),
    ],
  );
  let pipeline_json: Value = parse_json("pipeline stdout", &pipeline.stdout);
  assert_eq!(pipeline_json["platform"], "square");
  assert!(pipeline_json["message_id"].is_null());
  assert_nonempty_file("pipeline optimized output", &optimized_output);

  let _ = fs::remove_dir_all(&workdir);
}

fn run_timeline(step: &str, args: &[String]) -> Output {
  let output = Command::new(env!("CARGO_BIN_EXE_timeline"))
    .args(args)
    .output()
    .unwrap_or_else(|err| panic!("{step}: failed to spawn timeline: {err}"));

  assert!(
    output.status.success(),
    "{step} failed\nargs: timeline {}\nstatus: {}\nstdout:\n{}\nstderr:\n{}",
    args.join(" "),
    output.status,
    String::from_utf8_lossy(&output.stdout),
    String::from_utf8_lossy(&output.stderr)
  );

  output
}

fn command_succeeds(program: &str, args: &[&str]) -> bool {
  Command::new(program)
    .args(args)
    .output()
    .map(|output| output.status.success())
    .unwrap_or(false)
}

fn create_synthetic_video(path: &Path) {
  let output = Command::new("ffmpeg")
    .args([
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "testsrc=size=160x90:rate=15:duration=5",
      "-pix_fmt",
      "yuv420p",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-movflags",
      "+faststart",
      "-y",
      &path_arg(path),
    ])
    .output()
    .expect("spawn ffmpeg for synthetic video");

  assert!(
    output.status.success(),
    "synthetic fixture generation failed\nstatus: {}\nstdout:\n{}\nstderr:\n{}",
    output.status,
    String::from_utf8_lossy(&output.stdout),
    String::from_utf8_lossy(&output.stderr)
  );
  assert_nonempty_file("synthetic input", path);
}

fn parse_json(label: &str, bytes: &[u8]) -> Value {
  serde_json::from_slice(bytes).unwrap_or_else(|err| {
    panic!(
      "{label}: invalid JSON: {err}\n{}",
      String::from_utf8_lossy(bytes)
    )
  })
}

fn parse_json_file(label: &str, path: &Path) -> Value {
  let bytes =
    fs::read(path).unwrap_or_else(|err| panic!("{label}: cannot read {}: {err}", path.display()));
  parse_json(label, &bytes)
}

fn assert_nonempty_file(label: &str, path: &Path) {
  let len = fs::metadata(path)
    .unwrap_or_else(|err| panic!("{label}: missing {}: {err}", path.display()))
    .len();
  assert!(len > 0, "{label}: {} is empty", path.display());
}

fn temp_workdir() -> PathBuf {
  let nanos = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .expect("system time")
    .as_nanos();
  std::env::temp_dir().join(format!(
    "timeline-headless-smoke-{}-{nanos}",
    std::process::id()
  ))
}

fn path_arg(path: &Path) -> String {
  path.to_string_lossy().into_owned()
}
