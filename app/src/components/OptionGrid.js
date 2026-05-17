import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { InlineMath } from "@/lib/katex";
export function OptionGrid({ question, picked, revealed, stickyWrong = [], onPick, disabled, }) {
    const [shake, setShake] = useState(null);
    const letters = ["א", "ב", "ג", "ד"].filter((l) => question.options[l] !== undefined);
    const correctLetter = question.correct_letter;
    function statusFor(l) {
        if (revealed) {
            if (correctLetter === l)
                return "revealed-correct";
            if (stickyWrong.includes(l))
                return "wrong";
            return "revealed-other";
        }
        if (stickyWrong.includes(l))
            return "wrong";
        if (picked === l)
            return "picked";
        return "neutral";
    }
    function handleClick(l) {
        if (disabled || revealed || !onPick)
            return;
        if (correctLetter && l !== correctLetter && !stickyWrong.includes(l)) {
            setShake(l);
            window.setTimeout(() => setShake(null), 400);
        }
        onPick(l);
    }
    return (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4", children: letters.map((l) => {
            const s = statusFor(l);
            const styles = s === "revealed-correct"
                ? "bg-brand-50 border-brand-500 ring-2 ring-brand-500"
                : s === "wrong"
                    ? "bg-danger-50 border-danger-200 text-danger-600"
                    : s === "picked"
                        ? "bg-brand-50 border-brand-500"
                        : s === "revealed-other"
                            ? "opacity-60"
                            : "hover:bg-surface";
            const isShaking = shake === l;
            return (_jsxs("button", { disabled: disabled || revealed, onClick: () => handleClick(l), className: `card p-4 text-right flex items-start gap-3 transition-colors ${styles} ${isShaking ? "animate-shake" : ""} focus-visible:ring-2 focus-visible:ring-brand-500`, children: [_jsx("span", { className: `shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold ${s === "revealed-correct"
                            ? "bg-brand-500 text-white"
                            : s === "wrong"
                                ? "bg-danger-600 text-white"
                                : s === "picked"
                                    ? "bg-brand-500 text-white"
                                    : "bg-hair text-ink"}`, children: s === "revealed-correct" || s === "picked" ? (_jsx(Check, { size: 16 })) : s === "wrong" ? (_jsx(X, { size: 16 })) : (l) }), _jsx("span", { className: "flex-1 leading-relaxed", children: _jsx(InlineMath, { text: question.options[l] ?? "" }) })] }, l));
        }) }));
}
