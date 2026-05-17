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
  const sentences = explanation
    ? explanation.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
    : [];

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
