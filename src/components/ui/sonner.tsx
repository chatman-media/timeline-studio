import { useEffect, useState } from "react";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system", resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  // Устанавливаем флаг монтирования для предотвращения гидрации
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Устанавливаем атрибут data-sonner-theme для глобальной стилизации тостов
  useEffect(() => {
    if (typeof document !== "undefined" && isMounted) {
      const isDark =
        resolvedTheme === "dark" ||
        (resolvedTheme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.setAttribute(
        "data-sonner-theme",
        isDark ? "dark" : "light",
      );
    }
  }, [resolvedTheme, isMounted]);

  // Не рендерим на сервере или до монтирования
  if (!isMounted) {
    return null;
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          // Увеличиваем непрозрачность toast
          background:
            resolvedTheme === "dark"
              ? "hsl(20 14.3% 4.1% / 0.95)"
              : "hsl(0 0% 100% / 0.95)",
          // Добавляем тень для лучшей видимости
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          // Увеличиваем контраст текста
          color:
            resolvedTheme === "dark"
              ? "hsl(60 9.1% 97.8%)"
              : "hsl(20 14.3% 4.1%)",
          // Добавляем более заметную рамку
          border:
            resolvedTheme === "dark"
              ? "1px solid hsl(12 6.5% 20%)"
              : "1px solid hsl(20 5.9% 85%)",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
