import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const isVisualOnly = useStore((s) => s.isVisualOnly);
    const [timerEnabled, setTimerEnabled] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        loadBank();
    }, [loadBank]);
    const exams = useMemo(() => {
        if (!bank)
            return [];
        const cat = bank.categories.find((c) => c.id === "sample-exams");
        return cat
            ? cat.topics.map((t) => ({
                id: t.id,
                name: t.name_he,
                full: topicIdFor(cat.id, t.id),
            }))
            : [];
    }, [bank]);
    function start(examFullId) {
        if (!bank || !user)
            return;
        const cat = bank.categories.find((c) => c.id === "sample-exams");
        const topic = cat.topics.find((t) => topicIdFor(cat.id, t.id) === examFullId);
        if (!topic)
            return;
        const queue = topic.questions.map((q) => q.id).filter((id) => !isVisualOnly(id));
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
    return (_jsx("main", { className: "min-h-screen bg-white px-4 py-6", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx(PageHeader, { backTo: "/home", title: "\u05DE\u05D1\u05D7\u05DF \u05DC\u05D3\u05D5\u05D2\u05DE\u05D4" }), _jsx("p", { className: "text-muted mb-4", children: "7 \u05DE\u05D1\u05D7\u05E0\u05D9\u05DD \u05DE\u05DC\u05D0\u05D9\u05DD, \u05DB\u05DC \u05D0\u05D7\u05D3 ~24 \u05E9\u05D0\u05DC\u05D5\u05EA. \u05D1\u05D7\u05D9\u05E8\u05D4 \u05D0\u05D7\u05EA \u05DC\u05DB\u05DC \u05E9\u05D0\u05DC\u05D4. \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D3\u05E4\u05D3\u05E3 \u05DC\u05D0\u05D7\u05D5\u05E8." }), _jsxs("label", { className: "card flex items-center gap-3 p-3 mb-4", children: [_jsx("input", { type: "checkbox", checked: timerEnabled, onChange: (e) => setTimerEnabled(e.target.checked), className: "w-4 h-4 accent-brand-500" }), _jsx("span", { className: "text-sm", children: "\u05D4\u05E4\u05E2\u05DC\u05EA \u05E9\u05E2\u05D5\u05DF \u05E9\u05DC 60 \u05D3\u05E7\u05D5\u05EA (\u05DB\u05DE\u05D5 \u05D1\u05DE\u05D1\u05D7\u05DF \u05D4\u05D0\u05DE\u05D9\u05EA\u05D9)" })] }), exams.length === 0 && _jsx("p", { className: "text-muted", children: "\u05D8\u05D5\u05E2\u05DF..." }), _jsx("ul", { className: "card divide-y divide-hair", children: exams.map((e) => {
                        const lastAttempt = user.progress.exams
                            .filter((a) => a.examId === e.full)
                            .sort((a, b) => b.takenAt - a.takenAt)[0];
                        return (_jsxs("li", { className: "flex items-center gap-3 px-4 py-3", children: [_jsx(Calendar, { size: 18, className: "text-brand-600" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-semibold", children: e.name }), lastAttempt && (_jsxs("div", { className: "text-sm text-faint tabular-nums", children: ["\u05E0\u05D9\u05E1\u05D9\u05D5\u05DF \u05D0\u05D7\u05E8\u05D5\u05DF: ", lastAttempt.score, "/", lastAttempt.total] }))] }), _jsxs("button", { onClick: () => start(e.full), className: "btn-primary", children: [_jsx(Play, { size: 16 }), "\u05D4\u05EA\u05D7\u05DC"] })] }, e.id));
                    }) })] }) }));
}
