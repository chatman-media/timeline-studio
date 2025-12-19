import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { AnimationConfig } from "../lib/template-config"

interface AnimatedCellProps {
  children: React.ReactNode
  animation?: {
    enter?: AnimationConfig
    exit?: AnimationConfig
    transition?: AnimationConfig
  }
  isVisible?: boolean
  isTransitioning?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * Компонент для анимированных ячеек шаблонов
 * Поддерживает различные типы анимаций: fade, slide, zoom, flip
 */
export function AnimatedCell({
  children,
  animation,
  isVisible = true,
  isTransitioning = false,
  className,
  style,
}: AnimatedCellProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Монтируем с небольшой задержкой для триггера enter анимации
    const timer = setTimeout(() => setIsMounted(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isTransitioning) {
      setIsAnimating(true)
      const config = animation?.transition
      if (config?.duration) {
        const timer = setTimeout(() => setIsAnimating(false), config.duration)
        return () => clearTimeout(timer)
      }
    }
  }, [isTransitioning, animation?.transition])

  // Выбираем конфигурацию анимации в зависимости от состояния
  const getAnimationConfig = (): AnimationConfig | undefined => {
    if (isTransitioning && animation?.transition) return animation.transition
    if (!isVisible && animation?.exit) return animation.exit
    if (isVisible && !isMounted && animation?.enter) return animation.enter
    return animation?.enter
  }

  const config = getAnimationConfig()

  // Генерируем CSS для анимации
  const getAnimationStyles = (): React.CSSProperties => {
    if (!config) return {}

    const duration = config.duration || 300
    const delay = config.delay || 0
    const easing = config.easing || "ease-in-out"
    const cubicBezier = config.cubicBezier ? `cubic-bezier(${config.cubicBezier.join(", ")})` : undefined

    const timingFunction = easing === "cubic-bezier" && cubicBezier ? cubicBezier : easing

    // Базовые стили перехода
    const baseStyles: React.CSSProperties = {
      transition: `all ${duration}ms ${timingFunction} ${delay}ms`,
    }

    // Начальное состояние (before animation)
    if (!isMounted || (isTransitioning && isAnimating)) {
      switch (config.type) {
        case "fade":
          return { ...baseStyles, opacity: 0 }

        case "slide-left":
          return { ...baseStyles, transform: "translateX(-100%)", opacity: 0 }

        case "slide-right":
          return { ...baseStyles, transform: "translateX(100%)", opacity: 0 }

        case "slide-up":
          return { ...baseStyles, transform: "translateY(100%)", opacity: 0 }

        case "slide-down":
          return { ...baseStyles, transform: "translateY(-100%)", opacity: 0 }

        case "zoom-in":
          return { ...baseStyles, transform: "scale(0.5)", opacity: 0 }

        case "zoom-out":
          return { ...baseStyles, transform: "scale(1.5)", opacity: 0 }

        case "flip-horizontal":
          return { ...baseStyles, transform: "rotateY(90deg)", opacity: 0 }

        case "flip-vertical":
          return { ...baseStyles, transform: "rotateX(90deg)", opacity: 0 }

        case "none":
          return {}

        default:
          return baseStyles
      }
    }

    // Конечное состояние (after animation)
    return {
      ...baseStyles,
      transform: "translate(0, 0) scale(1) rotate(0)",
      opacity: isVisible ? 1 : 0,
    }
  }

  const animationStyles = getAnimationStyles()

  return (
    <div className={cn("h-full w-full", className)} style={{ ...style, ...animationStyles }} data-oid="i:c2kzr">
      {children}
    </div>
  )
}
