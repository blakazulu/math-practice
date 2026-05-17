import { Lightbulb } from "lucide-react";

interface Props {
  text: string;
}

export function HintCard({ text }: Props) {
  if (!text) return null;
  return (
    <div className="mt-4 rounded-2xl bg-warn-50 border border-warn-200 p-4 flex gap-3 text-warn-700">
      <Lightbulb size={20} className="shrink-0 mt-0.5" />
      <p className="leading-relaxed">{text}</p>
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
