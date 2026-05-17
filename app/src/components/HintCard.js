import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Lightbulb } from "lucide-react";
export function HintCard({ text }) {
    if (!text)
        return null;
    return (_jsxs("div", { className: "mt-4 rounded-2xl bg-warn-50 border border-warn-200 p-4 flex gap-3 text-warn-700", children: [_jsx(Lightbulb, { size: 20, className: "shrink-0 mt-0.5" }), _jsx("p", { className: "leading-relaxed", children: text })] }));
}
export function hintForLevel(explanation, level) {
    if (level <= 0 || !explanation)
        return "";
    const sentences = explanation
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
    if (sentences.length === 0)
        return level >= 3 ? explanation : "";
    if (level === 1)
        return sentences.slice(0, 1).join(" ");
    if (level === 2)
        return sentences
            .slice(0, Math.max(2, Math.ceil(sentences.length / 2)))
            .join(" ");
    return explanation;
}
