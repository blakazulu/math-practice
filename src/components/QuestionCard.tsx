import type { ReactNode } from "react";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import type { RawQuestion } from "@/data/types";
import { InlineMath } from "@/lib/katex";
import { TriesIndicator } from "./TriesIndicator";
import { slideInRTL, useMotionVariants } from "@/lib/motion";

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
  const v = useMotionVariants(slideInRTL);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.section
      key={question.id}
      initial="hidden"
      animate="show"
      variants={v}
      className="card p-5 sm:p-6"
    >
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
          onLoad={() => setImgLoaded(true)}
          className={`mb-4 rounded-xl border border-border ring-2 ring-brand-100 max-w-full transition-opacity duration-300 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
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
    </motion.section>
  );
}
