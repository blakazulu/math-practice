import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Play } from "lucide-react";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { Sparkline } from "@/components/Sparkline";
import { topicIdFor, urlFromTopicId } from "@/data/types";

export function ExamPickerPage() {
  const user = useStore(selectActiveUser);
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  const startExamSession = useStore((s) => s.startExamSession);
  const isUnanswerable = useStore((s) => s.isUnanswerable);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  const exams = useMemo(() => {
    if (!bank) return [];
    const cat = bank.categories.find((c) => c.id === "sample-exams");
    return cat
      ? cat.topics.map((t) => ({
          id: t.id,
          name: t.name_he,
          full: topicIdFor(cat.id, t.id),
        }))
      : [];
  }, [bank]);

  function start(examFullId: string) {
    if (!bank || !user) return;
    const cat = bank.categories.find((c) => c.id === "sample-exams")!;
    const topic = cat.topics.find((t) => topicIdFor(cat.id, t.id) === examFullId);
    if (!topic) return;
    const queue = topic.questions.map((q) => q.id).filter((id) => !isUnanswerable(id));
    startExamSession({
      examId: examFullId,
      queue,
      timerEnabled,
      durationSec: 60 * 60,
    });
    navigate(`/exam/${urlFromTopicId(examFullId)}`);
  }

  if (!user) {
    navigate("/welcome", { replace: true });
    return null;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <PageHeader backTo="/home" title="מבחן לדוגמה" />
        <p className="text-muted mb-4">
          7 מבחנים מלאים, כל אחד ~24 שאלות. בחירה אחת לכל שאלה. אפשר לדפדף לאחור.
        </p>

        <label className="card flex items-center justify-between gap-3 p-4 mb-4 cursor-pointer">
          <span className="text-sm">הפעלת שעון של 60 דקות (כמו במבחן האמיתי)</span>
          <span className="relative inline-block w-9 h-5 shrink-0">
            <input
              type="checkbox"
              checked={timerEnabled}
              onChange={(e) => setTimerEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <span className="absolute inset-0 rounded-full bg-hair peer-checked:bg-brand-500 transition-colors" />
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:-translate-x-4" />
          </span>
        </label>

        {exams.length === 0 && <p className="text-muted">טוען...</p>}

        <ul className="card divide-y divide-hair">
          {exams.map((e) => {
            const attempts = user.progress.exams.filter((a) => a.examId === e.full);
            const lastAttempt = [...attempts].sort((a, b) => b.takenAt - a.takenAt)[0];
            const spark = attempts.slice(-5).map((a) => a.score);
            const perfect =
              lastAttempt && lastAttempt.score === lastAttempt.total ? lastAttempt : null;
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                {perfect ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="10" r="6" fill="#FACC15" />
                    <circle cx="12" cy="10" r="6" fill="none" stroke="#A16207" strokeWidth="1.5" />
                    <path d="M9 16l-1 5 4-3 4 3-1-5" fill="#A16207" />
                  </svg>
                ) : (
                  <Calendar size={18} className="text-brand-600" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{e.name}</div>
                  {lastAttempt && (
                    <div className="flex items-center gap-2 text-sm text-faint tabular-nums">
                      <span>
                        ניסיון אחרון: {lastAttempt.score}/{lastAttempt.total}
                      </span>
                      {spark.length > 1 && <Sparkline data={spark} color="#22C55E" />}
                    </div>
                  )}
                </div>
                <button onClick={() => start(e.full)} className="btn-primary">
                  <Play size={16} />
                  התחל
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
