//! ДЕДУП (#98): типы монтажа — из крейта `ts-montage`. Плюс composition-типы из
//! оставшегося в монолите `composition_analyzer` (их использует analysis-модуль).
pub use ts_montage::montage_planner::types::*;
pub use super::services::composition_analyzer::{CompositionEnhancedDetection, CompositionWeights};
