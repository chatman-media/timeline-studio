// Analysis models - расширения для существующей архитектуры

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

// Импортируем типы из существующей person database
use crate::recognition::types_professional::*;

// Дополнительные типы для совместимости
pub type Timestamp = f32;
pub type ConfidenceLevel = f32;
pub type QualityScore = f32;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
  pub width: u32,
  pub height: u32,
}

/// Проект анализа - связывает медиафайлы с результатами анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisProject {
  pub id: Uuid,
  pub name: String,
  pub description: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // Статус анализа
  pub status: AnalysisStatus,
  pub progress: f32, // 0.0 - 1.0
  pub error_message: Option<String>,

  // Конфигурация анализа
  pub config: AnalysisConfig,

  // Статистика проекта
  pub total_files: u32,
  pub total_duration: f32, // в секундах
  pub processed_files: u32,

  // Результаты анализа (агрегированные)
  pub total_scenes: u32,
  pub total_persons: u32,
  pub total_key_moments: u32,
  pub average_quality: f32,

  // Метаданные
  pub tags: Vec<String>,
  pub location: Option<String>,
  pub recording_date: Option<DateTime<Utc>>,
  pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AnalysisStatus {
  Created,
  Analyzing,
  Completed,
  Failed,
  Cancelled,
}

/// Конфигурация анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisConfig {
  // Модули анализа
  pub enable_scene_detection: bool,
  pub enable_person_recognition: bool,
  pub enable_object_detection: bool,
  pub enable_emotion_analysis: bool,
  pub enable_audio_analysis: bool,
  pub enable_quality_analysis: bool,
  pub enable_text_recognition: bool,

  // Настройки качества
  pub quality_mode: QualityMode,
  pub frame_skip: u32,       // Анализировать каждый N-й кадр
  pub resolution_scale: f32, // Масштаб для анализа (1.0 = оригинал)

  // Пороги детекции
  pub scene_change_threshold: f32,
  pub face_confidence_threshold: f32,
  pub object_confidence_threshold: f32,
  pub motion_detection_threshold: f32,

  // Ограничения производительности
  pub max_processing_time: Option<u32>, // секунды
  pub max_memory_usage: Option<u64>,    // байты
  pub use_gpu: bool,

  // Опции вывода
  pub generate_thumbnails: bool,
  pub generate_previews: bool,
  pub save_keyframes: bool,
  pub include_raw_data: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum QualityMode {
  Fast,     // Быстрый анализ с пониженным качеством
  Balanced, // Баланс скорости и качества
  Quality,  // Максимальное качество
  Custom,   // Пользовательские настройки
}

/// Файл в проекте анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisMediaFile {
  pub id: Uuid,
  pub project_id: Uuid,
  pub file_path: String,
  pub file_name: String,
  pub file_size: u64,

  // Медиа информация
  pub media_type: MediaType,
  pub duration: Option<f32>,
  pub resolution: Option<Resolution>,
  pub fps: Option<f32>,
  pub codec: Option<String>,
  pub format: Option<String>,

  // Статус обработки
  pub processing_status: ProcessingStatus,
  pub processing_progress: f32,
  pub processed_at: Option<DateTime<Utc>>,

  // Результаты анализа
  pub scenes_count: u32,
  pub persons_count: u32,
  pub key_moments_count: u32,
  pub overall_quality: f32,

  // Технические метрики
  pub average_motion: f32,
  pub average_brightness: f32,
  pub audio_clarity: Option<f32>,
  pub has_speech: bool,

  pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MediaType {
  Video,
  Audio,
  Image,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProcessingStatus {
  Pending,
  Processing,
  Completed,
  Failed,
  Skipped,
}

/// Сцена в видео - расширение для существующей архитектуры
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisScene {
  pub id: Uuid,
  pub project_id: Uuid,
  pub file_id: Uuid,

  // Временные границы
  pub start_time: f32,
  pub end_time: f32,
  pub duration: f32,

  // Классификация
  pub scene_type: SceneType,
  pub sub_type: Option<String>,
  pub confidence: ConfidenceLevel,

  // Визуальные характеристики
  pub dominant_colors: Vec<String>, // Hex цвета
  pub brightness: f32,
  pub contrast: f32,
  pub saturation: f32,
  pub motion_level: f32,

  // Композиция
  pub composition_score: f32,
  pub rule_of_thirds_compliance: f32,
  pub visual_balance: f32,

  // Качество
  pub quality_score: QualityScore,
  pub sharpness: f32,
  pub noise_level: f32,
  pub stability: f32,

  // Содержимое (связи с существующими таблицами)
  pub persons_present: Vec<Uuid>,    // ID из person_appearances
  pub objects_detected: Vec<String>, // Классы объектов
  pub has_text: bool,
  pub has_faces: bool,

  // Эмоциональная окраска
  pub emotional_tone: Option<EmotionData>,
  pub energy_level: f32,

  // Описание и теги
  pub auto_description: Option<String>,
  pub user_description: Option<String>,
  pub tags: Vec<String>,
  pub user_rating: Option<u8>, // 1-5

  // Ключевые кадры
  pub representative_frame: f32, // timestamp лучшего кадра
  pub keyframes: Vec<f32>,       // timestamps ключевых кадров

  pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum SceneType {
  Action,       // Действие, движение
  Dialogue,     // Диалог, разговор
  Landscape,    // Пейзаж, природа
  Closeup,      // Крупный план
  Wide,         // Общий план
  Medium,       // Средний план
  Transition,   // Переход между сценами
  Static,       // Статичная сцена
  Dynamic,      // Динамичная сцена
  Establishing, // Establishing shot
  Reaction,     // Реакция персонажа
  Montage,      // Монтажная последовательность
  Unknown,      // Неопределенная
}

/// Ключевой момент - важное событие в видео
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyMoment {
  pub id: Uuid,
  pub project_id: Uuid,
  pub file_id: Uuid,
  pub scene_id: Option<Uuid>, // Связь со сценой

  // Временная позиция
  pub timestamp: f32,
  pub duration: f32,

  // Тип момента
  pub moment_type: MomentType,
  pub sub_type: Option<String>,

  // Оценка важности (общая)
  pub importance_score: f32, // 0.0 - 1.0

  // Детализированные оценки
  pub scoring_factors: ScoringFactors,

  // Контекст момента
  pub description: String,
  pub auto_description: Option<String>,
  pub user_notes: Option<String>,

  // Связанные элементы
  pub involved_persons: Vec<Uuid>,   // ID персон
  pub involved_objects: Vec<String>, // Классы объектов
  pub associated_emotions: Vec<EmotionData>,

  // Классификация по контенту
  pub content_tags: Vec<String>,
  pub mood_tags: Vec<String>,
  pub technical_tags: Vec<String>,

  // Пользовательская оценка
  pub user_rating: Option<u8>, // 1-5
  pub is_bookmarked: bool,
  pub is_hidden: bool,

  // Preview данные
  pub thumbnail_frame: f32, // timestamp для превью
  pub preview_start: f32,   // начало превью
  pub preview_end: f32,     // конец превью

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum MomentType {
  EmotionalPeak,     // Эмоциональный пик
  ActionClimax,      // Кульминация действия
  DialogueHighlight, // Яркий диалог
  VisualStunning,    // Визуально впечатляющий момент
  NarrativeTurning,  // Поворот сюжета
  ComedicMoment,     // Комедийный момент
  DramaticPause,     // Драматическая пауза
  MusicSync,         // Синхронизация с музыкой
  FaceReveal,        // Появление лица
  ObjectFocus,       // Фокус на объекте
  SceneTransition,   // Переход между сценами
  QualityPeak,       // Пик технического качества
  MotionPeak,        // Пик движения
  AudioPeak,         // Аудио акцент
  UserDefined,       // Определен пользователем
}

/// Детализированные факторы оценки момента
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoringFactors {
  // Эмоциональные факторы
  pub emotion_intensity: f32,
  pub emotion_variety: f32,
  pub emotional_change: f32,

  // Визуальные факторы
  pub visual_quality: f32,
  pub composition_quality: f32,
  pub color_vibrancy: f32,
  pub motion_interest: f32,

  // Аудио факторы
  pub audio_clarity: f32,
  pub audio_dynamics: f32,
  pub speech_quality: f32,
  pub music_sync: f32,

  // Контентные факторы
  pub person_prominence: f32,
  pub object_interest: f32,
  pub scene_uniqueness: f32,
  pub narrative_importance: f32,

  // Технические факторы
  pub overall_quality: f32,
  pub stability: f32,
  pub focus_quality: f32,
  pub lighting_quality: f32,

  // Вычисленные метрики
  pub weighted_score: f32,
  pub confidence: f32,
  pub ranking_position: Option<u32>,
}

/// Связь персоны с проектом - расширение существующей person_appearances
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectPersonAssociation {
  pub project_id: Uuid,
  pub person_id: Uuid,

  // Статистика по проекту
  pub total_screen_time: f32,
  pub total_appearances: u32,
  pub scenes_present: u32,
  pub key_moments_involved: u32,

  // Важность в проекте
  pub importance: PersonImportance,
  pub character_role: Option<String>,

  // Временные характеристики
  pub first_appearance: f32,
  pub last_appearance: f32,
  pub most_prominent_scene: Option<Uuid>,

  // Эмоциональная статистика
  pub dominant_emotions: Vec<EmotionData>,
  pub emotional_range: f32,
  pub emotional_stability: f32,

  // Качественные метрики
  pub average_quality: f32,
  pub best_quality_frame: Option<f32>,
  pub lighting_consistency: f32,

  // Пользовательские данные
  pub user_notes: Option<String>,
  pub user_tags: Vec<String>,
  pub is_main_character: bool,
  pub custom_role: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum PersonImportance {
  Primary,    // Главный персонаж
  Secondary,  // Второстепенный
  Supporting, // Вспомогательный
  Background, // Фоновый
  Extra,      // Массовка
  Unknown,    // Неопределена
}

/// План монтажа для collaborative editing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MontagePlan {
  pub id: Uuid,
  pub project_id: Uuid,
  pub name: String,
  pub description: Option<String>,

  // Структура плана
  pub segments: Vec<MontageSegment>,
  pub total_duration: f32,
  pub target_duration: f32,

  // Стиль и настройки
  pub style: MontageStyle,
  pub tempo: MontageTempoSetting,
  pub mood: Option<String>,

  // AI информация
  pub created_by: MontageCreator,
  pub ai_confidence: f32,
  pub ai_reasoning: String,
  pub alternative_count: u32,

  // Версионирование
  pub version: u32,
  pub parent_plan_id: Option<Uuid>,
  pub is_active: bool,

  // Пользовательские правки
  pub user_modifications: u32,
  pub user_approval_status: ApprovalStatus,
  pub user_feedback: Option<String>,

  // Метаданные
  pub export_settings: Option<ExportSettings>,
  pub preview_url: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MontageStyle {
  Dynamic,     // Динамичный стиль
  Calm,        // Спокойный стиль
  Rhythmic,    // Ритмичный стиль
  Cinematic,   // Кинематографический
  Documentary, // Документальный
  Travel,      // Путешествие
  Action,      // Экшн
  Romantic,    // Романтический
  Comedy,      // Комедийный
  Drama,       // Драматический
  Custom,      // Пользовательский
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MontageTempoSetting {
  pub base_bpm: Option<f32>,
  pub tempo_variation: f32, // 0.0 - 1.0
  pub sync_to_music: bool,
  pub adaptive_pacing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MontageCreator {
  Ai,            // Создан ИИ
  User,          // Создан пользователем
  Collaborative, // Совместная работа
  Template,      // На основе шаблона
  Imported,      // Импортирован
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalStatus {
  Pending,       // Ожидает рассмотрения
  Approved,      // Одобрен
  Rejected,      // Отклонен
  NeedsRevision, // Требует доработки
  InReview,      // На рассмотрении
}

/// Сегмент монтажа
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MontageSegment {
  pub id: Uuid,
  pub plan_id: Uuid,

  // Источник
  pub source_file_id: Uuid,
  pub source_scene_id: Option<Uuid>,
  pub source_moment_id: Option<Uuid>,

  // Временные границы в источнике
  pub source_start_time: f32,
  pub source_end_time: f32,
  pub source_duration: f32,

  // Позиция в монтаже
  pub sequence_position: u32,
  pub timeline_start: f32,
  pub timeline_duration: f32,
  pub track_number: u32,

  // Обработка
  pub speed_multiplier: f32, // 1.0 = нормальная скорость
  pub fade_in_duration: f32,
  pub fade_out_duration: f32,

  // Эффекты и коррекция
  pub color_correction: Option<ColorCorrection>,
  pub audio_adjustments: Option<AudioAdjustments>,
  pub visual_effects: Vec<VisualEffect>,

  // AI информация
  pub ai_reason: String, // Почему выбран этот сегмент
  pub ai_confidence: f32,
  pub selection_factors: ScoringFactors,

  // Пользовательские правки
  pub is_user_modified: bool,
  pub user_locked: bool, // Заблокирован от AI изменений
  pub user_notes: Option<String>,

  // Связи
  pub transition_in: Option<TransitionEffect>,
  pub transition_out: Option<TransitionEffect>,
  pub related_segments: Vec<Uuid>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// Настройки цветокоррекции
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColorCorrection {
  pub brightness: f32,          // -1.0 to 1.0
  pub contrast: f32,            // -1.0 to 1.0
  pub saturation: f32,          // -1.0 to 1.0
  pub hue_shift: f32,           // -180.0 to 180.0
  pub gamma: f32,               // 0.1 to 3.0
  pub temperature: f32,         // -1.0 to 1.0 (cold to warm)
  pub tint: f32,                // -1.0 to 1.0 (green to magenta)
  pub shadows: f32,             // -1.0 to 1.0
  pub highlights: f32,          // -1.0 to 1.0
  pub whites: f32,              // -1.0 to 1.0
  pub blacks: f32,              // -1.0 to 1.0
  pub lut_file: Option<String>, // Путь к LUT файлу
}

/// Настройки аудио
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioAdjustments {
  pub volume: f32,          // 0.0 to 2.0 (2.0 = +6dB)
  pub fade_in: f32,         // Длительность fade in
  pub fade_out: f32,        // Длительность fade out
  pub eq_low: f32,          // -24.0 to 24.0 dB
  pub eq_mid: f32,          // -24.0 to 24.0 dB
  pub eq_high: f32,         // -24.0 to 24.0 dB
  pub noise_reduction: f32, // 0.0 to 1.0
  pub normalize: bool,
  pub compressor: Option<CompressorSettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressorSettings {
  pub threshold: f32,   // -60.0 to 0.0 dB
  pub ratio: f32,       // 1.0 to 20.0
  pub attack: f32,      // 0.1 to 100.0 ms
  pub release: f32,     // 10.0 to 5000.0 ms
  pub makeup_gain: f32, // -24.0 to 24.0 dB
}

/// Визуальный эффект
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VisualEffect {
  pub effect_type: EffectType,
  pub intensity: f32, // 0.0 to 1.0
  pub parameters: HashMap<String, serde_json::Value>,
  pub start_time: f32, // Относительно сегмента
  pub duration: f32,
  pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EffectType {
  Blur,
  Sharpen,
  Stabilization,
  NoiseReduction,
  ChromaKey,
  Vignette,
  FilmGrain,
  Glow,
  Distortion,
  Custom,
}

/// Переход между сегментами
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransitionEffect {
  pub transition_type: TransitionType,
  pub duration: f32,
  pub easing: EasingFunction,
  pub parameters: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TransitionType {
  Cut,
  Fade,
  Dissolve,
  Wipe,
  Slide,
  Push,
  Iris,
  Zoom,
  Flip,
  Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EasingFunction {
  Linear,
  EaseIn,
  EaseOut,
  EaseInOut,
  Bounce,
  Elastic,
  Back,
  Custom,
}

/// Настройки экспорта
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSettings {
  pub resolution: Resolution,
  pub fps: f32,
  pub bitrate: u32,   // kbps
  pub codec: String,  // h264, h265, av1, etc.
  pub format: String, // mp4, mov, avi, etc.
  pub quality_preset: QualityPreset,
  pub audio_codec: String, // aac, mp3, etc.
  pub audio_bitrate: u32,  // kbps
  pub two_pass_encoding: bool,
  pub hardware_acceleration: bool,
  pub target_platform: Option<TargetPlatform>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum QualityPreset {
  Draft,      // Быстрый экспорт низкого качества
  Preview,    // Средний предварительный просмотр
  Production, // Производственное качество
  Broadcast,  // Вещательное качество
  Archive,    // Архивное качество
  Custom,     // Пользовательские настройки
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TargetPlatform {
  YouTube,
  TikTok,
  Instagram,
  Facebook,
  Twitter,
  Vimeo,
  Broadcast,
  Cinema,
  Web,
  Mobile,
  Custom,
}

/// Результат поиска в анализе
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisSearchResult {
  pub result_type: SearchResultType,
  pub relevance_score: f32,
  pub highlight: String,
  pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SearchResultType {
  Scene,
  Person,
  KeyMoment,
  File,
  Project,
  MontagePlan,
}

/// Прогресс анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisProgress {
  pub project_id: Uuid,
  pub overall_progress: f32, // 0.0 - 1.0
  pub current_stage: AnalysisStage,
  pub current_file: Option<String>,
  pub files_completed: u32,
  pub files_total: u32,
  pub estimated_time_remaining: Option<u32>, // секунды
  pub stages_progress: HashMap<AnalysisStage, f32>,
  pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Hash, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AnalysisStage {
  Initialization,
  MediaAnalysis,
  SceneDetection,
  PersonRecognition,
  EmotionAnalysis,
  QualityAnalysis,
  AudioAnalysis,
  KeyMomentDetection,
  DataAggregation,
  IndexGeneration,
  Finalization,
}

pub type AnalysisResult<T> = Result<T, AnalysisError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AnalysisError {
  Database(String),
  FileNotFound(String),
  InvalidMediaFormat(String),
  Processing(String),
  AiService(String),
  Configuration(String),
  ResourceExhausted(String),
  Cancelled,
  Unknown(String),
}

impl std::fmt::Display for AnalysisError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      AnalysisError::Database(msg) => write!(f, "Database error: {}", msg),
      AnalysisError::FileNotFound(msg) => write!(f, "File not found: {}", msg),
      AnalysisError::InvalidMediaFormat(msg) => write!(f, "Invalid media format: {}", msg),
      AnalysisError::Processing(msg) => write!(f, "Processing error: {}", msg),
      AnalysisError::AiService(msg) => write!(f, "AI service error: {}", msg),
      AnalysisError::Configuration(msg) => write!(f, "Configuration error: {}", msg),
      AnalysisError::ResourceExhausted(msg) => write!(f, "Resource exhausted: {}", msg),
      AnalysisError::Cancelled => write!(f, "Operation cancelled"),
      AnalysisError::Unknown(msg) => write!(f, "Unknown error: {}", msg),
    }
  }
}

impl std::error::Error for AnalysisError {}
