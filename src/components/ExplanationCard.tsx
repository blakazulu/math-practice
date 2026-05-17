import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { InlineMath } from "@/lib/katex";
import { pageEnter, riseIn, springStamp, useMotionVariants } from "@/lib/motion";

interface Props {
  correctAnswer: string;
  explanation: string;
}

export function ExplanationCard({ correctAnswer, explanation }: Props) {
  const stamp = useMotionVariants(springStamp);
  const child = useMotionVariants(riseIn);
  const sentences = explanation ? splitSentencesPreservingMath(explanation) : [];

  return (
    <div className="mt-4 rounded-2xl bg-brand-50 border border-brand-200 p-4">
      <div className="flex gap-2 items-center text-brand-700 font-bold mb-2">
        <motion.span initial="hidden" animate="show" variants={stamp}>
          <CheckCircle2 size={18} />
        </motion.span>
        <span>תשובה נכונה: </span>
        <span className="text-ink">
          <InlineMath text={correctAnswer} />
        </span>
      </div>
      {sentences.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={pageEnter}
          className="text-ink/90 leading-relaxed space-y-1"
        >
          {sentences.map((s, i) => (
            <motion.p key={i} variants={child}>
              <InlineMath text={s} />
            </motion.p>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function splitSentencesPreservingMath(text: string): string[] {
  const out: string[] = [];
  let i = 0;
  let start = 0;
  let inMath = false;
  while (i < text.length) {
    if (text[i] === "\\" && (text[i + 1] === "(" || text[i + 1] === ")")) {
      inMath = text[i + 1] === "(";
      i += 2;
      continue;
    }
    if (!inMath && (text[i] === "." || text[i] === "!" || text[i] === "?")) {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      if (j > i + 1) {
        const piece = text.slice(start, i + 1).trim();
        if (piece) out.push(piece);
        start = j;
        i = j;
        continue;
      }
    }
    i++;
  }
  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}
