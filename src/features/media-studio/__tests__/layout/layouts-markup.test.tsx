import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  DefaultLayout,
  DualLayout,
  OptionsLayout,
  VerticalLayout,
} from "../../components/layout/layouts-markup";

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Мокаем lucide-react
vi.mock("lucide-react", () => ({
  Play: ({ className }: { className?: string }) => (
    <div data-testid="play-icon" className={className}>
      Play Icon
    </div>
  ),
}));

describe("Layout Components", () => {
  describe("DefaultLayout", () => {
    it("should render correctly", () => {
      const onClick = vi.fn();
      render(<DefaultLayout isActive={false} onClick={onClick} />);

      // Проверяем, что компонент отрендерен
      expect(screen.getByText("topBar.layouts.default")).toBeInTheDocument();
    });

    it("should apply active styles when isActive is true", () => {
      const onClick = vi.fn();
      const renderResult = render(<DefaultLayout isActive onClick={onClick} />);

      // Проверяем, что применены стили активного элемента
      const layoutElement = renderResult.container.firstChild as HTMLElement;
      expect(layoutElement.className).toContain("bg-muted");
      expect(layoutElement.className).not.toContain("hover:bg-muted");
    });

    it("should call onClick when clicked", () => {
      const onClick = vi.fn();
      render(<DefaultLayout isActive={false} onClick={onClick} />);

      // Кликаем по компоненту
      act(() => {
        act(() => {
          fireEvent.click(screen.getByText("topBar.layouts.default"));
        });
      });

      // Проверяем, что функция onClick была вызвана
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("OptionsLayout", () => {
    it("should render correctly", () => {
      const onClick = vi.fn();
      render(<OptionsLayout isActive={false} onClick={onClick} />);

      // Проверяем, что компонент отрендерен
      expect(screen.getByText("topBar.layouts.options")).toBeInTheDocument();
    });

    it("should apply active styles when isActive is true", () => {
      const onClick = vi.fn();
      const renderResult = render(<OptionsLayout isActive onClick={onClick} />);

      // Проверяем, что применены стили активного элемента
      const layoutElement = renderResult.container.firstChild as HTMLElement;
      expect(layoutElement.className).toContain("bg-muted");
      expect(layoutElement.className).not.toContain("hover:bg-muted");
    });

    it("should call onClick when clicked", () => {
      const onClick = vi.fn();
      render(<OptionsLayout isActive={false} onClick={onClick} />);

      // Кликаем по компоненту
      act(() => {
        act(() => {
          fireEvent.click(screen.getByText("topBar.layouts.options"));
        });
      });

      // Проверяем, что функция onClick была вызвана
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("VerticalLayout", () => {
    it("should render correctly", () => {
      const onClick = vi.fn();
      render(<VerticalLayout isActive={false} onClick={onClick} />);

      // Проверяем, что компонент отрендерен
      expect(screen.getByText("topBar.layouts.vertical")).toBeInTheDocument();
    });

    it("should apply active styles when isActive is true", () => {
      const onClick = vi.fn();
      const renderResult = render(
        <VerticalLayout isActive onClick={onClick} />,
      );

      // Проверяем, что применены стили активного элемента
      const layoutElement = renderResult.container.firstChild as HTMLElement;
      expect(layoutElement.className).toContain("bg-muted");
      expect(layoutElement.className).not.toContain("hover:bg-muted");
    });

    it("should call onClick when clicked", () => {
      const onClick = vi.fn();
      render(<VerticalLayout isActive={false} onClick={onClick} />);

      // Кликаем по компоненту
      act(() => {
        act(() => {
          fireEvent.click(screen.getByText("topBar.layouts.vertical"));
        });
      });

      // Проверяем, что функция onClick была вызвана
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("DualLayout", () => {
    it("should render correctly with external display", () => {
      const onClick = vi.fn();
      render(
        <DualLayout isActive={false} onClick={onClick} hasExternalDisplay />,
      );

      // Проверяем, что компонент отрендерен
      expect(screen.getByText("topBar.layouts.dual")).toBeInTheDocument();

      // Проверяем, что предупреждение о внешнем дисплее не отображается
      expect(
        screen.queryByText("topBar.layouts.externalDisplayRequired"),
      ).not.toBeInTheDocument();
    });

    it("should render correctly without external display", () => {
      const onClick = vi.fn();
      render(
        <DualLayout
          isActive={false}
          onClick={onClick}
          hasExternalDisplay={false}
        />,
      );

      // Проверяем, что компонент отрендерен
      expect(screen.getByText("topBar.layouts.dual")).toBeInTheDocument();

      // Проверяем, что предупреждение о внешнем дисплее отображается
      expect(
        screen.getByText("topBar.layouts.externalDisplayRequired"),
      ).toBeInTheDocument();
    });

    it("should apply active styles when isActive is true and hasExternalDisplay is true", () => {
      const onClick = vi.fn();
      const renderResult = render(
        <DualLayout isActive onClick={onClick} hasExternalDisplay />,
      );

      // Проверяем, что применены стили активного элемента
      const layoutElement = renderResult.container.firstChild as HTMLElement;
      expect(layoutElement.className).toContain("bg-muted");
      expect(layoutElement.className).toContain("cursor-pointer");
      expect(layoutElement.className).not.toContain("cursor-not-allowed");
    });

    it("should apply disabled styles when hasExternalDisplay is false", () => {
      const onClick = vi.fn();
      const renderResult = render(
        <DualLayout
          isActive={false}
          onClick={onClick}
          hasExternalDisplay={false}
        />,
      );

      // Проверяем, что применены стили неактивного элемента
      const layoutElement = renderResult.container.firstChild as HTMLElement;
      expect(layoutElement.className).toContain("cursor-not-allowed");
      expect(layoutElement.className).toContain("opacity-50");
    });

    it("should call onClick when clicked and hasExternalDisplay is true", () => {
      const onClick = vi.fn();
      render(
        <DualLayout isActive={false} onClick={onClick} hasExternalDisplay />,
      );

      // Кликаем по компоненту
      act(() => {
        act(() => {
          fireEvent.click(screen.getByText("topBar.layouts.dual"));
        });
      });

      // Проверяем, что функция onClick была вызвана
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick even when hasExternalDisplay is false", () => {
      const onClick = vi.fn();
      render(
        <DualLayout
          isActive={false}
          onClick={onClick}
          hasExternalDisplay={false}
        />,
      );

      // Кликаем по компоненту
      act(() => {
        act(() => {
          fireEvent.click(screen.getByText("topBar.layouts.dual"));
        });
      });

      // Проверяем, что функция onClick была вызвана
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
