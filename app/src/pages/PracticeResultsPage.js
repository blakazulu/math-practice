import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
export function PracticeResultsPage() {
    const params = useParams();
    const topicId = decodeURIComponent(params.topicId ?? "");
    const session = useStore((s) => s.session);
    const endSession = useStore((s) => s.endSession);
    const r = session && session.mode !== "exam"
        ? session.results
        : {
            answered: 0,
            firstTryCorrect: 0,
            secondTryCorrect: 0,
            thirdTryCorrect: 0,
            failed: 0,
        };
    return (_jsx("main", { className: "min-h-screen bg-white px-4 py-8", children: _jsxs("div", { className: "max-w-md mx-auto text-center", children: [_jsx(PageHeader, { backTo: "/home", title: "\u05E1\u05D9\u05DB\u05D5\u05DD \u05EA\u05E8\u05D2\u05D5\u05DC" }), _jsxs("div", { className: "card p-6 mb-6", children: [_jsx("div", { className: "text-faint section-label mb-2", children: "\u05E1\u05D9\u05D9\u05DE\u05EA \u05D0\u05EA \u05D4\u05DE\u05E4\u05D2\u05E9" }), _jsxs("div", { className: "flex items-center justify-center gap-2 mb-4", children: [_jsx(Star, { size: 28, className: "text-warn-700" }), _jsx("span", { className: "text-4xl font-black tabular-nums", children: r.firstTryCorrect }), _jsx("span", { className: "text-muted", children: "\u05DB\u05D5\u05DB\u05D1\u05D9\u05DD \u05DE\u05E4\u05D2\u05E9 \u05D6\u05D4" })] }), _jsxs("ul", { className: "text-right space-y-1 text-ink", children: [_jsxs("li", { children: ["\u05E0\u05DB\u05D5\u05DF \u05D1\u05E0\u05D9\u05E1\u05D9\u05D5\u05DF \u05E8\u05D0\u05E9\u05D5\u05DF: ", _jsx("b", { className: "tabular-nums", children: r.firstTryCorrect })] }), _jsxs("li", { children: ["\u05E0\u05DB\u05D5\u05DF \u05D1\u05E0\u05D9\u05E1\u05D9\u05D5\u05DF \u05E9\u05E0\u05D9: ", _jsx("b", { className: "tabular-nums", children: r.secondTryCorrect })] }), _jsxs("li", { children: ["\u05E0\u05DB\u05D5\u05DF \u05D1\u05E0\u05D9\u05E1\u05D9\u05D5\u05DF \u05E9\u05DC\u05D9\u05E9\u05D9: ", _jsx("b", { className: "tabular-nums", children: r.thirdTryCorrect })] }), _jsxs("li", { children: ["\u05E0\u05DB\u05E9\u05DC (\u05D4\u05EA\u05D5\u05D5\u05E1\u05E3 \u05DC\u05D7\u05D6\u05E8\u05D4): ", _jsx("b", { className: "tabular-nums", children: r.failed })] })] })] }), _jsxs("div", { className: "flex gap-2 justify-center", children: [_jsx(Link, { to: "/home", onClick: endSession, className: "btn-secondary", children: "\u05DC\u05D3\u05E3 \u05D4\u05D1\u05D9\u05EA" }), _jsx(Link, { to: `/practice/${encodeURIComponent(topicId)}`, onClick: endSession, className: "btn-primary", children: "\u05DE\u05E4\u05D2\u05E9 \u05E0\u05D5\u05E1\u05E3" })] })] }) }));
}
