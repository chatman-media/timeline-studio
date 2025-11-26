/**
 * Timeline Transition Component
 * Визуализация переходов между клипами на таймлайне
 */

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { TimelineTransition } from "../../types";

interface TimelineTransitionProps {
  leftClipId: string;
  rightClipId: string;
  leftClipEnd: number; // В секундах
  rightClipStart: number; // В секундах
  transition: TimelineTransition;
  timeScale: number; // Пикселей на секунду
  trackHeight: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (updates: Partial<TimelineTransition>) => void;
  onDelete?: () => void;
}

export const TimelineTransitionComponent = memo(
  function TimelineTransitionComponent({
    // leftClipId,
    // rightClipId,
    leftClipEnd,
    rightClipStart,
    transition,
    timeScale,
    trackHeight,
    isSelected = false,
    onSelect,
    // onUpdate,
    onDelete,
  }: TimelineTransitionProps) {
    // Вычисляем позицию и размер перехода
    const { left, width } = useMemo(() => {
      // Переход начинается за duration/2 до конца левого клипа
      // и заканчивается через duration/2 после начала правого клипа
      const startTime = leftClipEnd - transition.duration / 2;
      const endTime = rightClipStart + transition.duration / 2;

      return {
        left: startTime * timeScale,
        width: (endTime - startTime) * timeScale,
      };
    }, [leftClipEnd, rightClipStart, transition.duration, timeScale]);

    // Рендерим визуализацию перехода
    const renderTransitionVisual = () => {
      switch (transition.transitionId) {
        case "dissolve":
        case "fade":
          return (
            <svg className="absolute inset-0" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`fade-${transition.id}`}>
                  <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                  <stop
                    offset="50%"
                    stopColor="currentColor"
                    stopOpacity="0.5"
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="1"
                  />
                </linearGradient>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill={`url(#fade-${transition.id})`}
              />
            </svg>
          );

        case "wipe":
        case "slide":
          return (
            <svg className="absolute inset-0" preserveAspectRatio="none">
              <defs>
                <pattern
                  id={`diag-${transition.id}`}
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    x="0"
                    y="0"
                    width="10"
                    height="10"
                    fill="currentColor"
                    opacity="0.3"
                  />
                  <path
                    d="M0,10 L10,0"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                </pattern>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill={`url(#diag-${transition.id})`}
              />
            </svg>
          );

        default:
          return (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xs font-medium opacity-50">T</div>
            </div>
          );
      }
    };

    return (
      <div
        className={cn(
          "absolute group cursor-pointer",
          "transition-all duration-200",
          isSelected && "z-20",
          !isSelected && "z-10",
        )}
        style={{
          left: `${left}px`,
          width: `${width}px`,
          height: `${trackHeight}px`,
          top: 0,
        }}
        onClick={onSelect}
      >
        {/* Фон перехода */}
        <div
          className={cn(
            "absolute inset-0 rounded",
            "bg-linear-to-r from-primary/20 via-primary/40 to-primary/20",
            "border-2",
            isSelected
              ? "border-primary shadow-lg"
              : "border-primary/50 hover:border-primary",
            "transition-all duration-200",
          )}
        >
          {renderTransitionVisual()}
        </div>

        {/* Индикатор длительности */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-primary-foreground bg-primary/80 px-1 rounded">
          {transition.duration.toFixed(1)}s
        </div>

        {/* Контролы при наведении */}
        {(isSelected || onDelete) && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="w-4 h-4 bg-destructive text-destructive-foreground rounded flex items-center justify-center hover:bg-destructive/80"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
        )}

        {/* Ручки для изменения длительности */}
        {isSelected && (
          <>
            <div
              className="absolute top-0 bottom-0 left-0 w-2 bg-primary cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => {
                e.stopPropagation();
                // TODO: Implement duration adjustment
              }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 w-2 bg-primary cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => {
                e.stopPropagation();
                // TODO: Implement duration adjustment
              }}
            />
          </>
        )}
      </div>
    );
  },
);
