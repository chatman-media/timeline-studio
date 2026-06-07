//! [`AnalysisService`] трейт — абстракция над движком анализа видео.
//!
//! Конкретные реализации (SceneDetector, AIDirector из `crate::analysis`) живут
//! в монолите `src-tauri` до момента переезда в `ts-analysis` (#91 / #97).
//! Здесь — трейт + [`StubAnalysisService`] для headless/CLI/тестов.

use serde_json::Value;
use std::future::Future;
use std::path::Path;
use std::pin::Pin;

/// Результат анализа видео-файла.
#[derive(Debug, Clone)]
pub struct AnalysisResult {
    /// Данные, которые будут вернуты агенту в виде JSON.
    pub data: Value,
}

/// Тип Future, возвращаемый методами [`AnalysisService`].
pub type AnalysisFuture =
    Pin<Box<dyn Future<Output = Result<AnalysisResult, String>> + Send + 'static>>;

/// Трейт для анализа видео-контента.
///
/// Реализуется в `src-tauri` (через `SceneDetector` / `AIDirector`) и пробрасывается
/// в `VideoTools`. В headless-режиме используется [`StubAnalysisService`].
pub trait AnalysisService: Send + Sync + 'static {
    /// Базовый анализ видео (метаданные, качество, краткий контент).
    fn analyze_video(&self, path: &Path, analysis_type: Option<&str>) -> AnalysisFuture;

    /// Детекция сцен в видео.
    fn detect_scenes(&self, path: &Path, min_duration: Option<f64>) -> AnalysisFuture;

    /// Поиск ключевых моментов.
    fn detect_moments(&self, path: &Path, max_moments: Option<usize>) -> AnalysisFuture;

    /// Анализ аудио-дорожки.
    fn analyze_audio(&self, path: &Path) -> AnalysisFuture;
}

// ─── StubAnalysisService ─────────────────────────────────────────────────────

/// Заглушка — возвращает `status: "pending"` для всех методов.
///
/// Используется в headless/CLI пока `ts-analysis` не реализует
/// полноценные движки (#97 / #91).
pub struct StubAnalysisService;

macro_rules! stub_future {
    ($label:expr) => {{
        Box::pin(async move {
            Ok(AnalysisResult {
                data: serde_json::json!({
                    "status": "pending",
                    "message": format!(
                        "{} requires ts-analysis engines — not yet wired in headless mode (#97)",
                        $label
                    )
                }),
            })
        })
    }};
}

impl AnalysisService for StubAnalysisService {
    fn analyze_video(&self, _path: &Path, _analysis_type: Option<&str>) -> AnalysisFuture {
        stub_future!("analyze_video")
    }

    fn detect_scenes(&self, _path: &Path, _min_duration: Option<f64>) -> AnalysisFuture {
        stub_future!("detect_scenes")
    }

    fn detect_moments(&self, _path: &Path, _max_moments: Option<usize>) -> AnalysisFuture {
        stub_future!("detect_moments")
    }

    fn analyze_audio(&self, _path: &Path) -> AnalysisFuture {
        stub_future!("analyze_audio")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[tokio::test]
    async fn stub_returns_pending() {
        let svc = StubAnalysisService;
        let path = PathBuf::from("/tmp/fake.mp4");
        let result = svc.analyze_video(&path, None).await.unwrap();
        assert_eq!(result.data["status"], "pending");
    }
}
