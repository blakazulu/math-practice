import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Trophy } from "lucide-react";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { ExplanationCard } from "@/components/ExplanationCard";
export function ExamResultsPage() {
    const params = useParams();
    const examId = decodeURIComponent(params.examId ?? "");
    const user = useStore(selectActiveUser);
    const getQuestion = useStore((s) => s.getQuestion);
    const attempt = useMemo(() => {
        if (!user)
            return null;
        return [...user.progress.exams].filter((a) => a.examId === examId).pop() ?? null;
    }, [user, examId]);
    if (!user)
        return null;
    if (!attempt) {
        return (_jsxs("main", { className: "min-h-screen bg-white px-4 py-6", children: [_jsx(PageHeader, { backTo: "/exam", title: "\u05EA\u05D5\u05E6\u05D0\u05D5\u05EA \u05DE\u05D1\u05D7\u05DF" }), _jsx("p", { className: "text-muted", children: "\u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0 \u05E0\u05D9\u05E1\u05D9\u05D5\u05DF." })] }));
    }
    const pct = Math.round((attempt.score / attempt.total) * 100);
    const mm = Math.floor(attempt.durationSec / 60);
    const ss = attempt.durationSec % 60;
    return (_jsx("main", { className: "min-h-screen bg-white px-4 py-6", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx(PageHeader, { backTo: "/home", title: "\u05EA\u05D5\u05E6\u05D0\u05D5\u05EA \u05DE\u05D1\u05D7\u05DF" }), _jsxs("section", { className: "card p-6 mb-6 text-center", children: [_jsx(Trophy, { size: 36, className: "text-brand-500 mx-auto mb-2" }), _jsxs("div", { className: "text-5xl font-black tabular-nums", children: [attempt.score, "/", attempt.total] }), _jsxs("div", { className: "text-muted mt-1", children: [pct, "% \u05E0\u05DB\u05D5\u05DF"] }), _jsxs("div", { className: "text-sm text-faint mt-3 tabular-nums", children: ["\u05D6\u05DE\u05DF: ", mm, ":", String(ss).padStart(2, "0"), " \u05D3\u05E7\u05D5\u05EA"] })] }), _jsx("h2", { className: "section-label mb-3", children: "\u05E1\u05E7\u05D9\u05E8\u05EA \u05E9\u05D0\u05DC\u05D5\u05EA" }), Object.entries(attempt.answers).map(([qid, rec]) => {
                    const q = getQuestion(qid);
                    if (!q)
                        return null;
                    return (_jsxs("details", { className: "card p-4 mb-3 group", children: [_jsxs("summary", { className: "cursor-pointer flex items-center justify-between", children: [_jsxs("span", { className: "font-semibold", children: ["\u05E9\u05D0\u05DC\u05D4 ", q.number] }), _jsxs("span", { className: `text-sm font-bold ${rec.correct ? "text-brand-700" : "text-danger-600"}`, children: [rec.correct ? "נכון" : "שגוי", rec.picked && ` (בחרת: ${rec.picked})`] })] }), _jsxs("div", { className: "mt-3", children: [_jsx(QuestionCard, { question: q }), _jsx(ExplanationCard, { correctAnswer: q.correct_answer, explanation: q.explanation })] })] }, qid));
                }), _jsxs("div", { className: "mt-6 flex gap-2 justify-end", children: [_jsx(Link, { to: "/home", className: "btn-secondary", children: "\u05DC\u05D3\u05E3 \u05D4\u05D1\u05D9\u05EA" }), _jsx(Link, { to: "/exam", className: "btn-primary", children: "\u05DE\u05D1\u05D7\u05DF \u05E0\u05D5\u05E1\u05E3" })] })] }) }));
}
