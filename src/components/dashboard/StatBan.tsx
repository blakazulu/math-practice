import type { ReactNode } from "react";
import { CountUp } from "@/components/CountUp";
import { Sparkline } from "@/components/Sparkline";

interface Props {
  label: string;
  value: number;
  unit?: string;
  icon?: ReactNode;
  sparkline?: number[];
  /** Optional tint for the icon chip. Defaults to brand. */
  tint?: "brand" | "warn" | "danger" | "muted";
}

const tintMap: Record<NonNullable<Props["tint"]>, string> = {
  brand: "bg-brand-100 text-brand-700",
  warn: "bg-warn-100 text-warn-700",
  danger: "bg-danger-100 text-danger-600",
  muted: "bg-hair text-muted",
};

export function StatBan({ label, value, unit, icon, sparkline, tint = "brand" }: Props) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <span className={`w-10 h-10 rounded-xl grid place-items-center ${tintMap[tint]}`}>
            {icon}
          </span>
        )}
        <span className="section-label">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-4xl lg:text-5xl font-black tabular-nums text-ink leading-none">
          <CountUp value={value} />
          {unit && <span className="text-xl text-muted font-bold mr-1">{unit}</span>}
        </div>
        {sparkline && sparkline.length > 0 && (
          <Sparkline data={sparkline} width={80} height={28} className="text-brand-500" />
        )}
      </div>
    </div>
  );
}
