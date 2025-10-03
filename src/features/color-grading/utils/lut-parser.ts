/**
 * Парсер для .cube файлов (Adobe Cube LUT format)
 * В реальном приложении это будет реализовано на Rust backend
 */

export interface LUTData {
  title: string
  size: number // 3D LUT size (обычно 17, 33, 65)
  domainMin: [number, number, number]
  domainMax: [number, number, number]
  data: Float32Array // RGB триплеты
}

/**
 * Парсит содержимое .cube файла
 * @param content - содержимое файла
 * @returns распарсенные данные LUT
 */
export function parseCubeFile(content: string): LUTData {
  const lines = content.split("\n").map((line) => line.trim())

  let title = "Untitled LUT"
  let size = 0
  let domainMin: [number, number, number] = [0, 0, 0]
  let domainMax: [number, number, number] = [1, 1, 1]
  const data: number[] = []

  for (const line of lines) {
    // Пропускаем пустые строки и комментарии
    if (!line || line.startsWith("#")) continue

    // Парсим метаданные
    if (line.startsWith("TITLE")) {
      title = line.substring(6).replace(/"/g, "").trim()
    } else if (line.startsWith("LUT_3D_SIZE")) {
      size = Number.parseInt(line.split(" ")[1], 10)
    } else if (line.startsWith("DOMAIN_MIN")) {
      const values = line.split(" ").slice(1).map(Number)
      domainMin = [values[0], values[1], values[2]]
    } else if (line.startsWith("DOMAIN_MAX")) {
      const values = line.split(" ").slice(1).map(Number)
      domainMax = [values[0], values[1], values[2]]
    } else {
      // Парсим данные RGB
      const values = line.split(/\s+/).map(Number)
      if (values.length === 3 && !Number.isNaN(values[0])) {
        data.push(...values)
      }
    }
  }

  // Проверяем корректность данных
  const expectedSize = size * size * size * 3
  if (data.length !== expectedSize) {
    throw new Error(`Invalid LUT data: expected ${expectedSize} values, got ${data.length}`)
  }

  return {
    title,
    size,
    domainMin,
    domainMax,
    data: new Float32Array(data),
  }
}

/**
 * Применяет LUT к цвету
 * @param r - красный канал (0-1)
 * @param g - зеленый канал (0-1)
 * @param b - синий канал (0-1)
 * @param lut - данные LUT
 * @param intensity - интенсивность применения (0-1)
 * @returns новые значения RGB
 */
export function applyLUT(r: number, g: number, b: number, lut: LUTData, intensity = 1): [number, number, number] {
  const { size, data, domainMin, domainMax } = lut

  // Нормализуем входные значения
  const nr = (r - domainMin[0]) / (domainMax[0] - domainMin[0])
  const ng = (g - domainMin[1]) / (domainMax[1] - domainMin[1])
  const nb = (b - domainMin[2]) / (domainMax[2] - domainMin[2])

  // Вычисляем индексы для трилинейной интерполяции
  const ri = nr * (size - 1)
  const gi = ng * (size - 1)
  const bi = nb * (size - 1)

  const r0 = Math.floor(ri)
  const g0 = Math.floor(gi)
  const b0 = Math.floor(bi)

  const r1 = Math.min(r0 + 1, size - 1)
  const g1 = Math.min(g0 + 1, size - 1)
  const b1 = Math.min(b0 + 1, size - 1)

  const rf = ri - r0
  const gf = gi - g0
  const bf = bi - b0

  // Трилинейная интерполяция
  const getIndex = (r: number, g: number, b: number) => (b * size * size + g * size + r) * 3

  // Получаем 8 соседних точек
  const c000 = getIndex(r0, g0, b0)
  const c001 = getIndex(r0, g0, b1)
  const c010 = getIndex(r0, g1, b0)
  const c011 = getIndex(r0, g1, b1)
  const c100 = getIndex(r1, g0, b0)
  const c101 = getIndex(r1, g0, b1)
  const c110 = getIndex(r1, g1, b0)
  const c111 = getIndex(r1, g1, b1)

  // Интерполируем для каждого канала
  const channels = [0, 1, 2].map((ch) => {
    const v000 = data[c000 + ch]
    const v001 = data[c001 + ch]
    const v010 = data[c010 + ch]
    const v011 = data[c011 + ch]
    const v100 = data[c100 + ch]
    const v101 = data[c101 + ch]
    const v110 = data[c110 + ch]
    const v111 = data[c111 + ch]

    // Трилинейная интерполяция
    const v00 = v000 * (1 - rf) + v100 * rf
    const v01 = v001 * (1 - rf) + v101 * rf
    const v10 = v010 * (1 - rf) + v110 * rf
    const v11 = v011 * (1 - rf) + v111 * rf

    const v0 = v00 * (1 - gf) + v10 * gf
    const v1 = v01 * (1 - gf) + v11 * gf

    return v0 * (1 - bf) + v1 * bf
  })

  // Применяем интенсивность
  const newR = r + (channels[0] - r) * intensity
  const newG = g + (channels[1] - g) * intensity
  const newB = b + (channels[2] - b) * intensity

  return [Math.max(0, Math.min(1, newR)), Math.max(0, Math.min(1, newG)), Math.max(0, Math.min(1, newB))]
}

/**
 * Создает пустой LUT (идентичное преобразование)
 * @param size - размер LUT
 * @returns данные LUT
 */
export function createIdentityLUT(size = 33): LUTData {
  const data = new Float32Array(size * size * size * 3)
  let index = 0

  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        data[index++] = r / (size - 1)
        data[index++] = g / (size - 1)
        data[index++] = b / (size - 1)
      }
    }
  }

  return {
    title: "Identity",
    size,
    domainMin: [0, 0, 0],
    domainMax: [1, 1, 1],
    data,
  }
}

// Предустановленные LUT эффекты (упрощенные версии)
export const PRESET_LUT_EFFECTS = {
  "orange-teal": (r: number, g: number, b: number): [number, number, number] => {
    // Сдвиг теней в синий, света в оранжевый
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    const tealShift = (1 - luminance) * 0.2
    const orangeShift = luminance * 0.2

    return [r + orangeShift - tealShift * 0.5, g - tealShift * 0.2, b + tealShift - orangeShift]
  },

  "vintage-fade": (r: number, g: number, b: number): [number, number, number] => {
    // Подъем теней и снижение контраста
    const lifted = (val: number) => 0.1 + val * 0.85
    const faded = (val: number) => val ** 0.8

    return [faded(lifted(r)) * 1.1, faded(lifted(g)), faded(lifted(b)) * 0.9]
  },

  "bw-contrast": (r: number, g: number, b: number): [number, number, number] => {
    // Черно-белое с высоким контрастом
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    const contrasted = gray ** 1.5

    return [contrasted, contrasted, contrasted]
  },
}
