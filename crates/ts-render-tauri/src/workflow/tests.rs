//! Тесты для модуля workflow

#[cfg(test)]
mod workflow_tests {
  use super::super::*;
  use std::fs;
  use tempfile::TempDir;

  #[test]
  fn test_workflow_execution_result_creation() {
    let result = types::WorkflowExecutionResult {
      success: true,
      workflow_id: "test-workflow-123".to_string(),
      message: "Workflow completed successfully".to_string(),
      outputs: vec![],
      execution_time: 10.5,
      steps_completed: 5,
      steps_failed: 0,
    };

    assert!(result.success);
    assert_eq!(result.workflow_id, "test-workflow-123");
    assert_eq!(result.execution_time, 10.5);
    assert_eq!(result.steps_completed, 5);
    assert_eq!(result.steps_failed, 0);
  }

  #[test]
  fn test_workflow_output_metadata() {
    let metadata = types::WorkflowOutputMetadata {
      duration: 60.0,
      file_size: 1024 * 1024 * 100, // 100MB
      width: 1920,
      height: 1080,
      quality_score: 85,
    };

    assert_eq!(metadata.duration, 60.0);
    assert_eq!(metadata.file_size, 104857600);
    assert_eq!(metadata.width, 1920);
    assert_eq!(metadata.height, 1080);
    assert_eq!(metadata.quality_score, 85);
  }

  #[test]
  fn test_workflow_output_creation() {
    let output = types::WorkflowOutput {
      output_type: "video/mp4".to_string(),
      file_path: "/tmp/output.mp4".to_string(),
      metadata: types::WorkflowOutputMetadata {
        duration: 30.0,
        file_size: 50 * 1024 * 1024,
        width: 1280,
        height: 720,
        quality_score: 75,
      },
    };

    assert_eq!(output.output_type, "video/mp4");
    assert_eq!(output.file_path, "/tmp/output.mp4");
    assert_eq!(output.metadata.width, 1280);
    assert_eq!(output.metadata.height, 720);
  }

  #[test]
  fn test_create_directory_logic() {
    let temp_dir = TempDir::new().unwrap();
    let test_path = temp_dir.path().join("workflow_test_dir");

    let result = business_logic::create_directory_logic(&test_path.to_string_lossy());
    assert!(result.is_ok());
    assert!(result.unwrap());
    assert!(test_path.exists());
  }

  #[test]
  fn test_create_directory_nested() {
    let temp_dir = TempDir::new().unwrap();
    let nested_path = temp_dir.path().join("level1/level2/level3");

    let result = business_logic::create_directory_logic(&nested_path.to_string_lossy());
    assert!(result.is_ok());
    assert!(nested_path.exists());
  }

  #[test]
  fn test_create_timeline_project_logic() {
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("project.json");

    let project_data = r#"{
            "name": "Test Project",
            "version": "1.0.0",
            "timeline": {
                "duration": 60.0,
                "tracks": []
            }
        }"#;

    let result =
      business_logic::create_timeline_project_logic(project_data, &output_path.to_string_lossy());

    assert!(result.is_ok());
    assert!(output_path.exists());

    // Проверяем содержимое файла
    let content = fs::read_to_string(&output_path).unwrap();
    assert!(content.contains("Test Project"));
    assert!(content.contains("\"duration\": 60.0"));
  }

  #[test]
  fn test_create_timeline_project_invalid_json() {
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("invalid.json");

    let invalid_data = "{ invalid json }";

    let result =
      business_logic::create_timeline_project_logic(invalid_data, &output_path.to_string_lossy());

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Невалидные данные проекта"));
  }

  #[test]
  fn test_compile_workflow_video_logic() {
    let temp_dir = TempDir::new().unwrap();
    let project_file = temp_dir.path().join("project.json");
    let output_file = temp_dir.path().join("output.mp4");

    // Создаем тестовый файл проекта
    fs::write(&project_file, "test project content").unwrap();

    let settings = r#"{
            "resolution": {
                "width": 1920,
                "height": 1080
            },
            "framerate": 30,
            "quality": "high"
        }"#;

    let result = business_logic::compile_workflow_video_logic(
      &project_file.to_string_lossy(),
      &output_file.to_string_lossy(),
      settings,
    );

    assert!(result.is_ok());

    let json = result.unwrap();
    assert_eq!(json["success"], true);
    assert_eq!(json["resolution"]["width"], 1920);
    assert_eq!(json["resolution"]["height"], 1080);
    assert_eq!(json["framerate"], 30);
    assert_eq!(json["quality"], "high");
  }

  #[test]
  fn test_compile_workflow_video_missing_project() {
    let temp_dir = TempDir::new().unwrap();
    let missing_file = temp_dir.path().join("missing.json");
    let output_file = temp_dir.path().join("output.mp4");

    let settings = "{}";

    let result = business_logic::compile_workflow_video_logic(
      &missing_file.to_string_lossy(),
      &output_file.to_string_lossy(),
      settings,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Файл проекта не найден"));
  }

  #[test]
  fn test_compile_workflow_video_invalid_settings() {
    let temp_dir = TempDir::new().unwrap();
    let project_file = temp_dir.path().join("project.json");
    let output_file = temp_dir.path().join("output.mp4");

    fs::write(&project_file, "test content").unwrap();

    let invalid_settings = "{ invalid }";

    let result = business_logic::compile_workflow_video_logic(
      &project_file.to_string_lossy(),
      &output_file.to_string_lossy(),
      invalid_settings,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Ошибка парсинга настроек"));
  }

  #[test]
  fn test_analyze_workflow_video_quality_missing_file() {
    let result =
      business_logic::analyze_workflow_video_quality_logic("/non/existent/video.mp4", "basic");

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Видеофайл не найден"));
  }

  #[test]
  fn test_cleanup_workflow_temp_files_logic() {
    let temp_dir = TempDir::new().unwrap();
    let workflow_dir = temp_dir.path().join("workflow_temp");

    // Создаем директорию с файлами
    fs::create_dir_all(&workflow_dir).unwrap();
    fs::write(workflow_dir.join("temp1.txt"), "temp content 1").unwrap();
    fs::write(workflow_dir.join("temp2.txt"), "temp content 2").unwrap();

    assert!(workflow_dir.exists());

    let result = business_logic::cleanup_workflow_temp_files_logic(&workflow_dir.to_string_lossy());

    assert!(result.is_ok());
    assert!(result.unwrap());
    assert!(!workflow_dir.exists());
  }

  #[test]
  fn test_cleanup_workflow_temp_files_non_existent() {
    let result = business_logic::cleanup_workflow_temp_files_logic("/non/existent/directory");

    // Должно успешно завершиться даже если директории нет
    assert!(result.is_ok());
    assert!(result.unwrap());
  }

  #[test]
  fn test_calculate_quality_score() {
    // 4K с высоким битрейтом
    let score_4k_high = business_logic::calculate_quality_score(3840, 2160, 10_000_000);
    assert_eq!(score_4k_high, 100); // 40 + 40 + 20

    // 1080p с высоким битрейтом
    let score_1080p_high = business_logic::calculate_quality_score(1920, 1080, 5_000_000);
    assert_eq!(score_1080p_high, 100); // 40 + 40 + 20

    // 720p со средним битрейтом
    let score_720p_medium = business_logic::calculate_quality_score(1280, 720, 2_500_000);
    assert_eq!(score_720p_medium, 80); // 30 + 30 + 20

    // 480p с низким битрейтом
    let score_480p_low = business_logic::calculate_quality_score(854, 480, 1_000_000);
    assert_eq!(score_480p_low, 60); // 20 + 20 + 20

    // Низкое разрешение с очень низким битрейтом
    let score_low = business_logic::calculate_quality_score(640, 360, 500_000);
    assert_eq!(score_low, 40); // 10 + 10 + 20
  }

  #[test]
  fn test_quality_score_edge_cases() {
    // Нулевые значения
    let score_zero = business_logic::calculate_quality_score(0, 0, 0);
    assert_eq!(score_zero, 40); // 10 + 10 + 20

    // Очень высокий битрейт
    let score_ultra_high = business_logic::calculate_quality_score(1920, 1080, 50_000_000);
    assert_eq!(score_ultra_high, 100); // Максимум 100

    // Нестандартное разрешение
    let score_custom = business_logic::calculate_quality_score(1440, 900, 3_000_000);
    assert_eq!(score_custom, 80); // 30 (больше 720p, но меньше 1080p) + 30 + 20
  }

  #[test]
  fn test_workflow_structures_serialization() {
    let workflow_result = types::WorkflowExecutionResult {
      success: true,
      workflow_id: "wf-123".to_string(),
      message: "Test message".to_string(),
      outputs: vec![types::WorkflowOutput {
        output_type: "video/mp4".to_string(),
        file_path: "/tmp/test.mp4".to_string(),
        metadata: types::WorkflowOutputMetadata {
          duration: 30.0,
          file_size: 1024,
          width: 1920,
          height: 1080,
          quality_score: 90,
        },
      }],
      execution_time: 5.5,
      steps_completed: 3,
      steps_failed: 0,
    };

    // Сериализация
    let json = serde_json::to_string(&workflow_result).unwrap();
    assert!(json.contains("wf-123"));
    assert!(json.contains("video/mp4"));

    // Десериализация
    let deserialized: types::WorkflowExecutionResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.workflow_id, "wf-123");
    assert_eq!(deserialized.outputs.len(), 1);
    assert_eq!(deserialized.outputs[0].metadata.quality_score, 90);
  }
}
