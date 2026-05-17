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
              <Star size={28} className="text-warn-700 fill-warn-200" />
            </span>
          );
        })}
      </div>
    </div>
  );
}
