import type { ReactNode } from "react";
import { ImageOff } from "lucide-react";
import type { RawQuestion } from "@/data/types";
import { InlineMath } from "@/lib/katex";
import { TriesIndicator } from "./TriesIndicator";

interface Props {
  question: RawQuestion;
  position?: { index: number; total: number };
  used?: 0 | 1 | 2 | 3;
  topRight?: ReactNode;
  image?: { src: string; alt: string } | null;
  needsImage?: boolean;
}

export function QuestionCard({
  question,
  position,
  used,
  topRight,
  image,
  needsImage,
}: Props) {
  return (
    <section className="card p-5 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {position && (
            <span className="text-sm font-bold text-brand-600 tabular-nums">
              שאלה {position.index + 1} / {position.total}
            </span>
          )}
          {used !== undefined && <TriesIndicator used={used} />}
        </div>
        {topRight}
      </header>

      {image ? (
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className="mb-4 rounded-xl border border-border max-w-full"
        />
      ) : needsImage ? (
        <div className="mb-4 rounded-xl border border-dashed border-border bg-hair text-muted p-6 flex flex-col items-center gap-2">
          <ImageOff size={28} />
          <span className="font-semibold">תמונה תתווסף בקרוב</span>
        </div>
      ) : null}

      <div className="text-base sm:text-lg leading-relaxed text-ink">
        <InlineMath text={question.question} />
      </div>
    </section>
  );
}
