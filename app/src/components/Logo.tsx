interface Props {
  className?: string;
}

export function Logo({ className }: Props) {
  return (
    <span className={"font-black text-xl tracking-tightest text-ink " + (className ?? "")}>
      חשבונייה<span className="text-brand-500">.</span>
    </span>
  );
}
