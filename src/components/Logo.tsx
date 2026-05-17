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
      <span className="text-brand-500 inline-block group-hover:animate-bob">
        <Ornament name="sprout-mark" size={18} />
      </span>
      חשבונייה<span className="text-brand-500">.</span>
    </span>
  );
}
