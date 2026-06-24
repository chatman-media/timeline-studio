use std::path::Path;
use symphonia::core::audio::{AudioBuffer, Signal};
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use tauri::command;

#[derive(serde::Serialize)]
pub struct AudioPeak {
  time: f64,
  amplitude: f64,
}

#[derive(serde::Serialize)]
pub struct AudioAnalysisResult {
  peaks: Vec<AudioPeak>,
  sample_rate: u32,
  duration: f64,
}

/// Анализирует аудио файл и возвращает пики амплитуды
#[command]
pub async fn analyze_audio_peaks(
  audio_path: String,
  window_size: usize,
  hop_size: usize,
  threshold: f64,
) -> Result<AudioAnalysisResult, String> {
  let path = Path::new(&audio_path);

  if !path.exists() {
    return Err("Аудио файл не найден".to_string());
  }

  // Открываем файл
  let file = std::fs::File::open(path).map_err(|e| format!("Не удалось открыть файл: {}", e))?;

  let mss = MediaSourceStream::new(Box::new(file), Default::default());

  // Создаем подсказку для определения формата
  let mut hint = Hint::new();
  if let Some(ext) = path.extension() {
    hint.with_extension(ext.to_str().unwrap_or(""));
  }

  // Пробуем определить формат
  let meta_opts: MetadataOptions = Default::default();
  let fmt_opts: FormatOptions = Default::default();

  let probed = symphonia::default::get_probe()
    .format(&hint, mss, &fmt_opts, &meta_opts)
    .map_err(|e| format!("Не удалось определить формат аудио: {}", e))?;

  let mut format = probed.format;

  // Находим первый аудио трек
  let track = format
    .tracks()
    .iter()
    .find(|t| t.codec_params.codec != symphonia::core::codecs::CODEC_TYPE_NULL)
    .ok_or("Аудио трек не найден")?;

  let track_id = track.id;
  let sample_rate = track
    .codec_params
    .sample_rate
    .ok_or("Не удалось получить частоту дискретизации")?;

  // Создаем декодер
  let dec_opts: DecoderOptions = Default::default();
  let mut decoder = symphonia::default::get_codecs()
    .make(&track.codec_params, &dec_opts)
    .map_err(|e| format!("Не удалось создать декодер: {}", e))?;

  let mut peaks = Vec::new();
  let mut sample_count = 0;
  let mut window_buffer = Vec::with_capacity(window_size);

  // Читаем и анализируем пакеты
  loop {
    let packet = match format.next_packet() {
      Ok(packet) => packet,
      Err(symphonia::core::errors::Error::IoError(_)) => break,
      Err(err) => return Err(format!("Ошибка чтения пакета: {}", err)),
    };

    if packet.track_id() != track_id {
      continue;
    }

    // Декодируем пакет
    match decoder.decode(&packet) {
      Ok(decoded) => {
        // Обрабатываем аудио буфер
        match decoded {
          symphonia::core::audio::AudioBufferRef::F32(buf) => {
            process_audio_buffer(
              &buf,
              &mut window_buffer,
              &mut peaks,
              &mut sample_count,
              window_size,
              hop_size,
              threshold,
              sample_rate,
            );
          }
          symphonia::core::audio::AudioBufferRef::S16(buf) => {
            // Конвертируем S16 в F32 для обработки
            let mut f32_buf = AudioBuffer::<f32>::new(buf.capacity() as u64, *buf.spec());
            buf.convert(&mut f32_buf);
            process_audio_buffer(
              &f32_buf,
              &mut window_buffer,
              &mut peaks,
              &mut sample_count,
              window_size,
              hop_size,
              threshold,
              sample_rate,
            );
          }
          _ => {
            // Пропускаем неподдерживаемые форматы
            continue;
          }
        }
      }
      Err(symphonia::core::errors::Error::DecodeError(_)) => {
        // Пропускаем поврежденные пакеты
        continue;
      }
      Err(err) => return Err(format!("Ошибка декодирования: {}", err)),
    }
  }

  let duration = sample_count as f64 / sample_rate as f64;

  Ok(AudioAnalysisResult {
    peaks,
    sample_rate,
    duration,
  })
}

/// Обрабатывает аудио буфер и извлекает пики
fn process_audio_buffer<S>(
  buffer: &AudioBuffer<S>,
  window_buffer: &mut Vec<f32>,
  peaks: &mut Vec<AudioPeak>,
  sample_count: &mut usize,
  window_size: usize,
  hop_size: usize,
  threshold: f64,
  sample_rate: u32,
) where
  S: symphonia::core::sample::Sample,
  f32: symphonia::core::conv::FromSample<S>,
{
  let channels = buffer.spec().channels.count();

  for frame in 0..buffer.frames() {
    // Усредняем каналы для получения моно сигнала
    let mut sum = 0.0f32;
    for ch in 0..channels {
      let sample = buffer.chan(ch)[frame];
      sum += <f32 as symphonia::core::conv::FromSample<S>>::from_sample(sample);
    }
    let mono_sample = sum / channels as f32;

    window_buffer.push(mono_sample.abs());
    *sample_count += 1;

    // Когда окно заполнено, вычисляем RMS
    if window_buffer.len() >= window_size {
      let rms = calculate_rms(window_buffer);

      // Добавляем пик, если он превышает порог
      if rms > threshold as f32 {
        let time = (*sample_count - window_size / 2) as f64 / sample_rate as f64;
        peaks.push(AudioPeak {
          time,
          amplitude: rms as f64,
        });
      }

      // Сдвигаем окно на hop_size
      window_buffer.drain(0..hop_size.min(window_buffer.len()));
    }
  }
}

/// Вычисляет RMS (среднеквадратичное значение) для окна
fn calculate_rms(window: &[f32]) -> f32 {
  if window.is_empty() {
    return 0.0;
  }

  let sum_squares: f32 = window.iter().map(|&x| x * x).sum();
  (sum_squares / window.len() as f32).sqrt()
}

/// Обнаруживает начало речи на основе энергии сигнала
#[command]
pub async fn detect_speech_onsets(
  audio_path: String,
  energy_threshold: f64,
  min_speech_duration: f64,
  min_silence_duration: f64,
) -> Result<Vec<f64>, String> {
  // Анализируем аудио с мелким окном для точного определения
  let analysis = analyze_audio_peaks(
    audio_path,
    2048,                   // window_size
    512,                    // hop_size
    energy_threshold * 0.5, // Используем более низкий порог для анализа
  )
  .await?;

  let mut onsets = Vec::new();
  let mut in_speech = false;
  let mut speech_start = 0.0;
  let mut last_peak_time = 0.0;

  for peak in analysis.peaks {
    if !in_speech && peak.amplitude > energy_threshold {
      // Потенциальное начало речи
      speech_start = peak.time;
      in_speech = true;
      last_peak_time = peak.time;
    } else if in_speech {
      if peak.amplitude > energy_threshold {
        // Продолжение речи
        last_peak_time = peak.time;
      } else if peak.time - last_peak_time > min_silence_duration {
        // Конец речи - проверяем длительность
        let speech_duration = last_peak_time - speech_start;
        if speech_duration >= min_speech_duration {
          onsets.push(speech_start);
        }
        in_speech = false;
      }
    }
  }

  // Проверяем последний сегмент
  if in_speech {
    let speech_duration = last_peak_time - speech_start;
    if speech_duration >= min_speech_duration {
      onsets.push(speech_start);
    }
  }

  Ok(onsets)
}
