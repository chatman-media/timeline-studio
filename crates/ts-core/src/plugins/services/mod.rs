//! Сервисы-мосты для интеграции плагинов с основными сервисами Timeline Studio

pub mod media_bridge;
pub mod timeline_bridge;
pub mod ui_bridge;

pub use media_bridge::MediaBridge;
pub use timeline_bridge::TimelineBridge;
pub use ui_bridge::UIBridge;
