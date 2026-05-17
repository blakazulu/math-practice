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
