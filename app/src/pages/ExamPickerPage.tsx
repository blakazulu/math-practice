import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Play } from "lucide-react";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { topicIdFor } from "@/data/types";

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
    navigate(`/exam/${encodeURIComponent(examFullId)}`);
  }

  if (!user) {
    navigate("/welcome", { replace: true });
    return null;
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader backTo="/home" title="מבחן לדוגמה" />
        <p className="text-muted mb-4">
          7 מבחנים מלאים, כל אחד ~24 שאלות. בחירה אחת לכל שאלה. אפשר לדפדף לאחור.
        </p>

        <label className="card flex items-center gap-3 p-3 mb-4">
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
            className="w-4 h-4 accent-brand-500"
          />
          <span className="text-sm">הפעלת שעון של 60 דקות (כמו במבחן האמיתי)</span>
        </label>

        {exams.length === 0 && <p className="text-muted">טוען...</p>}

        <ul className="card divide-y divide-hair">
          {exams.map((e) => {
            const lastAttempt = user.progress.exams
              .filter((a) => a.examId === e.full)
              .sort((a, b) => b.takenAt - a.takenAt)[0];
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <Calendar size={18} className="text-brand-600" />
                <div className="flex-1">
                  <div className="font-semibold">{e.name}</div>
                  {lastAttempt && (
                    <div className="text-sm text-faint tabular-nums">
                      ניסיון אחרון: {lastAttempt.score}/{lastAttempt.total}
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
