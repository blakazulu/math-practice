import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { OptionGrid } from "@/components/OptionGrid";
import { HintCard, hintForLevel } from "@/components/HintCard";
import { ExplanationCard } from "@/components/ExplanationCard";
import { StarBurst } from "@/components/StarBurst";
import { seededShuffle } from "@/lib/shuffle";
import type { OptionLetter, QuestionId, TopicId } from "@/data/types";
import { topicIdFor } from "@/data/types";

export function PracticePage() {
  const params = useParams<{ topicId: string }>();
  const topicId = decodeURIComponent(params.topicId ?? "") as TopicId;
  const navigate = useNavigate();
  const user = useStore(selectActiveUser);
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  const session = useStore((s) => s.session);
  const startPracticeSession = useStore((s) => s.startPracticeSession);
  const attemptAnswer = useStore((s) => s.attemptAnswer);
  const next = useStore((s) => s.next);
  const recordAnswer = useStore((s) => s.recordAnswer);
  const getQuestion = useStore((s) => s.getQuestion);
  const needsImage = useStore((s) => s.needsImage);
  const getImage = useStore((s) => s.getImage);
  const isUnanswerable = useStore((s) => s.isUnanswerable);

  const [stickyWrong, setStickyWrong] = useState<OptionLetter[]>([]);
  const [starKey, setStarKey] = useState(0);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  const topic = useMemo(() => {
    if (!bank) return null;
    for (const cat of bank.categories) {
      for (const t of cat.topics) {
        if (topicIdFor(cat.id, t.id) === topicId) return t;
      }
    }
    return null;
  }, [bank, topicId]);

  useEffect(() => {
    if (!user || !topic) return;
    if (session && session.mode !== "exam" && session.topicId === topicId) return;
    const queueIds: QuestionId[] = topic.questions
      .map((q) => q.id)
      .filter((id) => !isUnanswerable(id));
    const shuffled = seededShuffle(queueIds, Date.now());
    startPracticeSession({ topicId, queue: shuffled, mode: "practice" });
    setStickyWrong([]);
    // session intentionally excluded — restarting on each session mutation would loop forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, topic, topicId, startPracticeSession, isUnanswerable]);

  if (!user) return null;
  if (!bank || !topic) {
    return (
      <main className="min-h-screen bg-white px-4 py-6">
        <PageHeader backTo="/home" title="תרגול" />
        <p className="text-muted">טוען...</p>
      </main>
    );
  }
  if (!session || session.mode === "exam") return null;

  if (session.index >= session.queue.length) {
    navigate(`/practice/${encodeURIComponent(topicId)}/results`, { replace: true });
    return null;
  }

  const currentId = session.queue[session.index];
  const question = getQuestion(currentId);
  if (!question) return <p className="p-6 text-danger-600">שאלה לא נמצאה.</p>;

  const triesUsed = session.currentAttempts;

  function handlePick(letter: OptionLetter) {
    if (!question || !session || session.mode === "exam") return;
    const correct = letter === question.correct_letter;
    if (!correct) {
      setStickyWrong((prev) => (prev.includes(letter) ? prev : [...prev, letter]));
    }
    const attemptIndex = session.currentAttempts as 0 | 1 | 2;
    const outcome = attemptAnswer(correct);
    if (outcome === "first-correct") setStarKey((k) => k + 1);
    if (user && topic) {
      recordAnswer({
        userId: user.id,
        questionId: currentId,
        topicId,
        totalQuestionsInTopic: topic.question_count,
        correct,
        attemptIndex,
        pickedLetter: letter,
      });
    }
  }

  function handleNext() {
    setStickyWrong([]);
    next();
  }

  const hint = hintForLevel(question.explanation, session.hintLevel);
  const showExplanation = session.revealed;

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          backTo="/home"
          title={topic.name_he}
          rightSlot={
            <span className="text-sm text-faint tabular-nums">
              {session.index + 1} / {session.queue.length}
            </span>
          }
        />
        <QuestionCard
          question={question}
          used={triesUsed}
          image={getImage(currentId)}
          needsImage={needsImage(currentId)}
        />
        <OptionGrid
          question={question}
          stickyWrong={stickyWrong}
          revealed={session.revealed}
          onPick={handlePick}
        />
        {hint && !showExplanation && <HintCard text={hint} />}
        {showExplanation && (
          <ExplanationCard
            correctAnswer={question.correct_answer}
            explanation={question.explanation}
          />
        )}
        {showExplanation && (
          <div className="mt-5 flex justify-end">
            <button className="btn-primary" onClick={handleNext}>
              הבאה ←
            </button>
          </div>
        )}
        <StarBurst triggerKey={starKey} />
      </div>
    </main>
  );
}
