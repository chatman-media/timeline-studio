//! Plan Generator Service
//!
//! Generates optimized montage plans using genetic algorithms.

use crate::montage_planner::types::*;
use rand::prelude::*;
// use rand::{rngs::StdRng, SeedableRng};
use serde::{Deserialize, Serialize};

/// Service for generating optimized montage plans
pub struct PlanGenerator {
  /// Configuration for plan generation
  config: PlanGenerationConfig,
  // Random number generator is created per-call to ensure thread-safety
}

/// Configuration for plan generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanGenerationConfig {
  pub population_size: usize,
  pub generations: usize,
  pub mutation_rate: f32,
  pub crossover_rate: f32,
  pub elite_percentage: f32,
  pub fitness_weights: FitnessWeights,
  pub adaptive_mutation: bool,
  pub local_search_iterations: usize,
  pub diversity_preservation: f32,
}

/// Weights for fitness function components
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FitnessWeights {
  pub quality_weight: f32,
  pub diversity_weight: f32,
  pub rhythm_weight: f32,
  pub narrative_weight: f32,
  pub technical_weight: f32,
}

/// Individual in the genetic algorithm population
#[derive(Debug, Clone)]
struct Individual {
  genes: Vec<usize>, // Indices of selected moments
  fitness: f32,
  #[allow(dead_code)] // Used for caching generated plans
  plan: Option<MontagePlan>,
  age: usize, // Generation when created
  diversity_contribution: f32,
}

/// Plan generation statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationStats {
  pub generation: usize,
  pub best_fitness: f32,
  pub average_fitness: f32,
  pub diversity_score: f32,
  pub convergence_rate: f32,
}

impl Default for PlanGenerationConfig {
  fn default() -> Self {
    Self {
      population_size: 50,
      generations: 100,
      mutation_rate: 0.1,
      crossover_rate: 0.8,
      elite_percentage: 0.2,
      fitness_weights: FitnessWeights::default(),
      adaptive_mutation: true,
      local_search_iterations: 5,
      diversity_preservation: 0.3,
    }
  }
}

impl Default for FitnessWeights {
  fn default() -> Self {
    Self {
      quality_weight: 0.3,
      diversity_weight: 0.2,
      rhythm_weight: 0.2,
      narrative_weight: 0.15,
      technical_weight: 0.15,
    }
  }
}

impl PlanGenerator {
  /// Create new plan generator
  pub fn new() -> Self {
    Self {
      config: PlanGenerationConfig::default(),
    }
  }

  /// Create generator with custom configuration
  pub fn with_config(config: PlanGenerationConfig) -> Self {
    Self { config }
  }

  /// Generate optimized montage plan using genetic algorithm
  pub fn generate_plan(
    &mut self,
    moments: &[DetectedMoment],
    config: &MontageConfig,
    source_files: &[String],
  ) -> Result<MontagePlan, MontageError> {
    if moments.is_empty() {
      return Err(MontageError::InsufficientContent(
        "No moments provided for plan generation".to_string(),
      ));
    }

    // Calculate target number of clips based on duration and style
    let target_clips = self.calculate_target_clip_count(config);

    if target_clips == 0 {
      return Err(MontageError::InvalidConfiguration(
        "Target duration too short for any clips".to_string(),
      ));
    }

    // Initialize population
    let mut population = self.initialize_population(moments, target_clips);

    // Evaluate initial fitness
    for individual in &mut population {
      individual.fitness = self.calculate_fitness(individual, moments, config);
    }

    let mut generation_stats = Vec::new();

    // Track best solution across generations
    let mut global_best: Option<Individual> = None;
    let mut stagnation_counter = 0;

    // Evolve population
    for generation in 0..self.config.generations {
      // Apply adaptive mutation rate
      let current_mutation_rate = if self.config.adaptive_mutation {
        self.calculate_adaptive_mutation_rate(generation, &generation_stats)
      } else {
        self.config.mutation_rate
      };

      // Selection, crossover, mutation
      population = self.evolve_population(
        population,
        moments,
        config,
        generation,
        current_mutation_rate,
      );

      // Apply local search to elite individuals
      if generation % 10 == 0 {
        self.apply_local_search(&mut population, moments, config);
      }

      // Calculate generation statistics
      let stats = self.calculate_generation_stats(&population, generation);

      // Update global best
      let current_best = population
        .iter()
        .max_by(|a, b| a.fitness.partial_cmp(&b.fitness).unwrap())
        .unwrap();
      if global_best.is_none() || current_best.fitness > global_best.as_ref().unwrap().fitness {
        global_best = Some(current_best.clone());
        stagnation_counter = 0;
      } else {
        stagnation_counter += 1;
      }

      generation_stats.push(stats);

      // Early termination conditions
      if generation > 10 && (self.has_converged(&generation_stats) || stagnation_counter > 20) {
        break;
      }

      // Inject diversity if needed
      if stagnation_counter > 10 {
        self.inject_diversity(&mut population, moments, generation);
      }
    }

    // Select best individual (use global best if available)
    let best_individual = global_best.as_ref().unwrap_or_else(|| {
      population
        .iter()
        .max_by(|a, b| a.fitness.partial_cmp(&b.fitness).unwrap())
        .unwrap()
    });

    // Generate final plan from best individual
    self.create_montage_plan(best_individual, moments, config, source_files)
  }

  /// Calculate target number of clips
  fn calculate_target_clip_count(&self, config: &MontageConfig) -> usize {
    let avg_clip_duration = match config.style {
      MontageStyle::DynamicAction => 2.0,
      MontageStyle::MusicVideo => 1.5,
      MontageStyle::SocialMedia => 3.0,
      MontageStyle::CinematicDrama => 4.0,
      MontageStyle::Documentary => 5.0,
      _ => 3.0,
    };

    let target_clips = (config.target_duration / avg_clip_duration) as usize;

    // Apply cuts per minute limit if specified
    if let Some(max_cuts_per_minute) = config.max_cuts_per_minute {
      let max_total_cuts = (config.target_duration / 60.0 * max_cuts_per_minute as f64) as usize;
      target_clips.min(max_total_cuts)
    } else {
      target_clips
    }
    .max(1) // At least one clip
  }

  /// Initialize population with random individuals
  fn initialize_population(
    &mut self,
    moments: &[DetectedMoment],
    target_clips: usize,
  ) -> Vec<Individual> {
    let mut population = Vec::new();

    for _ in 0..self.config.population_size {
      let mut genes = Vec::new();
      let mut used_indices = std::collections::HashSet::new();

      // Select random moments without replacement
      while genes.len() < target_clips && genes.len() < moments.len() {
        let mut rng = rand::rng();
        let index = rng.random_range(0..moments.len());
        if used_indices.insert(index) {
          genes.push(index);
        }
      }

      // Sort by timestamp to maintain chronological order
      genes.sort_by(|&a, &b| {
        moments[a]
          .timestamp
          .partial_cmp(&moments[b].timestamp)
          .unwrap()
      });

      population.push(Individual {
        genes,
        fitness: 0.0,
        plan: None,
        age: 0,
        diversity_contribution: 0.0,
      });
    }

    // Add some elite individuals based on moment scores
    let mut elite_moments: Vec<_> = (0..moments.len()).collect();
    elite_moments.sort_by(|&a, &b| {
      moments[b]
        .total_score
        .partial_cmp(&moments[a].total_score)
        .unwrap()
    });

    if elite_moments.len() >= target_clips {
      population[0].genes = elite_moments[..target_clips].to_vec();
      population[0].genes.sort_by(|&a, &b| {
        moments[a]
          .timestamp
          .partial_cmp(&moments[b].timestamp)
          .unwrap()
      });
    }

    population
  }

  /// Evolve population through selection, crossover, and mutation
  fn evolve_population(
    &mut self,
    mut population: Vec<Individual>,
    moments: &[DetectedMoment],
    config: &MontageConfig,
    generation: usize,
    mutation_rate: f32,
  ) -> Vec<Individual> {
    // Sort by fitness
    population.sort_by(|a, b| b.fitness.partial_cmp(&a.fitness).unwrap());

    let elite_count = (self.config.elite_percentage * population.len() as f32) as usize;
    let mut new_population = Vec::new();

    // Keep elite individuals
    new_population.extend(population[..elite_count].iter().cloned());

    // Generate offspring
    while new_population.len() < population.len() {
      let parent1_idx = self.tournament_selection(&population);
      let parent2_idx = self.tournament_selection(&population);

      let mut child1 = population[parent1_idx].clone();
      let mut child2 = population[parent2_idx].clone();

      // Crossover
      let mut rng = rand::rng();
      if rng.random::<f32>() < self.config.crossover_rate {
        self.crossover(&mut child1, &mut child2, moments.len());
      }

      // Mutation with adaptive rate
      if rng.random::<f32>() < mutation_rate {
        self.mutate(&mut child1, moments.len());
      }
      if rng.random::<f32>() < mutation_rate {
        self.mutate(&mut child2, moments.len());
      }

      // Set age for new individuals
      child1.age = generation;
      child2.age = generation;

      // Evaluate fitness
      child1.fitness = self.calculate_fitness(&child1, moments, config);
      child2.fitness = self.calculate_fitness(&child2, moments, config);

      new_population.push(child1);
      if new_population.len() < population.len() {
        new_population.push(child2);
      }
    }

    // Update diversity contributions
    self.update_diversity_contributions(&mut new_population);

    new_population
  }

  /// Tournament selection with diversity consideration
  fn tournament_selection(&mut self, population: &[Individual]) -> usize {
    let tournament_size = 3;
    let mut candidates = Vec::new();

    // Select random candidates
    for _ in 0..tournament_size {
      let mut rng = rand::rng();
      candidates.push(rng.random_range(0..population.len()));
    }

    // Select based on fitness and diversity contribution

    candidates
      .into_iter()
      .max_by(|&a, &b| {
        let score_a = population[a].fitness
          + self.config.diversity_preservation * population[a].diversity_contribution;
        let score_b = population[b].fitness
          + self.config.diversity_preservation * population[b].diversity_contribution;
        score_a.partial_cmp(&score_b).unwrap()
      })
      .unwrap()
  }

  /// Crossover operation
  fn crossover(
    &mut self,
    child1: &mut Individual,
    child2: &mut Individual,
    _max_moment_index: usize,
  ) {
    let len = child1.genes.len().min(child2.genes.len());
    if len < 2 {
      return;
    }

    let mut rng = rand::rng();
    let crossover_point = rng.random_range(1..len);

    // Create new children by combining parents
    let mut new_genes1 = child1.genes[..crossover_point].to_vec();
    let mut new_genes2 = child2.genes[..crossover_point].to_vec();

    // Add non-duplicate genes from second parent
    for &gene in &child2.genes[crossover_point..] {
      if !new_genes1.contains(&gene) {
        new_genes1.push(gene);
      }
    }

    for &gene in &child1.genes[crossover_point..] {
      if !new_genes2.contains(&gene) {
        new_genes2.push(gene);
      }
    }

    child1.genes = new_genes1;
    child2.genes = new_genes2;
  }

  /// Enhanced mutation operation with more strategies
  fn mutate(&mut self, individual: &mut Individual, max_moment_index: usize) {
    if individual.genes.is_empty() {
      return;
    }

    let mut rng = rand::rng();
    let mutation_type = rng.random_range(0..5);

    match mutation_type {
      0 => {
        // Replace random gene
        let gene_idx = rng.random_range(0..individual.genes.len());
        let mut new_gene = rng.random_range(0..max_moment_index);
        let mut attempts = 0;
        while individual.genes.contains(&new_gene) && attempts < 10 {
          new_gene = rng.random_range(0..max_moment_index);
          attempts += 1;
        }
        if !individual.genes.contains(&new_gene) {
          individual.genes[gene_idx] = new_gene;
        }
      }
      1 => {
        // Swap two genes (maintaining order)
        if individual.genes.len() > 1 {
          let idx1 = rng.random_range(0..individual.genes.len());
          let idx2 = rng.random_range(0..individual.genes.len());
          if idx1 != idx2 {
            individual.genes.swap(idx1, idx2);
          }
        }
      }
      2 => {
        // Add new gene if space allows
        if individual.genes.len() < max_moment_index {
          let new_gene = rng.random_range(0..max_moment_index);
          if !individual.genes.contains(&new_gene) {
            individual.genes.push(new_gene);
          }
        }
      }
      3 => {
        // Remove random gene if we have enough
        if individual.genes.len() > 3 {
          let idx = rng.random_range(0..individual.genes.len());
          individual.genes.remove(idx);
        }
      }
      4 => {
        // Shift segment - move a subsequence
        if individual.genes.len() > 3 {
          let start = rng.random_range(0..individual.genes.len() - 1);
          let end = rng.random_range(start + 1..=individual.genes.len().min(start + 3));
          let segment: Vec<_> = individual.genes.drain(start..end).collect();
          let insert_pos = rng.random_range(0..=individual.genes.len());
          for (i, gene) in segment.into_iter().enumerate() {
            individual.genes.insert(insert_pos + i, gene);
          }
        }
      }
      _ => {}
    }

    // Maintain chronological order
    individual.genes.sort();
    individual.genes.dedup(); // Remove any duplicates
  }

  /// Calculate fitness for an individual
  fn calculate_fitness(
    &self,
    individual: &Individual,
    moments: &[DetectedMoment],
    config: &MontageConfig,
  ) -> f32 {
    if individual.genes.is_empty() {
      return 0.0;
    }

    let selected_moments: Vec<_> = individual
      .genes
      .iter()
      .filter_map(|&idx| moments.get(idx))
      .collect();

    if selected_moments.is_empty() {
      return 0.0;
    }

    let mut fitness = 0.0;

    // Quality score
    let avg_quality: f32 =
      selected_moments.iter().map(|m| m.total_score).sum::<f32>() / selected_moments.len() as f32;
    fitness += avg_quality * self.config.fitness_weights.quality_weight;

    // Diversity score
    let diversity = self.calculate_diversity_score(&selected_moments);
    fitness += diversity * self.config.fitness_weights.diversity_weight;

    // Rhythm score
    let rhythm = self.calculate_rhythm_score(&selected_moments, config);
    fitness += rhythm * self.config.fitness_weights.rhythm_weight;

    // Narrative flow score
    let narrative = self.calculate_narrative_score(&selected_moments);
    fitness += narrative * self.config.fitness_weights.narrative_weight;

    // Technical consistency score
    let technical = self.calculate_technical_score(&selected_moments);
    fitness += technical * self.config.fitness_weights.technical_weight;

    fitness
  }

  /// Calculate diversity score
  fn calculate_diversity_score(&self, moments: &[&DetectedMoment]) -> f32 {
    if moments.len() < 2 {
      return 0.0;
    }

    // Category diversity
    let unique_categories: std::collections::HashSet<_> =
      moments.iter().map(|m| &m.category).collect();
    let category_diversity = unique_categories.len() as f32 / moments.len() as f32;

    // Score variance (avoid all high or all low scoring moments)
    let scores: Vec<f32> = moments.iter().map(|m| m.total_score).collect();
    let mean_score = scores.iter().sum::<f32>() / scores.len() as f32;
    let variance =
      scores.iter().map(|s| (s - mean_score).powi(2)).sum::<f32>() / scores.len() as f32;
    let score_diversity = (variance.sqrt() / 50.0).min(1.0); // Normalize

    (category_diversity * 0.6 + score_diversity * 0.4) * 100.0
  }

  /// Calculate rhythm score
  fn calculate_rhythm_score(&self, moments: &[&DetectedMoment], config: &MontageConfig) -> f32 {
    if moments.len() < 2 {
      return 50.0;
    }

    // Calculate time intervals between moments
    let mut intervals = Vec::new();
    for i in 1..moments.len() {
      let interval = moments[i].timestamp - moments[i - 1].timestamp;
      intervals.push(interval);
    }

    // Target rhythm based on style
    let target_interval: f64 = match config.style {
      MontageStyle::DynamicAction => 2.0,
      MontageStyle::MusicVideo => 1.5,
      MontageStyle::SocialMedia => 3.0,
      MontageStyle::CinematicDrama => 5.0,
      _ => 3.0,
    };

    // Calculate rhythm consistency
    let avg_interval = intervals.iter().sum::<f64>() / intervals.len() as f64;
    let variance = intervals
      .iter()
      .map(|i| (i - avg_interval).powi(2))
      .sum::<f64>()
      / intervals.len() as f64;

    let consistency_score = 1.0 / (1.0 + variance / target_interval.powi(2));
    let target_match_score = 1.0 / (1.0 + (avg_interval - target_interval).abs() / target_interval);

    ((consistency_score * 0.6 + target_match_score * 0.4) * 100.0) as f32
  }

  /// Calculate narrative flow score
  fn calculate_narrative_score(&self, moments: &[&DetectedMoment]) -> f32 {
    if moments.is_empty() {
      return 0.0;
    }

    let avg_narrative: f32 =
      moments.iter().map(|m| m.scores.narrative).sum::<f32>() / moments.len() as f32;

    // Bonus for good narrative progression
    let mut progression_bonus = 0.0;

    // Look for opening/closing moments in appropriate positions
    if moments.len() > 2 {
      if matches!(moments[0].category, MomentCategory::Opening) {
        progression_bonus += 10.0;
      }
      if matches!(moments[moments.len() - 1].category, MomentCategory::Closing) {
        progression_bonus += 10.0;
      }
    }

    avg_narrative + progression_bonus
  }

  /// Calculate technical consistency score
  fn calculate_technical_score(&self, moments: &[&DetectedMoment]) -> f32 {
    if moments.is_empty() {
      return 0.0;
    }

    let avg_technical: f32 =
      moments.iter().map(|m| m.scores.technical).sum::<f32>() / moments.len() as f32;

    // Penalize large technical quality gaps
    let mut consistency_penalty = 0.0;
    for i in 1..moments.len() {
      let quality_diff = (moments[i].scores.technical - moments[i - 1].scores.technical).abs();
      if quality_diff > 30.0 {
        consistency_penalty += quality_diff * 0.1;
      }
    }

    (avg_technical - consistency_penalty).max(0.0)
  }

  /// Calculate generation statistics
  fn calculate_generation_stats(
    &self,
    population: &[Individual],
    generation: usize,
  ) -> GenerationStats {
    let best_fitness = population
      .iter()
      .map(|ind| ind.fitness)
      .fold(f32::NEG_INFINITY, f32::max);

    let average_fitness =
      population.iter().map(|ind| ind.fitness).sum::<f32>() / population.len() as f32;

    // Calculate diversity (unique gene combinations)
    let unique_individuals: std::collections::HashSet<_> =
      population.iter().map(|ind| &ind.genes).collect();
    let diversity_score = unique_individuals.len() as f32 / population.len() as f32;

    GenerationStats {
      generation,
      best_fitness,
      average_fitness,
      diversity_score,
      convergence_rate: self.calculate_convergence_rate(population),
    }
  }

  /// Check if population has converged
  fn has_converged(&self, stats: &[GenerationStats]) -> bool {
    if stats.len() < 5 {
      return false;
    }

    let recent_stats = &stats[stats.len() - 5..];
    let fitness_variance = {
      let mean =
        recent_stats.iter().map(|s| s.best_fitness).sum::<f32>() / recent_stats.len() as f32;
      recent_stats
        .iter()
        .map(|s| (s.best_fitness - mean).powi(2))
        .sum::<f32>()
        / recent_stats.len() as f32
    };

    fitness_variance < 1.0 // Very small variance indicates convergence
  }

  /// Create final montage plan from best individual
  fn create_montage_plan(
    &self,
    individual: &Individual,
    moments: &[DetectedMoment],
    config: &MontageConfig,
    source_files: &[String],
  ) -> Result<MontagePlan, MontageError> {
    let selected_moments: Vec<_> = individual
      .genes
      .iter()
      .filter_map(|&idx| moments.get(idx))
      .collect();

    if selected_moments.is_empty() {
      return Err(MontageError::PlanGenerationError(
        "No valid moments in best individual".to_string(),
      ));
    }

    // Create clips
    let mut clips = Vec::new();
    for (i, moment) in selected_moments.iter().enumerate() {
      let source_file = source_files.first().ok_or_else(|| {
        MontageError::InvalidConfiguration("No source files provided".to_string())
      })?;

      clips.push(MontageClip {
        id: format!("clip_{i}"),
        source_file: source_file.clone(),
        start_time: moment.timestamp,
        end_time: moment.timestamp + moment.duration,
        duration: moment.duration,
        moment: (*moment).clone(),
        adjustments: ClipAdjustments {
          speed_multiplier: None,
          color_correction: None,
          stabilization: false,
          crop: None,
          fade_in: Some(0.2),
          fade_out: Some(0.2),
        },
        order: i as u32,
      });
    }

    // Create transitions
    let mut transitions = Vec::new();
    for i in 0..clips.len().saturating_sub(1) {
      transitions.push(TransitionPlan {
        from_clip: clips[i].id.clone(),
        to_clip: clips[i + 1].id.clone(),
        transition_type: TransitionType::Fade,
        duration: 0.5,
        easing: EasingType::EaseInOut,
      });
    }

    let total_duration: f64 = clips.iter().map(|c| c.duration).sum();

    Ok(MontagePlan {
      id: format!("plan_{}", chrono::Utc::now().timestamp()),
      name: format!("{:?} Montage (GA Optimized)", config.style),
      style: config.style.clone(),
      total_duration,
      clips,
      transitions,
      quality_score: individual.fitness,
      engagement_score: individual.fitness * 0.9,
      created_at: chrono::Utc::now().to_rfc3339(),
    })
  }

  /// Calculate adaptive mutation rate based on convergence
  fn calculate_adaptive_mutation_rate(&self, generation: usize, stats: &[GenerationStats]) -> f32 {
    if stats.len() < 5 {
      return self.config.mutation_rate;
    }

    // Check recent improvement
    let recent_improvement =
      stats[stats.len() - 1].best_fitness - stats[stats.len() - 5].best_fitness;

    // If stuck, increase mutation
    if recent_improvement < 1.0 {
      (self.config.mutation_rate * 2.0).min(0.5)
    } else {
      // Gradually decrease mutation as we improve
      let decay = 1.0 - (generation as f32 / self.config.generations as f32) * 0.5;
      self.config.mutation_rate * decay
    }
  }

  /// Apply local search to improve elite solutions
  fn apply_local_search(
    &mut self,
    population: &mut [Individual],
    moments: &[DetectedMoment],
    config: &MontageConfig,
  ) {
    let elite_count = (self.config.elite_percentage * population.len() as f32) as usize;

    for item in population.iter_mut().take(elite_count) {
      let mut best_neighbor = item.clone();
      let mut best_fitness = best_neighbor.fitness;

      // Try local improvements
      for _ in 0..self.config.local_search_iterations {
        let mut neighbor = item.clone();

        // Try different local moves
        let mut rng = rand::rng();
        match rng.random_range(0..3) {
          0 => {
            // Try swapping adjacent moments
            if neighbor.genes.len() > 1 {
              let idx = rng.random_range(0..neighbor.genes.len() - 1);
              neighbor.genes.swap(idx, idx + 1);
            }
          }
          1 => {
            // Try replacing worst moment with better one
            if let Some((worst_idx, _)) = neighbor
              .genes
              .iter()
              .enumerate()
              .map(|(i, &g)| (i, moments[g].total_score))
              .min_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            {
              // Find a better moment not in current solution
              for (mom_idx, moment) in moments.iter().enumerate() {
                if !neighbor.genes.contains(&mom_idx)
                  && moment.total_score > moments[neighbor.genes[worst_idx]].total_score
                {
                  neighbor.genes[worst_idx] = mom_idx;
                  break;
                }
              }
            }
          }
          _ => {
            // Try adjusting clip boundaries
            if neighbor.genes.len() > 2 {
              let idx = rng.random_range(1..neighbor.genes.len() - 1);
              // Try nearby moments
              let current = neighbor.genes[idx];
              if current > 0 && !neighbor.genes.contains(&(current - 1)) {
                neighbor.genes[idx] = current - 1;
              } else if current < moments.len() - 1 && !neighbor.genes.contains(&(current + 1)) {
                neighbor.genes[idx] = current + 1;
              }
            }
          }
        }

        neighbor.genes.sort();
        neighbor.genes.dedup();

        // Evaluate neighbor
        neighbor.fitness = self.calculate_fitness(&neighbor, moments, config);

        if neighbor.fitness > best_fitness {
          best_neighbor = neighbor;
          best_fitness = best_neighbor.fitness;
        }
      }

      // Update if improved
      if best_fitness > item.fitness {
        *item = best_neighbor;
      }
    }
  }

  /// Inject diversity when population stagnates
  fn inject_diversity(
    &mut self,
    population: &mut [Individual],
    moments: &[DetectedMoment],
    generation: usize,
  ) {
    let inject_count = (population.len() as f32 * 0.2) as usize;
    let start_idx = population.len() - inject_count;

    // Replace worst individuals with new random ones
    for item in population.iter_mut().skip(start_idx) {
      let mut genes = Vec::new();
      let mut rng = rand::rng();
      let target_size = rng.random_range(3..moments.len().min(20));

      while genes.len() < target_size {
        let idx = rng.random_range(0..moments.len());
        if !genes.contains(&idx) {
          genes.push(idx);
        }
      }

      genes.sort();

      *item = Individual {
        genes,
        fitness: 0.0,
        plan: None,
        age: generation,
        diversity_contribution: 0.0,
      };
    }
  }

  /// Calculate convergence rate of population
  fn calculate_convergence_rate(&self, population: &[Individual]) -> f32 {
    if population.is_empty() {
      return 0.0;
    }

    let best_fitness = population
      .iter()
      .map(|i| i.fitness)
      .fold(f32::NEG_INFINITY, f32::max);
    let worst_fitness = population
      .iter()
      .map(|i| i.fitness)
      .fold(f32::INFINITY, f32::min);

    if best_fitness > worst_fitness {
      1.0 - (best_fitness - worst_fitness) / best_fitness
    } else {
      1.0 // Fully converged
    }
  }

  /// Calculate diversity contribution for each individual
  fn update_diversity_contributions(&self, population: &mut [Individual]) {
    for i in 0..population.len() {
      let mut min_distance = f32::INFINITY;

      for j in 0..population.len() {
        if i != j {
          let distance = self.calculate_gene_distance(&population[i].genes, &population[j].genes);
          min_distance = min_distance.min(distance);
        }
      }

      population[i].diversity_contribution = min_distance;
    }
  }

  /// Calculate distance between two gene sequences
  fn calculate_gene_distance(&self, genes1: &[usize], genes2: &[usize]) -> f32 {
    let set1: std::collections::HashSet<_> = genes1.iter().collect();
    let set2: std::collections::HashSet<_> = genes2.iter().collect();

    let intersection = set1.intersection(&set2).count();
    let union = set1.union(&set2).count();

    if union > 0 {
      1.0 - (intersection as f32 / union as f32)
    } else {
      1.0
    }
  }
}

impl Default for PlanGenerator {
  fn default() -> Self {
    Self::new()
  }
}
