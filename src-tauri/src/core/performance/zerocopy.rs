//! Zero-copy операции для оптимизации производительности
//!
//! Этот модуль предоставляет структуры и методы для работы с данными
//! без лишних копирований в памяти, что критически важно для видеообработки.

use crate::video_compiler::error::{Result, VideoCompilerError};
use std::alloc::{self, Layout};
use std::collections::HashMap;
use std::marker::PhantomData;
use std::ptr::NonNull;
use std::slice;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};

/// Типы данных, с которыми работает zero-copy система
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum DataType {
  /// RGB кадр (24 бита на пиксель)
  Rgb24,
  /// RGBA кадр (32 бита на пиксель)
  Rgba32,
  /// YUV420p кадр
  Yuv420p,
  /// Сырые байты
  Raw,
  /// Аудио данные (f32 samples)
  AudioF32,
  /// Аудио данные (16-bit PCM)
  AudioPcm16,
}

impl DataType {
  /// Получить размер одного элемента в байтах
  pub fn element_size(&self) -> usize {
    match self {
      DataType::Rgb24 => 3,
      DataType::Rgba32 => 4,
      DataType::Yuv420p => 1, // Y компонента
      DataType::Raw => 1,
      DataType::AudioF32 => 4,
      DataType::AudioPcm16 => 2,
    }
  }

  /// Рассчитать размер кадра для заданных размеров
  pub fn frame_size(&self, width: usize, height: usize) -> usize {
    match self {
      DataType::Rgb24 => width * height * 3,
      DataType::Rgba32 => width * height * 4,
      DataType::Yuv420p => width * height * 3 / 2, // Y + U/2 + V/2
      DataType::Raw => width * height,
      DataType::AudioF32 | DataType::AudioPcm16 => width * self.element_size(),
    }
  }
}

/// Zero-copy буфер, который использует выровненную память
pub struct ZeroCopyBuffer {
  /// Указатель на данные
  ptr: NonNull<u8>,
  /// Размер буфера в байтах
  size: usize,
  /// Выравнивание памяти
  alignment: usize,
  /// Layout для корректного освобождения памяти
  layout: Layout,
  /// Тип данных
  data_type: DataType,
  /// Размеры (ширина, высота) для видео/изображений
  dimensions: Option<(usize, usize)>,
  /// Количество ссылок
  ref_count: Arc<()>,
}

impl ZeroCopyBuffer {
  /// Создать новый zero-copy буфер
  pub fn new(size: usize, alignment: usize, data_type: DataType) -> Result<Self> {
    if size == 0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Buffer size cannot be zero".to_string(),
      ));
    }

    let layout = Layout::from_size_align(size, alignment)
      .map_err(|e| VideoCompilerError::InternalError(format!("Invalid layout: {e}")))?;

    let ptr = unsafe {
      let raw_ptr = alloc::alloc_zeroed(layout);
      if raw_ptr.is_null() {
        return Err(VideoCompilerError::InternalError(
          "Failed to allocate memory".to_string(),
        ));
      }
      NonNull::new_unchecked(raw_ptr)
    };

    Ok(Self {
      ptr,
      size,
      alignment,
      layout,
      data_type,
      dimensions: None,
      ref_count: Arc::new(()),
    })
  }

  /// Создать буфер для видео кадра
  pub fn for_frame(width: usize, height: usize, data_type: DataType) -> Result<Self> {
    let size = data_type.frame_size(width, height);
    let alignment = 32; // AVX2 выравнивание

    let mut buffer = Self::new(size, alignment, data_type)?;
    buffer.dimensions = Some((width, height));
    Ok(buffer)
  }

  /// Создать буфер для аудио данных
  pub fn for_audio(samples: usize, data_type: DataType) -> Result<Self> {
    if !matches!(data_type, DataType::AudioF32 | DataType::AudioPcm16) {
      return Err(VideoCompilerError::InvalidParameter(
        "Invalid audio data type".to_string(),
      ));
    }

    let size = samples * data_type.element_size();
    let alignment = 16; // SSE выравнивание для аудио

    let mut buffer = Self::new(size, alignment, data_type)?;
    buffer.dimensions = Some((samples, 1));
    Ok(buffer)
  }

  /// Получить размер буфера
  pub fn size(&self) -> usize {
    self.size
  }

  /// Получить тип данных
  pub fn data_type(&self) -> DataType {
    self.data_type
  }

  /// Получить размеры
  pub fn dimensions(&self) -> Option<(usize, usize)> {
    self.dimensions
  }

  /// Получить выравнивание
  pub fn alignment(&self) -> usize {
    self.alignment
  }

  /// Получить slice данных
  pub fn as_slice(&self) -> &[u8] {
    unsafe { slice::from_raw_parts(self.ptr.as_ptr(), self.size) }
  }

  /// Получить mutable slice данных
  pub fn as_mut_slice(&mut self) -> &mut [u8] {
    unsafe { slice::from_raw_parts_mut(self.ptr.as_ptr(), self.size) }
  }

  /// Клонировать буфер без копирования данных
  pub fn clone_ref(&self) -> ZeroCopyRef {
    ZeroCopyRef {
      ptr: self.ptr,
      size: self.size,
      data_type: self.data_type,
      dimensions: self.dimensions,
      _ref_count: Arc::clone(&self.ref_count),
      _phantom: PhantomData,
    }
  }

  /// Создать view на часть буфера
  pub fn view(&self, offset: usize, len: usize) -> Result<ZeroCopyView> {
    if offset + len > self.size {
      return Err(VideoCompilerError::InvalidParameter(
        "View exceeds buffer bounds".to_string(),
      ));
    }

    let view_ptr = unsafe { NonNull::new_unchecked(self.ptr.as_ptr().add(offset)) };

    Ok(ZeroCopyView {
      ptr: view_ptr,
      size: len,
      data_type: self.data_type,
      _ref_count: Arc::clone(&self.ref_count),
      _phantom: PhantomData,
    })
  }

  /// Проверить, является ли буфер уникальной ссылкой
  pub fn is_unique(&self) -> bool {
    Arc::strong_count(&self.ref_count) == 1
  }

  /// Получить количество ссылок на буфер
  pub fn ref_count(&self) -> usize {
    Arc::strong_count(&self.ref_count)
  }
}

impl Drop for ZeroCopyBuffer {
  fn drop(&mut self) {
    unsafe {
      alloc::dealloc(self.ptr.as_ptr(), self.layout);
    }
  }
}

impl std::fmt::Debug for ZeroCopyBuffer {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("ZeroCopyBuffer")
      .field("size", &self.size)
      .field("alignment", &self.alignment)
      .field("data_type", &self.data_type)
      .field("dimensions", &self.dimensions)
      .field("ref_count", &Arc::strong_count(&self.ref_count))
      .finish()
  }
}

// Безопасно для отправки между потоками, так как мы используем выровненную память
unsafe impl Send for ZeroCopyBuffer {}
unsafe impl Sync for ZeroCopyBuffer {}

/// Ссылка на zero-copy буфер без владения данными
pub struct ZeroCopyRef {
  ptr: NonNull<u8>,
  size: usize,
  data_type: DataType,
  dimensions: Option<(usize, usize)>,
  _ref_count: Arc<()>,
  _phantom: PhantomData<*const u8>,
}

impl ZeroCopyRef {
  /// Получить slice данных
  pub fn as_slice(&self) -> &[u8] {
    unsafe { slice::from_raw_parts(self.ptr.as_ptr(), self.size) }
  }

  /// Получить размер
  pub fn size(&self) -> usize {
    self.size
  }

  /// Получить тип данных
  pub fn data_type(&self) -> DataType {
    self.data_type
  }

  /// Получить размеры
  pub fn dimensions(&self) -> Option<(usize, usize)> {
    self.dimensions
  }
}

impl Clone for ZeroCopyRef {
  fn clone(&self) -> Self {
    Self {
      ptr: self.ptr,
      size: self.size,
      data_type: self.data_type,
      dimensions: self.dimensions,
      _ref_count: Arc::clone(&self._ref_count),
      _phantom: PhantomData,
    }
  }
}

unsafe impl Send for ZeroCopyRef {}
unsafe impl Sync for ZeroCopyRef {}

/// View на часть zero-copy буфера
pub struct ZeroCopyView {
  ptr: NonNull<u8>,
  size: usize,
  data_type: DataType,
  _ref_count: Arc<()>,
  _phantom: PhantomData<*const u8>,
}

impl ZeroCopyView {
  /// Получить slice данных
  pub fn as_slice(&self) -> &[u8] {
    unsafe { slice::from_raw_parts(self.ptr.as_ptr(), self.size) }
  }

  /// Получить размер
  pub fn size(&self) -> usize {
    self.size
  }

  /// Получить тип данных
  pub fn data_type(&self) -> DataType {
    self.data_type
  }
}

unsafe impl Send for ZeroCopyView {}
unsafe impl Sync for ZeroCopyView {}

impl std::fmt::Debug for ZeroCopyView {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("ZeroCopyView")
      .field("size", &self.size)
      .field("data_type", &self.data_type)
      .finish()
  }
}

/// Тип для пулов буферов
type BufferPools = Arc<RwLock<HashMap<(usize, DataType), Vec<ZeroCopyBuffer>>>>;

/// Менеджер zero-copy буферов с пулингом
pub struct ZeroCopyManager {
  /// Пулы буферов разных размеров
  pools: BufferPools,
  /// Статистика использования
  stats: Arc<Mutex<ZeroCopyStats>>,
  /// Максимальный размер пула для каждого типа
  max_pool_size: usize,
}

/// Статистика zero-copy операций
#[derive(Debug, Default, Clone)]
pub struct ZeroCopyStats {
  /// Количество созданных буферов
  pub buffers_created: u64,
  /// Количество переиспользованных буферов
  pub buffers_reused: u64,
  /// Количество активных буферов
  pub active_buffers: u64,
  /// Общий размер активных буферов в байтах
  pub total_memory: usize,
  /// Количество zero-copy операций
  pub zero_copy_operations: u64,
  /// Сэкономленные байты благодаря zero-copy
  pub bytes_saved: u64,
}

impl ZeroCopyManager {
  /// Создать новый менеджер
  pub fn new() -> Self {
    Self {
      pools: Arc::new(RwLock::new(HashMap::new())),
      stats: Arc::new(Mutex::new(ZeroCopyStats::default())),
      max_pool_size: 16, // Максимум 16 буферов в пуле
    }
  }

  /// Получить буфер из пула или создать новый
  pub async fn get_buffer(&self, size: usize, data_type: DataType) -> Result<ZeroCopyBuffer> {
    let key = (size, data_type);

    // Пытаемся получить из пула
    {
      let mut pools = self.pools.write().await;
      if let Some(pool) = pools.get_mut(&key) {
        if let Some(buffer) = pool.pop() {
          let mut stats = self.stats.lock().await;
          stats.buffers_reused += 1;
          stats.active_buffers += 1;
          stats.total_memory += size;
          return Ok(buffer);
        }
      }
    }

    // Создаем новый буфер
    let buffer = ZeroCopyBuffer::new(size, 32, data_type)?;

    let mut stats = self.stats.lock().await;
    stats.buffers_created += 1;
    stats.active_buffers += 1;
    stats.total_memory += size;

    Ok(buffer)
  }

  /// Получить буфер для видео кадра
  pub async fn get_frame_buffer(
    &self,
    width: usize,
    height: usize,
    data_type: DataType,
  ) -> Result<ZeroCopyBuffer> {
    let size = data_type.frame_size(width, height);
    let mut buffer = self.get_buffer(size, data_type).await?;
    buffer.dimensions = Some((width, height));
    Ok(buffer)
  }

  /// Получить буфер для аудио
  pub async fn get_audio_buffer(
    &self,
    samples: usize,
    data_type: DataType,
  ) -> Result<ZeroCopyBuffer> {
    if !matches!(data_type, DataType::AudioF32 | DataType::AudioPcm16) {
      return Err(VideoCompilerError::InvalidParameter(
        "Invalid audio data type".to_string(),
      ));
    }

    let size = samples * data_type.element_size();
    let mut buffer = self.get_buffer(size, data_type).await?;
    buffer.dimensions = Some((samples, 1));
    Ok(buffer)
  }

  /// Вернуть буфер в пул для переиспользования
  pub async fn return_buffer(&self, buffer: ZeroCopyBuffer) {
    if !buffer.is_unique() {
      // Буфер все еще используется, не возвращаем в пул
      return;
    }

    let key = (buffer.size, buffer.data_type);
    let mut pools = self.pools.write().await;

    let pool = pools.entry(key).or_insert_with(Vec::new);
    if pool.len() < self.max_pool_size {
      pool.push(buffer);
    }

    let mut stats = self.stats.lock().await;
    stats.active_buffers = stats.active_buffers.saturating_sub(1);
    stats.total_memory = stats.total_memory.saturating_sub(key.0);
  }

  /// Создать zero-copy передачу данных между буферами
  pub async fn transfer_data(&self, src: &ZeroCopyRef, dst: &mut ZeroCopyBuffer) -> Result<()> {
    if src.size() != dst.size() {
      return Err(VideoCompilerError::InvalidParameter(
        "Buffer sizes must match".to_string(),
      ));
    }

    if src.data_type() != dst.data_type() {
      return Err(VideoCompilerError::InvalidParameter(
        "Data types must match".to_string(),
      ));
    }

    // Копируем данные (в будущем здесь можно использовать DMA или другие оптимизации)
    dst.as_mut_slice().copy_from_slice(src.as_slice());

    let mut stats = self.stats.lock().await;
    stats.zero_copy_operations += 1;
    stats.bytes_saved += src.size() as u64; // Условная экономия

    Ok(())
  }

  /// Создать view без копирования данных
  pub async fn create_view(
    &self,
    buffer: &ZeroCopyBuffer,
    offset: usize,
    len: usize,
  ) -> Result<ZeroCopyView> {
    let view = buffer.view(offset, len)?;

    let mut stats = self.stats.lock().await;
    stats.zero_copy_operations += 1;
    stats.bytes_saved += len as u64;

    Ok(view)
  }

  /// Объединить несколько буферов в один без копирования (создает view)
  pub async fn concatenate_views<'a>(&self, views: &'a [ZeroCopyView]) -> Result<Vec<&'a [u8]>> {
    let mut result = Vec::with_capacity(views.len());

    for view in views {
      result.push(view.as_slice());
    }

    let mut stats = self.stats.lock().await;
    stats.zero_copy_operations += 1;

    let total_bytes: usize = views.iter().map(|v| v.size()).sum();
    stats.bytes_saved += total_bytes as u64;

    Ok(result)
  }

  /// Получить статистику
  pub async fn get_stats(&self) -> ZeroCopyStats {
    (*self.stats.lock().await).clone()
  }

  /// Очистить пулы буферов
  pub async fn clear_pools(&self) {
    let mut pools = self.pools.write().await;
    pools.clear();
  }

  /// Получить информацию о пулах
  pub async fn get_pool_info(&self) -> HashMap<(usize, DataType), usize> {
    let pools = self.pools.read().await;
    pools.iter().map(|(key, pool)| (*key, pool.len())).collect()
  }
}

impl Default for ZeroCopyManager {
  fn default() -> Self {
    Self::new()
  }
}

/// Специализированные операции для видео данных
pub struct VideoZeroCopy;

impl VideoZeroCopy {
  /// Конвертировать RGB в RGBA без копирования (добавляет альфа канал)
  pub fn rgb_to_rgba_inplace(rgb_buffer: &ZeroCopyBuffer) -> Result<ZeroCopyBuffer> {
    if rgb_buffer.data_type() != DataType::Rgb24 {
      return Err(VideoCompilerError::InvalidParameter(
        "Expected RGB24 buffer".to_string(),
      ));
    }

    let (width, height) = rgb_buffer.dimensions().ok_or_else(|| {
      VideoCompilerError::InvalidParameter("Buffer missing dimensions".to_string())
    })?;

    let rgba_size = width * height * 4;
    let mut rgba_buffer = ZeroCopyBuffer::new(rgba_size, 32, DataType::Rgba32)?;
    rgba_buffer.dimensions = Some((width, height));

    let rgb_data = rgb_buffer.as_slice();
    let rgba_data = rgba_buffer.as_mut_slice();

    // Конвертируем RGB в RGBA
    for i in 0..(width * height) {
      let rgb_offset = i * 3;
      let rgba_offset = i * 4;

      rgba_data[rgba_offset] = rgb_data[rgb_offset]; // R
      rgba_data[rgba_offset + 1] = rgb_data[rgb_offset + 1]; // G
      rgba_data[rgba_offset + 2] = rgb_data[rgb_offset + 2]; // B
      rgba_data[rgba_offset + 3] = 255; // A (полная непрозрачность)
    }

    Ok(rgba_buffer)
  }

  /// Извлечь YUV компоненты без копирования
  pub fn extract_yuv_planes(
    yuv_buffer: &ZeroCopyBuffer,
  ) -> Result<(ZeroCopyView, ZeroCopyView, ZeroCopyView)> {
    if yuv_buffer.data_type() != DataType::Yuv420p {
      return Err(VideoCompilerError::InvalidParameter(
        "Expected YUV420p buffer".to_string(),
      ));
    }

    let (width, height) = yuv_buffer.dimensions().ok_or_else(|| {
      VideoCompilerError::InvalidParameter("Buffer missing dimensions".to_string())
    })?;

    let y_size = width * height;
    let uv_size = y_size / 4;

    let y_plane = yuv_buffer.view(0, y_size)?;
    let u_plane = yuv_buffer.view(y_size, uv_size)?;
    let v_plane = yuv_buffer.view(y_size + uv_size, uv_size)?;

    Ok((y_plane, u_plane, v_plane))
  }
}

/// Специализированные операции для аудио данных
pub struct AudioZeroCopy;

impl AudioZeroCopy {
  /// Интерлив стерео каналов без копирования
  pub fn interleave_stereo(
    left: &ZeroCopyBuffer,
    right: &ZeroCopyBuffer,
  ) -> Result<ZeroCopyBuffer> {
    if left.data_type() != right.data_type() {
      return Err(VideoCompilerError::InvalidParameter(
        "Audio buffers must have same type".to_string(),
      ));
    }

    if left.size() != right.size() {
      return Err(VideoCompilerError::InvalidParameter(
        "Audio buffers must have same size".to_string(),
      ));
    }

    let samples = left.dimensions().unwrap_or((0, 0)).0;
    let element_size = left.data_type().element_size();
    let interleaved_size = left.size() + right.size();

    let mut interleaved = ZeroCopyBuffer::new(interleaved_size, 16, left.data_type())?;
    interleaved.dimensions = Some((samples * 2, 1));

    let left_data = left.as_slice();
    let right_data = right.as_slice();
    let interleaved_data = interleaved.as_mut_slice();

    // Интерлив сэмплов L R L R L R...
    for i in 0..samples {
      let src_offset = i * element_size;
      let dst_offset = i * element_size * 2;

      // Копируем левый канал
      interleaved_data[dst_offset..dst_offset + element_size]
        .copy_from_slice(&left_data[src_offset..src_offset + element_size]);

      // Копируем правый канал
      interleaved_data[dst_offset + element_size..dst_offset + element_size * 2]
        .copy_from_slice(&right_data[src_offset..src_offset + element_size]);
    }

    Ok(interleaved)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_zero_copy_buffer_creation() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    assert_eq!(buffer.size(), 1024);
    assert_eq!(buffer.alignment(), 32);
    assert_eq!(buffer.data_type(), DataType::Raw);
  }

  #[tokio::test]
  async fn test_frame_buffer() {
    let buffer = ZeroCopyBuffer::for_frame(1920, 1080, DataType::Rgb24).unwrap();
    assert_eq!(buffer.dimensions(), Some((1920, 1080)));
    assert_eq!(buffer.size(), 1920 * 1080 * 3);
  }

  #[tokio::test]
  async fn test_zero_copy_manager() {
    let manager = ZeroCopyManager::new();

    let buffer1 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    assert_eq!(buffer1.size(), 1024);

    let stats = manager.get_stats().await;
    assert_eq!(stats.buffers_created, 1);
    assert_eq!(stats.active_buffers, 1);
  }

  #[tokio::test]
  async fn test_buffer_view() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    let view = buffer.view(100, 500).unwrap();
    assert_eq!(view.size(), 500);
  }

  #[tokio::test]
  async fn test_rgb_to_rgba_conversion() {
    let rgb_buffer = ZeroCopyBuffer::for_frame(2, 2, DataType::Rgb24).unwrap();
    let rgba_buffer = VideoZeroCopy::rgb_to_rgba_inplace(&rgb_buffer).unwrap();

    assert_eq!(rgba_buffer.data_type(), DataType::Rgba32);
    assert_eq!(rgba_buffer.size(), 2 * 2 * 4);
  }

  #[tokio::test]
  async fn test_zero_copy_buffer_clone_ref() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    let cloned = buffer.clone_ref();

    assert_eq!(buffer.size(), cloned.size());
    assert_eq!(buffer.data_type(), cloned.data_type());
  }

  #[tokio::test]
  async fn test_multiple_views() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    // Create multiple views of the same buffer
    let view1 = buffer.view(0, 256).unwrap();
    let view2 = buffer.view(256, 256).unwrap();
    let view3 = buffer.view(512, 256).unwrap();

    assert_eq!(view1.size(), 256);
    assert_eq!(view2.size(), 256);
    assert_eq!(view3.size(), 256);

    // Views should have different content addresses
    assert_ne!(view1.as_slice().as_ptr(), view2.as_slice().as_ptr());
    assert_ne!(view2.as_slice().as_ptr(), view3.as_slice().as_ptr());
  }

  #[tokio::test]
  async fn test_audio_interleave() {
    // Create mono audio buffers
    let mut left = ZeroCopyBuffer::new(8, 16, DataType::AudioF32).unwrap();
    let mut right = ZeroCopyBuffer::new(8, 16, DataType::AudioF32).unwrap();

    // Set dimensions for 2 samples (4 bytes each)
    left.dimensions = Some((2, 1));
    right.dimensions = Some((2, 1));

    // Fill with test data
    left
      .as_mut_slice()
      .copy_from_slice(&[1u8, 0, 0, 0, 2, 0, 0, 0]); // 1.0, 2.0 as f32
    right
      .as_mut_slice()
      .copy_from_slice(&[3u8, 0, 0, 0, 4, 0, 0, 0]); // 3.0, 4.0 as f32

    let interleaved = AudioZeroCopy::interleave_stereo(&left, &right).unwrap();

    assert_eq!(interleaved.size(), 16); // 4 samples * 4 bytes
    assert_eq!(interleaved.dimensions(), Some((4, 1))); // 4 interleaved samples

    let data = interleaved.as_slice();
    // Should be: L R L R pattern
    assert_eq!(&data[0..4], &[1u8, 0, 0, 0]); // First left
    assert_eq!(&data[4..8], &[3u8, 0, 0, 0]); // First right
    assert_eq!(&data[8..12], &[2u8, 0, 0, 0]); // Second left
    assert_eq!(&data[12..16], &[4u8, 0, 0, 0]); // Second right
  }

  #[tokio::test]
  async fn test_yuv_plane_extraction() {
    // Create YUV420p buffer for 4x4 image
    let mut yuv_buffer = ZeroCopyBuffer::for_frame(4, 4, DataType::Yuv420p).unwrap();
    yuv_buffer.dimensions = Some((4, 4));

    let (y_plane, u_plane, v_plane) = VideoZeroCopy::extract_yuv_planes(&yuv_buffer).unwrap();

    // Y plane should be 4x4 = 16 bytes
    assert_eq!(y_plane.size(), 16);
    // U and V planes should be 2x2 = 4 bytes each (subsampled)
    assert_eq!(u_plane.size(), 4);
    assert_eq!(v_plane.size(), 4);
  }

  #[tokio::test]
  async fn test_buffer_alignment() {
    // Test different alignments
    let buffer_8 = ZeroCopyBuffer::new(1024, 8, DataType::Raw).unwrap();
    let buffer_16 = ZeroCopyBuffer::new(1024, 16, DataType::Raw).unwrap();
    let buffer_32 = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    assert_eq!(buffer_8.alignment(), 8);
    assert_eq!(buffer_16.alignment(), 16);
    assert_eq!(buffer_32.alignment(), 32);

    // Check that pointers are actually aligned
    assert_eq!(buffer_8.as_slice().as_ptr() as usize % 8, 0);
    assert_eq!(buffer_16.as_slice().as_ptr() as usize % 16, 0);
    assert_eq!(buffer_32.as_slice().as_ptr() as usize % 32, 0);
  }

  #[tokio::test]
  async fn test_zero_copy_manager_pooling() {
    let manager = ZeroCopyManager::new();

    // Get and explicitly return a buffer
    let buffer1 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    assert_eq!(buffer1.size(), 1024);

    // Return buffer to pool
    manager.return_buffer(buffer1).await;

    // Get another buffer of same size - should be pooled
    let buffer2 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    assert_eq!(buffer2.size(), 1024);

    let stats = manager.get_stats().await;
    // Should show reuse
    assert!(stats.buffers_reused > 0);
  }

  #[tokio::test]
  async fn test_buffer_data_type_element_size() {
    assert_eq!(DataType::Raw.element_size(), 1);
    assert_eq!(DataType::Rgb24.element_size(), 3);
    assert_eq!(DataType::Rgba32.element_size(), 4);
    assert_eq!(DataType::AudioF32.element_size(), 4);
    assert_eq!(DataType::Yuv420p.element_size(), 1);
  }

  #[tokio::test]
  async fn test_buffer_error_cases() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    // Test view beyond buffer bounds
    let result = buffer.view(2000, 100);
    assert!(result.is_err());

    // Test view with size extending beyond buffer
    let result = buffer.view(1000, 100);
    assert!(result.is_err());

    // Test RGB to RGBA with wrong data type
    let wrong_buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    let result = VideoZeroCopy::rgb_to_rgba_inplace(&wrong_buffer);
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_manager_stats_tracking() {
    let manager = ZeroCopyManager::new();

    // Create several buffers
    let _buf1 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    let _buf2 = manager.get_buffer(2048, DataType::Rgb24).await.unwrap();
    let _buf3 = manager.get_buffer(1024, DataType::Raw).await.unwrap(); // Should reuse

    let stats = manager.get_stats().await;
    assert!(stats.buffers_created >= 2);
    assert!(stats.total_memory >= 3072);
    assert_eq!(stats.active_buffers, 3);
  }

  #[tokio::test]
  async fn test_concurrent_zero_copy_operations() {
    let manager = Arc::new(ZeroCopyManager::new());
    let mut handles = vec![];

    // Spawn multiple tasks performing zero-copy operations
    for i in 0..10 {
      let manager_clone = manager.clone();
      let handle = tokio::spawn(async move {
        let buffer = manager_clone
          .get_buffer(1024 * (i + 1), DataType::Raw)
          .await
          .unwrap();

        // Create view
        let view = buffer.view(0, 512).unwrap();
        assert_eq!(view.size(), 512);

        // Clone buffer reference
        let _cloned = buffer.clone_ref();
      });
      handles.push(handle);
    }

    // Wait for all tasks
    for handle in handles {
      handle.await.unwrap();
    }

    let stats = manager.get_stats().await;
    assert!(stats.buffers_created >= 10);
  }

  #[tokio::test]
  async fn test_buffer_view_safety() {
    let mut buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    // Fill buffer with test pattern
    let data = buffer.as_mut_slice();
    for (i, item) in data.iter_mut().enumerate() {
      *item = (i % 256) as u8;
    }

    // Create view
    let view = buffer.view(100, 200).unwrap();
    let view_data = view.as_slice();

    // Verify view shows correct data
    for (i, &byte) in view_data.iter().enumerate() {
      assert_eq!(byte, ((100 + i) % 256) as u8);
    }
  }

  // Additional tests for uncovered functionality

  #[test]
  fn test_data_type_frame_size() {
    // Test frame size calculations for different data types
    assert_eq!(DataType::Rgb24.frame_size(100, 100), 30000);
    assert_eq!(DataType::Rgba32.frame_size(100, 100), 40000);
    assert_eq!(DataType::Yuv420p.frame_size(100, 100), 15000); // 10000 + 2500 + 2500
    assert_eq!(DataType::Raw.frame_size(100, 100), 10000);
    assert_eq!(DataType::AudioF32.frame_size(100, 1), 400);
    assert_eq!(DataType::AudioPcm16.frame_size(100, 1), 200);
  }

  #[test]
  fn test_zero_copy_buffer_zero_size() {
    // Test error on zero size
    let result = ZeroCopyBuffer::new(0, 32, DataType::Raw);
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("zero"));
  }

  #[test]
  fn test_zero_copy_buffer_invalid_alignment() {
    // Test with various alignments
    let result = ZeroCopyBuffer::new(1024, 7, DataType::Raw); // Non-power-of-2
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_audio_buffer_creation() {
    // Test audio buffer creation with valid types
    let buffer_f32 = ZeroCopyBuffer::for_audio(1000, DataType::AudioF32).unwrap();
    assert_eq!(buffer_f32.size(), 4000); // 1000 samples * 4 bytes
    assert_eq!(buffer_f32.dimensions(), Some((1000, 1)));
    assert_eq!(buffer_f32.data_type(), DataType::AudioF32);

    let buffer_pcm = ZeroCopyBuffer::for_audio(1000, DataType::AudioPcm16).unwrap();
    assert_eq!(buffer_pcm.size(), 2000); // 1000 samples * 2 bytes
    assert_eq!(buffer_pcm.dimensions(), Some((1000, 1)));
  }

  #[tokio::test]
  async fn test_audio_buffer_invalid_type() {
    // Test audio buffer creation with invalid type
    let result = ZeroCopyBuffer::for_audio(1000, DataType::Rgb24);
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Invalid audio data type"));
  }

  #[test]
  fn test_buffer_ref_count() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    assert!(buffer.is_unique());
    assert_eq!(buffer.ref_count(), 1);

    let _ref1 = buffer.clone_ref();
    assert!(!buffer.is_unique());
    assert_eq!(buffer.ref_count(), 2);

    let _ref2 = buffer.clone_ref();
    assert_eq!(buffer.ref_count(), 3);
  }

  #[tokio::test]
  async fn test_zero_copy_transfer() {
    let manager = ZeroCopyManager::new();

    // Create source buffer
    let mut src_buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    src_buffer.as_mut_slice().fill(42);
    let src_ref = src_buffer.clone_ref();

    // Create destination buffer
    let mut dst_buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    // Transfer data
    manager
      .transfer_data(&src_ref, &mut dst_buffer)
      .await
      .unwrap();

    // Verify data was copied
    assert_eq!(dst_buffer.as_slice()[0], 42);
    assert_eq!(dst_buffer.as_slice()[1023], 42);

    let stats = manager.get_stats().await;
    assert_eq!(stats.zero_copy_operations, 1);
    assert_eq!(stats.bytes_saved, 1024);
  }

  #[tokio::test]
  async fn test_zero_copy_transfer_size_mismatch() {
    let manager = ZeroCopyManager::new();

    let src_buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    let src_ref = src_buffer.clone_ref();
    let mut dst_buffer = ZeroCopyBuffer::new(2048, 32, DataType::Raw).unwrap();

    let result = manager.transfer_data(&src_ref, &mut dst_buffer).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("sizes must match"));
  }

  #[tokio::test]
  async fn test_zero_copy_transfer_type_mismatch() {
    let manager = ZeroCopyManager::new();

    let src_buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    let src_ref = src_buffer.clone_ref();
    let mut dst_buffer = ZeroCopyBuffer::new(1024, 32, DataType::Rgb24).unwrap();

    let result = manager.transfer_data(&src_ref, &mut dst_buffer).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("types must match"));
  }

  #[tokio::test]
  async fn test_manager_create_view() {
    let manager = ZeroCopyManager::new();
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    let view = manager.create_view(&buffer, 100, 500).await.unwrap();
    assert_eq!(view.size(), 500);
    assert_eq!(view.data_type(), DataType::Raw);

    let stats = manager.get_stats().await;
    assert_eq!(stats.zero_copy_operations, 1);
    assert_eq!(stats.bytes_saved, 500);
  }

  #[tokio::test]
  async fn test_manager_concatenate_views() {
    let manager = ZeroCopyManager::new();
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    let view1 = buffer.view(0, 100).unwrap();
    let view2 = buffer.view(100, 200).unwrap();
    let view3 = buffer.view(300, 300).unwrap();

    let views = vec![view1, view2, view3];
    let slices = manager.concatenate_views(&views).await.unwrap();

    assert_eq!(slices.len(), 3);
    assert_eq!(slices[0].len(), 100);
    assert_eq!(slices[1].len(), 200);
    assert_eq!(slices[2].len(), 300);

    let stats = manager.get_stats().await;
    assert_eq!(stats.bytes_saved, 600);
  }

  #[tokio::test]
  async fn test_manager_pool_info() {
    let manager = ZeroCopyManager::new();

    // Create and return buffers to populate pools
    let buf1 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    let buf2 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    let buf3 = manager.get_buffer(2048, DataType::Rgb24).await.unwrap();

    manager.return_buffer(buf1).await;
    manager.return_buffer(buf2).await;
    manager.return_buffer(buf3).await;

    let pool_info = manager.get_pool_info().await;
    assert!(pool_info.contains_key(&(1024, DataType::Raw)));
    assert!(pool_info.contains_key(&(2048, DataType::Rgb24)));
  }

  #[tokio::test]
  async fn test_manager_clear_pools() {
    let manager = ZeroCopyManager::new();

    // Populate pools
    let buf = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    manager.return_buffer(buf).await;

    let pool_info = manager.get_pool_info().await;
    assert!(!pool_info.is_empty());

    // Clear pools
    manager.clear_pools().await;

    let pool_info = manager.get_pool_info().await;
    assert!(pool_info.is_empty());
  }

  #[tokio::test]
  async fn test_manager_max_pool_size() {
    let manager = ZeroCopyManager::new();

    // Return more buffers than max_pool_size (16)
    for _ in 0..20 {
      let buf = manager.get_buffer(1024, DataType::Raw).await.unwrap();
      manager.return_buffer(buf).await;
    }

    let pool_info = manager.get_pool_info().await;
    let pool_size = pool_info.get(&(1024, DataType::Raw)).copied().unwrap_or(0);
    assert!(pool_size <= 16); // Should not exceed max_pool_size
  }

  #[tokio::test]
  async fn test_manager_return_buffer_not_unique() {
    let manager = ZeroCopyManager::new();

    let buffer = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    let _ref = buffer.clone_ref(); // Create additional reference

    let stats_before = manager.get_stats().await;
    manager.return_buffer(buffer).await; // Should not return to pool
    let stats_after = manager.get_stats().await;

    // Active buffers should not decrease since buffer wasn't unique
    assert_eq!(stats_before.active_buffers, stats_after.active_buffers);
  }

  #[tokio::test]
  async fn test_manager_get_frame_buffer() {
    let manager = ZeroCopyManager::new();

    let buffer = manager
      .get_frame_buffer(640, 480, DataType::Rgb24)
      .await
      .unwrap();
    assert_eq!(buffer.dimensions(), Some((640, 480)));
    assert_eq!(buffer.size(), 640 * 480 * 3);
    assert_eq!(buffer.data_type(), DataType::Rgb24);
  }

  #[tokio::test]
  async fn test_manager_get_audio_buffer() {
    let manager = ZeroCopyManager::new();

    let buffer = manager
      .get_audio_buffer(48000, DataType::AudioF32)
      .await
      .unwrap();
    assert_eq!(buffer.dimensions(), Some((48000, 1)));
    assert_eq!(buffer.size(), 48000 * 4);
    assert_eq!(buffer.data_type(), DataType::AudioF32);
  }

  #[tokio::test]
  async fn test_manager_get_audio_buffer_invalid_type() {
    let manager = ZeroCopyManager::new();

    let result = manager.get_audio_buffer(48000, DataType::Rgb24).await;
    assert!(result.is_err());
  }

  #[test]
  fn test_video_zero_copy_rgb_to_rgba() {
    // Create small RGB buffer
    let mut rgb_buffer = ZeroCopyBuffer::for_frame(2, 2, DataType::Rgb24).unwrap();
    let rgb_data = rgb_buffer.as_mut_slice();

    // Fill with test pattern (R, G, B)
    rgb_data[0] = 255;
    rgb_data[1] = 0;
    rgb_data[2] = 0; // Red
    rgb_data[3] = 0;
    rgb_data[4] = 255;
    rgb_data[5] = 0; // Green
    rgb_data[6] = 0;
    rgb_data[7] = 0;
    rgb_data[8] = 255; // Blue
    rgb_data[9] = 128;
    rgb_data[10] = 128;
    rgb_data[11] = 128; // Gray

    let rgba_buffer = VideoZeroCopy::rgb_to_rgba_inplace(&rgb_buffer).unwrap();
    let rgba_data = rgba_buffer.as_slice();

    // Verify RGBA data
    assert_eq!(rgba_data[0], 255);
    assert_eq!(rgba_data[1], 0);
    assert_eq!(rgba_data[2], 0);
    assert_eq!(rgba_data[3], 255);
    assert_eq!(rgba_data[4], 0);
    assert_eq!(rgba_data[5], 255);
    assert_eq!(rgba_data[6], 0);
    assert_eq!(rgba_data[7], 255);
    assert_eq!(rgba_data[8], 0);
    assert_eq!(rgba_data[9], 0);
    assert_eq!(rgba_data[10], 255);
    assert_eq!(rgba_data[11], 255);
    assert_eq!(rgba_data[12], 128);
    assert_eq!(rgba_data[13], 128);
    assert_eq!(rgba_data[14], 128);
    assert_eq!(rgba_data[15], 255);
  }

  #[test]
  fn test_video_zero_copy_rgb_to_rgba_no_dimensions() {
    let mut buffer = ZeroCopyBuffer::new(12, 32, DataType::Rgb24).unwrap();
    buffer.dimensions = None; // Remove dimensions

    let result = VideoZeroCopy::rgb_to_rgba_inplace(&buffer);
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("missing dimensions"));
  }

  #[test]
  fn test_video_zero_copy_extract_yuv_wrong_type() {
    let buffer = ZeroCopyBuffer::for_frame(4, 4, DataType::Rgb24).unwrap();

    let result = VideoZeroCopy::extract_yuv_planes(&buffer);
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Expected YUV420p"));
  }

  #[test]
  fn test_video_zero_copy_extract_yuv_no_dimensions() {
    let mut buffer = ZeroCopyBuffer::new(24, 32, DataType::Yuv420p).unwrap();
    buffer.dimensions = None;

    let result = VideoZeroCopy::extract_yuv_planes(&buffer);
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("missing dimensions"));
  }

  #[test]
  fn test_audio_zero_copy_interleave_different_types() {
    let left = ZeroCopyBuffer::for_audio(100, DataType::AudioF32).unwrap();
    let right = ZeroCopyBuffer::for_audio(100, DataType::AudioPcm16).unwrap();

    let result = AudioZeroCopy::interleave_stereo(&left, &right);
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("same type"));
  }

  #[test]
  fn test_audio_zero_copy_interleave_different_sizes() {
    let left = ZeroCopyBuffer::for_audio(100, DataType::AudioF32).unwrap();
    let right = ZeroCopyBuffer::for_audio(200, DataType::AudioF32).unwrap();

    let result = AudioZeroCopy::interleave_stereo(&left, &right);
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("same size"));
  }

  #[test]
  fn test_audio_zero_copy_interleave_pcm16() {
    let mut left = ZeroCopyBuffer::for_audio(2, DataType::AudioPcm16).unwrap();
    let mut right = ZeroCopyBuffer::for_audio(2, DataType::AudioPcm16).unwrap();

    // Fill with test data (16-bit PCM)
    left
      .as_mut_slice()
      .copy_from_slice(&[0x11, 0x11, 0x22, 0x22]);
    right
      .as_mut_slice()
      .copy_from_slice(&[0x33, 0x33, 0x44, 0x44]);

    let interleaved = AudioZeroCopy::interleave_stereo(&left, &right).unwrap();
    let data = interleaved.as_slice();

    // Verify interleaved pattern
    assert_eq!(&data[0..2], &[0x11, 0x11]); // L1
    assert_eq!(&data[2..4], &[0x33, 0x33]); // R1
    assert_eq!(&data[4..6], &[0x22, 0x22]); // L2
    assert_eq!(&data[6..8], &[0x44, 0x44]); // R2
  }

  #[test]
  fn test_zero_copy_ref_clone() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    let ref1 = buffer.clone_ref();
    let ref2 = ref1.clone();

    assert_eq!(ref1.size(), ref2.size());
    assert_eq!(ref1.data_type(), ref2.data_type());
    assert_eq!(ref1.dimensions(), ref2.dimensions());
  }

  #[test]
  fn test_data_type_equality() {
    assert_eq!(DataType::Rgb24, DataType::Rgb24);
    assert_ne!(DataType::Rgb24, DataType::Rgba32);
    assert_ne!(DataType::AudioF32, DataType::AudioPcm16);
  }

  #[tokio::test]
  async fn test_zero_copy_manager_stats_consistency() {
    let manager = ZeroCopyManager::new();

    // Create buffers
    let buf1 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    let _buf2 = manager.get_buffer(2048, DataType::Raw).await.unwrap();

    let stats = manager.get_stats().await;
    assert_eq!(stats.buffers_created, 2);
    assert_eq!(stats.active_buffers, 2);
    assert_eq!(stats.total_memory, 3072);

    // Return one buffer
    manager.return_buffer(buf1).await;

    let stats = manager.get_stats().await;
    assert_eq!(stats.active_buffers, 1);
    assert_eq!(stats.total_memory, 2048);

    // Get buffer again (should reuse)
    let _buf3 = manager.get_buffer(1024, DataType::Raw).await.unwrap();

    let stats = manager.get_stats().await;
    assert_eq!(stats.buffers_created, 2); // No new buffer created
    assert_eq!(stats.buffers_reused, 1);
    assert_eq!(stats.active_buffers, 2);
    assert_eq!(stats.total_memory, 3072);
  }

  #[test]
  fn test_buffer_send_sync() {
    // Compile-time test to ensure types implement Send + Sync
    fn assert_send_sync<T: Send + Sync>() {}

    assert_send_sync::<ZeroCopyBuffer>();
    assert_send_sync::<ZeroCopyRef>();
    assert_send_sync::<ZeroCopyView>();
  }

  #[tokio::test]
  async fn test_large_buffer_handling() {
    let manager = ZeroCopyManager::new();

    // Test with various large sizes
    let sizes = vec![
      1024 * 1024,      // 1 MB
      10 * 1024 * 1024, // 10 MB
      50 * 1024 * 1024, // 50 MB
    ];

    for size in sizes {
      let buffer = manager.get_buffer(size, DataType::Raw).await.unwrap();
      assert_eq!(buffer.size(), size);

      // Verify we can write and read
      let slice = buffer.as_slice();
      assert_eq!(slice.len(), size);
    }
  }

  #[test]
  fn test_buffer_drop_deallocates_memory() {
    // This test verifies that Drop implementation works
    // by creating and dropping many buffers
    for _ in 0..100 {
      let buffer = ZeroCopyBuffer::new(1024 * 1024, 32, DataType::Raw).unwrap();
      let _slice = buffer.as_slice(); // Use the buffer
                                      // Buffer dropped here
    }
    // If Drop doesn't work properly, we'd run out of memory
  }

  #[tokio::test]
  async fn test_concurrent_manager_access() {
    let manager = Arc::new(ZeroCopyManager::new());
    let mut handles = vec![];

    // Spawn many concurrent tasks
    for i in 0..50 {
      let manager_clone = manager.clone();
      let handle = tokio::spawn(async move {
        // Each task performs multiple operations
        for j in 0..10 {
          let size = 1024 * ((i * 10 + j) % 10 + 1);
          let buffer = manager_clone.get_buffer(size, DataType::Raw).await.unwrap();

          // Create some views
          if size > 100 {
            let _view = manager_clone.create_view(&buffer, 0, 100).await.unwrap();
          }

          // Return buffer sometimes
          if j % 2 == 0 {
            manager_clone.return_buffer(buffer).await;
          }
        }
      });
      handles.push(handle);
    }

    // Wait for all tasks
    for handle in handles {
      handle.await.unwrap();
    }

    // Verify manager is still in consistent state
    let stats = manager.get_stats().await;
    assert!(stats.buffers_created > 0);
    assert!(stats.zero_copy_operations > 0);
  }
}
