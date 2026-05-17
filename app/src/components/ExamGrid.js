import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Flag } from "lucide-react";
export function ExamGrid({ queue, picks, flagged, currentIndex, onJump }) {
    return (_jsx("ol", { className: "grid grid-cols-6 gap-1.5", children: queue.map((id, i) => {
            const answered = picks[id] !== null;
            const isCurrent = i === currentIndex;
            const isFlag = flagged[id];
            return (_jsx("li", { children: _jsxs("button", { onClick: () => onJump(i), "aria-current": isCurrent ? "step" : undefined, "aria-label": `שאלה ${i + 1}${answered ? ", נענתה" : ""}${isFlag ? ", מסומנת" : ""}`, className: `relative w-full aspect-square rounded-lg border text-sm font-bold tabular-nums focus-visible:ring-2 focus-visible:ring-brand-500 ${isCurrent
                        ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500"
                        : answered
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-border bg-surface text-muted"}`, children: [i + 1, isFlag && (_jsx(Flag, { size: 10, className: "absolute top-0.5 left-0.5 text-warn-700" }))] }) }, id));
        }) }));
}
