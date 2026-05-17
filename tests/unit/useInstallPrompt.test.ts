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

// Tests for the positive-show cases and event handling are added in Tasks 4–6.
// Keep the imports above; later tasks append new describe blocks.
export {};
