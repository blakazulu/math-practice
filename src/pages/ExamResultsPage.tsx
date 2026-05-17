import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Trophy } from "lucide-react";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { ExplanationCard } from "@/components/ExplanationCard";
import { topicIdFromUrl } from "@/data/types";

export function ExamResultsPage() {
  const params = useParams<{ cat: string; topic: string }>();
  const examId = topicIdFromUrl(params.cat ?? "", params.topic ?? "") ?? "";
  const user = useStore(selectActiveUser);
  const getQuestion = useStore((s) => s.getQuestion);

  const attempt = useMemo(() => {
    if (!user) return null;
    return [...user.progress.exams].filter((a) => a.examId === examId).pop() ?? null;
  }, [user, examId]);

  if (!user) return null;
  if (!attempt) {
    return (
      <main className="min-h-screen bg-white px-4 py-6">
        <PageHeader backTo="/exam" title="תוצאות מבחן" />
        <p className="text-muted">לא נמצא ניסיון.</p>
      </main>
    );
  }

  const pct = Math.round((attempt.score / attempt.total) * 100);
  const mm = Math.floor(attempt.durationSec / 60);
  const ss = attempt.durationSec % 60;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <PageHeader backTo="/home" title="תוצאות מבחן" />
        <section className="card p-6 mb-6 text-center">
          <Trophy size={36} className="text-brand-500 mx-auto mb-2" />
          <div className="text-5xl font-black tabular-nums">
            {attempt.score}/{attempt.total}
          </div>
          <div className="text-muted mt-1">{pct}% נכון</div>
          <div className="text-sm text-faint mt-3 tabular-nums">
            זמן: {mm}:{String(ss).padStart(2, "0")} דקות
          </div>
        </section>

        <h2 className="section-label mb-3">סקירת שאלות</h2>
        {Object.entries(attempt.answers).map(([qid, rec]) => {
          const q = getQuestion(qid);
          if (!q) return null;
          return (
            <details key={qid} className="card p-4 mb-3 group">
              <summary className="cursor-pointer flex items-center justify-between">
                <span className="font-semibold">שאלה {q.number}</span>
                <span
                  className={`text-sm font-bold ${
                    rec.correct ? "text-brand-700" : "text-danger-600"
                  }`}
                >
                  {rec.correct ? "נכון" : "שגוי"}
                  {rec.picked && ` (בחרת: ${rec.picked})`}
                </span>
              </summary>
              <div className="mt-3">
                <QuestionCard question={q} />
                <ExplanationCard
                  correctAnswer={q.correct_answer}
                  explanation={q.explanation}
                />
              </div>
            </details>
          );
        })}

        <div className="mt-6 flex gap-2 justify-end">
          <Link to="/home" className="btn-secondary">
            לדף הבית
          </Link>
          <Link to="/exam" className="btn-primary">
            מבחן נוסף
          </Link>
        </div>
      </div>
    </main>
  );
}
