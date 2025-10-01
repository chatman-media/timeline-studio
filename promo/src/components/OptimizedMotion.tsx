import { type MotionProps, motion } from "framer-motion"
import type React from "react"
import { forwardRef } from "react"
import { useReducedMotion } from "../hooks/useReducedMotion"

interface OptimizedMotionProps extends MotionProps {
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
}

// Оптимизированные компоненты motion с поддержкой reduced motion
export const OptimizedMotion = forwardRef<HTMLDivElement, OptimizedMotionProps>(
  ({ children, initial, animate, transition, as = "div", ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    const Component = motion[as] as any

    if (prefersReducedMotion) {
      // Для пользователей с reduced motion - мгновенные переходы
      return (
        <Component ref={ref} initial={false} animate={animate} transition={{ duration: 0 }} {...props}>
          {children}
        </Component>
      )
    }

    return (
      <Component ref={ref} initial={initial} animate={animate} transition={transition} {...props}>
        {children}
      </Component>
    )
  },
)

OptimizedMotion.displayName = "OptimizedMotion"

// Предустановленные варианты анимаций для переиспользования
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3 },
}
