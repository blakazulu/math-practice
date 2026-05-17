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
