#[cfg(test)]
mod tests {
    use super::*;
    use ts_schema::{ProjectSchema, Track, Clip, Effect, Filter};
    use ts_schema::timeline::{TrackType, ClipSource};
    use ts_schema::effects::{EffectType, FilterType};
    
    /// Создает тестовую схему проекта с треком и клипом
    fn create_test_project() -> ProjectSchema {
        let mut project = ProjectSchema::default();
        
        // Создаем видео трек
        let mut track = Track::new(TrackType::Video, "Test Track".to_string());
        
        // Создаем клип
        let clip = Clip {
            id: "test-clip-1".to_string(),
            source: ClipSource::File("/test/video.mp4".to_string()),
            start_time: 0.0,
            end_time: 10.0,
            source_start: 0.0,
            source_end: 10.0,
            speed: 1.0,
            opacity: 1.0,
            effects: vec![],
            filters: vec![],
            template_id: None,
            template_position: None,
            color_correction: None,
            crop: None,
            transform: None,
            audio_track_index: None,
            properties: Default::default(),
        };
        
        track.clips.push(clip);
        project.tracks.push(track);
        
        // Добавляем эффекты
        let effect = Effect::new(EffectType::Blur, "Test Blur".to_string());
        project.effects.push(effect);
        
        // Добавляем фильтры
        let filter = Filter::new(FilterType::Brightness, "Test Brightness".to_string());
        project.filters.push(filter);
        
        project
    }
    
    #[tokio::test]
    async fn test_add_effect_to_clip() {
        let mut project = create_test_project();
        let clip_id = project.tracks[0].clips[0].id.clone();
        let effect_id = project.effects[0].id.clone();
        
        // Добавляем эффект к клипу
        let result = ts_render_tauri::schema::business_logic::add_effect_to_clip(
            &mut project,
            &clip_id,
            &effect_id
        );
        
        assert!(result.is_ok());
        
        // Проверяем, что эффект добавлен
        let clip = &project.tracks[0].clips[0];
        assert!(clip.effects.contains(&effect_id));
    }
    
    #[tokio::test]
    async fn test_add_filter_to_clip() {
        let mut project = create_test_project();
        let clip_id = project.tracks[0].clips[0].id.clone();
        let filter_id = project.filters[0].id.clone();
        
        // Добавляем фильтр к клипу
        let result = ts_render_tauri::schema::business_logic::add_filter_to_clip(
            &mut project,
            &clip_id,
            &filter_id
        );
        
        assert!(result.is_ok());
        
        // Проверяем, что фильтр добавлен
        let clip = &project.tracks[0].clips[0];
        assert!(clip.filters.contains(&filter_id));
    }
    
    #[tokio::test]
    async fn test_remove_effect_from_clip() {
        let mut project = create_test_project();
        let clip_id = project.tracks[0].clips[0].id.clone();
        let effect_id = project.effects[0].id.clone();
        
        // Сначала добавляем эффект
        ts_render_tauri::schema::business_logic::add_effect_to_clip(
            &mut project,
            &clip_id,
            &effect_id
        ).unwrap();
        
        // Затем удаляем
        let result = ts_render_tauri::schema::business_logic::remove_effect_from_clip(
            &mut project,
            &clip_id,
            &effect_id
        );
        
        assert!(result.is_ok());
        
        // Проверяем, что эффект удален
        let clip = &project.tracks[0].clips[0];
        assert!(!clip.effects.contains(&effect_id));
    }
    
    #[tokio::test]
    async fn test_add_nonexistent_effect() {
        let mut project = create_test_project();
        let clip_id = project.tracks[0].clips[0].id.clone();
        let fake_effect_id = "non-existent-effect".to_string();
        
        // Пытаемся добавить несуществующий эффект
        let result = ts_render_tauri::schema::business_logic::add_effect_to_clip(
            &mut project,
            &clip_id,
            &fake_effect_id
        );
        
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Effect not found"));
    }
    
    #[tokio::test]
    async fn test_add_effect_to_nonexistent_clip() {
        let mut project = create_test_project();
        let effect_id = project.effects[0].id.clone();
        let fake_clip_id = "non-existent-clip".to_string();
        
        // Пытаемся добавить эффект к несуществующему клипу
        let result = ts_render_tauri::schema::business_logic::add_effect_to_clip(
            &mut project,
            &fake_clip_id,
            &effect_id
        );
        
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Clip not found"));
    }
    
    #[tokio::test]
    async fn test_duplicate_effect_addition() {
        let mut project = create_test_project();
        let clip_id = project.tracks[0].clips[0].id.clone();
        let effect_id = project.effects[0].id.clone();
        
        // Добавляем эффект первый раз
        ts_render_tauri::schema::business_logic::add_effect_to_clip(
            &mut project,
            &clip_id,
            &effect_id
        ).unwrap();
        
        // Добавляем тот же эффект второй раз
        let result = ts_render_tauri::schema::business_logic::add_effect_to_clip(
            &mut project,
            &clip_id,
            &effect_id
        );
        
        assert!(result.is_ok());
        
        // Проверяем, что эффект добавлен только один раз
        let clip = &project.tracks[0].clips[0];
        let effect_count = clip.effects.iter().filter(|&id| id == &effect_id).count();
        assert_eq!(effect_count, 1);
    }
}