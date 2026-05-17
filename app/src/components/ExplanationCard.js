import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2 } from "lucide-react";
import { InlineMath } from "@/lib/katex";
export function ExplanationCard({ correctAnswer, explanation }) {
    return (_jsxs("div", { className: "mt-4 rounded-2xl bg-brand-50 border border-brand-200 p-4", children: [_jsxs("div", { className: "flex gap-2 items-center text-brand-700 font-bold mb-2", children: [_jsx(CheckCircle2, { size: 18 }), _jsx("span", { children: "\u05EA\u05E9\u05D5\u05D1\u05D4 \u05E0\u05DB\u05D5\u05E0\u05D4: " }), _jsx("span", { className: "text-ink", children: _jsx(InlineMath, { text: correctAnswer }) })] }), explanation && (_jsx("p", { className: "text-ink/90 leading-relaxed", children: _jsx(InlineMath, { text: explanation }) }))] }));
}
