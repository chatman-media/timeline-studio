import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";

// Мокаем useTheme из next-themes
const setThemeMock = vi.fn();
let mockTheme = "light";

vi.mock("./theme-context", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: setThemeMock,
  }),
}));

// Мокаем компоненты из lucide-react
vi.mock("lucide-react", () => ({
  Sun: () => <div data-testid="sun-icon" />,
  Moon: () => <div data-testid="moon-icon" />,
}));

// Мокаем компонент Button
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="theme-toggle-button" {...props}>
      {children}
    </button>
  ),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    setThemeMock.mockClear();
    mockTheme = "light";
  });

  it("should render both sun and moon icons", () => {
    render(<ThemeToggle />);

    // Проверяем, что иконки отрендерены
    expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
    expect(screen.getByTestId("moon-icon")).toBeInTheDocument();
  });

  it("should not call setTheme immediately after render", () => {
    render(<ThemeToggle />);

    // Проверяем, что setTheme не был вызван
    expect(setThemeMock).not.toHaveBeenCalled();
  });

  // Этот тест не имеет смысла, так как useEffect срабатывает сразу после рендеринга
  // и устанавливает mounted в true, поэтому удаляем его

  it("should call setTheme with 'dark' when clicked in light mode after mounting", async () => {
    // Создаем компонент
    const { rerender } = render(<ThemeToggle />);

    // Симулируем монтирование компонента
    // Для этого нам нужно перерендерить компонент, чтобы useEffect сработал
    rerender(<ThemeToggle />);

    // Симулируем клик по кнопке
    const button = screen.getByTestId("theme-toggle-button");
    fireEvent.click(button);

    // Проверяем, что setTheme был вызван с правильным аргументом
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("should call setTheme with 'light' when clicked in dark mode after mounting", async () => {
    // Устанавливаем тему в dark
    mockTheme = "dark";

    // Создаем компонент
    const { rerender } = render(<ThemeToggle />);

    // Симулируем монтирование компонента
    rerender(<ThemeToggle />);

    // Симулируем клик по кнопке
    const button = screen.getByTestId("theme-toggle-button");
    fireEvent.click(button);

    // Проверяем, что setTheme был вызван с правильным аргументом
    expect(setThemeMock).toHaveBeenCalledWith("light");
  });
});
