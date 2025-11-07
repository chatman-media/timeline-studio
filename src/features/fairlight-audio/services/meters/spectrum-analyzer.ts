/**
 * Spectrum Analyzer Service
 * Реализует анализ частотного спектра в реальном времени
 */

import { EventEmitter } from "events"

export interface SpectrumConfig {
  sampleRate: number
  fftSize: number // 256, 512, 1024, 2048, 4096, 8192, 16384, 32768
  smoothingTimeConstant: number // 0.0 - 1.0
  minDecibels: number // Нижний порог dB
  maxDecibels: number // Верхний порог dB
  updateInterval: number // ms
  enablePeakHold: boolean
  peakHoldTime: number // ms
}

export interface SpectrumData {
  frequencies: Float32Array // Частотные значения (Hz)
  magnitudes: Float32Array // Амплитуды (dB)
  peaks: Float32Array // Пиковые значения (dB)
  binCount: number
  nyquistFrequency: number
  resolution: number // Hz per bin
}

export interface FrequencyBand {
  name: string
  minFreq: number
  maxFreq: number
  color: string
}

export class SpectrumAnalyzer extends EventEmitter {
  private config: SpectrumConfig
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private splitter: ChannelSplitterNode | null = null
  private merger: ChannelMergerNode | null = null

  // Буферы для анализа
  private frequencyData: Uint8Array
  private frequencyDataFloat: Float32Array
  private peakData: Float32Array
  private peakHoldTimes: Float32Array

  // Частотная информация
  private frequencies: Float32Array
  private binCount: number
  private nyquistFrequency: number
  private resolution: number

  // Состояние
  private isRunning = false
  private lastUpdate = 0
  private animationFrame: number | null = null

  // Стандартные частотные полосы
  private readonly FREQUENCY_BANDS: FrequencyBand[] = [
    { name: "Sub Bass", minFreq: 20, maxFreq: 60, color: "#8B0000" },
    { name: "Bass", minFreq: 60, maxFreq: 250, color: "#FF4500" },
    { name: "Low Mid", minFreq: 250, maxFreq: 500, color: "#FFD700" },
    { name: "Mid", minFreq: 500, maxFreq: 2000, color: "#32CD32" },
    { name: "High Mid", minFreq: 2000, maxFreq: 4000, color: "#00CED1" },
    { name: "Presence", minFreq: 4000, maxFreq: 6000, color: "#4169E1" },
    { name: "Brilliance", minFreq: 6000, maxFreq: 20000, color: "#8A2BE2" },
  ]

  constructor(config: SpectrumConfig) {
    super()
    this.config = config

    this.binCount = config.fftSize / 2
    this.nyquistFrequency = config.sampleRate / 2
    this.resolution = this.nyquistFrequency / this.binCount

    // Инициализируем буферы
    this.frequencyData = new Uint8Array(this.binCount) as Uint8Array<ArrayBuffer>
    this.frequencyDataFloat = new Float32Array(this.binCount) as Float32Array<ArrayBuffer>
    this.peakData = new Float32Array(this.binCount) as Float32Array<ArrayBuffer>
    this.peakHoldTimes = new Float32Array(this.binCount) as Float32Array<ArrayBuffer>

    // Создаём массив частот
    this.frequencies = new Float32Array(this.binCount) as Float32Array<ArrayBuffer>
    for (let i = 0; i < this.binCount; i++) {
      this.frequencies[i] = i * this.resolution
    }

    this.peakData.fill(config.minDecibels)
    this.peakHoldTimes.fill(0)
  }

  async initialize(context: AudioContext): Promise<void> {
    this.context = context

    // Создаём analyser с настройками
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = this.config.fftSize
    this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant
    this.analyser.minDecibels = this.config.minDecibels
    this.analyser.maxDecibels = this.config.maxDecibels

    // Создаём splitter и merger для многоканального анализа
    this.splitter = context.createChannelSplitter(2)
    this.merger = context.createChannelMerger(2)

    // Подключаем: input -> splitter -> analyser -> merger -> output
    this.splitter.connect(this.analyser)
    this.splitter.connect(this.merger, 0, 0) // L
    this.splitter.connect(this.merger, 1, 1) // R
  }

  private updateSpectrum(): void {
    if (!this.analyser || !this.isRunning) return

    const now = performance.now()
    if (now - this.lastUpdate < this.config.updateInterval) {
      this.scheduleNextUpdate()
      return
    }

    this.lastUpdate = now

    // Получаем данные частотного анализа
    this.analyser.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>)
    this.analyser.getFloatFrequencyData(this.frequencyDataFloat as Float32Array<ArrayBuffer>)

    // Обновляем пики
    if (this.config.enablePeakHold) {
      this.updatePeaks(now)
    }

    // Создаём данные для отправки
    const spectrumData: SpectrumData = {
      frequencies: this.frequencies,
      magnitudes: this.frequencyDataFloat.slice(), // Копия
      peaks: this.config.enablePeakHold ? this.peakData.slice() : new Float32Array(0),
      binCount: this.binCount,
      nyquistFrequency: this.nyquistFrequency,
      resolution: this.resolution,
    }

    this.emit("spectrum", spectrumData)
    this.scheduleNextUpdate()
  }

  private updatePeaks(currentTime: number): void {
    for (let i = 0; i < this.binCount; i++) {
      const currentMagnitude = this.frequencyDataFloat[i]

      // Обновляем пик если текущее значение больше
      if (currentMagnitude > this.peakData[i]) {
        this.peakData[i] = currentMagnitude
        this.peakHoldTimes[i] = currentTime
      } else {
        // Проверяем время удержания пика
        const holdTime = currentTime - this.peakHoldTimes[i]
        if (holdTime > this.config.peakHoldTime) {
          // Медленное затухание пика
          const decayRate = 0.95 // Можно настроить
          this.peakData[i] = Math.max(this.peakData[i] * decayRate, this.config.minDecibels)
        }
      }
    }
  }

  private scheduleNextUpdate(): void {
    if (this.isRunning) {
      this.animationFrame = requestAnimationFrame(() => this.updateSpectrum())
    }
  }

  // Анализ частотных полос
  getBandMagnitude(minFreq: number, maxFreq: number): number {
    const startBin = Math.floor(minFreq / this.resolution)
    const endBin = Math.ceil(maxFreq / this.resolution)

    let sum = 0
    let count = 0

    for (let i = Math.max(0, startBin); i < Math.min(this.binCount, endBin); i++) {
      // Конвертируем из dB в линейное значение для усреднения
      const linear = 10 ** (this.frequencyDataFloat[i] / 20)
      sum += linear
      count++
    }

    if (count === 0) return this.config.minDecibels

    // Конвертируем обратно в dB
    const avgLinear = sum / count
    return 20 * Math.log10(avgLinear)
  }

  getBandAnalysis(): { name: string; magnitude: number; color: string }[] {
    return this.FREQUENCY_BANDS.map((band) => ({
      name: band.name,
      magnitude: this.getBandMagnitude(band.minFreq, band.maxFreq),
      color: band.color,
    }))
  }

  // Поиск доминирующих частот
  findPeaks(threshold = -40, minDistance = 5): { frequency: number; magnitude: number }[] {
    const peaks: { frequency: number; magnitude: number }[] = []

    for (let i = minDistance; i < this.binCount - minDistance; i++) {
      const magnitude = this.frequencyDataFloat[i]

      if (magnitude > threshold) {
        // Проверяем, является ли это локальным максимумом
        let isPeak = true
        for (let j = i - minDistance; j <= i + minDistance; j++) {
          if (j !== i && this.frequencyDataFloat[j] >= magnitude) {
            isPeak = false
            break
          }
        }

        if (isPeak) {
          peaks.push({
            frequency: this.frequencies[i],
            magnitude,
          })
        }
      }
    }

    // Сортируем по убыванию амплитуды
    return peaks.sort((a, b) => b.magnitude - a.magnitude)
  }

  // Анализ тональности
  analyzeTone(): {
    brightness: number // Соотношение высоких к низким частотам
    warmth: number // Соотношение низких к средним частотам
    clarity: number // Энергия в области 2-6kHz
    presence: number // Энергия в области 4-8kHz
  } {
    const subBass = this.getBandMagnitude(20, 60)
    const bass = this.getBandMagnitude(60, 250)
    const lowMid = this.getBandMagnitude(250, 1000)
    const midHigh = this.getBandMagnitude(1000, 4000)
    const high = this.getBandMagnitude(4000, 8000)
    const veryHigh = this.getBandMagnitude(8000, 20000)

    // Конвертируем dB в линейные значения для расчётов
    const toLinear = (db: number) => 10 ** (db / 20)

    const subBassLin = toLinear(subBass)
    const bassLin = toLinear(bass)
    const lowMidLin = toLinear(lowMid)
    const midHighLin = toLinear(midHigh)
    const highLin = toLinear(high)
    const veryHighLin = toLinear(veryHigh)

    const lowSum = subBassLin + bassLin
    const midSum = lowMidLin + midHighLin
    const highSum = highLin + veryHighLin

    const brightness = highSum / (lowSum + 0.001) // Избегаем деления на ноль
    const warmth = lowSum / (midSum + 0.001)
    const clarity = toLinear(this.getBandMagnitude(2000, 6000))
    const presence = toLinear(this.getBandMagnitude(4000, 8000))

    return { brightness, warmth, clarity, presence }
  }

  // Обнаружение клиппинга
  detectClipping(): boolean {
    // Ищем очень высокие уровни в высокочастотной области
    const highFreqMagnitude = this.getBandMagnitude(10000, 20000)
    return highFreqMagnitude > -6 // dB
  }

  // Public API
  start(): void {
    if (!this.analyser) {
      throw new Error("Spectrum analyzer not initialized")
    }

    this.isRunning = true
    this.lastUpdate = performance.now()
    this.scheduleNextUpdate()
    this.emit("started")
  }

  stop(): void {
    this.isRunning = false

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    this.emit("stopped")
  }

  reset(): void {
    this.peakData.fill(this.config.minDecibels)
    this.peakHoldTimes.fill(0)
    this.emit("reset")
  }

  // Настройки
  updateConfig(updates: Partial<SpectrumConfig>): void {
    Object.assign(this.config, updates)

    if (this.analyser) {
      if (updates.smoothingTimeConstant !== undefined) {
        this.analyser.smoothingTimeConstant = updates.smoothingTimeConstant
      }
      if (updates.minDecibels !== undefined) {
        this.analyser.minDecibels = updates.minDecibels
      }
      if (updates.maxDecibels !== undefined) {
        this.analyser.maxDecibels = updates.maxDecibels
      }
    }
  }

  getConfig(): SpectrumConfig {
    return { ...this.config }
  }

  getFrequencyBands(): FrequencyBand[] {
    return [...this.FREQUENCY_BANDS]
  }

  getInputNode(): AudioNode | null {
    return this.splitter
  }

  getOutputNode(): AudioNode | null {
    return this.merger
  }

  getCurrentSpectrum(): SpectrumData {
    if (!this.analyser) {
      return {
        frequencies: new Float32Array(0),
        magnitudes: new Float32Array(0),
        peaks: new Float32Array(0),
        binCount: 0,
        nyquistFrequency: 0,
        resolution: 0,
      }
    }

    this.analyser.getFloatFrequencyData(this.frequencyDataFloat as Float32Array<ArrayBuffer>)

    return {
      frequencies: this.frequencies,
      magnitudes: this.frequencyDataFloat.slice() as Float32Array<ArrayBuffer>,
      peaks: this.config.enablePeakHold
        ? (this.peakData.slice() as Float32Array<ArrayBuffer>)
        : (new Float32Array(0) as Float32Array<ArrayBuffer>),
      binCount: this.binCount,
      nyquistFrequency: this.nyquistFrequency,
      resolution: this.resolution,
    }
  }

  dispose(): void {
    this.stop()

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.splitter) {
      this.splitter.disconnect()
      this.splitter = null
    }

    if (this.merger) {
      this.merger.disconnect()
      this.merger = null
    }

    this.removeAllListeners()
  }
}
