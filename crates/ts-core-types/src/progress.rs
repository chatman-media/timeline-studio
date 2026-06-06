//! Типы прогресса рендеринга — без зависимости от Tauri/specta.
//!
//! Извлечено из `ts-render::video_compiler::core::progress` (#94).
//! Тяжёлый `ProgressTracker` остался в `ts-render`.

use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Статус задачи рендеринга.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RenderStatus {
    /// Задача в очереди, ещё не начата.
    Queued,
    /// Подготовка ресурсов (загрузка ассетов, парсинг).
    Preparing,
    /// Идёт обработка кадров.
    Processing,
    /// Рендеринг завершён успешно.
    Completed,
    /// Рендеринг завершён с ошибкой.
    Failed(String),
    /// Задача отменена пользователем.
    Cancelled,
    /// Задача на паузе.
    Paused,
}

impl RenderStatus {
    /// Возвращает `true`, если задача завершена (успешно, с ошибкой или отменена).
    pub fn is_terminal(&self) -> bool {
        matches!(
            self,
            RenderStatus::Completed | RenderStatus::Failed(_) | RenderStatus::Cancelled
        )
    }

    /// Возвращает `true`, если задача ещё выполняется.
    pub fn is_active(&self) -> bool {
        matches!(
            self,
            RenderStatus::Queued | RenderStatus::Preparing | RenderStatus::Processing
        )
    }
}

impl Default for RenderStatus {
    fn default() -> Self {
        RenderStatus::Queued
    }
}

/// Снимок прогресса рендеринга для конкретного job-а.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderProgress {
    /// Идентификатор задачи.
    pub job_id: String,
    /// Текущий этап (напр. "Encoding", "Mixing audio").
    pub stage: String,
    /// Процент выполнения от 0.0 до 100.0.
    pub percentage: f32,
    /// Текущий обработанный кадр.
    pub current_frame: u64,
    /// Общее количество кадров.
    pub total_frames: u64,
    /// Прошедшее время.
    #[serde(with = "duration_serde")]
    pub elapsed_time: Duration,
    /// Оценка оставшегося времени (может быть `None` в начале).
    #[serde(with = "option_duration_serde")]
    pub estimated_remaining: Option<Duration>,
    /// Текущий статус задачи.
    pub status: RenderStatus,
    /// Человекочитаемое сообщение о текущем действии.
    pub message: Option<String>,
}

impl RenderProgress {
    /// Создаёт начальный `RenderProgress` для нового job-а.
    pub fn new(job_id: impl Into<String>) -> Self {
        Self {
            job_id: job_id.into(),
            stage: String::new(),
            percentage: 0.0,
            current_frame: 0,
            total_frames: 0,
            elapsed_time: Duration::ZERO,
            estimated_remaining: None,
            status: RenderStatus::Queued,
            message: None,
        }
    }

    /// Клонирует с новым статусом.
    pub fn with_status(mut self, status: RenderStatus) -> Self {
        self.status = status;
        self
    }
}

/// Событие об изменении прогресса — рассылается через [`EventBus`].
///
/// [`EventBus`]: crate::events::EventBus
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ProgressUpdate {
    /// Job зарегистрирован и поставлен в очередь.
    JobStarted {
        job_id: String,
        total_frames: u64,
    },
    /// Прогресс job-а обновился.
    ProgressChanged(RenderProgress),
    /// Job завершён успешно.
    JobCompleted {
        job_id: String,
        /// Полное время рендеринга.
        #[serde(with = "duration_serde")]
        elapsed_time: Duration,
    },
    /// Job завершён с ошибкой.
    JobFailed {
        job_id: String,
        error: String,
    },
    /// Job отменён.
    JobCancelled {
        job_id: String,
    },
    /// Job поставлен на паузу.
    JobPaused {
        job_id: String,
    },
    /// Job возобновлён.
    JobResumed {
        job_id: String,
    },
}

impl ProgressUpdate {
    /// Возвращает `job_id` из любого варианта.
    pub fn job_id(&self) -> &str {
        match self {
            ProgressUpdate::JobStarted { job_id, .. } => job_id,
            ProgressUpdate::ProgressChanged(p) => &p.job_id,
            ProgressUpdate::JobCompleted { job_id, .. } => job_id,
            ProgressUpdate::JobFailed { job_id, .. } => job_id,
            ProgressUpdate::JobCancelled { job_id } => job_id,
            ProgressUpdate::JobPaused { job_id } => job_id,
            ProgressUpdate::JobResumed { job_id } => job_id,
        }
    }
}

// ─── serde helpers для Duration ─────────────────────────────────────────────

mod duration_serde {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    use std::time::Duration;

    pub fn serialize<S: Serializer>(d: &Duration, s: S) -> Result<S::Ok, S::Error> {
        d.as_secs_f64().serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Duration, D::Error> {
        let secs = f64::deserialize(d)?;
        Ok(Duration::from_secs_f64(secs))
    }
}

mod option_duration_serde {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    use std::time::Duration;

    pub fn serialize<S: Serializer>(opt: &Option<Duration>, s: S) -> Result<S::Ok, S::Error> {
        opt.map(|d| d.as_secs_f64()).serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Option<Duration>, D::Error> {
        let opt = Option::<f64>::deserialize(d)?;
        Ok(opt.map(Duration::from_secs_f64))
    }
}

// ─── Тесты ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn render_status_terminal() {
        assert!(RenderStatus::Completed.is_terminal());
        assert!(RenderStatus::Failed("oops".into()).is_terminal());
        assert!(RenderStatus::Cancelled.is_terminal());
        assert!(!RenderStatus::Processing.is_terminal());
    }

    #[test]
    fn render_status_active() {
        assert!(RenderStatus::Queued.is_active());
        assert!(RenderStatus::Preparing.is_active());
        assert!(RenderStatus::Processing.is_active());
        assert!(!RenderStatus::Completed.is_active());
    }

    #[test]
    fn render_progress_new() {
        let p = RenderProgress::new("job-1");
        assert_eq!(p.job_id, "job-1");
        assert_eq!(p.percentage, 0.0);
        assert_eq!(p.status, RenderStatus::Queued);
    }

    #[test]
    fn progress_update_job_id() {
        let upd = ProgressUpdate::JobCancelled {
            job_id: "abc".into(),
        };
        assert_eq!(upd.job_id(), "abc");
    }

    #[test]
    fn progress_update_serde_roundtrip() {
        let upd = ProgressUpdate::JobStarted {
            job_id: "j1".into(),
            total_frames: 300,
        };
        let json = serde_json::to_string(&upd).unwrap();
        let back: ProgressUpdate = serde_json::from_str(&json).unwrap();
        assert_eq!(back.job_id(), "j1");
    }

    #[test]
    fn render_progress_serde_roundtrip() {
        let p = RenderProgress::new("j2").with_status(RenderStatus::Processing);
        let json = serde_json::to_string(&p).unwrap();
        let back: RenderProgress = serde_json::from_str(&json).unwrap();
        assert_eq!(back.job_id, "j2");
        assert_eq!(back.status, RenderStatus::Processing);
    }
}
