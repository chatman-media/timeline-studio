/**
 * Face Clustering - Smart clustering for grouping faces of the same person
 * Uses DBSCAN algorithm for automatic face grouping based on embeddings similarity
 */
use anyhow::{anyhow, Result};
use ndarray::{Array1, Array2};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Результат кластеризации
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusteringResult {
  /// Кластеры (группы лиц)
  pub clusters: Vec<FaceCluster>,
  /// Индексы лиц, которые не попали ни в один кластер (шум)
  pub noise_points: Vec<usize>,
  /// Статистика кластеризации
  pub stats: ClusteringStats,
}

/// Кластер лиц одного человека
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceCluster {
  /// ID кластера
  pub id: String,
  /// Индексы лиц в этом кластере
  pub face_indices: Vec<usize>,
  /// Средний эмбеддинг кластера (центроид)
  pub centroid: Vec<f32>,
  /// Confidence score кластера (среднее сходство внутри кластера)
  pub confidence: f32,
  /// Предполагаемое имя человека (если известно)
  pub person_name: Option<String>,
}

/// Статистика кластеризации
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ClusteringStats {
  /// Общее количество лиц
  pub total_faces: usize,
  /// Количество кластеров
  pub num_clusters: usize,
  /// Количество шумовых точек
  pub num_noise: usize,
  /// Средний размер кластера
  pub avg_cluster_size: f32,
  /// Максимальный размер кластера
  pub max_cluster_size: usize,
  /// Минимальный размер кластера
  pub min_cluster_size: usize,
}

/// Параметры для DBSCAN кластеризации
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DBSCANParams {
  /// Максимальное расстояние между точками в кластере (eps)
  /// Для косинусного расстояния: 0.4-0.6 хорошие значения
  pub eps: f32,
  /// Минимальное количество точек для формирования кластера
  pub min_samples: usize,
  /// Метрика расстояния
  pub metric: DistanceMetric,
}

impl Default for DBSCANParams {
  fn default() -> Self {
    Self {
      eps: 0.5,       // Порог косинусного расстояния
      min_samples: 3, // Минимум 3 лица для кластера
      metric: DistanceMetric::Cosine,
    }
  }
}

/// Метрики расстояния
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DistanceMetric {
  /// Косинусное расстояние (1 - косинусное сходство)
  Cosine,
  /// Евклидово расстояние
  Euclidean,
}

/// Face Clustering Engine
pub struct FaceClusteringEngine {
  params: DBSCANParams,
}

impl FaceClusteringEngine {
  /// Создать новый движок кластеризации
  pub fn new(params: DBSCANParams) -> Self {
    Self { params }
  }

  /// Кластеризовать лица на основе их эмбеддингов
  pub fn cluster_faces(&self, embeddings: &[Vec<f32>]) -> Result<ClusteringResult> {
    if embeddings.is_empty() {
      return Ok(ClusteringResult {
        clusters: vec![],
        noise_points: vec![],
        stats: ClusteringStats {
          total_faces: 0,
          num_clusters: 0,
          num_noise: 0,
          avg_cluster_size: 0.0,
          max_cluster_size: 0,
          min_cluster_size: 0,
        },
      });
    }

    // Преобразуем в матрицу для удобства
    let n_samples = embeddings.len();
    let n_features = embeddings[0].len();
    let mut data = Array2::<f32>::zeros((n_samples, n_features));

    for (i, embedding) in embeddings.iter().enumerate() {
      for (j, &value) in embedding.iter().enumerate() {
        data[[i, j]] = value;
      }
    }

    // Запускаем DBSCAN
    let labels = self.dbscan(&data)?;

    // Группируем результаты
    self.build_clusters(embeddings, &labels)
  }

  /// DBSCAN алгоритм
  fn dbscan(&self, data: &Array2<f32>) -> Result<Vec<i32>> {
    let n_samples = data.nrows();
    let mut labels = vec![-1i32; n_samples]; // -1 означает шум
    let mut visited = vec![false; n_samples];
    let mut cluster_id = 0;

    for i in 0..n_samples {
      if visited[i] {
        continue;
      }

      visited[i] = true;

      // Находим соседей
      let neighbors = self.find_neighbors(data, i)?;

      if neighbors.len() < self.params.min_samples {
        // Точка является шумом
        labels[i] = -1;
      } else {
        // Начинаем новый кластер
        self.expand_cluster(data, i, neighbors, cluster_id, &mut labels, &mut visited)?;
        cluster_id += 1;
      }
    }

    Ok(labels)
  }

  /// Найти всех соседей точки в пределах eps
  fn find_neighbors(&self, data: &Array2<f32>, point_idx: usize) -> Result<Vec<usize>> {
    let mut neighbors = Vec::new();
    let point = data.row(point_idx);

    for i in 0..data.nrows() {
      let distance = self.compute_distance(&point.to_owned(), &data.row(i).to_owned())?;
      if distance <= self.params.eps {
        neighbors.push(i);
      }
    }

    Ok(neighbors)
  }

  /// Расширить кластер
  fn expand_cluster(
    &self,
    data: &Array2<f32>,
    point_idx: usize,
    mut neighbors: Vec<usize>,
    cluster_id: i32,
    labels: &mut [i32],
    visited: &mut [bool],
  ) -> Result<()> {
    labels[point_idx] = cluster_id;

    let mut i = 0;
    while i < neighbors.len() {
      let neighbor_idx = neighbors[i];

      if !visited[neighbor_idx] {
        visited[neighbor_idx] = true;

        let new_neighbors = self.find_neighbors(data, neighbor_idx)?;
        if new_neighbors.len() >= self.params.min_samples {
          // Добавляем новых соседей к списку для обработки
          for &n in &new_neighbors {
            if !neighbors.contains(&n) {
              neighbors.push(n);
            }
          }
        }
      }

      if labels[neighbor_idx] == -1 {
        labels[neighbor_idx] = cluster_id;
      }

      i += 1;
    }

    Ok(())
  }

  /// Вычислить расстояние между двумя эмбеддингами
  fn compute_distance(&self, a: &Array1<f32>, b: &Array1<f32>) -> Result<f32> {
    match self.params.metric {
      DistanceMetric::Cosine => {
        // Косинусное расстояние = 1 - косинусное сходство
        let dot_product = a.dot(b);
        let norm_a = a.dot(a).sqrt();
        let norm_b = b.dot(b).sqrt();

        if norm_a == 0.0 || norm_b == 0.0 {
          return Ok(1.0);
        }

        let cosine_similarity = dot_product / (norm_a * norm_b);
        Ok(1.0 - cosine_similarity.clamp(-1.0, 1.0))
      }
      DistanceMetric::Euclidean => {
        // Евклидово расстояние
        let diff = a - b;
        Ok(diff.dot(&diff).sqrt())
      }
    }
  }

  /// Построить кластеры из меток
  fn build_clusters(&self, embeddings: &[Vec<f32>], labels: &[i32]) -> Result<ClusteringResult> {
    let mut clusters_map: HashMap<i32, Vec<usize>> = HashMap::new();
    let mut noise_points = Vec::new();

    // Группируем индексы по кластерам
    for (idx, &label) in labels.iter().enumerate() {
      if label == -1 {
        noise_points.push(idx);
      } else {
        clusters_map.entry(label).or_default().push(idx);
      }
    }

    // Создаем структуры кластеров
    let mut clusters = Vec::new();
    for (cluster_id, face_indices) in clusters_map {
      // Вычисляем центроид кластера
      let centroid = self.compute_centroid(embeddings, &face_indices)?;

      // Вычисляем внутрикластерное сходство
      let confidence = self.compute_cluster_confidence(embeddings, &face_indices)?;

      clusters.push(FaceCluster {
        id: format!("cluster_{}", cluster_id),
        face_indices,
        centroid,
        confidence,
        person_name: None,
      });
    }

    // Сортируем кластеры по размеру (больше лиц = вероятно главный герой)
    clusters.sort_by(|a, b| b.face_indices.len().cmp(&a.face_indices.len()));

    // Вычисляем статистику
    let stats = self.compute_stats(&clusters, noise_points.len(), embeddings.len());

    Ok(ClusteringResult {
      clusters,
      noise_points,
      stats,
    })
  }

  /// Вычислить центроид кластера
  fn compute_centroid(&self, embeddings: &[Vec<f32>], indices: &[usize]) -> Result<Vec<f32>> {
    if indices.is_empty() {
      return Err(anyhow!("Cannot compute centroid of empty cluster"));
    }

    let dim = embeddings[0].len();
    let mut centroid = vec![0.0f32; dim];

    for &idx in indices {
      for (i, &val) in embeddings[idx].iter().enumerate() {
        centroid[i] += val;
      }
    }

    // Усредняем
    let n = indices.len() as f32;
    for val in &mut centroid {
      *val /= n;
    }

    // Нормализуем для косинусной метрики
    if matches!(self.params.metric, DistanceMetric::Cosine) {
      let norm = centroid.iter().map(|&x| x * x).sum::<f32>().sqrt();
      if norm > 0.0 {
        for val in &mut centroid {
          *val /= norm;
        }
      }
    }

    Ok(centroid)
  }

  /// Вычислить confidence кластера (среднее внутрикластерное сходство)
  fn compute_cluster_confidence(&self, embeddings: &[Vec<f32>], indices: &[usize]) -> Result<f32> {
    if indices.len() < 2 {
      return Ok(1.0);
    }

    let mut total_similarity = 0.0;
    let mut count = 0;

    for i in 0..indices.len() {
      for j in (i + 1)..indices.len() {
        let emb1 = Array1::from_vec(embeddings[indices[i]].clone());
        let emb2 = Array1::from_vec(embeddings[indices[j]].clone());

        let distance = self.compute_distance(&emb1, &emb2)?;
        let similarity = 1.0 - distance; // Преобразуем расстояние в сходство

        total_similarity += similarity;
        count += 1;
      }
    }

    Ok(if count > 0 {
      total_similarity / count as f32
    } else {
      1.0
    })
  }

  /// Вычислить статистику кластеризации
  fn compute_stats(
    &self,
    clusters: &[FaceCluster],
    num_noise: usize,
    total_faces: usize,
  ) -> ClusteringStats {
    let cluster_sizes: Vec<usize> = clusters.iter().map(|c| c.face_indices.len()).collect();

    let avg_cluster_size = if clusters.is_empty() {
      0.0
    } else {
      cluster_sizes.iter().sum::<usize>() as f32 / clusters.len() as f32
    };

    ClusteringStats {
      total_faces,
      num_clusters: clusters.len(),
      num_noise,
      avg_cluster_size,
      max_cluster_size: cluster_sizes.iter().max().copied().unwrap_or(0),
      min_cluster_size: cluster_sizes.iter().min().copied().unwrap_or(0),
    }
  }
}

/// Дополнительные утилиты для работы с кластерами
impl FaceClusteringEngine {
  /// Объединить два кластера
  pub fn merge_clusters(
    &self,
    cluster1: &FaceCluster,
    cluster2: &FaceCluster,
    embeddings: &[Vec<f32>],
  ) -> Result<FaceCluster> {
    let mut merged_indices = cluster1.face_indices.clone();
    merged_indices.extend(&cluster2.face_indices);

    let centroid = self.compute_centroid(embeddings, &merged_indices)?;
    let confidence = self.compute_cluster_confidence(embeddings, &merged_indices)?;

    Ok(FaceCluster {
      id: format!("{}_{}", cluster1.id, cluster2.id),
      face_indices: merged_indices,
      centroid,
      confidence,
      person_name: cluster1
        .person_name
        .clone()
        .or_else(|| cluster2.person_name.clone()),
    })
  }

  /// Найти ближайший кластер для нового эмбеддинга
  pub fn find_nearest_cluster(
    &self,
    embedding: &[f32],
    clusters: &[FaceCluster],
  ) -> Result<Option<(usize, f32)>> {
    if clusters.is_empty() {
      return Ok(None);
    }

    let emb_array = Array1::from_vec(embedding.to_vec());
    let mut best_idx = 0;
    let mut best_distance = f32::MAX;

    for (idx, cluster) in clusters.iter().enumerate() {
      let centroid_array = Array1::from_vec(cluster.centroid.clone());
      let distance = self.compute_distance(&emb_array, &centroid_array)?;

      if distance < best_distance {
        best_distance = distance;
        best_idx = idx;
      }
    }

    // Возвращаем только если расстояние меньше порога
    if best_distance <= self.params.eps {
      Ok(Some((best_idx, 1.0 - best_distance))) // Возвращаем similarity
    } else {
      Ok(None)
    }
  }

  /// Обновить параметры кластеризации
  pub fn update_params(&mut self, params: DBSCANParams) {
    self.params = params;
  }

  /// Получить текущие параметры
  pub fn get_params(&self) -> &DBSCANParams {
    &self.params
  }
}

/// Вспомогательные функции для анализа кластеров
impl ClusteringResult {
  /// Получить самый большой кластер (вероятно главный герой)
  pub fn get_largest_cluster(&self) -> Option<&FaceCluster> {
    self.clusters.first()
  }

  /// Получить кластеры с минимальным размером
  pub fn get_significant_clusters(&self, min_size: usize) -> Vec<&FaceCluster> {
    self
      .clusters
      .iter()
      .filter(|c| c.face_indices.len() >= min_size)
      .collect()
  }

  /// Получить общее покрытие (процент лиц в кластерах)
  pub fn get_coverage(&self) -> f32 {
    if self.stats.total_faces == 0 {
      return 0.0;
    }

    let clustered_faces = self.stats.total_faces - self.stats.num_noise;
    clustered_faces as f32 / self.stats.total_faces as f32
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn generate_test_embeddings() -> Vec<Vec<f32>> {
    // Генерируем тестовые эмбеддинги для 3 человек
    let mut embeddings = Vec::new();

    // Человек 1 (5 лиц) - высокие значения в начале вектора
    for i in 0..5 {
      let mut emb = vec![0.0; 128];
      emb[0] = 0.9;
      emb[1] = 0.8;
      emb[2] = 0.7 + i as f32 * 0.02; // Небольшая вариация
                                      // Нормализуем для косинусного сходства
      let norm = (emb.iter().map(|&x| x * x).sum::<f32>()).sqrt();
      for val in &mut emb {
        *val /= norm;
      }
      embeddings.push(emb);
    }

    // Человек 2 (3 лица) - высокие значения в середине вектора
    for i in 0..3 {
      let mut emb = vec![0.0; 128];
      emb[60] = 0.9;
      emb[61] = 0.8;
      emb[62] = 0.7 + i as f32 * 0.02;
      // Нормализуем
      let norm = (emb.iter().map(|&x| x * x).sum::<f32>()).sqrt();
      for val in &mut emb {
        *val /= norm;
      }
      embeddings.push(emb);
    }

    // Человек 3 (4 лица) - высокие значения в конце вектора
    for i in 0..4 {
      let mut emb = vec![0.0; 128];
      emb[120] = 0.9;
      emb[121] = 0.8;
      emb[122] = 0.7 + i as f32 * 0.02;
      // Нормализуем
      let norm = (emb.iter().map(|&x| x * x).sum::<f32>()).sqrt();
      for val in &mut emb {
        *val /= norm;
      }
      embeddings.push(emb);
    }

    // Шумовые точки (2 случайных лица) - равномерное распределение
    let mut noise1 = vec![0.1; 128];
    noise1[30] = 0.5;
    let norm = (noise1.iter().map(|&x| x * x).sum::<f32>()).sqrt();
    for val in &mut noise1 {
      *val /= norm;
    }
    embeddings.push(noise1);

    let mut noise2 = vec![0.1; 128];
    noise2[90] = 0.5;
    let norm = (noise2.iter().map(|&x| x * x).sum::<f32>()).sqrt();
    for val in &mut noise2 {
      *val /= norm;
    }
    embeddings.push(noise2);

    embeddings
  }

  #[test]
  fn test_clustering_engine_creation() {
    let params = DBSCANParams::default();
    let engine = FaceClusteringEngine::new(params);
    assert_eq!(engine.get_params().eps, 0.5);
    assert_eq!(engine.get_params().min_samples, 3);
  }

  #[test]
  fn test_clustering_basic() {
    let params = DBSCANParams {
      eps: 0.1, // Уменьшаем порог для более строгой кластеризации
      min_samples: 2,
      metric: DistanceMetric::Cosine,
    };
    let engine = FaceClusteringEngine::new(params);

    let embeddings = generate_test_embeddings();
    let result = engine.cluster_faces(&embeddings).unwrap();

    // Должно быть 3 кластера
    assert_eq!(result.clusters.len(), 3);
    // И 2 шумовые точки
    assert_eq!(result.noise_points.len(), 2);

    // Проверяем размеры кластеров
    assert_eq!(result.clusters[0].face_indices.len(), 5); // Самый большой
    assert_eq!(result.stats.max_cluster_size, 5);
    assert_eq!(result.stats.min_cluster_size, 3);
  }

  #[test]
  fn test_empty_clustering() {
    let engine = FaceClusteringEngine::new(DBSCANParams::default());
    let result = engine.cluster_faces(&[]).unwrap();

    assert_eq!(result.clusters.len(), 0);
    assert_eq!(result.noise_points.len(), 0);
    assert_eq!(result.stats.total_faces, 0);
  }

  #[test]
  fn test_find_nearest_cluster() {
    let params = DBSCANParams {
      eps: 0.1,
      min_samples: 2,
      metric: DistanceMetric::Cosine,
    };
    let engine = FaceClusteringEngine::new(params);

    let embeddings = generate_test_embeddings();
    let result = engine.cluster_faces(&embeddings).unwrap();

    // Создаем новый эмбеддинг похожий на первый кластер
    let mut new_embedding = vec![0.0; 128];
    new_embedding[0] = 0.9;
    new_embedding[1] = 0.8;
    new_embedding[2] = 0.72;
    // Нормализуем
    let norm = (new_embedding.iter().map(|&x| x * x).sum::<f32>()).sqrt();
    for val in &mut new_embedding {
      *val /= norm;
    }

    let nearest = engine
      .find_nearest_cluster(&new_embedding, &result.clusters)
      .unwrap();
    assert!(nearest.is_some());

    let (cluster_idx, similarity) = nearest.unwrap();
    assert_eq!(cluster_idx, 0); // Должен найти первый кластер
    assert!(similarity > 0.9); // Высокое сходство
  }

  #[test]
  fn test_cluster_coverage() {
    let params = DBSCANParams {
      eps: 0.1,
      min_samples: 2,
      metric: DistanceMetric::Cosine,
    };
    let engine = FaceClusteringEngine::new(params);

    let embeddings = generate_test_embeddings();
    let result = engine.cluster_faces(&embeddings).unwrap();

    let coverage = result.get_coverage();
    // 12 из 14 лиц в кластерах
    assert_eq!(coverage, 12.0 / 14.0);
  }

  #[test]
  fn test_significant_clusters() {
    let params = DBSCANParams {
      eps: 0.1,
      min_samples: 2,
      metric: DistanceMetric::Cosine,
    };
    let engine = FaceClusteringEngine::new(params);

    let embeddings = generate_test_embeddings();
    let result = engine.cluster_faces(&embeddings).unwrap();

    let significant = result.get_significant_clusters(4);
    assert_eq!(significant.len(), 2); // Только кластеры с 4+ лицами
  }
}
