"use client";

import { ReactNode, useEffect, useState } from "react";

import { I18nextProvider } from "react-i18next";

import i18n from "./index";

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    // Проверяем, инициализирован ли i18n
    if (i18n.isInitialized) {
      setIsI18nInitialized(true);
    } else {
      // Если не инициализирован, подписываемся на событие initialized
      const handleInitialized = () => {
        setIsI18nInitialized(true);
      };

      i18n.on("initialized", handleInitialized);

      // Очистка подписки при размонтировании
      return () => {
        i18n.off("initialized", handleInitialized);
      };
    }
  }, []);

  // Показываем загрузку, пока i18n не инициализирован
  if (!isI18nInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading translations...</p>
        </div>
      </div>
    );
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
