//! ts-analysis — анализ контента Timeline Studio (#97): engines (content/moment) +
//! models + types. Хаб-оркестрация (services/commands/adapters/database + scene_engine,
//! завязанные на recognition/video_compiler/montage/state/SceneDetector) отрезана —
//! вернётся через трейты/EventBus (#91). recognition/media — wired к крейтам ts-*.
pub mod analysis;

/// Стаб `state::project_state::MediaType` (app-state в крейт не выносится; реальная
/// интеграция — трейтом в Phase D #91). Достаточно для conversion-impl'ов.
pub mod state {
  pub mod project_state {
    use serde::{Deserialize, Serialize};
    #[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
    pub enum MediaType {
      Video,
      Audio,
      Image,
    }
  }
}
