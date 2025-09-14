use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::recognition::person_database::{PersonProfile, SimilaritySearchResult};
use crate::recognition::types::DetectedFace;
use crate::recognition::person_database::PersonDatabase;

pub struct PersonClusteringService {
    database: Arc<Mutex<PersonDatabase>>,
}

impl PersonClusteringService {
    pub async fn new(database_path: impl AsRef<std::path::Path>) -> Result<Self, String> {
        let database = PersonDatabase::new(database_path.as_ref().to_path_buf())
            .await
            .map_err(|e| e.to_string())?;
        
        Ok(Self {
            database: Arc::new(Mutex::new(database)),
        })
    }

    pub async fn cluster_and_identify(&self, _faces: Vec<DetectedFace>) -> Result<Vec<PersonProfile>, String> {
        let db = self.database.lock().await;
        let persons = db.get_all_persons().await
            .map_err(|e| e.to_string())?;
        
        Ok(persons)
    }

    pub async fn get_all_persons(&self) -> Result<Vec<PersonProfile>, String> {
        let db = self.database.lock().await;
        db.get_all_persons().await
            .map_err(|e| e.to_string())
    }

    pub async fn get_person(&self, person_id: Uuid) -> Result<Option<PersonProfile>, String> {
        let db = self.database.lock().await;
        db.get_person(person_id).await
            .map_err(|e| e.to_string())
    }

    pub async fn create_person(&self, profile: PersonProfile) -> Result<PersonProfile, String> {
        let db = self.database.lock().await;
        db.create_person(profile.clone()).await
            .map_err(|e| e.to_string())?;
        
        Ok(profile)
    }

    pub async fn update_person(&self, _person_id: Uuid, profile: PersonProfile) -> Result<PersonProfile, String> {
        let db = self.database.lock().await;
        db.update_person(profile.clone()).await
            .map_err(|e| e.to_string())?;
        
        Ok(profile)
    }

    pub async fn delete_person(&self, person_id: Uuid) -> Result<(), String> {
        let db = self.database.lock().await;
        db.delete_person(person_id).await
            .map_err(|e| e.to_string())
    }

    pub async fn find_similar_persons(
        &self,
        embedding: Vec<f32>,
        limit: usize,
    ) -> Result<Vec<SimilaritySearchResult>, String> {
        let db = self.database.lock().await;
        db.find_similar_persons(&embedding, limit).await
            .map_err(|e| e.to_string())
    }

    pub async fn get_video_persons(&self, _video_id: &str) -> Result<Vec<PersonProfile>, String> {
        let db = self.database.lock().await;
        db.get_all_persons().await
            .map_err(|e| e.to_string())
    }
}