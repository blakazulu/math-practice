import { Flag } from "lucide-react";
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
          <li key={id}>
            <button
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`שאלה ${i + 1}${answered ? ", נענתה" : ""}${isFlag ? ", מסומנת" : ""}`}
              className={`relative w-full aspect-square rounded-lg border text-sm font-bold tabular-nums focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isCurrent
                  ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500"
                  : answered
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-border bg-surface text-muted"
              }`}
            >
              {i + 1}
              {isFlag && (
                <Flag size={10} className="absolute top-0.5 left-0.5 text-warn-700" />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
