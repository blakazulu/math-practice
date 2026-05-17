# Mobile Install Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a Hebrew bottom-sheet on mobile inviting users to install the PWA — one-tap install on Android via `beforeinstallprompt`, manual instructions on iOS Safari, suppressed everywhere else and for 24h after dismissal.

**Architecture:** A standalone localStorage module owns persistence. A `useInstallPrompt` hook owns platform detection, event capture, cooldown, and the 4-second arming delay. An `InstallPromptSheet` component owns the bottom-sheet UI and routes its CTA back through the hook. Mounted once at App root next to `<GrainOverlay />`.

**Tech Stack:** React 18, TypeScript, Framer Motion 12, Tailwind, Vitest + jsdom, Zustand (untouched).

**Reference spec:** `docs/superpowers/specs/2026-05-17-mobile-install-prompt-design.md`

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/lib/installPromptStorage.ts` | Create | Read/write the `{ dismissedAt, installed }` blob to `localStorage["math-practice:installPrompt"]`. Pure I/O, no React. |
| `src/lib/useInstallPrompt.ts` | Create | React hook. Orchestrates platform detection, `beforeinstallprompt` capture, `appinstalled` listener, cooldown gate, 4-second arming delay. Returns `{ shouldShow, platform, install, dismiss }`. |
| `src/components/InstallPromptSheet.tsx` | Create | Bottom-sheet UI. Renders nothing when `shouldShow === false`. Two visual variants keyed off `platform`. |
| `src/app/App.tsx` | Modify | Mount `<InstallPromptSheet />` between `<GrainOverlay />` and `<AppRoutes />`. |
| `tests/unit/installPromptStorage.test.ts` | Create | Unit tests for read/write/clear and shape validation. |
| `tests/unit/useInstallPrompt.test.ts` | Create | Unit tests for cooldown logic, install-state suppression, platform detection, dismissal write. |

No store changes. No new dependencies. No CSS additions outside Tailwind utilities already in use.

---

## Task 1: Storage module — failing test

**Files:**
- Test: `tests/unit/installPromptStorage.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `tests/unit/installPromptStorage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  readInstallPromptState,
  writeInstallPromptState,
  INSTALL_PROMPT_KEY,
  type InstallPromptState,
} from "@/lib/installPromptStorage";

describe("installPromptStorage", () => {
  beforeEach(() => localStorage.clear());

  it("returns default state when nothing is stored", () => {
    expect(readInstallPromptState()).toEqual({
      dismissedAt: null,
      installed: false,
    });
  });

  it("round-trips a written state", () => {
    const state: InstallPromptState = { dismissedAt: 1_700_000_000_000, installed: false };
    writeInstallPromptState(state);
    expect(readInstallPromptState()).toEqual(state);
  });

  it("returns default state when JSON is corrupt", () => {
    localStorage.setItem(INSTALL_PROMPT_KEY, "{not json");
    expect(readInstallPromptState()).toEqual({
      dismissedAt: null,
      installed: false,
    });
  });

  it("returns default state when shape is wrong", () => {
    localStorage.setItem(INSTALL_PROMPT_KEY, JSON.stringify({ foo: "bar" }));
    expect(readInstallPromptState()).toEqual({
      dismissedAt: null,
      installed: false,
    });
  });

  it("preserves installed: true across reads", () => {
    writeInstallPromptState({ dismissedAt: null, installed: true });
    expect(readInstallPromptState().installed).toBe(true);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run tests/unit/installPromptStorage.test.ts`
Expected: FAIL with "Cannot find module '@/lib/installPromptStorage'".

---

## Task 2: Storage module — implementation

**Files:**
- Create: `src/lib/installPromptStorage.ts`

- [ ] **Step 1: Create the module**

Create `src/lib/installPromptStorage.ts`:

```ts
export const INSTALL_PROMPT_KEY = "math-practice:installPrompt";

export type InstallPromptState = {
  dismissedAt: number | null;
  installed: boolean;
};

const DEFAULT: InstallPromptState = {
  dismissedAt: null,
  installed: false,
};

function isValid(value: unknown): value is InstallPromptState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const dismissedOk = v.dismissedAt === null || typeof v.dismissedAt === "number";
  const installedOk = typeof v.installed === "boolean";
  return dismissedOk && installedOk;
}

export function readInstallPromptState(): InstallPromptState {
  try {
    const raw = localStorage.getItem(INSTALL_PROMPT_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) return { ...DEFAULT };
    return parsed;
  } catch (e) {
    console.error("installPromptStorage: failed to read", e);
    return { ...DEFAULT };
  }
}

export function writeInstallPromptState(state: InstallPromptState): void {
  try {
    localStorage.setItem(INSTALL_PROMPT_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("installPromptStorage: failed to write", e);
  }
}
```

- [ ] **Step 2: Run tests, verify all pass**

Run: `npx vitest run tests/unit/installPromptStorage.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 3: Commit**

```bash
git add src/lib/installPromptStorage.ts tests/unit/installPromptStorage.test.ts
git commit -m "feat(pwa): add installPromptStorage module"
```

---

## Task 3: Hook — cooldown gate test (suppression cases)

**Files:**
- Test: `tests/unit/useInstallPrompt.test.ts`

This task and Tasks 4–6 test the hook in isolation by stubbing `matchMedia`, `navigator`, and `window` event APIs. The tests use `@testing-library/react`'s `renderHook` and `act`.

- [ ] **Step 1: Create the test file with shared helpers and the first batch of tests**

Create `tests/unit/useInstallPrompt.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run tests/unit/useInstallPrompt.test.ts`
Expected: FAIL with "Cannot find module '@/lib/useInstallPrompt'".

---

## Task 4: Hook — minimal implementation that makes Task 3 pass

**Files:**
- Create: `src/lib/useInstallPrompt.ts`

- [ ] **Step 1: Create the hook with gating logic only (no event capture yet)**

Create `src/lib/useInstallPrompt.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import {
  readInstallPromptState,
  writeInstallPromptState,
} from "./installPromptStorage";

export type InstallPlatform = "android" | "ios" | "none";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const ARM_DELAY_MS = 4000;

// Matches the BeforeInstallPromptEvent shape we actually use. The Web APIs
// type isn't in lib.dom — defining our own keeps us off `any`.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isMobile(): boolean {
  return window.matchMedia("(pointer: coarse) and (max-width: 820px)").matches;
}

function isAlreadyInstalled(): boolean {
  const standaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneDisplay || iosStandalone;
}

function detectIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  // Safari has "Safari" in UA but Chrome/Firefox/in-app browsers also include
  // markers that distinguish them. Treat anything containing CriOS/FxiOS/FBAN/FBAV/Instagram as non-Safari.
  const inAppOrOtherBrowser = /CriOS|FxiOS|EdgiOS|FBAN|FBAV|Instagram|Line|MicroMessenger/.test(ua);
  return isIOS && !inAppOrOtherBrowser;
}

function cooldownActive(dismissedAt: number | null): boolean {
  if (dismissedAt === null) return false;
  return Date.now() - dismissedAt < COOLDOWN_MS;
}

export function useInstallPrompt(): {
  shouldShow: boolean;
  platform: InstallPlatform;
  install: () => Promise<void>;
  dismiss: () => void;
} {
  const [shouldShow, setShouldShow] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("none");
  const installedRef = useRef(false);
  const deferredEventRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const persisted = readInstallPromptState();
    installedRef.current = persisted.installed;

    if (persisted.installed) return;
    if (!isMobile()) return;
    if (isAlreadyInstalled()) return;
    if (cooldownActive(persisted.dismissedAt)) return;

    const iosSafari = detectIOSSafari();
    if (iosSafari) setPlatform("ios");

    const timer = window.setTimeout(() => {
      if (installedRef.current) return;
      // For iOS, platform is already "ios". For Android, only show if the
      // beforeinstallprompt event has fired and set platform to "android".
      // If neither, the hook stays silent.
      setShouldShow((prev) => prev || iosSafari || deferredEventRef.current !== null);
    }, ARM_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setShouldShow(false);
    const current = readInstallPromptState();
    writeInstallPromptState({ ...current, dismissedAt: Date.now() });
  }, []);

  const install = useCallback(async () => {
    const evt = deferredEventRef.current;
    if (!evt) {
      // iOS or unsupported — treat as dismiss.
      dismiss();
      return;
    }
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    deferredEventRef.current = null;
    if (outcome === "accepted") {
      installedRef.current = true;
      writeInstallPromptState({ dismissedAt: null, installed: true });
      setShouldShow(false);
    } else {
      dismiss();
    }
  }, [dismiss]);

  return { shouldShow, platform, install, dismiss };
}
```

- [ ] **Step 2: Run the suppression tests, verify they pass**

Run: `npx vitest run tests/unit/useInstallPrompt.test.ts`
Expected: PASS — 5 tests in "suppression gates".

- [ ] **Step 3: Commit**

```bash
git add src/lib/useInstallPrompt.ts tests/unit/useInstallPrompt.test.ts
git commit -m "feat(pwa): add useInstallPrompt hook with suppression gates"
```

---

## Task 5: Hook — positive-show cases for iOS and Android

**Files:**
- Modify: `tests/unit/useInstallPrompt.test.ts`
- Modify: `src/lib/useInstallPrompt.ts` (only if tests reveal a bug; otherwise unchanged)

- [ ] **Step 1: Append new describe block to the test file**

Append to the bottom of `tests/unit/useInstallPrompt.test.ts`, BEFORE the `export {};` line:

```ts
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
});
```

- [ ] **Step 2: Run tests, observe failures**

Run: `npx vitest run tests/unit/useInstallPrompt.test.ts`
Expected: FAILures in the new describe blocks because the hook does not yet:
- Listen for `beforeinstallprompt` (so Android case never sets `platform: "android"`)
- Listen for `appinstalled`

(The two iOS tests in "show on iOS Safari" should already pass because the hook handles iOS via UA detection alone. If they fail, fix before continuing.)

- [ ] **Step 3: Add event listeners to the hook**

Edit `src/lib/useInstallPrompt.ts`. Replace the `useEffect(() => { ... }, [])` block with this expanded version:

```ts
  useEffect(() => {
    const persisted = readInstallPromptState();
    installedRef.current = persisted.installed;

    if (persisted.installed) return;
    if (!isMobile()) return;
    if (isAlreadyInstalled()) return;
    if (cooldownActive(persisted.dismissedAt)) return;

    const iosSafari = detectIOSSafari();
    if (iosSafari) setPlatform("ios");

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredEventRef.current = e as BeforeInstallPromptEvent;
      setPlatform("android");
    };

    const onAppInstalled = () => {
      installedRef.current = true;
      deferredEventRef.current = null;
      writeInstallPromptState({ dismissedAt: null, installed: true });
      setShouldShow(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    const timer = window.setTimeout(() => {
      if (installedRef.current) return;
      setShouldShow((prev) => prev || iosSafari || deferredEventRef.current !== null);
    }, ARM_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);
```

- [ ] **Step 4: Re-run tests, verify all pass**

Run: `npx vitest run tests/unit/useInstallPrompt.test.ts`
Expected: PASS — all describe blocks (5 suppression + 2 iOS + 4 Android + 1 appinstalled = 12 tests).

- [ ] **Step 5: Run the whole suite to confirm no regressions**

Run: `npm test`
Expected: PASS — 40 prior tests + 12 new = 52 tests. (The 40 figure comes from CLAUDE.md; it may differ slightly if any other test was added in the meantime — what matters is that no previously-passing test now fails.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/useInstallPrompt.ts tests/unit/useInstallPrompt.test.ts
git commit -m "feat(pwa): add beforeinstallprompt and appinstalled handling"
```

---

## Task 6: InstallPromptSheet component

**Files:**
- Create: `src/components/InstallPromptSheet.tsx`

There is no automated test for this component — it's pure presentation that depends on real browser APIs (Framer's `AnimatePresence`, `prefers-reduced-motion`, focus management). Verification is the manual checklist in Task 8.

- [ ] **Step 1: Create the component**

Create `src/components/InstallPromptSheet.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share, PlusSquare, X } from "lucide-react";
import { Ornament } from "./Ornament";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { useMotionVariants } from "@/lib/motion";

const backdropVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

const sheetVariants = {
  hidden: { y: "100%", opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 360, damping: 32 },
  },
};

export function InstallPromptSheet() {
  const { shouldShow, platform, install, dismiss } = useInstallPrompt();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Reduced-motion fallback for both backdrop and sheet.
  const reducedBackdrop = useMotionVariants(backdropVariants);
  const reducedSheet = useMotionVariants(sheetVariants);

  // Move focus to the close button when the sheet appears; restore on unmount.
  useEffect(() => {
    if (!shouldShow) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [shouldShow]);

  // ESC closes the sheet.
  useEffect(() => {
    if (!shouldShow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shouldShow, dismiss]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-prompt-title"
          initial="hidden"
          animate="show"
          exit="hidden"
          variants={reducedBackdrop}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            variants={reducedSheet}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="w-full max-w-md bg-white rounded-t-3xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sprout-green accent strip */}
            <div className="h-1.5 bg-brand-500" />

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-brand-600">
                    <Ornament name="sprout-mark" size={32} />
                  </span>
                  <h2 id="install-prompt-title" className="font-bold leading-tight">
                    {platform === "ios"
                      ? "הוסיפו את חשבונייה למסך הבית"
                      : "התקינו את חשבונייה במכשיר"}
                  </h2>
                </div>
                <button
                  ref={closeRef}
                  onClick={dismiss}
                  aria-label="סגירה"
                  className="p-2 -m-2 text-muted hover:text-ink transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {platform === "ios" ? (
                <>
                  <ol className="space-y-3 mb-5 text-ink">
                    <li className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                        <Share size={18} />
                      </span>
                      <span>הקישו על כפתור השיתוף בתחתית המסך</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                        <PlusSquare size={18} />
                      </span>
                      <span>בחרו "הוסף למסך הבית"</span>
                    </li>
                  </ol>
                  <div className="flex justify-end">
                    <button onClick={dismiss} className="btn-primary">
                      הבנתי
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted mb-5">
                    גישה מהירה מהמסך הבית, בלי דפדפן.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={dismiss} className="btn-secondary">
                      לא עכשיו
                    </button>
                    <button onClick={install} className="btn-primary">
                      התקינו עכשיו
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc -b`
Expected: no errors.

If you get an error about `lucide-react` missing `PlusSquare` or `Share`, check the installed version with:

Run: `npm ls lucide-react`

The project pins `^1.16.0`. If either icon name has moved, substitute the closest equivalent (e.g. `SquarePlus`, `ShareIcon`) and update the imports.

- [ ] **Step 3: Commit**

```bash
git add src/components/InstallPromptSheet.tsx
git commit -m "feat(pwa): add InstallPromptSheet component"
```

---

## Task 7: Mount the sheet at App root

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add the import and mount the component**

Edit `src/app/App.tsx`. The current file is:

```tsx
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useStore } from "@/store";
import { GrainOverlay } from "@/components/GrainOverlay";

// Hydrate localStorage synchronously at module load to avoid a Welcome-flash
// for returning users on first render.
useStore.getState().hydrate();

export function App() {
  const loadBank = useStore((s) => s.loadBank);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  return (
    <BrowserRouter>
      <GrainOverlay />
      <AppRoutes />
    </BrowserRouter>
  );
}
```

Change it to:

```tsx
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useStore } from "@/store";
import { GrainOverlay } from "@/components/GrainOverlay";
import { InstallPromptSheet } from "@/components/InstallPromptSheet";

// Hydrate localStorage synchronously at module load to avoid a Welcome-flash
// for returning users on first render.
useStore.getState().hydrate();

export function App() {
  const loadBank = useStore((s) => s.loadBank);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  return (
    <BrowserRouter>
      <GrainOverlay />
      <InstallPromptSheet />
      <AppRoutes />
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: PASS — same total as Task 5 Step 5 (no new tests added).

- [ ] **Step 3: Build to make sure typecheck + Vite build succeed**

Run: `npm run build`
Expected: clean build, `dist/` regenerated.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx
git commit -m "feat(pwa): mount InstallPromptSheet at App root"
```

---

## Task 8: Manual verification

**Files:**
- None — this is a verification-only task with no code changes.

PWA install flows cannot be exercised in headless Chromium reliably, so the only meaningful coverage of the end-to-end experience is a manual smoke test. If you don't have a phone available, mark the checklist items you can't verify as "untested on real device" and flag it to the user.

- [ ] **Step 1: Desktop Chrome (negative test)**

  1. `npm run dev`
  2. Open `http://localhost:5173` in desktop Chrome
  3. Wait 5 seconds
  4. **Expected:** no sheet appears (mobile gate fails)
  5. Open DevTools → Application → Manifest. Confirm the manifest is detected with no errors.

- [ ] **Step 2: Desktop Chrome in mobile emulation**

  1. DevTools → Toggle device toolbar → iPhone or Pixel preset
  2. Refresh
  3. Wait 5 seconds
  4. **Expected on Pixel (Chrome):** sheet appears after ~4s with "התקינו עכשיו" CTA. Note: `beforeinstallprompt` only fires if Chrome's install criteria are met. On localhost, this often works; if it doesn't, that's a Chrome-side decision — confirm by checking DevTools console for any related messages.
  5. **Expected on iPhone preset:** sheet appears after ~4s with the iOS instructions (Share + PlusSquare icons). Note: the iPhone preset only changes the UA — `navigator.standalone` is undefined, so detection works.

- [ ] **Step 3: Dismissal cooldown**

  1. While the sheet is visible, tap "לא עכשיו" (or "הבנתי" on iOS variant)
  2. Refresh the page
  3. Wait 5 seconds
  4. **Expected:** no sheet (24h cooldown active)
  5. In DevTools → Application → Local Storage, locate `math-practice:installPrompt` and overwrite its `dismissedAt` to `0`, then refresh
  6. **Expected:** sheet reappears after 4s

- [ ] **Step 4: Real Android device (if available)**

  1. Deploy the branch to a Netlify preview or expose `npm run dev` via tunnel
  2. Open in Chrome on Android
  3. Wait 4s — sheet should appear
  4. Tap "התקינו עכשיו" — native install prompt should appear; tap Install
  5. App appears on home screen; opening it launches in standalone mode (no browser chrome)
  6. Reopen the regular browser URL → sheet should not reappear (gate 2: `display-mode: standalone` in the installed instance; in the browser instance, the `appinstalled` event may not have fired, but the manifest's `start_url: "/"` paired with the installed flag in storage should suppress it)

- [ ] **Step 5: Real iOS Safari device (if available)**

  1. Open the deployed URL in Safari on iPhone
  2. Wait 4s — sheet should appear with Share/PlusSquare instructions
  3. Tap "הבנתי" — sheet dismisses
  4. Manually follow the instructions: Share button → Add to Home Screen → Add
  5. Open the home screen icon — should launch fullscreen (no Safari chrome)
  6. Re-open in Safari (regular browser) → sheet should not reappear (cooldown active; even after 24h, `navigator.standalone` is true inside the installed instance; in regular Safari it isn't, so the sheet eventually returns — that's by design)

- [ ] **Step 6: Reduced-motion check**

  1. Mac: System Settings → Accessibility → Display → "Reduce motion"
     Windows: Settings → Accessibility → Visual effects → Animation effects → off
  2. Refresh page (mobile emulation), wait 4s
  3. **Expected:** sheet fades in/out instead of sliding up

- [ ] **Step 7: Final commit (only if any manual fixes were needed)**

If you found and fixed an issue during manual testing, commit it as a follow-up.

```bash
git add <files>
git commit -m "fix(pwa): <description of the fix>"
```

If everything passed without fixes, no commit is needed here.

---

## Self-review notes

- **Spec coverage:** Every gate, every variant copy line, every edge case from the spec maps to either Task 4 (hook gates), Task 5 (event handling + cooldown), Task 6 (UI variants), or Task 8 (manual verification of cross-device behavior).
- **Naming consistency:** `InstallPromptState`, `INSTALL_PROMPT_KEY`, `useInstallPrompt`, `InstallPromptSheet`, `InstallPlatform`, `BeforeInstallPromptEvent` — all stable across tasks.
- **No store changes:** confirmed. The hook reads/writes its own localStorage key independent of `usersSlice`.
- **No new dependencies:** Framer Motion, lucide-react, Tailwind utilities already present.
- **Reduced motion:** addressed via `useMotionVariants` in Task 6.
- **RTL:** the X close button is on the right of the flex row because `flex` in an `<html dir="rtl">` document visually places `justify-between`'s "end" element on the left — confirmed by the existing `Confirm.tsx` pattern.
