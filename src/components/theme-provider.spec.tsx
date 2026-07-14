import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

describe("applyTheme", () => {
  afterEach(() => {
    document.documentElement.classList.remove("light", "dark");
  });

  it("adds the light class for light theme", async () => {
    const { applyTheme } = await import("./apply-theme");
    applyTheme("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("adds the dark class for dark theme", async () => {
    const { applyTheme } = await import("./apply-theme");
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("applies system preference for system theme (dark)", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    const { applyTheme } = await import("./apply-theme");
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("applies system preference for system theme (light)", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    const { applyTheme } = await import("./apply-theme");
    applyTheme("system");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("removes opposite class when switching themes", async () => {
    const { applyTheme } = await import("./apply-theme");
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyTheme("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("ThemeProvider", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("light", "dark");
  });

  function mockLocalStorage(storage: Record<string, string> = {}) {
    const store = { ...storage };
    vi.stubGlobal(
      "localStorage",
      new (class {
        getItem(key: string) {
          return store[key] ?? null;
        }
        setItem(key: string, value: string) {
          store[key] = value;
        }
        removeItem(key: string) {
          delete store[key];
        }
        clear() {
          Object.keys(store).forEach((k) => delete store[k]);
        }
      })(),
    );
  }

  it("renders children", async () => {
    mockLocalStorage({});
    const { ThemeProvider } = await import("./theme-provider");
    render(
      <ThemeProvider>
        <div>hello</div>
      </ThemeProvider>,
    );
    expect(screen.getByText("hello")).toBeTruthy();
  });

  it("reads theme from localStorage", async () => {
    mockLocalStorage({ "vite-ui-theme": "dark" });
    const { ThemeProvider } = await import("./theme-provider");
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("falls back to defaultTheme when localStorage is empty", async () => {
    mockLocalStorage({});
    const { ThemeProvider } = await import("./theme-provider");
    render(
      <ThemeProvider defaultTheme="light">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("setTheme updates localStorage and classList", async () => {
    mockLocalStorage({});
    const { ThemeProvider, useTheme } = await import("./theme-provider");

    function TestConsumer() {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme("dark")}>dark</button>
        </div>
      );
    }

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme").textContent).toBe("light");

    fireEvent.click(screen.getByText("dark"));

    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme with system applies media query", async () => {
    mockLocalStorage({});
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    const { ThemeProvider, useTheme } = await import("./theme-provider");

    function TestConsumer() {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme("system")}>system</button>;
    }

    render(
      <ThemeProvider defaultTheme="dark">
        <TestConsumer />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByText("system"));

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe("useTheme", () => {
  it("returns the default theme value when used outside ThemeProvider", async () => {
    const { useTheme } = await import("./theme-provider");
    function Reader() {
      const { theme } = useTheme();
      return <span data-testid="outside-theme">{theme}</span>;
    }
    render(<Reader />);
    expect(screen.getByTestId("outside-theme").textContent).toBe("system");
  });
});
