import { CheckCircle2 } from "lucide-react";
import { InlineMath } from "@/lib/katex";

interface Props {
  correctAnswer: string;
  explanation: string;
}

export function ExplanationCard({ correctAnswer, explanation }: Props) {
  return (
    <div className="mt-4 rounded-2xl bg-brand-50 border border-brand-200 p-4">
      <div className="flex gap-2 items-center text-brand-700 font-bold mb-2">
        <CheckCircle2 size={18} />
        <span>תשובה נכונה: </span>
        <span className="text-ink">
          <InlineMath text={correctAnswer} />
        </span>
      </div>
      {explanation && (
        <p className="text-ink/90 leading-relaxed">
          <InlineMath text={explanation} />
        </p>
      )}
    </div>
  );
}
