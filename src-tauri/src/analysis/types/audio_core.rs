//! Core unified audio types для всех analysis компонентов
//! 
//! Центральная система типов, которая решает конфликты между:
//! - FFmpeg (f64 precision)
//! - Montage Planner (f32 precision) 
//! - Whisper (mixed types)

use serde::{Deserialize, Serialize};
use std::fmt;

/// Унифицированный precision type для всех audio calculations
/// Используем f64 как стандарт для максимальной точности
pub type AudioFloat = f64;

/// Unified Audio Duration в секундах
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AudioDuration {
    pub seconds: AudioFloat,
}

impl AudioDuration {
    /// Создать duration из секунд
    pub fn from_seconds(seconds: AudioFloat) -> Self {
        Self { seconds }
    }
    
    /// Создать duration из миллисекунд
    pub fn from_millis(millis: AudioFloat) -> Self {
        Self { seconds: millis / 1000.0 }
    }
    
    /// Получить в миллисекундах
    pub fn as_millis(&self) -> AudioFloat {
        self.seconds * 1000.0
    }
    
    /// Получить в минутах
    pub fn as_minutes(&self) -> AudioFloat {
        self.seconds / 60.0
    }
    
    /// Проверить валидность (не отрицательная)
    pub fn is_valid(&self) -> bool {
        self.seconds >= 0.0
    }
}

impl fmt::Display for AudioDuration {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:.2}s", self.seconds)
    }
}

impl From<f32> for AudioDuration {
    fn from(seconds: f32) -> Self {
        Self { seconds: seconds as AudioFloat }
    }
}

impl From<f64> for AudioDuration {
    fn from(seconds: f64) -> Self {
        Self { seconds }
    }
}

/// Unified Audio Volume (0.0 to 1.0 normalized)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AudioVolume {
    /// Volume level от 0.0 (тишина) до 1.0 (максимум)
    pub level: AudioFloat,
}

impl AudioVolume {
    /// Создать volume из normalized level (0.0 - 1.0)
    pub fn from_normalized(level: AudioFloat) -> Self {
        Self {
            level: level.clamp(0.0, 1.0)
        }
    }
    
    /// Создать volume из level (alias для from_normalized)
    pub fn from_level(level: AudioFloat) -> Self {
        Self::from_normalized(level)
    }
    
    /// Создать volume из decibels
    pub fn from_db(db: AudioFloat) -> Self {
        Self {
            level: 10_f64.powf(db / 20.0).clamp(0.0, 1.0)
        }
    }
    
    /// Конвертировать в decibels
    pub fn to_db(&self) -> AudioFloat {
        if self.level <= 0.0 {
            AudioFloat::NEG_INFINITY
        } else {
            20.0 * self.level.log10()
        }
    }
    
    /// Получить в процентах (0-100)
    pub fn as_percentage(&self) -> AudioFloat {
        self.level * 100.0
    }
    
    /// Проверить является ли тишиной
    pub fn is_silence(&self, threshold: AudioFloat) -> bool {
        self.level < threshold
    }
    
    /// Максимальный volume
    pub fn max() -> Self {
        Self { level: 1.0 }
    }
    
    /// Минимальный volume (тишина)
    pub fn min() -> Self {
        Self { level: 0.0 }
    }
}

impl fmt::Display for AudioVolume {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:.1}%", self.as_percentage())
    }
}

impl From<f32> for AudioVolume {
    fn from(level: f32) -> Self {
        Self::from_normalized(level as AudioFloat)
    }
}

impl From<f64> for AudioVolume {
    fn from(level: f64) -> Self {
        Self::from_normalized(level)
    }
}

/// Unified Audio Frequency в Hz
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AudioFrequency {
    pub hz: AudioFloat,
}

impl AudioFrequency {
    /// Создать frequency из Hz
    pub fn from_hz(hz: AudioFloat) -> Self {
        Self { hz: hz.max(0.0) }
    }
    
    /// Создать frequency из kHz
    pub fn from_khz(khz: AudioFloat) -> Self {
        Self { hz: khz * 1000.0 }
    }
    
    /// Получить в kHz
    pub fn as_khz(&self) -> AudioFloat {
        self.hz / 1000.0
    }
    
    /// Проверить является ли в человеческом диапазоне слуха (20Hz - 20kHz)
    pub fn is_audible(&self) -> bool {
        self.hz >= 20.0 && self.hz <= 20000.0
    }
    
    /// Общие частоты
    pub fn bass_range() -> (Self, Self) {
        (Self::from_hz(20.0), Self::from_hz(250.0))
    }
    
    pub fn mid_range() -> (Self, Self) {
        (Self::from_hz(250.0), Self::from_hz(4000.0))
    }
    
    pub fn treble_range() -> (Self, Self) {
        (Self::from_hz(4000.0), Self::from_hz(20000.0))
    }
}

impl fmt::Display for AudioFrequency {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.hz >= 1000.0 {
            write!(f, "{:.1} kHz", self.as_khz())
        } else {
            write!(f, "{:.0} Hz", self.hz)
        }
    }
}

impl From<f32> for AudioFrequency {
    fn from(hz: f32) -> Self {
        Self::from_hz(hz as AudioFloat)
    }
}

impl From<f64> for AudioFrequency {
    fn from(hz: f64) -> Self {
        Self::from_hz(hz)
    }
}

/// Unified Time Position в audio
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize)]
pub struct AudioTimestamp {
    pub seconds: AudioFloat,
}

impl AudioTimestamp {
    /// Создать timestamp из секунд
    pub fn from_seconds(seconds: AudioFloat) -> Self {
        Self { seconds: seconds.max(0.0) }
    }
    
    /// Создать timestamp из миллисекунд
    pub fn from_millis(millis: AudioFloat) -> Self {
        Self { seconds: millis / 1000.0 }
    }
    
    /// Получить в миллисекундах
    pub fn as_millis(&self) -> AudioFloat {
        self.seconds * 1000.0
    }
    
    /// Получить в формате MM:SS
    pub fn as_mmss(&self) -> String {
        let minutes = (self.seconds / 60.0) as u32;
        let seconds = (self.seconds % 60.0) as u32;
        format!("{:02}:{:02}", minutes, seconds)
    }
    
    /// Получить в формате HH:MM:SS
    pub fn as_hhmmss(&self) -> String {
        let hours = (self.seconds / 3600.0) as u32;
        let minutes = ((self.seconds % 3600.0) / 60.0) as u32;
        let seconds = (self.seconds % 60.0) as u32;
        format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
    }
    
    /// Начало timeline
    pub fn zero() -> Self {
        Self { seconds: 0.0 }
    }
    
    /// Добавить duration
    pub fn add_duration(&self, duration: AudioDuration) -> Self {
        Self { seconds: self.seconds + duration.seconds }
    }
    
    /// Вычислить duration до другого timestamp
    pub fn duration_to(&self, other: AudioTimestamp) -> AudioDuration {
        AudioDuration::from_seconds((other.seconds - self.seconds).abs())
    }
}

impl fmt::Display for AudioTimestamp {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_mmss())
    }
}

impl From<f32> for AudioTimestamp {
    fn from(seconds: f32) -> Self {
        Self::from_seconds(seconds as AudioFloat)
    }
}

impl From<f64> for AudioTimestamp {
    fn from(seconds: f64) -> Self {
        Self::from_seconds(seconds)
    }
}

/// Audio Sample Rate в Hz
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AudioSampleRate {
    pub hz: u32,
}

impl AudioSampleRate {
    /// Создать sample rate из Hz
    pub fn from_hz(hz: u32) -> Self {
        Self { hz }
    }
    
    /// Общие sample rates
    pub fn cd_quality() -> Self {
        Self { hz: 44100 }
    }
    
    pub fn professional() -> Self {
        Self { hz: 48000 }
    }
    
    pub fn high_res() -> Self {
        Self { hz: 96000 }
    }
    
    pub fn phone_quality() -> Self {
        Self { hz: 8000 }
    }
    
    /// Проверить качество
    pub fn quality_level(&self) -> AudioQualityLevel {
        match self.hz {
            0..=8000 => AudioQualityLevel::Low,
            8001..=22050 => AudioQualityLevel::Medium,
            22051..=48000 => AudioQualityLevel::High,
            _ => AudioQualityLevel::VeryHigh,
        }
    }
}

impl fmt::Display for AudioSampleRate {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} Hz", self.hz)
    }
}

/// Качество audio
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AudioQualityLevel {
    Low,
    Medium,
    High,
    VeryHigh,
}

impl fmt::Display for AudioQualityLevel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Low => write!(f, "Low"),
            Self::Medium => write!(f, "Medium"),
            Self::High => write!(f, "High"),
            Self::VeryHigh => write!(f, "Very High"),
        }
    }
}

/// Time Range в audio
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AudioTimeRange {
    pub start: AudioTimestamp,
    pub end: AudioTimestamp,
}

impl AudioTimeRange {
    /// Создать time range
    pub fn new(start: AudioTimestamp, end: AudioTimestamp) -> Self {
        Self { start, end }
    }
    
    /// Получить duration
    pub fn duration(&self) -> AudioDuration {
        AudioDuration::from_seconds((self.end.seconds - self.start.seconds).max(0.0))
    }
    
    /// Проверить содержит ли timestamp
    pub fn contains(&self, timestamp: AudioTimestamp) -> bool {
        timestamp.seconds >= self.start.seconds && timestamp.seconds <= self.end.seconds
    }
    
    /// Проверить пересечение с другим range
    pub fn overlaps_with(&self, other: &AudioTimeRange) -> bool {
        self.start.seconds < other.end.seconds && self.end.seconds > other.start.seconds
    }
    
    /// Проверить валидность (start <= end)
    pub fn is_valid(&self) -> bool {
        self.start.seconds <= self.end.seconds
    }
}

impl fmt::Display for AudioTimeRange {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} - {} ({})", self.start, self.end, self.duration())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audio_duration() {
        let duration = AudioDuration::from_seconds(65.5);
        assert_eq!(duration.as_minutes(), 65.5 / 60.0);
        assert_eq!(duration.as_millis(), 65500.0);
        assert!(duration.is_valid());
    }

    #[test]
    fn test_audio_volume() {
        let volume = AudioVolume::from_normalized(0.5);
        assert_eq!(volume.as_percentage(), 50.0);
        
        let volume_db = AudioVolume::from_db(-6.0);
        assert!((volume_db.to_db() - (-6.0)).abs() < 0.1);
    }

    #[test]
    fn test_audio_frequency() {
        let freq = AudioFrequency::from_khz(1.0);
        assert_eq!(freq.hz, 1000.0);
        assert!(freq.is_audible());
        
        let (low, high) = AudioFrequency::bass_range();
        assert_eq!(low.hz, 20.0);
        assert_eq!(high.hz, 250.0);
    }

    #[test]
    fn test_audio_timestamp() {
        let ts = AudioTimestamp::from_seconds(125.0);
        assert_eq!(ts.as_mmss(), "02:05");
        
        let ts2 = AudioTimestamp::from_seconds(3725.0);
        assert_eq!(ts2.as_hhmmss(), "01:02:05");
    }

    #[test]
    fn test_audio_time_range() {
        let start = AudioTimestamp::from_seconds(10.0);
        let end = AudioTimestamp::from_seconds(20.0);
        let range = AudioTimeRange::new(start, end);
        
        assert_eq!(range.duration().seconds, 10.0);
        assert!(range.contains(AudioTimestamp::from_seconds(15.0)));
        assert!(!range.contains(AudioTimestamp::from_seconds(25.0)));
        assert!(range.is_valid());
    }

    #[test]
    fn test_type_conversions() {
        // Test f32 -> unified types
        let duration_f32: AudioDuration = 30.5_f32.into();
        assert_eq!(duration_f32.seconds, 30.5);
        
        let volume_f32: AudioVolume = 0.8_f32.into();
        assert_eq!(volume_f32.level, 0.8);
        
        // Test f64 -> unified types
        let freq_f64: AudioFrequency = 440.0_f64.into();
        assert_eq!(freq_f64.hz, 440.0);
        
        let timestamp_f64: AudioTimestamp = 123.45_f64.into();
        assert_eq!(timestamp_f64.seconds, 123.45);
    }
}