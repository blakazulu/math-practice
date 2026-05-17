import { useEffect, useMemo, useState } from "react";

interface Props {
  trigger: number;
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
