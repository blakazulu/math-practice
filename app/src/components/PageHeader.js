import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Logo } from "./Logo";
export function PageHeader({ backTo, title, rightSlot }) {
    return (_jsxs("header", { className: "flex items-center justify-between gap-3 mb-6", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [backTo ? (_jsx(Link, { to: backTo, className: "rounded-full p-2 hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500", "aria-label": "\u05D7\u05D6\u05E8\u05D4", children: _jsx(ChevronRight, { size: 20 }) })) : (_jsx(Logo, {})), title && _jsx("h1", { className: "text-lg font-bold truncate", children: title })] }), rightSlot && _jsx("div", { className: "flex items-center gap-2 shrink-0", children: rightSlot })] }));
}
