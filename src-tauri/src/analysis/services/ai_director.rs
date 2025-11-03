/**
 * AI Director - Главный координатор всех анализов
 *
 * Оркестрирует все движки анализа:
 * 1. SceneEngine - детекция и анализ сцен
 * 2. VisionService - анализ изображений, объектов, лиц
 * 3. MomentEngine - детекция ключевых моментов
 * 4. ContentEngine - классификация контента, композиция, качество
 * 5. UnifiedAudioAnalyzer - унифицированный аудио анализ
 *
 * Возвращает объединенный результат со всеми insights
 */
use anyhow::Result;
use log::{info, warn};
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::analysis::engines::content_engine::{
  CompositionScore, ContentClassification, MoodAnalysis, QualityScore,
};
use crate::analysis::engines::{ContentEngine, MomentEngine, SceneEngine};
use crate::analysis::services::unified_audio_analyzer::UnifiedAudioAnalyzer;
use crate::analysis::types::unified_types::{
  AudioCharacteristics, KeyMoment, SceneAnalysis, SceneType, VisualCharacteristics,
};
use crate::analysis::types::{
  AudioPerformanceMode, UnifiedAudioAnalysisResult, UnifiedAudioConfig,
};

/// Результат полного анализа через AI Director
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct ComprehensiveAnalysisResult {
  /// ID анализа
  pub analysis_id: String,

  /// Статус анализа
  pub status: AnalysisStatus,

  /// Unified audio analysis результат
  pub audio_analysis: Option<UnifiedAudioAnalysisResult>,

  /// Scene analysis результат
  pub scene_analysis: Option<SceneAnalysisResult>,

  /// Vision analysis результат
  pub vision_analysis: Option<VisionAnalysisResult>,

  /// Moment detection результат
  pub moment_analysis: Option<MomentAnalysisResult>,

  /// Content analysis результат
  pub content_analysis: Option<ContentAnalysisResult>,

  /// Объединенные insights
  pub combined_insights: AnalysisInsights,

  /// Производительность
  pub performance_metrics: PerformanceMetrics,

  /// Рекомендации для монтажа
  pub editing_recommendations: Vec<EditingRecommendation>,

  /// Ошибки (если были)
  pub errors: Vec<String>,

  /// Метаданные анализа
  pub metadata: AnalysisMetadata,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub enum AnalysisStatus {
  Pending,
  InProgress,
  Completed,
  Failed,
  PartiallyCompleted,
}

/// Результаты Scene Analysis
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct SceneAnalysisResult {
  pub scenes: Vec<SceneAnalysis>,
  pub total_scenes: u32,
  pub avg_scene_duration: f64,
  pub scene_types_distribution: std::collections::HashMap<String, u32>,
}

/// Результаты Vision Analysis
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct VisionAnalysisResult {
  pub objects_detected: Vec<String>,
  pub faces_count: u32,
  pub avg_composition_score: f64,
  pub visual_quality_avg: f64,
}

/// Результаты Moment Detection
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct MomentAnalysisResult {
  pub key_moments: Vec<KeyMoment>,
  pub total_moments: u32,
  pub moment_types_distribution: std::collections::HashMap<String, u32>,
  pub avg_importance: f64,
}

/// Результаты Content Analysis
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct ContentAnalysisResult {
  pub classification: ContentClassification,
  pub mood: MoodAnalysis,
  pub quality: QualityScore,
  pub avg_composition: CompositionScore,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct AnalysisInsights {
  /// Ключевые моменты для монтажа
  pub key_moments: Vec<KeyMomentInsight>,

  /// Эмоциональная карта
  pub emotional_timeline: Vec<EmotionalSegment>,

  /// Рекомендуемые переходы
  pub transitions: Vec<TransitionRecommendation>,

  /// Общий анализ качества
  pub overall_quality: f64,

  /// Основные темы/объекты
  pub main_subjects: Vec<String>,

  /// Настроение контента
  pub content_mood: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct KeyMomentInsight {
  pub timestamp: f64,
  pub duration: f64,
  pub importance: f64,
  pub reason: String,
  pub moment_type: String,
  pub audio_contribution: f64,
  pub visual_contribution: f64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct EmotionalSegment {
  pub start_time: f64,
  pub end_time: f64,
  pub emotion: String,
  pub intensity: f64,
  pub audio_emotion: Option<String>,
  pub visual_emotion: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct TransitionRecommendation {
  pub from_timestamp: f64,
  pub to_timestamp: f64,
  pub transition_type: String,
  pub confidence: f64,
  pub reasoning: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct EditingRecommendation {
  pub recommendation_type: String,
  pub description: String,
  pub priority: f64,
  pub timestamp: Option<f64>,
  pub duration: Option<f64>,
  #[serde(skip)]
  #[specta(skip)]
  pub parameters: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct PerformanceMetrics {
  pub total_processing_time: u32,
  pub audio_analysis_time: u32,
  pub scene_analysis_time: u32,
  pub vision_analysis_time: u32,
  pub moment_analysis_time: u32,
  pub content_analysis_time: u32,
  pub integration_time: u32,
  pub memory_used: u32,
  pub success_rate: f64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct AnalysisMetadata {
  pub analysis_version: String,
  pub processing_time_ms: u32,
  pub config_used: String,
  pub engines_used: Vec<String>,
  pub total_engines_available: u32,
  pub analysis_timestamp: String,
  pub success_rate: f64,
}

/// Конфигурация для AI Director анализа
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct AIDirectorConfig {
  /// Режим производительности
  pub performance_mode: AudioPerformanceMode,

  /// Включить аудио анализ
  pub enable_audio_analysis: bool,

  /// Включить детекцию сцен
  pub enable_scene_detection: bool,

  /// Включить анализ видео
  pub enable_video_analysis: bool,

  /// Включить анализ изображений
  pub enable_vision_analysis: bool,

  /// Включить детекцию лиц
  pub enable_face_detection: bool,

  /// Включить анализ лиц
  pub enable_face_analysis: bool,

  /// Включить детекцию объектов
  pub enable_object_detection: bool,

  /// Включить анализ объектов
  pub enable_object_analysis: bool,

  /// Включить анализ эмоций
  pub enable_emotion_analysis: bool,

  /// Включить детекцию ключевых моментов
  pub enable_moment_detection: bool,

  /// Включить классификацию контента
  pub enable_content_classification: bool,

  /// Включить анализ композиции
  pub enable_composition_analysis: bool,

  /// Включить анализ настроения
  pub enable_mood_analysis: bool,

  /// Включить анализ качества
  pub enable_quality_analysis: bool,

  /// Максимальное время обработки (секунды)
  pub max_processing_time: Option<u32>,

  /// Порог качества
  pub quality_threshold: f64,

  /// Максимальное количество ключевых моментов
  pub max_key_moments: Option<u32>,

  /// Включить кэширование
  pub enable_caching: bool,

  /// Генерировать рекомендации для монтажа
  pub generate_editing_recommendations: bool,

  /// Включить MCP агенты
  pub enable_mcp_agents: bool,
}

impl Default for AIDirectorConfig {
  fn default() -> Self {
    Self {
      performance_mode: AudioPerformanceMode::Balanced,
      enable_audio_analysis: true,
      enable_scene_detection: true,
      enable_video_analysis: true,
      enable_vision_analysis: true,
      enable_face_detection: true,
      enable_face_analysis: true,
      enable_object_detection: true,
      enable_object_analysis: true,
      enable_emotion_analysis: true,
      enable_moment_detection: true,
      enable_content_classification: true,
      enable_composition_analysis: true,
      enable_mood_analysis: true,
      enable_quality_analysis: true,
      max_processing_time: Some(300), // 5 минут
      quality_threshold: 50.0,
      max_key_moments: Some(50),
      enable_caching: true,
      generate_editing_recommendations: true,
      enable_mcp_agents: false,
    }
  }
}

/// AI Director - главный координатор анализа
pub struct AIDirector {
  /// Unified audio analyzer
  unified_audio_analyzer: Arc<UnifiedAudioAnalyzer>,

  /// Scene analysis engine
  scene_engine: Arc<RwLock<SceneEngine>>,

  /// Moment detection engine
  moment_engine: Arc<RwLock<MomentEngine>>,

  /// Content analysis engine
  content_engine: Arc<RwLock<ContentEngine>>,

  /// Конфигурация по умолчанию
  default_config: AIDirectorConfig,
}

impl AIDirector {
  /// Создание нового AI Director
  pub fn new() -> Self {
    let unified_audio_analyzer = Arc::new(UnifiedAudioAnalyzer::new());
    let scene_engine = Arc::new(RwLock::new(SceneEngine::new()));
    let moment_engine = Arc::new(RwLock::new(MomentEngine::new()));
    let content_engine = Arc::new(RwLock::new(ContentEngine::new()));

    Self {
      unified_audio_analyzer,
      scene_engine,
      moment_engine,
      content_engine,
      default_config: AIDirectorConfig::default(),
    }
  }

  /// Создание с кастомной конфигурацией
  pub fn with_config(config: AIDirectorConfig) -> Self {
    let mut director = Self::new();
    director.default_config = config;
    director
  }

  /// ГЛАВНАЯ ФУНКЦИЯ: Comprehensive анализ медиафайла
  /// Это то что вызывается когда пользователь нажимает "анализировать видео"
  pub async fn analyze_media_comprehensive(
    &self,
    media_path: &Path,
    config_opt: Option<AIDirectorConfig>,
  ) -> Result<ComprehensiveAnalysisResult> {
    let config = config_opt.unwrap_or_else(|| self.default_config.clone());
    let analysis_id = Uuid::new_v4().to_string();
    let start_time = Instant::now();

    info!(
      "AI Director starting comprehensive analysis for: {:?}",
      media_path
    );
    info!(
      "Analysis config: audio={}, scene={}, vision={}, moment={}, content={}",
      config.enable_audio_analysis,
      config.enable_scene_detection,
      config.enable_vision_analysis,
      config.enable_moment_detection,
      config.enable_content_classification
    );

    let mut result = ComprehensiveAnalysisResult {
      analysis_id: analysis_id.clone(),
      status: AnalysisStatus::InProgress,
      audio_analysis: None,
      scene_analysis: None,
      vision_analysis: None,
      moment_analysis: None,
      content_analysis: None,
      combined_insights: AnalysisInsights {
        key_moments: Vec::new(),
        emotional_timeline: Vec::new(),
        transitions: Vec::new(),
        overall_quality: 0.0,
        main_subjects: Vec::new(),
        content_mood: "neutral".to_string(),
      },
      performance_metrics: PerformanceMetrics {
        total_processing_time: 0,
        audio_analysis_time: 0,
        scene_analysis_time: 0,
        vision_analysis_time: 0,
        moment_analysis_time: 0,
        content_analysis_time: 0,
        integration_time: 0,
        memory_used: 0,
        success_rate: 0.0,
      },
      editing_recommendations: Vec::new(),
      errors: Vec::new(),
      metadata: AnalysisMetadata {
        analysis_version: "4.0-unified-engines".to_string(),
        processing_time_ms: 0,
        config_used: serde_json::to_string(&config).unwrap_or_default(),
        engines_used: Vec::new(),
        total_engines_available: 0,
        analysis_timestamp: chrono::Utc::now().to_rfc3339(),
        success_rate: 0.0,
      },
    };

    let mut success_count = 0;
    let mut total_engines = 0;

    // 1. AUDIO ANALYSIS (если включен)
    if config.enable_audio_analysis {
      total_engines += 1;
      let audio_start = Instant::now();

      info!("Running unified audio analysis...");
      match self.run_unified_audio_analysis(media_path, &config).await {
        Ok(audio_result) => {
          result.audio_analysis = Some(audio_result);
          result
            .metadata
            .engines_used
            .push("unified_audio".to_string());
          success_count += 1;
          info!("Unified audio analysis completed successfully");
        }
        Err(e) => {
          let error_msg = format!("Audio analysis failed: {}", e);
          warn!("{}", error_msg);
          result.errors.push(error_msg);
        }
      }

      result.performance_metrics.audio_analysis_time = audio_start.elapsed().as_millis() as u32;
    }

    // Store scenes for later use
    let mut all_scenes: Vec<SceneAnalysis> = Vec::new();

    // 2. SCENE DETECTION (если включен)
    if config.enable_scene_detection {
      total_engines += 1;
      let scene_start = Instant::now();

      info!("Running scene detection...");
      match self.run_scene_detection(media_path, &config).await {
        Ok(scenes) => {
          all_scenes = scenes.clone();

          let scene_result = SceneAnalysisResult {
            total_scenes: scenes.len() as u32,
            avg_scene_duration: scenes.iter().map(|s| s.duration).sum::<f64>()
              / scenes.len().max(1) as f64,
            scene_types_distribution: scenes.iter().fold(
              std::collections::HashMap::new(),
              |mut acc, s| {
                *acc.entry(format!("{:?}", s.scene_type)).or_insert(0) += 1;
                acc
              },
            ),
            scenes,
          };

          result.scene_analysis = Some(scene_result);
          result
            .metadata
            .engines_used
            .push("scene_engine".to_string());
          success_count += 1;
          info!("Scene detection completed successfully");
        }
        Err(e) => {
          let error_msg = format!("Scene detection failed: {}", e);
          warn!("{}", error_msg);
          result.errors.push(error_msg);
        }
      }

      result.performance_metrics.scene_analysis_time = scene_start.elapsed().as_millis() as u32;
    }

    // 3. VISION ANALYSIS (если включен и есть сцены)
    if config.enable_vision_analysis && !all_scenes.is_empty() {
      total_engines += 1;
      let vision_start = Instant::now();

      info!("Running vision analysis...");
      match self.run_vision_analysis(&all_scenes, &config).await {
        Ok(vision_result) => {
          result.vision_analysis = Some(vision_result);
          result
            .metadata
            .engines_used
            .push("vision_service".to_string());
          success_count += 1;
          info!("Vision analysis completed successfully");
        }
        Err(e) => {
          let error_msg = format!("Vision analysis failed: {}", e);
          warn!("{}", error_msg);
          result.errors.push(error_msg);
        }
      }

      result.performance_metrics.vision_analysis_time = vision_start.elapsed().as_millis() as u32;
    }

    // 4. MOMENT DETECTION (если включен и есть сцены)
    if config.enable_moment_detection && !all_scenes.is_empty() {
      total_engines += 1;
      let moment_start = Instant::now();

      info!("Running moment detection...");
      match self.run_moment_detection(&all_scenes, &config).await {
        Ok(moments) => {
          let moment_result = MomentAnalysisResult {
            total_moments: moments.len() as u32,
            avg_importance: moments.iter().map(|m| m.importance_score).sum::<f64>()
              / moments.len().max(1) as f64,
            moment_types_distribution: moments.iter().fold(
              std::collections::HashMap::new(),
              |mut acc, m| {
                *acc.entry(format!("{:?}", m.moment_type)).or_insert(0) += 1;
                acc
              },
            ),
            key_moments: moments,
          };

          result.moment_analysis = Some(moment_result);
          result
            .metadata
            .engines_used
            .push("moment_engine".to_string());
          success_count += 1;
          info!("Moment detection completed successfully");
        }
        Err(e) => {
          let error_msg = format!("Moment detection failed: {}", e);
          warn!("{}", error_msg);
          result.errors.push(error_msg);
        }
      }

      result.performance_metrics.moment_analysis_time = moment_start.elapsed().as_millis() as u32;
    }

    // 5. CONTENT ANALYSIS (если включен и есть сцены)
    if (config.enable_content_classification
      || config.enable_composition_analysis
      || config.enable_mood_analysis
      || config.enable_quality_analysis)
      && !all_scenes.is_empty()
    {
      total_engines += 1;
      let content_start = Instant::now();

      info!("Running content analysis...");
      match self.run_content_analysis(&all_scenes, &config).await {
        Ok(content_result) => {
          result.content_analysis = Some(content_result);
          result
            .metadata
            .engines_used
            .push("content_engine".to_string());
          success_count += 1;
          info!("Content analysis completed successfully");
        }
        Err(e) => {
          let error_msg = format!("Content analysis failed: {}", e);
          warn!("{}", error_msg);
          result.errors.push(error_msg);
        }
      }

      result.performance_metrics.content_analysis_time = content_start.elapsed().as_millis() as u32;
    }

    // 6. INTEGRATION & INSIGHTS GENERATION
    let integration_start = Instant::now();
    info!("Generating combined insights...");

    result.combined_insights = self.generate_combined_insights(&result, &config).await?;

    if config.generate_editing_recommendations {
      result.editing_recommendations = self.generate_editing_recommendations(&result).await?;
    }

    result.performance_metrics.integration_time = integration_start.elapsed().as_millis() as u32;

    // 7. FINALIZATION
    let total_time = start_time.elapsed();
    result.performance_metrics.total_processing_time = total_time.as_millis() as u32;
    result.performance_metrics.success_rate = if total_engines > 0 {
      success_count as f64 / total_engines as f64
    } else {
      0.0
    };

    result.metadata.processing_time_ms = total_time.as_millis() as u32;
    result.metadata.total_engines_available = total_engines;
    result.metadata.success_rate = result.performance_metrics.success_rate;

    result.status = if result.errors.is_empty() {
      AnalysisStatus::Completed
    } else if success_count > 0 {
      AnalysisStatus::PartiallyCompleted
    } else {
      AnalysisStatus::Failed
    };

    info!(
      "AI Director analysis completed: status={:?}, success_rate={:.1}%, time={}ms",
      result.status,
      result.performance_metrics.success_rate * 100.0,
      result.performance_metrics.total_processing_time
    );

    Ok(result)
  }

  /// Запуск unified audio analysis
  async fn run_unified_audio_analysis(
    &self,
    media_path: &Path,
    config: &AIDirectorConfig,
  ) -> Result<UnifiedAudioAnalysisResult> {
    let audio_config = UnifiedAudioConfig {
      enable_ffmpeg_analysis: true,
      enable_montage_analysis: true,
      enable_transcription: matches!(config.performance_mode, AudioPerformanceMode::Quality),
      performance_mode: config.performance_mode.clone(),
      max_processing_time_seconds: config.max_processing_time,
      enable_caching: config.enable_caching,
      ..Default::default()
    };

    self
      .unified_audio_analyzer
      .analyze_comprehensive(media_path, Some(audio_config))
      .await
      .map_err(|e| anyhow::anyhow!("Unified audio analysis failed: {}", e))
  }

  /// Запуск scene detection через SceneEngine
  async fn run_scene_detection(
    &self,
    _media_path: &Path,
    _config: &AIDirectorConfig,
  ) -> Result<Vec<SceneAnalysis>> {
    let _engine = self.scene_engine.read().await;

    // TODO: Реальная детекция сцен из видео
    // Пока возвращаем заглушку
    let file_id = Uuid::new_v4().to_string();

    Ok(vec![SceneAnalysis {
      id: Uuid::new_v4().to_string(),
      file_id: file_id.clone(),
      start_time: 0.0,
      end_time: 30.0,
      duration: 30.0,
      scene_type: SceneType::Action,
      confidence: 0.85,
      key_frames: vec![0.0, 15.0],
      description: Some("Opening scene".to_string()),
      visual: Some(VisualCharacteristics {
        dominant_colors: vec!["#FF0000".to_string()],
        brightness: 0.7,
        contrast: 0.8,
        saturation: 0.6,
        motion_level: 0.3,
        composition_score: 0.75,
        sharpness: 0.85,
        noise_level: 0.2,
      }),
      audio: Some(AudioCharacteristics {
        has_speech: true,
        has_music: true,
        volume_level: 0.7,
        clarity: 0.8,
        dominant_frequencies: vec![440.0],
      }),
      objects: vec!["person".to_string()],
      persons: vec!["speaker1".to_string()],
      transition: None,
    }])
  }

  /// Запуск vision analysis
  async fn run_vision_analysis(
    &self,
    scenes: &[SceneAnalysis],
    _config: &AIDirectorConfig,
  ) -> Result<VisionAnalysisResult> {
    // Агрегируем данные из сцен
    let mut objects_detected = Vec::new();
    let mut faces_count: u32 = 0;
    let mut total_composition = 0.0;
    let mut total_quality = 0.0;
    let mut count = 0;

    for scene in scenes {
      objects_detected.extend(scene.objects.clone());
      faces_count += scene.persons.len() as u32;

      if let Some(visual) = &scene.visual {
        total_composition += visual.composition_score;
        total_quality += (visual.brightness + visual.contrast + visual.sharpness) / 3.0;
        count += 1;
      }
    }

    objects_detected.sort();
    objects_detected.dedup();

    Ok(VisionAnalysisResult {
      objects_detected,
      faces_count,
      avg_composition_score: if count > 0 {
        total_composition / count as f64
      } else {
        0.0
      },
      visual_quality_avg: if count > 0 {
        total_quality / count as f64
      } else {
        0.0
      },
    })
  }

  /// Запуск moment detection через MomentEngine
  async fn run_moment_detection(
    &self,
    scenes: &[SceneAnalysis],
    config: &AIDirectorConfig,
  ) -> Result<Vec<KeyMoment>> {
    let engine = self.moment_engine.read().await;

    let moments = engine.detect_moments(scenes).await?;

    // Применяем лимит если задан
    let limited_moments = if let Some(max_moments) = config.max_key_moments {
      moments.into_iter().take(max_moments as usize).collect()
    } else {
      moments
    };

    Ok(limited_moments)
  }

  /// Запуск content analysis через ContentEngine
  async fn run_content_analysis(
    &self,
    scenes: &[SceneAnalysis],
    config: &AIDirectorConfig,
  ) -> Result<ContentAnalysisResult> {
    let engine = self.content_engine.read().await;

    let mut classification = None;
    let mut mood = None;
    let mut quality = None;
    let mut avg_composition = CompositionScore::default();

    if config.enable_content_classification {
      classification = Some(engine.classify_content(scenes).await?);
    }

    if config.enable_mood_analysis {
      mood = Some(engine.analyze_mood(scenes).await?);
    }

    if config.enable_quality_analysis {
      quality = Some(engine.calculate_quality(scenes).await?);
    }

    if config.enable_composition_analysis {
      let mut total_composition = CompositionScore::default();
      let mut count = 0;

      for scene in scenes {
        if let Some(visual) = &scene.visual {
          if let Ok(score) = engine.analyze_composition(visual).await {
            total_composition.overall += score.overall;
            total_composition.rule_of_thirds += score.rule_of_thirds;
            total_composition.balance += score.balance;
            total_composition.focus_clarity += score.focus_clarity;
            total_composition.symmetry += score.symmetry;
            count += 1;
          }
        }
      }

      if count > 0 {
        let count_f = count as f64;
        avg_composition.overall = total_composition.overall / count_f;
        avg_composition.rule_of_thirds = total_composition.rule_of_thirds / count_f;
        avg_composition.balance = total_composition.balance / count_f;
        avg_composition.focus_clarity = total_composition.focus_clarity / count_f;
        avg_composition.symmetry = total_composition.symmetry / count_f;
      }
    }

    Ok(ContentAnalysisResult {
      classification: classification.unwrap_or_else(|| ContentClassification {
        primary_category: "unknown".to_string(),
        categories: Vec::new(),
        genre: "unknown".to_string(),
        themes: Vec::new(),
        tags: Vec::new(),
        confidence: 0.0,
      }),
      mood: mood.unwrap_or_else(|| MoodAnalysis {
        mood: "neutral".to_string(),
        energy_level: 0.5,
        emotional_intensity: 0.5,
        confidence: 0.0,
      }),
      quality: quality.unwrap_or(QualityScore {
        overall: 0.0,
        visual: 0.0,
        audio: 0.0,
        composition: 0.0,
      }),
      avg_composition,
    })
  }

  /// Генерация объединенных insights
  async fn generate_combined_insights(
    &self,
    result: &ComprehensiveAnalysisResult,
    _config: &AIDirectorConfig,
  ) -> Result<AnalysisInsights> {
    let mut insights = AnalysisInsights {
      key_moments: Vec::new(),
      emotional_timeline: Vec::new(),
      transitions: Vec::new(),
      overall_quality: 0.0,
      main_subjects: Vec::new(),
      content_mood: "neutral".to_string(),
    };

    // Ключевые моменты из moment_analysis
    if let Some(moment_analysis) = &result.moment_analysis {
      for moment in &moment_analysis.key_moments {
        // Вычисляем overall_score из доступных полей MomentScoring
        let overall_score = (moment.scoring.emotion_intensity
          + moment.scoring.visual_quality
          + moment.scoring.audio_clarity
          + moment.scoring.confidence)
          / 4.0;

        insights.key_moments.push(KeyMomentInsight {
          timestamp: moment.timestamp,
          duration: moment.duration,
          importance: moment.importance_score,
          reason: moment.description.clone(),
          moment_type: format!("{:?}", moment.moment_type),
          audio_contribution: overall_score * 0.5,
          visual_contribution: overall_score * 0.5,
        });
      }
    }

    // Добавляем audio-based key moments
    if let Some(audio) = &result.audio_analysis {
      if let Some(montage) = &audio.montage_analysis {
        for segment in &montage.content_segments {
          insights.key_moments.push(KeyMomentInsight {
            timestamp: segment.time_range.start.seconds,
            duration: segment.time_range.end.seconds - segment.time_range.start.seconds,
            importance: segment.confidence,
            reason: format!("{:?} segment detected", segment.content_type),
            moment_type: format!("{:?}", segment.content_type).to_lowercase(),
            audio_contribution: 0.9,
            visual_contribution: 0.1,
          });
        }
      }
    }

    // Качество из content_analysis
    if let Some(content) = &result.content_analysis {
      insights.overall_quality = content.quality.overall;
      insights.content_mood = content.mood.mood.clone();
    }

    // Объекты из vision_analysis
    if let Some(vision) = &result.vision_analysis {
      insights.main_subjects = vision.objects_detected.clone();
    }

    // Сортируем ключевые моменты по важности
    insights.key_moments.sort_by(|a, b| {
      b.importance
        .partial_cmp(&a.importance)
        .unwrap_or(std::cmp::Ordering::Equal)
    });

    Ok(insights)
  }

  /// Генерация рекомендаций для монтажа
  async fn generate_editing_recommendations(
    &self,
    result: &ComprehensiveAnalysisResult,
  ) -> Result<Vec<EditingRecommendation>> {
    let mut recommendations = Vec::new();

    // Рекомендации на основе audio analysis
    if let Some(audio) = &result.audio_analysis {
      if let Some(montage) = &audio.montage_analysis {
        // Рекомендации по silent segments
        for segment in &montage.silence_segments {
          if segment.duration.seconds > 3.0 {
            recommendations.push(EditingRecommendation {
              recommendation_type: "trim_silence".to_string(),
              description: format!(
                "Consider trimming silence from {:.1}s to {:.1}s",
                segment.start_time.seconds, segment.end_time.seconds
              ),
              priority: 0.7,
              timestamp: Some(segment.start_time.seconds),
              duration: Some(segment.duration.seconds),
              parameters: std::collections::HashMap::new(),
            });
          }
        }
      }

      if let Some(ffmpeg) = &audio.ffmpeg_analysis {
        // Рекомендации по volume
        if ffmpeg.volume_analysis.peak_volume.level < 0.3 {
          recommendations.push(EditingRecommendation {
            recommendation_type: "boost_audio".to_string(),
            description: "Audio levels are low, consider boosting volume".to_string(),
            priority: 0.8,
            timestamp: None,
            duration: None,
            parameters: {
              let mut params = std::collections::HashMap::new();
              params.insert(
                "boost_db".to_string(),
                serde_json::Value::Number(serde_json::Number::from_f64(6.0).unwrap()),
              );
              params
            },
          });
        }
      }
    }

    // Рекомендации на основе content analysis
    if let Some(content) = &result.content_analysis {
      if content.quality.overall < 60.0 {
        recommendations.push(EditingRecommendation {
          recommendation_type: "enhance_quality".to_string(),
          description: "Overall quality is low, consider applying enhancement filters".to_string(),
          priority: 0.6,
          timestamp: None,
          duration: None,
          parameters: std::collections::HashMap::new(),
        });
      }
    }

    // Сортируем по приоритету
    recommendations.sort_by(|a, b| {
      b.priority
        .partial_cmp(&a.priority)
        .unwrap_or(std::cmp::Ordering::Equal)
    });

    Ok(recommendations)
  }

  /// Быстрый анализ (только основные метрики)
  pub async fn analyze_media_quick(
    &self,
    media_path: &Path,
  ) -> Result<ComprehensiveAnalysisResult> {
    let config = AIDirectorConfig {
      performance_mode: AudioPerformanceMode::Fast,
      enable_audio_analysis: true,
      enable_scene_detection: false,
      enable_vision_analysis: false,
      enable_face_detection: false,
      enable_object_detection: false,
      enable_moment_detection: false,
      enable_content_classification: false,
      enable_composition_analysis: false,
      enable_mood_analysis: false,
      enable_quality_analysis: false,
      max_processing_time: Some(30),
      generate_editing_recommendations: false,
      ..Default::default()
    };

    self
      .analyze_media_comprehensive(media_path, Some(config))
      .await
  }

  /// Получение системных возможностей
  pub async fn get_system_capabilities(&self) -> Result<SystemCapabilities> {
    let audio_caps = self
      .unified_audio_analyzer
      .check_system_capabilities()
      .await;

    Ok(SystemCapabilities {
      audio_analysis: audio_caps.ffmpeg_available,
      video_analysis: true,
      scene_detection: true,
      vision_analysis: true,
      face_recognition: true,
      object_detection: true,
      moment_detection: true,
      content_classification: true,
      transcription: audio_caps.whisper_available,
      gpu_acceleration: audio_caps.gpu_acceleration_available,
    })
  }
}

impl Default for AIDirector {
  fn default() -> Self {
    Self::new()
  }
}

/// Системные возможности AI Director
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct SystemCapabilities {
  pub audio_analysis: bool,
  pub video_analysis: bool,
  pub scene_detection: bool,
  pub vision_analysis: bool,
  pub face_recognition: bool,
  pub object_detection: bool,
  pub moment_detection: bool,
  pub content_classification: bool,
  pub transcription: bool,
  pub gpu_acceleration: bool,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_ai_director_creation() {
    let director = AIDirector::new();
    assert!(Arc::strong_count(&director.unified_audio_analyzer) == 1);
    assert!(Arc::strong_count(&director.scene_engine) == 1);
  }

  #[test]
  fn test_ai_director_config_default() {
    let config = AIDirectorConfig::default();
    assert!(config.enable_audio_analysis);
    assert!(config.enable_scene_detection);
    assert_eq!(config.performance_mode, AudioPerformanceMode::Balanced);
  }

  #[tokio::test]
  async fn test_system_capabilities() {
    let director = AIDirector::new();
    let caps = director.get_system_capabilities().await;
    assert!(caps.is_ok());

    let caps = caps.unwrap();
    assert!(caps.video_analysis);
    assert!(caps.scene_detection);
    assert!(caps.moment_detection);
  }
}
