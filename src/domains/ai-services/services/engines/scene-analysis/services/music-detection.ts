/**
 * Music Detection Service
 * Сервис для детекции и анализа музыкальных сегментов в аудио/видео контенте
 */

import { FFmpegAnalysisService } from "@/domains/ai-services"
import { AudioAnalysisResult } from "@/domains/shared/types"

// Типы для музыкальной детекции
export interface MusicSegment {
  id: string
  startTime: number // секунды
  endTime: number
  duration: number
  confidence: number // 0-1
  type: MusicSegmentType
  genre?: MusicGenre
  tempo?: number // BPM
  key?: MusicalKey
  mood?: MusicMood
  energy?: number // 0-1, энергетичность
  volume?: number // 0-1, средний уровень громкости
  instruments?: DetectedInstrument[]
  vocals?: VocalCharacteristics
}

export enum MusicSegmentType {
  MUSIC = "music", // Музыкальный сегмент
  SPEECH = "speech", // Речь/диалог
  AMBIENT = "ambient", // Фоновые звуки
  SILENCE = "silence", // Тишина
  NOISE = "noise", // Шум
  MIXED = "mixed", // Смешанный (музыка + речь)
}

export enum MusicGenre {
  CLASSICAL = "classical",
  ROCK = "rock",
  POP = "pop",
  JAZZ = "jazz",
  ELECTRONIC = "electronic",
  HIP_HOP = "hip_hop",
  COUNTRY = "country",
  FOLK = "folk",
  BLUES = "blues",
  REGGAE = "reggae",
  METAL = "metal",
  AMBIENT = "ambient",
  CINEMATIC = "cinematic",
  UNKNOWN = "unknown",
}

export enum MusicalKey {
  C_MAJOR = "C_major",
  G_MAJOR = "G_major",
  D_MAJOR = "D_major",
  A_MAJOR = "A_major",
  E_MAJOR = "E_major",
  B_MAJOR = "B_major",
  F_SHARP_MAJOR = "F#_major",
  C_SHARP_MAJOR = "C#_major",
  F_MAJOR = "F_major",
  B_FLAT_MAJOR = "Bb_major",
  E_FLAT_MAJOR = "Eb_major",
  A_FLAT_MAJOR = "Ab_major",
  D_FLAT_MAJOR = "Db_major",
  G_FLAT_MAJOR = "Gb_major",
  C_MINOR = "C_minor",
  G_MINOR = "G_minor",
  D_MINOR = "D_minor",
  A_MINOR = "A_minor",
  E_MINOR = "E_minor",
  B_MINOR = "B_minor",
  F_SHARP_MINOR = "F#_minor",
  C_SHARP_MINOR = "C#_minor",
  F_MINOR = "F_minor",
  B_FLAT_MINOR = "Bb_minor",
  E_FLAT_MINOR = "Eb_minor",
  A_FLAT_MINOR = "Ab_minor",
  UNKNOWN = "unknown",
}

export enum MusicMood {
  HAPPY = "happy",
  SAD = "sad",
  ENERGETIC = "energetic",
  CALM = "calm",
  AGGRESSIVE = "aggressive",
  ROMANTIC = "romantic",
  MYSTERIOUS = "mysterious",
  EPIC = "epic",
  NOSTALGIC = "nostalgic",
  PLAYFUL = "playful",
  TENSE = "tense",
  PEACEFUL = "peaceful",
  UNKNOWN = "unknown",
}

export interface DetectedInstrument {
  name: string
  confidence: number // 0-1
  prominence: number // 0-1, насколько выделяется в миксе
  category: InstrumentCategory
}

export enum InstrumentCategory {
  STRINGS = "strings", // Струнные
  BRASS = "brass", // Духовые медные
  WOODWIND = "woodwind", // Духовые деревянные
  PERCUSSION = "percussion", // Ударные
  KEYBOARD = "keyboard", // Клавишные
  ELECTRONIC = "electronic", // Электронные
  VOCALS = "vocals", // Вокал
  UNKNOWN = "unknown",
}

export interface VocalCharacteristics {
  hasVocals: boolean
  gender?: "male" | "female" | "mixed" | "unknown"
  voiceType?: "solo" | "choir" | "unknown"
  language?: string
  confidence: number
}

export interface MusicDetectionConfig {
  // Параметры анализа
  analysis: {
    enableGenreDetection: boolean
    enableTempoDetection: boolean
    enableKeyDetection: boolean
    enableMoodDetection: boolean
    enableInstrumentDetection: boolean
    enableVocalDetection: boolean
  }

  // Фильтрация сегментов
  filtering: {
    minSegmentDuration: number // минимальная длина сегмента в секундах
    confidenceThreshold: number // минимальная уверенность (0-1)
    mergeNearbySegments: boolean // объединять близкие сегменты
    mergeGapThreshold: number // максимальный разрыв для объединения (секунды)
  }

  // Производительность
  performance: {
    analysisInterval: number // интервал анализа в секундах
    useGPU: boolean // использовать GPU для ускорения
    maxParallelJobs: number
  }
}

export interface MusicDetectionResult {
  segments: MusicSegment[]
  summary: MusicSummary
  timeline: MusicTimeline
}

export interface MusicSummary {
  totalDuration: number
  musicDuration: number // общая длительность музыки
  speechDuration: number // общая длительность речи
  silenceDuration: number // общая длительность тишины
  musicPercentage: number // процент музыки от общего времени
  dominantGenre?: MusicGenre
  averageTempo?: number
  dominantKey?: MusicalKey
  dominantMood?: MusicMood
  hasVocals: boolean
  energyProfile: EnergyProfile
}

export interface EnergyProfile {
  overall: number // 0-1, общий уровень энергии
  peaks: Array<{
    timestamp: number
    energy: number
    duration: number
  }>
  valleys: Array<{
    timestamp: number
    energy: number
    duration: number
  }>
  trend: "increasing" | "decreasing" | "stable" | "variable"
}

export interface MusicTimeline {
  energyTimeline: Array<{
    timestamp: number
    energy: number
  }>
  tempoTimeline: Array<{
    timestamp: number
    tempo: number
  }>
  volumeTimeline: Array<{
    timestamp: number
    volume: number
  }>
}

export class MusicDetectionService {
  private config: MusicDetectionConfig
  private ffmpegService: FFmpegAnalysisService

  constructor(config?: Partial<MusicDetectionConfig>) {
    this.config = {
      analysis: {
        enableGenreDetection: true,
        enableTempoDetection: true,
        enableKeyDetection: false, // Требует специализированных алгоритмов
        enableMoodDetection: true,
        enableInstrumentDetection: false, // Требует ML модели
        enableVocalDetection: true,
      },
      filtering: {
        minSegmentDuration: 1.0, // 1 секунда
        confidenceThreshold: 0.4,
        mergeNearbySegments: true,
        mergeGapThreshold: 2.0, // 2 секунды
      },
      performance: {
        analysisInterval: 1.0, // анализ каждую секунду
        useGPU: false,
        maxParallelJobs: 2,
      },
      ...config,
    }

    this.ffmpegService = FFmpegAnalysisService.getInstance()
  }

  /**
   * Анализ музыкального контента в медиа файле
   */
  async detectMusic(filePath: string): Promise<MusicDetectionResult> {
    try {
      console.log(`Starting music detection for: ${filePath}`)

      // Получаем базовую аудио аналитику через FFmpeg
      const audioAnalysis = await this.ffmpegService.analyzeAudio(filePath)

      // Получаем метаданные файла
      const metadata = await this.ffmpegService.getVideoMetadata(filePath)

      // Получаем детекцию тишины
      const silenceDetection = await this.ffmpegService.detectSilence(filePath, {
        threshold: -30, // dB
        minDuration: 0.5,
      })

      // Анализируем аудио сегменты
      const segments = await this.analyzeAudioSegments(audioAnalysis, silenceDetection, metadata.duration)

      // Создаем сводку
      const summary = this.createMusicSummary(segments, metadata.duration)

      // Создаем временную шкалу
      const timeline = this.createMusicTimeline(segments, metadata.duration)

      console.log(`Music detection completed. Found ${segments.length} segments`)

      return {
        segments,
        summary,
        timeline,
      }
    } catch (error) {
      console.error("Failed to detect music:", error)
      throw error
    }
  }

  /**
   * Анализ аудио сегментов для определения музыкальных характеристик
   */
  private async analyzeAudioSegments(
    audioAnalysis: AudioAnalysisResult,
    silenceDetection: any,
    totalDuration: number,
  ): Promise<MusicSegment[]> {
    const segments: MusicSegment[] = []
    const analysisInterval = this.config.performance.analysisInterval

    // Создаем временные отрезки для анализа
    const timeSlices = Math.ceil(totalDuration / analysisInterval)

    for (let i = 0; i < timeSlices; i++) {
      const startTime = i * analysisInterval
      const endTime = Math.min((i + 1) * analysisInterval, totalDuration)

      // Проверяем, не является ли этот отрезок тишиной
      const isSilence = this.isTimestampInSilence(startTime, endTime, silenceDetection.silences)

      if (isSilence) {
        segments.push(this.createSilenceSegment(startTime, endTime))
        continue
      }

      // Анализируем аудио характеристики для этого отрезка
      const segment = await this.analyzeTimeSlice(startTime, endTime, audioAnalysis)

      if (segment.confidence >= this.config.filtering.confidenceThreshold) {
        segments.push(segment)
      }
    }

    // Объединяем близкие сегменты если нужно
    return this.config.filtering.mergeNearbySegments ? this.mergeNearbySegments(segments) : segments
  }

  /**
   * Анализ временного отрезка аудио
   */
  private async analyzeTimeSlice(
    startTime: number,
    endTime: number,
    audioAnalysis: AudioAnalysisResult,
  ): Promise<MusicSegment> {
    const duration = endTime - startTime
    const segmentId = `segment_${startTime.toFixed(1)}_${endTime.toFixed(1)}`

    // Определяем тип сегмента на основе аудио характеристик
    const segmentType = this.classifySegmentType(audioAnalysis)

    // Базовый сегмент
    const segment: MusicSegment = {
      id: segmentId,
      startTime,
      endTime,
      duration,
      confidence: 0.7, // базовая уверенность
      type: segmentType,
      volume: audioAnalysis.volume.average,
      energy: this.calculateEnergyLevel(audioAnalysis),
    }

    // Дополнительный анализ для музыкальных сегментов
    if (segmentType === MusicSegmentType.MUSIC || segmentType === MusicSegmentType.MIXED) {
      if (this.config.analysis.enableGenreDetection) {
        segment.genre = this.detectGenre(audioAnalysis)
      }

      if (this.config.analysis.enableTempoDetection) {
        segment.tempo = this.detectTempo(audioAnalysis)
      }

      if (this.config.analysis.enableMoodDetection) {
        segment.mood = this.detectMood(audioAnalysis)
      }

      if (this.config.analysis.enableVocalDetection) {
        segment.vocals = this.detectVocalCharacteristics(audioAnalysis)
      }

      if (this.config.analysis.enableKeyDetection) {
        segment.key = this.detectMusicalKey(audioAnalysis)
      }
    }

    return segment
  }

  /**
   * Классификация типа аудио сегмента
   */
  private classifySegmentType(audioAnalysis: AudioAnalysisResult): MusicSegmentType {
    const { volume, frequency, dynamics } = audioAnalysis

    // Если очень тихо - вероятно тишина
    if (volume.average < 0.1) {
      return MusicSegmentType.SILENCE
    }

    // Анализируем частотный спектр
    const lowEnergy = frequency.lowEnd
    const midEnergy = frequency.midRange
    const highEnergy = frequency.highEnd

    // Музыка обычно имеет более равномерное распределение частот
    const frequencyBalance = this.calculateFrequencyBalance(lowEnergy, midEnergy, highEnergy)

    // Музыка обычно имеет больший динамический диапазон
    const dynamicRange = dynamics.dynamicRange

    // Простая эвристика для классификации
    if (frequencyBalance > 0.6 && dynamicRange > 0.4) {
      // Проверяем наличие речевых характеристик
      const hasSpeechCharacteristics = this.detectSpeechCharacteristics(audioAnalysis)
      return hasSpeechCharacteristics ? MusicSegmentType.MIXED : MusicSegmentType.MUSIC
    }
    if (midEnergy > lowEnergy && midEnergy > highEnergy) {
      // Преобладание средних частот может указывать на речь
      return MusicSegmentType.SPEECH
    }
    if (volume.average > 0.3 && frequencyBalance < 0.3) {
      // Высокий уровень, но плохой частотный баланс - возможно шум
      return MusicSegmentType.NOISE
    }

    return MusicSegmentType.AMBIENT
  }

  /**
   * Расчет баланса частот (насколько равномерно распределены частоты)
   */
  private calculateFrequencyBalance(low: number, mid: number, high: number): number {
    const total = low + mid + high
    if (total === 0) return 0

    const normalized = [low / total, mid / total, high / total]
    const ideal = 1 / 3 // идеальное равномерное распределение

    // Вычисляем отклонение от идеального распределения
    const deviation = normalized.reduce((sum, freq) => sum + Math.abs(freq - ideal), 0)

    // Возвращаем показатель баланса (1 = идеальный баланс, 0 = полный дисбаланс)
    return Math.max(0, 1 - deviation)
  }

  /**
   * Детекция речевых характеристик
   */
  private detectSpeechCharacteristics(audioAnalysis: AudioAnalysisResult): boolean {
    const { frequency, volume } = audioAnalysis

    // Речь обычно концентрируется в средних частотах
    const midFreqDominance = frequency.midRange > (frequency.lowEnd + frequency.highEnd) / 2

    // Речь имеет характерные паузы и изменения громкости
    const hasVariation = volume.peak - volume.average > 0.2

    return midFreqDominance && hasVariation
  }

  /**
   * Расчет уровня энергии
   */
  private calculateEnergyLevel(audioAnalysis: AudioAnalysisResult): number {
    const { volume, frequency, dynamics } = audioAnalysis

    // Комбинируем различные факторы для определения энергии
    const volumeEnergy = volume.rms * 0.4
    const frequencyEnergy = ((frequency.lowEnd + frequency.midRange + frequency.highEnd) / 3) * 0.3
    const dynamicEnergy = dynamics.dynamicRange * 0.3

    return Math.min(1, volumeEnergy + frequencyEnergy + dynamicEnergy)
  }

  /**
   * Детекция жанра музыки (упрощенная)
   */
  private detectGenre(audioAnalysis: AudioAnalysisResult): MusicGenre {
    const { frequency, dynamics } = audioAnalysis

    // Простая эвристика на основе частотных характеристик
    if (frequency.lowEnd > 0.7) {
      return MusicGenre.ELECTRONIC // Много басов
    }
    if (frequency.highEnd > 0.7) {
      return MusicGenre.CLASSICAL // Много высоких частот
    }
    if (dynamics.dynamicRange > 0.8) {
      return MusicGenre.CLASSICAL // Большой динамический диапазон
    }
    if (frequency.midRange > 0.6) {
      return MusicGenre.POP // Преобладание средних частот
    }

    return MusicGenre.UNKNOWN
  }

  /**
   * Детекция темпа (упрощенная - требует специализированных алгоритмов)
   */
  private detectTempo(audioAnalysis: AudioAnalysisResult): number {
    // Заглушка - в реальной реализации нужен анализ ритма
    // Возвращаем примерный темп на основе энергии
    const energy = this.calculateEnergyLevel(audioAnalysis)

    if (energy > 0.8) return 120 + Math.random() * 60 // Быстрый темп 120-180 BPM
    if (energy > 0.5) return 90 + Math.random() * 40 // Средний темп 90-130 BPM
    return 60 + Math.random() * 40 // Медленный темп 60-100 BPM
  }

  /**
   * Детекция настроения музыки
   */
  private detectMood(audioAnalysis: AudioAnalysisResult): MusicMood {
    const energy = this.calculateEnergyLevel(audioAnalysis)
    const { frequency, dynamics } = audioAnalysis

    // Простая эвристика на основе энергии и частотных характеристик
    if (energy > 0.8 && frequency.highEnd > 0.6) {
      return MusicMood.ENERGETIC
    }
    if (energy > 0.7 && dynamics.dynamicRange > 0.6) {
      return MusicMood.EPIC
    }
    if (energy < 0.3 && frequency.lowEnd < 0.3) {
      return MusicMood.SAD
    }
    if (energy < 0.4 && frequency.midRange > 0.5) {
      return MusicMood.CALM
    }
    if (energy > 0.6 && frequency.lowEnd > 0.6) {
      return MusicMood.AGGRESSIVE
    }
    if (energy > 0.5 && frequency.midRange > 0.6) {
      return MusicMood.HAPPY
    }

    return MusicMood.UNKNOWN
  }

  /**
   * Детекция вокальных характеристик
   */
  private detectVocalCharacteristics(audioAnalysis: AudioAnalysisResult): VocalCharacteristics {
    const hasSpeechCharacteristics = this.detectSpeechCharacteristics(audioAnalysis)

    // Заглушка - требует специализированного анализа
    return {
      hasVocals: hasSpeechCharacteristics,
      confidence: hasSpeechCharacteristics ? 0.7 : 0.3,
    }
  }

  /**
   * Детекция музыкального ключа (заглушка - требует специализированных алгоритмов)
   */
  private detectMusicalKey(_audioAnalysis: AudioAnalysisResult): MusicalKey {
    // В реальной реализации требуется анализ гармоний и мелодических паттернов
    return MusicalKey.UNKNOWN
  }

  /**
   * Проверка, попадает ли временной отрезок в период тишины
   */
  private isTimestampInSilence(
    startTime: number,
    endTime: number,
    silences: Array<{ startTime: number; endTime: number }>,
  ): boolean {
    return silences.some(
      (silence) =>
        (startTime >= silence.startTime && startTime <= silence.endTime) ||
        (endTime >= silence.startTime && endTime <= silence.endTime) ||
        (startTime <= silence.startTime && endTime >= silence.endTime),
    )
  }

  /**
   * Создание сегмента тишины
   */
  private createSilenceSegment(startTime: number, endTime: number): MusicSegment {
    return {
      id: `silence_${startTime.toFixed(1)}_${endTime.toFixed(1)}`,
      startTime,
      endTime,
      duration: endTime - startTime,
      confidence: 0.9,
      type: MusicSegmentType.SILENCE,
      volume: 0,
      energy: 0,
    }
  }

  /**
   * Объединение близких сегментов
   */
  private mergeNearbySegments(segments: MusicSegment[]): MusicSegment[] {
    if (segments.length === 0) return segments

    const merged: MusicSegment[] = []
    let current = segments[0]

    for (let i = 1; i < segments.length; i++) {
      const next = segments[i]
      const gap = next.startTime - current.endTime

      // Объединяем если разрыв меньше порога и типы совпадают
      if (gap <= this.config.filtering.mergeGapThreshold && current.type === next.type) {
        current = this.mergeTwoSegments(current, next)
      } else {
        merged.push(current)
        current = next
      }
    }

    merged.push(current)
    return merged
  }

  /**
   * Объединение двух сегментов
   */
  private mergeTwoSegments(seg1: MusicSegment, seg2: MusicSegment): MusicSegment {
    const totalDuration = seg1.endTime - seg1.startTime + (seg2.endTime - seg2.startTime)
    const weight1 = (seg1.endTime - seg1.startTime) / totalDuration
    const weight2 = (seg2.endTime - seg2.startTime) / totalDuration

    return {
      id: `${seg1.id}_merged_${seg2.id}`,
      startTime: seg1.startTime,
      endTime: seg2.endTime,
      duration: seg2.endTime - seg1.startTime,
      confidence: seg1.confidence * weight1 + seg2.confidence * weight2,
      type: seg1.type,
      genre: seg1.genre || seg2.genre,
      tempo: seg1.tempo && seg2.tempo ? seg1.tempo * weight1 + seg2.tempo * weight2 : seg1.tempo || seg2.tempo,
      key: seg1.key || seg2.key,
      mood: seg1.mood || seg2.mood,
      energy:
        seg1.energy && seg2.energy ? seg1.energy * weight1 + seg2.energy * weight2 : seg1.energy || seg2.energy || 0,
      volume:
        seg1.volume && seg2.volume ? seg1.volume * weight1 + seg2.volume * weight2 : seg1.volume || seg2.volume || 0,
      vocals: seg1.vocals || seg2.vocals,
    }
  }

  /**
   * Создание сводки музыкального анализа
   */
  private createMusicSummary(segments: MusicSegment[], totalDuration: number): MusicSummary {
    const musicSegments = segments.filter((s) => s.type === MusicSegmentType.MUSIC || s.type === MusicSegmentType.MIXED)
    const speechSegments = segments.filter((s) => s.type === MusicSegmentType.SPEECH)
    const silenceSegments = segments.filter((s) => s.type === MusicSegmentType.SILENCE)

    const musicDuration = musicSegments.reduce((sum, s) => sum + s.duration, 0)
    const speechDuration = speechSegments.reduce((sum, s) => sum + s.duration, 0)
    const silenceDuration = silenceSegments.reduce((sum, s) => sum + s.duration, 0)

    // Определяем доминирующий жанр
    const genreCounts = new Map<MusicGenre, number>()
    musicSegments.forEach((s) => {
      if (s.genre) {
        genreCounts.set(s.genre, (genreCounts.get(s.genre) || 0) + s.duration)
      }
    })
    const dominantGenre = Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]

    // Средний темп
    const tempos = musicSegments.filter((s) => s.tempo).map((s) => s.tempo!)
    const averageTempo = tempos.length > 0 ? tempos.reduce((sum, t) => sum + t, 0) / tempos.length : undefined

    // Доминирующий ключ
    const keyCounts = new Map<MusicalKey, number>()
    musicSegments.forEach((s) => {
      if (s.key) {
        keyCounts.set(s.key, (keyCounts.get(s.key) || 0) + s.duration)
      }
    })
    const dominantKey = Array.from(keyCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]

    // Доминирующее настроение
    const moodCounts = new Map<MusicMood, number>()
    musicSegments.forEach((s) => {
      if (s.mood) {
        moodCounts.set(s.mood, (moodCounts.get(s.mood) || 0) + s.duration)
      }
    })
    const dominantMood = Array.from(moodCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]

    // Наличие вокала
    const hasVocals = musicSegments.some((s) => s.vocals?.hasVocals)

    // Профиль энергии
    const energyProfile = this.createEnergyProfile(segments)

    return {
      totalDuration,
      musicDuration,
      speechDuration,
      silenceDuration,
      musicPercentage: (musicDuration / totalDuration) * 100,
      dominantGenre,
      averageTempo,
      dominantKey,
      dominantMood,
      hasVocals,
      energyProfile,
    }
  }

  /**
   * Создание профиля энергии
   */
  private createEnergyProfile(segments: MusicSegment[]): EnergyProfile {
    const energyValues = segments.map((s) => s.energy || 0)
    const overall = energyValues.reduce((sum, e) => sum + e, 0) / energyValues.length

    // Поиск пиков и впадин
    const peaks: Array<{ timestamp: number; energy: number; duration: number }> = []
    const valleys: Array<{ timestamp: number; energy: number; duration: number }> = []

    segments.forEach((segment) => {
      const energy = segment.energy || 0
      if (energy > overall * 1.5) {
        peaks.push({
          timestamp: segment.startTime,
          energy,
          duration: segment.duration,
        })
      } else if (energy < overall * 0.5) {
        valleys.push({
          timestamp: segment.startTime,
          energy,
          duration: segment.duration,
        })
      }
    })

    // Определение тренда
    let trend: "increasing" | "decreasing" | "stable" | "variable" = "stable"
    if (energyValues.length > 5) {
      const firstHalf = energyValues.slice(0, Math.floor(energyValues.length / 2))
      const secondHalf = energyValues.slice(Math.floor(energyValues.length / 2))

      const firstAvg = firstHalf.reduce((sum, e) => sum + e, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, e) => sum + e, 0) / secondHalf.length

      const difference = secondAvg - firstAvg
      if (Math.abs(difference) > 0.2) {
        trend = difference > 0 ? "increasing" : "decreasing"
      } else {
        // Проверяем вариативность
        const variance = energyValues.reduce((sum, e) => sum + (e - overall) ** 2, 0) / energyValues.length
        trend = variance > 0.1 ? "variable" : "stable"
      }
    }

    return {
      overall,
      peaks,
      valleys,
      trend,
    }
  }

  /**
   * Создание временной шкалы музыки
   */
  private createMusicTimeline(segments: MusicSegment[], totalDuration: number): MusicTimeline {
    const timelineInterval = 5 // секунды
    const timePoints = Math.ceil(totalDuration / timelineInterval)

    const energyTimeline: Array<{ timestamp: number; energy: number }> = []
    const tempoTimeline: Array<{ timestamp: number; tempo: number }> = []
    const volumeTimeline: Array<{ timestamp: number; volume: number }> = []

    for (let i = 0; i < timePoints; i++) {
      const timestamp = i * timelineInterval

      // Находим сегмент для этого времени
      const segment = segments.find((s) => timestamp >= s.startTime && timestamp <= s.endTime)

      energyTimeline.push({
        timestamp,
        energy: segment?.energy || 0,
      })

      if (segment?.tempo) {
        tempoTimeline.push({
          timestamp,
          tempo: segment.tempo,
        })
      }

      volumeTimeline.push({
        timestamp,
        volume: segment?.volume || 0,
      })
    }

    return {
      energyTimeline,
      tempoTimeline,
      volumeTimeline,
    }
  }
}
