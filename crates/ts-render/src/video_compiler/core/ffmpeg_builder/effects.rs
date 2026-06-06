//! FFmpeg Builder - Модуль обработки эффектов и переходов

use std::collections::HashMap;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{
  effects::{Effect, EffectParameter, EffectType, Filter, FilterType, Transition},
  project::ProjectSchema,
  timeline::Clip,
};

/// Построитель эффектов
pub struct EffectBuilder<'a> {
  project: &'a ProjectSchema,
}

impl<'a> EffectBuilder<'a> {
  /// Создать новый построитель эффектов
  pub fn new(project: &'a ProjectSchema) -> Self {
    Self { project }
  }

  /// Построить эффекты для клипа
  pub async fn build_clip_effects(&self, clip: &Clip, input_index: usize) -> Result<String> {
    let mut filters = Vec::new();

    // Применяем фильтры клипа
    for filter_id in &clip.filters {
      if let Some(filter) = self.find_filter(filter_id) {
        let filter_str = self.build_filter(filter, input_index)?;
        if !filter_str.is_empty() {
          filters.push(filter_str);
        }
      }
    }

    // Применяем эффекты клипа
    for effect_id in &clip.effects {
      if let Some(effect) = self.find_effect(effect_id) {
        let effect_str = self.build_effect(effect, input_index).await?;
        if !effect_str.is_empty() {
          filters.push(effect_str);
        }
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить аудио эффекты для клипа
  pub async fn build_audio_effects(&self, clip: &Clip, input_index: usize) -> Result<String> {
    let mut filters = Vec::new();

    // Применяем только аудио эффекты
    for effect_id in &clip.effects {
      if let Some(effect) = self.find_effect(effect_id) {
        if self.is_audio_effect(effect) {
          let effect_str = self.build_audio_effect(effect, input_index)?;
          if !effect_str.is_empty() {
            filters.push(effect_str);
          }
        }
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтр перехода между клипами
  pub async fn build_transition_filter(
    &self,
    clip1: &Clip,
    clip2: &Clip,
    transition: &Transition,
    input_index: usize,
  ) -> Result<String> {
    let duration = transition.duration.value;
    let _offset1 = clip1.start_time;
    let _offset2 = clip2.start_time;

    // Время начала перехода относительно первого клипа
    let clip1_duration = clip1.end_time - clip1.start_time;
    let transition_start = clip1_duration - duration;

    match transition.transition_type.as_str() {
      "fade" => Ok(format!(
        "[v{}][v{}]blend=all_expr='A*(1-T/{})+B*(T/{})'[blend{}]",
        input_index,
        input_index + 1,
        duration,
        duration,
        input_index
      )),
      "wipe_left" => Ok(format!(
        "[v{}][v{}]xfade=transition=wipeleft:duration={}:offset={}[blend{}]",
        input_index,
        input_index + 1,
        duration,
        transition_start,
        input_index
      )),
      "wipe_right" => Ok(format!(
        "[v{}][v{}]xfade=transition=wiperight:duration={}:offset={}[blend{}]",
        input_index,
        input_index + 1,
        duration,
        transition_start,
        input_index
      )),
      "slide_left" => Ok(format!(
        "[v{}][v{}]xfade=transition=slideleft:duration={}:offset={}[blend{}]",
        input_index,
        input_index + 1,
        duration,
        transition_start,
        input_index
      )),
      "slide_right" => Ok(format!(
        "[v{}][v{}]xfade=transition=slideright:duration={}:offset={}[blend{}]",
        input_index,
        input_index + 1,
        duration,
        transition_start,
        input_index
      )),
      _ => Ok(format!(
        "[v{}][v{}]xfade=transition=fade:duration={}:offset={}[blend{}]",
        input_index,
        input_index + 1,
        duration,
        transition_start,
        input_index
      )),
    }
  }

  /// Построить фильтр для эффекта
  async fn build_effect(&self, effect: &Effect, input_index: usize) -> Result<String> {
    match &effect.effect_type {
      EffectType::ColorCorrection => self.build_color_correction(effect, input_index),
      EffectType::Blur => self.build_blur_effect(effect, input_index),
      EffectType::Sharpen => self.build_sharpen_effect(effect, input_index),
      EffectType::ChromaKey => self.build_chroma_key(effect, input_index),
      EffectType::Custom => self.build_custom_effect(effect, input_index),
      _ => Ok(String::new()),
    }
  }

  /// Построить фильтр
  fn build_filter(&self, filter: &Filter, input_index: usize) -> Result<String> {
    match &filter.filter_type {
      FilterType::Brightness => {
        let value = filter.intensity;
        Ok(format!(
          "[v{input_index}]eq=brightness={value}[v{input_index}]"
        ))
      }
      FilterType::Contrast => {
        let value = 1.0 + filter.intensity;
        Ok(format!(
          "[v{input_index}]eq=contrast={value}[v{input_index}]"
        ))
      }
      FilterType::Saturation => {
        let value = 1.0 + filter.intensity;
        Ok(format!(
          "[v{input_index}]eq=saturation={value}[v{input_index}]"
        ))
      }
      FilterType::Hue => {
        let value = filter.intensity * 180.0; // Конвертируем в градусы
        Ok(format!("[v{input_index}]hue=h={value}[v{input_index}]"))
      }
      FilterType::Blur => {
        let radius = (filter.intensity * 10.0).max(0.1);
        Ok(format!(
          "[v{input_index}]boxblur={radius}:{radius}[v{input_index}]"
        ))
      }
      FilterType::Sharpen => {
        let amount = filter.intensity * 2.0;
        Ok(format!(
          "[v{input_index}]unsharp=5:5:{amount}:5:5:0[v{input_index}]"
        ))
      }
      FilterType::Vignette => {
        let angle = filter.intensity * 1.5;
        Ok(format!(
          "[v{input_index}]vignette=angle={angle}[v{input_index}]"
        ))
      }
      FilterType::Grain => {
        let strength = filter.intensity * 50.0;
        Ok(format!(
          "[v{input_index}]noise=alls={strength}[v{input_index}]"
        ))
      }
      FilterType::Glow => {
        let radius = filter.intensity * 5.0;
        Ok(format!(
          "[v{input_index}]gblur=sigma={radius}[v{input_index}]"
        ))
      }
      FilterType::ShadowsHighlights => {
        let shadows = filter.intensity;
        let highlights = 1.0 - filter.intensity;
        Ok(format!(
          "[v{input_index}]eq=shadows={shadows}:highlights={highlights}[v{input_index}]"
        ))
      }
      FilterType::WhiteBalance => {
        let temp = filter.intensity * 1000.0;
        Ok(format!(
          "[v{input_index}]colortemperature=temperature={temp}[v{input_index}]"
        ))
      }
      FilterType::Exposure => {
        let exposure = filter.intensity;
        Ok(format!(
          "[v{input_index}]eq=brightness={exposure}[v{input_index}]"
        ))
      }
      FilterType::Curves => {
        // Простая реализация кривых через eq
        let curve = filter.intensity;
        Ok(format!("[v{input_index}]eq=gamma={curve}[v{input_index}]"))
      }
      FilterType::Levels => {
        // Простая реализация уровней
        let level = filter.intensity;
        Ok(format!(
          "[v{input_index}]eq=contrast={level}[v{input_index}]"
        ))
      }
      FilterType::ColorBalance => {
        // Простая реализация цветового баланса
        let balance = filter.intensity;
        Ok(format!(
          "[v{input_index}]eq=saturation={balance}[v{input_index}]"
        ))
      }
      FilterType::Custom => {
        if let Some(custom_filter) = &filter.custom_filter {
          Ok(self.process_custom_filter(custom_filter, input_index))
        } else {
          Ok(String::new())
        }
      }
    }
  }

  /// Построить цветокоррекцию
  fn build_color_correction(&self, effect: &Effect, input_index: usize) -> Result<String> {
    let brightness = self.get_param_value(&effect.parameters, "brightness", 0.0);
    let contrast = self.get_param_value(&effect.parameters, "contrast", 1.0);
    let saturation = self.get_param_value(&effect.parameters, "saturation", 1.0);
    let gamma = self.get_param_value(&effect.parameters, "gamma", 1.0);

    // Проверяем, нужна ли сложная цветокоррекция
    let needs_complex = self.needs_complex_color_correction(&effect.parameters);

    if needs_complex {
      self.build_complex_color_correction(&effect.parameters, input_index)
    } else {
      Ok(format!(
        "[v{input_index}]eq=brightness={brightness}:contrast={contrast}:saturation={saturation}:gamma={gamma}[v{input_index}]"
      ))
    }
  }

  /// Построить эффект размытия
  fn build_blur_effect(&self, effect: &Effect, input_index: usize) -> Result<String> {
    let radius = self.get_param_value(&effect.parameters, "radius", 5.0);
    let sigma = self.get_param_value(&effect.parameters, "sigma", 1.0);

    Ok(format!(
      "[v{input_index}]gblur=radius={radius}:sigma={sigma}[v{input_index}]"
    ))
  }

  /// Построить эффект резкости
  fn build_sharpen_effect(&self, effect: &Effect, input_index: usize) -> Result<String> {
    let amount = self.get_param_value(&effect.parameters, "amount", 1.0);
    let radius = self.get_param_value(&effect.parameters, "radius", 5.0);

    Ok(format!(
      "[v{input_index}]unsharp={radius}:{radius}:{amount}[v{input_index}]"
    ))
  }

  /// Построить хромакей
  fn build_chroma_key(&self, effect: &Effect, input_index: usize) -> Result<String> {
    let color = self.get_param_string(&effect.parameters, "color", "0x00ff00");
    let similarity = self.get_param_value(&effect.parameters, "similarity", 0.3);
    let blend = self.get_param_value(&effect.parameters, "blend", 0.0);

    Ok(format!(
      "[v{input_index}]chromakey={color}:{similarity}:{blend}[v{input_index}]"
    ))
  }

  /// Построить пользовательский эффект
  fn build_custom_effect(&self, effect: &Effect, input_index: usize) -> Result<String> {
    if let Some(template) = &effect.ffmpeg_command {
      Ok(self.process_effect_template(template, &effect.parameters, input_index))
    } else {
      Ok(String::new())
    }
  }

  /// Построить аудио эффект
  fn build_audio_effect(&self, effect: &Effect, input_index: usize) -> Result<String> {
    match &effect.effect_type {
      EffectType::AudioFade => {
        let fade_in = self.get_param_value(&effect.parameters, "fade_in", 0.0);
        let fade_out = self.get_param_value(&effect.parameters, "fade_out", 0.0);

        let mut filters = Vec::new();

        if fade_in > 0.0 {
          filters.push(format!("afade=in:duration={fade_in}"));
        }

        if fade_out > 0.0 {
          filters.push(format!("afade=out:duration={fade_out}"));
        }

        if filters.is_empty() {
          Ok(String::new())
        } else {
          Ok(format!(
            "[a{}]{}[a{}]",
            input_index,
            filters.join(","),
            input_index
          ))
        }
      }
      EffectType::AudioCompressor => {
        let _threshold = self.get_param_value(&effect.parameters, "threshold", -20.0);
        let ratio = self.get_param_value(&effect.parameters, "ratio", 4.0);
        let attack = self.get_param_value(&effect.parameters, "attack", 5.0);
        let release = self.get_param_value(&effect.parameters, "release", 50.0);

        Ok(format!(
          "[a{input_index}]compand=attacks={attack}:decays={release}:ratio={ratio}[a{input_index}]"
        ))
      }
      EffectType::AudioEqualizer => {
        let bass = self.get_param_value(&effect.parameters, "bass", 0.0);
        let mid = self.get_param_value(&effect.parameters, "mid", 0.0);
        let treble = self.get_param_value(&effect.parameters, "treble", 0.0);

        Ok(format!(
          "[a{input_index}]equalizer=f=100:g={bass}:t=q:w=1,equalizer=f=1000:g={mid}:t=q:w=1,equalizer=f=10000:g={treble}:t=q:w=1[a{input_index}]"
        ))
      }
      _ => Ok(String::new()),
    }
  }

  /// Построить сложную цветокоррекцию
  fn build_complex_color_correction(
    &self,
    parameters: &HashMap<String, EffectParameter>,
    input_index: usize,
  ) -> Result<String> {
    let highlights_r = self.get_param_value(parameters, "highlights_r", 1.0);
    let highlights_g = self.get_param_value(parameters, "highlights_g", 1.0);
    let highlights_b = self.get_param_value(parameters, "highlights_b", 1.0);

    let midtones_r = self.get_param_value(parameters, "midtones_r", 1.0);
    let midtones_g = self.get_param_value(parameters, "midtones_g", 1.0);
    let midtones_b = self.get_param_value(parameters, "midtones_b", 1.0);

    let shadows_r = self.get_param_value(parameters, "shadows_r", 1.0);
    let shadows_g = self.get_param_value(parameters, "shadows_g", 1.0);
    let shadows_b = self.get_param_value(parameters, "shadows_b", 1.0);

    Ok(format!(
      "[v{input_index}]colorchannelmixer={shadows_r}:{midtones_r}:{highlights_r}:{shadows_g}:{midtones_g}:{highlights_g}:{shadows_b}:{midtones_b}:{highlights_b}[v{input_index}]"
    ))
  }

  /// Проверить, нужна ли сложная цветокоррекция
  fn needs_complex_color_correction(&self, parameters: &HashMap<String, EffectParameter>) -> bool {
    parameters.keys().any(|name| {
      name.contains("highlights_") || name.contains("midtones_") || name.contains("shadows_")
    })
  }

  /// Обработать шаблон эффекта
  fn process_effect_template(
    &self,
    template: &str,
    parameters: &HashMap<String, EffectParameter>,
    input_index: usize,
  ) -> String {
    let mut result = template.to_string();

    // Заменяем плейсхолдеры
    result = result.replace("{input}", &format!("[v{input_index}]"));
    result = result.replace("{output}", &format!("[v{input_index}]"));

    // Заменяем параметры
    for (name, param) in parameters {
      let placeholder = format!("{{{name}}}");
      let value = match param {
        EffectParameter::Float(f) => f.to_string(),
        EffectParameter::Int(i) => i.to_string(),
        EffectParameter::String(s) => s.clone(),
        EffectParameter::Bool(b) => b.to_string(),
        EffectParameter::Color(c) => format!("#{c:08x}"),
        EffectParameter::FloatArray(arr) => arr
          .iter()
          .map(|f| f.to_string())
          .collect::<Vec<_>>()
          .join(","),
        EffectParameter::FilePath(path) => path.to_string_lossy().to_string(),
      };
      result = result.replace(&placeholder, &value);
    }

    result
  }

  /// Обработать пользовательский фильтр
  fn process_custom_filter(&self, filter: &str, input_index: usize) -> String {
    filter
      .replace("{input}", &format!("[v{input_index}]"))
      .replace("{output}", &format!("[v{input_index}]"))
  }

  /// Проверить, является ли эффект аудио эффектом
  fn is_audio_effect(&self, effect: &Effect) -> bool {
    matches!(
      effect.effect_type,
      EffectType::AudioFade | EffectType::AudioCompressor | EffectType::AudioEqualizer
    )
  }

  /// Получить значение параметра
  fn get_param_value(
    &self,
    parameters: &HashMap<String, EffectParameter>,
    name: &str,
    default: f64,
  ) -> f64 {
    parameters
      .get(name)
      .and_then(|p| match p {
        EffectParameter::Float(f) => Some(*f as f64),
        EffectParameter::Int(i) => Some(*i as f64),
        _ => None,
      })
      .unwrap_or(default)
  }

  /// Получить строковое значение параметра
  fn get_param_string(
    &self,
    parameters: &HashMap<String, EffectParameter>,
    name: &str,
    default: &str,
  ) -> String {
    parameters
      .get(name)
      .and_then(|p| match p {
        EffectParameter::String(s) => Some(s.clone()),
        _ => None,
      })
      .unwrap_or_else(|| default.to_string())
  }

  /// Найти эффект по ID
  fn find_effect(&self, effect_id: &str) -> Option<&Effect> {
    self.project.effects.iter().find(|e| e.id == effect_id)
  }

  /// Найти фильтр по ID
  fn find_filter(&self, filter_id: &str) -> Option<&Filter> {
    self.project.filters.iter().find(|f| f.id == filter_id)
  }

  /// Конвертировать параметр в строку
  #[allow(dead_code)]
  fn convert_parameter_to_string(&self, param: &EffectParameter) -> String {
    match param {
      EffectParameter::Float(f) => f.to_string(),
      EffectParameter::Int(i) => i.to_string(),
      EffectParameter::Bool(b) => if *b { "1" } else { "0" }.to_string(),
      EffectParameter::String(s) => s.clone(),
      EffectParameter::Color(color) => format!("#{color:06x}"),
      EffectParameter::FloatArray(array) => array
        .iter()
        .map(|f| f.to_string())
        .collect::<Vec<_>>()
        .join(","),
      EffectParameter::FilePath(path) => path.to_string_lossy().to_string(),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::tests::fixtures::*;

  #[test]
  fn test_effect_builder_new() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    assert_eq!(builder.project.metadata.name, "Test Project");
  }

  #[tokio::test]
  async fn test_build_clip_effects_empty() {
    let project = create_project_with_clips();
    let builder = EffectBuilder::new(&project);
    let clip = &project.tracks[0].clips[0];

    let result = builder.build_clip_effects(clip, 0).await;
    assert!(result.is_ok());

    // Пустой клип без эффектов должен вернуть пустую строку
    let effects = result.unwrap();
    assert!(effects.is_empty());
  }

  #[tokio::test]
  async fn test_build_audio_effects_empty() {
    let project = create_project_with_clips();
    let builder = EffectBuilder::new(&project);
    let clip = &project.tracks[0].clips[0];

    let result = builder.build_audio_effects(clip, 0).await;
    assert!(result.is_ok());

    // Пустой клип без аудио эффектов
    let effects = result.unwrap();
    assert!(effects.is_empty());
  }

  #[tokio::test]
  async fn test_build_transition_filter() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    // Создаем простые клипы для теста перехода
    use crate::video_compiler::schema::timeline::Clip;
    use std::path::PathBuf;

    let clip1 = Clip::new(PathBuf::from("/test/video1.mp4"), 0.0, 5.0);
    let clip2 = Clip::new(PathBuf::from("/test/video2.mp4"), 5.0, 10.0);

    // Создаем простой переход
    use crate::video_compiler::schema::effects::{Transition, TransitionDuration};
    let transition = Transition {
      id: "transition1".to_string(),
      name: "Fade".to_string(),
      transition_type: "fade".to_string(),
      duration: TransitionDuration {
        value: 1.0,
        min: None,
        max: None,
      },
      category: None,
      tags: Vec::new(),
      complexity: None,
      enabled: true,
      parameters: HashMap::new(),
      ffmpeg_command: None,
      easing: None,
      direction: None,
    };

    let result = builder
      .build_transition_filter(&clip1, &clip2, &transition, 0)
      .await;
    assert!(result.is_ok());
  }

  #[test]
  fn test_find_effect() {
    let project = create_complex_project(); // Проект с эффектами
    let builder = EffectBuilder::new(&project);

    if !project.effects.is_empty() {
      let effect_id = &project.effects[0].id;
      let found_effect = builder.find_effect(effect_id);
      assert!(found_effect.is_some());
    }
  }

  #[test]
  fn test_find_filter() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    // Поиск несуществующего фильтра
    let found_filter = builder.find_filter("non_existent_filter");
    assert!(found_filter.is_none());
  }

  #[tokio::test]
  async fn test_build_effect_brightness() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let effect = create_test_effect(EffectType::Brightness);
    let result = builder.build_effect(&effect, 0).await;
    assert!(result.is_ok());
  }

  #[test]
  fn test_build_filter_blur() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    use crate::video_compiler::schema::effects::Filter;
    let filter = Filter {
      id: "blur1".to_string(),
      name: "Blur".to_string(),
      filter_type: FilterType::Blur,
      parameters: HashMap::new(),
      enabled: true,
      ffmpeg_command: None,
      intensity: 1.0,
      custom_filter: None,
    };

    let result = builder.build_filter(&filter, 0);
    assert!(result.is_ok());
  }

  #[test]
  fn test_parameter_conversion() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    // Тест конвертации разных типов параметров
    let float_param = EffectParameter::Float(1.5);
    let result = builder.convert_parameter_to_string(&float_param);
    assert_eq!(result, "1.5");

    let int_param = EffectParameter::Int(10);
    let result = builder.convert_parameter_to_string(&int_param);
    assert_eq!(result, "10");

    let bool_param = EffectParameter::Bool(true);
    let result = builder.convert_parameter_to_string(&bool_param);
    assert_eq!(result, "1");

    let string_param = EffectParameter::String("test".to_string());
    let result = builder.convert_parameter_to_string(&string_param);
    assert_eq!(result, "test");
  }

  #[test]
  fn test_build_color_correction() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut effect = Effect::new(EffectType::ColorCorrection, "Color Correction".to_string());
    effect
      .parameters
      .insert("brightness".to_string(), EffectParameter::Float(0.5));
    effect
      .parameters
      .insert("contrast".to_string(), EffectParameter::Float(1.2));
    effect
      .parameters
      .insert("saturation".to_string(), EffectParameter::Float(1.1));
    effect
      .parameters
      .insert("gamma".to_string(), EffectParameter::Float(0.9));

    let result = builder.build_color_correction(&effect, 0);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("brightness=0.5"));
    assert!(filter.contains("contrast=1.2"));
  }

  #[test]
  fn test_build_blur_effect() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut effect = Effect::new(EffectType::Blur, "Blur".to_string());
    effect
      .parameters
      .insert("radius".to_string(), EffectParameter::Float(10.0));
    effect
      .parameters
      .insert("sigma".to_string(), EffectParameter::Float(2.0));

    let result = builder.build_blur_effect(&effect, 0);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("gblur"));
    assert!(filter.contains("radius=10"));
    assert!(filter.contains("sigma=2"));
  }

  #[test]
  fn test_build_sharpen_effect() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut effect = Effect::new(EffectType::Sharpen, "Sharpen".to_string());
    effect
      .parameters
      .insert("amount".to_string(), EffectParameter::Float(1.5));
    effect
      .parameters
      .insert("radius".to_string(), EffectParameter::Float(3.0));

    let result = builder.build_sharpen_effect(&effect, 0);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("unsharp"));
  }

  #[test]
  fn test_build_chroma_key() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut effect = Effect::new(EffectType::ChromaKey, "Chroma Key".to_string());
    effect.parameters.insert(
      "color".to_string(),
      EffectParameter::String("0x00ff00".to_string()),
    );
    effect
      .parameters
      .insert("similarity".to_string(), EffectParameter::Float(0.4));
    effect
      .parameters
      .insert("blend".to_string(), EffectParameter::Float(0.1));

    let result = builder.build_chroma_key(&effect, 0);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("chromakey"));
    assert!(filter.contains("0x00ff00"));
  }

  #[test]
  fn test_build_custom_effect() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut effect = Effect::new(EffectType::Custom, "Custom Effect".to_string());
    effect
      .parameters
      .insert("strength".to_string(), EffectParameter::Float(0.8));
    effect.ffmpeg_command = Some("{input}custom_filter=strength={strength}{output}".to_string());

    let result = builder.build_custom_effect(&effect, 0);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("custom_filter"));
    assert!(filter.contains("strength=0.8"));
  }

  #[test]
  fn test_build_audio_fade() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut effect = Effect::new(EffectType::AudioFade, "Audio Fade".to_string());
    effect
      .parameters
      .insert("fade_in".to_string(), EffectParameter::Float(2.0));
    effect
      .parameters
      .insert("fade_out".to_string(), EffectParameter::Float(3.0));

    let result = builder.build_audio_effect(&effect, 0);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("afade=in:duration=2"));
    assert!(filter.contains("afade=out:duration=3"));
  }

  #[test]
  fn test_build_audio_compressor() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut effect = Effect::new(EffectType::AudioCompressor, "Audio Compressor".to_string());
    effect
      .parameters
      .insert("threshold".to_string(), EffectParameter::Float(-15.0));
    effect
      .parameters
      .insert("ratio".to_string(), EffectParameter::Float(6.0));
    effect
      .parameters
      .insert("attack".to_string(), EffectParameter::Float(10.0));
    effect
      .parameters
      .insert("release".to_string(), EffectParameter::Float(100.0));

    let result = builder.build_audio_effect(&effect, 0);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("compand"));
    assert!(filter.contains("attacks=10"));
    assert!(filter.contains("ratio=6"));
  }

  #[test]
  fn test_build_audio_equalizer() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut effect = Effect::new(EffectType::AudioEqualizer, "Audio Equalizer".to_string());
    effect
      .parameters
      .insert("bass".to_string(), EffectParameter::Float(3.0));
    effect
      .parameters
      .insert("mid".to_string(), EffectParameter::Float(-2.0));
    effect
      .parameters
      .insert("treble".to_string(), EffectParameter::Float(1.0));

    let result = builder.build_audio_effect(&effect, 0);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("equalizer"));
    assert!(filter.contains("f=100:g=3"));
    assert!(filter.contains("f=1000:g=-2"));
    assert!(filter.contains("f=10000:g=1"));
  }

  #[test]
  fn test_is_audio_effect() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let audio_effect = Effect::new(EffectType::AudioFade, "Audio Effect".to_string());
    let video_effect = Effect::new(EffectType::Blur, "Video Effect".to_string());

    assert!(builder.is_audio_effect(&audio_effect));
    assert!(!builder.is_audio_effect(&video_effect));
  }

  #[test]
  fn test_get_param_value() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut parameters = HashMap::new();
    parameters.insert("float_param".to_string(), EffectParameter::Float(1.5));
    parameters.insert("int_param".to_string(), EffectParameter::Int(10));

    let float_value = builder.get_param_value(&parameters, "float_param", 0.0);
    assert_eq!(float_value, 1.5);

    let int_value = builder.get_param_value(&parameters, "int_param", 0.0);
    assert_eq!(int_value, 10.0);

    let default_value = builder.get_param_value(&parameters, "missing_param", 5.0);
    assert_eq!(default_value, 5.0);
  }

  #[test]
  fn test_get_param_string() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut parameters = HashMap::new();
    parameters.insert(
      "string_param".to_string(),
      EffectParameter::String("test_value".to_string()),
    );

    let string_value = builder.get_param_string(&parameters, "string_param", "default");
    assert_eq!(string_value, "test_value");

    let default_value = builder.get_param_string(&parameters, "missing_param", "default");
    assert_eq!(default_value, "default");
  }

  #[test]
  fn test_process_custom_filter() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let filter = "{input}customfilter=param1:param2{output}";
    let result = builder.process_custom_filter(filter, 5);

    assert!(result.contains("[v5]"));
    assert!(result.contains("customfilter"));
  }

  #[test]
  fn test_process_effect_template() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let template = "{input}effect=param1={value1}:param2={value2}{output}";
    let mut parameters = HashMap::new();
    parameters.insert("value1".to_string(), EffectParameter::Float(1.0));
    parameters.insert(
      "value2".to_string(),
      EffectParameter::String("test".to_string()),
    );

    let result = builder.process_effect_template(template, &parameters, 3);

    assert!(result.contains("[v3]"));
    assert!(result.contains("param1=1"));
    assert!(result.contains("param2=test"));
  }

  #[test]
  fn test_build_complex_color_correction() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut parameters = HashMap::new();
    parameters.insert("highlights_r".to_string(), EffectParameter::Float(1.2));
    parameters.insert("highlights_g".to_string(), EffectParameter::Float(1.1));
    parameters.insert("highlights_b".to_string(), EffectParameter::Float(0.9));
    parameters.insert("midtones_r".to_string(), EffectParameter::Float(1.0));
    parameters.insert("midtones_g".to_string(), EffectParameter::Float(1.0));
    parameters.insert("midtones_b".to_string(), EffectParameter::Float(1.0));
    parameters.insert("shadows_r".to_string(), EffectParameter::Float(0.8));
    parameters.insert("shadows_g".to_string(), EffectParameter::Float(0.9));
    parameters.insert("shadows_b".to_string(), EffectParameter::Float(1.1));

    let result = builder.build_complex_color_correction(&parameters, 0);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("colorchannelmixer"));
  }

  #[test]
  fn test_needs_complex_color_correction() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let mut simple_params = HashMap::new();
    simple_params.insert("brightness".to_string(), EffectParameter::Float(1.0));
    assert!(!builder.needs_complex_color_correction(&simple_params));

    let mut complex_params = HashMap::new();
    complex_params.insert("highlights_r".to_string(), EffectParameter::Float(1.0));
    assert!(builder.needs_complex_color_correction(&complex_params));
  }

  #[test]
  fn test_build_filter_all_types() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    // Test various filter types
    let filter_types = vec![
      (FilterType::Brightness, "brightness"),
      (FilterType::Contrast, "contrast"),
      (FilterType::Saturation, "saturation"),
      (FilterType::Hue, "hue"),
      (FilterType::Blur, "boxblur"),
      (FilterType::Sharpen, "unsharp"),
      (FilterType::Vignette, "vignette"),
      (FilterType::Grain, "noise"),
      (FilterType::Glow, "gblur"),
      (FilterType::ShadowsHighlights, "shadows"),
      (FilterType::WhiteBalance, "colortemperature"),
      (FilterType::Exposure, "brightness"),
      (FilterType::Curves, "gamma"),
      (FilterType::Levels, "contrast"),
      (FilterType::ColorBalance, "saturation"),
    ];

    for (filter_type, expected) in filter_types {
      let filter = Filter {
        id: "test".to_string(),
        name: "Test Filter".to_string(),
        filter_type: filter_type.clone(),
        parameters: HashMap::new(),
        enabled: true,
        ffmpeg_command: None,
        intensity: 1.0,
        custom_filter: None,
      };

      let result = builder.build_filter(&filter, 0);
      assert!(result.is_ok());
      let filter_str = result.unwrap();
      assert!(
        filter_str.contains(expected),
        "Filter type {filter_type:?} should contain {expected}"
      );
    }
  }

  #[tokio::test]
  async fn test_build_transition_all_types() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    use crate::video_compiler::schema::timeline::Clip;
    use std::path::PathBuf;

    let clip1 = Clip::new(PathBuf::from("/test/video1.mp4"), 0.0, 5.0);
    let clip2 = Clip::new(PathBuf::from("/test/video2.mp4"), 5.0, 10.0);

    let transition_types = vec![
      ("fade", "blend"),
      ("wipe_left", "wipeleft"),
      ("wipe_right", "wiperight"),
      ("slide_left", "slideleft"),
      ("slide_right", "slideright"),
      ("unknown", "fade"), // default case
    ];

    for (transition_type, expected) in transition_types {
      let transition = Transition {
        id: "test".to_string(),
        name: "Test Transition".to_string(),
        transition_type: transition_type.to_string(),
        duration: crate::video_compiler::schema::effects::TransitionDuration {
          value: 1.0,
          min: None,
          max: None,
        },
        category: None,
        tags: Vec::new(),
        complexity: None,
        enabled: true,
        parameters: HashMap::new(),
        ffmpeg_command: None,
        easing: None,
        direction: None,
      };

      let result = builder
        .build_transition_filter(&clip1, &clip2, &transition, 0)
        .await;
      assert!(result.is_ok());
      let filter_str = result.unwrap();
      assert!(
        filter_str.contains(expected),
        "Transition type {transition_type} should contain {expected}"
      );
    }
  }

  #[test]
  fn test_parameter_color_conversion() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let color_param = EffectParameter::Color(0x00ff00);
    let result = builder.convert_parameter_to_string(&color_param);
    assert_eq!(result, "#00ff00");
  }

  #[test]
  fn test_parameter_float_array_conversion() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let array_param = EffectParameter::FloatArray(vec![1.0, 2.0, 3.0]);
    let result = builder.convert_parameter_to_string(&array_param);
    assert_eq!(result, "1,2,3");
  }

  #[test]
  fn test_parameter_filepath_conversion() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    use std::path::PathBuf;
    let path_param = EffectParameter::FilePath(PathBuf::from("/test/file.txt"));
    let result = builder.convert_parameter_to_string(&path_param);
    assert_eq!(result, "/test/file.txt");
  }
}
