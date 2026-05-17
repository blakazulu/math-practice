# Frontend Polish Pass — Design Spec

**Date:** 2026-05-17
**Scope:** All 11 pages + 14 shared components
**Direction:** Playful + alive, within the existing Sprout identity
**Status:** Approved by user

## Goal

Elevate the math-practice app from "clean and functional" to "amazing and alive" while:

1. Preserving the Sprout palette and Heebo type system locked in memory.
2. Holding the 16px font-size floor on every text element.
3. Auditing and fixing real mobile responsiveness issues (not preemptive guessing).
4. Using no emoji — SVG icons only (lucide-react + hand-crafted ornaments).
5. Respecting `prefers-reduced-motion` for all animation.

## Non-goals

- Net-new features, new routes, new data shapes.
- Changing the question bank, store slices, or session/exam flow logic.
- New dependencies beyond what's installed (`framer-motion`, `lucide-react`, `react-katex`, `katex`, `zustand`, `react-router-dom`).

## Section A — Foundation

### A1. Atmospheric backgrounds

- **Sprout-mark pattern.** A single inline SVG (one sprout glyph, 24×24) tiled at 4% opacity as the body backdrop. Applied via a CSS background-image on `html, body` so every page inherits. Mask out where content sits to keep it from competing with text.
- **Hero gradient mesh.** A reusable React component `<HeroBackdrop />` that renders a radial gradient from `#DCFCE7` → `#F0FDF4` → `white` (top-right bright spot, fades to white at the fold). Used on Landing hero, Home hero, Welcome card, and ExamResults trophy card.
- **Grain overlay.** A `<GrainOverlay />` component using inline SVG `<feTurbulence>` fractal noise at 1% opacity, `position: fixed`, `pointer-events: none`, z-index below all content. Applied once at the App root.

### A2. Motion system (Framer Motion)

The dependency is already installed and unused. Standardize on a small set of motion presets exported from `src/lib/motion.ts`:

- `pageEnter`: parent `staggerChildren: 0.04, delayChildren: 0.05`. Fires once on route mount only — wrapped at the page root, not on individual cards across re-renders.
- `riseIn`: child `initial { y: 8, opacity: 0 }, animate { y: 0, opacity: 1 }, transition: { duration: 0.25 }`.
- `cardHover`: `whileHover: { y: -2 }, whileTap: { scale: 0.98 }`.
- `slideInRTL`: `initial { x: 12, opacity: 0 }, animate { x: 0, opacity: 1 }` (right→left for RTL).
- `springStamp`: `initial { scale: 0, rotate: -15 }, animate { scale: 1, rotate: 0 }, transition: { type: 'spring', stiffness: 380, damping: 18 }`.

All presets check `useReducedMotion()` and degrade to instant or fade-only.

### A3. Magnetic CTA hover (desktop only)

A `useMagnetic(ref, { max: 4 })` hook tracks pointer position over the button and translates it by a clamped vector. Disabled on touch devices via `(pointer: coarse)` media query and on `prefers-reduced-motion`.

### A4. Animated counters

`<CountUp value={n} duration={600} />` component using requestAnimationFrame. Used wherever a number reflects user progress: stats pills, results pages, topic mastery percentages. Skips animation on initial mount for cached values; only animates on change.

### A5. New design tokens (extend `tailwind.config.ts`)

```
boxShadow:
  card: "0 1px 3px rgba(15,26,20,0.04), 0 1px 2px rgba(15,26,20,0.03)"
  card-hover: "0 8px 24px rgba(15,26,20,0.06), 0 2px 6px rgba(15,26,20,0.04)"
  glow: "0 0 0 3px rgba(34,197,94,0.18), 0 0 24px rgba(34,197,94,0.15)"

keyframes:
  bob: small 2s y-translation (-2px → 0 → -2px)
  pulse-glow: 1.4s scale 1↔1.04 + shadow expand
  confetti-pop: 900ms scale 0→1, opacity 1→0, y -40, rotate ±30°
  ring-sweep: 2s rotate(360deg) on a conic-gradient ring (timer warning)

animation:
  bob: bob 2s ease-in-out infinite
  pulse-glow: pulse-glow 1.4s ease-in-out infinite
  ring-sweep: ring-sweep 2s linear infinite
```

### A6. Confetti

A `<Confetti trigger={key} />` component that, when `trigger` increments, dispatches 16 inline SVG particles (mix of brand-500 stars and brand-200 sprout leaves) with randomized angle/distance, animated via `confetti-pop` keyframe. No external library. Hidden under `prefers-reduced-motion`.

Triggers:

- Practice session results with ≥80% first-try correct.
- Exam results with ≥80% score.
- Streak ticking over to 7 days on Home mount (one-shot per streak).

## Section B — Shared component upgrades

Each item below describes the upgrade in terms of the file that owns it.

### B1. `Logo.tsx`

Adds an inline SVG sprout mark (12×12, brand-500) before the Hebrew wordmark. Hover triggers the `bob` animation on the mark only, not the text. Keeps the current text weight and tracking.

### B2. `PageHeader.tsx`

- Back-arrow becomes a circular button (`rounded-full`, `bg-white`, `border border-brand-100`, `hover:bg-brand-50`, `hover:border-brand-200`).
- Title fades in with `riseIn` on mount.
- Right-slot wraps in a flex row that gains `overflow-x-auto snap-x` and `flex-nowrap` on `< sm` to handle crowded pills.
- Title gets `max-w-[55vw] sm:max-w-none truncate` to prevent overflow with right-slot content on narrow screens.

### B3. `StatPill.tsx`

- Background changes from flat to a soft horizontal gradient (variant-specific):
  - star: `from-warn-50 to-warn-100`
  - streak: `from-danger-50 to-danger-100/60`
  - today: `from-brand-50 to-brand-100`
- Number renders through `<CountUp>`.
- On value increment, pill briefly scales to 1.06 then back (300ms), and emits a glow shadow.
- Streak variant gains an optional `<Sparkline>` (B14) showing last 7 days.

### B4. `btn-primary` (CSS in `styles/index.css`)

- Keeps the offset shadow.
- Adds `transition-transform` for magnetic translation (applied via inline style by `useMagnetic`).
- Adds `focus-visible:shadow-glow` for keyboard focus.
- On `active:`, briefly rotates `-1deg` (200ms transition) before settling.

### B5. `card` (CSS in `styles/index.css`)

- Resting shadow becomes `shadow-card`.
- Adds `hover:shadow-card-hover` and `transition-shadow duration-200`.
- New optional class `card-warm` swaps border to `border-brand-100/60` for the softer mint-toned surface variant.

### B6. `QuestionCard.tsx`

- Mounts with `slideInRTL` (12px right→left, RTL-correct).
- Tries-indicator dots are individually animated (scale 1 → 0.9 → 1 on consume).
- Image gets a 2px `ring-brand-100` and fades in on `onLoad`.

### B7. `OptionGrid.tsx`

- Options render in via `staggerChildren: 0.04`, child `riseIn`.
- Correct reveal: target option triggers `pulse-glow` once + a 4-particle sprout-leaf burst from its center (reuses confetti machinery, smaller).
- Wrong answer: keeps current shake; adds a fading red ring (300ms).
- Adds `min-h-[64px]` to options so KaTeX expressions don't cause uneven row heights.

### B8. `HintCard.tsx`

- Text reveal: typewriter via incremental character append (~600ms total, ~0.5ch/frame). Skip on `prefers-reduced-motion` — render immediately.
- Lightbulb icon: single flicker (`opacity: 1 → 0.4 → 1`, 200ms) on appear.

### B9. `ExplanationCard.tsx`

- Check icon stamps in via `springStamp`.
- Explanation paragraphs split on sentence boundary; render with `staggerChildren: 0.06`, child `riseIn`.

### B10. `TriesIndicator.tsx`

- Dots become small `<Leaf />` SVGs (one inline path, 12×12).
- "Used" leaves rotate to 30deg and desaturate to `text-faint` instead of switching to red — softer signal.

### B11. `StarBurst.tsx`

- Expands from a single flying star to a 7-star radial burst.
- Each star animates from center with randomized angle (offset by 360/7°), distance 60–90px, scale 0.8 → 1.1 → 0.9, opacity 0 → 1 → 0.
- Reduced-motion fallback: single fading star (current behavior).

### B12. `ExamGrid.tsx`

- Current cell border uses an animated conic-gradient ring (continuous slow sweep, ~3s).
- Flagged cells get an inline bookmark SVG (ribbon) in the top-left corner instead of a corner flag.
- Answered cells gain a tiny check SVG fade-in.

### B13. `ExamTimer.tsx`

- `remainingSec ≤ 60`: pulses `bg-danger-50 → bg-danger-100`, applies `ring-sweep` to a 2px ring.
- `remainingSec ≤ 10`: adds shake at 5s intervals (`animate-shake` for 350ms every 5s via setInterval).
- Reduced-motion: no pulse, no shake — only the red color change remains.

### B14. New components

- **`src/components/Sparkline.tsx`** — Inline SVG, 7 points, takes `data: number[]` and `color: string`. Used inside the streak StatPill on Home.
- **`src/components/Ornament.tsx`** — Renders one of `{ "sprout-mark", "compass", "brain-wave", "leaf-cluster" }` as inline SVG. Used decoratively in category headers and hero blocks.
- **`src/components/HeroBackdrop.tsx`** — Renders the radial gradient mesh. Configurable position prop.
- **`src/components/GrainOverlay.tsx`** — Fixed fractal-noise overlay. Mounted once at App root.
- **`src/components/Confetti.tsx`** — Particle burst (see A6).
- **`src/components/CountUp.tsx`** — Number animation (see A4).
- **`src/lib/motion.ts`** — Centralized Framer Motion variants and `useMagnetic` hook.
- **`src/lib/icons/ornaments.tsx`** — Hand-crafted SVG path data for the ornament family.

### B15. `Confirm.tsx`

- Modal enter: `< sm` slides up 24px; `≥ sm` scales from 0.96 + fades.
- Backdrop: `backdrop-blur-sm` in addition to current dim.
- Reduced-motion: instant.

## Section C — Per-page elevation

### C1. `LandingPage.tsx`

- Hero block sits over `<HeroBackdrop position="top-right" />`.
- Behind the gradient text, six drifting `<Ornament name="leaf-cluster" />` SVGs with randomized animation-delays and slow `bob`.
- Sample-question card tilts `rotate(-2deg)` at rest with a soft `shadow-card`. Hover straightens to 0.
- "How it works" feature cards reveal in a diagonal cascade on scroll, via IntersectionObserver (`viewport.once`, `staggerChildren: 0.08`).
- Final CTA section gets a subtle horizontal scroll-parallax effect (the headline shifts at 0.95× scroll speed). Reduced-motion: disabled.

### C2. `WelcomePage.tsx`

- Heading "ברוכים הבאים." gets `<HeroBackdrop position="center-top" />` behind it.
- Existing-user list items: avatar circle has a faint aurora pulse (slow `pulse-glow` at 50% opacity).
- Name input: animated underline (0→full width, 240ms) on focus.
- Submit button uses the magnetic primary.

### C3. `HomePage.tsx`

- Greeting "שלום {name}" types in (chars-stagger 30ms, total ~600ms; skip on reduced-motion).
- Mode picker becomes asymmetric: primary card (`תרגול לפי נושא`) is `sm:col-span-2` on small, takes 60% of width on `md+`. Secondary card shows last-exam-score preview if user has any attempts.
- Review-queue banner: `pulse-glow` continuous, low intensity.
- Category sections: each gets a small `<Ornament>` prefix beside the section label.
- Topic cards: stack a small SVG radial progress ring (32×32) at the top-right, replacing the inline progress bar at the bottom.

### C4. `TopicPickerPage.tsx`

- Each category section gains a hero strip: section label + ornament (compass for math, brain-wave for logic).
- Topic cards become two-row: name on top, count on the right, progress ring at the bottom-right (16×16 mini ring).
- Cards use the `card-warm` variant for a softer surface.

### C5. `PracticePage.tsx` & `C5b. ReviewPage.tsx`

(Shared layout via the existing components.)

- Sticky bottom progress bar (3px tall, `bg-brand-500`), width = `(index+1)/queue.length × 100%`, transitions smoothly.
- Correct first-try: full `<StarBurst>` + a 300ms screen-edge green flash (a fixed `ring-inset` on `<main>` with `ring-brand-500/50`).
- "Next" navigation triggers `slideInRTL` on the new QuestionCard.

### C6. `PracticeResultsPage.tsx`

- "כוכבים מפגש זה" number rendered through `<CountUp>` at 4xl.
- New: SVG donut chart (radius 60, stroke 12, sweep animates 0 → pct over 1s) showing first-try-correct percentage.
- Confetti fires on mount if `firstTryCorrect / answered ≥ 0.8`.
- Both CTAs become magnetic.

### C7. `ExamPickerPage.tsx`

- Each exam row carries a small `<Sparkline>` showing the user's last 5 attempt scores (if any).
- Top-scorer (100%) rows get a small medal SVG before the name.
- Timer checkbox becomes a polished iOS-style toggle (16px label preserved, the track is 36×20).

### C8. `ExamPage.tsx`

- Above the question, a thin stat row: `answered / queue.length`, `flagged count`, `remaining count`. RTL row, 3 mini-pills.
- Sidebar gains a vertical answered-percentage rail (4px wide, fills bottom→top) next to the question grid.
- Finish-confirm dialog now shows flagged count and unanswered count explicitly.

### C9. `ExamResultsPage.tsx`

- Trophy stamps in (`springStamp`).
- Score `{score}/{total}` uses `<CountUp>`.
- Confetti fires on mount if `pct ≥ 80`.
- Question detail rows get a colored 4px left rail (`border-r-4 border-brand-500` for correct, `border-danger-600` for wrong — RTL-correct).
- If exam pushed N questions to review, show a soft toast banner: "{N} שאלות נוספו לחזרה".

### C10. `SettingsPage.tsx`

- Section cards lift on hover.
- Danger section gets a `bg-danger-50/40` wash.
- "Switch user" button on desktop reveals a tiny preview list (max 3 names + counts) in a popover on hover. Mobile: no popover, click-through as today.

## Section D — Mobile audit & fixes

### D1. Concrete fixes from spec review

- **Landing.Hero**: force `OptionGrid`-like sample-card list to single column under 380px (CSS: `@media (max-width: 379px) { grid-cols-1 }`).
- **Home.header**: when stat pills wrap, switch to `overflow-x-auto snap-x flex-nowrap` row on `< sm`.
- **Exam.aside**: on `< lg`, the grid collapses above the question; confirm it doesn't double scroll and add `max-h-[40vh] overflow-y-auto` to the grid when stacked.
- **OptionGrid**: add `min-h-[64px]` (already in B7).
- **TopicPicker & Home category grids**: switch fixed breakpoint grid to `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` so tablet (768px) doesn't orphan cards.
- **PageHeader**: `max-w-[55vw] sm:max-w-none truncate` on title (already in B2).

### D2. Audit protocol

For each page, test at 360px, 414px, 768px, 1024px:

- No horizontal scroll.
- Touch targets ≥ 44×44px (Apple HIG floor; Lucide icons at 16/20px need ≥ 24px of padding).
- 16px floor on every visible text node.
- KaTeX math doesn't overflow its container (KaTeX is LTR inside RTL paragraphs — already handled by global CSS).

### D3. 16px floor preservation

- Current `text-xs` and `text-sm` overrides in `styles/index.css` (lines 16–23) stay.
- All new components use `text-base` and up.
- Audit any inline `style={{ fontSize: ... }}` (none currently exist) and `text-[…]` arbitrary values (none currently exist) — block any from being added.

## Implementation order

The implementation plan (written next, via the `writing-plans` skill) will sequence this work into isolatable steps. Suggested grouping:

1. **Phase 1 — Foundation** (A1, A2, A4, A5, A6, B14 new components, B4 button, B5 card). No page changes yet.
2. **Phase 2 — Shared components** (B1–B13, B15). Pages inherit improvements automatically.
3. **Phase 3 — Per-page moves** (C1–C10). One commit per page.
4. **Phase 4 — Mobile audit** (D1–D3). Test at all breakpoints, fix what's broken, file findings in commit messages.
5. **Phase 5 — Code review + push.** Run `superpowers:requesting-code-review`, address feedback, commit, then ask user to confirm before pushing to `main` (push is shared-state and gets a final confirm even though pre-authorized at brainstorm time).

## Acceptance criteria

- No emoji or Unicode emoticons in any source file.
- No text rendered below 16px (audit via DevTools at all breakpoints).
- All animation respects `prefers-reduced-motion` (verified in DevTools rendering panel).
- No regressions in existing 38 vitest tests.
- No new dependencies in `package.json`.
- All 11 pages tested manually at 360px, 414px, 768px, 1024px, 1440px.
- Lighthouse Performance score on Landing page ≥ 90 (no large new bundles).

## Risks

- **Framer Motion bundle weight.** Already a dep, but currently unused — turning it on increases initial JS. Mitigation: import only what we use (`motion`, `AnimatePresence`, `useReducedMotion`), tree-shaking is good with the v12 modular ESM build.
- **Typewriter / staggered text on long Hebrew strings** may feel laggy on low-end devices. Mitigation: cap typewriter duration at 600ms total regardless of length; truncate stagger if explanation has more than 6 sentences.
- **Conic-gradient ring (B12)** isn't supported on very old Safari. Mitigation: fallback to a static brand-500 border via `@supports (background: conic-gradient(red, blue))`.
- **Sprout-mark pattern at 4% on white** may be invisible on cheap LCDs. Mitigation: ship at 6% if user feedback says so; tunable via a CSS variable.

## Out of scope (explicitly not changing)

- Question content, store slices, persistence schema.
- Route paths, URL slugs, the BrowserRouter setup.
- Hebrew text content (copy stays the same).
- Existing test suite — tests get updated only if a refactor breaks them.
- Adding analytics, error tracking, or telemetry.
