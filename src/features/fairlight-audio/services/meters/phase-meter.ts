/**
 * Phase Correlation Meter Service
 * Анализирует фазовые соотношения в стерео сигнале
 */

import { EventEmitter } from "events"

export interface PhaseConfig {
  sampleRate: number
  updateInterval: number // ms
  bufferSize: number // Размер буфера для анализа
  enableStereoField: boolean // Включить анализ стерео поля
  enableGoniometer: boolean // Включить goniometer данные
}

export interface PhaseData {
  correlation: number // -1 to +1 (correlation coefficient)
  width: number // 0 to 2 (stereo width)
  balance: number // -1 to +1 (L/R balance)
  monoCompatibility: number // 0 to 1 (mono compatibility rating)
  phaseIssues: boolean // Есть ли фазовые проблемы
}

export interface GoniometerData {
  leftSamples: Float32Array
  rightSamples: Float32Array
  midSamples: Float32Array // (L+R)/2
  sideSamples: Float32Array // (L-R)/2
  vectorscope: { x: number; y: number }[] // Координаты векторскопа
}

export interface StereoFieldData {
  leftLevel: number // RMS уровень левого канала
  rightLevel: number // RMS уровень правого канала
  midLevel: number // RMS уровень mid сигнала
  sideLevel: number // RMS уровень side сигнала
  stereoSpread: number // Распределение стерео образа
}

export class PhaseMeter extends EventEmitter {
  private config: PhaseConfig
  private context: AudioContext | null = null
  private processor: AudioWorkletNode | null = null
  private analyser: AnalyserNode | null = null

  // Буферы для анализа
  private leftBuffer: Float32Array
  private rightBuffer: Float32Array
  private correlationHistory: number[] = []
  private widthHistory: number[] = []
  private currentWidth = 0

  // Состояние измерений
  private isRunning = false
  private lastUpdate = 0
  private currentCorrelation = 0
  private currentBalance = 0

  // Goniometer данные
  private goniometerBuffer: { x: number; y: number }[] = []
  private readonly GONIOMETER_POINTS = 200

  // Константы для анализа
  private readonly CORRELATION_DANGER_THRESHOLD = -0.3
  private readonly MONO_COMPATIBILITY_THRESHOLD = 0.7

  constructor(config: PhaseConfig) {
    super()
    this.config = config

    this.leftBuffer = new Float32Array(config.bufferSize)
    this.rightBuffer = new Float32Array(config.bufferSize)

    // Инициализируем буфер goniometer
    for (let i = 0; i < this.GONIOMETER_POINTS; i++) {
      this.goniometerBuffer.push({ x: 0, y: 0 })
    }
  }

  async initialize(context: AudioContext): Promise<void> {
    this.context = context
    // Always use AudioWorklet - it's supported in all modern browsers
    await this.initializeWithWorklet(context)
  }

  private async initializeWithWorklet(context: AudioContext): Promise<void> {
    if (!context.audioWorklet) {
      throw new Error("AudioWorklet is not supported in this browser")
    }

    try {
      await context.audioWorklet.addModule(
        "/src/features/fairlight-audio/services/meters/worklets/phase-analyzer-worklet.js",
      )
    } catch (error) {
      // Module might already be loaded, continue
    }

    this.processor = new AudioWorkletNode(context, "phase-analyzer", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: "explicit",
      channelInterpretation: "speakers",
    })

    this.processor.port.onmessage = this.handleWorkletMessage.bind(this)
  }

  // Removed deprecated ScriptProcessor fallback

  private handleWorkletMessage(event: MessageEvent): void {
    const { type, correlation, leftBuffer, rightBuffer } = event.data

    if (type === "phase-data") {
      this.updatePhaseAnalysis(correlation, leftBuffer, rightBuffer)
    }
  }

  private updatePhaseAnalysis(correlation: number, left: Float32Array, right: Float32Array): void {
    if (!this.isRunning) return

    const now = performance.now()
    if (now - this.lastUpdate < this.config.updateInterval) return

    this.lastUpdate = now
    this.currentCorrelation = correlation

    // Добавляем в историю для сглаживания
    this.correlationHistory.push(correlation)
    if (this.correlationHistory.length > 10) {
      this.correlationHistory.shift()
    }

    // Вычисляем дополнительные метрики
    const width = this.calculateStereoWidth(left, right)
    const balance = this.calculateBalance(left, right)
    const monoCompatibility = this.calculateMonoCompatibility(left, right)

    this.widthHistory.push(width)
    if (this.widthHistory.length > 10) {
      this.widthHistory.shift()
    }

    this.currentWidth = width
    this.currentBalance = balance

    // Обновляем goniometer данные
    if (this.config.enableGoniometer) {
      this.updateGoniometer(left, right)
    }

    // Определяем фазовые проблемы
    const phaseIssues = this.detectPhaseIssues(correlation, monoCompatibility)

    const phaseData: PhaseData = {
      correlation: this.getSmoothedCorrelation(),
      width: this.getSmoothedWidth(),
      balance,
      monoCompatibility,
      phaseIssues,
    }

    this.emit("phase", phaseData)

    // Отправляем дополнительные данные если включены
    if (this.config.enableStereoField) {
      const stereoField = this.calculateStereoField(left, right)
      this.emit("stereoField", stereoField)
    }

    if (this.config.enableGoniometer) {
      const goniometer = this.getGoniometerData(left, right)
      this.emit("goniometer", goniometer)
    }
  }

  private calculateStereoWidth(left: Float32Array, right: Float32Array): number {
    // Вычисляем ширину стерео образа на основе разности каналов
    let sumDiff = 0
    let sumSum = 0

    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      const mid = (left[i] + right[i]) / 2
      const side = (left[i] - right[i]) / 2

      sumSum += mid * mid
      sumDiff += side * side
    }

    const midRMS = Math.sqrt(sumSum / left.length)
    const sideRMS = Math.sqrt(sumDiff / left.length)

    // Ширина = отношение side к mid
    return midRMS > 0 ? Math.min(2, sideRMS / midRMS) : 0
  }

  private calculateBalance(left: Float32Array, right: Float32Array): number {
    let leftRMS = 0
    let rightRMS = 0

    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      leftRMS += left[i] * left[i]
      rightRMS += right[i] * right[i]
    }

    leftRMS = Math.sqrt(leftRMS / left.length)
    rightRMS = Math.sqrt(rightRMS / right.length)

    const total = leftRMS + rightRMS
    return total > 0 ? (rightRMS - leftRMS) / total : 0
  }

  private calculateMonoCompatibility(left: Float32Array, right: Float32Array): number {
    // Анализируем насколько хорошо сигнал будет звучать в моно
    let monoSum = 0
    let stereoSum = 0

    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      const mono = (left[i] + right[i]) / 2
      const stereo = Math.abs(left[i] - right[i])

      monoSum += mono * mono
      stereoSum += stereo * stereo
    }

    const monoRMS = Math.sqrt(monoSum / left.length)
    const stereoRMS = Math.sqrt(stereoSum / left.length)

    const total = monoRMS + stereoRMS
    return total > 0 ? monoRMS / total : 1
  }

  private updateGoniometer(left: Float32Array, right: Float32Array): void {
    // Обновляем данные для отображения vectorscope/goniometer
    const step = Math.max(1, Math.floor(left.length / this.GONIOMETER_POINTS))

    for (let i = 0; i < this.GONIOMETER_POINTS && i * step < left.length; i++) {
      const idx = i * step
      this.goniometerBuffer[i] = {
        x: left[idx], // L-R (horizontal)
        y: right[idx], // L+R (vertical)
      }
    }
  }

  private calculateStereoField(left: Float32Array, right: Float32Array): StereoFieldData {
    let leftSum = 0
    let rightSum = 0
    let midSum = 0
    let sideSum = 0

    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      const l = left[i]
      const r = right[i]
      const mid = (l + r) / 2
      const side = (l - r) / 2

      leftSum += l * l
      rightSum += r * r
      midSum += mid * mid
      sideSum += side * side
    }

    const length = left.length
    const leftLevel = Math.sqrt(leftSum / length)
    const rightLevel = Math.sqrt(rightSum / length)
    const midLevel = Math.sqrt(midSum / length)
    const sideLevel = Math.sqrt(sideSum / length)

    const stereoSpread = midLevel > 0 ? sideLevel / midLevel : 0

    return {
      leftLevel,
      rightLevel,
      midLevel,
      sideLevel,
      stereoSpread,
    }
  }

  private getGoniometerData(left: Float32Array, right: Float32Array): GoniometerData {
    const midSamples = new Float32Array(left.length)
    const sideSamples = new Float32Array(left.length)

    for (let i = 0; i < left.length; i++) {
      midSamples[i] = (left[i] + right[i]) / 2
      sideSamples[i] = (left[i] - right[i]) / 2
    }

    return {
      leftSamples: left.slice(),
      rightSamples: right.slice(),
      midSamples,
      sideSamples,
      vectorscope: [...this.goniometerBuffer],
    }
  }

  private detectPhaseIssues(correlation: number, monoCompatibility: number): boolean {
    return correlation < this.CORRELATION_DANGER_THRESHOLD || monoCompatibility < this.MONO_COMPATIBILITY_THRESHOLD
  }

  private getSmoothedCorrelation(): number {
    if (this.correlationHistory.length === 0) return 0

    const sum = this.correlationHistory.reduce((a, b) => a + b, 0)
    return sum / this.correlationHistory.length
  }

  private getSmoothedWidth(): number {
    if (this.widthHistory.length === 0) return 1

    const sum = this.widthHistory.reduce((a, b) => a + b, 0)
    return sum / this.widthHistory.length
  }

  // Public API
  start(): void {
    if (!this.processor) {
      throw new Error("Phase meter not initialized")
    }

    this.isRunning = true
    this.lastUpdate = performance.now()
    this.emit("started")
  }

  stop(): void {
    this.isRunning = false
    this.emit("stopped")
  }

  reset(): void {
    this.correlationHistory = []
    this.widthHistory = []
    this.currentCorrelation = 0
    this.currentWidth = 1
    this.currentBalance = 0

    for (let i = 0; i < this.goniometerBuffer.length; i++) {
      this.goniometerBuffer[i] = { x: 0, y: 0 }
    }

    this.emit("reset")
  }

  getCurrentPhase(): PhaseData {
    return {
      correlation: this.getSmoothedCorrelation(),
      width: this.getSmoothedWidth(),
      balance: this.currentBalance,
      monoCompatibility: this.calculateMonoCompatibility(this.leftBuffer, this.rightBuffer),
      phaseIssues: this.detectPhaseIssues(this.currentCorrelation, 0.7),
    }
  }

  getInputNode(): AudioNode | null {
    return this.processor
  }

  getOutputNode(): AudioNode | null {
    return this.processor
  }

  updateConfig(updates: Partial<PhaseConfig>): void {
    Object.assign(this.config, updates)
  }

  getConfig(): PhaseConfig {
    return { ...this.config }
  }

  dispose(): void {
    this.stop()

    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    this.removeAllListeners()
  }
}
