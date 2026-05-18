import { BookOpen } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  onClick: () => void;
  pulse: boolean;
}

export function ExplainButton({ onClick, pulse }: Props) {
  const reduced = useReducedMotion();
  const animate =
    pulse && !reduced
      ? {
          scale: [1, 1.06, 1, 1.06, 1, 1.06, 1],
          transition: { duration: 2.4, times: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48] },
        }
      : { scale: 1 };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-pulse={pulse ? "true" : "false"}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-brand-700 bg-brand-50 hover:bg-brand-100 focus-visible:ring-2 focus-visible:ring-brand-500"
      animate={animate}
    >
      <BookOpen size={18} />
      <span className="font-medium">איך פותרים?</span>
    </motion.button>
  );
}
