import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  remainingSec: number;
  enabled: boolean;
  onTick: () => void;
}

export function ExamTimer({ remainingSec, enabled, onTick }: Props) {
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => tickRef.current(), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || remainingSec > 10) return;
    const id = window.setInterval(() => {
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
    }, 5000);
    return () => window.clearInterval(id);
  }, [enabled, remainingSec]);

  if (!enabled) return null;

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const low = remainingSec <= 60;

  return (
    <span
      role="timer"
      aria-live={low ? "polite" : "off"}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold tabular-nums transition-colors ${
        low ? "bg-danger-50 text-danger-600 animate-pulse-glow" : "bg-hair text-ink"
      } ${shake ? "animate-shake" : ""}`}
      aria-label={`זמן שנותר ${mm} דקות ${ss} שניות`}
    >
      <Clock size={14} />
      {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </span>
  );
}
