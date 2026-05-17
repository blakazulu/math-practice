import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Flag, X } from "lucide-react";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { OptionGrid } from "@/components/OptionGrid";
import { ExamGrid } from "@/components/ExamGrid";
import { ExamTimer } from "@/components/ExamTimer";
import { Confirm } from "@/components/Confirm";
import type { ExamAnswerRecord, OptionLetter } from "@/data/types";
import { topicIdFromUrl, urlFromTopicId } from "@/data/types";

export function ExamPage() {
  const params = useParams<{ cat: string; topic: string }>();
  const examIdParam = topicIdFromUrl(params.cat ?? "", params.topic ?? "") ?? "";
  const navigate = useNavigate();

  const user = useStore(selectActiveUser);
  const session = useStore((s) => s.session);
  const examPick = useStore((s) => s.examPick);
  const examFlag = useStore((s) => s.examFlag);
  const examJumpTo = useStore((s) => s.examJumpTo);
  const examTick = useStore((s) => s.examTick);
  const examFinish = useStore((s) => s.examFinish);
  const getQuestion = useStore((s) => s.getQuestion);
  const recordExamAnswer = useStore((s) => s.recordExamAnswer);
  const appendExamAttempt = useStore((s) => s.appendExamAttempt);
  const enqueueReview = useStore((s) => s.enqueueReview);
  const needsImage = useStore((s) => s.needsImage);
  const getImage = useStore((s) => s.getImage);
  const bank = useStore((s) => s.bank);

  const [confirmEnd, setConfirmEnd] = useState(false);
  /** Guards against finalize() re-entering after its store writes invalidate the effect's deps. */
  const finalizedRef = useRef(false);

  const finalize = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    const s = useStore.getState().session;
    if (!s || s.mode !== "exam" || !user || !bank) return;
    const cat = bank.categories.find((c) => c.id === "sample-exams");
    const topic = cat?.topics.find((t) => `03_מבחנים_לדוגמה/${t.id}` === s.examId);
    if (!cat || !topic) return;
    let score = 0;
    const answers: Record<string, ExamAnswerRecord> = {};
    for (const qid of s.queue) {
      const q = getQuestion(qid);
      const p = s.picks[qid] ?? null;
      const correct = !!q && p === q.correct_letter;
      if (correct) score++;
      answers[qid] = { picked: p, correct, flagged: s.flagged[qid] ?? false };
      recordExamAnswer({
        userId: user.id,
        questionId: qid,
        examId: s.examId,
        correct,
      });
      if (!correct) enqueueReview(user.id, qid);
    }
    appendExamAttempt(user.id, {
      examId: s.examId,
      takenAt: Date.now(),
      durationSec: s.durationSec - s.remainingSec,
      timerEnabled: s.timerEnabled,
      score,
      total: s.queue.length,
      answers,
    });
    navigate(`/exam/${urlFromTopicId(s.examId)}/results`, { replace: true });
  }, [user, bank, getQuestion, recordExamAnswer, appendExamAttempt, enqueueReview, navigate]);

  useEffect(() => {
    if (!session || session.mode !== "exam") return;
    if (session.ended) finalize();
  }, [session, finalize]);

  if (!user) {
    navigate("/welcome", { replace: true });
    return null;
  }
  if (!session || session.mode !== "exam") {
    navigate("/exam", { replace: true });
    return null;
  }

  const currentId = session.queue[session.index];
  const question = getQuestion(currentId);
  if (!question || !bank) return null;

  const picked = session.picks[currentId] ?? null;
  const flagged = session.flagged[currentId] ?? false;

  function handlePick(l: OptionLetter) {
    examPick(currentId, picked === l ? null : l);
  }

  // Suppress unused warning for examIdParam — useful for hard-refresh validation
  void examIdParam;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <PageHeader
          title="מבחן לדוגמה"
          rightSlot={
            <>
              <ExamTimer
                remainingSec={session.remainingSec}
                enabled={session.timerEnabled}
                onTick={examTick}
              />
              <button onClick={() => setConfirmEnd(true)} className="btn-secondary !px-3 !py-1.5">
                <X size={16} />
                סיים
              </button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 lg:gap-10">
          <section>
            <QuestionCard
              question={question}
              image={getImage(currentId)}
              needsImage={needsImage(currentId)}
              topRight={
                <button
                  onClick={() => examFlag(currentId, !flagged)}
                  className={`px-2 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 ${
                    flagged ? "bg-warn-50 text-warn-700" : "text-faint"
                  }`}
                  aria-pressed={flagged}
                >
                  <Flag size={14} /> {flagged ? "מסומנת" : "סמני לבדיקה"}
                </button>
              }
            />
            <OptionGrid question={question} onPick={handlePick} picked={picked} />
            <div className="mt-5 flex justify-between">
              <button
                onClick={() => examJumpTo(session.index - 1)}
                disabled={session.index === 0}
                className="btn-secondary disabled:opacity-50"
              >
                → הקודמת
              </button>
              <button
                onClick={() => examJumpTo(session.index + 1)}
                disabled={session.index >= session.queue.length - 1}
                className="btn-primary disabled:opacity-50"
              >
                הבאה ←
              </button>
            </div>
          </section>

          <aside className="lg:sticky lg:top-6 self-start">
            <div className="section-label mb-2">דפדוף</div>
            <ExamGrid
              queue={session.queue}
              picks={session.picks}
              flagged={session.flagged}
              currentIndex={session.index}
              onJump={examJumpTo}
            />
          </aside>
        </div>
      </div>

      <Confirm
        open={confirmEnd}
        title="לסיים את המבחן?"
        body={`ענית על ${Object.values(session.picks).filter(Boolean).length} מתוך ${session.queue.length} שאלות.`}
        confirmLabel="סיים והצג ציון"
        onConfirm={() => {
          setConfirmEnd(false);
          examFinish();
        }}
        onCancel={() => setConfirmEnd(false)}
      />
    </main>
  );
}
