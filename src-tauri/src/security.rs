//! Подсистема безопасности вынесена в крейт `ts-security` (#354/#359) поверх ts-secure-storage.
//! Ре-экспорт-шим: `crate::security::{commands,SecureStorage,ApiKeyType,...}` резолвятся
//! у потребителей (state, analysis, app_builder) без правок.
pub use ts_security::*;
