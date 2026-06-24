//! Core-инфраструктура вынесена в крейт `ts-core` (#354/#361).
//! Ре-экспорт-шим: `crate::core::{di,plugins,telemetry,validation,performance,events,
//! Service,EventBus,AppEvent,...}` резолвятся у потребителей без правок.
pub use ts_core::*;
