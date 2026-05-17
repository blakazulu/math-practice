import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { OptionGrid } from "@/components/OptionGrid";
import { HintCard, hintForLevel } from "@/components/HintCard";
import { ExplanationCard } from "@/components/ExplanationCard";
import type { OptionLetter } from "@/data/types";

export function ReviewPage() {
  const user = useStore(selectActiveUser);
  const session = useStore((s) => s.session);
  const startPracticeSession = useStore((s) => s.startPracticeSession);
  const attemptAnswer = useStore((s) => s.attemptAnswer);
  const next = useStore((s) => s.next);
  const recordAnswer = useStore((s) => s.recordAnswer);
  const dequeueReview = useStore((s) => s.dequeueReview);
  const getQuestion = useStore((s) => s.getQuestion);
  const needsImage = useStore((s) => s.needsImage);
  const getImage = useStore((s) => s.getImage);
  const bank = useStore((s) => s.bank);
  const isUnanswerable = useStore((s) => s.isUnanswerable);
  const navigate = useNavigate();
  const [stickyWrong, setStickyWrong] = useState<OptionLetter[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/welcome", { replace: true });
      return;
    }
    const queue = user.progress.reviewQueue.filter((id) => !isUnanswerable(id));
    if (queue.length === 0) {
      navigate("/home", { replace: true });
      return;
    }
    if (session && session.mode === "review") return;
    startPracticeSession({
      topicId: "review",
      queue,
      mode: "review",
    });
    setStickyWrong([]);
    // session intentionally excluded — see PracticePage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, startPracticeSession, navigate, isUnanswerable]);

  if (!user || !session || session.mode === "exam" || !bank) return null;

  if (session.index >= session.queue.length) {
    navigate("/home", { replace: true });
    return null;
  }

  const currentId = session.queue[session.index];
  const q = getQuestion(currentId);
  if (!q) return null;

  function findTopicForQuestion(qid: string): { topicId: string; total: number } | null {
    if (!bank) return null;
    for (const cat of bank.categories) {
      for (const t of cat.topics) {
        if (t.questions.some((x) => x.id === qid)) {
          const dir =
            cat.id === "math-knowledge"
              ? "01_ידע_מתמטי"
              : cat.id === "logic-reasoning"
                ? "02_חשיבה_והגיון"
                : "03_מבחנים_לדוגמה";
          return { topicId: `${dir}/${t.id}`, total: t.question_count };
        }
      }
    }
    return null;
  }

  function handlePick(l: OptionLetter) {
    if (!q || !session || session.mode === "exam") return;
    const correct = l === q.correct_letter;
    if (!correct) setStickyWrong((p) => (p.includes(l) ? p : [...p, l]));
    const attemptIndex = session.currentAttempts as 0 | 1 | 2;
    attemptAnswer(correct);
    const meta = findTopicForQuestion(currentId);
    if (meta && user) {
      recordAnswer({
        userId: user.id,
        questionId: currentId,
        topicId: meta.topicId,
        totalQuestionsInTopic: meta.total,
        correct,
        attemptIndex,
        pickedLetter: l,
      });
    }
    if (correct && attemptIndex === 0 && user) {
      dequeueReview(user.id, currentId);
    }
  }

  function handleNext() {
    setStickyWrong([]);
    next();
  }

  const hint = hintForLevel(q.explanation, session.hintLevel);
  const showExplanation = session.revealed;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <PageHeader
          backTo="/home"
          title="חזרה"
          rightSlot={
            <span className="text-faint tabular-nums">
              {session.index + 1} / {session.queue.length}
            </span>
          }
        />
        <QuestionCard
          question={q}
          used={session.currentAttempts}
          image={getImage(currentId)}
          needsImage={needsImage(currentId)}
        />
        <OptionGrid
          question={q}
          stickyWrong={stickyWrong}
          revealed={session.revealed}
          onPick={handlePick}
        />
        {hint && !showExplanation && <HintCard text={hint} />}
        {showExplanation && (
          <ExplanationCard correctAnswer={q.correct_answer} explanation={q.explanation} />
        )}
        {showExplanation && (
          <div className="mt-5 flex justify-end">
            <button className="btn-primary" onClick={handleNext}>
              הבאה ←
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
