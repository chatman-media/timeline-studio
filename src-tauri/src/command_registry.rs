//! `CommandRegistry` — вынесена в крейт `ts-command-registry` (#354).
//! Ре-экспорт-шим: `crate::command_registry::CommandRegistry` у потребителей
//! (media/montage_planner/security/mcp registry) резолвится без правок.
pub use ts_command_registry::CommandRegistry;
