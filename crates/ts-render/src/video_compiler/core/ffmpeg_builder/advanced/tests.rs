use super::*;
use crate::video_compiler::schema::ProjectSchema;
use std::path::Path;

/// Создать тестовый проект
fn create_test_project() -> ProjectSchema {
  ProjectSchema::new("test_project".to_string())
}

/// Создать FFmpegBuilder с тестовыми настройками
fn create_test_builder() -> FFmpegBuilder {
  let project = create_test_project();
  FFmpegBuilder::new(project)
}

#[cfg(test)]
mod thumbnails_tests {
  use super::*;

  #[tokio::test]
  async fn test_build_thumbnails_command_basic() {
    let builder = create_test_builder();

    let cmd = builder
      .build_thumbnails_command(
        Path::new("/test/video.mp4"),
        "/output/thumb_%03d.jpg",
        10,
        None,
      )
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем основные аргументы
    assert!(args.contains(&"-i".to_string()));
    assert!(args.contains(&"/test/video.mp4".to_string()));
    assert!(args.contains(&"-vf".to_string()));
    assert!(args.iter().any(|s| s.contains("fps=1/10")));
    assert!(args.contains(&"-q:v".to_string()));
    assert!(args.contains(&"2".to_string()));
    assert!(args.contains(&"/output/thumb_%03d.jpg".to_string()));
  }

  #[tokio::test]
  async fn test_build_thumbnails_command_with_size() {
    let builder = create_test_builder();

    let cmd = builder
      .build_thumbnails_command(Path::new("input.mp4"), "thumb_%d.jpg", 5, Some((640, 360)))
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем фильтр с размером
    let vf_arg = find_arg_value(&args, "-vf").unwrap();
    assert!(vf_arg.contains("fps=1/5"));
    assert!(vf_arg.contains("scale=640:360"));
  }
}

#[cfg(test)]
mod video_preview_tests {
  use super::*;

  #[tokio::test]
  async fn test_build_video_preview_command() {
    let builder = create_test_builder();

    let cmd = builder
      .build_video_preview_command(
        Path::new("source.mp4"),
        Path::new("preview.mp4"),
        10.0,
        Some((1280, 720)),
        Some(2000),
      )
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем длительность
    assert!(args.contains(&"-t".to_string()));
    assert!(args.contains(&"10".to_string()));

    // Проверяем масштабирование и ускорение
    let vf_arg = find_arg_value(&args, "-vf").unwrap();
    assert!(vf_arg.contains("scale=1280:720"));
    assert!(vf_arg.contains("setpts=0.5*PTS"));

    // Проверяем битрейт
    assert!(args.contains(&"-b:v".to_string()));
    assert!(args.contains(&"2000k".to_string()));

    // Проверяем аудио
    assert!(args.contains(&"-af".to_string()));
    assert!(args.contains(&"atempo=2.0".to_string()));
  }

  #[tokio::test]
  async fn test_video_preview_default_bitrate() {
    let builder = create_test_builder();

    let cmd = builder
      .build_video_preview_command(
        Path::new("input.mp4"),
        Path::new("output.mp4"),
        5.0,
        None,
        None,
      )
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем битрейт по умолчанию
    assert!(args.contains(&"1000k".to_string()));
  }
}

#[cfg(test)]
mod waveform_tests {
  use super::*;

  #[tokio::test]
  async fn test_build_waveform_command() {
    let builder = create_test_builder();

    let cmd = builder
      .build_waveform_command(
        Path::new("audio.mp3"),
        Path::new("waveform.png"),
        (1920, 200),
        "0x00FF00|0xFF0000",
      )
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем фильтр
    let filter_arg = find_arg_value(&args, "-filter_complex").unwrap();
    assert!(filter_arg.contains("showwavespic"));
    assert!(filter_arg.contains("s=1920x200"));
    assert!(filter_arg.contains("colors=0x00FF00|0xFF0000"));

    // Проверяем что генерируется только один кадр
    assert!(args.contains(&"-frames:v".to_string()));
    assert!(args.contains(&"1".to_string()));
  }
}

#[cfg(test)]
mod gif_preview_tests {
  use super::*;

  #[tokio::test]
  async fn test_build_gif_preview_command() {
    let builder = create_test_builder();

    let cmd = builder
      .build_gif_preview_command(
        Path::new("video.mp4"),
        Path::new("preview.gif"),
        10.0,
        5.0,
        15,
        Some((480, 270)),
      )
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем начальную позицию
    assert_eq!(find_arg_value(&args, "-ss"), Some("10".to_string()));

    // Проверяем длительность
    assert_eq!(find_arg_value(&args, "-t"), Some("5".to_string()));

    // Проверяем сложный фильтр для GIF
    let filter = find_arg_value(&args, "-filter_complex").unwrap();
    assert!(filter.contains("fps=15"));
    assert!(filter.contains("scale=480:270"));
    assert!(filter.contains("palettegen"));
    assert!(filter.contains("paletteuse"));
  }

  #[tokio::test]
  async fn test_gif_preview_default_size() {
    let builder = create_test_builder();

    let cmd = builder
      .build_gif_preview_command(
        Path::new("video.mp4"),
        Path::new("preview.gif"),
        0.0,
        3.0,
        10,
        None,
      )
      .await
      .unwrap();

    let args = get_command_args(&cmd);
    let filter = find_arg_value(&args, "-filter_complex").unwrap();

    // Проверяем размер по умолчанию
    assert!(filter.contains("scale=320:180"));
  }
}

#[cfg(test)]
mod concat_tests {
  use super::*;

  #[tokio::test]
  async fn test_build_concat_command() {
    let builder = create_test_builder();

    let segments = vec![
      PathBuf::from("segment1.mp4"),
      PathBuf::from("segment2.mp4"),
      PathBuf::from("segment3.mp4"),
    ];

    let cmd = builder
      .build_concat_command(&segments, Path::new("output.mp4"))
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем входные файлы
    assert!(args.contains(&"segment1.mp4".to_string()));
    assert!(args.contains(&"segment2.mp4".to_string()));
    assert!(args.contains(&"segment3.mp4".to_string()));

    // Проверяем concat фильтр
    let filter = find_arg_value(&args, "-filter_complex").unwrap();
    assert!(filter.contains("concat=n=3:v=1:a=1"));
    assert!(filter.contains("[0:v][0:a]"));
    assert!(filter.contains("[1:v][1:a]"));
    assert!(filter.contains("[2:v][2:a]"));

    // Проверяем маппинг
    assert!(args.contains(&"-map".to_string()));
    assert!(args.contains(&"[outv]".to_string()));
    assert!(args.contains(&"[outa]".to_string()));
  }
}

#[cfg(test)]
mod filter_preview_tests {
  use super::*;

  #[tokio::test]
  async fn test_build_filter_preview_single_frame() {
    let builder = create_test_builder();

    let cmd = builder
      .build_filter_preview_command(
        Path::new("input.mp4"),
        Path::new("frame.jpg"),
        "hue=s=0,contrast=1.2",
        Some(30.5),
      )
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем seek
    assert_eq!(find_arg_value(&args, "-ss"), Some("30.5".to_string()));

    // Проверяем фильтр
    assert_eq!(
      find_arg_value(&args, "-vf"),
      Some("hue=s=0,contrast=1.2".to_string())
    );

    // Проверяем что генерируется один кадр
    assert!(args.contains(&"-vframes".to_string()));
    assert!(args.contains(&"1".to_string()));
  }

  #[tokio::test]
  async fn test_build_filter_preview_video() {
    let builder = create_test_builder();

    let cmd = builder
      .build_filter_preview_command(
        Path::new("input.mp4"),
        Path::new("preview.mp4"),
        "scale=640:360,fps=15",
        None,
      )
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем что нет seek
    assert!(!args.contains(&"-ss".to_string()));

    // Проверяем длительность для видео превью
    assert!(args.contains(&"-t".to_string()));
    assert!(args.contains(&"3".to_string()));
  }
}

#[cfg(test)]
mod probe_tests {
  use super::*;

  #[tokio::test]
  async fn test_build_probe_command() {
    let builder = create_test_builder();

    let cmd = builder
      .build_probe_command(Path::new("video.mp4"))
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем что используется ffprobe
    let program = cmd.as_std().get_program().to_string_lossy();
    assert!(program.contains("ffprobe"));

    // Проверяем аргументы
    assert!(args.contains(&"-v".to_string()));
    assert!(args.contains(&"quiet".to_string()));
    assert!(args.contains(&"-print_format".to_string()));
    assert!(args.contains(&"json".to_string()));
    assert!(args.contains(&"-show_format".to_string()));
    assert!(args.contains(&"-show_streams".to_string()));
    assert!(args.contains(&"video.mp4".to_string()));
  }
}

#[cfg(test)]
mod subtitle_preview_tests {
  use super::*;

  #[tokio::test]
  async fn test_build_subtitle_preview_command() {
    let builder = create_test_builder();

    let cmd = builder
      .build_subtitle_preview_command(
        Path::new("video.mp4"),
        Path::new("subtitles.srt"),
        Path::new("preview.jpg"),
        45.0,
      )
      .await
      .unwrap();

    let args = get_command_args(&cmd);

    // Проверяем seek
    assert_eq!(find_arg_value(&args, "-ss"), Some("45".to_string()));

    // Проверяем фильтр субтитров
    let vf = find_arg_value(&args, "-vf").unwrap();
    assert!(vf.contains("subtitles="));
    assert!(vf.contains("subtitles.srt"));
    assert!(vf.contains("force_style="));
    assert!(vf.contains("Fontsize=24"));

    // Проверяем генерацию одного кадра
    assert!(args.contains(&"-vframes".to_string()));
    assert!(args.contains(&"1".to_string()));
  }
}

// Вспомогательные функции для тестов

/// Получить аргументы команды как вектор строк
fn get_command_args(cmd: &Command) -> Vec<String> {
  cmd
    .as_std()
    .get_args()
    .map(|s| s.to_string_lossy().to_string())
    .collect()
}

/// Найти значение аргумента по ключу
fn find_arg_value(args: &[String], key: &str) -> Option<String> {
  let pos = args.iter().position(|arg| arg == key)?;
  args.get(pos + 1).cloned()
}

#[cfg(test)]
mod hwaccel_tests {
  use super::*;

  #[tokio::test]
  async fn test_build_hwaccel_test_command() {
    let builder = create_test_builder();

    let cmd = builder.build_hwaccel_test_command().await.unwrap();
    let args = get_command_args(&cmd);

    assert!(args.contains(&"-hwaccels".to_string()));
  }
}

/// Интеграционный тест для проверки совместимости команд
#[cfg(test)]
mod integration_tests {
  use super::*;

  #[tokio::test]
  async fn test_command_compatibility() {
    let builder = create_test_builder();

    // Проверяем что все команды создаются без ошибок
    let commands = vec![
      builder
        .build_thumbnails_command(Path::new("test.mp4"), "thumb_%d.jpg", 5, Some((320, 180)))
        .await,
      builder
        .build_video_preview_command(
          Path::new("test.mp4"),
          Path::new("preview.mp4"),
          5.0,
          None,
          None,
        )
        .await,
      builder
        .build_waveform_command(
          Path::new("test.mp3"),
          Path::new("wave.png"),
          (1000, 200),
          "#FFFFFF",
        )
        .await,
      builder
        .build_gif_preview_command(
          Path::new("test.mp4"),
          Path::new("test.gif"),
          0.0,
          3.0,
          10,
          None,
        )
        .await,
      builder.build_probe_command(Path::new("test.mp4")).await,
      builder.build_hwaccel_test_command().await,
    ];

    // Все команды должны создаваться успешно
    for (i, cmd_result) in commands.iter().enumerate() {
      assert!(cmd_result.is_ok(), "Command {i} failed to build");
    }
  }
}
