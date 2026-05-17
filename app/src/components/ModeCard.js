import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
export function ModeCard({ to, icon, title, subtitle, primary }) {
    const base = primary
        ? "bg-brand-500 text-white border-brand-600 shadow-cta active:shadow-cta-pressed active:translate-y-[2px]"
        : "bg-surface border-border";
    return (_jsxs(Link, { to: to, className: `card p-4 flex flex-col gap-2 transition-shadow ${base} focus-visible:ring-2 focus-visible:ring-brand-500`, children: [_jsx("span", { className: `w-10 h-10 rounded-xl grid place-items-center ${primary ? "bg-white/20" : "bg-brand-100 text-brand-600"}`, children: icon }), _jsx("span", { className: `text-lg font-bold ${primary ? "text-white" : "text-ink"}`, children: title }), _jsx("span", { className: `text-sm ${primary ? "text-white/85" : "text-muted"}`, children: subtitle })] }));
}
