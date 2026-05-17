import { Link, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { CountUp } from "@/components/CountUp";
import { Confetti } from "@/components/Confetti";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { useMagnetic } from "@/lib/useMagnetic";

export function PracticeResultsPage() {
  const params = useParams<{ cat: string; topic: string }>();
  const urlSlug = `${params.cat ?? ""}/${params.topic ?? ""}`;
  const session = useStore((s) => s.session);
  const endSession = useStore((s) => s.endSession);
  const r =
    session && session.mode !== "exam"
      ? session.results
      : {
          answered: 0,
          firstTryCorrect: 0,
          secondTryCorrect: 0,
          thirdTryCorrect: 0,
          failed: 0,
        };

  const pct = r.answered > 0 ? Math.round((r.firstTryCorrect / r.answered) * 100) : 0;
  const circumference = 2 * Math.PI * 60;
  const [dash, setDash] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const backRef = useMagnetic<HTMLAnchorElement>();
  const againRef = useMagnetic<HTMLAnchorElement>();

  useEffect(() => {
    const t = window.setTimeout(() => setDash((pct / 100) * circumference), 100);
    if (pct >= 80) {
      const c = window.setTimeout(() => setConfetti(1), 600);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(c);
      };
    }
    return () => window.clearTimeout(t);
  }, [pct, circumference]);

  return (
    <main className="relative min-h-screen bg-white overflow-hidden">
      <HeroBackdrop position="center-top" />
      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-center">
        <PageHeader backTo="/home" title="סיכום תרגול" />
        <div className="card p-6 mb-6">
          <div className="text-faint section-label mb-4">סיימת את המפגש</div>

          <div className="relative w-[160px] h-[160px] mx-auto mb-4">
            <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#22C55E"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                transform="rotate(-90 80 80)"
                style={{ transition: "stroke-dasharray 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5">
                <Star size={20} className="text-warn-700 fill-warn-200" />
                <CountUp
                  value={r.firstTryCorrect}
                  className="text-3xl font-black tabular-nums"
                />
              </div>
              <div className="text-muted">{pct}% ראשון</div>
            </div>
          </div>

          <ul className="text-right space-y-1 text-ink">
            <li>
              נכון בניסיון ראשון: <b className="tabular-nums">{r.firstTryCorrect}</b>
            </li>
            <li>
              נכון בניסיון שני: <b className="tabular-nums">{r.secondTryCorrect}</b>
            </li>
            <li>
              נכון בניסיון שלישי: <b className="tabular-nums">{r.thirdTryCorrect}</b>
            </li>
            <li>
              נכשל (התווסף לחזרה): <b className="tabular-nums">{r.failed}</b>
            </li>
          </ul>
        </div>
        <div className="flex gap-2 justify-center">
          <Link ref={backRef} to="/home" onClick={endSession} className="btn-secondary">
            לדף הבית
          </Link>
          <Link
            ref={againRef}
            to={`/practice/${urlSlug}`}
            onClick={endSession}
            className="btn-primary"
          >
            מפגש נוסף
          </Link>
        </div>
      </div>
      <Confetti trigger={confetti} />
    </main>
  );
}
