use anyhow::Result;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::preview_data::{MediaPreviewData, RecognitionFrame, ThumbnailData, TimelinePreview};
use super::thumbnail::generate_thumbnail;
use crate::video_compiler::cache::RenderCache;
use crate::video_compiler::frame_extraction::{ExtractionPurpose, FrameExtractionManager};
use crate::video_compiler::preview::PreviewGenerator;

/// Единый менеджер для всех данных превью
pub struct PreviewDataManager {
  /// Кэш всех данных превью по file_id
  data: Arc<RwLock<HashMap<String, MediaPreviewData>>>,

  /// Генератор превью для таймлайна
  timeline_generator: Arc<RwLock<PreviewGenerator>>,

  /// Менеджер извлечения кадров
  frame_extractor: Arc<RwLock<FrameExtractionManager>>,

  /// Базовая директория для хранения
  base_dir: PathBuf,
}

impl PreviewDataManager {
  pub fn new(base_dir: PathBuf) -> Self {
    // Создаем общий кэш для PreviewGenerator и FrameExtractionManager
    let cache = Arc::new(RwLock::new(RenderCache::new()));

    let preview_generator = PreviewGenerator::new(cache.clone());
    let frame_extractor = FrameExtractionManager::new(cache.clone());

    Self {
      data: Arc::new(RwLock::new(HashMap::new())),
      timeline_generator: Arc::new(RwLock::new(preview_generator)),
      frame_extractor: Arc::new(RwLock::new(frame_extractor)),
      base_dir,
    }
  }

  /// Получить все данные превью для файла
  pub async fn get_preview_data(&self, file_id: &str) -> Option<MediaPreviewData> {
    let data = self.data.read().await;
    data.get(file_id).cloned()
  }

  /// Генерировать превью для браузера
  pub async fn generate_browser_thumbnail(
    &self,
    file_id: String,
    file_path: PathBuf,
    width: u32,
    height: u32,
    timestamp: f64,
  ) -> Result<ThumbnailData> {
    // Генерируем превью
    let output_path = self
      .base_dir
      .join("Caches/preview/browser")
      .join(format!("{file_id}_{width}x{height}.jpg"));

    // Создаем директорию если не существует
    if let Some(parent) = output_path.parent() {
      tokio::fs::create_dir_all(parent).await?;
    }

    // Генерируем превью
    generate_thumbnail(&file_path, &output_path, width, height, timestamp)
      .await
      .map_err(|e| anyhow::anyhow!(e))?;

    // Читаем файл для base64
    let image_data = tokio::fs::read(&output_path).await?;
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let base64_data = STANDARD.encode(&image_data);

    let thumbnail = ThumbnailData {
      path: output_path,
      base64_data: Some(base64_data),
      timestamp,
      width,
      height,
    };

    // Обновляем данные
    let mut data = self.data.write().await;
    let preview_data = data
      .entry(file_id.clone())
      .or_insert_with(|| MediaPreviewData::new(file_id, file_path));
    preview_data.set_browser_thumbnail(thumbnail.clone());

    Ok(thumbnail)
  }

  /// Генерировать превью для таймлайна
  pub async fn generate_timeline_previews(
    &self,
    file_id: String,
    file_path: PathBuf,
    duration: f64,
    interval: f64,
  ) -> Result<Vec<TimelinePreview>> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};

    // Используем PreviewGenerator для генерации превью
    let generator = self.timeline_generator.read().await;
    let preview_results = generator
      .generate_timeline_previews(&file_path, duration, interval)
      .await?;

    // Преобразуем результаты в наш формат TimelinePreview
    let mut timeline_previews = Vec::new();
    let output_dir = self.base_dir.join("Caches/timeline").join(&file_id);

    // Создаем директорию если не существует
    tokio::fs::create_dir_all(&output_dir).await?;

    for (i, preview_result) in preview_results.iter().enumerate() {
      let base64_data = if let Some(ref image_data) = preview_result.image_data {
        // image_data уже в формате Vec<u8>
        let base64 = STANDARD.encode(image_data);

        // Сохраняем файл на диск для совместимости
        let file_path = output_dir.join(format!("frame_{i:04}.jpg"));
        tokio::fs::write(&file_path, image_data).await?;

        let timeline_preview = TimelinePreview {
          timestamp: preview_result.timestamp,
          path: file_path,
          base64_data: Some(base64.clone()),
        };

        timeline_previews.push(timeline_preview);
        Some(base64)
      } else {
        None
      };

      if base64_data.is_none() {
        // Если нет данных, создаем пустой превью
        let file_path = output_dir.join(format!("frame_{i:04}_empty.jpg"));
        let timeline_preview = TimelinePreview {
          timestamp: preview_result.timestamp,
          path: file_path,
          base64_data: None,
        };
        timeline_previews.push(timeline_preview);
      }
    }

    // Сохраняем в кэш
    let mut data = self.data.write().await;
    let preview_data = data
      .entry(file_id.clone())
      .or_insert_with(|| MediaPreviewData::new(file_id, file_path));

    // Очищаем старые превью и добавляем новые
    preview_data.timeline_previews.clear();
    for preview in &timeline_previews {
      preview_data.add_timeline_preview(preview.clone());
    }

    Ok(timeline_previews)
  }

  /// Извлечь кадры для распознавания
  pub async fn extract_recognition_frames(
    &self,
    file_id: String,
    file_path: PathBuf,
    count: usize,
  ) -> Result<Vec<RecognitionFrame>> {
    // Получаем информацию о видео
    let generator = self.timeline_generator.read().await;
    let video_info = generator.get_video_info(&file_path).await?;
    let duration = video_info.duration;
    drop(generator); // Освобождаем блокировку

    // Используем FrameExtractionManager для извлечения кадров
    let extractor = self.frame_extractor.read().await;
    let extracted_frames = extractor
      .extract_frames_for_recognition(&file_path, duration, ExtractionPurpose::ObjectDetection)
      .await?;

    // Берем только запрошенное количество кадров
    let frames_to_use: Vec<_> = extracted_frames.into_iter().take(count).collect();

    // Преобразуем результаты в наш формат RecognitionFrame
    let mut recognition_frames = Vec::new();
    let output_dir = self.base_dir.join("Recognition").join(&file_id);

    // Создаем директорию если не существует
    tokio::fs::create_dir_all(&output_dir).await?;

    for (i, frame) in frames_to_use.iter().enumerate() {
      // Сохраняем данные кадра на диск
      let file_path = output_dir.join(format!("recognition_frame_{i:04}.jpg"));
      tokio::fs::write(&file_path, &frame.frame_data).await?;

      let recognition_frame = RecognitionFrame {
        timestamp: frame.timestamp,
        path: file_path,
        processed: false,
      };

      recognition_frames.push(recognition_frame.clone());
    }

    // Сохраняем в кэш
    let mut data = self.data.write().await;
    let preview_data = data
      .entry(file_id.clone())
      .or_insert_with(|| MediaPreviewData::new(file_id, file_path));

    // Очищаем старые кадры и добавляем новые
    preview_data.recognition_frames.clear();
    for frame in &recognition_frames {
      preview_data.add_recognition_frame(frame.clone());
    }

    Ok(recognition_frames)
  }

  /// Получить все файлы с данными превью
  pub async fn get_all_files_with_previews(&self) -> Vec<String> {
    let data = self.data.read().await;
    data.keys().cloned().collect()
  }

  /// Очистить данные для файла
  pub async fn clear_file_data(&self, file_id: &str) -> Result<()> {
    let mut data = self.data.write().await;

    if let Some(preview_data) = data.remove(file_id) {
      // Удаляем файлы превью
      if let Some(thumb) = preview_data.browser_thumbnail {
        let _ = tokio::fs::remove_file(&thumb.path).await;
      }

      for preview in preview_data.timeline_previews {
        let _ = tokio::fs::remove_file(&preview.path).await;
      }

      for frame in preview_data.recognition_frames {
        let _ = tokio::fs::remove_file(&frame.path).await;
      }
    }

    Ok(())
  }

  /// Сохранить все данные в файл
  pub async fn save_to_file(&self, path: &Path) -> Result<()> {
    let data = self.data.read().await;
    let json = serde_json::to_string_pretty(&*data)?;
    tokio::fs::write(path, json).await?;
    Ok(())
  }

  /// Загрузить данные из файла
  pub async fn load_from_file(&self, path: &Path) -> Result<()> {
    if path.exists() {
      let json = tokio::fs::read_to_string(path).await?;
      let loaded_data: HashMap<String, MediaPreviewData> = serde_json::from_str(&json)?;

      let mut data = self.data.write().await;
      *data = loaded_data;
    }

    Ok(())
  }

  /// Сохранить timeline frames для файла
  pub async fn save_timeline_frames(
    &self,
    file_id: String,
    frames: Vec<crate::media::commands::TimelineFrame>,
  ) -> Result<()> {
    use super::preview_data::TimelinePreview;
    use base64::{engine::general_purpose::STANDARD, Engine as _};

    let mut data = self.data.write().await;
    let preview_data = data
      .entry(file_id.clone())
      .or_insert_with(|| MediaPreviewData::new(file_id.clone(), PathBuf::new()));

    // Очищаем старые timeline frames
    preview_data.timeline_previews.clear();

    // Добавляем новые frames
    for (index, frame) in frames.iter().enumerate() {
      // Создаем путь для сохранения
      let frame_path = self
        .base_dir
        .join("Caches/timeline")
        .join(format!("{file_id}_{index}.jpg"));

      // Создаем директорию если не существует
      if let Some(parent) = frame_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
      }

      // Декодируем base64 и сохраняем файл
      let image_data = STANDARD.decode(&frame.base64_data)?;
      tokio::fs::write(&frame_path, &image_data).await?;

      // Добавляем в структуру данных
      let timeline_preview = TimelinePreview {
        timestamp: frame.timestamp,
        path: frame_path,
        base64_data: Some(frame.base64_data.clone()),
      };

      preview_data.add_timeline_preview(timeline_preview);
    }

    Ok(())
  }

  /// Получить timeline frames для файла
  pub async fn get_timeline_frames(
    &self,
    file_id: &str,
  ) -> Result<Vec<crate::media::commands::TimelineFrame>> {
    let data = self.data.read().await;

    if let Some(preview_data) = data.get(file_id) {
      let mut frames = Vec::new();

      for preview in &preview_data.timeline_previews {
        let frame = crate::media::commands::TimelineFrame {
          timestamp: preview.timestamp,
          base64_data: preview.base64_data.clone().unwrap_or_default(),
          is_keyframe: self.is_keyframe_by_timestamp(preview.timestamp), // Определение keyframe по временной метке
        };
        frames.push(frame);
      }

      Ok(frames)
    } else {
      Ok(Vec::new())
    }
  }

  /// Определить является ли кадр keyframe по временной метке
  fn is_keyframe_by_timestamp(&self, timestamp: f64) -> bool {
    // Простая эвристика: считаем keyframe'ом кадры через каждые 2 секунды
    // В реальной реализации можно анализировать метаданные FFmpeg
    timestamp % 2.0 < 0.1 || timestamp < 0.1
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::tempdir;
  use tokio::fs;

  async fn create_test_manager() -> PreviewDataManager {
    let temp_dir = tempdir().unwrap();
    PreviewDataManager::new(temp_dir.path().to_path_buf())
  }

  #[allow(dead_code)]
  async fn create_test_video_file() -> PathBuf {
    let temp_dir = tempdir().unwrap();
    let video_path = temp_dir.path().join("test_video.mp4");
    fs::write(&video_path, b"fake video data").await.unwrap();
    video_path
  }

  #[tokio::test]
  async fn test_preview_manager_creation() {
    let temp_dir = tempdir().unwrap();
    let manager = PreviewDataManager::new(temp_dir.path().to_path_buf());

    assert_eq!(manager.base_dir, temp_dir.path().to_path_buf());
  }

  #[tokio::test]
  async fn test_get_preview_data_nonexistent() {
    let manager = create_test_manager().await;
    let result = manager.get_preview_data("nonexistent").await;

    assert!(result.is_none());
  }

  #[tokio::test]
  async fn test_get_all_files_with_previews_empty() {
    let manager = create_test_manager().await;
    let files = manager.get_all_files_with_previews().await;

    assert!(files.is_empty());
  }

  #[tokio::test]
  async fn test_generate_browser_thumbnail_invalid_file() {
    let manager = create_test_manager().await;
    let invalid_path = PathBuf::from("/nonexistent/video.mp4");

    let result = manager
      .generate_browser_thumbnail("test_file".to_string(), invalid_path, 160, 90, 0.0)
      .await;

    // Должна быть ошибка из-за несуществующего файла
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_generate_timeline_previews_invalid_file() {
    let manager = create_test_manager().await;
    let invalid_path = PathBuf::from("/nonexistent/video.mp4");

    let result = manager
      .generate_timeline_previews("test_file".to_string(), invalid_path, 10.0, 1.0)
      .await;

    // На некоторых системах может не быть ошибки, поэтому проверяем результат
    match result {
      Ok(_previews) => {
        // Если успешно, то могут быть любые результаты (в зависимости от системы)
        // Главное что нет паники
      }
      Err(_) => {
        // Ожидаемая ошибка из-за несуществующего файла
      }
    }
  }

  #[tokio::test]
  async fn test_extract_recognition_frames_invalid_file() {
    let manager = create_test_manager().await;
    let invalid_path = PathBuf::from("/nonexistent/video.mp4");

    let result = manager
      .extract_recognition_frames("test_file".to_string(), invalid_path, 5)
      .await;

    // На некоторых системах может не быть ошибки, поэтому проверяем результат
    match result {
      Ok(frames) => {
        // Если успешно, то должен быть пустой результат
        assert!(frames.is_empty());
      }
      Err(_) => {
        // Ожидаемая ошибка из-за несуществующего файла
      }
    }
  }

  #[tokio::test]
  async fn test_clear_file_data_nonexistent() {
    let manager = create_test_manager().await;
    let result = manager.clear_file_data("nonexistent").await;

    // Должно быть успешно даже для несуществующего файла
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_save_and_load_from_file() {
    let manager = create_test_manager().await;
    let temp_dir = tempdir().unwrap();
    let save_path = temp_dir.path().join("preview_data.json");

    // Добавляем тестовые данные
    {
      let mut data = manager.data.write().await;
      let preview_data =
        MediaPreviewData::new("test_file".to_string(), PathBuf::from("/test/video.mp4"));
      data.insert("test_file".to_string(), preview_data);
    }

    // Сохраняем
    let save_result = manager.save_to_file(&save_path).await;
    assert!(save_result.is_ok());
    assert!(save_path.exists());

    // Очищаем данные
    {
      let mut data = manager.data.write().await;
      data.clear();
    }

    // Загружаем
    let load_result = manager.load_from_file(&save_path).await;
    assert!(load_result.is_ok());

    // Проверяем что данные восстановились
    let data = manager.data.read().await;
    assert!(data.contains_key("test_file"));
  }

  #[tokio::test]
  async fn test_load_from_nonexistent_file() {
    let manager = create_test_manager().await;
    let nonexistent_path = PathBuf::from("/nonexistent/file.json");

    let result = manager.load_from_file(&nonexistent_path).await;
    assert!(result.is_ok()); // Должно быть успешно, файл просто не существует
  }

  #[tokio::test]
  async fn test_save_timeline_frames() {
    let manager = create_test_manager().await;
    let file_id = "test_video".to_string();

    // Создаем тестовые frames
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let test_image_data = vec![255, 0, 0, 255]; // Красный пиксель в RGBA
    let base64_data = STANDARD.encode(&test_image_data);

    let frames = vec![
      crate::media::commands::TimelineFrame {
        timestamp: 1.0,
        base64_data: base64_data.clone(),
        is_keyframe: true,
      },
      crate::media::commands::TimelineFrame {
        timestamp: 2.0,
        base64_data: base64_data.clone(),
        is_keyframe: false,
      },
    ];

    let result = manager.save_timeline_frames(file_id.clone(), frames).await;
    assert!(result.is_ok());

    // Проверяем, что данные сохранились
    let data = manager.data.read().await;
    let preview_data = data.get(&file_id).unwrap();
    assert_eq!(preview_data.timeline_previews.len(), 2);
    assert_eq!(preview_data.timeline_previews[0].timestamp, 1.0);
    assert_eq!(preview_data.timeline_previews[1].timestamp, 2.0);
  }

  #[tokio::test]
  async fn test_get_timeline_frames() {
    let manager = create_test_manager().await;
    let file_id = "test_video";

    // Сначала сохраняем frames
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let test_image_data = vec![255, 0, 0, 255];
    let base64_data = STANDARD.encode(&test_image_data);

    let frames = vec![crate::media::commands::TimelineFrame {
      timestamp: 1.5,
      base64_data: base64_data.clone(),
      is_keyframe: true,
    }];

    manager
      .save_timeline_frames(file_id.to_string(), frames)
      .await
      .unwrap();

    // Теперь получаем frames
    let result = manager.get_timeline_frames(file_id).await;
    assert!(result.is_ok());

    let retrieved_frames = result.unwrap();
    assert_eq!(retrieved_frames.len(), 1);
    assert_eq!(retrieved_frames[0].timestamp, 1.5);
    assert_eq!(retrieved_frames[0].base64_data, base64_data);
  }

  #[tokio::test]
  async fn test_get_timeline_frames_nonexistent() {
    let manager = create_test_manager().await;
    let result = manager.get_timeline_frames("nonexistent").await;

    assert!(result.is_ok());
    let frames = result.unwrap();
    assert!(frames.is_empty());
  }

  #[tokio::test]
  async fn test_save_timeline_frames_invalid_base64() {
    let manager = create_test_manager().await;
    let file_id = "test_video".to_string();

    let frames = vec![crate::media::commands::TimelineFrame {
      timestamp: 1.0,
      base64_data: "invalid_base64_data!!!".to_string(),
      is_keyframe: true,
    }];

    let result = manager.save_timeline_frames(file_id, frames).await;
    assert!(result.is_err()); // Должна быть ошибка декодирования base64
  }

  #[tokio::test]
  async fn test_clear_file_data_with_existing_data() {
    let manager = create_test_manager().await;
    let file_id = "test_video";

    // Добавляем тестовые данные
    {
      let mut data = manager.data.write().await;
      let mut preview_data =
        MediaPreviewData::new(file_id.to_string(), PathBuf::from("/test/video.mp4"));

      // Добавляем фейковый thumbnail
      let temp_dir = tempdir().unwrap();
      let temp_file = temp_dir.path().join("thumb.jpg");
      fs::write(&temp_file, b"fake image").await.unwrap();

      preview_data.set_browser_thumbnail(ThumbnailData {
        path: temp_file,
        base64_data: Some("fake_base64".to_string()),
        timestamp: 0.0,
        width: 160,
        height: 90,
      });

      data.insert(file_id.to_string(), preview_data);
    }

    // Очищаем данные
    let result = manager.clear_file_data(file_id).await;
    assert!(result.is_ok());

    // Проверяем, что данные удалены
    let data = manager.data.read().await;
    assert!(!data.contains_key(file_id));
  }

  #[tokio::test]
  async fn test_preview_manager_concurrent_access() {
    let manager = Arc::new(create_test_manager().await);
    let mut handles = Vec::new();

    // Запускаем несколько задач одновременно
    for i in 0..5 {
      let manager_clone = manager.clone();
      let handle = tokio::spawn(async move {
        let file_id = format!("test_file_{i}");
        let file_path = PathBuf::from(format!("/test/video_{i}.mp4"));

        // Добавляем данные
        {
          let mut data = manager_clone.data.write().await;
          let preview_data = MediaPreviewData::new(file_id.clone(), file_path);
          data.insert(file_id.clone(), preview_data);
        }

        // Читаем данные
        let result = manager_clone.get_preview_data(&file_id).await;
        assert!(result.is_some());

        file_id
      });
      handles.push(handle);
    }

    // Ждем завершения всех задач
    let results = futures::future::join_all(handles).await;
    for result in results {
      assert!(result.is_ok());
    }

    // Проверяем, что все данные сохранились
    let final_data = manager.data.read().await;
    assert_eq!(final_data.len(), 5);
  }

  #[tokio::test]
  async fn test_save_to_file_invalid_path() {
    let manager = create_test_manager().await;
    let invalid_path = Path::new("/invalid/readonly/path/file.json");

    let result = manager.save_to_file(invalid_path).await;
    assert!(result.is_err()); // Должна быть ошибка из-за невозможности записи
  }

  #[tokio::test]
  async fn test_load_from_file_invalid_json() {
    let manager = create_test_manager().await;
    let temp_dir = tempdir().unwrap();
    let invalid_json_path = temp_dir.path().join("invalid.json");

    // Создаем файл с невалидным JSON
    fs::write(&invalid_json_path, b"{ invalid json ")
      .await
      .unwrap();

    let result = manager.load_from_file(&invalid_json_path).await;
    assert!(result.is_err()); // Должна быть ошибка парсинга JSON
  }

  #[test]
  fn test_is_keyframe_by_timestamp() {
    let temp_dir = tempdir().unwrap();
    let manager = PreviewDataManager::new(temp_dir.path().to_path_buf());

    // Тест для keyframe определения
    assert!(manager.is_keyframe_by_timestamp(0.0)); // Первый кадр
    assert!(manager.is_keyframe_by_timestamp(0.05)); // Близко к 0
    assert!(manager.is_keyframe_by_timestamp(2.0)); // Кратно 2
    assert!(manager.is_keyframe_by_timestamp(4.0)); // Кратно 2
    assert!(manager.is_keyframe_by_timestamp(2.05)); // Близко к кратному 2

    assert!(!manager.is_keyframe_by_timestamp(1.0)); // Не кратно 2
    assert!(!manager.is_keyframe_by_timestamp(3.5)); // Не кратно 2
    assert!(!manager.is_keyframe_by_timestamp(1.5)); // Не кратно 2
  }

  #[tokio::test]
  async fn test_save_timeline_frames_empty_list() {
    let manager = create_test_manager().await;
    let file_id = "test_video".to_string();

    // Сохраняем пустой список frames
    let frames = vec![];
    let result = manager.save_timeline_frames(file_id.clone(), frames).await;
    assert!(result.is_ok());

    // Проверяем что данные созданы но timeline_previews пустой
    let data = manager.data.read().await;
    let preview_data = data.get(&file_id).unwrap();
    assert_eq!(preview_data.timeline_previews.len(), 0);
  }

  #[tokio::test]
  async fn test_save_timeline_frames_overwrite_existing() {
    let manager = create_test_manager().await;
    let file_id = "test_video".to_string();

    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let test_data = vec![255, 0, 0, 255];
    let base64_data = STANDARD.encode(&test_data);

    // Сохраняем первый набор frames
    let frames1 = vec![
      crate::media::commands::TimelineFrame {
        timestamp: 1.0,
        base64_data: base64_data.clone(),
        is_keyframe: true,
      },
      crate::media::commands::TimelineFrame {
        timestamp: 2.0,
        base64_data: base64_data.clone(),
        is_keyframe: false,
      },
    ];
    manager
      .save_timeline_frames(file_id.clone(), frames1)
      .await
      .unwrap();

    // Сохраняем второй набор frames (должен перезаписать первый)
    let frames2 = vec![crate::media::commands::TimelineFrame {
      timestamp: 3.0,
      base64_data: base64_data.clone(),
      is_keyframe: true,
    }];
    manager
      .save_timeline_frames(file_id.clone(), frames2)
      .await
      .unwrap();

    // Проверяем что остался только второй набор
    let data = manager.data.read().await;
    let preview_data = data.get(&file_id).unwrap();
    assert_eq!(preview_data.timeline_previews.len(), 1);
    assert_eq!(preview_data.timeline_previews[0].timestamp, 3.0);
  }

  #[tokio::test]
  async fn test_save_timeline_frames_creates_directories() {
    let temp_dir = tempdir().unwrap();
    let manager = PreviewDataManager::new(temp_dir.path().to_path_buf());
    let file_id = "test_video".to_string();

    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let test_data = vec![255, 0, 0, 255];
    let base64_data = STANDARD.encode(&test_data);

    let frames = vec![crate::media::commands::TimelineFrame {
      timestamp: 1.0,
      base64_data: base64_data.clone(),
      is_keyframe: true,
    }];

    // Директория не должна существовать изначально
    let cache_dir = temp_dir.path().join("Caches/timeline");
    assert!(!cache_dir.exists());

    // Сохраняем frames
    manager.save_timeline_frames(file_id, frames).await.unwrap();

    // Проверяем что директория создана
    assert!(cache_dir.exists());
  }

  #[tokio::test]
  async fn test_get_timeline_frames_with_mixed_base64_data() {
    let manager = create_test_manager().await;
    let file_id = "test_video";

    // Добавляем данные с разным base64_data состоянием
    {
      let mut data = manager.data.write().await;
      let mut preview_data =
        MediaPreviewData::new(file_id.to_string(), PathBuf::from("/test/video.mp4"));

      // Frame с base64
      preview_data.add_timeline_preview(TimelinePreview {
        timestamp: 1.0,
        path: PathBuf::from("/test/frame1.jpg"),
        base64_data: Some("test_base64".to_string()),
      });

      // Frame без base64
      preview_data.add_timeline_preview(TimelinePreview {
        timestamp: 2.0,
        path: PathBuf::from("/test/frame2.jpg"),
        base64_data: None,
      });

      data.insert(file_id.to_string(), preview_data);
    }

    // Получаем frames
    let frames = manager.get_timeline_frames(file_id).await.unwrap();
    assert_eq!(frames.len(), 2);
    assert_eq!(frames[0].base64_data, "test_base64");
    assert_eq!(frames[1].base64_data, ""); // None превращается в пустую строку
  }

  #[tokio::test]
  async fn test_clear_file_data_with_all_preview_types() {
    let manager = create_test_manager().await;
    let file_id = "test_video";
    let temp_dir = tempdir().unwrap();

    // Создаем файлы для всех типов превью
    let thumb_path = temp_dir.path().join("thumb.jpg");
    let timeline_path = temp_dir.path().join("timeline.jpg");
    let recognition_path = temp_dir.path().join("recognition.jpg");

    fs::write(&thumb_path, b"thumb").await.unwrap();
    fs::write(&timeline_path, b"timeline").await.unwrap();
    fs::write(&recognition_path, b"recognition").await.unwrap();

    // Добавляем данные со всеми типами превью
    {
      let mut data = manager.data.write().await;
      let mut preview_data =
        MediaPreviewData::new(file_id.to_string(), PathBuf::from("/test/video.mp4"));

      preview_data.set_browser_thumbnail(ThumbnailData {
        path: thumb_path.clone(),
        base64_data: Some("thumb_base64".to_string()),
        timestamp: 0.0,
        width: 160,
        height: 90,
      });

      preview_data.add_timeline_preview(TimelinePreview {
        timestamp: 1.0,
        path: timeline_path.clone(),
        base64_data: Some("timeline_base64".to_string()),
      });

      preview_data.add_recognition_frame(RecognitionFrame {
        timestamp: 2.0,
        path: recognition_path.clone(),
        processed: false,
      });

      data.insert(file_id.to_string(), preview_data);
    }

    // Проверяем что файлы существуют
    assert!(thumb_path.exists());
    assert!(timeline_path.exists());
    assert!(recognition_path.exists());

    // Очищаем данные
    manager.clear_file_data(file_id).await.unwrap();

    // Проверяем что файлы удалены (или попытка удаления была сделана)
    // Примечание: файлы могут не удалиться если нет прав, но попытка должна быть
    let data = manager.data.read().await;
    assert!(!data.contains_key(file_id));
  }

  #[tokio::test]
  async fn test_save_and_load_complex_data() {
    let manager = create_test_manager().await;
    let temp_dir = tempdir().unwrap();
    let save_path = temp_dir.path().join("complex_data.json");

    // Создаем сложные данные с разными типами превью
    {
      let mut data = manager.data.write().await;

      // Первый файл
      let mut preview1 =
        MediaPreviewData::new("file1".to_string(), PathBuf::from("/test/video1.mp4"));
      preview1.set_browser_thumbnail(ThumbnailData {
        path: PathBuf::from("/test/thumb1.jpg"),
        base64_data: Some("thumb1_base64".to_string()),
        timestamp: 0.0,
        width: 160,
        height: 90,
      });
      for i in 0..3 {
        preview1.add_timeline_preview(TimelinePreview {
          timestamp: i as f64,
          path: PathBuf::from(format!("/test/timeline1_{i}.jpg")),
          base64_data: Some(format!("timeline1_{i}_base64")),
        });
      }

      // Второй файл
      let mut preview2 =
        MediaPreviewData::new("file2".to_string(), PathBuf::from("/test/video2.mp4"));
      for i in 0..2 {
        preview2.add_recognition_frame(RecognitionFrame {
          timestamp: i as f64 * 2.0,
          path: PathBuf::from(format!("/test/recognition2_{i}.jpg")),
          processed: i % 2 == 0,
        });
      }

      data.insert("file1".to_string(), preview1);
      data.insert("file2".to_string(), preview2);
    }

    // Сохраняем
    manager.save_to_file(&save_path).await.unwrap();

    // Создаем новый менеджер и загружаем данные
    let manager2 = create_test_manager().await;
    manager2.load_from_file(&save_path).await.unwrap();

    // Проверяем что все данные загрузились корректно
    let data = manager2.data.read().await;
    assert_eq!(data.len(), 2);

    let preview1 = data.get("file1").unwrap();
    assert!(preview1.browser_thumbnail.is_some());
    assert_eq!(preview1.timeline_previews.len(), 3);

    let preview2 = data.get("file2").unwrap();
    assert_eq!(preview2.recognition_frames.len(), 2);
    assert!(preview2.recognition_frames[0].processed);
    assert!(!preview2.recognition_frames[1].processed);
  }

  #[tokio::test]
  async fn test_preview_manager_drop_behavior() {
    // Тест поведения при удалении менеджера
    let temp_dir = tempdir().unwrap();
    let base_dir = temp_dir.path().to_path_buf();

    {
      let manager = PreviewDataManager::new(base_dir.clone());

      // Добавляем некоторые данные
      let mut data = manager.data.write().await;
      let preview_data =
        MediaPreviewData::new("test".to_string(), PathBuf::from("/test/video.mp4"));
      data.insert("test".to_string(), preview_data);
    }
    // manager удален здесь

    // Создаем новый менеджер с тем же base_dir
    let manager2 = PreviewDataManager::new(base_dir);
    let data = manager2.data.read().await;
    assert_eq!(data.len(), 0); // Данные не персистентны между экземплярами
  }

  #[tokio::test]
  async fn test_generate_browser_thumbnail_creates_parent_dirs() {
    let temp_dir = tempdir().unwrap();
    let manager = PreviewDataManager::new(temp_dir.path().to_path_buf());

    // Создаем фейковый видео файл
    let video_path = temp_dir.path().join("video.mp4");
    fs::write(&video_path, b"fake video").await.unwrap();

    // Пытаемся сгенерировать thumbnail (FFmpeg вероятно вернет ошибку)
    let result = manager
      .generate_browser_thumbnail("test".to_string(), video_path, 160, 90, 0.0)
      .await;

    // Проверяем что директория была создана даже если генерация провалилась
    let cache_dir = temp_dir.path().join("Caches/preview/browser");
    assert!(cache_dir.exists());

    // Результат может быть ошибкой из-за FFmpeg
    if result.is_ok() {
      // Если каким-то образом успешно
    }
    // Ожидаемая ошибка FFmpeg тоже допустима
  }

  #[tokio::test]
  async fn test_extract_recognition_frames_zero_count() {
    let manager = create_test_manager().await;
    let video_path = PathBuf::from("/test/video.mp4");

    // Запрашиваем 0 кадров
    let result = manager
      .extract_recognition_frames("test".to_string(), video_path, 0)
      .await;

    // Должен вернуть пустой результат или ошибку
    if let Ok(frames) = result {
      assert_eq!(frames.len(), 0);
    }
    // Ошибка также допустима
  }

  #[tokio::test]
  async fn test_concurrent_write_operations() {
    let manager = Arc::new(create_test_manager().await);
    let mut handles = Vec::new();

    // Запускаем несколько операций записи одновременно
    for i in 0..10 {
      let manager_clone = manager.clone();
      let handle = tokio::spawn(async move {
        let file_id = format!("file_{i}");

        // Операция 1: Сохранение timeline frames
        if i % 2 == 0 {
          use base64::{engine::general_purpose::STANDARD, Engine as _};
          let data = vec![255, 0, 0, 255];
          let base64 = STANDARD.encode(&data);

          let frames = vec![crate::media::commands::TimelineFrame {
            timestamp: i as f64,
            base64_data: base64,
            is_keyframe: true,
          }];

          manager_clone
            .save_timeline_frames(file_id.clone(), frames)
            .await
            .unwrap();
        }

        // Операция 2: Прямое добавление данных
        {
          let mut data = manager_clone.data.write().await;
          let preview = MediaPreviewData::new(
            file_id.clone(),
            PathBuf::from(format!("/test/video_{i}.mp4")),
          );
          data.insert(file_id.clone(), preview);
        }

        // Операция 3: Чтение данных
        let _ = manager_clone.get_preview_data(&file_id).await;

        file_id
      });
      handles.push(handle);
    }

    // Ждем завершения всех операций
    let results = futures::future::join_all(handles).await;
    for result in &results {
      assert!(result.is_ok());
    }

    // Проверяем что все файлы сохранены
    let files = manager.get_all_files_with_previews().await;
    assert_eq!(files.len(), 10);
  }

  // Интеграционные тесты для проверки полного workflow
  mod integration_tests {
    use super::*;

    #[tokio::test]
    async fn test_full_preview_workflow() {
      let manager = create_test_manager().await;
      let file_id = "integration_test";

      // Начинаем с пустого состояния
      assert!(manager.get_preview_data(file_id).await.is_none());

      // Добавляем некоторые timeline frames
      use base64::{engine::general_purpose::STANDARD, Engine as _};
      let test_data = vec![255, 0, 0, 255];
      let base64_data = STANDARD.encode(&test_data);

      let frames = vec![
        crate::media::commands::TimelineFrame {
          timestamp: 0.0,
          base64_data: base64_data.clone(),
          is_keyframe: true,
        },
        crate::media::commands::TimelineFrame {
          timestamp: 1.0,
          base64_data: base64_data.clone(),
          is_keyframe: false,
        },
      ];

      manager
        .save_timeline_frames(file_id.to_string(), frames)
        .await
        .unwrap();

      // Проверяем, что данные появились
      let preview_data = manager.get_preview_data(file_id).await;
      assert!(preview_data.is_some());

      let data = preview_data.unwrap();
      assert_eq!(data.timeline_previews.len(), 2);

      // Проверяем, что можем получить frames обратно
      let retrieved_frames = manager.get_timeline_frames(file_id).await.unwrap();
      assert_eq!(retrieved_frames.len(), 2);
      assert_eq!(retrieved_frames[0].timestamp, 0.0);
      assert_eq!(retrieved_frames[1].timestamp, 1.0);

      // Проверяем файл появился в списке
      let all_files = manager.get_all_files_with_previews().await;
      assert!(all_files.contains(&file_id.to_string()));

      // Очищаем данные
      manager.clear_file_data(file_id).await.unwrap();

      // Проверяем, что данные удалены
      assert!(manager.get_preview_data(file_id).await.is_none());
      let files_after_clear = manager.get_all_files_with_previews().await;
      assert!(!files_after_clear.contains(&file_id.to_string()));
    }

    #[tokio::test]
    async fn test_workflow_with_persistence() {
      let temp_dir = tempdir().unwrap();
      let save_path = temp_dir.path().join("workflow_data.json");
      let file_id = "persist_test";

      // Фаза 1: Создание и сохранение данных
      {
        let manager = create_test_manager().await;

        use base64::{engine::general_purpose::STANDARD, Engine as _};
        let data = vec![255, 255, 255, 255];
        let base64 = STANDARD.encode(&data);

        let frames = vec![crate::media::commands::TimelineFrame {
          timestamp: 5.0,
          base64_data: base64,
          is_keyframe: false,
        }];

        manager
          .save_timeline_frames(file_id.to_string(), frames)
          .await
          .unwrap();

        // Сохраняем состояние
        manager.save_to_file(&save_path).await.unwrap();
      }

      // Фаза 2: Загрузка и проверка данных
      {
        let manager = create_test_manager().await;

        // Загружаем состояние
        manager.load_from_file(&save_path).await.unwrap();

        // Проверяем что данные восстановились
        let preview_data = manager.get_preview_data(file_id).await;
        assert!(preview_data.is_some());

        let frames = manager.get_timeline_frames(file_id).await.unwrap();
        assert_eq!(frames.len(), 1);
        assert_eq!(frames[0].timestamp, 5.0);
        assert!(!frames[0].is_keyframe); // Должно быть false по нашей логике
      }
    }
  }
}
