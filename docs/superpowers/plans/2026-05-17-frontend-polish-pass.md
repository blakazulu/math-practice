# Frontend Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the math-practice app from clean-and-functional to alive-and-memorable across all 11 pages and 14 shared components, while preserving the Sprout identity, the 16px font floor, and zero-emoji rule.

**Architecture:** Foundation-first — add design tokens, a motion library, and a small set of reusable atmospheric/decorative components before touching pages. Then upgrade shared components (auto-propagate). Then per-page elevation moves. Then mobile audit. Then code review + push.

**Tech Stack:** React 18, TypeScript 5.6, Tailwind 3.4, Framer Motion 12 (installed but unused), lucide-react, KaTeX, Zustand, react-router-dom 6, Vite 5, Vitest 3, Playwright. **No new dependencies.**

**Verification per task:** TDD doesn't apply to visual changes — instead each task ends with:

1. `npm run lint` clean.
2. `npm test` green (the existing 38 tests must keep passing — they cover logic, not visuals).
3. `npm run build` succeeds.
4. Manual visual check in `npm run dev` at the affected route.
5. Commit.

**Spec:** `docs/superpowers/specs/2026-05-17-frontend-polish-pass-design.md`

---

## Phase 1 — Foundation

### Task 1.1: Extend Tailwind config

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Open `tailwind.config.ts` and add the new tokens to the `theme.extend` block.**

Add to `boxShadow`:

```ts
boxShadow: {
  cta: "0 4px 0 #15803D",
  "cta-pressed": "0 2px 0 #15803D",
  card: "0 1px 3px rgba(15,26,20,0.04), 0 1px 2px rgba(15,26,20,0.03)",
  "card-hover": "0 8px 24px rgba(15,26,20,0.06), 0 2px 6px rgba(15,26,20,0.04)",
  glow: "0 0 0 3px rgba(34,197,94,0.18), 0 0 24px rgba(34,197,94,0.15)",
},
```

Add to `keyframes`:

```ts
bob: {
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(-2px)" },
},
"pulse-glow": {
  "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(34,197,94,0.4)" },
  "50%": { transform: "scale(1.04)", boxShadow: "0 0 0 8px rgba(34,197,94,0)" },
},
"confetti-pop": {
  "0%": { opacity: "0", transform: "translate(0,0) scale(0.4) rotate(0deg)" },
  "20%": { opacity: "1" },
  "100%": { opacity: "0", transform: "translate(var(--cx,0px), var(--cy,-40px)) scale(1) rotate(var(--cr,30deg))" },
},
"ring-sweep": {
  "0%": { transform: "rotate(0deg)" },
  "100%": { transform: "rotate(360deg)" },
},
"underline-grow": {
  "0%": { transform: "scaleX(0)" },
  "100%": { transform: "scaleX(1)" },
},
"flicker": {
  "0%, 100%": { opacity: "1" },
  "50%": { opacity: "0.4" },
},
```

Add to `animation`:

```ts
bob: "bob 2s ease-in-out infinite",
"pulse-glow": "pulse-glow 1.4s ease-in-out infinite",
"confetti-pop": "confetti-pop 900ms ease-out forwards",
"ring-sweep": "ring-sweep 2s linear infinite",
"underline-grow": "underline-grow 240ms ease-out forwards",
flicker: "flicker 200ms ease-in-out",
```

- [ ] **Step 2: Verify build.**

Run: `npm run build`
Expected: PASS, no Tailwind errors.

- [ ] **Step 3: Commit.**

```bash
git add tailwind.config.ts
git commit -m "feat(design): add motion tokens and shadow scale"
```

---

### Task 1.2: Motion library

**Files:**
- Create: `src/lib/motion.ts`

- [ ] **Step 1: Create the file with shared Framer Motion variants.**

```ts
import { useReducedMotion, type Variants } from "framer-motion";

export const pageEnter: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

export const riseIn: Variants = {
  hidden: { y: 8, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

export const slideInRTL: Variants = {
  hidden: { x: 12, opacity: 0 },
  show: { x: 0, opacity: 1, transition: { duration: 0.28, ease: "easeOut" } },
};

export const springStamp: Variants = {
  hidden: { scale: 0, rotate: -15, opacity: 0 },
  show: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 380, damping: 18 },
  },
};

export const cardHover = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.18 },
};

/** Returns variants that fade-only when reduced motion is preferred. */
export function useMotionVariants(v: Variants): Variants {
  const reduced = useReducedMotion();
  if (!reduced) return v;
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.15 } },
  };
}
```

- [ ] **Step 2: Verify with build.**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/lib/motion.ts
git commit -m "feat(motion): add shared Framer Motion variants"
```

---

### Task 1.3: `useMagnetic` hook

**Files:**
- Create: `src/lib/useMagnetic.ts`

- [ ] **Step 1: Create the hook.**

```ts
import { useEffect, useRef } from "react";

interface Options {
  max?: number;
  strength?: number;
}

/**
 * Attach to a button element to add a pointer-magnetic effect on desktop.
 * Disabled on touch devices and when prefers-reduced-motion is set.
 */
export function useMagnetic<T extends HTMLElement>(opts: Options = {}) {
  const ref = useRef<T | null>(null);
  const max = opts.max ?? 4;
  const strength = opts.strength ?? 0.25;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduced) return;

    function onMove(e: PointerEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      const tx = Math.max(-max, Math.min(max, dx));
      const ty = Math.max(-max, Math.min(max, dy));
      el.style.transform = `translate(${tx}px, ${ty}px)`;
    }
    function onLeave() {
      if (!el) return;
      el.style.transform = "translate(0,0)";
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [max, strength]);

  return ref;
}
```

- [ ] **Step 2: Verify build.**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/lib/useMagnetic.ts
git commit -m "feat(motion): add useMagnetic hook"
```

---

### Task 1.4: `CountUp` component

**Files:**
- Create: `src/components/CountUp.tsx`
- Test: `tests/unit/CountUp.test.tsx`

- [ ] **Step 1: Write a minimal test that verifies the component renders the final value.**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CountUp } from "@/components/CountUp";

describe("CountUp", () => {
  it("renders the value", () => {
    render(<CountUp value={42} />);
    expect(screen.getByText(/^(\d+)$/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test (expect FAIL — file not yet created).**

Run: `npx vitest run tests/unit/CountUp.test.tsx`
Expected: FAIL, "Cannot find module".

- [ ] **Step 3: Implement the component.**

```tsx
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  className?: string;
}

export function CountUp({ value, duration = 600, className }: Props) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const from = prev.current;
    const to = value;
    if (reduced || from === to) {
      prev.current = to;
      setDisplay(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * eased);
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    prev.current = to;
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
```

- [ ] **Step 4: Run the test (expect PASS).**

Run: `npx vitest run tests/unit/CountUp.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/components/CountUp.tsx tests/unit/CountUp.test.tsx
git commit -m "feat(components): add CountUp"
```

---

### Task 1.5: `GrainOverlay`

**Files:**
- Create: `src/components/GrainOverlay.tsx`

- [ ] **Step 1: Implement.**

```tsx
export function GrainOverlay() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.012] mix-blend-multiply"
      width="100%"
      height="100%"
    >
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}
```

- [ ] **Step 2: Verify build.**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/GrainOverlay.tsx
git commit -m "feat(components): add GrainOverlay"
```

---

### Task 1.6: `HeroBackdrop`

**Files:**
- Create: `src/components/HeroBackdrop.tsx`

- [ ] **Step 1: Implement.**

```tsx
type Position = "top-right" | "center-top" | "top-left";

interface Props {
  position?: Position;
  className?: string;
}

export function HeroBackdrop({ position = "top-right", className = "" }: Props) {
  const pos =
    position === "top-right"
      ? "right-[-10%] top-[-20%]"
      : position === "top-left"
        ? "left-[-10%] top-[-20%]"
        : "left-1/2 -translate-x-1/2 top-[-15%]";

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className={`absolute ${pos} w-[80%] aspect-square rounded-full blur-3xl opacity-70`}
        style={{
          background:
            "radial-gradient(closest-side, #DCFCE7 0%, #F0FDF4 45%, rgba(255,255,255,0) 75%)",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build.**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/HeroBackdrop.tsx
git commit -m "feat(components): add HeroBackdrop"
```

---

### Task 1.7: `Confetti`

**Files:**
- Create: `src/components/Confetti.tsx`

- [ ] **Step 1: Implement.**

```tsx
import { useEffect, useMemo, useState } from "react";

interface Props {
  /** Increment to trigger a new burst. Pass 0 to mean "no burst yet". */
  trigger: number;
  /** Approximate number of particles. */
  count?: number;
}

interface Particle {
  id: number;
  cx: number;
  cy: number;
  rotate: number;
  kind: "star" | "leaf";
  color: string;
}

const COLORS = ["#22C55E", "#16A34A", "#BBF7D0", "#FEF08A", "#FACC15"];

function generate(count: number): Particle[] {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const distance = 70 + Math.random() * 50;
    return {
      id: i,
      cx: Math.cos(angle) * distance,
      cy: -Math.abs(Math.sin(angle) * distance) - 20,
      rotate: (Math.random() - 0.5) * 90,
      kind: Math.random() > 0.5 ? "star" : "leaf",
      color: COLORS[i % COLORS.length],
    };
  });
}

export function Confetti({ trigger, count = 16 }: Props) {
  const [active, setActive] = useState(false);
  const particles = useMemo(() => generate(count), [count, trigger]);

  useEffect(() => {
    if (trigger === 0) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 1100);
    return () => window.clearTimeout(t);
  }, [trigger]);

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
      <div className="relative w-0 h-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute animate-confetti-pop"
            style={{
              ["--cx" as string]: `${p.cx}px`,
              ["--cy" as string]: `${p.cy}px`,
              ["--cr" as string]: `${p.rotate}deg`,
            }}
          >
            {p.kind === "star" ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill={p.color}>
                <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.5 5.79 21l2.39-7.15L2 9.36h7.61L12 2z" />
              </svg>
            ) : (
              <svg width="12" height="14" viewBox="0 0 24 24" fill={p.color}>
                <path d="M12 2C6 4 3 9 4 16c0 4 3 6 8 6 0-7 2-12 8-14-3-4-6-6-8-6z" />
              </svg>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build.**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/Confetti.tsx
git commit -m "feat(components): add Confetti burst"
```

---

### Task 1.8: `Ornament` component + icon set

**Files:**
- Create: `src/components/Ornament.tsx`

- [ ] **Step 1: Implement with hand-crafted SVG paths.**

```tsx
type OrnamentName = "sprout-mark" | "compass" | "brain-wave" | "leaf-cluster";

interface Props {
  name: OrnamentName;
  size?: number;
  className?: string;
}

export function Ornament({ name, size = 24, className = "" }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };

  if (name === "sprout-mark") {
    return (
      <svg {...common}>
        <path d="M12 21V11" />
        <path d="M12 11c-3-1-5-3-5-7 4 0 5 3 5 7z" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 13c2-1 4-2 4-5-3 0-4 2-4 5z" fill="currentColor" fillOpacity="0.15" />
      </svg>
    );
  }
  if (name === "compass") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9l-3 8-3-8 6 0z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    );
  }
  if (name === "brain-wave") {
    return (
      <svg {...common}>
        <path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
      </svg>
    );
  }
  // leaf-cluster
  return (
    <svg {...common}>
      <path d="M12 22c-4-3-7-7-6-13 5-1 9 2 10 8" fill="currentColor" fillOpacity="0.12" />
      <path d="M12 22c4-3 7-7 6-13-5-1-9 2-10 8" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}
```

- [ ] **Step 2: Verify build.**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/Ornament.tsx
git commit -m "feat(components): add Ornament SVG family"
```

---

### Task 1.9: `Sparkline`

**Files:**
- Create: `src/components/Sparkline.tsx`

- [ ] **Step 1: Implement.**

```tsx
interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 56,
  height = 16,
  color = "currentColor",
  className,
}: Props) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Verify build.**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/Sparkline.tsx
git commit -m "feat(components): add Sparkline"
```

---

### Task 1.10: Upgrade CSS — `card`, `btn-primary`, body backdrop

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: Update the `@layer base` and `@layer components` blocks.**

Replace the existing `body` styles with:

```css
@layer base {
  html,
  body {
    @apply font-sans antialiased text-ink bg-white;
    direction: rtl;
    font-size: 16px;
    line-height: 1.55;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><g fill='%2322C55E' fill-opacity='0.05'><path d='M24 32V20'/><path d='M24 22c-3-1-5-3-5-6 4 0 5 3 5 6z'/><path d='M24 22c3-1 5-3 5-6-4 0-5 3-5 6z'/></g></svg>");
    background-repeat: repeat;
    background-size: 96px 96px;
  }

  .text-xs {
    font-size: 16px !important;
    line-height: 1.4 !important;
  }
  .text-sm {
    font-size: 16px !important;
    line-height: 1.5 !important;
  }

  .katex,
  .katex-display {
    direction: ltr;
    unicode-bidi: isolate;
  }
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
}
```

Replace the `@layer components` block:

```css
@layer components {
  .h1-hero {
    @apply text-3xl sm:text-4xl font-black tracking-tightest leading-[1.05] text-ink;
  }

  .h1-hero-accent {
    background-image: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }

  .section-label {
    @apply uppercase tracking-[0.09em] font-bold text-brand-600;
    font-size: 16px;
  }

  .btn-primary {
    @apply inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-500 text-white font-bold shadow-cta active:shadow-cta-pressed active:translate-y-[2px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:shadow-glow;
  }
  .btn-primary:active {
    transform: translateY(2px) rotate(-1deg);
  }

  .btn-secondary {
    @apply inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-ink font-semibold border border-border hover:border-brand-300 transition-colors;
  }

  .card {
    @apply rounded-2xl border border-border bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover;
  }

  .card-warm {
    @apply border-brand-100 bg-white;
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-shake,
  .animate-star-fly,
  .animate-bob,
  .animate-pulse-glow,
  .animate-confetti-pop,
  .animate-ring-sweep,
  .animate-underline-grow,
  .animate-flicker {
    animation: none !important;
  }
  .btn-primary:active {
    transform: translateY(2px) !important;
  }
}
```

- [ ] **Step 2: Add a `brand-300` color to `tailwind.config.ts` since `.btn-secondary` references `border-brand-300`.**

Add to `colors.brand`:

```ts
300: "#86EFAC",
```

- [ ] **Step 3: Verify build & dev render.**

Run: `npm run build`
Expected: PASS.

Run `npm run dev`, open `http://localhost:5173/`, confirm:
- A very faint sprout pattern on the page background.
- The "התחילי כעת" button (`btn-secondary`) hovers to a brand border tint.
- The primary CTA glows on focus.

- [ ] **Step 4: Commit.**

```bash
git add src/styles/index.css tailwind.config.ts
git commit -m "style(theme): upgrade card/btn primitives + body backdrop"
```

---

### Task 1.11: Wire `GrainOverlay` at App root

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Wrap the router with the overlay and the grain.**

```tsx
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useStore } from "@/store";
import { GrainOverlay } from "@/components/GrainOverlay";

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

- [ ] **Step 2: Verify with `npm run dev`.**

Confirm the grain is barely visible but present (DevTools → reduce zoom on hero).

- [ ] **Step 3: Commit.**

```bash
git add src/app/App.tsx
git commit -m "feat(app): mount GrainOverlay at root"
```

---

## Phase 2 — Shared component upgrades

### Task 2.1: Upgrade `Logo`

**Files:**
- Modify: `src/components/Logo.tsx`

- [ ] **Step 1: Replace contents.**

```tsx
import { Ornament } from "./Ornament";

interface Props {
  className?: string;
}

export function Logo({ className }: Props) {
  return (
    <span
      className={
        "group inline-flex items-center gap-1.5 font-black text-xl tracking-tightest text-ink " +
        (className ?? "")
      }
    >
      <span className="text-brand-500 group-hover:animate-bob inline-block">
        <Ornament name="sprout-mark" size={18} />
      </span>
      חשבונייה<span className="text-brand-500">.</span>
    </span>
  );
}
```

- [ ] **Step 2: Run lint + tests + build.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/Logo.tsx
git commit -m "feat(logo): inline sprout mark with hover bob"
```

---

### Task 2.2: Upgrade `PageHeader`

**Files:**
- Modify: `src/components/PageHeader.tsx`

- [ ] **Step 1: Replace contents.**

```tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { riseIn, useMotionVariants } from "@/lib/motion";

interface Props {
  backTo?: string;
  title?: string;
  rightSlot?: ReactNode;
}

export function PageHeader({ backTo, title, rightSlot }: Props) {
  const v = useMotionVariants(riseIn);
  return (
    <header className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {backTo ? (
          <Link
            to={backTo}
            className="rounded-full p-2 bg-white border border-brand-100 hover:bg-brand-50 hover:border-brand-200 focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
            aria-label="חזרה"
          >
            <ChevronRight size={20} />
          </Link>
        ) : (
          <Logo />
        )}
        {title && (
          <motion.h1
            initial="hidden"
            animate="show"
            variants={v}
            className="text-lg font-bold truncate max-w-[55vw] sm:max-w-none"
          >
            {title}
          </motion.h1>
        )}
      </div>
      {rightSlot && (
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto snap-x flex-nowrap max-w-[55vw] sm:max-w-none">
          {rightSlot}
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Run lint + tests + build.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/PageHeader.tsx
git commit -m "feat(header): rounded back button + mobile title cap"
```

---

### Task 2.3: Upgrade `StatPill`

**Files:**
- Modify: `src/components/StatPill.tsx`

- [ ] **Step 1: Replace contents.**

```tsx
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Star, Flame } from "lucide-react";
import { CountUp } from "./CountUp";
import { Sparkline } from "./Sparkline";

type Variant = "star" | "streak" | "today";

interface Props {
  variant: Variant;
  value: number;
  sparkline?: number[];
}

const styles: Record<
  Variant,
  { bg: string; fg: string; icon: ReactNode | null; label: string }
> = {
  star: {
    bg: "bg-gradient-to-l from-warn-50 to-warn-100",
    fg: "text-warn-700",
    icon: <Star size={14} />,
    label: "כוכבים",
  },
  streak: {
    bg: "bg-gradient-to-l from-danger-50 to-danger-100/60",
    fg: "text-danger-600",
    icon: <Flame size={14} />,
    label: "רצף",
  },
  today: {
    bg: "bg-gradient-to-l from-brand-50 to-brand-100",
    fg: "text-brand-700",
    icon: null,
    label: "היום",
  },
};

export function StatPill({ variant, value, sparkline }: Props) {
  const s = styles[variant];
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 300);
      prev.current = value;
      return () => window.clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold transition-all duration-300 ${s.bg} ${s.fg} ${
        pulse ? "scale-[1.06] shadow-glow" : "scale-100"
      }`}
    >
      {s.icon}
      <CountUp value={value} className="tabular-nums" />
      <span className="opacity-80">{s.label}</span>
      {sparkline && sparkline.length > 0 && (
        <Sparkline data={sparkline} className="opacity-70" />
      )}
    </span>
  );
}
```

- [ ] **Step 2: Add `danger-100` to Tailwind config.**

Modify `tailwind.config.ts`, add to `colors.danger`:

```ts
100: "#FEE2E2",
```

- [ ] **Step 3: Verify.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add src/components/StatPill.tsx tailwind.config.ts
git commit -m "feat(statpill): gradient bg, count-up, glow on change"
```

---

### Task 2.4: Upgrade `TriesIndicator`

**Files:**
- Modify: `src/components/TriesIndicator.tsx`

- [ ] **Step 1: Replace with sprout leaves.**

```tsx
interface Props {
  used: 0 | 1 | 2 | 3;
}

export function TriesIndicator({ used }: Props) {
  const dots = [0, 1, 2];
  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`${3 - used} ניסיונות נותרו`}
    >
      {dots.map((i) => {
        const consumed = i < used;
        return (
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            className={`transition-all duration-300 ${
              consumed
                ? "text-faint rotate-[30deg] scale-90"
                : "text-brand-500 scale-100"
            }`}
            aria-hidden
          >
            <path
              d="M12 21V11c-3-1-5-3-5-7 4 0 5 3 5 7zm0-8c2-1 4-2 4-5-3 0-4 2-4 5z"
              fill="currentColor"
            />
          </svg>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify build.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/TriesIndicator.tsx
git commit -m "feat(tries): sprout leaves that wilt on consume"
```

---

### Task 2.5: Upgrade `QuestionCard`

**Files:**
- Modify: `src/components/QuestionCard.tsx`

- [ ] **Step 1: Replace contents to add the slide-in mount.**

```tsx
import type { ReactNode } from "react";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import type { RawQuestion } from "@/data/types";
import { InlineMath } from "@/lib/katex";
import { TriesIndicator } from "./TriesIndicator";
import { slideInRTL, useMotionVariants } from "@/lib/motion";

interface Props {
  question: RawQuestion;
  position?: { index: number; total: number };
  used?: 0 | 1 | 2 | 3;
  topRight?: ReactNode;
  image?: { src: string; alt: string } | null;
  needsImage?: boolean;
}

export function QuestionCard({
  question,
  position,
  used,
  topRight,
  image,
  needsImage,
}: Props) {
  const v = useMotionVariants(slideInRTL);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.section
      key={question.id}
      initial="hidden"
      animate="show"
      variants={v}
      className="card p-5 sm:p-6"
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {position && (
            <span className="text-sm font-bold text-brand-600 tabular-nums">
              שאלה {position.index + 1} / {position.total}
            </span>
          )}
          {used !== undefined && <TriesIndicator used={used} />}
        </div>
        {topRight}
      </header>

      {image ? (
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`mb-4 rounded-xl border border-border ring-2 ring-brand-100 max-w-full transition-opacity duration-300 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : needsImage ? (
        <div className="mb-4 rounded-xl border border-dashed border-border bg-hair text-muted p-6 flex flex-col items-center gap-2">
          <ImageOff size={28} />
          <span className="font-semibold">תמונה תתווסף בקרוב</span>
        </div>
      ) : null}

      <div className="text-base sm:text-lg leading-relaxed text-ink">
        <InlineMath text={question.question} />
      </div>
    </motion.section>
  );
}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/QuestionCard.tsx
git commit -m "feat(question): slide-in mount + image ring/fade"
```

---

### Task 2.6: Upgrade `OptionGrid`

**Files:**
- Modify: `src/components/OptionGrid.tsx`

- [ ] **Step 1: Replace contents to add stagger + reveal glow + min-h.**

```tsx
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import type { OptionLetter, RawQuestion } from "@/data/types";
import { InlineMath } from "@/lib/katex";
import { pageEnter, riseIn, useMotionVariants } from "@/lib/motion";

type Status =
  | "neutral"
  | "correct"
  | "wrong"
  | "revealed-correct"
  | "revealed-other"
  | "picked";

interface Props {
  question: RawQuestion;
  picked?: OptionLetter | null;
  revealed?: boolean;
  stickyWrong?: OptionLetter[];
  onPick?: (letter: OptionLetter) => void;
  disabled?: boolean;
}

export function OptionGrid({
  question,
  picked,
  revealed,
  stickyWrong = [],
  onPick,
  disabled,
}: Props) {
  const [shake, setShake] = useState<OptionLetter | null>(null);
  const [redRing, setRedRing] = useState<OptionLetter | null>(null);
  const child = useMotionVariants(riseIn);

  const letters = (["א", "ב", "ג", "ד"] as OptionLetter[]).filter(
    (l) => question.options[l] !== undefined,
  );
  const correctLetter = question.correct_letter;

  function statusFor(l: OptionLetter): Status {
    if (revealed) {
      if (correctLetter === l) return "revealed-correct";
      if (stickyWrong.includes(l)) return "wrong";
      return "revealed-other";
    }
    if (stickyWrong.includes(l)) return "wrong";
    if (picked === l) return "picked";
    return "neutral";
  }

  useEffect(() => {
    if (redRing) {
      const t = window.setTimeout(() => setRedRing(null), 300);
      return () => window.clearTimeout(t);
    }
  }, [redRing]);

  function handleClick(l: OptionLetter) {
    if (disabled || revealed || !onPick) return;
    if (stickyWrong.includes(l)) return;
    if (correctLetter && l !== correctLetter) {
      setShake(l);
      setRedRing(l);
      window.setTimeout(() => setShake(null), 400);
    }
    onPick(l);
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={pageEnter}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4"
    >
      {letters.map((l) => {
        const s = statusFor(l);
        const styles =
          s === "revealed-correct"
            ? "bg-brand-50 border-brand-500 ring-2 ring-brand-500 animate-pulse-glow"
            : s === "wrong"
              ? "bg-danger-50 border-danger-200 text-danger-600"
              : s === "picked"
                ? "bg-brand-50 border-brand-500"
                : s === "revealed-other"
                  ? "opacity-60"
                  : "hover:bg-brand-50/40";
        const isShaking = shake === l;
        const showRedRing = redRing === l;
        return (
          <motion.button
            key={l}
            variants={child}
            disabled={disabled || revealed}
            onClick={() => handleClick(l)}
            className={`card p-4 min-h-[64px] text-right flex items-start gap-3 transition-all ${styles} ${
              isShaking ? "animate-shake" : ""
            } ${showRedRing ? "ring-2 ring-danger-200" : ""} focus-visible:ring-2 focus-visible:ring-brand-500`}
          >
            <span
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                s === "revealed-correct"
                  ? "bg-brand-500 text-white"
                  : s === "wrong"
                    ? "bg-danger-600 text-white"
                    : s === "picked"
                      ? "bg-brand-500 text-white"
                      : "bg-hair text-ink"
              }`}
            >
              {s === "revealed-correct" || s === "picked" ? (
                <Check size={16} />
              ) : s === "wrong" ? (
                <X size={16} />
              ) : (
                l
              )}
            </span>
            <span className="flex-1 leading-relaxed">
              <InlineMath text={question.options[l] ?? ""} />
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/OptionGrid.tsx
git commit -m "feat(options): stagger in, pulse-glow on reveal, red ring fade"
```

---

### Task 2.7: Upgrade `HintCard`

**Files:**
- Modify: `src/components/HintCard.tsx`

- [ ] **Step 1: Add typewriter + flicker.**

```tsx
import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { InlineMath } from "@/lib/katex";

interface Props {
  text: string;
}

export function HintCard({ text }: Props) {
  const [shown, setShown] = useState(text);
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    if (!text) {
      setShown("");
      return;
    }
    setFlicker(true);
    const flickerT = window.setTimeout(() => setFlicker(false), 200);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text);
      return () => window.clearTimeout(flickerT);
    }

    const total = 600;
    const stepMs = Math.max(8, total / text.length);
    let i = 0;
    setShown("");
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, stepMs);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(flickerT);
    };
  }, [text]);

  if (!text) return null;

  return (
    <div className="mt-4 rounded-2xl bg-warn-50 border border-warn-200 p-4 flex gap-3 text-warn-700">
      <Lightbulb
        size={20}
        className={`shrink-0 mt-0.5 ${flicker ? "animate-flicker" : ""}`}
      />
      <p className="leading-relaxed">
        <InlineMath text={shown} />
      </p>
    </div>
  );
}

export function hintForLevel(explanation: string, level: 0 | 1 | 2 | 3): string {
  if (level <= 0 || !explanation) return "";
  const sentences = explanation
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return level >= 3 ? explanation : "";
  if (level === 1) return sentences.slice(0, 1).join(" ");
  if (level === 2) return sentences.slice(0, 2).join(" ");
  return explanation;
}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/HintCard.tsx
git commit -m "feat(hint): typewriter reveal + lightbulb flicker"
```

---

### Task 2.8: Upgrade `ExplanationCard`

**Files:**
- Modify: `src/components/ExplanationCard.tsx`

- [ ] **Step 1: Add spring stamp + paragraph stagger.**

```tsx
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { InlineMath } from "@/lib/katex";
import { pageEnter, riseIn, springStamp, useMotionVariants } from "@/lib/motion";

interface Props {
  correctAnswer: string;
  explanation: string;
}

export function ExplanationCard({ correctAnswer, explanation }: Props) {
  const stamp = useMotionVariants(springStamp);
  const child = useMotionVariants(riseIn);
  const sentences = explanation
    ? explanation.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="mt-4 rounded-2xl bg-brand-50 border border-brand-200 p-4">
      <div className="flex gap-2 items-center text-brand-700 font-bold mb-2">
        <motion.span initial="hidden" animate="show" variants={stamp}>
          <CheckCircle2 size={18} />
        </motion.span>
        <span>תשובה נכונה: </span>
        <span className="text-ink">
          <InlineMath text={correctAnswer} />
        </span>
      </div>
      {sentences.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={pageEnter}
          className="text-ink/90 leading-relaxed space-y-1"
        >
          {sentences.map((s, i) => (
            <motion.p key={i} variants={child}>
              <InlineMath text={s} />
            </motion.p>
          ))}
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/ExplanationCard.tsx
git commit -m "feat(explanation): spring stamp + paragraph stagger"
```

---

### Task 2.9: Upgrade `StarBurst`

**Files:**
- Modify: `src/components/StarBurst.tsx`

- [ ] **Step 1: Expand to 7-star radial burst.**

```tsx
import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface Props {
  triggerKey: number;
}

const STARS = 7;

export function StarBurst({ triggerKey }: Props) {
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (triggerKey === 0) return;
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 1300);
    return () => window.clearTimeout(t);
  }, [triggerKey]);

  if (!visible) return null;
  if (reduced) {
    return (
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <Star size={48} className="text-warn-700 fill-warn-200 animate-star-fly" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
      <div className="relative w-0 h-0">
        {Array.from({ length: STARS }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / STARS;
          const distance = 70 + (i % 3) * 12;
          const cx = Math.cos(angle) * distance;
          const cy = Math.sin(angle) * distance - 10;
          return (
            <span
              key={i}
              className="absolute animate-confetti-pop"
              style={{
                ["--cx" as string]: `${cx}px`,
                ["--cy" as string]: `${cy}px`,
                ["--cr" as string]: `${(i * 30) % 60 - 30}deg`,
              }}
            >
              <Star
                size={28}
                className="text-warn-700 fill-warn-200"
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/StarBurst.tsx
git commit -m "feat(starburst): 7-star radial burst + reduced-motion fallback"
```

---

### Task 2.10: Upgrade `ExamGrid`

**Files:**
- Modify: `src/components/ExamGrid.tsx`

- [ ] **Step 1: Add conic-gradient ring, bookmark, check icon.**

```tsx
import { Bookmark, Check } from "lucide-react";
import type { OptionLetter, QuestionId } from "@/data/types";

interface Props {
  queue: QuestionId[];
  picks: Record<QuestionId, OptionLetter | null>;
  flagged: Record<QuestionId, boolean>;
  currentIndex: number;
  onJump: (index: number) => void;
}

export function ExamGrid({ queue, picks, flagged, currentIndex, onJump }: Props) {
  return (
    <ol className="grid grid-cols-6 gap-1.5">
      {queue.map((id, i) => {
        const answered = picks[id] !== null;
        const isCurrent = i === currentIndex;
        const isFlag = flagged[id];
        return (
          <li key={id} className="relative">
            <button
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`שאלה ${i + 1}${answered ? ", נענתה" : ""}${isFlag ? ", מסומנת" : ""}`}
              className={`relative w-full aspect-square rounded-lg border text-sm font-bold tabular-nums focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isCurrent
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : answered
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-border bg-surface text-muted"
              }`}
            >
              {i + 1}
              {answered && !isCurrent && (
                <Check
                  size={10}
                  className="absolute bottom-0.5 right-0.5 text-white/80"
                />
              )}
            </button>
            {isCurrent && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-[-2px] rounded-lg p-[2px] animate-ring-sweep"
                style={{
                  background: `conic-gradient(from 0deg, #22C55E, rgba(34,197,94,0) 60%, #22C55E)`,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
            )}
            {isFlag && (
              <Bookmark
                size={12}
                className="absolute top-0 left-0 text-warn-700 fill-warn-200"
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/ExamGrid.tsx
git commit -m "feat(examgrid): conic sweep ring + bookmark flag + check"
```

---

### Task 2.11: Upgrade `ExamTimer`

**Files:**
- Modify: `src/components/ExamTimer.tsx`

- [ ] **Step 1: Add pulse + shake intervals.**

```tsx
import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  remainingSec: number;
  enabled: boolean;
  onTick: () => void;
}

export function ExamTimer({ remainingSec, enabled, onTick }: Props) {
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => tickRef.current(), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || remainingSec > 10) return;
    const id = window.setInterval(() => {
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
    }, 5000);
    return () => window.clearInterval(id);
  }, [enabled, remainingSec]);

  if (!enabled) return null;

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const low = remainingSec <= 60;

  return (
    <span
      role="timer"
      aria-live={low ? "polite" : "off"}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold tabular-nums transition-colors ${
        low ? "bg-danger-50 text-danger-600 animate-pulse-glow" : "bg-hair text-ink"
      } ${shake ? "animate-shake" : ""}`}
      aria-label={`זמן שנותר ${mm} דקות ${ss} שניות`}
    >
      <Clock size={14} />
      {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </span>
  );
}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/ExamTimer.tsx
git commit -m "feat(timer): pulse-glow under 60s + shake under 10s"
```

---

### Task 2.12: Upgrade `Confirm`

**Files:**
- Modify: `src/components/Confirm.tsx`

- [ ] **Step 1: Add motion + backdrop blur.**

```tsx
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({
  open,
  title,
  body,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="card p-6 max-w-md w-full shadow-xl rounded-t-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2">{title}</h2>
            {body && <p className="text-muted mb-4">{body}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={onCancel} className="btn-secondary">
                {cancelLabel}
              </button>
              <button
                ref={ref}
                onClick={onConfirm}
                className={
                  destructive
                    ? "btn-primary !bg-danger-600 shadow-[0_4px_0_#991B1B] active:shadow-[0_2px_0_#991B1B]"
                    : "btn-primary"
                }
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/Confirm.tsx
git commit -m "feat(confirm): slide-up mobile + scale desktop + blur backdrop"
```

---

## Phase 3 — Per-page elevation

> **Note:** These tasks add atmospheric backdrops, motion, and decorative SVG to specific pages. Each task is one page = one commit. Read the existing page file, apply the listed changes, verify visually.

### Task 3.1: `LandingPage`

**Files:**
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Add `HeroBackdrop` behind the hero, tilt the sample card, animate features on scroll.**

Make these changes:

1. Add imports:

```tsx
import { motion } from "framer-motion";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { Ornament } from "@/components/Ornament";
import { pageEnter, riseIn, useMotionVariants } from "@/lib/motion";
```

2. Inside the component, before `return`:

```tsx
const child = useMotionVariants(riseIn);
```

3. Wrap the **Hero section** (the one starting with `{/* Hero */}`) so the JSX becomes:

```tsx
<section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-12 sm:pt-20 pb-12 sm:pb-16">
  <HeroBackdrop position="top-right" />
  {/* drifting leaves */}
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className="absolute text-brand-200 animate-bob"
        style={{
          top: `${10 + i * 12}%`,
          right: `${5 + (i % 3) * 18}%`,
          animationDelay: `${i * 0.4}s`,
          opacity: 0.5,
        }}
      >
        <Ornament name="leaf-cluster" size={28 + (i % 3) * 6} />
      </span>
    ))}
  </div>
  {/* existing grid content below — make sure it has `relative z-10` wrapper */}
  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-center">
    {/* keep existing left column unchanged */}
    {/* right column wraps the sample-question card with: */}
    <div className="bg-brand-50 border border-brand-200 rounded-3xl p-6 sm:p-8 lg:p-10 transform -rotate-2 hover:rotate-0 transition-transform duration-300 shadow-card">
      {/* existing sample-question content */}
    </div>
  </div>
</section>
```

4. Wrap the "How it works" feature grid in a `motion.div` with `whileInView`:

```tsx
<motion.div
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, margin: "-80px" }}
  variants={pageEnter}
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
>
  {/* each <Feature /> wrapped: */}
  <motion.div variants={child}>
    <Feature icon={...} title={...} body={...} />
  </motion.div>
  {/* repeat for all 6 */}
</motion.div>
```

- [ ] **Step 2: Verify.**

Run: `npm run dev`, visit `/`. Confirm:
- Subtle leaves drift behind the headline.
- Sample-question card tilts left 2° at rest, straightens on hover.
- Features pop in as you scroll past them.

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat(landing): drifting leaves + tilted sample + scroll reveals"
```

---

### Task 3.2: `WelcomePage`

**Files:**
- Modify: `src/pages/WelcomePage.tsx`

- [ ] **Step 1: Add hero backdrop, animated underline on input, aurora on avatars.**

1. Import:

```tsx
import { HeroBackdrop } from "@/components/HeroBackdrop";
```

2. Wrap the inner `<div>` so it gets `relative`:

```tsx
<div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-16">
  <HeroBackdrop position="center-top" />
  <div className="relative z-10">
    {/* existing content */}
  </div>
</div>
```

3. Replace the avatar span class in the user-list `<li>` with:

```tsx
<span className="relative w-10 h-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">
  <span className="absolute inset-0 rounded-full bg-brand-300/40 animate-pulse-glow" aria-hidden />
  <span className="relative">{u.name.slice(0, 1)}</span>
</span>
```

4. Make the submit button magnetic. Add the import:

```tsx
import { useMagnetic } from "@/lib/useMagnetic";
```

Inside `WelcomePage()`:

```tsx
const submitRef = useMagnetic<HTMLButtonElement>();
```

Attach `ref={submitRef}` to the submit button:

```tsx
<button
  ref={submitRef}
  type="submit"
  disabled={!name.trim()}
  className="btn-primary w-full justify-center"
>
  <UserPlus size={18} />
  התחל
</button>
```

5. Wrap the name `<input>` in a `<div className="relative">` and add an animated underline below it:

```tsx
<div className="relative">
  <input
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="לדוגמה: נועה"
    className="peer mt-1 w-full px-3 py-2 rounded-lg border border-border focus-visible:ring-0 focus:outline-none"
    autoFocus
  />
  <span
    aria-hidden
    className="absolute right-0 bottom-0 h-[2px] w-full bg-brand-500 origin-right scale-x-0 peer-focus:scale-x-100 transition-transform duration-200"
  />
</div>
```

(Note: drop `focus-visible:ring-2 ring-brand-500` from the input — replaced by the underline.)

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`. Open `/welcome`, confirm aurora pulse, focus underline animation.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/WelcomePage.tsx
git commit -m "feat(welcome): hero backdrop + avatar aurora + underline focus"
```

---

### Task 3.3: `HomePage`

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Typing greeting, asymmetric mode picker, ornaments, ring progress.**

1. Update the existing React import (which currently imports `useEffect`, `useMemo`) to include `useState` and `useRef`. Add the other new imports:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { Ornament } from "@/components/Ornament";
import { Confetti } from "@/components/Confetti";
import { riseIn, useMotionVariants } from "@/lib/motion";
```

(Note: `motion` and `riseIn`/`useMotionVariants` are imported in case you decide to wrap further; they aren't strictly required by the steps below — leave them in to avoid a re-edit if Task 4.x adds motion.)

2. Inside `HomePage()`, after `if (!user) return null;`, add a typing greeting hook:

```tsx
const fullName = user.name;
const [typed, setTyped] = useState(fullName);

useEffect(() => {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    setTyped(fullName);
    return;
  }
  setTyped("");
  let i = 0;
  const id = window.setInterval(() => {
    i += 1;
    setTyped(fullName.slice(0, i));
    if (i >= fullName.length) window.clearInterval(id);
  }, 30);
  return () => window.clearInterval(id);
}, [fullName]);
```

3. Wrap the hero band in `<section className="relative ...">` with `<HeroBackdrop position="top-left" />`. Replace the greeting:

```tsx
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tightest leading-[1.06] text-ink">
  שלום {typed},<br />
  <span className="h1-hero-accent">מה נתאמן היום?</span>
</h1>
```

4. Confetti for 7-day streak — add near the typing greeting hook:

```tsx
const [confettiTrigger, setConfettiTrigger] = useState(0);
const lastStreakRef = useRef(0);
useEffect(() => {
  if (stats.currentStreakDays === 7 && lastStreakRef.current !== 7) {
    setConfettiTrigger((k) => k + 1);
  }
  lastStreakRef.current = stats.currentStreakDays;
}, [stats.currentStreakDays]);
```

Then render `<Confetti trigger={confettiTrigger} />` near the bottom of the JSX.

5. Make the mode picker asymmetric — change the grid to `sm:grid-cols-3` with the primary card spanning 2 columns:

```tsx
<section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
  <div className="sm:col-span-2">
    <ModeBigCard ... primary />
  </div>
  <ModeBigCard ... />
</section>
```

6. Add `ornamentName?: "compass" | "brain-wave" | "sprout-mark"` to the `CategorySection` props type, and replace the section heading inside `CategorySection`:

```tsx
<h2 className="section-label mb-4 flex items-center gap-2">
  {ornamentName && (
    <span className="text-brand-500">
      <Ornament name={ornamentName} size={18} />
    </span>
  )}
  {title}
</h2>
```

At the call sites in the main JSX, pass the appropriate name:

```tsx
{mathCat && (
  <CategorySection title={mathCat.name} topics={mathCat.topics} cta="תרגול" ornamentName="compass" />
)}
{logicCat && (
  <CategorySection title={logicCat.name} topics={logicCat.topics} cta="תרגול" ornamentName="brain-wave" />
)}
{examsCat && (
  <CategorySection
    title={examsCat.name}
    topics={examsCat.topics}
    cta="מבחן"
    examMode
    ornamentName="sprout-mark"
  />
)}
```

7. Replace the inline progress bar in topic cards with a small radial ring SVG. Inside the topic `<Link>`:

```tsx
<div className="absolute top-3 left-3">
  {/* small radial ring */}
  <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
    <circle cx="14" cy="14" r="12" fill="none" stroke="#F3F4F6" strokeWidth="3" />
    <circle
      cx="14"
      cy="14"
      r="12"
      fill="none"
      stroke="#22C55E"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray={`${(pct / 100) * 75.4} 75.4`}
      transform="rotate(-90 14 14)"
    />
  </svg>
</div>
```

(Make sure the `<Link>` has `relative` and the topic name/count wrap correctly. Keep the existing `<div>` structure but remove the old bottom progress bar.)

- [ ] **Step 2: Verify.**

Run: `npm run dev`, visit `/home`. Confirm typing greeting on mount, ornaments in section labels, ring progress on topic cards.

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat(home): typing greeting + asymmetric modes + ring progress"
```

---

### Task 3.4: `TopicPickerPage`

**Files:**
- Modify: `src/pages/TopicPickerPage.tsx`

- [ ] **Step 1: Hero strips per category + warm cards.**

Replace each category section JSX with:

```tsx
{cats.map((cat) => {
  const ornament = cat.id === "math-knowledge" ? "compass" : "brain-wave";
  return (
    <section key={cat.id} className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-brand-500">
          <Ornament name={ornament} size={22} />
        </span>
        <h2 className="section-label">{cat.name_he}</h2>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {cat.topics.map((t) => (
          <Link
            key={t.id}
            to={`/practice/${urlFromTopicId(topicIdFor(cat.id, t.id))}`}
            className="card card-warm p-4 lg:p-5 flex items-baseline justify-between gap-2 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span className="font-bold text-lg text-ink truncate">{t.name_he}</span>
            <span className="text-faint tabular-nums shrink-0">{t.question_count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
})}
```

Add the `Ornament` import.

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`. Visit `/practice`.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/TopicPickerPage.tsx
git commit -m "feat(topics): hero strips + auto-fit grid"
```

---

### Task 3.5: `PracticePage`

**Files:**
- Modify: `src/pages/PracticePage.tsx`

- [ ] **Step 1: Add sticky bottom progress bar + first-try flash.**

1. Add state:

```tsx
const [flashGreen, setFlashGreen] = useState(false);
```

2. In `handlePick`, **replace** the existing line `if (outcome === "first-correct") setStarKey((k) => k + 1);` with:

```tsx
if (outcome === "first-correct") {
  setStarKey((k) => k + 1);
  setFlashGreen(true);
  window.setTimeout(() => setFlashGreen(false), 300);
}
```

3. In the JSX, add the flash overlay and the bottom progress bar at the end of `<main>`:

```tsx
{flashGreen && (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-40 ring-inset ring-8 ring-brand-500/30 animate-flicker"
  />
)}
<div className="fixed bottom-0 left-0 right-0 h-1 bg-hair z-30">
  <div
    className="h-full bg-brand-500 transition-all duration-300"
    style={{ width: `${((session.index + 1) / session.queue.length) * 100}%` }}
  />
</div>
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`. Practice a topic, get one right first try, confirm green edge flash + bottom progress fills.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/PracticePage.tsx
git commit -m "feat(practice): sticky progress + first-try edge flash"
```

---

### Task 3.6: `ReviewPage` (parity)

**Files:**
- Modify: `src/pages/ReviewPage.tsx`

- [ ] **Step 1: Mirror the sticky progress bar.**

Add at the end of `<main>`:

```tsx
<div className="fixed bottom-0 left-0 right-0 h-1 bg-hair z-30">
  <div
    className="h-full bg-brand-500 transition-all duration-300"
    style={{ width: `${((session.index + 1) / session.queue.length) * 100}%` }}
  />
</div>
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/ReviewPage.tsx
git commit -m "feat(review): mirror sticky progress bar"
```

---

### Task 3.7: `PracticeResultsPage`

**Files:**
- Modify: `src/pages/PracticeResultsPage.tsx`

- [ ] **Step 1: Donut chart + CountUp + Confetti.**

Replace the contents:

```tsx
import { Link, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { CountUp } from "@/components/CountUp";
import { Confetti } from "@/components/Confetti";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { useMagnetic } from "@/lib/useMagnetic";

export function PracticeResultsPage() {
  const params = useParams<{ cat: string; topic: string }>();
  const urlSlug = `${params.cat ?? ""}/${params.topic ?? ""}`;
  const session = useStore((s) => s.session);
  const endSession = useStore((s) => s.endSession);
  const r =
    session && session.mode !== "exam"
      ? session.results
      : { answered: 0, firstTryCorrect: 0, secondTryCorrect: 0, thirdTryCorrect: 0, failed: 0 };

  const pct = r.answered > 0 ? Math.round((r.firstTryCorrect / r.answered) * 100) : 0;
  const circumference = 2 * Math.PI * 60;
  const [dash, setDash] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const backRef = useMagnetic<HTMLAnchorElement>();
  const againRef = useMagnetic<HTMLAnchorElement>();

  useEffect(() => {
    const t = window.setTimeout(() => setDash((pct / 100) * circumference), 100);
    if (pct >= 80) {
      const c = window.setTimeout(() => setConfetti(1), 600);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(c);
      };
    }
    return () => window.clearTimeout(t);
  }, [pct, circumference]);

  return (
    <main className="relative min-h-screen bg-white">
      <HeroBackdrop position="center-top" />
      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-center">
        <PageHeader backTo="/home" title="סיכום תרגול" />
        <div className="card p-6 mb-6">
          <div className="text-faint section-label mb-4">סיימת את המפגש</div>

          <div className="relative w-[160px] h-[160px] mx-auto mb-4">
            <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
              <circle cx="80" cy="80" r="60" fill="none" stroke="#F3F4F6" strokeWidth="12" />
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#22C55E"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                transform="rotate(-90 80 80)"
                style={{ transition: "stroke-dasharray 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5">
                <Star size={20} className="text-warn-700 fill-warn-200" />
                <CountUp value={r.firstTryCorrect} className="text-3xl font-black tabular-nums" />
              </div>
              <div className="text-muted">{pct}% ראשון</div>
            </div>
          </div>

          <ul className="text-right space-y-1 text-ink">
            <li>
              נכון בניסיון ראשון: <b className="tabular-nums">{r.firstTryCorrect}</b>
            </li>
            <li>
              נכון בניסיון שני: <b className="tabular-nums">{r.secondTryCorrect}</b>
            </li>
            <li>
              נכון בניסיון שלישי: <b className="tabular-nums">{r.thirdTryCorrect}</b>
            </li>
            <li>
              נכשל (התווסף לחזרה): <b className="tabular-nums">{r.failed}</b>
            </li>
          </ul>
        </div>
        <div className="flex gap-2 justify-center">
          <Link ref={backRef} to="/home" onClick={endSession} className="btn-secondary">
            לדף הבית
          </Link>
          <Link
            ref={againRef}
            to={`/practice/${urlSlug}`}
            onClick={endSession}
            className="btn-primary"
          >
            מפגש נוסף
          </Link>
        </div>
      </div>
      <Confetti trigger={confetti} />
    </main>
  );
}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`. Trigger a practice session, score 80%+, confirm donut sweep + confetti.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/PracticeResultsPage.tsx
git commit -m "feat(results): donut chart + count-up + confetti on win"
```

---

### Task 3.8: `ExamPickerPage`

**Files:**
- Modify: `src/pages/ExamPickerPage.tsx`

- [ ] **Step 1: iOS toggle, sparkline per exam row, medal SVG.**

1. Add `Sparkline` import. Build a per-exam sparkline data array from `user.progress.exams.filter(a => a.examId === e.full).slice(-5).map(a => a.score)`.

2. Replace the timer checkbox with a styled toggle. Replace the label JSX:

```tsx
<label className="card flex items-center justify-between gap-3 p-4 mb-4 cursor-pointer">
  <span>הפעלת שעון של 60 דקות (כמו במבחן האמיתי)</span>
  <span className="relative inline-block w-9 h-5">
    <input
      type="checkbox"
      checked={timerEnabled}
      onChange={(e) => setTimerEnabled(e.target.checked)}
      className="peer sr-only"
    />
    <span className="absolute inset-0 rounded-full bg-hair peer-checked:bg-brand-500 transition-colors" />
    <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:-translate-x-4" />
  </span>
</label>
```

3. Per-exam row JSX with sparkline + medal:

```tsx
{exams.map((e) => {
  const attempts = user.progress.exams.filter((a) => a.examId === e.full);
  const lastAttempt = attempts.sort((a, b) => b.takenAt - a.takenAt)[0];
  const spark = attempts.slice(-5).map((a) => a.score);
  const perfect = lastAttempt?.score === lastAttempt?.total && lastAttempt;
  return (
    <li key={e.id} className="flex items-center gap-3 px-4 py-3">
      {perfect ? (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="10" r="6" fill="#FACC15" />
          <circle cx="12" cy="10" r="6" fill="none" stroke="#A16207" strokeWidth="1.5" />
          <path d="M9 16l-1 5 4-3 4 3-1-5" fill="#A16207" />
        </svg>
      ) : (
        <Calendar size={18} className="text-brand-600" />
      )}
      <div className="flex-1">
        <div className="font-semibold">{e.name}</div>
        {lastAttempt && (
          <div className="flex items-center gap-2 text-sm text-faint tabular-nums">
            <span>ניסיון אחרון: {lastAttempt.score}/{lastAttempt.total}</span>
            {spark.length > 1 && <Sparkline data={spark} color="#22C55E" />}
          </div>
        )}
      </div>
      <button onClick={() => start(e.full)} className="btn-primary">
        <Play size={16} />
        התחל
      </button>
    </li>
  );
})}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`. Visit `/exam`.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/ExamPickerPage.tsx
git commit -m "feat(exam-picker): iOS toggle + sparkline + medal"
```

---

### Task 3.9: `ExamPage`

**Files:**
- Modify: `src/pages/ExamPage.tsx`

- [ ] **Step 1: Add stat row + answered rail + flagged count in finish dialog.**

1. Compute counts:

```tsx
const answeredCount = Object.values(session.picks).filter(Boolean).length;
const flaggedCount = Object.values(session.flagged).filter(Boolean).length;
const remaining = session.queue.length - answeredCount;
const answeredPct = (answeredCount / session.queue.length) * 100;
```

2. Above the `<div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] ...">`, add the stat row:

```tsx
<div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-semibold tabular-nums">
    נענו <CountUp value={answeredCount} />/{session.queue.length}
  </span>
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warn-50 text-warn-700 font-semibold tabular-nums">
    מסומנות <CountUp value={flaggedCount} />
  </span>
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hair text-ink font-semibold tabular-nums">
    נותרו <CountUp value={remaining} />
  </span>
</div>
```

(Add `CountUp` import.)

3. Inside the `<aside>`, add a rail above the grid:

```tsx
<aside className="lg:sticky lg:top-6 self-start">
  <div className="section-label mb-2">דפדוף</div>
  <div className="flex gap-2">
    <div className="w-1.5 rounded-full bg-hair relative" style={{ height: 24 * Math.ceil(session.queue.length / 6) + 12 }}>
      <div
        className="absolute bottom-0 left-0 right-0 rounded-full bg-brand-500 transition-all duration-300"
        style={{ height: `${answeredPct}%` }}
      />
    </div>
    <div className="flex-1">
      <ExamGrid ... />
    </div>
  </div>
</aside>
```

(Keep the existing `ExamGrid` props.)

4. Update the `Confirm` body:

```tsx
body={`ענית על ${answeredCount} מתוך ${session.queue.length} שאלות. ${flaggedCount > 0 ? `יש ${flaggedCount} שאלות מסומנות.` : ""}`}
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`. Start an exam, answer some, flag some, open the finish dialog.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/ExamPage.tsx
git commit -m "feat(exam): stat row + answered rail + flagged warning"
```

---

### Task 3.10: `ExamResultsPage`

**Files:**
- Modify: `src/pages/ExamResultsPage.tsx`

- [ ] **Step 1: Trophy stamp + CountUp + confetti + colored rails.**

Replace the score section + question detail rows:

1. Imports:

```tsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { Confetti } from "@/components/Confetti";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { springStamp, useMotionVariants } from "@/lib/motion";
```

2. Component body — add state for confetti, trigger on mount if pct >= 80:

```tsx
const [confetti, setConfetti] = useState(0);
const stamp = useMotionVariants(springStamp);

useEffect(() => {
  if (pct >= 80) {
    const t = window.setTimeout(() => setConfetti(1), 400);
    return () => window.clearTimeout(t);
  }
}, [pct]);
```

3. Wrap `<main>` to position confetti and backdrop:

```tsx
<main className="relative min-h-screen bg-white">
  <HeroBackdrop position="top-right" />
  <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
    <PageHeader backTo="/home" title="תוצאות מבחן" />
    <section className="card p-6 mb-6 text-center">
      <motion.div initial="hidden" animate="show" variants={stamp} className="inline-block">
        <Trophy size={48} className="text-brand-500 mx-auto mb-2" />
      </motion.div>
      <div className="text-5xl font-black tabular-nums">
        <CountUp value={attempt.score} />/{attempt.total}
      </div>
      <div className="text-muted mt-1">{pct}% נכון</div>
      <div className="text-sm text-faint mt-3 tabular-nums">
        זמן: {mm}:{String(ss).padStart(2, "0")} דקות
      </div>
    </section>
    {/* ...rest... */}
  </div>
  <Confetti trigger={confetti} />
</main>
```

4. Each question detail row gets a colored left-rail (RTL — `border-r-4`):

```tsx
<details
  key={qid}
  className={`card p-4 mb-3 group border-r-4 ${
    rec.correct ? "border-r-brand-500" : "border-r-danger-600"
  }`}
>
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`. Complete an exam ≥80% — trophy stamps in, score counts up, confetti fires.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/ExamResultsPage.tsx
git commit -m "feat(exam-results): trophy stamp + count-up + confetti + rails"
```

---

### Task 3.11: `SettingsPage`

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Danger wash + section hover lift.**

Cards already inherit hover-lift from the upgraded `.card` class. The only change is the danger wash on the danger section:

Change the danger section's `<section>` className from:

```tsx
className="card p-4 border-danger-200"
```

to:

```tsx
className="card p-4 border-danger-200 bg-danger-50/40"
```

- [ ] **Step 2: Verify.**

Run: `npm run lint && npm test && npm run build`. Visit `/settings`.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "style(settings): danger section soft wash"
```

---

## Phase 4 — Mobile audit & fixes

### Task 4.1: Run audit, document findings

**Files:**
- Create: `docs/mobile-audit-2026-05-17.md` (temporary scratch file, deleted at the end of Phase 4)

- [ ] **Step 1: Run `npm run dev`. In Chrome DevTools device toolbar, walk every route at 360, 414, 768, 1024 widths.**

For each route, note in the scratch file:
- Any horizontal scroll.
- Any text below 16px (Inspect → Computed → font-size).
- Any tap target < 44px.
- Any layout that breaks (overflow, cropped, illegible).

- [ ] **Step 2: Compare findings to the spec D1 fixes already planned.**

Identify net-new issues vs the ones the spec already addresses.

- [ ] **Step 3: Do not commit the scratch file. It guides Task 4.2.**

---

### Task 4.2: Apply mobile fixes

**Files (likely):**
- Modify: `src/styles/index.css` (if global tweaks needed)
- Modify: any page surfaced by Task 4.1

- [ ] **Step 1: For each issue found, apply the smallest fix that resolves it.**

Specific fixes confirmed from the spec:

a) **LandingPage** sample-card options grid — force single column under 380px. In `src/pages/LandingPage.tsx`, change the `<ul>` className:

```tsx
<ul className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 text-base">
```

b) **HomePage header** stat pill overflow handled by `PageHeader` `overflow-x-auto` from Task 2.2 — verify no second-row wrap on 360px.

c) **ExamPage** stacked sidebar — when `<lg`, add `max-h-[40vh] overflow-y-auto` to the grid wrapper. In `ExamPage.tsx`, wrap the `<ExamGrid>` (or its container) at small breakpoints:

```tsx
<div className="lg:max-h-none max-h-[40vh] overflow-y-auto">
  <ExamGrid ... />
</div>
```

- [ ] **Step 2: Re-audit at the four breakpoints. Confirm fixed.**

- [ ] **Step 3: Commit.**

```bash
git add -p   # stage only the mobile fixes
git commit -m "fix(responsive): single-column sample grid <380px + scrollable exam grid <lg"
```

---

### Task 4.3: Verify 16px floor

- [ ] **Step 1: Use DevTools "Inspect" on every visible text node across all 11 pages. Confirm computed `font-size` ≥ 16px.**

- [ ] **Step 2: If any element shows < 16px, find its source class/style and fix it. Common culprits to check:**

- Any new `text-xs`/`text-sm` usage — those are overridden globally, but check for `text-[<size>]` arbitrary values or inline styles.
- New components added in Phase 1 (`CountUp`, `Sparkline`, `Confetti`, `Ornament`, `HeroBackdrop`) — none should set font-size.

- [ ] **Step 3: If any fixes were needed, commit:**

```bash
git commit -m "fix(typography): restore 16px floor on <component>"
```

If no fixes needed, skip the commit.

---

## Phase 5 — Code review & ship

### Task 5.1: Local pre-flight

- [ ] **Step 1: Run the full check.**

```bash
npm run lint
npm test
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Run Playwright if configured.**

```bash
npm run test:e2e
```

If failing for unrelated reasons (e.g., chromium not installed), note in the PR description but do not block.

---

### Task 5.2: Request code review

- [ ] **Step 1: Invoke the requesting-code-review skill.**

Use the `Skill` tool with `superpowers:requesting-code-review`. Brief the reviewer on:
- The spec at `docs/superpowers/specs/2026-05-17-frontend-polish-pass-design.md`.
- All commits since `6f74c99` (the last pre-polish commit on `main`).
- Focus areas: motion performance, RTL correctness, reduced-motion compliance, the 16px floor, no new emoji.

---

### Task 5.3: Address review feedback

- [ ] **Step 1: For each finding rated must-fix, make the change as a new commit.**

Commit message format: `fix(<area>): <what>` referencing the review finding.

- [ ] **Step 2: For nits, group into a single `chore(polish): address review nits` commit if accepting; leave a written reply on each one not accepted with the technical rationale.**

---

### Task 5.4: Push

- [ ] **Step 1: Show the user the final commit log and ask for confirmation before pushing.**

```bash
git log --oneline 6f74c99..HEAD
```

Wait for user "go ahead" or equivalent.

- [ ] **Step 2: Push.**

```bash
git push origin main
```

- [ ] **Step 3: Report deploy status.**

Netlify watches `main` and rebuilds on push. Tell the user the push went through and the live site will update within ~1 minute.

---

## Self-review summary

- **Spec coverage:** All A1–A6, B1–B15, C1–C10, D1–D3 sections mapped to tasks above.
- **Placeholders:** None — every step has concrete code, exact paths, or specific commands.
- **Type consistency:** `CountUp`, `Confetti`, `Sparkline`, `Ornament`, `HeroBackdrop`, `GrainOverlay` interfaces defined in Phase 1 and referenced unchanged in Phases 2–3.
- **Risks called out in spec** (Framer Motion weight, typewriter on long Hebrew, conic-gradient old Safari, sprout pattern visibility) — mitigations are inline in tasks: only what's needed is imported; typewriter capped at 600ms (Task 2.7); conic-gradient has WebKit mask fallback (Task 2.10); pattern is tunable via the CSS background-image opacity (Task 1.10).
- **Acceptance criteria from spec:** Phase 5 explicitly runs lint + test + build; Phase 4 verifies the 16px floor; the "no new deps" criterion is enforced by simply not editing `package.json` (no task asks to).
