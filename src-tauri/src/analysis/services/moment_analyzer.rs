// Moment analyzer - анализ ключевых моментов с интеграцией Montage Planner

use crate::analysis::models::*;
// use crate::montage_planner::services::moment_detector::{MomentDetector, MomentScore};  // Временно отключено 
// use crate::montage_planner::types::{Fragment, QualityScores, ContentSignatures};  // Временно отключено
use anyhow::Result;
use uuid::Uuid;
use chrono::Utc;
use log::{info, error};

/// Анализатор ключевых моментов
pub struct MomentAnalyzer {
    /// Пороговые значения для importance score
    pub importance_threshold: f32,
    /// Максимальное количество моментов на сцену
    pub max_moments_per_scene: usize,
}

impl MomentAnalyzer {
    pub fn new() -> Self {
        Self {
            importance_threshold: 0.7, // Только высоковажные моменты
            max_moments_per_scene: 5,
        }
    }

    /// Конфигурация с пользовательскими параметрами
    pub fn with_config(importance_threshold: f32, max_moments_per_scene: usize) -> Self {
        Self {
            importance_threshold,
            max_moments_per_scene,
        }
    }

    /// Поиск ключевых моментов в сценах
    pub async fn find_key_moments(&self, scenes: &[AnalysisScene]) -> Result<Vec<KeyMoment>> {
        info!("Starting key moments analysis for {} scenes", scenes.len());
        
        let mut all_moments = Vec::new();
        
        for scene in scenes {
            match self.analyze_scene_moments(scene).await {
                Ok(mut scene_moments) => {
                    // Ограничиваем количество моментов на сцену
                    scene_moments.sort_by(|a, b| b.importance_score.partial_cmp(&a.importance_score).unwrap_or(std::cmp::Ordering::Equal));
                    scene_moments.truncate(self.max_moments_per_scene);
                    
                    all_moments.extend(scene_moments);
                }
                Err(e) => {
                    error!("Failed to analyze moments for scene {}: {}", scene.id, e);
                    // Продолжаем с другими сценами
                }
            }
        }

        // Сортируем по важности
        all_moments.sort_by(|a, b| b.importance_score.partial_cmp(&a.importance_score).unwrap_or(std::cmp::Ordering::Equal));
        
        info!("Found {} key moments across all scenes", all_moments.len());
        Ok(all_moments)
    }

    /// Анализ ключевых моментов в одной сцене
    async fn analyze_scene_moments(&self, scene: &AnalysisScene) -> Result<Vec<KeyMoment>> {
        let mut key_moments = Vec::new();
        
        // Упрощенный анализ без внешних зависимостей
        let moment_count = self.calculate_moments_for_scene(scene);
        
        for i in 0..moment_count {
            let progress = i as f32 / moment_count.max(1) as f32;
            let timestamp = scene.start_time + (scene.duration * progress);
            
            // Создаем базовую оценку важности
            let importance = self.calculate_importance_score(scene, timestamp);
            
            if importance >= self.importance_threshold {
                let key_moment = self.create_key_moment(scene, timestamp, importance, i)?;
                key_moments.push(key_moment);
            }
        }

        Ok(key_moments)
    }

    /// Подсчет количества моментов для сцены
    fn calculate_moments_for_scene(&self, scene: &AnalysisScene) -> usize {
        // Основываем на длительности и качестве сцены
        let base_moments = if scene.duration < 10.0 {
            1 // Короткие сцены - 1 момент
        } else if scene.duration < 30.0 {
            2 // Средние сцены - 2 момента
        } else {
            3 // Длинные сцены - до 3 моментов
        };

        // Добавляем моменты на основе качества
        let quality_bonus = if scene.quality_score > 0.8 {
            1
        } else {
            0
        };

        (base_moments + quality_bonus).min(self.max_moments_per_scene)
    }

    /// Расчет важности момента
    fn calculate_importance_score(&self, scene: &AnalysisScene, timestamp: f32) -> f32 {
        let mut score = 0.5; // Базовая важность

        // Качество сцены влияет на важность
        score += scene.quality_score * 0.3;

        // Уровень движения
        score += scene.motion_level * 0.2;

        // Наличие лиц увеличивает важность
        if scene.has_faces {
            score += 0.2;
        }

        // Присутствие людей
        if !scene.persons_present.is_empty() {
            score += 0.15;
        }

        // Позиция в сцене (начало и конец обычно важнее)
        let position_in_scene = (timestamp - scene.start_time) / scene.duration;
        if position_in_scene < 0.2 || position_in_scene > 0.8 {
            score += 0.1;
        }

        score.clamp(0.0, 1.0)
    }

    /// Создание ключевого момента
    fn create_key_moment(
        &self,
        scene: &AnalysisScene,
        timestamp: f32,
        importance: f32,
        index: usize,
    ) -> Result<KeyMoment> {
        let now = Utc::now();
        
        // Определяем тип момента
        let moment_type = self.determine_moment_type_simple(scene);
        
        Ok(KeyMoment {
            id: Uuid::new_v4(),
            project_id: scene.project_id,
            file_id: scene.file_id,
            scene_id: Some(scene.id),
            timestamp,
            duration: 3.0, // Default 3 seconds
            moment_type,
            sub_type: Some(format!("moment_{}", index + 1)),
            importance_score: importance,
            scoring_factors: ScoringFactors {
                emotion_intensity: scene.emotional_tone.is_some() as u8 as f32 * 0.8,
                emotion_variety: 0.5,
                emotional_change: 0.5,
                visual_quality: scene.quality_score,
                composition_quality: scene.composition_score,
                color_vibrancy: 0.7,
                motion_interest: scene.motion_level,
                audio_clarity: 0.7,
                audio_dynamics: 0.6,
                speech_quality: 0.7,
                music_sync: 0.5,
                person_prominence: if scene.has_faces { 0.8 } else { 0.2 },
                object_interest: if scene.objects_detected.is_empty() { 0.3 } else { 0.7 },
                scene_uniqueness: scene.quality_score * 0.8,
                narrative_importance: importance,
                overall_quality: scene.quality_score,
                stability: scene.stability,
                focus_quality: 0.7,
                lighting_quality: 0.6,
                weighted_score: importance,
                confidence: 0.8,
                ranking_position: None,
            },
            description: format!(
                "Key moment #{} in {:?} scene at {:.1}s",
                index + 1, scene.scene_type, timestamp
            ),
            auto_description: Some(format!(
                "Automatically detected moment with {:.0}% importance at {:.1}s",
                importance * 100.0, timestamp
            )),
            user_notes: None,
            involved_persons: scene.persons_present.clone(),
            involved_objects: scene.objects_detected.clone(),
            associated_emotions: scene.emotional_tone.clone().map(|e| vec![e]).unwrap_or_default(),
            content_tags: scene.tags.clone(),
            mood_tags: Vec::new(),
            technical_tags: vec![
                format!("quality:{:.2}", scene.quality_score),
                format!("motion:{:.2}", scene.motion_level),
                format!("importance:{:.2}", importance),
            ],
            user_rating: None,
            is_bookmarked: false,
            is_hidden: false,
            thumbnail_frame: scene.representative_frame.clone(),
            preview_start: timestamp,
            preview_end: timestamp + 3.0,
            created_at: now,
            updated_at: now,
        })
    }

    /// Определение типа момента на основе характеристик сцены
    fn determine_moment_type_simple(&self, scene: &AnalysisScene) -> MomentType {
        // Анализируем характеристики сцены
        if scene.has_faces && !scene.persons_present.is_empty() {
            MomentType::Emotional
        } else if scene.motion_level > 0.7 {
            MomentType::Action
        } else if scene.quality_score > 0.8 && scene.composition_score > 0.7 {
            MomentType::Visual
        } else if scene.energy_level > 0.6 {
            MomentType::Highlight
        } else {
            MomentType::Audio // Default fallback
        }
    }

    /// Получение статистики по найденным моментам
    pub fn get_moments_statistics(&self, moments: &[KeyMoment]) -> MomentsStatistics {
        let mut stats = MomentsStatistics {
            total_moments: moments.len(),
            by_type: std::collections::HashMap::new(),
            average_importance: 0.0,
            highest_importance: 0.0,
            timeline_coverage: 0.0,
        };

        if moments.is_empty() {
            return stats;
        }

        // Подсчет по типам
        for moment in moments {
            *stats.by_type.entry(moment.moment_type.clone()).or_insert(0) += 1;
        }

        // Статистика важности
        let total_importance: f32 = moments.iter().map(|m| m.importance_score).sum();
        stats.average_importance = total_importance / moments.len() as f32;
        stats.highest_importance = moments.iter()
            .map(|m| m.importance_score)
            .fold(0.0f32, f32::max);

        // Timeline coverage - процент времени покрытого ключевыми моментами
        let total_moment_duration: f32 = moments.iter().map(|m| m.duration).sum();
        let total_timeline_duration: f32 = moments.iter()
            .map(|m| m.timestamp + m.duration)
            .fold(0.0f32, f32::max);
        
        if total_timeline_duration > 0.0 {
            stats.timeline_coverage = (total_moment_duration / total_timeline_duration) * 100.0;
        }

        stats
    }
}

/// Статистика по ключевым моментам
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MomentsStatistics {
    pub total_moments: usize,
    pub by_type: std::collections::HashMap<MomentType, usize>,
    pub average_importance: f32,
    pub highest_importance: f32,
    pub timeline_coverage: f32, // Процент времени
}

impl Default for MomentAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}
