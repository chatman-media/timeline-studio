/**
 * Example: Face Clustering Pipeline
 * 
 * Демонстрирует полный процесс кластеризации лиц:
 * 1. Извлечение эмбеддингов через FaceNet
 * 2. Кластеризация через DBSCAN
 * 3. Интеграция с PersonDatabase
 */

use crate::person_database::PersonDatabase;
use crate::person_clustering::PersonClusteringService;
use crate::face_clustering::{DBSCANParams, FaceClusteringEngine};
use crate::facenet_processor::FaceNetProcessor;
use crate::retinaface_processor::RetinaFaceProcessor;
use std::path::PathBuf;

/// Пример полного пайплайна кластеризации
pub async fn run_clustering_pipeline(
    video_frames: Vec<PathBuf>,
    db_path: PathBuf,
) -> anyhow::Result<()> {
    println!("🚀 Запуск пайплайна кластеризации лиц...");
    
    // 1. Инициализация процессоров
    let retinaface = RetinaFaceProcessor::new(PathBuf::from("models/retinaface.onnx"))?;
    let facenet = FaceNetProcessor::new(PathBuf::from("models/facenet.onnx"))?;
    
    // 2. Извлечение лиц и эмбеддингов
    let mut all_embeddings = Vec::new();
    let mut timestamps = Vec::new();
    let mut bboxes = Vec::new();
    
    for (idx, frame_path) in video_frames.iter().enumerate() {
        println!("📸 Обработка кадра {}/{}", idx + 1, video_frames.len());
        
        // Детекция лиц
        let faces = retinaface.detect_faces_from_file(frame_path)?;
        
        // Генерация эмбеддингов для каждого лица
        for face in faces {
            if let Ok(embedding) = facenet.generate_embedding_from_detection(frame_path, &face) {
                all_embeddings.push(embedding);
                timestamps.push(idx as f32 / 30.0); // Предполагаем 30 FPS
                bboxes.push([face.bbox.x, face.bbox.y, face.bbox.width, face.bbox.height]);
            }
        }
    }
    
    println!("✅ Извлечено {} эмбеддингов", all_embeddings.len());
    
    // 3. Кластеризация
    let params = DBSCANParams {
        eps: 0.45,           // Порог для видео
        min_samples: 5,      // Минимум 5 лиц для персоны
        metric: crate::face_clustering::DistanceMetric::Cosine,
    };
    
    let clustering_engine = FaceClusteringEngine::new(params);
    let clustering_result = clustering_engine.cluster_faces(&all_embeddings)?;
    
    println!("🎯 Результаты кластеризации:");
    println!("   - Найдено персон: {}", clustering_result.clusters.len());
    println!("   - Шумовых лиц: {}", clustering_result.noise_points.len());
    println!("   - Покрытие: {:.1}%", clustering_result.get_coverage() * 100.0);
    
    // 4. Интеграция с базой данных
    let mut db = PersonDatabase::new(db_path).await?;
    let clustering_service = PersonClusteringService::new(db.clone()).await?;
    
    let metadata = crate::person_clustering::ClusterMetadata {
        file_id: "video_001".to_string(),
        timestamps,
        bboxes,
        frame_paths: video_frames.iter().map(|p| p.to_string_lossy().to_string()).collect(),
    };
    
    let integration_result = clustering_service.integrate_clusters(
        &clustering_result,
        &all_embeddings,
        &metadata,
    ).await?;
    
    println!("💾 Результаты интеграции:");
    println!("   - Создано персон: {}", integration_result.stats.new_persons);
    println!("   - Обновлено персон: {}", integration_result.stats.matched_persons);
    println!("   - Добавлено эмбеддингов: {}", integration_result.embeddings_added);
    
    // 5. Анализ главных персонажей
    if let Some(main_cluster) = clustering_result.get_largest_cluster() {
        println!("\n👤 Главный персонаж:");
        println!("   - Появлений: {}", main_cluster.face_indices.len());
        println!("   - Уверенность: {:.2}", main_cluster.confidence);
        
        let time_range = main_cluster.face_indices.iter()
            .filter_map(|&idx| metadata.timestamps.get(idx))
            .fold((f32::INFINITY, f32::NEG_INFINITY), |(min, max), &t| {
                (min.min(t), max.max(t))
            });
        
        println!("   - Время появления: {:.1}s - {:.1}s", time_range.0, time_range.1);
    }
    
    Ok(())
}

/// Пример поиска конкретного человека
pub async fn find_person_in_video(
    query_face_image: PathBuf,
    video_frames: Vec<PathBuf>,
) -> anyhow::Result<Vec<(usize, f32)>> {
    println!("🔍 Поиск человека в видео...");
    
    // 1. Извлекаем эмбеддинг искомого лица
    let retinaface = RetinaFaceProcessor::new(PathBuf::from("models/retinaface.onnx"))?;
    let facenet = FaceNetProcessor::new(PathBuf::from("models/facenet.onnx"))?;
    
    let query_faces = retinaface.detect_faces_from_file(&query_face_image)?;
    if query_faces.is_empty() {
        return Err(anyhow::anyhow!("Лицо не найдено на изображении"));
    }
    
    let query_embedding = facenet.generate_embedding_from_detection(&query_face_image, &query_faces[0])?;
    
    // 2. Ищем похожие лица в видео
    let mut matches = Vec::new();
    
    for (frame_idx, frame_path) in video_frames.iter().enumerate() {
        let faces = retinaface.detect_faces_from_file(frame_path)?;
        
        for face in faces {
            if let Ok(embedding) = facenet.generate_embedding_from_detection(frame_path, &face) {
                let similarity = cosine_similarity(&query_embedding, &embedding);
                
                if similarity > 0.7 {
                    matches.push((frame_idx, similarity));
                    println!("   ✓ Найдено совпадение в кадре {} (сходство: {:.2})", frame_idx, similarity);
                }
            }
        }
    }
    
    println!("📊 Найдено {} совпадений", matches.len());
    Ok(matches)
}

/// Вычисление косинусного сходства
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot / (norm_a * norm_b)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 0.001);
        
        let c = vec![0.0, 1.0, 0.0];
        assert!((cosine_similarity(&a, &c) - 0.0).abs() < 0.001);
    }
}