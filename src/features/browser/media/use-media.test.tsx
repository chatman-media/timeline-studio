import * as React from "react";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MediaProvider } from "./media-provider";
import { useMedia } from "./use-media";

// Мокаем useMachine из @xstate/react
const mockSend = vi.fn();
const mockState = {
  context: {
    allMediaFiles: [],
    error: null,
    isLoading: false,
    favorites: {
      media: [],
      audio: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
    },
  },
};

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}));

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

describe("useMedia", () => {
  it("should throw error when used outside of MediaProvider", () => {
    // Мокаем console.error, чтобы подавить ошибки в консоли
    const consoleErrorSpy = vi.spyOn(console, "error");
    consoleErrorSpy.mockImplementation(() => {});

    // Проверяем, что хук выбрасывает ошибку вне провайдера
    expect(() => {
      renderHook(() => useMedia());
    }).toThrow("useMedia must be used within a MediaProvider");

    // Восстанавливаем console.error
    consoleErrorSpy.mockRestore();
  });

  it("should return media context when used within MediaProvider", () => {
    // Оборачиваем хук в MediaProvider
    const { result } = renderHook(() => useMedia(), {
      wrapper: ({ children }) => <MediaProvider>{children}</MediaProvider>,
    });

    // Проверяем, что хук возвращает контекст
    expect(result.current).toBeDefined();
    expect(result.current.allMediaFiles).toEqual([]);
    expect(result.current.includedFiles).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.includeFiles).toBeInstanceOf(Function);
    expect(result.current.removeFile).toBeInstanceOf(Function);
    expect(result.current.clearFiles).toBeInstanceOf(Function);
    expect(result.current.isFileAdded).toBeInstanceOf(Function);
    expect(result.current.areAllFilesAdded).toBeInstanceOf(Function);
    expect(result.current.reload).toBeInstanceOf(Function);
    expect(result.current.addToFavorites).toBeInstanceOf(Function);
    expect(result.current.removeFromFavorites).toBeInstanceOf(Function);
    expect(result.current.clearFavorites).toBeInstanceOf(Function);
    expect(result.current.isItemFavorite).toBeInstanceOf(Function);
  });
});
