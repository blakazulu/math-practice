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
    bg: "bg-gradient-to-l from-warn-50 to-warn-200/60",
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
