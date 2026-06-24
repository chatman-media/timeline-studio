//! Event-driven architecture — вынесена в крейт `ts-events` (#91).
//! Ре-экспорт-шим: `crate::events::*` и `core/mod.rs::pub use events::{...}`
//! продолжают резолвиться без правок у ~7 потребителей.
pub use ts_events::*;
