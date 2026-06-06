//! Result Aggregator - Сбор и форматирование результатов распознавания

use crate::recognition::frame_processor::Detection;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Результат распознавания для кадра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameRecognitionResult {
  /// Номер кадра
  pub frame_number: usize,
  /// Временная метка в секундах
  pub timestamp: f64,
  /// Обнаруженные объекты
  pub detections: Vec<Detection>,
}

/// Агрегированные результаты распознавания
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedResults {
  /// Результаты по кадрам
  pub frame_results: Vec<FrameRecognitionResult>,
  /// Статистика по классам
  pub class_statistics: HashMap<String, ClassStatistics>,
  /// Общая статистика
  pub summary: RecognitionSummary,
}

/// Статистика по классу объектов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassStatistics {
  /// Название класса
  pub class_name: String,
  /// Общее количество обнаружений
  pub total_detections: usize,
  /// Средняя уверенность
  pub average_confidence: f32,
  /// Максимальная уверенность
  pub max_confidence: f32,
  /// Минимальная уверенность
  pub min_confidence: f32,
  /// Кадры, где был обнаружен объект
  pub frames_detected: Vec<usize>,
}

/// Общая статистика распознавания
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecognitionSummary {
  /// Общее количество обработанных кадров
  pub total_frames: usize,
  /// Количество кадров с обнаружениями
  pub frames_with_detections: usize,
  /// Общее количество обнаружений
  pub total_detections: usize,
  /// Количество уникальных классов
  pub unique_classes: usize,
  /// Время обработки в секундах
  pub processing_time_seconds: f64,
}

/// Агрегатор результатов
pub struct ResultAggregator {
  frame_results: Vec<FrameRecognitionResult>,
  start_time: std::time::Instant,
}

impl ResultAggregator {
  /// Создать новый агрегатор
  pub fn new() -> Self {
    Self {
      frame_results: Vec::new(),
      start_time: std::time::Instant::now(),
    }
  }

  /// Добавить результат кадра
  pub fn add_frame_result(
    &mut self,
    frame_number: usize,
    timestamp: f64,
    detections: Vec<Detection>,
  ) {
    self.frame_results.push(FrameRecognitionResult {
      frame_number,
      timestamp,
      detections,
    });
  }

  /// Агрегировать все результаты
  pub fn aggregate(self) -> AggregatedResults {
    let processing_time_seconds = self.start_time.elapsed().as_secs_f64();
    let class_statistics = self.calculate_class_statistics();
    let summary = self.calculate_summary(&class_statistics, processing_time_seconds);

    AggregatedResults {
      frame_results: self.frame_results,
      class_statistics,
      summary,
    }
  }

  /// Вычислить статистику по классам
  fn calculate_class_statistics(&self) -> HashMap<String, ClassStatistics> {
    let mut stats_map: HashMap<String, Vec<(usize, f32)>> = HashMap::new();

    // Собираем данные по классам
    for frame_result in &self.frame_results {
      for detection in &frame_result.detections {
        stats_map
          .entry(detection.class.clone())
          .or_default()
          .push((frame_result.frame_number, detection.confidence));
      }
    }

    // Вычисляем статистику
    let mut class_statistics = HashMap::new();
    for (class_name, detections) in stats_map {
      let total_detections = detections.len();
      let sum_confidence: f32 = detections.iter().map(|(_, conf)| conf).sum();
      let average_confidence = sum_confidence / total_detections as f32;

      let max_confidence = detections
        .iter()
        .map(|(_, conf)| *conf)
        .max_by(|a, b| a.partial_cmp(b).unwrap())
        .unwrap_or(0.0);

      let min_confidence = detections
        .iter()
        .map(|(_, conf)| *conf)
        .min_by(|a, b| a.partial_cmp(b).unwrap())
        .unwrap_or(0.0);

      let mut frames_detected: Vec<usize> =
        detections.iter().map(|(frame_num, _)| *frame_num).collect();
      frames_detected.sort_unstable();
      frames_detected.dedup();

      class_statistics.insert(
        class_name.clone(),
        ClassStatistics {
          class_name,
          total_detections,
          average_confidence,
          max_confidence,
          min_confidence,
          frames_detected,
        },
      );
    }

    class_statistics
  }

  /// Вычислить общую статистику
  fn calculate_summary(
    &self,
    class_statistics: &HashMap<String, ClassStatistics>,
    processing_time_seconds: f64,
  ) -> RecognitionSummary {
    let total_frames = self.frame_results.len();
    let frames_with_detections = self
      .frame_results
      .iter()
      .filter(|fr| !fr.detections.is_empty())
      .count();

    let total_detections: usize = class_statistics
      .values()
      .map(|cs| cs.total_detections)
      .sum();

    let unique_classes = class_statistics.len();

    RecognitionSummary {
      total_frames,
      frames_with_detections,
      total_detections,
      unique_classes,
      processing_time_seconds,
    }
  }

  /// Получить результаты по временному диапазону
  #[allow(dead_code)]
  pub fn get_results_by_time_range(
    &self,
    start_time: f64,
    end_time: f64,
  ) -> Vec<&FrameRecognitionResult> {
    self
      .frame_results
      .iter()
      .filter(|fr| fr.timestamp >= start_time && fr.timestamp <= end_time)
      .collect()
  }

  /// Получить результаты по классу
  #[allow(dead_code)]
  pub fn get_results_by_class(&self, class_name: &str) -> Vec<&FrameRecognitionResult> {
    self
      .frame_results
      .iter()
      .filter(|fr| fr.detections.iter().any(|d| d.class == class_name))
      .collect()
  }
}

/// Форматировщик результатов для различных форматов вывода
pub struct ResultFormatter;

impl ResultFormatter {
  /// Форматировать результаты в читаемый текст
  pub fn format_as_text(results: &AggregatedResults) -> String {
    let mut output = String::new();

    output.push_str(&format!(
      "=== Recognition Summary ===\n\
             Total frames processed: {}\n\
             Frames with detections: {} ({:.1}%)\n\
             Total detections: {}\n\
             Unique classes: {}\n\
             Processing time: {:.2}s\n\n",
      results.summary.total_frames,
      results.summary.frames_with_detections,
      (results.summary.frames_with_detections as f64 / results.summary.total_frames as f64) * 100.0,
      results.summary.total_detections,
      results.summary.unique_classes,
      results.summary.processing_time_seconds
    ));

    output.push_str("=== Class Statistics ===\n");
    let mut sorted_classes: Vec<_> = results.class_statistics.iter().collect();
    sorted_classes.sort_by_key(|(name, _)| *name);

    for (class_name, stats) in sorted_classes {
      output.push_str(&format!(
        "\n{}: {} detections\n\
                 - Average confidence: {:.2}%\n\
                 - Confidence range: {:.2}% - {:.2}%\n\
                 - Detected in {} frames\n",
        class_name,
        stats.total_detections,
        stats.average_confidence * 100.0,
        stats.min_confidence * 100.0,
        stats.max_confidence * 100.0,
        stats.frames_detected.len()
      ));
    }

    output
  }

  /// Форматировать результаты в CSV
  pub fn format_as_csv(results: &AggregatedResults) -> String {
    let mut csv = String::from("frame_number,timestamp,class,confidence,x,y,width,height\n");

    for frame_result in &results.frame_results {
      for detection in &frame_result.detections {
        csv.push_str(&format!(
          "{},{},{},{},{},{},{},{}\n",
          frame_result.frame_number,
          frame_result.timestamp,
          detection.class,
          detection.confidence,
          detection.bbox.x,
          detection.bbox.y,
          detection.bbox.width,
          detection.bbox.height
        ));
      }
    }

    csv
  }

  /// Форматировать результаты для временной шкалы
  #[allow(dead_code)]
  pub fn format_for_timeline(results: &AggregatedResults) -> Vec<TimelineSegment> {
    let mut segments = Vec::new();
    let mut current_segments: HashMap<String, TimelineSegment> = HashMap::new();

    for frame_result in &results.frame_results {
      let detected_classes: Vec<String> = frame_result
        .detections
        .iter()
        .map(|d| d.class.clone())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

      // Закрываем сегменты для классов, которые больше не обнаруживаются
      let mut to_close = Vec::new();
      for (class_name, segment) in current_segments.iter() {
        if !detected_classes.contains(class_name) {
          to_close.push((class_name.clone(), segment.clone()));
        }
      }

      for (class_name, mut segment) in to_close {
        segment.end_time = frame_result.timestamp;
        segments.push(segment);
        current_segments.remove(&class_name);
      }

      // Открываем новые сегменты для новых классов
      for class_name in detected_classes {
        if !current_segments.contains_key(&class_name) {
          current_segments.insert(
            class_name.clone(),
            TimelineSegment {
              class_name,
              start_time: frame_result.timestamp,
              end_time: frame_result.timestamp,
              detection_count: 1,
            },
          );
        } else {
          current_segments
            .get_mut(&class_name)
            .unwrap()
            .detection_count += 1;
        }
      }
    }

    // Закрываем оставшиеся сегменты
    for (_, segment) in current_segments {
      segments.push(segment);
    }

    // Сортируем по времени начала
    segments.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());
    segments
  }
}

/// Сегмент временной шкалы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineSegment {
  pub class_name: String,
  pub start_time: f64,
  pub end_time: f64,
  pub detection_count: usize,
}

impl Default for ResultAggregator {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::recognition::frame_processor::BoundingBox;

  #[test]
  fn test_result_aggregation() {
    let mut aggregator = ResultAggregator::new();

    // Добавляем результаты
    aggregator.add_frame_result(
      0,
      0.0,
      vec![Detection {
        class: "person".to_string(),
        class_id: 0,
        confidence: 0.95,
        bbox: BoundingBox {
          x: 100.0,
          y: 100.0,
          width: 50.0,
          height: 100.0,
        },
        attributes: None,
      }],
    );

    aggregator.add_frame_result(
      1,
      0.033,
      vec![Detection {
        class: "person".to_string(),
        class_id: 0,
        confidence: 0.92,
        bbox: BoundingBox {
          x: 105.0,
          y: 100.0,
          width: 50.0,
          height: 100.0,
        },
        attributes: None,
      }],
    );

    let results = aggregator.aggregate();

    assert_eq!(results.summary.total_frames, 2);
    assert_eq!(results.summary.frames_with_detections, 2);
    assert_eq!(results.summary.total_detections, 2);
    assert_eq!(results.summary.unique_classes, 1);

    let person_stats = &results.class_statistics["person"];
    assert_eq!(person_stats.total_detections, 2);
    assert!((person_stats.average_confidence - 0.935).abs() < 0.001);
  }

  #[test]
  fn test_csv_formatting() {
    let results = AggregatedResults {
      frame_results: vec![FrameRecognitionResult {
        frame_number: 0,
        timestamp: 0.0,
        detections: vec![Detection {
          class: "car".to_string(),
          class_id: 2,
          confidence: 0.85,
          bbox: BoundingBox {
            x: 200.0,
            y: 150.0,
            width: 80.0,
            height: 60.0,
          },
          attributes: None,
        }],
      }],
      class_statistics: HashMap::new(),
      summary: RecognitionSummary {
        total_frames: 1,
        frames_with_detections: 1,
        total_detections: 1,
        unique_classes: 1,
        processing_time_seconds: 0.1,
      },
    };

    let csv = ResultFormatter::format_as_csv(&results);
    assert!(csv.contains("frame_number,timestamp,class,confidence,x,y,width,height"));
    assert!(csv.contains("0,0,car,0.85,200,150,80,60"));
  }
}
