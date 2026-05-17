import type { ReactNode } from "react";
import { Star, Flame } from "lucide-react";

type Variant = "star" | "streak" | "today";

interface Props {
  variant: Variant;
  value: number;
}

const styles: Record<Variant, { bg: string; fg: string; icon: ReactNode | null; label: string }> = {
  star: { bg: "bg-warn-50", fg: "text-warn-700", icon: <Star size={14} />, label: "כוכבים" },
  streak: { bg: "bg-danger-50", fg: "text-danger-600", icon: <Flame size={14} />, label: "רצף" },
  today: { bg: "bg-brand-50", fg: "text-brand-700", icon: null, label: "היום" },
};

export function StatPill({ variant, value }: Props) {
  const s = styles[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${s.bg} ${s.fg}`}
    >
      {s.icon}
      <span className="tabular-nums">{value}</span>
      <span className="text-xs opacity-80">{s.label}</span>
    </span>
  );
}
