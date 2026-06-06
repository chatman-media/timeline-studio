//! ts-analysis — анализ контента Timeline Studio (#97): engines (content/moment) +
//! models + types. Хаб-оркестрация (services/commands/adapters/database + scene_engine,
//! завязанные на recognition/video_compiler/montage/state/SceneDetector) отрезана —
//! вернётся через трейты/EventBus (#91). recognition/media — wired к крейтам ts-*.
pub mod analysis;

/// `state::project_state::MediaType` — теперь из фундамента `ts-schema` (был стаб; #94/#98).
/// Так analysis-крейт и монолит используют ОДИН тип (унификация для дедупа analysis).
pub mod state {
  pub mod project_state {
    pub use ts_schema::MediaType;
  }
}
