import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import type { OptionLetter, RawQuestion } from "@/data/types";
import { InlineMath } from "@/lib/katex";
import { pageEnter, riseIn, useMotionVariants } from "@/lib/motion";

type Status =
  | "neutral"
  | "correct"
  | "wrong"
  | "revealed-correct"
  | "revealed-other"
  | "picked";

interface Props {
  question: RawQuestion;
  /** Exam mode passes a single pick — used to highlight the kid's choice without revealing right/wrong. */
  picked?: OptionLetter | null;
  /** When true, the correct option is highlighted and grid is locked. */
  revealed?: boolean;
  /** Options that have been picked wrong so far (stay highlighted across tries). */
  stickyWrong?: OptionLetter[];
  onPick?: (letter: OptionLetter) => void;
  disabled?: boolean;
}

export function OptionGrid({
  question,
  picked,
  revealed,
  stickyWrong = [],
  onPick,
  disabled,
}: Props) {
  const [shake, setShake] = useState<OptionLetter | null>(null);
  const [redRing, setRedRing] = useState<OptionLetter | null>(null);
  const shakeTimeout = useRef<number | null>(null);
  const child = useMotionVariants(riseIn);

  useEffect(() => {
    return () => {
      if (shakeTimeout.current !== null) window.clearTimeout(shakeTimeout.current);
    };
  }, []);

  const letters = (["א", "ב", "ג", "ד"] as OptionLetter[]).filter(
    (l) => question.options[l] !== undefined,
  );
  const correctLetter = question.correct_letter;

  function statusFor(l: OptionLetter): Status {
    if (revealed) {
      if (correctLetter === l) return "revealed-correct";
      if (stickyWrong.includes(l)) return "wrong";
      return "revealed-other";
    }
    if (stickyWrong.includes(l)) return "wrong";
    if (picked === l) return "picked";
    return "neutral";
  }

  useEffect(() => {
    if (redRing) {
      const t = window.setTimeout(() => setRedRing(null), 300);
      return () => window.clearTimeout(t);
    }
  }, [redRing]);

  function handleClick(l: OptionLetter) {
    if (disabled || revealed || !onPick) return;
    if (stickyWrong.includes(l)) return;
    if (correctLetter && l !== correctLetter) {
      setShake(l);
      setRedRing(l);
      if (shakeTimeout.current !== null) window.clearTimeout(shakeTimeout.current);
      shakeTimeout.current = window.setTimeout(() => setShake(null), 400);
    }
    onPick(l);
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={pageEnter}
      className="grid grid-cols-1 gap-3 mt-4"
    >
      {letters.map((l) => {
        const s = statusFor(l);
        const styles =
          s === "revealed-correct"
            ? "bg-brand-50 border-brand-500 ring-2 ring-brand-500 animate-pulse-glow"
            : s === "wrong"
              ? "bg-danger-50 border-danger-200 text-danger-600"
              : s === "picked"
                ? "bg-brand-50 border-brand-500"
                : s === "revealed-other"
                  ? "opacity-60"
                  : "hover:bg-brand-50/40";
        const isShaking = shake === l;
        const showRedRing = redRing === l;
        return (
          <motion.button
            key={l}
            variants={child}
            disabled={disabled || revealed}
            onClick={() => handleClick(l)}
            className={`card p-4 min-h-[64px] text-right flex items-start gap-3 transition-all ${styles} ${
              isShaking ? "animate-shake" : ""
            } ${showRedRing ? "ring-2 ring-danger-200" : ""} focus-visible:ring-2 focus-visible:ring-brand-500`}
          >
            <span
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                s === "revealed-correct"
                  ? "bg-brand-500 text-white"
                  : s === "wrong"
                    ? "bg-danger-600 text-white"
                    : s === "picked"
                      ? "bg-brand-500 text-white"
                      : "bg-hair text-ink"
              }`}
            >
              {s === "revealed-correct" || s === "picked" ? (
                <Check size={16} />
              ) : s === "wrong" ? (
                <X size={16} />
              ) : (
                l
              )}
            </span>
            <span className="flex-1 leading-relaxed">
              <InlineMath text={question.options[l] ?? ""} />
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
