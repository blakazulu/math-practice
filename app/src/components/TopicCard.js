import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
export function TopicCard({ to, name, attempted, mastered, total }) {
    const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return (_jsxs(Link, { to: to, className: "flex items-center gap-3 py-3 border-b border-hair last:border-b-0 focus-visible:ring-2 focus-visible:ring-brand-500 rounded", children: [_jsx("span", { className: "flex-1 font-medium text-ink", children: name }), _jsxs("span", { className: "text-sm text-faint tabular-nums", children: [attempted, "/", total] }), _jsx("span", { className: "w-16 h-1.5 rounded-full bg-hair overflow-hidden", children: _jsx("span", { className: "block h-full bg-brand-500", style: { width: `${pct}%` } }) })] }));
}
