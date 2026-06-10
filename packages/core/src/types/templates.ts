import type React from "react"

export interface SplitPoint {
  x: number
  y: number
}

export type AnimationType =
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "zoom-in"
  | "zoom-out"
  | "flip-horizontal"
  | "flip-vertical"
  | "none"

export interface AnimationConfig {
  type: AnimationType
  duration?: number
  delay?: number
  easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "cubic-bezier"
  cubicBezier?: [number, number, number, number]
}

export interface CellConfiguration {
  fitMode?: "contain" | "cover" | "fill"
  alignX?: "left" | "center" | "right"
  alignY?: "top" | "center" | "bottom"
  initialScale?: number
  initialPosition?: { x: number; y: number }
  animation?: {
    enter?: AnimationConfig
    exit?: AnimationConfig
    transition?: AnimationConfig
  }
  title?: {
    show: boolean
    text?: string
    position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
    style?: {
      fontSize?: string
      color?: string
      fontWeight?: string
      opacity?: number
      fontFamily?: string
      transform?: string
      margin?: string
      padding?: string
    }
  }
  background?: {
    color?: string
    gradient?: string
    image?: string
    opacity?: number
  }
  border?: {
    width?: string
    color?: string
    style?: "solid" | "dashed" | "dotted"
    radius?: string
  }
  padding?: string
  margin?: string
}

export interface DividerConfig {
  show?: boolean
  width?: string
  color?: string
  style?: "solid" | "dashed" | "dotted"
  dashArray?: string
  opacity?: number
  shadow?: boolean
  shadowColor?: string
  shadowBlur?: string
}

export interface LayoutConfig {
  gap?: string
  padding?: string
  backgroundColor?: string
  borderRadius?: string
  containerStyle?: React.CSSProperties
  layoutTransition?: {
    duration?: number
    easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  }
}

export interface CellLayout {
  position?: "absolute" | "relative"
  top?: string
  left?: string
  right?: string
  bottom?: string
  width?: string
  height?: string
  flex?: string
  gridColumn?: string
  gridRow?: string
  zIndex?: number
}

export interface MediaTemplateConfig {
  id: string
  split: "vertical" | "horizontal" | "diagonal" | "custom" | "grid"
  resizable?: boolean
  screens: number
  splitPoints?: SplitPoint[]
  splitPosition?: number
  cells?: CellConfiguration[]
  cellLayouts?: CellLayout[]
  dividers?: DividerConfig
  layout?: LayoutConfig
  gridConfig?: {
    columns: number
    rows: number
    columnGap?: string
    rowGap?: string
  }
}

export interface MediaTemplate extends MediaTemplateConfig {
  cellConfig?: CellConfiguration | CellConfiguration[]
  render: () => React.ReactElement
}

export type TemplateAspectRatio = "landscape" | "portrait" | "square"
