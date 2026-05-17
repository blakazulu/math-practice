import { Link, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";

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

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-center">
        <PageHeader backTo="/home" title="סיכום תרגול" />
        <div className="card p-6 mb-6">
          <div className="text-faint section-label mb-2">סיימת את המפגש</div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star size={28} className="text-warn-700" />
            <span className="text-4xl font-black tabular-nums">{r.firstTryCorrect}</span>
            <span className="text-muted">כוכבים מפגש זה</span>
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
          <Link to="/home" onClick={endSession} className="btn-secondary">
            לדף הבית
          </Link>
          <Link
            to={`/practice/${urlSlug}`}
            onClick={endSession}
            className="btn-primary"
          >
            מפגש נוסף
          </Link>
        </div>
      </div>
    </main>
  );
}
