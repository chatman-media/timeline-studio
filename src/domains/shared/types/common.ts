/**
 * Common Types
 *
 * Общие типы для размеров, позиций и временных диапазонов
 */

export interface Size {
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
}

export interface TimeRange {
  start: number
  end: number
  duration?: number
}

export interface Rectangle extends Position, Size {}
