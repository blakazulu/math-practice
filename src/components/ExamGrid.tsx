import { Bookmark, Check } from "lucide-react";
import type { OptionLetter, QuestionId } from "@/data/types";

interface Props {
  queue: QuestionId[];
  picks: Record<QuestionId, OptionLetter | null>;
  flagged: Record<QuestionId, boolean>;
  currentIndex: number;
  onJump: (index: number) => void;
}

export function ExamGrid({ queue, picks, flagged, currentIndex, onJump }: Props) {
  return (
    <ol className="grid grid-cols-6 gap-1.5">
      {queue.map((id, i) => {
        const answered = picks[id] !== null;
        const isCurrent = i === currentIndex;
        const isFlag = flagged[id];
        return (
          <li key={id} className="relative">
            <button
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`שאלה ${i + 1}${answered ? ", נענתה" : ""}${isFlag ? ", מסומנת" : ""}`}
              className={`relative w-full aspect-square rounded-lg border text-sm font-bold tabular-nums focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isCurrent
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : answered
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-border bg-surface text-muted"
              }`}
            >
              {i + 1}
              {answered && !isCurrent && (
                <Check
                  size={10}
                  className="absolute bottom-0.5 right-0.5 text-white/80"
                />
              )}
            </button>
            {isCurrent && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-[-2px] rounded-lg p-[2px] animate-ring-sweep"
                style={{
                  background:
                    "conic-gradient(from 0deg, #22C55E, rgba(34,197,94,0) 60%, #22C55E)",
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
            )}
            {isFlag && (
              <Bookmark
                size={12}
                className="absolute top-0 left-0 text-warn-700 fill-warn-200"
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
