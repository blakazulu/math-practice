# Mobile install prompt — design

**Date:** 2026-05-17
**Status:** Approved
**Author:** Liraz (via Claude brainstorming)

## Goal

When a mobile visitor lands on the site, surface a friendly bottom-sheet inviting them to install Hashbonia as a PWA on their device. On Android, one-tap install via the native `beforeinstallprompt` flow. On iOS Safari, show visual instructions for Share → Add to Home Screen (no programmatic install exists on iOS). Desktop visitors and already-installed users see nothing. Dismissal locks the prompt out for 24 hours.

## Non-goals

- **No service worker.** The manifest alone is sufficient to get Chrome to offer install; adding a SW for offline support is out of scope for this change.
- **No re-engagement prompts** for installed users ("open the app", etc.).
- **No analytics** on accept/dismiss rates.
- **No prompt on desktop**, regardless of viewport width or PWA criteria — this is explicitly a mobile-only feature.

## User-facing behavior

### Trigger
- On every mobile visit to any page in the SPA, the hook arms a 4-second timer at mount.
- After the timer fires, if all gates pass, the bottom sheet slides up.
- The sheet is shown at most **once per 24 hours per device**, measured from the moment the user dismisses (or installs) it.

### Gates (all must pass for the sheet to appear)
1. Device is mobile: `matchMedia('(pointer: coarse) and (max-width: 820px)').matches`
2. App is not already installed:
   - `matchMedia('(display-mode: standalone)').matches === false` (Android / desktop PWA detection)
   - AND `navigator.standalone !== true` (iOS Safari PWA detection)
3. Last dismissal was more than 24 hours ago, or never occurred.
4. Platform is supported:
   - **Android Chrome / Edge / Samsung Internet** — the `beforeinstallprompt` event has fired and been captured.
   - **iOS Safari** — UA matches `/iPad|iPhone|iPod/` and the browser is Safari (not an in-app browser like Facebook/Instagram, and not Chrome-on-iOS).
   - Anything else (Android browser that never fires `beforeinstallprompt`, in-app browsers, Firefox without PWA support, etc.) → silent, never show.

### Android variant (sheet contents)
- Sprout-mark ornament + heading: **התקינו את חשבונייה במכשיר**
- Sub-line: **גישה מהירה מהמסך הבית, בלי דפדפן.**
- Primary CTA: **התקינו עכשיו** → calls `beforeinstallprompt.prompt()`, awaits `userChoice`.
  - If accepted → sheet closes, `installed: true` persisted, never shown again.
  - If dismissed → sheet closes, `dismissedAt` persisted (24h cooldown begins).
- Secondary text button: **לא עכשיו** → dismiss with cooldown.
- Close `X` in top-leading corner (RTL: visually top-left) → dismiss with cooldown.

### iOS variant (sheet contents)
- Sprout-mark ornament + heading: **הוסיפו את חשבונייה למסך הבית**
- Two-step list, each row = lucide SVG icon + Hebrew text:
  1. `Share` icon + **הקישו על כפתור השיתוף בתחתית המסך**
  2. `PlusSquare` icon + **בחרו "הוסף למסך הבית"**
- Single CTA: **הבנתי** → dismiss with cooldown.
- Close `X` also dismisses.

### Dismissal
- Tapping the backdrop, the X, **לא עכשיו**, or **הבנתי** all count as a dismissal.
- Dismissal writes `{ dismissedAt: Date.now() }` to localStorage. The next eligible appearance is `dismissedAt + 86_400_000`.

### Installation detection
- Listen for the `appinstalled` window event globally. When it fires, write `installed: true` and remove the sheet from the DOM forever (until storage is cleared).

## Architecture

### New files

```
src/lib/useInstallPrompt.ts            — orchestration hook
src/components/InstallPromptSheet.tsx  — bottom-sheet UI
```

### Edited files

```
src/app/App.tsx — mount <InstallPromptSheet /> alongside <GrainOverlay />
```

No store changes. No new dependencies. Framer Motion (already used) handles the slide-up animation via the existing `motion.ts` system. Icons come from `lucide-react` (already used).

### Persistence

A standalone localStorage key, separate from the user-roster store:

```ts
const STORAGE_KEY = "math-practice:installPrompt";

type InstallPromptState = {
  dismissedAt: number | null;  // epoch ms; null = never dismissed
  installed: boolean;          // true once appinstalled fires or prompt accepted
};
```

Rationale for not folding into `usersSlice`: install state is per-device/per-browser, not per-user. A returning user on a different device shouldn't inherit another device's dismissal. Keeping it separate also means the prompt logic never has to wait for or coordinate with user hydration.

### `useInstallPrompt` hook

Public signature:

```ts
type Platform = "android" | "ios" | "none";

function useInstallPrompt(): {
  shouldShow: boolean;
  platform: Platform;
  install: () => Promise<void>;  // no-op on iOS
  dismiss: () => void;
};
```

Internal lifecycle:

1. **At mount:**
   - Read persisted state from localStorage. If `installed: true`, set `shouldShow: false` permanently. Bail.
   - Run gates 1–3. If any fails, bail.
   - Detect platform (iOS via UA, Android via captured event — initially `none`).
   - Register `window.addEventListener('beforeinstallprompt', ...)` — stash the event, `preventDefault()` to prevent the browser's native mini-infobar, set `platform: "android"`.
   - Register `window.addEventListener('appinstalled', ...)` — set `installed: true`, persist, hide sheet.
   - If platform detected as iOS at this point, OR if Android event has fired, start the 4-second timer.

2. **After timer:** if `platform !== "none"` and gates still pass, set `shouldShow: true`.

3. **On `install()`:**
   - iOS: no-op.
   - Android: call `event.prompt()`, await `event.userChoice`. If `outcome === "accepted"`, set `installed: true` and persist. If `dismissed`, persist `dismissedAt: Date.now()`. Either way, hide the sheet.

4. **On `dismiss()`:** persist `dismissedAt: Date.now()`, set `shouldShow: false`.

5. **On unmount:** clear timer, remove event listeners.

### `InstallPromptSheet` component

- Renders nothing unless `shouldShow` is true.
- Uses `<AnimatePresence>` so the slide-out plays cleanly on dismissal.
- Backdrop is a `motion.div` with `fade` variant; sheet is a `motion.div` with a vertical slide-up variant (added to `src/lib/motion.ts` as `slideUpSheet` if not already present).
- All animations route through `useMotionVariants()` so reduced-motion users get fade-only.
- Sheet style: white card, rounded top corners (`rounded-t-3xl`), small sprout-green accent strip at the very top, comfortable padding, max-width on tablet-sized screens, anchored to the bottom of the viewport via `fixed inset-x-0 bottom-0`.
- `role="dialog" aria-modal="true"`, focus moves to the close button on open, focus returns to `document.body` on dismiss, ESC dismisses.
- The sheet does NOT block interaction with the page beneath in any persistent way — the backdrop is dismissable, and once dismissed the entire overlay is unmounted.

### Wiring in `App.tsx`

```tsx
<BrowserRouter>
  <GrainOverlay />
  <InstallPromptSheet />
  <AppRoutes />
</BrowserRouter>
```

The component contains the hook call internally, so `App.tsx` doesn't need to know anything about its state.

## Edge cases

| Case | Behavior |
|---|---|
| User installs via Chrome's own menu (no popup) | `appinstalled` fires → `installed: true` → sheet never shows again. |
| User dismisses, then revisits 1 minute later | Cooldown check blocks the timer from arming. |
| User dismisses, revisits after 25 hours | Cooldown passes, sheet appears again. |
| User on desktop | Mobile gate fails, hook returns `shouldShow: false`. |
| User in Facebook / Instagram in-app browser | iOS branch detects non-Safari UA, Android branch never gets `beforeinstallprompt`. Silent. |
| User opens site in two tabs simultaneously | Both arm timers. First one to dismiss wins; the second sees the new `dismissedAt` next time its timer would fire — actually, the state is read once at mount, so both could show. Acceptable: this is rare and dismissing one closes that one; the user can dismiss the other independently. Not worth a storage event listener. |
| Reduced motion | `useMotionVariants()` returns fade-only variants. |
| RTL | Close button on the visual left (Hebrew layout), text right-aligned naturally. |
| Already installed but localStorage was cleared | On next visit, gate 2 (`display-mode: standalone`) catches it because the user is browsing inside the installed app — gate fails. If they're in a regular browser tab on the same device where the app is installed elsewhere, gate 2 won't catch it; the prompt will reappear once and `beforeinstallprompt` won't fire (Chrome suppresses it for installed apps), so platform stays `none` and the sheet stays hidden. |

## Testing strategy

**Unit tests** (`tests/unit/useInstallPrompt.test.ts`):
- Cooldown logic: `shouldShow` returns false when `dismissedAt` is within 24h, true after.
- `installed: true` → `shouldShow` is always false regardless of cooldown.
- Mobile gate: jsdom matchMedia stub returning `false` keeps `shouldShow: false`.
- Platform detection: UA stub for iOS returns `platform: "ios"`; absence of `beforeinstallprompt` keeps Android in `platform: "none"`.
- `dismiss()` writes to localStorage with current timestamp.

**Manual / E2E:** PWA install flows cannot be exercised in headless Chromium reliably, so no Playwright coverage. Manual verification on:
- Android Chrome (real device) — confirm sheet, confirm install flow, confirm no re-prompt for 24h.
- iOS Safari (real device) — confirm sheet shows instructions, confirm "Add to Home Screen" works after following them, confirm no re-prompt for 24h.
- Desktop Chrome — confirm sheet never shows.
- Facebook in-app browser — confirm sheet never shows.

## Visual identity compliance

- No emoji anywhere — all glyphs come from `lucide-react` SVG (per `feedback_no_emoji_svg`).
- Sprout palette: green primary `#22C55E` for accents and CTAs (per `project_visual_identity`).
- Heebo type family inherited from root.
- Minimum 16px font enforced by the global CSS overrides in `src/styles/index.css`.

## Open questions

None at design-approval time.
