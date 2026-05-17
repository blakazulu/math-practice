import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { InlineMath } from "@/lib/katex";

interface Props {
  text: string;
}

export function HintCard({ text }: Props) {
  const [shown, setShown] = useState(text);
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    if (!text) {
      setShown("");
      return;
    }
    setFlicker(true);
    const flickerT = window.setTimeout(() => setFlicker(false), 200);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text);
      return () => window.clearTimeout(flickerT);
    }

    const total = 600;
    const stepMs = Math.max(8, total / text.length);
    let i = 0;
    setShown("");
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, stepMs);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(flickerT);
    };
  }, [text]);

  if (!text) return null;

  return (
    <div className="mt-4 rounded-2xl bg-warn-50 border border-warn-200 p-4 flex gap-3 text-warn-700">
      <Lightbulb
        size={20}
        className={`shrink-0 mt-0.5 ${flicker ? "animate-flicker" : ""}`}
      />
      <p className="leading-relaxed">
        <InlineMath text={shown} />
      </p>
    </div>
  );
}

export function hintForLevel(explanation: string, level: 0 | 1 | 2 | 3): string {
  if (level <= 0 || !explanation) return "";
  const sentences = explanation
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return level >= 3 ? explanation : "";
  if (level === 1) return sentences.slice(0, 1).join(" ");
  if (level === 2) return sentences.slice(0, 2).join(" ");
  return explanation;
}
