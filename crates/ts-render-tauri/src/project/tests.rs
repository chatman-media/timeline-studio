//! Тесты для модуля project

#[cfg(test)]
mod project_tests {
  use super::super::*;
  use ts_render::video_compiler::core::schema::{
    AspectRatio, Clip, ClipSource, ProjectMetadata, ProjectSchema, Subtitle, Timeline, Track,
    TrackType,
  };
  use std::collections::HashMap;

  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test Project".to_string(),
        description: Some("Test description".to_string()),
        author: Some("Test Author".to_string()),
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
      },
      timeline: Timeline {
        duration: 30.0,
        fps: 30,
        resolution: (1920, 1080),
        sample_rate: 48000,
        aspect_ratio: AspectRatio::Ratio16x9,
      },
      tracks: vec![
        Track::new(TrackType::Video, "Video Track".to_string()),
        Track::new(TrackType::Audio, "Audio Track".to_string()),
      ],
      effects: vec![],
      filters: vec![],
      transitions: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![
        Subtitle::new("First subtitle".to_string(), 0.0, 5.0),
        Subtitle::new("Second subtitle".to_string(), 5.0, 10.0),
      ],
      settings: ts_render::video_compiler::core::schema::export::ProjectSettings::default(),
    }
  }

  #[test]
  fn test_create_validation_result_valid() {
    let result = business_logic::create_validation_result(true, None);
    assert!(result.is_valid);
    assert!(result.errors.is_empty());
    assert!(!result.info.is_empty());
  }

  #[test]
  fn test_create_validation_result_invalid() {
    let error_msg = "Test error".to_string();
    let result = business_logic::create_validation_result(false, Some(error_msg.clone()));
    assert!(!result.is_valid);
    assert_eq!(result.errors.len(), 1);
    assert_eq!(result.errors[0], error_msg);
  }

  #[test]
  fn test_optimize_project_tracks() {
    let mut project = create_test_project();

    // Добавляем пустой трек
    project
      .tracks
      .push(Track::new(TrackType::Video, "Empty Track".to_string()));

    // Добавляем клипы не в порядке в первый трек
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video2.mp4"),
      10.0,
      5.0,
    ));
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video1.mp4"),
      5.0,
      5.0,
    ));

    // Добавляем клип во второй трек (чтобы он не был пустым)
    project.tracks[1].clips.push(Clip::new(
      std::path::PathBuf::from("/test/audio1.wav"),
      0.0,
      10.0,
    ));

    business_logic::optimize_project_tracks(&mut project);

    // Пустой трек должен быть удален
    assert_eq!(project.tracks.len(), 2); // Только треки с клипами

    // Клипы должны быть отсортированы
    if !project.tracks[0].clips.is_empty() {
      for i in 1..project.tracks[0].clips.len() {
        assert!(project.tracks[0].clips[i - 1].start_time <= project.tracks[0].clips[i].start_time);
      }
    }
  }

  #[test]
  fn test_optimize_export_settings() {
    let mut project = create_test_project();
    project.settings.export.video_bitrate = 0;

    business_logic::optimize_export_settings(&mut project);

    assert_eq!(project.settings.export.video_bitrate, 8000);
  }

  #[test]
  fn test_analyze_project_statistics() {
    let mut project = create_test_project();

    // Добавляем клипы
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video1.mp4"),
      0.0,
      5.0,
    ));
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video2.mp4"),
      5.0,
      5.0,
    ));

    let stats = business_logic::analyze_project_statistics(&project);

    assert_eq!(stats.duration, 30.0);
    assert_eq!(stats.tracks, 2);
    assert_eq!(stats.clips, 2);
    assert_eq!(stats.unique_media_files, 2);
    assert_eq!(stats.subtitles, 2);
    assert_eq!(stats.resolution.width, 1920);
    assert_eq!(stats.resolution.height, 1080);
  }

  #[test]
  fn test_extract_media_files() {
    let mut project = create_test_project();

    // Добавляем клипы с файлами
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video1.mp4"),
      0.0,
      5.0,
    ));
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video2.mp4"),
      5.0,
      5.0,
    ));
    project.tracks[1].clips.push(Clip::new(
      std::path::PathBuf::from("/test/audio.wav"),
      0.0,
      10.0,
    ));

    let media_files = business_logic::extract_media_files(&project);

    assert_eq!(media_files.len(), 3);
    assert!(media_files.contains(&"/test/video1.mp4".to_string()));
    assert!(media_files.contains(&"/test/video2.mp4".to_string()));
    assert!(media_files.contains(&"/test/audio.wav".to_string()));
  }

  #[test]
  fn test_check_media_availability() {
    let media_files = vec!["/nonexistent/file.mp4".to_string()];
    let availability = business_logic::check_media_availability(media_files);

    assert_eq!(availability.len(), 1);
    assert!(!availability["/nonexistent/file.mp4"]);
  }

  #[test]
  fn test_update_media_paths() {
    let mut project = create_test_project();

    // Добавляем клип
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/old/path/video.mp4"),
      0.0,
      5.0,
    ));

    let mut path_mapping = HashMap::new();
    path_mapping.insert(
      "/old/path/video.mp4".to_string(),
      "/new/path/video.mp4".to_string(),
    );

    business_logic::update_media_paths(&mut project, &path_mapping);

    if let ClipSource::File(path) = &project.tracks[0].clips[0].source {
      assert_eq!(path, "/new/path/video.mp4");
    }
  }

  #[test]
  fn test_add_and_sort_subtitles() {
    let mut project = create_test_project();
    let initial_count = project.subtitles.len();

    let new_subtitles = vec![
      Subtitle::new("Third subtitle".to_string(), 15.0, 20.0),
      Subtitle::new("Fourth subtitle".to_string(), 10.0, 15.0), // Не в порядке
    ];

    business_logic::add_and_sort_subtitles(&mut project, new_subtitles);

    assert_eq!(project.subtitles.len(), initial_count + 2);

    // Проверяем, что субтитры отсортированы по времени
    let subtitles = &project.subtitles;
    for i in 1..subtitles.len() {
      assert!(subtitles[i - 1].start_time <= subtitles[i].start_time);
    }
  }

  #[test]
  fn test_format_time_srt() {
    assert_eq!(business_logic::format_time_srt(0.0), "00:00:00,000");
    assert_eq!(business_logic::format_time_srt(3661.5), "01:01:01,500");
    assert_eq!(business_logic::format_time_srt(90.123), "00:01:30,123");
  }

  #[test]
  fn test_format_time_vtt() {
    assert_eq!(business_logic::format_time_vtt(0.0), "00:00:00.000");
    assert_eq!(business_logic::format_time_vtt(3661.5), "01:01:01.500");
    assert_eq!(business_logic::format_time_vtt(90.123), "00:01:30.123");
  }

  #[test]
  fn test_export_subtitles_srt() {
    let subtitles = vec![
      Subtitle::new("First subtitle".to_string(), 0.0, 5.0),
      Subtitle::new("Second subtitle".to_string(), 5.0, 10.0),
    ];

    let srt_content = business_logic::export_subtitles(&subtitles, types::SubtitleFormat::Srt);

    assert!(srt_content.contains("1\n"));
    assert!(srt_content.contains("2\n"));
    assert!(srt_content.contains("First subtitle"));
    assert!(srt_content.contains("Second subtitle"));
    assert!(srt_content.contains("00:00:00,000 --> 00:00:05,000"));
  }

  #[test]
  fn test_export_subtitles_vtt() {
    let subtitles = vec![
      Subtitle::new("First subtitle".to_string(), 0.0, 5.0),
      Subtitle::new("Second subtitle".to_string(), 5.0, 10.0),
    ];

    let vtt_content = business_logic::export_subtitles(&subtitles, types::SubtitleFormat::Vtt);

    assert!(vtt_content.starts_with("WEBVTT"));
    assert!(vtt_content.contains("First subtitle"));
    assert!(vtt_content.contains("00:00:00.000 --> 00:00:05.000"));
  }

  #[test]
  fn test_create_project_backup() {
    let project = create_test_project();
    let result = business_logic::create_project_backup(&project);

    assert!(result.is_ok());
    let json = result.unwrap();
    assert!(json.contains("Test Project"));
    assert!(json.contains("1920"));
  }

  #[test]
  fn test_merge_projects_with_offset() {
    let mut base_project = create_test_project();
    let mut append_project = create_test_project();

    // Изменяем второй проект
    append_project.timeline.duration = 20.0;
    append_project.subtitles.clear();
    append_project
      .subtitles
      .push(Subtitle::new("Merged subtitle".to_string(), 0.0, 5.0));

    let time_offset = 15.0;
    business_logic::merge_projects_with_offset(&mut base_project, append_project, time_offset);

    // Общая длительность должна быть обновлена
    assert_eq!(base_project.timeline.duration, 35.0); // max(30.0, 20.0 + 15.0)

    // Субтитры из второго проекта должны быть смещены
    let merged_subtitle = base_project
      .subtitles
      .iter()
      .find(|s| s.text == "Merged subtitle")
      .unwrap();
    assert_eq!(merged_subtitle.start_time, 15.0);
    assert_eq!(merged_subtitle.end_time, 20.0);
  }

  #[test]
  fn test_split_project_at_points() {
    let mut project = create_test_project();

    // Добавляем клип
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video.mp4"),
      0.0,
      25.0,
    ));

    let split_points = vec![10.0, 20.0];
    let projects = business_logic::split_project_at_points(&project, &split_points);

    assert_eq!(projects.len(), 3); // Split на 3 части

    // Проверяем длительности частей
    assert_eq!(projects[0].timeline.duration, 10.0);
    assert_eq!(projects[1].timeline.duration, 10.0);
    assert_eq!(projects[2].timeline.duration, 10.0);
  }

  #[test]
  fn test_add_clip_to_track() {
    let mut track = Track::new(TrackType::Video, "Test Track".to_string());
    let clip = Clip::new(std::path::PathBuf::from("/test/video.mp4"), 0.0, 5.0);

    business_logic::add_clip_to_track(&mut track, clip);

    assert_eq!(track.clips.len(), 1);
  }

  #[test]
  fn test_get_clip_timeline_duration() {
    let clip = Clip::new(std::path::PathBuf::from("/test/video.mp4"), 0.0, 5.0);
    let duration = business_logic::get_clip_timeline_duration(&clip);
    assert_eq!(duration, 5.0);
  }

  #[test]
  fn test_check_clip_contains_time() {
    let clip = Clip::new(std::path::PathBuf::from("/test/video.mp4"), 0.0, 5.0);
    assert!(business_logic::check_clip_contains_time(&clip, 2.5));
    assert!(!business_logic::check_clip_contains_time(&clip, 10.0));
  }

  #[test]
  fn test_validate_subtitle_and_get_result() {
    let subtitle = Subtitle::new("Test subtitle".to_string(), 0.0, 5.0);
    let result = business_logic::validate_subtitle_and_get_result(&subtitle);

    assert!(result.valid);
    assert_eq!(result.duration, 5.0);
    assert!(result.error.is_none());
  }

  #[test]
  fn test_touch_project() {
    let mut project = create_test_project();
    let original_modified = project.metadata.modified_at;

    // Добавляем небольшую задержку
    std::thread::sleep(std::time::Duration::from_millis(10));

    business_logic::touch_project(&mut project);

    assert!(project.metadata.modified_at > original_modified);
  }

  #[test]
  fn test_create_backup_info() {
    let backup_path = "/tmp/backup.json".to_string();
    let project_name = "Test Project".to_string();
    let file_size = 1024;

    let info =
      business_logic::create_backup_info(backup_path.clone(), project_name.clone(), file_size);

    assert_eq!(info.backup_path, backup_path);
    assert_eq!(info.project_name, project_name);
    assert_eq!(info.file_size, file_size);
    assert!(info.created_at <= chrono::Utc::now());
  }

  #[test]
  fn test_subtitle_format_conversion() {
    // Test from_string
    assert!(matches!(
      types::SubtitleFormat::from_string("srt"),
      Some(types::SubtitleFormat::Srt)
    ));
    assert!(matches!(
      types::SubtitleFormat::from_string("vtt"),
      Some(types::SubtitleFormat::Vtt)
    ));
    assert!(types::SubtitleFormat::from_string("invalid").is_none());

    // Test to_string
    assert_eq!(types::SubtitleFormat::Srt.to_string(), "srt");
    assert_eq!(types::SubtitleFormat::Vtt.to_string(), "vtt");
  }

  #[test]
  fn test_clip_info_type_conversion() {
    assert!(matches!(
      types::ClipInfoType::from_string("timeline_duration"),
      Some(types::ClipInfoType::TimelineDuration)
    ));
    assert!(matches!(
      types::ClipInfoType::from_string("contains_time"),
      Some(types::ClipInfoType::ContainsTime)
    ));
    assert!(types::ClipInfoType::from_string("invalid").is_none());
  }
}
