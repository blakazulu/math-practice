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
