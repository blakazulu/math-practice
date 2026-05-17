import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { OptionGrid } from "@/components/OptionGrid";
import { HintCard, hintForLevel } from "@/components/HintCard";
import { ExplanationCard } from "@/components/ExplanationCard";
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
    const navigate = useNavigate();
    const [stickyWrong, setStickyWrong] = useState([]);
    useEffect(() => {
        if (!user) {
            navigate("/welcome", { replace: true });
            return;
        }
        if (user.progress.reviewQueue.length === 0) {
            navigate("/home", { replace: true });
            return;
        }
        if (session && session.mode === "review")
            return;
        startPracticeSession({
            topicId: "review",
            queue: [...user.progress.reviewQueue],
            mode: "review",
        });
        setStickyWrong([]);
    }, [user, session, startPracticeSession, navigate]);
    if (!user || !session || session.mode === "exam" || !bank)
        return null;
    if (session.index >= session.queue.length) {
        navigate("/home", { replace: true });
        return null;
    }
    const currentId = session.queue[session.index];
    const q = getQuestion(currentId);
    if (!q)
        return null;
    function findTopicForQuestion(qid) {
        if (!bank)
            return null;
        for (const cat of bank.categories) {
            for (const t of cat.topics) {
                if (t.questions.some((x) => x.id === qid)) {
                    const dir = cat.id === "math-knowledge"
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
    function handlePick(l) {
        if (!q || !session || session.mode === "exam")
            return;
        const correct = l === q.correct_letter;
        if (!correct)
            setStickyWrong((p) => (p.includes(l) ? p : [...p, l]));
        const attemptIndex = session.currentAttempts;
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
    return (_jsx("main", { className: "min-h-screen bg-white px-4 py-6", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx(PageHeader, { backTo: "/home", title: "\u05D7\u05D6\u05E8\u05D4", rightSlot: _jsxs("span", { className: "text-sm text-faint tabular-nums", children: [session.index + 1, " / ", session.queue.length] }) }), _jsx(QuestionCard, { question: q, used: session.currentAttempts, image: getImage(currentId), needsImage: needsImage(currentId) }), _jsx(OptionGrid, { question: q, stickyWrong: stickyWrong, revealed: session.revealed, onPick: handlePick }), hint && !showExplanation && _jsx(HintCard, { text: hint }), showExplanation && (_jsx(ExplanationCard, { correctAnswer: q.correct_answer, explanation: q.explanation })), showExplanation && (_jsx("div", { className: "mt-5 flex justify-end", children: _jsx("button", { className: "btn-primary", onClick: handleNext, children: "\u05D4\u05D1\u05D0\u05D4 \u2190" }) }))] }) }));
}
