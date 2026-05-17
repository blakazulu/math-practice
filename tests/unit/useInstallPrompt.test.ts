import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import {
  writeInstallPromptState,
  INSTALL_PROMPT_KEY,
} from "@/lib/installPromptStorage";

/**
 * Helpers to stub the environment the hook reads from. Each test that needs
 * a non-default environment calls setEnv() before renderHook.
 */
type EnvOptions = {
  pointerCoarse?: boolean;   // matchMedia '(pointer: coarse) and (max-width: 820px)'
  standalone?: boolean;      // matchMedia '(display-mode: standalone)'
  iosStandalone?: boolean;   // navigator.standalone
  userAgent?: string;
};

function setEnv(opts: EnvOptions = {}) {
  const {
    pointerCoarse = true,
    standalone = false,
    iosStandalone = false,
    userAgent = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0",
  } = opts;

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      (query.includes("pointer: coarse") && pointerCoarse) ||
      (query.includes("display-mode: standalone") && standalone),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  })) as unknown as typeof window.matchMedia;

  Object.defineProperty(navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });

  Object.defineProperty(navigator, "standalone", {
    value: iosStandalone,
    configurable: true,
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useInstallPrompt — suppression gates", () => {
  it("does not show on desktop (pointer: fine)", () => {
    setEnv({ pointerCoarse: false });
    const { result } = renderHook(() => useInstallPrompt());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.shouldShow).toBe(false);
  });

  it("does not show when running in installed PWA (display-mode: standalone)", () => {
    setEnv({ standalone: true });
    const { result } = renderHook(() => useInstallPrompt());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.shouldShow).toBe(false);
  });

  it("does not show when running in iOS PWA (navigator.standalone)", () => {
    setEnv({
      iosStandalone: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Safari/604.1",
    });
    const { result } = renderHook(() => useInstallPrompt());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.shouldShow).toBe(false);
  });

  it("does not show when dismissed within 24h", () => {
    setEnv({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Safari/604.1",
    });
    writeInstallPromptState({
      dismissedAt: Date.now() - 1000 * 60 * 60, // 1h ago
      installed: false,
    });
    const { result } = renderHook(() => useInstallPrompt());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.shouldShow).toBe(false);
  });

  it("does not show when installed flag is true", () => {
    setEnv({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Safari/604.1",
    });
    writeInstallPromptState({ dismissedAt: null, installed: true });
    const { result } = renderHook(() => useInstallPrompt());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.shouldShow).toBe(false);
  });
});


function fireBeforeInstallPrompt(opts: { outcome?: "accepted" | "dismissed" } = {}) {
  const { outcome = "accepted" } = opts;
  const event = new Event("beforeinstallprompt") as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  window.dispatchEvent(event);
  return event;
}

describe("useInstallPrompt — show on iOS Safari", () => {
  it("sets platform to ios and shows after 4s delay", () => {
    setEnv({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Safari/604.1",
    });
    const { result } = renderHook(() => useInstallPrompt());

    // Before the timer fires, nothing is shown.
    act(() => vi.advanceTimersByTime(3999));
    expect(result.current.shouldShow).toBe(false);

    // At 4s the gate flips.
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.shouldShow).toBe(true);
    expect(result.current.platform).toBe("ios");
  });

  it("dismiss() persists dismissedAt and hides", () => {
    setEnv({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Safari/604.1",
    });
    const before = Date.now();
    const { result } = renderHook(() => useInstallPrompt());
    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.dismiss());

    expect(result.current.shouldShow).toBe(false);
    const raw = localStorage.getItem(INSTALL_PROMPT_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.installed).toBe(false);
    expect(typeof parsed.dismissedAt).toBe("number");
    expect(parsed.dismissedAt).toBeGreaterThanOrEqual(before);
  });
});

describe("useInstallPrompt — show on Android Chrome", () => {
  it("captures beforeinstallprompt and shows after delay with platform=android", () => {
    setEnv({});  // default UA is Android Chrome
    const { result } = renderHook(() => useInstallPrompt());

    // Event fires before the timer.
    act(() => {
      fireBeforeInstallPrompt();
    });
    act(() => vi.advanceTimersByTime(5000));

    expect(result.current.shouldShow).toBe(true);
    expect(result.current.platform).toBe("android");
  });

  it("does NOT show on Android if beforeinstallprompt never fires", () => {
    setEnv({});
    const { result } = renderHook(() => useInstallPrompt());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.shouldShow).toBe(false);
  });

  it("install() resolves with accepted outcome and marks installed", async () => {
    setEnv({});
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      fireBeforeInstallPrompt({ outcome: "accepted" });
    });
    act(() => vi.advanceTimersByTime(5000));

    await act(async () => {
      await result.current.install();
    });

    expect(result.current.shouldShow).toBe(false);
    const parsed = JSON.parse(localStorage.getItem(INSTALL_PROMPT_KEY)!);
    expect(parsed.installed).toBe(true);
  });

  it("install() with dismissed outcome writes cooldown instead of installed", async () => {
    setEnv({});
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      fireBeforeInstallPrompt({ outcome: "dismissed" });
    });
    act(() => vi.advanceTimersByTime(5000));

    await act(async () => {
      await result.current.install();
    });

    expect(result.current.shouldShow).toBe(false);
    const parsed = JSON.parse(localStorage.getItem(INSTALL_PROMPT_KEY)!);
    expect(parsed.installed).toBe(false);
    expect(typeof parsed.dismissedAt).toBe("number");
  });
});

describe("useInstallPrompt — appinstalled listener", () => {
  it("hides and persists installed: true when appinstalled fires", () => {
    setEnv({});
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      fireBeforeInstallPrompt();
    });
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.shouldShow).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(result.current.shouldShow).toBe(false);
    const parsed = JSON.parse(localStorage.getItem(INSTALL_PROMPT_KEY)!);
    expect(parsed.installed).toBe(true);
  });

  it("does not show if appinstalled fires before the arm timer", () => {
    setEnv({});
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      fireBeforeInstallPrompt();
    });
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.shouldShow).toBe(false);
    const parsed = JSON.parse(localStorage.getItem(INSTALL_PROMPT_KEY)!);
    expect(parsed.installed).toBe(true);
  });
});

export {};
