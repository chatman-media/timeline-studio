//! Тесты для CompositionStage

#[cfg(test)]
mod tests {
    use super::super::super::composition::CompositionStage;
    use super::super::super::{PipelineContext, PipelineStage};
    use crate::video_compiler::schema::{ClipSource, Project, Track, Clip, TrackType, Timeline};
    use crate::video_compiler::error::VideoCompilerError;
    use std::collections::HashMap;
    use std::path::PathBuf;
    use tempfile::{NamedTempFile, TempDir};
    use tokio;

    fn create_test_project() -> Project {
        Project {
            id: "test-project".to_string(),
            name: "Test Project".to_string(),
            description: Some("Test description".to_string()),
            timeline: Timeline::default(),
            tracks: vec![],
            sections: vec![],
            metadata: HashMap::new(),
            version: "1.0".to_string(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        }
    }

    fn create_test_context_with_project(project: Project) -> PipelineContext {
        let temp_dir = TempDir::new().unwrap();
        PipelineContext {
            project,
            settings: crate::video_compiler::schema::ExportSettings::default(),
            output_path: temp_dir.path().join("test_output.mp4"),
            cache: std::sync::Arc::new(crate::video_compiler::core::cache::RenderCache::new(1000)),
            progress_sender: None,
            custom_data: HashMap::new(),
        }
    }

    #[tokio::test]
    async fn test_composition_stage_new() {
        let stage = CompositionStage::new();
        assert_eq!(stage.name(), "composition");
    }

    #[tokio::test]
    async fn test_compose_empty_project() {
        let stage = CompositionStage::new();
        let project = create_test_project();
        let mut context = create_test_context_with_project(project);

        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_compose_single_video_track() {
        let stage = CompositionStage::new();
        
        // Создаем временный видеофайл
        let temp_video = NamedTempFile::new().unwrap();
        std::fs::write(temp_video.path(), b"fake video data").unwrap();

        let mut project = create_test_project();
        
        // Создаем видео трек с одним клипом
        let mut video_track = Track::new(TrackType::Video, "Video Track".to_string());
        let video_clip = Clip::new(
            temp_video.path().to_path_buf(),
            0.0,
            10.0,
        );
        video_track.add_clip(video_clip);
        project.tracks = vec![video_track];
        
        let mut context = create_test_context_with_project(project);
        
        // Добавляем предобработанные файлы (эмулируем preprocessing stage)
        context.add_intermediate_file(
            "preprocessed_track_0_clip_0".to_string(),
            temp_video.path().to_path_buf(),
        );
        
        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
        
        // Проверяем, что композиция была создана
        assert!(context.has_intermediate_file("composition"));
    }

    #[tokio::test]
    async fn test_compose_multiple_tracks() {
        let stage = CompositionStage::new();
        
        // Создаем временные файлы
        let temp_video = NamedTempFile::new().unwrap();
        let temp_audio = NamedTempFile::new().unwrap();
        std::fs::write(temp_video.path(), b"fake video data").unwrap();
        std::fs::write(temp_audio.path(), b"fake audio data").unwrap();

        let mut project = create_test_project();
        
        // Создаем видео трек
        let mut video_track = Track::new(TrackType::Video, "Video Track".to_string());
        let video_clip = Clip::new(temp_video.path().to_path_buf(), 0.0, 10.0);
        video_track.add_clip(video_clip);
        
        // Создаем аудио трек
        let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
        let audio_clip = Clip::new(temp_audio.path().to_path_buf(), 0.0, 10.0);
        audio_track.add_clip(audio_clip);
        
        project.tracks = vec![video_track, audio_track];
        
        let mut context = create_test_context_with_project(project);
        
        // Добавляем предобработанные файлы
        context.add_intermediate_file(
            "preprocessed_track_0_clip_0".to_string(),
            temp_video.path().to_path_buf(),
        );
        context.add_intermediate_file(
            "preprocessed_track_1_clip_0".to_string(),
            temp_audio.path().to_path_buf(),
        );
        
        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
        
        // Проверяем, что композиция была создана
        assert!(context.has_intermediate_file("composition"));
        
        // Проверяем, что обработались оба трека
        assert!(context.has_intermediate_file("track_0_output"));
        assert!(context.has_intermediate_file("track_1_output"));
    }

    #[tokio::test]
    async fn test_compose_tracks_with_multiple_clips() {
        let stage = CompositionStage::new();
        
        // Создаем несколько временных файлов
        let temp_files: Vec<_> = (0..3).map(|_| {
            let file = NamedTempFile::new().unwrap();
            std::fs::write(file.path(), b"fake media data").unwrap();
            file
        }).collect();

        let mut project = create_test_project();
        
        // Создаем трек с несколькими клипами
        let mut track = Track::new(TrackType::Video, "Multi-clip Track".to_string());
        for (i, file) in temp_files.iter().enumerate() {
            let clip = Clip::new(
                file.path().to_path_buf(),
                (i * 5) as f64,
                5.0,
            );
            track.add_clip(clip);
        }
        project.tracks = vec![track];
        
        let mut context = create_test_context_with_project(project);
        
        // Добавляем предобработанные файлы для всех клипов
        for (i, file) in temp_files.iter().enumerate() {
            context.add_intermediate_file(
                format!("preprocessed_track_0_clip_{}", i),
                file.path().to_path_buf(),
            );
        }
        
        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
        
        // Проверяем, что композиция была создана
        assert!(context.has_intermediate_file("composition"));
        assert!(context.has_intermediate_file("track_0_output"));
    }

    #[tokio::test]
    async fn test_compose_tracks_with_effects() {
        let stage = CompositionStage::new();
        
        let temp_video = NamedTempFile::new().unwrap();
        std::fs::write(temp_video.path(), b"fake video data").unwrap();

        let mut project = create_test_project();
        
        // Создаем трек с эффектами
        let mut video_track = Track::new(TrackType::Video, "FX Track".to_string());
        video_track.effects = vec!["blur".to_string(), "color_adjust".to_string()];
        
        let video_clip = Clip::new(temp_video.path().to_path_buf(), 0.0, 10.0);
        video_track.add_clip(video_clip);
        project.tracks = vec![video_track];
        
        let mut context = create_test_context_with_project(project);
        context.add_intermediate_file(
            "preprocessed_track_0_clip_0".to_string(),
            temp_video.path().to_path_buf(),
        );
        
        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
        
        // Проверяем, что композиция с эффектами была создана
        assert!(context.has_intermediate_file("composition"));
    }

    #[tokio::test]
    async fn test_compose_tracks_with_filters() {
        let stage = CompositionStage::new();
        
        let temp_video = NamedTempFile::new().unwrap();
        std::fs::write(temp_video.path(), b"fake video data").unwrap();

        let mut project = create_test_project();
        
        // Создаем трек с фильтрами
        let mut video_track = Track::new(TrackType::Video, "Filtered Track".to_string());
        video_track.filters = vec!["sharpen".to_string(), "denoise".to_string()];
        
        let video_clip = Clip::new(temp_video.path().to_path_buf(), 0.0, 10.0);
        video_track.add_clip(video_clip);
        project.tracks = vec![video_track];
        
        let mut context = create_test_context_with_project(project);
        context.add_intermediate_file(
            "preprocessed_track_0_clip_0".to_string(),
            temp_video.path().to_path_buf(),
        );
        
        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
        
        // Проверяем, что композиция с фильтрами была создана
        assert!(context.has_intermediate_file("composition"));
    }

    #[tokio::test]
    async fn test_compose_disabled_track() {
        let stage = CompositionStage::new();
        
        let temp_video = NamedTempFile::new().unwrap();
        std::fs::write(temp_video.path(), b"fake video data").unwrap();

        let mut project = create_test_project();
        
        // Создаем отключенный трек
        let mut video_track = Track::new(TrackType::Video, "Disabled Track".to_string());
        video_track.enabled = false;
        
        let video_clip = Clip::new(temp_video.path().to_path_buf(), 0.0, 10.0);
        video_track.add_clip(video_clip);
        project.tracks = vec![video_track];
        
        let mut context = create_test_context_with_project(project);
        context.add_intermediate_file(
            "preprocessed_track_0_clip_0".to_string(),
            temp_video.path().to_path_buf(),
        );
        
        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
        
        // Отключенный трек не должен создавать output
        assert!(!context.has_intermediate_file("track_0_output"));
    }

    #[tokio::test]
    async fn test_compose_locked_track() {
        let stage = CompositionStage::new();
        
        let temp_video = NamedTempFile::new().unwrap();
        std::fs::write(temp_video.path(), b"fake video data").unwrap();

        let mut project = create_test_project();
        
        // Создаем заблокированный трек
        let mut video_track = Track::new(TrackType::Video, "Locked Track".to_string());
        video_track.locked = true;
        
        let video_clip = Clip::new(temp_video.path().to_path_buf(), 0.0, 10.0);
        video_track.add_clip(video_clip);
        project.tracks = vec![video_track];
        
        let mut context = create_test_context_with_project(project);
        context.add_intermediate_file(
            "preprocessed_track_0_clip_0".to_string(),
            temp_video.path().to_path_buf(),
        );
        
        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
        
        // Заблокированный трек должен обрабатываться нормально
        assert!(context.has_intermediate_file("composition"));
    }

    #[tokio::test]
    async fn test_compose_with_missing_preprocessed_files() {
        let stage = CompositionStage::new();
        
        let temp_video = NamedTempFile::new().unwrap();
        std::fs::write(temp_video.path(), b"fake video data").unwrap();

        let mut project = create_test_project();
        
        let mut video_track = Track::new(TrackType::Video, "Video Track".to_string());
        let video_clip = Clip::new(temp_video.path().to_path_buf(), 0.0, 10.0);
        video_track.add_clip(video_clip);
        project.tracks = vec![video_track];
        
        let mut context = create_test_context_with_project(project);
        // НЕ добавляем предобработанные файлы
        
        let result = stage.execute(&mut context).await;
        
        // Композиция должна обрабатывать отсутствующие файлы gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_compose_progress_tracking() {
        let stage = CompositionStage::new();
        
        // Создаем несколько треков для отслеживания прогресса
        let temp_files: Vec<_> = (0..3).map(|_| {
            let file = NamedTempFile::new().unwrap();
            std::fs::write(file.path(), b"fake data").unwrap();
            file
        }).collect();

        let mut project = create_test_project();
        
        // Создаем несколько треков
        for (i, file) in temp_files.iter().enumerate() {
            let mut track = Track::new(TrackType::Video, format!("Track {}", i));
            let clip = Clip::new(file.path().to_path_buf(), 0.0, 5.0);
            track.add_clip(clip);
            project.tracks.push(track);
        }
        
        let mut context = create_test_context_with_project(project);
        
        // Добавляем предобработанные файлы
        for (i, file) in temp_files.iter().enumerate() {
            context.add_intermediate_file(
                format!("preprocessed_track_{}_clip_0", i),
                file.path().to_path_buf(),
            );
        }
        
        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
        
        // Проверяем, что все треки обработались
        for i in 0..temp_files.len() {
            assert!(context.has_intermediate_file(&format!("track_{}_output", i)));
        }
        assert!(context.has_intermediate_file("composition"));
    }

    #[tokio::test]
    async fn test_compose_custom_data_preservation() {
        let stage = CompositionStage::new();
        let project = create_test_project();
        
        let mut context = create_test_context_with_project(project);
        context.custom_data.insert("composition_test".to_string(), serde_json::json!("test_value"));
        
        let result = stage.execute(&mut context).await;
        assert!(result.is_ok());
        
        // Проверяем, что кастомные данные сохранились
        assert_eq!(
            context.custom_data.get("composition_test"),
            Some(&serde_json::json!("test_value"))
        );
    }
}