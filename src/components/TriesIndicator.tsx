import { Heart } from "lucide-react";

interface Props {
  used: 0 | 1 | 2 | 3;
}

export function TriesIndicator({ used }: Props) {
  const remaining = 3 - used;
  const dots = [0, 1, 2];
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`${remaining} ניסיונות נותרו`}
    >
      {dots.map((i) => {
        const consumed = i < used;
        return (
          <span
            key={i}
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
              consumed
                ? "bg-hair text-faint scale-90"
                : "bg-brand-50 text-brand-600 scale-100 shadow-[0_1px_0_rgba(34,197,94,0.18)]"
            }`}
          >
            <Heart
              size={14}
              strokeWidth={2.25}
              fill={consumed ? "none" : "currentColor"}
              aria-hidden
            />
          </span>
        );
      })}
    </div>
  );
}
