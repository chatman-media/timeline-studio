//! `ts-render-services` — Tauri-free сервисный фундамент Timeline Studio (#91/#92, Wave 1).
//!
//! Сюда вынесен фундамент Video Compiler, который НЕ зависит от Tauri:
//! `VideoCompilerState` + `ServiceContainer` + `services/*` + `ffmpeg_command/`.
//! Эти модули содержат ноль `tauri::`-ссылок — они жили в крейте `ts-render-tauri`
//! по историческим причинам (волна 1), хотя Tauri им не нужен.
//!
//! Граф зависимостей (целевой):
//! ```text
//! ts-render          (Tauri-free движок рендера, #90)
//! ts-render-services (этот крейт, Tauri-free)  ← VideoCompilerState + ServiceContainer + services/* + ffmpeg_command/
//! ts-render-tauri    (тонкий, depends on tauri + ts-render-services) ← workflow + будущие #[command]-обёртки
//! ```
//!
//! Смысл выноса: фундамент должен собираться и использоваться БЕЗ Tauri
//! (headless: CLI, агент, тесты). Поэтому крейт НЕ тянет `tauri` в дереве зависимостей.
//!
//! Монолит `src-tauri/src/video_compiler/` держит ре-экспорт-шимы на эти модули
//! (`pub use ts_render_services::{services, state, ffmpeg_command, VideoCompilerState, ...}`),
//! так что ~26 групп команд и `lib.rs::manage(...)` резолвятся и собираются без правок.

/// Сервисный слой Video Compiler (Wave 1, эпик #91): DI-контейнер `ServiceContainer`
/// + 8 сервисов (cache/ffmpeg/gpu/monitoring/preview/project/render/transition).
/// Обёртывают движок `ts-render` для работающего приложения и держат общее состояние.
///
/// В монолите `video_compiler/services/mod.rs` оставлен ре-экспорт-шим
/// (`pub use ts_render_services::services::*;`), чтобы путь
/// `crate::video_compiler::services::*` у ~26 групп команд резолвился без правок.
pub mod services;

/// Состояние Video Compiler (Wave 1): `VideoCompilerState`
/// (handler-стейт, в Tauri инжектируется через `tauri::State<VideoCompilerState>`),
/// `ActiveRenderJob`, `RenderJobMetadata`, `RenderJob`.
///
/// КРИТИЧНО (B2): тип, инжектируемый в `tauri::Builder::manage(...)`, ДОЛЖЕН быть ровно
/// этот тип. В монолите `video_compiler/commands/state.rs` оставлен ре-экспорт-шим, а
/// `video_compiler/mod.rs` продолжает `pub use commands::VideoCompilerState;` — так что
/// `crate::video_compiler::VideoCompilerState` и `::commands::state::*` остаются валидны.
/// Сам тип Tauri-free; `State<T>`-инъекция живёт в командном слое (`ts-render-tauri`/монолит).
pub mod state;

/// FFmpeg-командный примитив, нужный сервисному слою (`preview_service`).
///
/// Извлечён из монолитного `core/ffmpeg/mod.rs` БЕЗ изменения логики (волна 1 не может
/// переехать без него). Анализное поддерево `core/ffmpeg/` остаётся в монолите и видит
/// эти символы через ре-экспорт-шим `pub use ts_render_services::ffmpeg_command::*;`.
pub mod ffmpeg_command;

/// Re-export фундамента под именами, ожидаемыми монолитом и будущими волнами.
pub use services::ServiceContainer;
pub use state::{VideoCompilerEvent, VideoCompilerState};
