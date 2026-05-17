import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  to: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
}

export function ModeCard({ to, icon, title, subtitle, primary }: Props) {
  const base = primary
    ? "bg-brand-500 text-white border-brand-600 shadow-cta active:shadow-cta-pressed active:translate-y-[2px]"
    : "bg-surface border-border";
  return (
    <Link
      to={to}
      className={`card p-4 flex flex-col gap-2 transition-shadow ${base} focus-visible:ring-2 focus-visible:ring-brand-500`}
    >
      <span
        className={`w-10 h-10 rounded-xl grid place-items-center ${
          primary ? "bg-white/20" : "bg-brand-100 text-brand-600"
        }`}
      >
        {icon}
      </span>
      <span className={`text-lg font-bold ${primary ? "text-white" : "text-ink"}`}>{title}</span>
      <span className={`text-sm ${primary ? "text-white/85" : "text-muted"}`}>{subtitle}</span>
    </Link>
  );
}
