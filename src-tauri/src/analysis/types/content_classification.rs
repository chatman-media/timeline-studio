//! Content Classification Types
//!
//! Типы для классификации видео контента по множественным категориям

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use uuid::Uuid;

/// Расширенная классификация контента
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExtendedContentClassification {
  /// ID классификации
  pub id: Uuid,
  /// ID проекта
  pub project_id: Uuid,
  /// ID медиафайла
  pub file_id: Uuid,
  /// Базовая классификация
  pub base: BaseContentClassification,
  /// Подкатегории
  pub subcategories: SubcategoryClassification,
  /// Теги контента
  pub content_tags: Vec<ContentTag>,
  /// Анализ настроения
  pub mood_analysis: MoodAnalysis,
  /// Рекомендации по таргетингу
  pub targeting_recommendations: Vec<TargetingRecommendation>,
  /// Пригодность для платформ
  pub platform_suitability: PlatformSuitability,
  /// Маркетинговый потенциал
  pub marketing_potential: MarketingPotential,
  /// Оценка доступности
  pub accessibility_score: AccessibilityScore,
  /// Время создания
  pub created_at: DateTime<Utc>,
}

/// Базовая классификация контента
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BaseContentClassification {
  /// Жанр
  pub genre: ContentGenre,
  /// Стиль
  pub style: ContentStyle,
  /// Эмоциональная окраска
  pub emotion: ContentEmotion,
  /// Целевая аудитория
  pub audience: TargetAudience,
  /// Уровень технического качества (0-100)
  pub technical_quality: f64,
  /// Уровень доверия классификации (0-1)
  pub confidence: f64,
}

/// Жанры контента
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum ContentGenre {
  Documentary,
  Narrative,
  Instructional,
  Promotional,
  Entertainment,
  News,
  Educational,
  Corporate,
  Personal,
  Artistic,
}

/// Стили контента
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum ContentStyle {
  Professional,
  Casual,
  Artistic,
  Minimalist,
  Dynamic,
  Static,
  Vintage,
  Modern,
}

/// Эмоциональная окраска
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum ContentEmotion {
  Positive,
  Negative,
  Neutral,
  Dramatic,
  Humorous,
  Inspiring,
  Melancholic,
  Energetic,
}

/// Целевая аудитория
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum TargetAudience {
  Children,
  Teenagers,
  YoungAdults,
  Adults,
  Seniors,
  Professionals,
  General,
  Niche,
}

/// Подкатегории классификации
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SubcategoryClassification {
  /// Жанр
  pub genre: GenreSubcategory,
  /// Стиль
  pub style: StyleSubcategory,
  /// Нарратив
  pub narrative: NarrativeSubcategory,
}

/// Подкатегории жанра
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GenreSubcategory {
  /// Основной жанр
  pub primary: String,
  /// Вторичные жанры
  pub secondary: Vec<String>,
  /// Уверенность для каждого жанра
  pub confidence: HashMap<String, f64>,
}

/// Подкатегории стиля
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct StyleSubcategory {
  /// Кинематография
  pub cinematography: String,
  /// Монтаж
  pub editing: String,
  /// Цвет
  pub color: String,
  /// Аудио
  pub audio: String,
}

/// Подкатегории нарратива
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct NarrativeSubcategory {
  /// Структура
  pub structure: String,
  /// Темп
  pub pacing: String,
  /// Сложность
  pub complexity: String,
}

/// Тег контента
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ContentTag {
  /// Тег
  pub tag: String,
  /// Категория
  pub category: TagCategory,
  /// Уверенность (0-1)
  pub confidence: f64,
  /// Важность
  pub importance: TagImportance,
  /// Контекст
  pub context: Option<String>,
}

/// Категории тегов
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum TagCategory {
  Visual,
  Audio,
  Narrative,
  Technical,
  Emotional,
}

/// Важность тега
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum TagImportance {
  High,
  Medium,
  Low,
}

/// Анализ настроения
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MoodAnalysis {
  /// Основное настроение
  pub primary: String,
  /// Вторичные настроения
  pub secondary: Vec<String>,
  /// Валентность: -1 (негативное) до 1 (позитивное)
  pub valence: f64,
  /// Возбуждение: 0 (спокойное) до 1 (возбужденное)
  pub arousal: f64,
  /// Доминирование: 0 (подчиненное) до 1 (доминирующее)
  pub dominance: f64,
  /// Эмоциональная дуга
  pub emotional_arc: Vec<EmotionalPoint>,
}

/// Точка эмоциональной дуги
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct EmotionalPoint {
  /// Временная метка (секунды)
  pub timestamp: f64,
  /// Эмоция
  pub emotion: String,
  /// Интенсивность (0-1)
  pub intensity: f64,
  /// Уверенность (0-1)
  pub confidence: f64,
}

/// Рекомендация по таргетингу
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TargetingRecommendation {
  /// Демографическая группа
  pub demographic: String,
  /// Пригодность (0-1)
  pub suitability: f64,
  /// Обоснование
  pub reasoning: String,
  /// Рекомендуемые корректировки
  pub adjustments: Option<Vec<String>>,
}

/// Пригодность для платформ
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PlatformSuitability {
  pub youtube: PlatformScore,
  pub tiktok: PlatformScore,
  pub instagram: PlatformScore,
  pub facebook: PlatformScore,
  pub twitter: PlatformScore,
  pub linkedin: PlatformScore,
  pub telegram: PlatformScore,
}

/// Оценка для платформы
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PlatformScore {
  /// Оценка (0-100)
  pub score: f64,
  /// Обоснование
  pub reasoning: String,
  /// Предложения по оптимизации
  pub optimization_suggestions: Vec<String>,
  /// Лучшие временные слоты для публикации
  pub best_time_slots: Option<Vec<String>>,
}

/// Маркетинговый потенциал
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MarketingPotential {
  /// Вирусный потенциал (0-100)
  pub viral_potential: f64,
  /// Прогноз вовлеченности (0-100)
  pub engagement_prediction: f64,
  /// Оценка возможности поделиться (0-100)
  pub shareability_score: f64,
  /// Потенциал конверсии (0-100)
  pub conversion_potential: f64,
  /// Возможности для брендинга
  pub branding_opportunities: Vec<String>,
  /// Предложения призыва к действию
  pub call_to_action_suggestions: Vec<String>,
}

/// Оценка доступности
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AccessibilityScore {
  /// Общая оценка (0-100)
  pub overall_score: f64,
  /// Визуальная доступность (0-100)
  pub visual_accessibility: f64,
  /// Аудио доступность (0-100)
  pub audio_accessibility: f64,
  /// Когнитивная доступность (0-100)
  pub cognitive_accessibility: f64,
  /// Рекомендации
  pub recommendations: Vec<String>,
}

/// Опции классификации контента
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ContentClassificationOptions {
  /// Включить подкатегории
  pub include_subcategories: bool,
  /// Анализировать настроение
  pub analyze_mood: bool,
  /// Включить таргетинг
  pub include_targeting: bool,
  /// Анализировать платформы
  pub analyze_platforms: bool,
  /// Включить маркетинг
  pub include_marketing: bool,
  /// Анализировать доступность
  pub analyze_accessibility: bool,
}

impl Default for ContentClassificationOptions {
  fn default() -> Self {
    Self {
      include_subcategories: true,
      analyze_mood: true,
      include_targeting: true,
      analyze_platforms: true,
      include_marketing: true,
      analyze_accessibility: true,
    }
  }
}
