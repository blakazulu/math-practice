import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Flag, X } from "lucide-react";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { OptionGrid } from "@/components/OptionGrid";
import { ExamGrid } from "@/components/ExamGrid";
import { ExamTimer } from "@/components/ExamTimer";
import { Confirm } from "@/components/Confirm";
export function ExamPage() {
    const params = useParams();
    const examIdParam = decodeURIComponent(params.examId ?? "");
    const navigate = useNavigate();
    const user = useStore(selectActiveUser);
    const session = useStore((s) => s.session);
    const examPick = useStore((s) => s.examPick);
    const examFlag = useStore((s) => s.examFlag);
    const examJumpTo = useStore((s) => s.examJumpTo);
    const examTick = useStore((s) => s.examTick);
    const examFinish = useStore((s) => s.examFinish);
    const getQuestion = useStore((s) => s.getQuestion);
    const recordAnswer = useStore((s) => s.recordAnswer);
    const enqueueReview = useStore((s) => s.enqueueReview);
    const needsImage = useStore((s) => s.needsImage);
    const getImage = useStore((s) => s.getImage);
    const bank = useStore((s) => s.bank);
    const [confirmEnd, setConfirmEnd] = useState(false);
    const finalize = useCallback(() => {
        const s = useStore.getState().session;
        if (!s || s.mode !== "exam" || !user || !bank)
            return;
        const cat = bank.categories.find((c) => c.id === "sample-exams");
        const topic = cat?.topics.find((t) => `03_מבחנים_לדוגמה/${t.id}` === s.examId);
        if (!cat || !topic)
            return;
        let score = 0;
        const answers = {};
        for (const qid of s.queue) {
            const q = getQuestion(qid);
            const p = s.picks[qid] ?? null;
            const correct = !!q && p === q.correct_letter;
            if (correct)
                score++;
            answers[qid] = { picked: p, correct, flagged: s.flagged[qid] ?? false };
            recordAnswer({
                userId: user.id,
                questionId: qid,
                topicId: s.examId,
                totalQuestionsInTopic: s.queue.length,
                correct,
                attemptIndex: 0,
                pickedLetter: p,
            });
            if (!correct)
                enqueueReview(user.id, qid);
        }
        useStore.setState((state) => {
            const u = state.users[user.id];
            if (!u)
                return state;
            const updated = {
                ...u,
                progress: {
                    ...u.progress,
                    exams: [
                        ...u.progress.exams,
                        {
                            examId: s.examId,
                            takenAt: Date.now(),
                            durationSec: s.durationSec - s.remainingSec,
                            timerEnabled: s.timerEnabled,
                            score,
                            total: s.queue.length,
                            answers,
                        },
                    ],
                },
            };
            return { users: { ...state.users, [user.id]: updated } };
        });
        navigate(`/exam/${encodeURIComponent(s.examId)}/results`, { replace: true });
    }, [user, bank, getQuestion, recordAnswer, enqueueReview, navigate]);
    useEffect(() => {
        if (!session || session.mode !== "exam")
            return;
        if (session.ended)
            finalize();
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
    if (!question || !bank)
        return null;
    const picked = session.picks[currentId] ?? null;
    const flagged = session.flagged[currentId] ?? false;
    function handlePick(l) {
        examPick(currentId, picked === l ? null : l);
    }
    // Suppress unused warning for examIdParam — useful for hard-refresh validation
    void examIdParam;
    return (_jsxs("main", { className: "min-h-screen bg-white px-4 py-6", children: [_jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsx(PageHeader, { title: "\u05DE\u05D1\u05D7\u05DF \u05DC\u05D3\u05D5\u05D2\u05DE\u05D4", rightSlot: _jsxs(_Fragment, { children: [_jsx(ExamTimer, { remainingSec: session.remainingSec, enabled: session.timerEnabled, onTick: examTick }), _jsxs("button", { onClick: () => setConfirmEnd(true), className: "btn-secondary !px-3 !py-1.5", children: [_jsx(X, { size: 16 }), "\u05E1\u05D9\u05D9\u05DD"] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-6", children: [_jsxs("section", { children: [_jsx(QuestionCard, { question: question, image: getImage(currentId), needsImage: needsImage(currentId), topRight: _jsxs("button", { onClick: () => examFlag(currentId, !flagged), className: `px-2 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 ${flagged ? "bg-warn-50 text-warn-700" : "text-faint"}`, "aria-pressed": flagged, children: [_jsx(Flag, { size: 14 }), " ", flagged ? "מסומנת" : "סמני לבדיקה"] }) }), _jsx(OptionGrid, { question: question, onPick: handlePick, picked: picked }), _jsxs("div", { className: "mt-5 flex justify-between", children: [_jsx("button", { onClick: () => examJumpTo(session.index - 1), disabled: session.index === 0, className: "btn-secondary disabled:opacity-50", children: "\u2192 \u05D4\u05E7\u05D5\u05D3\u05DE\u05EA" }), _jsx("button", { onClick: () => examJumpTo(session.index + 1), disabled: session.index >= session.queue.length - 1, className: "btn-primary disabled:opacity-50", children: "\u05D4\u05D1\u05D0\u05D4 \u2190" })] })] }), _jsxs("aside", { className: "lg:sticky lg:top-6 self-start", children: [_jsx("div", { className: "section-label mb-2", children: "\u05D3\u05E4\u05D3\u05D5\u05E3" }), _jsx(ExamGrid, { queue: session.queue, picks: session.picks, flagged: session.flagged, currentIndex: session.index, onJump: examJumpTo })] })] })] }), _jsx(Confirm, { open: confirmEnd, title: "\u05DC\u05E1\u05D9\u05D9\u05DD \u05D0\u05EA \u05D4\u05DE\u05D1\u05D7\u05DF?", body: `ענית על ${Object.values(session.picks).filter(Boolean).length} מתוך ${session.queue.length} שאלות.`, confirmLabel: "\u05E1\u05D9\u05D9\u05DD \u05D5\u05D4\u05E6\u05D2 \u05E6\u05D9\u05D5\u05DF", onConfirm: () => {
                    setConfirmEnd(false);
                    examFinish();
                }, onCancel: () => setConfirmEnd(false) })] }));
}
