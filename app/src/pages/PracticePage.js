import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { topicIdFor } from "@/data/types";
export function PracticePage() {
    const params = useParams();
    const topicId = decodeURIComponent(params.topicId ?? "");
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
    const isVisualOnly = useStore((s) => s.isVisualOnly);
    const [stickyWrong, setStickyWrong] = useState([]);
    const [starKey, setStarKey] = useState(0);
    useEffect(() => {
        loadBank();
    }, [loadBank]);
    const topic = useMemo(() => {
        if (!bank)
            return null;
        for (const cat of bank.categories) {
            for (const t of cat.topics) {
                if (topicIdFor(cat.id, t.id) === topicId)
                    return t;
            }
        }
        return null;
    }, [bank, topicId]);
    useEffect(() => {
        if (!user || !topic)
            return;
        if (session && session.mode !== "exam" && session.topicId === topicId)
            return;
        const queueIds = topic.questions
            .map((q) => q.id)
            .filter((id) => !isVisualOnly(id));
        const shuffled = seededShuffle(queueIds, Date.now());
        startPracticeSession({ topicId, queue: shuffled, mode: "practice" });
        setStickyWrong([]);
    }, [user, topic, topicId, session, startPracticeSession, isVisualOnly]);
    if (!user)
        return null;
    if (!bank || !topic) {
        return (_jsxs("main", { className: "min-h-screen bg-white px-4 py-6", children: [_jsx(PageHeader, { backTo: "/home", title: "\u05EA\u05E8\u05D2\u05D5\u05DC" }), _jsx("p", { className: "text-muted", children: "\u05D8\u05D5\u05E2\u05DF..." })] }));
    }
    if (!session || session.mode === "exam")
        return null;
    if (session.index >= session.queue.length) {
        navigate(`/practice/${encodeURIComponent(topicId)}/results`, { replace: true });
        return null;
    }
    const currentId = session.queue[session.index];
    const question = getQuestion(currentId);
    if (!question)
        return _jsx("p", { className: "p-6 text-danger-600", children: "\u05E9\u05D0\u05DC\u05D4 \u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0\u05D4." });
    const triesUsed = session.currentAttempts;
    function handlePick(letter) {
        if (!question || !session || session.mode === "exam")
            return;
        const correct = letter === question.correct_letter;
        if (!correct) {
            setStickyWrong((prev) => (prev.includes(letter) ? prev : [...prev, letter]));
        }
        const attemptIndex = session.currentAttempts;
        const outcome = attemptAnswer(correct);
        if (outcome === "first-correct")
            setStarKey((k) => k + 1);
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
    return (_jsx("main", { className: "min-h-screen bg-white px-4 py-6", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx(PageHeader, { backTo: "/home", title: topic.name_he, rightSlot: _jsxs("span", { className: "text-sm text-faint tabular-nums", children: [session.index + 1, " / ", session.queue.length] }) }), _jsx(QuestionCard, { question: question, used: triesUsed, image: getImage(currentId), needsImage: needsImage(currentId) }), _jsx(OptionGrid, { question: question, stickyWrong: stickyWrong, revealed: session.revealed, onPick: handlePick }), hint && !showExplanation && _jsx(HintCard, { text: hint }), showExplanation && (_jsx(ExplanationCard, { correctAnswer: question.correct_answer, explanation: question.explanation })), showExplanation && (_jsx("div", { className: "mt-5 flex justify-end", children: _jsx("button", { className: "btn-primary", onClick: handleNext, children: "\u05D4\u05D1\u05D0\u05D4 \u2190" }) })), _jsx(StarBurst, { triggerKey: starKey })] }) }));
}
