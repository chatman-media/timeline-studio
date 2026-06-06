//! `ts-recognition` — ONNX-инференс Timeline Studio, вынесенный из монолита.
//!
//! Содержит инференс-движки (YOLO / FaceNet / RetinaFace / MediaPipe), менеджер
//! моделей и кластеризацию лиц. **Изолирует `ort` (ONNX Runtime), `ndarray`,
//! `image`** — render-путь (`ts-render`) их не тащит.
//!
//! Не входит (отрезано при выносе): `commands/` (Tauri-адаптер) и `vision_service`
//! (тянул `crate::analysis` — цикл recognition↔analysis — и `specta`). Высокоуровневый
//! Vision Service вернётся через трейт/EventBus в Phase C/D эпика #91.
//!
//! `ort` подключён с `load-dynamic`: ONNX Runtime грузится в рантайме (для сборки
//! библиотека не требуется).

pub mod models_config;
pub mod recognition;
