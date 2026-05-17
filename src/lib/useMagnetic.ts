import { useEffect, useRef } from "react";

interface Options {
  max?: number;
  strength?: number;
}

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
