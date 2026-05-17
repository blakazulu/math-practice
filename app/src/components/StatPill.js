import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Star, Flame } from "lucide-react";
const styles = {
    star: { bg: "bg-warn-50", fg: "text-warn-700", icon: _jsx(Star, { size: 14 }), label: "כוכבים" },
    streak: { bg: "bg-danger-50", fg: "text-danger-600", icon: _jsx(Flame, { size: 14 }), label: "רצף" },
    today: { bg: "bg-brand-50", fg: "text-brand-700", icon: null, label: "היום" },
};
export function StatPill({ variant, value }) {
    const s = styles[variant];
    return (_jsxs("span", { className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${s.bg} ${s.fg}`, children: [s.icon, _jsx("span", { className: "tabular-nums", children: value }), _jsx("span", { className: "text-xs opacity-80", children: s.label })] }));
}
