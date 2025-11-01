// Database migrations - создание схемы для системы анализа

use anyhow::{Context, Result};
use rusqlite::Connection;

/// Выполнение всех миграций для анализа
pub fn run_all_migrations(conn: &Connection) -> Result<()> {
  // Включаем поддержку внешних ключей
  conn.execute("PRAGMA foreign_keys = ON", [])?;

  // Создаем таблицу версий миграций
  create_migration_table(conn)?;

  // Проверяем текущую версию
  let current_version = get_current_version(conn)?;

  // Выполняем миграции по порядку
  if current_version < 1 {
    migration_001_create_analysis_tables(conn)?;
    set_version(conn, 1)?;
  }

  if current_version < 2 {
    migration_002_add_analysis_indices(conn)?;
    set_version(conn, 2)?;
  }

  if current_version < 3 {
    migration_003_add_analysis_triggers(conn)?;
    set_version(conn, 3)?;
  }

  log::info!("All analysis database migrations completed successfully");
  Ok(())
}

/// Создание таблицы версий миграций
fn create_migration_table(conn: &Connection) -> Result<()> {
  conn.execute(
    "CREATE TABLE IF NOT EXISTS analysis_schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
    [],
  )?;
  Ok(())
}

/// Получение текущей версии схемы
fn get_current_version(conn: &Connection) -> Result<i64> {
  let version = conn
    .query_row(
      "SELECT COALESCE(MAX(version), 0) FROM analysis_schema_version",
      [],
      |row| row.get(0),
    )
    .unwrap_or(0);
  Ok(version)
}

/// Установка версии схемы
fn set_version(conn: &Connection, version: i64) -> Result<()> {
  conn.execute(
    "INSERT INTO analysis_schema_version (version) VALUES (?)",
    [version],
  )?;
  Ok(())
}

/// Миграция 001: Создание основных таблиц анализа
fn migration_001_create_analysis_tables(conn: &Connection) -> Result<()> {
  log::info!("Running migration 001: Creating analysis tables");

  // Таблица проектов анализа
  conn.execute(
        "CREATE TABLE IF NOT EXISTS analysis_projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('created', 'analyzing', 'completed', 'failed', 'cancelled')),
            progress REAL NOT NULL DEFAULT 0.0 CHECK (progress >= 0.0 AND progress <= 1.0),
            error_message TEXT,
            config TEXT NOT NULL DEFAULT '{}', -- JSON
            total_files INTEGER NOT NULL DEFAULT 0,
            total_duration REAL NOT NULL DEFAULT 0.0,
            processed_files INTEGER NOT NULL DEFAULT 0,
            total_scenes INTEGER NOT NULL DEFAULT 0,
            total_persons INTEGER NOT NULL DEFAULT 0,
            total_key_moments INTEGER NOT NULL DEFAULT 0,
            average_quality REAL DEFAULT 0.0,
            tags TEXT NOT NULL DEFAULT '[]', -- JSON array
            location TEXT,
            recording_date TEXT, -- ISO 8601 datetime
            metadata TEXT NOT NULL DEFAULT '{}' -- JSON
        )",
        [],
    ).context("Failed to create analysis_projects table")?;

  // Таблица медиафайлов проекта
  conn.execute(
        "CREATE TABLE IF NOT EXISTS analysis_media_files (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES analysis_projects(id) ON DELETE CASCADE,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            media_type TEXT NOT NULL CHECK (media_type IN ('video', 'audio', 'image')),
            duration REAL,
            resolution_width INTEGER,
            resolution_height INTEGER,
            fps REAL,
            codec TEXT,
            format TEXT,
            processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
            processing_progress REAL NOT NULL DEFAULT 0.0 CHECK (processing_progress >= 0.0 AND processing_progress <= 1.0),
            processed_at TEXT, -- ISO 8601 datetime
            scenes_count INTEGER NOT NULL DEFAULT 0,
            persons_count INTEGER NOT NULL DEFAULT 0,
            key_moments_count INTEGER NOT NULL DEFAULT 0,
            overall_quality REAL DEFAULT 0.0,
            average_motion REAL DEFAULT 0.0,
            average_brightness REAL DEFAULT 0.0,
            audio_clarity REAL,
            has_speech BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TEXT NOT NULL
        )",
        [],
    ).context("Failed to create analysis_media_files table")?;

  // Таблица сцен
  conn.execute(
        "CREATE TABLE IF NOT EXISTS analysis_scenes (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES analysis_projects(id) ON DELETE CASCADE,
            file_id TEXT NOT NULL REFERENCES analysis_media_files(id) ON DELETE CASCADE,
            start_time REAL NOT NULL,
            end_time REAL NOT NULL,
            duration REAL NOT NULL,
            scene_type TEXT NOT NULL CHECK (scene_type IN ('action', 'dialogue', 'landscape', 'closeup', 'wide', 'medium', 'transition', 'static', 'dynamic', 'establishing', 'reaction', 'montage', 'unknown')),
            sub_type TEXT,
            confidence REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
            dominant_colors TEXT NOT NULL DEFAULT '[]', -- JSON array of hex colors
            brightness REAL DEFAULT 0.0,
            contrast REAL DEFAULT 0.0,
            saturation REAL DEFAULT 0.0,
            motion_level REAL DEFAULT 0.0,
            composition_score REAL DEFAULT 0.0,
            rule_of_thirds_compliance REAL DEFAULT 0.0,
            visual_balance REAL DEFAULT 0.0,
            quality_score REAL DEFAULT 0.0,
            sharpness REAL DEFAULT 0.0,
            noise_level REAL DEFAULT 0.0,
            stability REAL DEFAULT 0.0,
            persons_present TEXT NOT NULL DEFAULT '[]', -- JSON array of UUIDs
            objects_detected TEXT NOT NULL DEFAULT '[]', -- JSON array of object classes
            has_text BOOLEAN NOT NULL DEFAULT FALSE,
            has_faces BOOLEAN NOT NULL DEFAULT FALSE,
            emotional_tone TEXT, -- JSON EmotionData
            energy_level REAL DEFAULT 0.0,
            auto_description TEXT,
            user_description TEXT,
            tags TEXT NOT NULL DEFAULT '[]', -- JSON array
            user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
            representative_frame REAL NOT NULL,
            keyframes TEXT NOT NULL DEFAULT '[]', -- JSON array of timestamps
            created_at TEXT NOT NULL
        )",
        [],
    ).context("Failed to create analysis_scenes table")?;

  // Таблица ключевых моментов
  conn.execute(
        "CREATE TABLE IF NOT EXISTS key_moments (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES analysis_projects(id) ON DELETE CASCADE,
            file_id TEXT NOT NULL REFERENCES analysis_media_files(id) ON DELETE CASCADE,
            scene_id TEXT REFERENCES analysis_scenes(id) ON DELETE SET NULL,
            timestamp REAL NOT NULL,
            duration REAL NOT NULL,
            moment_type TEXT NOT NULL CHECK (moment_type IN ('emotional_peak', 'action_climax', 'dialogue_highlight', 'visual_stunning', 'narrative_turning', 'comedic_moment', 'dramatic_pause', 'music_sync', 'face_reveal', 'object_focus', 'scene_transition', 'quality_peak', 'motion_peak', 'audio_peak', 'user_defined')),
            sub_type TEXT,
            importance_score REAL NOT NULL CHECK (importance_score >= 0.0 AND importance_score <= 1.0),
            scoring_factors TEXT NOT NULL DEFAULT '{}', -- JSON ScoringFactors
            description TEXT NOT NULL,
            auto_description TEXT,
            user_notes TEXT,
            involved_persons TEXT NOT NULL DEFAULT '[]', -- JSON array of UUIDs
            involved_objects TEXT NOT NULL DEFAULT '[]', -- JSON array of object classes
            associated_emotions TEXT NOT NULL DEFAULT '[]', -- JSON array of EmotionData
            content_tags TEXT NOT NULL DEFAULT '[]', -- JSON array
            mood_tags TEXT NOT NULL DEFAULT '[]', -- JSON array
            technical_tags TEXT NOT NULL DEFAULT '[]', -- JSON array
            user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
            is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
            is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
            thumbnail_frame REAL NOT NULL,
            preview_start REAL NOT NULL,
            preview_end REAL NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).context("Failed to create key_moments table")?;

  // Таблица связей персон с проектами
  conn.execute(
        "CREATE TABLE IF NOT EXISTS project_person_associations (
            project_id TEXT NOT NULL REFERENCES analysis_projects(id) ON DELETE CASCADE,
            person_id TEXT NOT NULL, -- Ссылка на persons таблицу из person_database
            total_screen_time REAL NOT NULL DEFAULT 0.0,
            total_appearances INTEGER NOT NULL DEFAULT 0,
            scenes_present INTEGER NOT NULL DEFAULT 0,
            key_moments_involved INTEGER NOT NULL DEFAULT 0,
            importance TEXT NOT NULL DEFAULT 'unknown' CHECK (importance IN ('primary', 'secondary', 'supporting', 'background', 'extra', 'unknown')),
            character_role TEXT,
            first_appearance REAL NOT NULL DEFAULT 0.0,
            last_appearance REAL NOT NULL DEFAULT 0.0,
            most_prominent_scene TEXT, -- UUID ссылка на analysis_scenes
            dominant_emotions TEXT NOT NULL DEFAULT '[]', -- JSON array of EmotionData
            emotional_range REAL DEFAULT 0.0,
            emotional_stability REAL DEFAULT 0.0,
            average_quality REAL DEFAULT 0.0,
            best_quality_frame REAL,
            lighting_consistency REAL DEFAULT 0.0,
            user_notes TEXT,
            user_tags TEXT NOT NULL DEFAULT '[]', -- JSON array
            is_main_character BOOLEAN NOT NULL DEFAULT FALSE,
            custom_role TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (project_id, person_id)
        )",
        [],
    ).context("Failed to create project_person_associations table")?;

  // Таблица планов монтажа
  conn.execute(
        "CREATE TABLE IF NOT EXISTS montage_plans (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES analysis_projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            total_duration REAL NOT NULL DEFAULT 0.0,
            target_duration REAL NOT NULL DEFAULT 0.0,
            style TEXT NOT NULL CHECK (style IN ('dynamic', 'calm', 'rhythmic', 'cinematic', 'documentary', 'travel', 'action', 'romantic', 'comedy', 'drama', 'custom')),
            tempo TEXT NOT NULL DEFAULT '{}', -- JSON MontageTempoSetting
            mood TEXT,
            created_by TEXT NOT NULL CHECK (created_by IN ('ai', 'user', 'collaborative', 'template', 'imported')),
            ai_confidence REAL DEFAULT 0.0,
            ai_reasoning TEXT NOT NULL DEFAULT '',
            alternative_count INTEGER NOT NULL DEFAULT 0,
            version INTEGER NOT NULL DEFAULT 1,
            parent_plan_id TEXT REFERENCES montage_plans(id) ON DELETE SET NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            user_modifications INTEGER NOT NULL DEFAULT 0,
            user_approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (user_approval_status IN ('pending', 'approved', 'rejected', 'needs_revision', 'in_review')),
            user_feedback TEXT,
            export_settings TEXT, -- JSON ExportSettings
            preview_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).context("Failed to create montage_plans table")?;

  // Таблица сегментов монтажа
  conn
    .execute(
      "CREATE TABLE IF NOT EXISTS montage_segments (
            id TEXT PRIMARY KEY,
            plan_id TEXT NOT NULL REFERENCES montage_plans(id) ON DELETE CASCADE,
            source_file_id TEXT NOT NULL REFERENCES analysis_media_files(id) ON DELETE CASCADE,
            source_scene_id TEXT REFERENCES analysis_scenes(id) ON DELETE SET NULL,
            source_moment_id TEXT REFERENCES key_moments(id) ON DELETE SET NULL,
            source_start_time REAL NOT NULL,
            source_end_time REAL NOT NULL,
            source_duration REAL NOT NULL,
            sequence_position INTEGER NOT NULL,
            timeline_start REAL NOT NULL,
            timeline_duration REAL NOT NULL,
            track_number INTEGER NOT NULL DEFAULT 1,
            speed_multiplier REAL NOT NULL DEFAULT 1.0,
            fade_in_duration REAL NOT NULL DEFAULT 0.0,
            fade_out_duration REAL NOT NULL DEFAULT 0.0,
            color_correction TEXT, -- JSON ColorCorrection
            audio_adjustments TEXT, -- JSON AudioAdjustments
            visual_effects TEXT NOT NULL DEFAULT '[]', -- JSON array of VisualEffect
            ai_reason TEXT NOT NULL DEFAULT '',
            ai_confidence REAL DEFAULT 0.0,
            selection_factors TEXT NOT NULL DEFAULT '{}', -- JSON ScoringFactors
            is_user_modified BOOLEAN NOT NULL DEFAULT FALSE,
            user_locked BOOLEAN NOT NULL DEFAULT FALSE,
            user_notes TEXT,
            transition_in TEXT, -- JSON TransitionEffect
            transition_out TEXT, -- JSON TransitionEffect
            related_segments TEXT NOT NULL DEFAULT '[]', -- JSON array of UUIDs
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
      [],
    )
    .context("Failed to create montage_segments table")?;

  log::info!("Migration 001 completed successfully");
  Ok(())
}

/// Миграция 002: Добавление индексов для производительности
fn migration_002_add_analysis_indices(conn: &Connection) -> Result<()> {
  log::info!("Running migration 002: Adding analysis indices");

  // Индексы для таблицы проектов
  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_analysis_projects_status ON analysis_projects(status)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_analysis_projects_created_at ON analysis_projects(created_at)",
    [],
  )?;

  // Индексы для медиафайлов
  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_analysis_media_files_project_id ON analysis_media_files(project_id)",
        [],
    )?;

  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_analysis_media_files_processing_status ON analysis_media_files(processing_status)",
        [],
    )?;

  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_analysis_media_files_media_type ON analysis_media_files(media_type)",
        [],
    )?;

  // Индексы для сцен
  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_analysis_scenes_project_id ON analysis_scenes(project_id)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_analysis_scenes_file_id ON analysis_scenes(file_id)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_analysis_scenes_scene_type ON analysis_scenes(scene_type)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_analysis_scenes_start_time ON analysis_scenes(start_time)",
    [],
  )?;

  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_analysis_scenes_quality_score ON analysis_scenes(quality_score)",
        [],
    )?;

  // Индексы для ключевых моментов
  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_key_moments_project_id ON key_moments(project_id)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_key_moments_file_id ON key_moments(file_id)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_key_moments_scene_id ON key_moments(scene_id)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_key_moments_moment_type ON key_moments(moment_type)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_key_moments_importance_score ON key_moments(importance_score)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_key_moments_timestamp ON key_moments(timestamp)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_key_moments_is_bookmarked ON key_moments(is_bookmarked)",
    [],
  )?;

  // Индексы для связей персон с проектами
  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_project_person_associations_person_id ON project_person_associations(person_id)",
        [],
    )?;

  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_project_person_associations_importance ON project_person_associations(importance)",
        [],
    )?;

  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_project_person_associations_total_screen_time ON project_person_associations(total_screen_time)",
        [],
    )?;

  // Индексы для планов монтажа
  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_montage_plans_project_id ON montage_plans(project_id)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_montage_plans_is_active ON montage_plans(is_active)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_montage_plans_created_by ON montage_plans(created_by)",
    [],
  )?;

  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_montage_plans_version ON montage_plans(version)",
    [],
  )?;

  // Индексы для сегментов монтажа
  conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_montage_segments_plan_id ON montage_segments(plan_id)",
    [],
  )?;

  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_montage_segments_source_file_id ON montage_segments(source_file_id)",
        [],
    )?;

  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_montage_segments_sequence_position ON montage_segments(sequence_position)",
        [],
    )?;

  conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_montage_segments_timeline_start ON montage_segments(timeline_start)",
        [],
    )?;

  log::info!("Migration 002 completed successfully");
  Ok(())
}

/// Миграция 003: Добавление триггеров для автоматического обновления
fn migration_003_add_analysis_triggers(conn: &Connection) -> Result<()> {
  log::info!("Running migration 003: Adding analysis triggers");

  // Триггер для автоматического обновления updated_at в проектах
  conn.execute(
    "CREATE TRIGGER IF NOT EXISTS update_analysis_projects_updated_at
         AFTER UPDATE ON analysis_projects
         FOR EACH ROW
         BEGIN
             UPDATE analysis_projects SET updated_at = datetime('now')
             WHERE id = NEW.id;
         END",
    [],
  )?;

  // Триггер для автоматического обновления статистики проекта при добавлении файла
  conn.execute(
    "CREATE TRIGGER IF NOT EXISTS update_project_stats_on_file_add
         AFTER INSERT ON analysis_media_files
         FOR EACH ROW
         BEGIN
             UPDATE analysis_projects SET
                 total_files = total_files + 1,
                 total_duration = total_duration + COALESCE(NEW.duration, 0),
                 updated_at = datetime('now')
             WHERE id = NEW.project_id;
         END",
    [],
  )?;

  // Триггер для обновления статистики при завершении обработки файла
  conn.execute(
    "CREATE TRIGGER IF NOT EXISTS update_project_stats_on_file_processed
         AFTER UPDATE OF processing_status ON analysis_media_files
         FOR EACH ROW
         WHEN NEW.processing_status = 'completed' AND OLD.processing_status != 'completed'
         BEGIN
             UPDATE analysis_projects SET
                 processed_files = processed_files + 1,
                 updated_at = datetime('now')
             WHERE id = NEW.project_id;
         END",
    [],
  )?;

  // Триггер для обновления счетчиков при добавлении сцены
  conn.execute(
    "CREATE TRIGGER IF NOT EXISTS update_scene_counts
         AFTER INSERT ON analysis_scenes
         FOR EACH ROW
         BEGIN
             UPDATE analysis_projects SET
                 total_scenes = total_scenes + 1,
                 updated_at = datetime('now')
             WHERE id = NEW.project_id;
             
             UPDATE analysis_media_files SET
                 scenes_count = scenes_count + 1
             WHERE id = NEW.file_id;
         END",
    [],
  )?;

  // Триггер для обновления счетчиков при добавлении ключевого момента
  conn.execute(
    "CREATE TRIGGER IF NOT EXISTS update_key_moment_counts
         AFTER INSERT ON key_moments
         FOR EACH ROW
         BEGIN
             UPDATE analysis_projects SET
                 total_key_moments = total_key_moments + 1,
                 updated_at = datetime('now')
             WHERE id = NEW.project_id;
             
             UPDATE analysis_media_files SET
                 key_moments_count = key_moments_count + 1
             WHERE id = NEW.file_id;
         END",
    [],
  )?;

  // Триггер для автоматического обновления updated_at в ключевых моментах
  conn.execute(
    "CREATE TRIGGER IF NOT EXISTS update_key_moments_updated_at
         AFTER UPDATE ON key_moments
         FOR EACH ROW
         BEGIN
             UPDATE key_moments SET updated_at = datetime('now')
             WHERE id = NEW.id;
         END",
    [],
  )?;

  // Триггер для автоматического обновления updated_at в связях персон с проектами
  conn.execute(
    "CREATE TRIGGER IF NOT EXISTS update_project_person_associations_updated_at
         AFTER UPDATE ON project_person_associations
         FOR EACH ROW
         BEGIN
             UPDATE project_person_associations SET updated_at = datetime('now')
             WHERE project_id = NEW.project_id AND person_id = NEW.person_id;
         END",
    [],
  )?;

  // Триггер для обновления updated_at в планах монтажа
  conn.execute(
    "CREATE TRIGGER IF NOT EXISTS update_montage_plans_updated_at
         AFTER UPDATE ON montage_plans
         FOR EACH ROW
         BEGIN
             UPDATE montage_plans SET updated_at = datetime('now')
             WHERE id = NEW.id;
         END",
    [],
  )?;

  // Триггер для обновления updated_at в сегментах монтажа
  conn.execute(
    "CREATE TRIGGER IF NOT EXISTS update_montage_segments_updated_at
         AFTER UPDATE ON montage_segments
         FOR EACH ROW
         BEGIN
             UPDATE montage_segments SET updated_at = datetime('now')
             WHERE id = NEW.id;
         END",
    [],
  )?;

  log::info!("Migration 003 completed successfully");
  Ok(())
}
