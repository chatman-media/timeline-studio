//! Tauri-обёртки субтитров. Вся логика — в крейте `ts-subtitles` (#99 dedup).
use ts_subtitles::subtitles::{SubtitleExportOptions, SubtitleImportResult, SubtitleInfo};

#[tauri::command]
pub async fn read_subtitle_file(file_path: String) -> Result<SubtitleImportResult, String> {
  ts_subtitles::subtitles::read_subtitle_file(file_path).await
}

#[tauri::command]
pub async fn save_subtitle_file(options: SubtitleExportOptions) -> Result<(), String> {
  ts_subtitles::subtitles::save_subtitle_file(options).await
}

#[tauri::command]
pub async fn validate_subtitle_format(content: String, format: String) -> Result<bool, String> {
  ts_subtitles::subtitles::validate_subtitle_format(content, format).await
}

#[tauri::command]
pub async fn convert_subtitle_format(
  content: String,
  from_format: String,
  to_format: String,
) -> Result<String, String> {
  ts_subtitles::subtitles::convert_subtitle_format(content, from_format, to_format).await
}

#[tauri::command]
pub async fn get_subtitle_info(content: String, format: String) -> Result<SubtitleInfo, String> {
  ts_subtitles::subtitles::get_subtitle_info(content, format).await
}
