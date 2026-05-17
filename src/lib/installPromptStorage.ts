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
