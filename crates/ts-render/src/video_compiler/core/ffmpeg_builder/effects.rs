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
  /// Возвращает тела фильтров БЕЗ меток — метки навешивает `build_clip_filter`,
  /// нанизывая их в цепочку `[{i}:v]base[v{i}_0];[v{i}_0]fx1[v{i}_1];…;[last]fxN[v{i}]`.
  pub async fn build_clip_effects(&self, clip: &Clip, input_index: usize) -> Result<Vec<String>> {
    let mut bodies = Vec::new();

    // Фильтры клипа
    for filter_id in &clip.filters {
      if let Some(filter) = self.find_filter(filter_id) {
        let body = self.build_filter(filter, input_index)?;
        if !body.is_empty() {
          bodies.push(body);
        }
      }
    }

    // Эффекты клипа
    for effect_id in &clip.effects {
      if let Some(effect) = self.find_effect(effect_id) {
        if !self.is_audio_effect(effect) {
          let body = self.build_effect(effect, input_index).await?;
          if !body.is_empty() {
            bodies.push(body);
          }
        }
      }
    }

    Ok(bodies)
  }

  /// Построить аудио эффекты для клипа
  pub async fn build_audio_effects(&self, clip: &Clip, input_index: usize) -> Result<String> {
    let mut filters = Vec::new();

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

  // ── Видео-эффекты ─────────────────────────────────────────────────────────

  /// Построить тело фильтра для видео-эффекта (без меток).
  async fn build_effect(&self, effect: &Effect, input_index: usize) -> Result<String> {
    match &effect.effect_type {
      // ── Реализованные базовые ────────────────────────────────────────────
      EffectType::ColorCorrection => self.build_color_correction(effect, input_index),
      EffectType::Blur => self.build_blur_effect(effect, input_index),
      EffectType::Sharpen => self.build_sharpen_effect(effect, input_index),
      EffectType::ChromaKey => self.build_chroma_key(effect, input_index),
      EffectType::Custom => self.build_custom_effect(effect, input_index),

      // ── eq-based тональные ───────────────────────────────────────────────
      EffectType::Brightness => Ok(format!(
        "eq=brightness={}",
        self.get_param_value(&effect.parameters, "value", 0.1)
      )),
      EffectType::Contrast => Ok(format!(
        "eq=contrast={}",
        self.get_param_value(&effect.parameters, "value", 1.3)
      )),
      EffectType::Saturation => Ok(format!(
        "eq=saturation={}",
        self.get_param_value(&effect.parameters, "value", 1.5)
      )),
      EffectType::HueRotate => Ok(format!(
        "hue=h={}",
        self.get_param_value(&effect.parameters, "value", 90.0)
      )),

      // ── Ч/Б и цветовые стили ─────────────────────────────────────────────
      EffectType::Grayscale | EffectType::Noir => Ok("hue=s=0".to_string()),
      EffectType::Sepia => {
        Ok("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131".to_string())
      }
      EffectType::Invert => Ok("negate".to_string()),

      // ── Художественные ────────────────────────────────────────────────────
      EffectType::Vignette => Ok("vignette".to_string()),
      EffectType::FilmGrain => Ok(format!(
        "noise=alls={}:allf=t",
        self.get_param_value(&effect.parameters, "value", 20.0)
      )),
      EffectType::Glow => {
        // Свечение: размытая копия накладывается через blend lighten
        let sigma = self.get_param_value(&effect.parameters, "radius", 5.0);
        let strength = self.get_param_value(&effect.parameters, "strength", 0.5);
        // Простое приближение через gblur + яркость
        Ok(format!(
          "gblur=sigma={sigma},eq=brightness={strength}"
        ))
      }
      EffectType::ChromaticAberration => {
        // Хроматическая аберрация: смещение каналов через rgbashift
        let shift = self.get_param_value(&effect.parameters, "shift", 3.0) as i32;
        Ok(format!("rgbashift=rh={shift}:bh=-{shift}"))
      }
      EffectType::LensFlare => {
        // LensFlare нативно нет в ffmpeg без libass/drawtext; возвращаем no-op
        Ok(String::new())
      }

      // ── Скорость и реверс ─────────────────────────────────────────────────
      EffectType::Speed => {
        let speed = self.get_param_value(&effect.parameters, "value", 2.0).max(0.25);
        // setpts меняет скорость видео; аудио tempo — отдельно в audio path
        Ok(format!("setpts={}/PTS", speed))
      }
      EffectType::Reverse => Ok("reverse".to_string()),

      // ── Стабилизация и шумоподавление ─────────────────────────────────────
      EffectType::NoiseReduction => {
        let strength = self.get_param_value(&effect.parameters, "strength", 4.0);
        Ok(format!("hqdn3d={strength}:{strength}:6:6"))
      }
      EffectType::Stabilization => {
        // Стабилизация требует двух проходов (vidstab); возвращаем no-op
        Ok(String::new())
      }

      // ── LUT-стили (аппроксимация через eq/hue/colorchannelmixer) ──────────
      EffectType::Vintage => {
        // Тёплый + сепия + виньетка + зерно
        Ok(
          "colorchannelmixer=.5:.4:.1:0:.3:.5:.1:0:.1:.2:.5,vignette,noise=alls=8:allf=t"
            .to_string(),
        )
      }
      EffectType::Duotone => {
        // Двухтоновый: grayscale + цветной tint (настраиваемый через colorchannelmixer)
        let r = self.get_param_value(&effect.parameters, "r", 0.2);
        let g = self.get_param_value(&effect.parameters, "g", 0.6);
        let b = self.get_param_value(&effect.parameters, "b", 0.8);
        Ok(format!(
          "hue=s=0,colorchannelmixer={r}:0:0:0:0:{g}:0:0:0:0:{b}:0"
        ))
      }
      EffectType::Cyberpunk => {
        // Высокое насыщение + синий/пурпурный сдвиг
        Ok("eq=saturation=2.5:contrast=1.2,hue=h=-30".to_string())
      }
      EffectType::Dreamy => {
        // Мечтательный: размытие + яркость
        Ok("gblur=sigma=2,eq=brightness=0.08:saturation=1.3".to_string())
      }
      EffectType::Infrared => {
        // Инфракрасный: инвертирование зелёного канала + тёплые тона
        Ok("colorchannelmixer=0:0:1:0:0:1:0:0:1:0:0:0".to_string())
      }
      EffectType::Matrix => {
        // Зелёный монохром
        Ok("hue=s=0,colorchannelmixer=0:0:0:0:0:1:0:0:0:0:0:0".to_string())
      }
      EffectType::Arctic => {
        // Холодный голубой сдвиг
        Ok("colortemperature=temperature=8500".to_string())
      }
      EffectType::Sunset => {
        // Тёплый оранжевый/красный
        Ok("colortemperature=temperature=3200".to_string())
      }
      EffectType::Lomo => {
        // Ломо: высокая насыщенность + виньетка + повышенный контраст
        Ok("eq=saturation=1.8:contrast=1.3,vignette".to_string())
      }
      EffectType::Twilight => {
        // Сумеречный: тёмный + синий сдвиг
        Ok("eq=brightness=-0.1:saturation=1.2,hue=h=200".to_string())
      }
      EffectType::Neon => {
        // Неон: максимальная насыщенность + контраст
        Ok("eq=saturation=3.0:contrast=1.5".to_string())
      }

      // ── Аудио-эффекты (обрабатываются в build_audio_effect) ──────────────
      EffectType::AudioFade
      | EffectType::AudioFadeIn
      | EffectType::AudioFadeOut
      | EffectType::AudioCrossfade
      | EffectType::AudioEqualizer
      | EffectType::AudioCompressor
      | EffectType::AudioReverb
      | EffectType::AudioDelay
      | EffectType::AudioChorus
      | EffectType::AudioDistortion
      | EffectType::AudioNormalize
      | EffectType::AudioDenoise
      | EffectType::AudioPitch
      | EffectType::AudioTempo
      | EffectType::AudioDucking
      | EffectType::AudioGate
      | EffectType::AudioLimiter
      | EffectType::AudioExpander
      | EffectType::AudioPan
      | EffectType::AudioStereoWidth
      | EffectType::AudioHighpass
      | EffectType::AudioLowpass
      | EffectType::AudioBandpass => Ok(String::new()), // handled in audio path

      // ── Неизвестный тип — no-op, рендер не ломается ──────────────────────
      #[allow(unreachable_patterns)]
      _ => Ok(String::new()),
    }
  }

  // ── Фильтры (FilterType) ──────────────────────────────────────────────────

  /// Построить тело фильтра (без меток).
  fn build_filter(&self, filter: &Filter, input_index: usize) -> Result<String> {
    match &filter.filter_type {
      FilterType::Brightness => Ok(format!("eq=brightness={}", filter.intensity)),
      FilterType::Contrast => Ok(format!("eq=contrast={}", 1.0 + filter.intensity)),
      FilterType::Saturation => Ok(format!("eq=saturation={}", 1.0 + filter.intensity)),
      FilterType::Hue => Ok(format!("hue=h={}", filter.intensity * 180.0)),
      FilterType::Blur => {
        let radius = (filter.intensity * 10.0).max(0.1);
        Ok(format!("boxblur={radius}:{radius}"))
      }
      FilterType::Sharpen => Ok(format!("unsharp=5:5:{}:5:5:0", filter.intensity * 2.0)),
      FilterType::Vignette => Ok(format!("vignette=angle={}", filter.intensity * 1.5)),
      FilterType::Grain => Ok(format!("noise=alls={}", filter.intensity * 50.0)),
      FilterType::Glow => Ok(format!("gblur=sigma={}", filter.intensity * 5.0)),
      FilterType::ShadowsHighlights => Ok(format!(
        "eq=shadows={}:highlights={}",
        filter.intensity,
        1.0 - filter.intensity
      )),
      FilterType::WhiteBalance => {
        Ok(format!("colortemperature=temperature={}", filter.intensity * 1000.0))
      }
      FilterType::Exposure => Ok(format!("eq=brightness={}", filter.intensity)),
      FilterType::Curves => Ok(format!("eq=gamma={}", filter.intensity)),
      FilterType::Levels => Ok(format!("eq=contrast={}", filter.intensity)),
      FilterType::ColorBalance => Ok(format!("eq=saturation={}", filter.intensity)),
      FilterType::Custom => {
        if let Some(custom_filter) = &filter.custom_filter {
          Ok(self.process_custom_filter(custom_filter, input_index))
        } else {
          Ok(String::new())
        }
      }
    }
  }

  // ── Базовые видео-эффекты ─────────────────────────────────────────────────

  fn build_color_correction(&self, effect: &Effect, input_index: usize) -> Result<String> {
    let brightness = self.get_param_value(&effect.parameters, "brightness", 0.0);
    let contrast = self.get_param_value(&effect.parameters, "contrast", 1.0);
    let saturation = self.get_param_value(&effect.parameters, "saturation", 1.0);
    let gamma = self.get_param_value(&effect.parameters, "gamma", 1.0);

    if self.needs_complex_color_correction(&effect.parameters) {
      self.build_complex_color_correction(&effect.parameters, input_index)
    } else {
      Ok(format!(
        "eq=brightness={brightness}:contrast={contrast}:saturation={saturation}:gamma={gamma}"
      ))
    }
  }

  fn build_blur_effect(&self, effect: &Effect, _input_index: usize) -> Result<String> {
    let radius = self.get_param_value(&effect.parameters, "radius", 5.0);
    let sigma = self.get_param_value(&effect.parameters, "sigma", 1.0);
    Ok(format!("gblur=radius={radius}:sigma={sigma}"))
  }

  fn build_sharpen_effect(&self, effect: &Effect, _input_index: usize) -> Result<String> {
    let amount = self.get_param_value(&effect.parameters, "amount", 1.0);
    let radius = self.get_param_value(&effect.parameters, "radius", 5.0);
    Ok(format!("unsharp={radius}:{radius}:{amount}"))
  }

  fn build_chroma_key(&self, effect: &Effect, _input_index: usize) -> Result<String> {
    let color = self.get_param_string(&effect.parameters, "color", "0x00ff00");
    let similarity = self.get_param_value(&effect.parameters, "similarity", 0.3);
    let blend = self.get_param_value(&effect.parameters, "blend", 0.0);
    Ok(format!("chromakey={color}:{similarity}:{blend}"))
  }

  fn build_custom_effect(&self, effect: &Effect, input_index: usize) -> Result<String> {
    if let Some(template) = &effect.ffmpeg_command {
      Ok(self.process_effect_template(template, &effect.parameters, input_index))
    } else {
      Ok(String::new())
    }
  }

  // ── Аудио-эффекты ─────────────────────────────────────────────────────────

  fn build_audio_effect(&self, effect: &Effect, input_index: usize) -> Result<String> {
    match &effect.effect_type {
      EffectType::AudioFade | EffectType::AudioFadeIn | EffectType::AudioFadeOut => {
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
      EffectType::AudioReverb => {
        let room = self.get_param_value(&effect.parameters, "room_size", 50.0) / 100.0;
        let damping = self.get_param_value(&effect.parameters, "damping", 50.0) / 100.0;
        Ok(format!(
          "[a{input_index}]aecho=0.8:{room}:500:{damping}[a{input_index}]"
        ))
      }
      EffectType::AudioDelay => {
        let delay_ms = self.get_param_value(&effect.parameters, "delay_ms", 300.0) as u32;
        let feedback = self.get_param_value(&effect.parameters, "feedback", 0.5);
        Ok(format!(
          "[a{input_index}]aecho=0.8:{feedback}:{delay_ms}:0.5[a{input_index}]"
        ))
      }
      EffectType::AudioNormalize => {
        Ok(format!("[a{input_index}]loudnorm[a{input_index}]"))
      }
      EffectType::AudioDenoise => {
        Ok(format!("[a{input_index}]afftdn[a{input_index}]"))
      }
      EffectType::AudioPitch => {
        let semitones = self.get_param_value(&effect.parameters, "semitones", 0.0);
        let factor = 2.0_f64.powf(semitones / 12.0);
        Ok(format!(
          "[a{input_index}]asetrate=44100*{factor},aresample=44100[a{input_index}]"
        ))
      }
      EffectType::AudioTempo => {
        let tempo = self.get_param_value(&effect.parameters, "tempo", 1.0).clamp(0.5, 2.0);
        Ok(format!("[a{input_index}]atempo={tempo}[a{input_index}]"))
      }
      EffectType::AudioHighpass => {
        let freq = self.get_param_value(&effect.parameters, "frequency", 200.0);
        Ok(format!("[a{input_index}]highpass=f={freq}[a{input_index}]"))
      }
      EffectType::AudioLowpass => {
        let freq = self.get_param_value(&effect.parameters, "frequency", 3000.0);
        Ok(format!("[a{input_index}]lowpass=f={freq}[a{input_index}]"))
      }
      EffectType::AudioPan => {
        let pan = self.get_param_value(&effect.parameters, "pan", 0.0).clamp(-1.0, 1.0);
        let left = (1.0 - pan).clamp(0.0, 1.0);
        let right = (1.0 + pan).clamp(0.0, 1.0);
        Ok(format!(
          "[a{input_index}]pan=stereo|c0={left}*c0|c1={right}*c1[a{input_index}]"
        ))
      }
      _ => Ok(String::new()),
    }
  }

  // ── Вспомогательные ──────────────────────────────────────────────────────

  fn build_complex_color_correction(
    &self,
    parameters: &HashMap<String, EffectParameter>,
    _input_index: usize,
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
      "colorchannelmixer={shadows_r}:{midtones_r}:{highlights_r}:{shadows_g}:{midtones_g}:{highlights_g}:{shadows_b}:{midtones_b}:{highlights_b}"
    ))
  }

  fn needs_complex_color_correction(&self, parameters: &HashMap<String, EffectParameter>) -> bool {
    parameters.keys().any(|name| {
      name.contains("highlights_") || name.contains("midtones_") || name.contains("shadows_")
    })
  }

  fn process_effect_template(
    &self,
    template: &str,
    parameters: &HashMap<String, EffectParameter>,
    _input_index: usize,
  ) -> String {
    let mut result = template.replace("{input}", "").replace("{output}", "");
    for (name, param) in parameters {
      let placeholder = format!("{{{name}}}");
      let value = match param {
        EffectParameter::Float(f) => f.to_string(),
        EffectParameter::Int(i) => i.to_string(),
        EffectParameter::String(s) => s.clone(),
        EffectParameter::Bool(b) => b.to_string(),
        EffectParameter::Color(c) => format!("#{c:08x}"),
        EffectParameter::FloatArray(arr) => arr.iter().map(|f| f.to_string()).collect::<Vec<_>>().join(","),
        EffectParameter::FilePath(path) => path.to_string_lossy().to_string(),
      };
      result = result.replace(&placeholder, &value);
    }
    result
  }

  fn process_custom_filter(&self, filter: &str, _input_index: usize) -> String {
    filter.replace("{input}", "").replace("{output}", "")
  }

  /// Является ли эффект аудио-эффектом (обрабатывается в audio path).
  fn is_audio_effect(&self, effect: &Effect) -> bool {
    matches!(
      effect.effect_type,
      EffectType::AudioFade
        | EffectType::AudioFadeIn
        | EffectType::AudioFadeOut
        | EffectType::AudioCrossfade
        | EffectType::AudioEqualizer
        | EffectType::AudioCompressor
        | EffectType::AudioReverb
        | EffectType::AudioDelay
        | EffectType::AudioChorus
        | EffectType::AudioDistortion
        | EffectType::AudioNormalize
        | EffectType::AudioDenoise
        | EffectType::AudioPitch
        | EffectType::AudioTempo
        | EffectType::AudioDucking
        | EffectType::AudioGate
        | EffectType::AudioLimiter
        | EffectType::AudioExpander
        | EffectType::AudioPan
        | EffectType::AudioStereoWidth
        | EffectType::AudioHighpass
        | EffectType::AudioLowpass
        | EffectType::AudioBandpass
    )
  }

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

  fn find_effect(&self, effect_id: &str) -> Option<&Effect> {
    self.project.effects.iter().find(|e| e.id == effect_id)
  }

  fn find_filter(&self, filter_id: &str) -> Option<&Filter> {
    self.project.filters.iter().find(|f| f.id == filter_id)
  }

  #[allow(dead_code)]
  fn convert_parameter_to_string(&self, param: &EffectParameter) -> String {
    match param {
      EffectParameter::Float(f) => f.to_string(),
      EffectParameter::Int(i) => i.to_string(),
      EffectParameter::Bool(b) => if *b { "1" } else { "0" }.to_string(),
      EffectParameter::String(s) => s.clone(),
      EffectParameter::Color(color) => format!("#{color:06x}"),
      EffectParameter::FloatArray(array) => array.iter().map(|f| f.to_string()).collect::<Vec<_>>().join(","),
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
    let effects = builder.build_clip_effects(clip, 0).await.unwrap();
    assert!(effects.is_empty());
  }

  #[tokio::test]
  async fn test_build_audio_effects_empty() {
    let project = create_project_with_clips();
    let builder = EffectBuilder::new(&project);
    let clip = &project.tracks[0].clips[0];
    let effects = builder.build_audio_effects(clip, 0).await.unwrap();
    assert!(effects.is_empty());
  }

  #[tokio::test]
  async fn test_build_transition_filter() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    use crate::video_compiler::schema::timeline::Clip;
    use std::path::PathBuf;

    let clip1 = Clip::new(PathBuf::from("/test/video1.mp4"), 0.0, 5.0);
    let clip2 = Clip::new(PathBuf::from("/test/video2.mp4"), 5.0, 10.0);

    use crate::video_compiler::schema::effects::{Transition, TransitionDuration};
    let transition = Transition {
      id: "transition1".to_string(),
      name: "Fade".to_string(),
      transition_type: "fade".to_string(),
      duration: TransitionDuration { value: 1.0, min: None, max: None },
      category: None,
      tags: Vec::new(),
      complexity: None,
      enabled: true,
      parameters: HashMap::new(),
      ffmpeg_command: None,
      easing: None,
      direction: None,
    };

    let result = builder.build_transition_filter(&clip1, &clip2, &transition, 0).await;
    assert!(result.is_ok());
  }

  #[test]
  fn test_find_effect() {
    let project = create_complex_project();
    let builder = EffectBuilder::new(&project);
    if !project.effects.is_empty() {
      let found = builder.find_effect(&project.effects[0].id);
      assert!(found.is_some());
    }
  }

  #[test]
  fn test_find_filter() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    assert!(builder.find_filter("non_existent_filter").is_none());
  }

  // ── Тесты всех EffectType ─────────────────────────────────────────────────

  macro_rules! test_effect {
    ($name:ident, $effect_type:expr, $expected:expr) => {
      #[tokio::test]
      async fn $name() {
        let project = create_minimal_project();
        let builder = EffectBuilder::new(&project);
        let effect = Effect::new($effect_type, stringify!($name).to_string());
        let result = builder.build_effect(&effect, 0).await.unwrap();
        assert!(
          result.contains($expected) || ($expected == "" && result.is_empty()),
          "Effect {:?}: expected '{}' in '{}'",
          $effect_type,
          $expected,
          result
        );
      }
    };
  }

  test_effect!(test_brightness, EffectType::Brightness, "eq=brightness=");
  test_effect!(test_contrast, EffectType::Contrast, "eq=contrast=");
  test_effect!(test_saturation, EffectType::Saturation, "eq=saturation=");
  test_effect!(test_hue_rotate, EffectType::HueRotate, "hue=h=");
  test_effect!(test_grayscale, EffectType::Grayscale, "hue=s=0");
  test_effect!(test_noir, EffectType::Noir, "hue=s=0");
  test_effect!(test_sepia, EffectType::Sepia, "colorchannelmixer");
  test_effect!(test_invert, EffectType::Invert, "negate");
  test_effect!(test_vignette, EffectType::Vignette, "vignette");
  test_effect!(test_film_grain, EffectType::FilmGrain, "noise=alls=");
  test_effect!(test_glow, EffectType::Glow, "gblur=sigma=");
  test_effect!(test_chromatic_aberration, EffectType::ChromaticAberration, "rgbashift");
  test_effect!(test_speed, EffectType::Speed, "setpts=");
  test_effect!(test_reverse, EffectType::Reverse, "reverse");
  test_effect!(test_noise_reduction, EffectType::NoiseReduction, "hqdn3d");
  test_effect!(test_vintage, EffectType::Vintage, "colorchannelmixer");
  test_effect!(test_duotone, EffectType::Duotone, "hue=s=0");
  test_effect!(test_cyberpunk, EffectType::Cyberpunk, "eq=saturation=");
  test_effect!(test_dreamy, EffectType::Dreamy, "gblur=sigma=");
  test_effect!(test_infrared, EffectType::Infrared, "colorchannelmixer");
  test_effect!(test_matrix, EffectType::Matrix, "hue=s=0");
  test_effect!(test_arctic, EffectType::Arctic, "colortemperature=temperature=8500");
  test_effect!(test_sunset, EffectType::Sunset, "colortemperature=temperature=3200");
  test_effect!(test_lomo, EffectType::Lomo, "vignette");
  test_effect!(test_twilight, EffectType::Twilight, "hue=h=");
  test_effect!(test_neon, EffectType::Neon, "eq=saturation=");
  // audio effects должны возвращать пустую строку из build_effect (обрабатываются отдельно)
  test_effect!(test_audio_fade_video_path, EffectType::AudioFade, "");
  test_effect!(test_audio_eq_video_path, EffectType::AudioEqualizer, "");

  #[tokio::test]
  async fn test_build_effect_brightness_value() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::Brightness, "Brightness".to_string());
    effect.parameters.insert("value".to_string(), EffectParameter::Float(0.25));
    let result = builder.build_effect(&effect, 0).await.unwrap();
    assert_eq!(result, "eq=brightness=0.25");
  }

  #[test]
  fn test_build_filter_all_types() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);

    let cases = vec![
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

    for (filter_type, expected) in cases {
      let filter = Filter {
        id: "test".to_string(),
        name: "Test".to_string(),
        filter_type: filter_type.clone(),
        parameters: HashMap::new(),
        enabled: true,
        ffmpeg_command: None,
        intensity: 1.0,
        custom_filter: None,
      };
      let result = builder.build_filter(&filter, 0).unwrap();
      assert!(
        result.contains(expected),
        "FilterType::{filter_type:?} should contain '{expected}', got '{result}'"
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

    let cases = vec![
      ("fade", "blend"),
      ("wipe_left", "wipeleft"),
      ("wipe_right", "wiperight"),
      ("slide_left", "slideleft"),
      ("slide_right", "slideright"),
      ("unknown", "fade"),
    ];

    for (transition_type, expected) in cases {
      let transition = crate::video_compiler::schema::effects::Transition {
        id: "t".to_string(),
        name: "T".to_string(),
        transition_type: transition_type.to_string(),
        duration: crate::video_compiler::schema::effects::TransitionDuration {
          value: 1.0, min: None, max: None,
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
      let result = builder.build_transition_filter(&clip1, &clip2, &transition, 0).await.unwrap();
      assert!(result.contains(expected), "Transition '{transition_type}' should contain '{expected}'");
    }
  }

  #[test]
  fn test_build_color_correction() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::ColorCorrection, "CC".to_string());
    effect.parameters.insert("brightness".to_string(), EffectParameter::Float(0.5));
    effect.parameters.insert("contrast".to_string(), EffectParameter::Float(1.2));
    effect.parameters.insert("saturation".to_string(), EffectParameter::Float(1.1));
    effect.parameters.insert("gamma".to_string(), EffectParameter::Float(0.9));
    let filter = builder.build_color_correction(&effect, 0).unwrap();
    assert!(filter.contains("brightness=0.5"));
    assert!(filter.contains("contrast=1.2"));
  }

  #[test]
  fn test_build_blur_effect() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::Blur, "Blur".to_string());
    effect.parameters.insert("radius".to_string(), EffectParameter::Float(10.0));
    effect.parameters.insert("sigma".to_string(), EffectParameter::Float(2.0));
    let filter = builder.build_blur_effect(&effect, 0).unwrap();
    assert!(filter.contains("gblur"));
    assert!(filter.contains("radius=10"));
    assert!(filter.contains("sigma=2"));
  }

  #[test]
  fn test_build_sharpen_effect() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::Sharpen, "Sharpen".to_string());
    effect.parameters.insert("amount".to_string(), EffectParameter::Float(1.5));
    effect.parameters.insert("radius".to_string(), EffectParameter::Float(3.0));
    let filter = builder.build_sharpen_effect(&effect, 0).unwrap();
    assert!(filter.contains("unsharp"));
  }

  #[test]
  fn test_build_chroma_key() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::ChromaKey, "ChromaKey".to_string());
    effect.parameters.insert("color".to_string(), EffectParameter::String("0x00ff00".to_string()));
    effect.parameters.insert("similarity".to_string(), EffectParameter::Float(0.4));
    effect.parameters.insert("blend".to_string(), EffectParameter::Float(0.1));
    let filter = builder.build_chroma_key(&effect, 0).unwrap();
    assert!(filter.contains("chromakey"));
    assert!(filter.contains("0x00ff00"));
  }

  #[test]
  fn test_build_custom_effect() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::Custom, "Custom".to_string());
    effect.parameters.insert("strength".to_string(), EffectParameter::Float(0.8));
    effect.ffmpeg_command = Some("{input}custom_filter=strength={strength}{output}".to_string());
    let filter = builder.build_custom_effect(&effect, 0).unwrap();
    assert!(filter.contains("custom_filter"));
    assert!(filter.contains("strength=0.8"));
  }

  #[test]
  fn test_build_audio_fade() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::AudioFade, "AudioFade".to_string());
    effect.parameters.insert("fade_in".to_string(), EffectParameter::Float(2.0));
    effect.parameters.insert("fade_out".to_string(), EffectParameter::Float(3.0));
    let filter = builder.build_audio_effect(&effect, 0).unwrap();
    assert!(filter.contains("afade=in:duration=2"));
    assert!(filter.contains("afade=out:duration=3"));
  }

  #[test]
  fn test_build_audio_compressor() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::AudioCompressor, "Compressor".to_string());
    effect.parameters.insert("ratio".to_string(), EffectParameter::Float(6.0));
    effect.parameters.insert("attack".to_string(), EffectParameter::Float(10.0));
    effect.parameters.insert("release".to_string(), EffectParameter::Float(100.0));
    let filter = builder.build_audio_effect(&effect, 0).unwrap();
    assert!(filter.contains("compand"));
    assert!(filter.contains("attacks=10"));
    assert!(filter.contains("ratio=6"));
  }

  #[test]
  fn test_build_audio_equalizer() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::AudioEqualizer, "EQ".to_string());
    effect.parameters.insert("bass".to_string(), EffectParameter::Float(3.0));
    effect.parameters.insert("mid".to_string(), EffectParameter::Float(-2.0));
    effect.parameters.insert("treble".to_string(), EffectParameter::Float(1.0));
    let filter = builder.build_audio_effect(&effect, 0).unwrap();
    assert!(filter.contains("equalizer"));
    assert!(filter.contains("f=100:g=3"));
    assert!(filter.contains("f=1000:g=-2"));
    assert!(filter.contains("f=10000:g=1"));
  }

  #[test]
  fn test_is_audio_effect() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    assert!(builder.is_audio_effect(&Effect::new(EffectType::AudioFade, "".to_string())));
    assert!(builder.is_audio_effect(&Effect::new(EffectType::AudioEqualizer, "".to_string())));
    assert!(builder.is_audio_effect(&Effect::new(EffectType::AudioPitch, "".to_string())));
    assert!(!builder.is_audio_effect(&Effect::new(EffectType::Blur, "".to_string())));
    assert!(!builder.is_audio_effect(&Effect::new(EffectType::Brightness, "".to_string())));
  }

  #[test]
  fn test_get_param_value() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut params = HashMap::new();
    params.insert("float_param".to_string(), EffectParameter::Float(1.5));
    params.insert("int_param".to_string(), EffectParameter::Int(10));
    assert_eq!(builder.get_param_value(&params, "float_param", 0.0), 1.5);
    assert_eq!(builder.get_param_value(&params, "int_param", 0.0), 10.0);
    assert_eq!(builder.get_param_value(&params, "missing", 5.0), 5.0);
  }

  #[test]
  fn test_parameter_conversion() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    assert_eq!(builder.convert_parameter_to_string(&EffectParameter::Float(1.5)), "1.5");
    assert_eq!(builder.convert_parameter_to_string(&EffectParameter::Int(10)), "10");
    assert_eq!(builder.convert_parameter_to_string(&EffectParameter::Bool(true)), "1");
    assert_eq!(builder.convert_parameter_to_string(&EffectParameter::String("test".to_string())), "test");
    assert_eq!(builder.convert_parameter_to_string(&EffectParameter::Color(0x00ff00)), "#00ff00");
    assert_eq!(
      builder.convert_parameter_to_string(&EffectParameter::FloatArray(vec![1.0, 2.0, 3.0])),
      "1,2,3"
    );
  }

  #[test]
  fn test_build_complex_color_correction() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut params = HashMap::new();
    params.insert("highlights_r".to_string(), EffectParameter::Float(1.2));
    params.insert("highlights_g".to_string(), EffectParameter::Float(1.1));
    params.insert("highlights_b".to_string(), EffectParameter::Float(0.9));
    params.insert("midtones_r".to_string(), EffectParameter::Float(1.0));
    params.insert("midtones_g".to_string(), EffectParameter::Float(1.0));
    params.insert("midtones_b".to_string(), EffectParameter::Float(1.0));
    params.insert("shadows_r".to_string(), EffectParameter::Float(0.8));
    params.insert("shadows_g".to_string(), EffectParameter::Float(0.9));
    params.insert("shadows_b".to_string(), EffectParameter::Float(1.1));
    let result = builder.build_complex_color_correction(&params, 0).unwrap();
    assert!(result.contains("colorchannelmixer"));
  }

  #[test]
  fn test_process_custom_filter() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let result = builder.process_custom_filter("{input}customfilter=a:b{output}", 0);
    assert!(!result.contains("{input}") && !result.contains("{output}"));
    assert!(result.contains("customfilter"));
  }

  #[test]
  fn test_process_effect_template() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut params = HashMap::new();
    params.insert("value1".to_string(), EffectParameter::Float(1.0));
    params.insert("value2".to_string(), EffectParameter::String("test".to_string()));
    let result = builder.process_effect_template("{input}effect=p1={value1}:p2={value2}{output}", &params, 0);
    assert!(!result.contains("{input}") && !result.contains("{output}"));
    assert!(result.contains("p1=1"));
    assert!(result.contains("p2=test"));
  }

  #[test]
  fn test_speed_effect() {
    let project = create_minimal_project();
    let builder = EffectBuilder::new(&project);
    let mut effect = Effect::new(EffectType::Speed, "Speed".to_string());
    effect.parameters.insert("value".to_string(), EffectParameter::Float(2.0));
    let result = tokio::runtime::Runtime::new().unwrap()
      .block_on(builder.build_effect(&effect, 0)).unwrap();
    // Speed = 2.0 → setpts=2/PTS (вдвое быстрее)
    assert!(result.contains("setpts=2/PTS"), "got: {result}");
  }
}
