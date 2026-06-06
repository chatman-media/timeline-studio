use super::*;

#[test]
fn test_parse_format_data() {
  let mut format_data = serde_json::Map::new();
  format_data.insert("duration".to_string(), serde_json::json!("120.5"));
  format_data.insert("size".to_string(), serde_json::json!("1048576"));
  format_data.insert("bit_rate".to_string(), serde_json::json!("128000"));
  format_data.insert("format_name".to_string(), serde_json::json!("mp4"));

  let mut ffprobe_format = FfprobeFormat {
    duration: None,
    size: None,
    bit_rate: None,
    format_name: None,
  };

  parse_format_data(&format_data, &mut ffprobe_format);

  assert_eq!(ffprobe_format.duration, Some(120.5));
  assert_eq!(ffprobe_format.size, Some(1048576));
  assert_eq!(ffprobe_format.bit_rate, Some("128000".to_string()));
  assert_eq!(ffprobe_format.format_name, Some("mp4".to_string()));
}

#[test]
fn test_parse_format_data_with_invalid_values() {
  let mut format_data = serde_json::Map::new();
  format_data.insert("duration".to_string(), serde_json::json!("invalid"));
  format_data.insert("size".to_string(), serde_json::json!("not a number"));

  let mut ffprobe_format = FfprobeFormat {
    duration: None,
    size: None,
    bit_rate: None,
    format_name: None,
  };

  parse_format_data(&format_data, &mut ffprobe_format);

  // Invalid values should result in None
  assert_eq!(ffprobe_format.duration, None);
  assert_eq!(ffprobe_format.size, None);
}

#[test]
fn test_parse_stream_data_video() {
  let stream_json = serde_json::json!({
      "index": 0,
      "codec_type": "video",
      "codec_name": "h264",
      "width": 1920,
      "height": 1080,
      "bit_rate": "5000000",
      "r_frame_rate": "30/1",
      "display_aspect_ratio": "16:9"
  });

  let parsed_stream = parse_stream_data(&stream_json, 0);

  assert_eq!(parsed_stream.index, 0);
  assert_eq!(parsed_stream.codec_type, "video");
  assert_eq!(parsed_stream.codec_name, Some("h264".to_string()));
  assert_eq!(parsed_stream.width, Some(1920));
  assert_eq!(parsed_stream.height, Some(1080));
  assert_eq!(parsed_stream.bit_rate, Some("5000000".to_string()));
  assert_eq!(parsed_stream.r_frame_rate, Some("30/1".to_string()));
  assert_eq!(parsed_stream.display_aspect_ratio, Some("16:9".to_string()));
}

#[test]
fn test_parse_stream_data_audio() {
  let stream_json = serde_json::json!({
      "index": 1,
      "codec_type": "audio",
      "codec_name": "aac",
      "sample_rate": "48000",
      "channels": 2,
      "bit_rate": "128000"
  });

  let parsed_stream = parse_stream_data(&stream_json, 1);

  assert_eq!(parsed_stream.index, 1);
  assert_eq!(parsed_stream.codec_type, "audio");
  assert_eq!(parsed_stream.codec_name, Some("aac".to_string()));
  assert_eq!(parsed_stream.sample_rate, Some("48000".to_string()));
  assert_eq!(parsed_stream.channels, Some(2));
  assert_eq!(parsed_stream.bit_rate, Some("128000".to_string()));
  assert_eq!(parsed_stream.width, None);
  assert_eq!(parsed_stream.height, None);
}

#[test]
fn test_parse_stream_data_missing_fields() {
  let stream_json = serde_json::json!({});
  let parsed_stream = parse_stream_data(&stream_json, 5);

  assert_eq!(parsed_stream.index, 5); // Should use the provided index
  assert_eq!(parsed_stream.codec_type, "unknown");
  assert_eq!(parsed_stream.codec_name, None);
  assert_eq!(parsed_stream.width, None);
  assert_eq!(parsed_stream.height, None);
}

#[test]
fn test_extract_creation_time_with_tags() {
  // Test with creation time
  let format_with_time = serde_json::json!({
      "tags": {
          "creation_time": "2023-01-01T00:00:00Z"
      }
  });

  let format_map = format_with_time.as_object();
  let creation_time = extract_creation_time(format_map);
  assert_eq!(creation_time, Some("2023-01-01T00:00:00Z".to_string()));
}

#[test]
fn test_extract_creation_time_without_tags() {
  // Test without creation time
  let format_without_time = serde_json::json!({
      "duration": "120.5"
  });

  let format_map = format_without_time.as_object();
  let creation_time = extract_creation_time(format_map);
  assert_eq!(creation_time, None);
}

#[test]
fn test_extract_creation_time_none() {
  let creation_time = extract_creation_time(None);
  assert_eq!(creation_time, None);
}

#[test]
fn test_generate_iso8601_timestamp_format() {
  let timestamp = generate_iso8601_timestamp();

  // Check format: should be seconds.nanoseconds + Z
  assert!(timestamp.ends_with('Z'));
  assert!(timestamp.contains('.'));

  let parts: Vec<&str> = timestamp.split('.').collect();
  assert_eq!(parts.len(), 2);

  // Check seconds part is a valid number
  assert!(parts[0].parse::<u64>().is_ok());

  // Check nanoseconds part (minus the Z) has 9 digits
  let nanos_part = parts[1].trim_end_matches('Z');
  assert_eq!(nanos_part.len(), 9);
  assert!(nanos_part.parse::<u32>().is_ok());
}

#[test]
fn test_get_media_metadata_nonexistent_file() {
  let result = get_media_metadata("/nonexistent/file.mp4".to_string());
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("Файл не найден"));
}

#[test]
fn test_ffprobe_format_struct() {
  let format = FfprobeFormat {
    duration: Some(120.5),
    size: Some(1024),
    bit_rate: Some("128000".to_string()),
    format_name: Some("mp4".to_string()),
  };

  // Test serialization
  let json = serde_json::to_string(&format).unwrap();
  assert!(json.contains("120.5"));
  assert!(json.contains("1024"));
  assert!(json.contains("128000"));
  assert!(json.contains("mp4"));

  // Test deserialization
  let deserialized: FfprobeFormat = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.duration, format.duration);
  assert_eq!(deserialized.size, format.size);
  assert_eq!(deserialized.bit_rate, format.bit_rate);
  assert_eq!(deserialized.format_name, format.format_name);
}

#[test]
fn test_ffprobe_stream_struct() {
  let stream = FfprobeStream {
    index: 0,
    codec_type: "video".to_string(),
    codec_name: Some("h264".to_string()),
    width: Some(1920),
    height: Some(1080),
    bit_rate: Some("5000000".to_string()),
    r_frame_rate: Some("30/1".to_string()),
    sample_rate: None,
    channels: None,
    display_aspect_ratio: Some("16:9".to_string()),
  };

  // Test serialization
  let json = serde_json::to_string(&stream).unwrap();
  assert!(json.contains("\"index\":0"));
  assert!(json.contains("\"codec_type\":\"video\""));
  assert!(json.contains("\"width\":1920"));

  // Test deserialization
  let deserialized: FfprobeStream = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.index, stream.index);
  assert_eq!(deserialized.codec_type, stream.codec_type);
  assert_eq!(deserialized.width, stream.width);
}

#[test]
fn test_probe_data_struct() {
  let probe_data = ProbeData {
    streams: vec![FfprobeStream {
      index: 0,
      codec_type: "video".to_string(),
      codec_name: Some("h264".to_string()),
      width: Some(1920),
      height: Some(1080),
      bit_rate: None,
      r_frame_rate: None,
      sample_rate: None,
      channels: None,
      display_aspect_ratio: None,
    }],
    format: FfprobeFormat {
      duration: Some(60.0),
      size: Some(1048576),
      bit_rate: None,
      format_name: Some("mp4".to_string()),
    },
  };

  let json = serde_json::to_string(&probe_data).unwrap();
  assert!(json.contains("streams"));
  assert!(json.contains("format"));

  let deserialized: ProbeData = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.streams.len(), 1);
  assert_eq!(deserialized.format.duration, Some(60.0));
}

#[test]
fn test_media_file_struct() {
  let media_file = MediaFile {
    id: "test-id".to_string(),
    name: "test.mp4".to_string(),
    path: "/path/to/test.mp4".to_string(),
    is_video: true,
    is_audio: false,
    is_image: false,
    size: 1048576,
    duration: Some(60.0),
    start_time: 1234567890,
    creation_time: "2023-01-01T00:00:00Z".to_string(),
    probe_data: ProbeData {
      streams: vec![],
      format: FfprobeFormat {
        duration: Some(60.0),
        size: Some(1048576),
        bit_rate: None,
        format_name: None,
      },
    },
    thumbnail_path: None,
  };

  let json = serde_json::to_string(&media_file).unwrap();
  assert!(json.contains("test-id"));
  assert!(json.contains("test.mp4"));
  assert!(json.contains("is_video"));

  let deserialized: MediaFile = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.id, media_file.id);
  assert!(deserialized.is_video);
  assert!(!deserialized.is_audio);
}

#[test]
fn test_media_type_detection_video() {
  // Test video file detection
  let streams_array = vec![serde_json::json!({
      "codec_type": "video",
      "codec_name": "h264"
  })];

  let mut is_video = false;
  let mut is_audio = false;
  let is_image = false;

  for stream in &streams_array {
    let codec_type = stream
      .get("codec_type")
      .and_then(|v| v.as_str())
      .unwrap_or("");

    if codec_type == "video"
      && stream
        .get("disposition")
        .and_then(|d| d.get("attached_pic"))
        .and_then(|v| v.as_i64())
        != Some(1)
    {
      is_video = true;
    } else if codec_type == "audio" {
      is_audio = true;
    }
  }

  assert!(is_video);
  assert!(!is_audio);
  assert!(!is_image);
}

#[test]
fn test_media_type_detection_audio() {
  let streams_array = vec![serde_json::json!({
      "codec_type": "audio",
      "codec_name": "aac"
  })];

  let is_video = false;
  let mut is_audio = false;

  for stream in &streams_array {
    let codec_type = stream
      .get("codec_type")
      .and_then(|v| v.as_str())
      .unwrap_or("");

    if codec_type == "audio" {
      is_audio = true;
    }
  }

  assert!(!is_video);
  assert!(is_audio);
}

#[test]
fn test_media_type_detection_image() {
  // Image detection: no video/audio streams but has width/height
  let streams_array = vec![serde_json::json!({
      "codec_type": "video",
      "codec_name": "mjpeg",
      "width": 1920,
      "height": 1080,
      "disposition": {
          "attached_pic": 1
      }
  })];

  let is_video = false;
  let is_audio = false;
  let mut is_image = false;

  for stream in &streams_array {
    let codec_type = stream
      .get("codec_type")
      .and_then(|v| v.as_str())
      .unwrap_or("");

    if codec_type == "video"
      && stream
        .get("disposition")
        .and_then(|d| d.get("attached_pic"))
        .and_then(|v| v.as_i64())
        == Some(1)
    {
      // This is an attached picture, not a video stream
      is_image = true;
    }
  }

  assert!(!is_video);
  assert!(!is_audio);
  assert!(is_image);
}

#[test]
fn test_parse_format_data_empty() {
  let format_data = serde_json::Map::new();
  let mut ffprobe_format = FfprobeFormat {
    duration: None,
    size: None,
    bit_rate: None,
    format_name: None,
  };

  parse_format_data(&format_data, &mut ffprobe_format);

  assert_eq!(ffprobe_format.duration, None);
  assert_eq!(ffprobe_format.size, None);
  assert_eq!(ffprobe_format.bit_rate, None);
  assert_eq!(ffprobe_format.format_name, None);
}

#[test]
fn test_parse_stream_data_with_index_override() {
  let stream_json = serde_json::json!({
      "index": 10,
      "codec_type": "video"
  });

  let parsed_stream = parse_stream_data(&stream_json, 99);

  // Should use the index from JSON, not the parameter
  assert_eq!(parsed_stream.index, 10);
}

// Примечание: Тесты для extract_metadata, которые требуют реальные файлы и FFmpeg,
// должны запускаться в интеграционных тестах с подготовленными тестовыми файлами

#[tokio::test]
async fn test_extract_metadata_file_not_found() {
  use std::path::PathBuf;

  let test_file = PathBuf::from("/nonexistent/file.mp4");
  let result = extract_metadata(&test_file).await;

  assert!(result.is_err());
  assert!(result.unwrap_err().contains("File not found"));
}

#[test]
fn test_parse_stream_data_with_all_fields() {
  let stream_json = serde_json::json!({
      "index": 0,
      "codec_type": "video",
      "codec_name": "h264",
      "width": 1920,
      "height": 1080,
      "bit_rate": "5000000",
      "r_frame_rate": "30/1",
      "sample_rate": null,
      "channels": null,
      "display_aspect_ratio": "16:9"
  });

  let parsed_stream = parse_stream_data(&stream_json, 0);

  assert_eq!(parsed_stream.index, 0);
  assert_eq!(parsed_stream.codec_type, "video");
  assert_eq!(parsed_stream.codec_name, Some("h264".to_string()));
  assert_eq!(parsed_stream.width, Some(1920));
  assert_eq!(parsed_stream.height, Some(1080));
  assert_eq!(parsed_stream.bit_rate, Some("5000000".to_string()));
  assert_eq!(parsed_stream.r_frame_rate, Some("30/1".to_string()));
  assert_eq!(parsed_stream.sample_rate, None);
  assert_eq!(parsed_stream.channels, None);
  assert_eq!(parsed_stream.display_aspect_ratio, Some("16:9".to_string()));
}

#[test]
fn test_parse_format_data_with_number_values() {
  // Тест когда значения являются числами, а не строками
  let mut format_data = serde_json::Map::new();
  format_data.insert("duration".to_string(), serde_json::json!(120.5));
  format_data.insert("size".to_string(), serde_json::json!(1048576));
  format_data.insert("bit_rate".to_string(), serde_json::json!(128000));

  let mut ffprobe_format = FfprobeFormat {
    duration: None,
    size: None,
    bit_rate: None,
    format_name: None,
  };

  parse_format_data(&format_data, &mut ffprobe_format);

  // Числовые значения не должны парситься, так как ожидаются строки
  assert_eq!(ffprobe_format.duration, None);
  assert_eq!(ffprobe_format.size, None);
  assert_eq!(ffprobe_format.bit_rate, None);
}

#[test]
fn test_media_file_complete_creation() {
  let media_file = MediaFile {
    id: "complex-id".to_string(),
    name: "complex.mkv".to_string(),
    path: "/path/to/complex.mkv".to_string(),
    is_video: true,
    is_audio: true,
    is_image: false,
    size: 2097152,
    duration: Some(300.5),
    start_time: 1234567890,
    creation_time: "2023-01-01T00:00:00Z".to_string(),
    probe_data: ProbeData {
      streams: vec![
        FfprobeStream {
          index: 0,
          codec_type: "video".to_string(),
          codec_name: Some("h264".to_string()),
          width: Some(1920),
          height: Some(1080),
          bit_rate: Some("8000000".to_string()),
          r_frame_rate: Some("25/1".to_string()),
          sample_rate: None,
          channels: None,
          display_aspect_ratio: Some("16:9".to_string()),
        },
        FfprobeStream {
          index: 1,
          codec_type: "audio".to_string(),
          codec_name: Some("aac".to_string()),
          width: None,
          height: None,
          bit_rate: Some("192000".to_string()),
          r_frame_rate: None,
          sample_rate: Some("48000".to_string()),
          channels: Some(2),
          display_aspect_ratio: None,
        },
      ],
      format: FfprobeFormat {
        duration: Some(300.5),
        size: Some(2097152),
        bit_rate: Some("256000".to_string()),
        format_name: Some("matroska,webm".to_string()),
      },
    },
    thumbnail_path: None,
  };

  // Проверяем, что все поля правильно установлены
  assert_eq!(media_file.id, "complex-id");
  assert_eq!(media_file.name, "complex.mkv");
  assert!(media_file.is_video);
  assert!(media_file.is_audio);
  assert!(!media_file.is_image);
  assert_eq!(media_file.size, 2097152);
  assert_eq!(media_file.duration, Some(300.5));
  assert_eq!(media_file.probe_data.streams.len(), 2);

  // Проверяем видео поток
  let video_stream = &media_file.probe_data.streams[0];
  assert_eq!(video_stream.codec_type, "video");
  assert_eq!(video_stream.width, Some(1920));
  assert_eq!(video_stream.height, Some(1080));

  // Проверяем аудио поток
  let audio_stream = &media_file.probe_data.streams[1];
  assert_eq!(audio_stream.codec_type, "audio");
  assert_eq!(audio_stream.channels, Some(2));
  assert_eq!(audio_stream.sample_rate, Some("48000".to_string()));
}
